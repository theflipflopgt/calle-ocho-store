import { Suspense } from 'react';
import { getProducts, getBrands, getCategories } from '@/lib/queries/products';
import { ProductGrid } from '@/components/products/product-grid';
import { CatalogFilters } from '@/components/products/catalog-filters';
import { SearchBar } from '@/components/search/search-bar';
import { Loader2, Search } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    categoria?: string;
    genero?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q;

  if (query) {
    return {
      title: `Resultados para "${query}" | Calle Ocho Store`,
      description: `Encuentra ${query} en Calle Ocho Store. Las mejores marcas de tenis en Guatemala.`,
    };
  }

  return {
    title: 'Buscar | Calle Ocho Store',
    description: 'Busca tenis de las mejores marcas en Calle Ocho Store.',
  };
}

async function SearchResults({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const params = await searchParams;
  const query = params.q;

  if (!query) {
    return (
      <div className="text-center py-16 sm:py-20">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-brand-black mb-2">
          ¿Qué estás buscando?
        </h2>
        <p className="text-gray-500 text-sm sm:text-base">
          Ingresa un término de búsqueda para encontrar productos
        </p>
      </div>
    );
  }

  const [products, brandsData, categories] = await Promise.all([
    getProducts({
      search: query,
      brandSlug: params.marca,
      categorySlug: params.categoria,
      gender: params.genero as any,
      sortBy: params.sort as any,
    }),
    getBrands(),
    getCategories(),
  ]);

  const brands = brandsData || [];

  if (products.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-brand-black mb-2">
          Sin resultados para &quot;{query}&quot;
        </h2>
        <p className="text-gray-500 text-sm sm:text-base mb-6">
          Intenta con otros términos o explora nuestras categorías
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {brands.slice(0, 5).map((brand: any) => (
            <a
              key={brand.id}
              href={`/marcas/${brand.slug}`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-brand-black transition-colors"
            >
              {brand.name}
            </a>
          ))}
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-gray-500">
            {products.length} resultado{products.length !== 1 ? 's' : ''} para &quot;{query}&quot;
          </p>
        </div>

        <ProductGrid products={products} />
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-black mb-4">
          Buscar
        </h1>
        <SearchBar defaultValue={params.q} />
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      }>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
