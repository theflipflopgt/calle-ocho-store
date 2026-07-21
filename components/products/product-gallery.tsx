'use client';

import { useState, useRef, useCallback, TouchEvent } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductColorImage } from '@/types/product';

interface ProductGalleryProps {
  images: ProductColorImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const sortedImages = [...images].sort((a, b) =>
    (a.display_order || 0) - (b.display_order || 0)
  );

  const currentImage = sortedImages[selectedIndex];

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  }, [sortedImages.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  }, [sortedImages.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        handleNext(); // Swipe left -> next
      } else {
        handlePrev(); // Swipe right -> prev
      }
    }
  };

  // Desktop only zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        Sin imágenes
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
      {/* Thumbnails - horizontal scroll on mobile, vertical on desktop */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-2 md:pb-0 scrollbar-hide">
        {sortedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all touch-manipulation",
              index === selectedIndex
                ? "border-brand-black"
                : "border-transparent"
            )}
          >
            <Image
              src={image.image_url}
              alt={image.alt_text || `${productName} - ${index + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="flex-1 relative">
        <div
          className={cn(
            "relative aspect-square bg-gray-100 rounded-lg overflow-hidden",
            "md:cursor-zoom-in",
            isZoomed && "md:cursor-zoom-out"
          )}
          // Desktop zoom handlers
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          // Mobile swipe handlers
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={currentImage.image_url}
            alt={currentImage.alt_text || productName}
            fill
            className={cn(
              "object-cover transition-transform duration-200",
              "md:group-hover:scale-100", // Reset on mobile
              isZoomed && "md:scale-150" // Only zoom on desktop
            )}
            style={isZoomed ? {
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            } : undefined}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Image type badge */}
          {currentImage.image_type && currentImage.image_type !== 'main' && (
            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-1 rounded capitalize">
              {currentImage.image_type}
            </span>
          )}

          {/* Zoom hint - desktop only */}
          {!isZoomed && (
            <div className="hidden md:flex absolute bottom-3 right-3 bg-white/80 rounded-full p-2">
              <ZoomIn className="h-5 w-5 text-gray-600" />
            </div>
          )}
        </div>

        {/* Navigation arrows - always visible on mobile, hover on desktop */}
        {sortedImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 shadow-md",
                "w-8 h-8 sm:w-10 sm:h-10",
                "bg-white/90 active:bg-white md:hover:bg-white"
              )}
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 shadow-md",
                "w-8 h-8 sm:w-10 sm:h-10",
                "bg-white/90 active:bg-white md:hover:bg-white"
              )}
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        )}

        {/* Image counter / dots for mobile */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {/* Dots on mobile */}
          <div className="flex gap-1.5 md:hidden">
            {sortedImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === selectedIndex
                    ? "bg-brand-black w-4"
                    : "bg-black/30"
                )}
              />
            ))}
          </div>
          {/* Counter on desktop */}
          <div className="hidden md:block bg-black/60 text-white text-xs px-3 py-1 rounded-full">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        </div>
      </div>
    </div>
  );
}
