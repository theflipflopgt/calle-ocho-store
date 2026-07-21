import { Suspense } from 'react';
import { getProducts, getBrands, getCategories } from '@/lib/queries/products';
import { ProductGrid } from '@/components/products/product-grid';
import { CatalogFilters } from '@/components/products/catalog-filters';
import { Loader2 } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    marca?: string;
    categoria?: string;
    sort?: string;
  }>;
}

export const metadata = {
  title: 'Tenis para Niños | Calle Ocho Store',
  description: 'Descubre nuestra colección de tenis para niños y niñas. Las mejores marcas: Nike, Adidas, Jordan, New Balance y más.',
};

async function ProductsContent({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const params = await searchParams;

  const [products, brands, categories] = await Promise.all([
    getProducts({
      gender: 'ninos',
      brandSlug: params.marca,
      categorySlug: params.categoria,
      sortBy: params.sort as any,
    }),
    getBrands(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <CatalogFilters
        brands={brands}
        categories={categories}
        currentBrand={params.marca}
        currentCategory={params.categoria}
        currentSort={params.sort}
      />

      <div className="flex-1">
        <div className="mb-4 sm:mb-6">
          <p className="text-sm text-white">
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ProductGrid
          products={products}
          emptyMessage="No encontramos productos para niños con estos filtros"
        />
      </div>
    </div>
  );
}

export default async function NinosPage({ searchParams }: PageProps) {
  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
          Tenis para Niños
        </h1>
        <p className="text-sm sm:text-base text-white">
          Estilo y comodidad para los más pequeños
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      }>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
