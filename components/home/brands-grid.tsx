import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

/**
 * Grid de marcas destacadas
 * Muestra logos clickeables que llevan a la página de cada marca
 */
export async function BrandsGrid() {
  const supabase = await createClient();

  // Obtener marcas con productos activos
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url')
    .order('name');

  if (!brands || brands.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 lg:py-16">
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12">
        Nuestras Marcas
      </h2>

      <div className="mx-auto grid max-w-6xl grid-cols-2 place-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-6">
        {brands.map((brand) => {
          const isSvg = brand.logo_url?.endsWith('.svg');

          return (
            <Link
              key={brand.id}
              href={`/marcas/${brand.slug}`}
              className="group flex aspect-square w-full max-w-[150px] items-center justify-center rounded-lg border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-brand-blue hover:shadow-lg sm:max-w-[170px]"
            >
              {brand.logo_url ? (
                isSvg ? (
                  // Para SVG usar img directamente con crossOrigin para evitar problemas CORS
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    loading="lazy"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain brightness-0 transition-all duration-300 group-hover:brightness-100"
                    style={{ filter: 'brightness(0)' }}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-contain brightness-0 transition-all duration-300 group-hover:brightness-100"
                      style={{ filter: 'brightness(0)' }}
                    />
                  </div>
                )
              ) : (
                <span className="text-sm lg:text-base font-semibold text-gray-600 group-hover:text-brand-black transition-colors text-center">
                  {brand.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
