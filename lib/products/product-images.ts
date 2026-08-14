export const MAX_PRODUCT_IMAGES_PER_COLOR = 5;

interface OrderedProductImage {
  image_url: string;
  display_order?: number | null;
}

export function sortAndLimitProductImages<T extends OrderedProductImage>(images: T[]): T[] {
  return [...images]
    .sort(
      (a, b) =>
        Number(a.display_order || 0) - Number(b.display_order || 0)
    )
    .slice(0, MAX_PRODUCT_IMAGES_PER_COLOR);
}

export function hasValidProductImageCount(images: OrderedProductImage[]): boolean {
  return (
    images.length >= 1 &&
    images.length <= MAX_PRODUCT_IMAGES_PER_COLOR &&
    images.every((image) => image.image_url.trim().length > 0)
  );
}
