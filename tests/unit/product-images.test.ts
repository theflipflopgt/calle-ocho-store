import { describe, expect, it } from 'vitest';
import {
  hasValidProductImageCount,
  MAX_PRODUCT_IMAGES_PER_COLOR,
  sortAndLimitProductImages,
} from '@/lib/products/product-images';

describe('product image rules', () => {
  it('accepts between one and five complete images', () => {
    expect(hasValidProductImageCount([{ image_url: 'https://example.com/1.jpg' }])).toBe(true);
    expect(
      hasValidProductImageCount(
        Array.from({ length: MAX_PRODUCT_IMAGES_PER_COLOR }, (_, index) => ({
          image_url: `https://example.com/${index}.jpg`,
        }))
      )
    ).toBe(true);
  });

  it('rejects empty galleries, incomplete images and more than five images', () => {
    expect(hasValidProductImageCount([])).toBe(false);
    expect(hasValidProductImageCount([{ image_url: ' ' }])).toBe(false);
    expect(
      hasValidProductImageCount(
        Array.from({ length: 6 }, (_, index) => ({
          image_url: `https://example.com/${index}.jpg`,
        }))
      )
    ).toBe(false);
  });

  it('sorts images and exposes at most five', () => {
    const images = Array.from({ length: 6 }, (_, index) => ({
      image_url: `https://example.com/${index}.jpg`,
      display_order: 5 - index,
    }));

    const result = sortAndLimitProductImages(images);
    expect(result).toHaveLength(5);
    expect(result[0].display_order).toBe(0);
    expect(result[4].display_order).toBe(4);
  });
});
