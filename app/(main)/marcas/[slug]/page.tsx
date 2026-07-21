import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProducts, getBrands, getCategories } from '@/lib/queries/products';
import { ProductGrid } from '@/components/products/product-grid';
import { CatalogFilters } from '@/components/products/catalog-filters';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    categoria?: string;
    genero?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from('brands')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!brand) {
    return { title: 'Marca no encontrada | Calle Ocho Store' };
  }

  return {
    title: `${brand.name} | Calle Ocho Store`,
    description: brand.description || `Descubre toda la colección de ${brand.name} en Calle Ocho Store.`,
  };
}

async function ProductsContent({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: PageProps['searchParams'];
}) {
  const params = await searchParams;

  const [products, categories] = await Promise.all([
    getProducts({
      brandSlug: slug,
      categorySlug: params.categoria,
      gender: params.genero as any,
      sortBy: params.sort as any,
    }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <CatalogFilters
        brands={[]}
        categories={categories}
        currentCategory={params.categoria}
        currentSort={params.sort}
        showGenderFilter={true}
        currentGender={params.genero}
      />

      <div className="flex-1">
        <div className="mb-4 sm:mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ProductGrid
          products={products}
          emptyMessage="No encontramos productos de esta marca con estos filtros"
        />
      </div>
    </div>
  );
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!brand) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center gap-6 sm:gap-8">
        {brand.logo_url && (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
            <Image
              src={brand.logo_url}
              alt={brand.name}
              fill
              className="object-contain"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-black dark:text-white">
            {brand.name}
          </h1>
          {brand.description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {brand.description}
            </p>
          )}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          </div>
        }
      >
        <ProductsContent slug={slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
