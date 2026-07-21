'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types/product';

interface SizeSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ProductVariant) => void;
  sizeSystem?: 'us' | 'eu' | 'uk' | 'cm';
  dict: {
    selectSize: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    left: string;
  };
}

export function SizeSelector({
  variants,
  selectedVariantId,
  onSelect,
  sizeSystem = 'us',
  dict
}: SizeSelectorProps) {
  const getSize = (variant: ProductVariant) => {
    switch (sizeSystem) {
      case 'eu': return variant.size_eu;
      case 'uk': return variant.size_uk;
      case 'cm': return variant.size_cm;
      default: return variant.size_us;
    }
  };

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.is_available === false || variant.stock_quantity === 0) {
      return { label: dict.outOfStock, color: 'text-gray-400', bg: 'bg-gray-100' };
    }
    const threshold = variant.low_stock_threshold || 3;
    if (variant.stock_quantity <= threshold) {
      return {
        label: `${variant.stock_quantity} ${dict.left}`,
        color: 'text-brand-orange',
        bg: 'bg-orange-50 border-brand-orange'
      };
    }
    return { label: dict.inStock, color: 'text-green-600', bg: 'bg-green-50' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{dict.selectSize}</span>
        <span className="text-xs text-gray-500 uppercase">{sizeSystem}</span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isAvailable = variant.is_available !== false && variant.stock_quantity > 0;
          const isLowStock = variant.stock_quantity > 0 && variant.stock_quantity <= (variant.low_stock_threshold || 3);

          return (
            <button
              key={variant.id}
              onClick={() => isAvailable && onSelect(variant)}
              disabled={!isAvailable}
              className={cn(
                "relative flex flex-col items-center justify-center py-3 px-2 border rounded-lg transition-all text-sm",
                isSelected && isAvailable && "border-brand-black bg-brand-black text-white",
                !isSelected && isAvailable && "border-gray-200 hover:border-brand-black",
                !isAvailable && "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through",
                isLowStock && !isSelected && "border-brand-orange"
              )}
            >
              <span className="font-medium">{getSize(variant)}</span>

              {/* Stock indicator dot */}
              {isLowStock && isAvailable && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-orange rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected variant stock info */}
      {selectedVariantId && (
        <div className="text-sm">
          {variants
            .filter(v => v.id === selectedVariantId)
            .map(variant => {
              const status = getStockStatus(variant);
              return (
                <span key={variant.id} className={status.color}>
                  {status.label}
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}
