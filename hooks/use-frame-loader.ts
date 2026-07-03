"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_TOTAL, getFrameSrc } from "@/lib/frames";
import type { FrameLoaderState } from "@/types/frames";

const CONCURRENCY = 24; // Optimal concurrency for HTTP/2 multiplexing
const MAX_RETRIES = 3;

// Global frame cache to keep preloaded images in memory across re-renders/mounts
const frameCache = new Map<number, HTMLImageElement>();

export function useFrameLoader(totalFrames = FRAME_TOTAL): FrameLoaderState {
  const [loadedCount, setLoadedCount] = useState(frameCache.size);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    frameCache.size === totalFrames ? "ready" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const activeLoadsRef = useRef(0);
  const queueRef = useRef<number[]>([]);
  const startedRef = useRef(false);

  // Return the closest loaded frame outward if the requested frame failed or isn't loaded yet
  const getFrame = useCallback((frameIndex: number) => {
    const frame = frameIndex + 1;
    if (frameCache.has(frame)) {
      return frameCache.get(frame) ?? null;
    }
    
    // Search outward for the nearest available frame
    const maxSearch = 60;
    for (let offset = 1; offset <= maxSearch; offset++) {
      const nextFrame = frame + offset;
      const prevFrame = frame - offset;
      if (frameCache.has(nextFrame)) return frameCache.get(nextFrame) ?? null;
      if (frameCache.has(prevFrame)) return frameCache.get(prevFrame) ?? null;
    }
    
    return frameCache.get(1) || null;
  }, []);

  const setTargetFrame = useCallback((_frameIndex: number) => {
    // No-op. Preloading is fully completed upfront.
  }, []);

  const progress = totalFrames > 0 ? loadedCount / totalFrames : 0;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (frameCache.size === totalFrames) {
      setStatus("ready");
      setLoadedCount(totalFrames);
      return;
    }

    setStatus("loading");

    // Populate queue with only the frames that haven't been loaded yet
    const framesToLoad: number[] = [];
    for (let f = 1; f <= totalFrames; f++) {
      if (!frameCache.has(f)) {
        framesToLoad.push(f);
      }
    }

    queueRef.current = framesToLoad;

    let aborted = false;

    const loadImageWithRetry = (frame: number, retriesLeft = MAX_RETRIES): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";

        img.onload = () => {
          if (aborted) return;
          
          if (typeof img.decode === "function") {
            img.decode()
              .then(() => {
                if (aborted) return;
                frameCache.set(frame, img);
                resolve(img);
              })
              .catch((err) => {
                // If decoding fails, we still cache the image element so it can be drawn on canvas
                // (it is still in browser cache and will decode on draw)
                frameCache.set(frame, img);
                resolve(img);
              });
          } else {
            frameCache.set(frame, img);
            resolve(img);
          }
        };

        img.onerror = () => {
          if (aborted) return;
          if (retriesLeft > 0) {
            setTimeout(() => {
              if (aborted) return;
              loadImageWithRetry(frame, retriesLeft - 1).then(resolve, reject);
            }, 200);
          } else {
            reject(new Error(`Failed to load frame ${frame}`));
          }
        };

        img.src = getFrameSrc(frame);
      });
    };

    const processQueue = () => {
      if (aborted) return;

      // When the queue is fully drained and active loads complete, transition to ready
      if (queueRef.current.length === 0 && activeLoadsRef.current === 0) {
        setStatus("ready");
        setLoadedCount(frameCache.size);
        return;
      }

      while (activeLoadsRef.current < CONCURRENCY && queueRef.current.length > 0) {
        const frame = queueRef.current.shift();
        if (frame === undefined) break;

        activeLoadsRef.current++;

        loadImageWithRetry(frame)
          .then(() => {
            if (aborted) return;
            setLoadedCount(frameCache.size);
          })
          .catch((err) => {
            if (aborted) return;
            // Robust error handling: print warning but do not crash the load queue.
            // We still proceed and will fallback to the closest frame when rendering.
            console.warn(`Frame loader warning (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
            // We increment loaded count to keep the progress bar moving even if a frame is missing
            setLoadedCount((prev) => Math.min(prev + 1, totalFrames));
          })
          .finally(() => {
            if (aborted) return;
            activeLoadsRef.current--;
            processQueue();
          });
      }
    };

    processQueue();

    return () => {
      aborted = true;
    };
  }, [totalFrames]);

  return {
    getFrame,
    setTargetFrame,
    loaded: loadedCount,
    progress,
    status,
    error,
  };
}

