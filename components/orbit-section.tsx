"use client";

import { useEffect, useRef } from "react";

export function OrbitSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.currentTime = 0;
          void video.play().catch(() => undefined);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="reveal" className="relative min-h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="h-screen w-full object-cover"
        src="/videos/orbit.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-label="Final luxury villa orbit video"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      <div className="pointer-events-none absolute bottom-16 left-6 max-w-xl md:left-20 md:bottom-24">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-white/50">Hero Orbit</p>
        <h2 className="text-5xl font-semibold leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">The final reveal.</h2>
      </div>
    </section>
  );
}
