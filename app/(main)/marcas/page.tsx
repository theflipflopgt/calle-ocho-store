import Link from 'next/link';
import Image from 'next/image';
import { getBrands } from '@/lib/queries/products';

export const metadata = {
  title: 'Marcas | Calle Ocho Store',
  description: 'Explora todas las marcas disponibles en Calle Ocho Store: Nike, Adidas, Jordan, New Balance, Puma, Converse y más.',
};

export default async function MarcasPage() {
  const brands = await getBrands();

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-black mb-2">
          Nuestras Marcas
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Las mejores marcas de tenis del mundo, todo en un solo lugar
        </p>
      </div>

      {/* Brands Grid */}
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 sm:gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/marcas/${brand.slug}`}
            className="group flex aspect-square w-[145px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-brand-black hover:shadow-lg sm:w-[170px] sm:p-6"
          >
            {brand.logo_url ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3">
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  fill
                  className="object-contain group-hover:scale-110 transition-transform"
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl sm:text-2xl font-bold text-gray-400">
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}
            <h2 className="font-semibold text-sm sm:text-base text-brand-black text-center">
              {brand.name}
            </h2>
            {brand.country && (
              <p className="text-xs text-gray-400 mt-1">{brand.country}</p>
            )}
          </Link>
        ))}
      </div>

      {brands.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay marcas disponibles</p>
        </div>
      )}
    </main>
  );
}
