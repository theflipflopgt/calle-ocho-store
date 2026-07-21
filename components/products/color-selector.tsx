'use client';

import { cn } from '@/lib/utils';
import type { ProductColor, ProductColorImage } from '@/types/product';

interface ColorSelectorProps {
  colors: (ProductColor & { images: ProductColorImage[] })[];
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ColorSelector({
  colors,
  selectedColorId,
  onSelect,
  size = 'md'
}: ColorSelectorProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const isSelected = color.id === selectedColorId;
        const thumbnail = color.images?.[0]?.image_url;

        return (
          <button
            key={color.id}
            onClick={() => onSelect(color.id)}
            className={cn(
              "relative rounded-full border-2 transition-all overflow-hidden",
              sizeClasses[size],
              isSelected
                ? "border-brand-black ring-2 ring-brand-black ring-offset-2"
                : "border-gray-200 hover:border-gray-400",
              color.is_available === false && "opacity-50 cursor-not-allowed"
            )}
            disabled={color.is_available === false}
            title={color.color_name}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={color.color_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: color.color_code || '#ccc' }}
              />
            )}

            {/* Unavailable indicator */}
            {color.is_available === false && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gray-400 rotate-45" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
