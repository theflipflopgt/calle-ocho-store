'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface HeroVideoProps {
  desktopVideoSrc: string;
  mobileVideoSrc: string;
  fallbackImage: string;
}

/**
 * Componente de video hero con soporte para videos separados para móvil y desktop
 * - Desktop: video horizontal (video.mp4)
 * - Mobile: video vertical (video-v.mp4)
 * - Velocidad de reproducción: 80% (0.8x)
 */
export function HeroVideo({ desktopVideoSrc, mobileVideoSrc, fallbackImage }: HeroVideoProps) {
  const [videoError, setVideoError] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Establecer velocidad de reproducción al 80%
    if (mobileVideoRef.current) {
      mobileVideoRef.current.playbackRate = 0.8;
    }
    if (desktopVideoRef.current) {
      desktopVideoRef.current.playbackRate = 0.8;
    }
  }, []);

  if (videoError) {
    // Fallback a imagen si el video falla
    return (
      <Image
        src={fallbackImage}
        alt="Hero sneakers"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
    );
  }

  return (
    <>
      {/* Video para móvil (vertical) */}
      <video
        ref={mobileVideoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70 md:hidden"
        onError={() => setVideoError(true)}
      >
        <source src={mobileVideoSrc} type="video/mp4" />
      </video>

      {/* Video para desktop (horizontal) */}
      <video
        ref={desktopVideoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70 hidden md:block"
        onError={() => setVideoError(true)}
      >
        <source src={desktopVideoSrc} type="video/mp4" />
      </video>
    </>
  );
}
