"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_TOTAL, getFrameSrc } from "@/lib/frames";
import type { FrameLoaderState } from "@/types/frames";

const INITIAL_BATCH = 24;
const PRELOAD_AHEAD = 90;
const PRELOAD_BEHIND = 36;
const KEEP_RADIUS = 150;
const MAX_PARALLEL_LOADS = 8;

const frameCache = new Map<number, HTMLImageElement>();
const pendingFrames = new Set<number>();

function isFrameNumber(frame: number, totalFrames: number) {
  return frame >= 1 && frame <= totalFrames;
}

function getInitialLoadedCount() {
  let loaded = 0;

  for (let frame = 1; frame <= INITIAL_BATCH; frame++) {
    if (frameCache.has(frame)) {
      loaded += 1;
    }
  }

  return loaded;
}

function isInitialBatchReady() {
  return getInitialLoadedCount() >= INITIAL_BATCH;
}

function getNearestFrame(frame: number) {
  if (frameCache.has(frame)) {
    return frameCache.get(frame) ?? null;
  }

  for (let offset = 1; offset <= KEEP_RADIUS; offset++) {
    const nextFrame = frame + offset;
    const previousFrame = frame - offset;

    if (frameCache.has(nextFrame)) {
      return frameCache.get(nextFrame) ?? null;
    }

    if (frameCache.has(previousFrame)) {
      return frameCache.get(previousFrame) ?? null;
    }
  }

  return frameCache.get(1) ?? null;
}

function loadImage(frame: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => {
      frameCache.set(frame, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Failed to load frame ${frame}`));
    image.src = getFrameSrc(frame);
  });
}

export function useFrameLoader(totalFrames = FRAME_TOTAL): FrameLoaderState {
  const targetFrameRef = useRef(1);
  const queueRef = useRef<number[]>([]);
  const activeLoadsRef = useRef(0);
  const [, forceRender] = useState(0);
  const [state, setState] = useState<FrameLoaderState>({
    getFrame: () => null,
    setTargetFrame: () => undefined,
    loaded: frameCache.size,
    progress: Math.min(getInitialLoadedCount() / INITIAL_BATCH, 1),
    status: isInitialBatchReady() ? "ready" : "idle",
    error: null,
  });

  const evictFarFrames = useCallback((centerFrame: number) => {
    for (const frame of frameCache.keys()) {
      if (frame !== 1 && Math.abs(frame - centerFrame) > KEEP_RADIUS) {
        frameCache.delete(frame);
      }
    }
  }, []);

  const pumpQueue = useCallback(() => {
    while (activeLoadsRef.current < MAX_PARALLEL_LOADS && queueRef.current.length > 0) {
      const frame = queueRef.current.shift();

      if (!frame || frameCache.has(frame) || pendingFrames.has(frame)) {
        continue;
      }

      pendingFrames.add(frame);
      activeLoadsRef.current += 1;

      void loadImage(frame)
        .then((image) => {
          frameCache.set(frame, image);
          evictFarFrames(targetFrameRef.current);
          setState((current) => ({
            ...current,
            loaded: frameCache.size,
            progress: Math.min(getInitialLoadedCount() / INITIAL_BATCH, 1),
            status: isInitialBatchReady() ? "ready" : current.status,
          }));
          forceRender((value) => value + 1);
        })
        .catch((error) => {
          setState((current) => ({
            ...current,
            status: isInitialBatchReady() ? current.status : "error",
            error: error instanceof Error ? error.message : "Failed to load frames",
          }));
        })
        .finally(() => {
          pendingFrames.delete(frame);
          activeLoadsRef.current -= 1;
          pumpQueue();
        });
    }
  }, [evictFarFrames]);

  const enqueueFrames = useCallback((frames: number[]) => {
    const queued = new Set(queueRef.current);

    for (const frame of frames) {
      if (!isFrameNumber(frame, totalFrames) || frameCache.has(frame) || pendingFrames.has(frame) || queued.has(frame)) {
        continue;
      }

      queueRef.current.push(frame);
      queued.add(frame);
    }

    pumpQueue();
  }, [pumpQueue, totalFrames]);

  const preloadAround = useCallback((frame: number) => {
    const frames: number[] = [];

    for (let current = frame; current <= Math.min(totalFrames, frame + PRELOAD_AHEAD); current++) {
      frames.push(current);
    }

    for (let current = frame - 1; current >= Math.max(1, frame - PRELOAD_BEHIND); current--) {
      frames.push(current);
    }

    enqueueFrames(frames);
  }, [enqueueFrames, totalFrames]);

  const getFrame = useCallback((frameIndex: number) => getNearestFrame(frameIndex + 1), []);

  const setTargetFrame = useCallback((frameIndex: number) => {
    const frame = frameIndex + 1;

    targetFrameRef.current = frame;
    preloadAround(frame);
    evictFarFrames(frame);
  }, [evictFarFrames, preloadAround]);

  useEffect(() => {
    setState((current) => ({ ...current, status: isInitialBatchReady() ? "ready" : "loading", error: null }));
    enqueueFrames(Array.from({ length: INITIAL_BATCH }, (_, index) => index + 1));
  }, [enqueueFrames]);

  return { ...state, getFrame, setTargetFrame };
}
