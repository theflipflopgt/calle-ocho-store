import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/queries/products';
import { ProductDetail } from '@/components/products/product-detail';
import { ProductGrid } from '@/components/products/product-grid';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Producto no encontrado | Calle Ocho Store' };
  }

  const mainImage = product.colors[0]?.images?.[0]?.image_url;

  const description = product.description || `Compra ${product.name} de ${product.brand.name} en Calle Ocho Store Guatemala.`;
  const canonical = `/producto/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${product.name} | Calle Ocho Store`,
      description,
      images: mainImage ? [{ url: mainImage, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Calle Ocho Store`,
      description,
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

  const productUrl = `https://calleochostore.com/producto/${product.slug}`;
  const images = product.colors.flatMap((color) => color.images.map((image) => image.image_url));
  const inStock = product.colors.some((color) =>
    color.variants.some((variant) => variant.is_available && Number(variant.stock_quantity || 0) > 0)
  );
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: images,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand.name },
    category: product.category.name,
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'GTQ',
      price: Number(product.lowestPrice || product.base_price).toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://calleochostore.com' },
      { '@type': 'ListItem', position: 2, name: product.brand.name, item: `https://calleochostore.com/marcas/${product.brand.slug}` },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <nav aria-label="Migas de pan" className="mb-4 text-sm text-gray-500">
        <a href="/" className="hover:text-brand-black">Inicio</a>
        <span className="mx-2">/</span>
        <a href={`/marcas/${product.brand.slug}`} className="hover:text-brand-black">{product.brand.name}</a>
        <span className="mx-2">/</span>
        <span className="text-brand-black">{product.name}</span>
      </nav>
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
