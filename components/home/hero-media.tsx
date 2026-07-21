'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeroVideo } from '@/components/home/hero-video';
import type { HomeContent } from '@/lib/home-content-defaults';

interface HeroMediaProps {
  hero: HomeContent['hero'];
}

export function HeroMedia({ hero }: HeroMediaProps) {
  const slides = hero.slides.length > 0 ? hero.slides : [];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (hero.mode !== 'slider' || slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [hero.mode, slides.length]);

  if (hero.mode !== 'slider' || slides.length === 0) {
    return (
      <>
        <HeroVideo
          desktopVideoSrc={hero.desktopVideoSrc}
          mobileVideoSrc={hero.mobileVideoSrc}
          fallbackImage={hero.fallbackImage}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="container mx-auto h-full px-4 relative z-10">
          <div className="flex h-full max-w-2xl flex-col justify-center">
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:mb-6 lg:text-6xl xl:text-7xl">
              {hero.titleLine1}
              <br />
              <span className="text-brand-blue">{hero.titleLine2}</span>
            </h1>
            <p className="mb-6 text-lg text-white/90 sm:mb-8 sm:text-xl lg:mb-10 lg:text-2xl">
              {hero.subtitle}
            </p>
            <Button
              size="lg"
              className="h-12 bg-brand-blue px-8 text-base font-bold text-white shadow-xl transition-all hover:bg-blue-600 hover:shadow-2xl sm:h-14 sm:px-10 lg:h-16 lg:px-12 lg:text-lg"
              asChild
            >
              <Link href={hero.buttonHref}>{hero.buttonLabel}</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const currentSlide = slides[activeSlide];
  const goToPrevious = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  const goToNext = () => setActiveSlide((current) => (current + 1) % slides.length);

  return (
    <>
      {slides.map((slide, index) => (
        <div
          key={`${slide.image}-${index}`}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            index === activeSlide ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden={index !== activeSlide}
        >
          <Image
            src={slide.mobileImage || slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover md:hidden"
          />
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="hidden object-cover md:block"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />

      <div className="container mx-auto h-full px-4 relative z-10">
        <div className="flex h-full max-w-2xl flex-col justify-center">
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:mb-6 lg:text-6xl xl:text-7xl">
            {currentSlide.titleLine1}
            <br />
            <span className="text-brand-blue">{currentSlide.titleLine2}</span>
          </h1>
          <p className="mb-6 text-lg text-white/90 sm:mb-8 sm:text-xl lg:mb-10 lg:text-2xl">
            {currentSlide.subtitle}
          </p>
          <Button
            size="lg"
            className="h-12 w-fit bg-brand-blue px-8 text-base font-bold text-white shadow-xl transition-all hover:bg-blue-600 hover:shadow-2xl sm:h-14 sm:px-10 lg:h-16 lg:px-12 lg:text-lg"
            asChild
          >
            <Link href={currentSlide.buttonHref}>{currentSlide.buttonLabel}</Link>
          </Button>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-black shadow-lg transition-colors hover:bg-white md:flex"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-black shadow-lg transition-colors hover:bg-white md:flex"
            aria-label="Slide siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={`${slide.image}-dot-${index}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/50'
                )}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
