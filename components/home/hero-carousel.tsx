'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/currency';
import type { HeroProductWithDetails } from '@/types/product';
import { normalizeHeroCarouselDesign } from '@/lib/hero-carousel-design';

interface HeroCarouselProps {
  products: HeroProductWithDetails[];
}

const AUTOPLAY_DELAY = 5000;

export function HeroCarousel({ products }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<1 | -1>(1);
  const shouldReduceMotion = useReducedMotion();
  // El servidor ya entrega exactamente los productos activos y ordenados.
  // No se recorta la colección en el navegador para que todos los dispositivos
  // muestren el mismo total de slides.
  const visibleProducts = products;

  const changeSlide = useCallback(
    (nextIndex: number, nextDirection: 1 | -1) => {
      if (visibleProducts.length <= 1) return;
      setDirection(nextDirection);
      setCurrentIndex((nextIndex + visibleProducts.length) % visibleProducts.length);
    },
    [visibleProducts.length]
  );

  const nextSlide = useCallback(() => {
    changeSlide(currentIndex + 1, 1);
  }, [changeSlide, currentIndex]);

  const prevSlide = useCallback(() => {
    changeSlide(currentIndex - 1, -1);
  }, [changeSlide, currentIndex]);

  const stopAutoplay = () => setIsAutoPlaying(false);

  useEffect(() => {
    if (!isAutoPlaying || shouldReduceMotion || visibleProducts.length <= 1) return;

    const interval = window.setInterval(nextSlide, AUTOPLAY_DELAY);
    return () => window.clearInterval(interval);
  }, [isAutoPlaying, nextSlide, shouldReduceMotion, visibleProducts.length]);

  useEffect(() => {
    if (currentIndex >= visibleProducts.length && visibleProducts.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, visibleProducts.length]);

  if (visibleProducts.length === 0) return null;

  const activeIndex = Math.min(currentIndex, visibleProducts.length - 1);
  const currentProduct = visibleProducts[activeIndex];
  const heroContent = currentProduct.heroContent;
  const design = normalizeHeroCarouselDesign(heroContent?.design);
  const displayBrand = heroContent?.brandText?.trim() || currentProduct.brand.name;
  const defaultBackgroundText =
    displayBrand.trim().toLowerCase() === 'polo' ? 'POLO CLUB' : displayBrand;
  const backgroundText = heroContent?.backgroundText?.trim() || defaultBackgroundText;
  const displayTitle = heroContent?.titleText?.trim() || currentProduct.name;
  const displayPrice = heroContent?.priceText?.trim() || formatPrice(currentProduct.lowestPrice);
  const primaryButtonText = heroContent?.primaryButtonText?.trim() || 'Comprar ahora';
  const secondaryButtonText = heroContent?.secondaryButtonText?.trim() || 'Ver detalles';
  const customBadge = heroContent?.badgeText?.trim();
  const mainImage = currentProduct.colors
    .flatMap((color) =>
      [...(color.images || [])].sort(
        (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
      )
    )
    .find((image) => Boolean(image.image_url))?.image_url;

  const imageMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 70, scale: 0.96 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: direction * -45, scale: 0.98 },
      };

  const textMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <section
      className="relative h-[620px] overflow-hidden text-white sm:h-[660px] lg:h-[min(720px,calc(100svh-8rem))] lg:min-h-[600px]"
      style={{ backgroundColor: design.leftBackground, color: design.textColor, fontFamily: design.fontFamily }}
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onFocusCapture={() => setIsAutoPlaying(false)}
    >
      <div className="absolute inset-x-0 top-0 h-[54%] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[54%] lg:[clip-path:polygon(13%_0,100%_0,100%_100%,0_100%)]" style={{ backgroundColor: design.rightBackground }} />
      <div className="absolute inset-x-0 top-[54%] h-px bg-white/10 lg:left-[48%] lg:top-0 lg:h-full lg:w-px lg:rotate-[6deg] lg:bg-white/15" />

      <div className="container relative z-10 mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="grid h-full grid-rows-[54%_46%] lg:grid-cols-[43%_57%] lg:grid-rows-1">
          <div className="relative row-start-2 flex min-w-0 flex-col justify-center pb-14 pt-5 sm:pb-16 sm:pt-7 lg:row-start-1 lg:justify-center lg:pb-24 lg:pr-8 lg:pt-10 xl:pr-14">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentProduct.id}
                {...textMotion}
                transition={{ duration: shouldReduceMotion ? 0.15 : 0.38, ease: 'easeOut' }}
                className="min-w-0"
                style={{ translate: `${design.contentX}px ${design.contentY}px` }}
              >
                {heroContent?.showBadge !== false && (
                  <div className="mb-2 flex min-h-5 flex-wrap items-center gap-2 sm:mb-3">
                    {customBadge ? (
                      <Badge className="border-0 text-white" style={{ backgroundColor: design.accentColor }}>{customBadge}</Badge>
                    ) : (
                      <>
                        {currentProduct.isNew && (
                          <Badge className="border-0 bg-white text-[#0b1024]">NUEVO</Badge>
                        )}
                        {currentProduct.hasDiscount && (
                          <Badge className="border-0 bg-brand-red text-white">
                            -{currentProduct.discountPercentage}%
                          </Badge>
                        )}
                        {currentProduct.isLowStock && (
                          <Badge className="border-0 bg-brand-orange text-white">
                            ÚLTIMAS UNIDADES
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                )}

                {heroContent?.showBrand !== false && (
                  <p className="mb-1 text-xs font-semibold uppercase sm:text-sm" style={{ color: design.mutedTextColor }}>
                    {displayBrand}
                  </p>
                )}
                {heroContent?.showTitle !== false && (
                  <h1 className="line-clamp-2 max-w-xl font-bold leading-[1.05]" style={{ fontSize: `clamp(1.5rem, 5vw, ${design.titleSize}px)` }}>
                    {displayTitle}
                  </h1>
                )}
                {heroContent?.showSubtitle !== false && heroContent?.subtitleText?.trim() && (
                  <p className="mt-2 line-clamp-2 max-w-lg text-sm leading-relaxed sm:mt-3 sm:text-base" style={{ color: design.mutedTextColor }}>
                    {heroContent.subtitleText.trim()}
                  </p>
                )}

                {heroContent?.showPrice !== false && (
                  <div className="mt-3 flex items-baseline gap-3 sm:mt-5">
                    <span className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                      {displayPrice}
                    </span>
                    {!heroContent?.priceText?.trim() && currentProduct.hasDiscount && currentProduct.compare_at_price && (
                      <span className="text-sm text-white/45 line-through sm:text-lg">
                        {formatPrice(currentProduct.compare_at_price)}
                      </span>
                    )}
                  </div>
                )}

                {(heroContent?.showPrimaryButton !== false || heroContent?.showSecondaryButton !== false) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-7 sm:gap-3">
                    {heroContent?.showPrimaryButton !== false && (
                      <Button
                        className="h-11 px-4 font-bold sm:h-12 sm:px-6"
                        style={{ backgroundColor: design.primaryButtonBackground, color: design.primaryButtonText }}
                        asChild
                      >
                        <Link href={`/producto/${currentProduct.slug}`}>
                          {primaryButtonText}
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    )}
                    {heroContent?.showSecondaryButton !== false && (
                      <Button
                        variant="outline"
                        className="h-11 bg-transparent px-4 font-semibold hover:bg-white/10 sm:h-12 sm:px-5"
                        style={{ borderColor: design.secondaryButtonBorder, color: design.textColor }}
                        asChild
                      >
                        <Link href={`/producto/${currentProduct.slug}`}>
                          <Eye aria-hidden="true" />
                          <span>{secondaryButtonText}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative row-start-1 min-w-0 lg:col-start-2 lg:row-start-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentProduct.id}-${backgroundText}`}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: shouldReduceMotion ? 0.1 : 0.18, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-x-0 top-[13%] z-10 text-center font-black uppercase leading-[0.85] sm:text-7xl lg:left-[8%] lg:top-[15%]"
                aria-hidden="true"
              >
                <span style={{ display: 'inline-block', color: design.backgroundTextColor, fontSize: `clamp(3rem, 8vw, ${design.backgroundTextSize}px)`, WebkitTextStroke: `2px ${design.backgroundTextStroke}`, paintOrder: 'stroke fill', transform: `translate(${design.backgroundTextX}px, ${design.backgroundTextY}px)` }}>{backgroundText}</span>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentProduct.id}-${mainImage}`}
                {...imageMotion}
                transition={{ duration: shouldReduceMotion ? 0.15 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-7 bottom-4 top-12 z-0 sm:inset-x-16 sm:bottom-6 sm:top-16 lg:inset-x-[8%] lg:bottom-[10%] lg:top-[16%]"
              >
                {mainImage ? (
                  <div
                    className="absolute inset-0"
                    style={{ transform: `translate(${design.imageX}px, ${design.imageY}px) scale(${design.imageScale / 100})` }}
                  >
                    <Image
                      src={mainImage}
                      alt={currentProduct.name}
                      fill
                      sizes="(max-width: 1023px) 90vw, 54vw"
                      className="object-contain [filter:drop-shadow(0_22px_18px_rgba(4,4,93,0.16))]"
                      priority={activeIndex === 0}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-medium text-[#0b1024]/50">
                    Imagen no disponible
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="absolute right-0 top-4 z-20 flex items-center gap-2 text-xs font-bold text-[#0b1024] sm:top-6 lg:right-2 lg:top-8">
              <span className="tabular-nums">{String(activeIndex + 1).padStart(2, '0')}</span>
              <span className="h-px w-7 bg-[#0b1024]/25" />
              <span className="text-[#0b1024]/45 tabular-nums">
                {String(visibleProducts.length).padStart(2, '0')}
              </span>
            </div>

            {visibleProducts.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between lg:left-[7%] lg:right-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 border border-[#0b1024]/15 bg-white/70 text-[#0b1024] shadow-sm backdrop-blur-sm hover:bg-white sm:h-12 sm:w-12"
                  onClick={() => {
                    prevSlide();
                    stopAutoplay();
                  }}
                  aria-label="Producto anterior"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 border border-[#0b1024]/15 bg-white/70 text-[#0b1024] shadow-sm backdrop-blur-sm hover:bg-white sm:h-12 sm:w-12"
                  onClick={() => {
                    nextSlide();
                    stopAutoplay();
                  }}
                  aria-label="Siguiente producto"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {visibleProducts.length > 1 && (
        <div className="absolute bottom-5 left-4 right-4 z-20 sm:bottom-6 sm:left-6 sm:right-6 lg:left-[max(2rem,calc((100vw-1280px)/2+2rem))] lg:right-auto lg:w-[36%]">
          <div className="flex gap-2" role="tablist" aria-label="Elegir producto destacado">
            {visibleProducts.map((product, index) => (
              <button
                key={product.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Ver ${product.name}`}
                onClick={() => {
                  changeSlide(index, index > activeIndex ? 1 : -1);
                  stopAutoplay();
                }}
                className="relative h-6 flex-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="block h-0.5 overflow-hidden bg-white/25">
                  {index === activeIndex && (
                    <motion.span
                      key={`${currentProduct.id}-${isAutoPlaying}`}
                      className="block h-full bg-white"
                      initial={{ width: isAutoPlaying && !shouldReduceMotion ? '0%' : '100%' }}
                      animate={{ width: '100%' }}
                      transition={{
                        duration: isAutoPlaying && !shouldReduceMotion ? AUTOPLAY_DELAY / 1000 : 0,
                        ease: 'linear',
                      }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Mostrando {currentProduct.name}, producto {activeIndex + 1} de {visibleProducts.length}
      </p>
    </section>
  );
}
