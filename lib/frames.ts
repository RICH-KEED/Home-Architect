import { frameConfig } from "@/lib/frame-config";

export const FRAME_TOTAL = frameConfig.totalFrames;

export function getFrameSrc(frame: number): string {
  return `${frameConfig.frameFolder}/${String(frame).padStart(4, "0")}.${frameConfig.frameExtension}`;
}
