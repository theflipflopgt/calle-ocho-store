import { Suspense } from 'react';
import { getProducts, getBrands, getCategories } from '@/lib/queries/products';
import { ProductGrid } from '@/components/products/product-grid';
import { CatalogFilters } from '@/components/products/catalog-filters';
import { Loader2, Percent } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    marca?: string;
    categoria?: string;
    genero?: string;
    sort?: string;
  }>;
}

export const metadata = {
  title: 'Ofertas | Calle Ocho Store',
  description: 'Aprovecha nuestras ofertas y descuentos en tenis. Las mejores marcas a precios increíbles.',
};

async function ProductsContent({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const params = await searchParams;

  const [products, brands, categories] = await Promise.all([
    getProducts({
      onSale: true,
      brandSlug: params.marca,
      categorySlug: params.categoria,
      gender: params.genero as any,
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
        showGenderFilter={true}
        currentGender={params.genero}
      />

      <div className="flex-1">
        <div className="mb-4 sm:mb-6">
          <p className="text-sm text-gray-600">
            {products.length} producto{products.length !== 1 ? 's' : ''} en oferta
          </p>
        </div>

        <ProductGrid
          products={products}
          emptyMessage="No hay productos en oferta en este momento"
        />
      </div>
    </div>
  );
}

export default async function OfertasPage({ searchParams }: PageProps) {
  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-red rounded-full flex items-center justify-center">
            <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-black">
            Ofertas
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Los mejores descuentos en tenis de marca
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
