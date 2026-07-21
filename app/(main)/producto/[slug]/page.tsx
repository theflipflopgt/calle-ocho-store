import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/queries/products';
import { ProductDetail } from '@/components/products/product-detail';
import { ProductGrid } from '@/components/products/product-grid';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Producto no encontrado | Calle Ocho Store' };
  }

  const mainImage = product.colors[0]?.images?.[0]?.image_url;

  return {
    title: `${product.name} | Calle Ocho Store`,
    description: product.description || `Compra ${product.name} de ${product.brand.name} en Calle Ocho Store.`,
    openGraph: {
      images: mainImage ? [mainImage] : [],
    },
  };
}

async function RelatedProducts({
  categoryId,
  brandId,
  currentProductId
}: {
  categoryId: string;
  brandId: string;
  currentProductId: string;
}) {
  const products = await getProducts({ limit: 8 });

  // Filtrar productos relacionados (misma categoría o marca, excluyendo el actual)
  const related = products
    .filter(p => p.id !== currentProductId && (p.category.id === categoryId || p.brand.id === brandId))
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16 lg:mt-20">
      <h2 className="text-xl sm:text-2xl font-bold text-brand-black mb-4 sm:mb-6">
        También te puede interesar
      </h2>
      <ProductGrid products={related} />
    </section>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
      <ProductDetail product={product} />

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      }>
        <RelatedProducts
          categoryId={product.category.id}
          brandId={product.brand.id}
          currentProductId={product.id}
        />
      </Suspense>
    </main>
  );
}
