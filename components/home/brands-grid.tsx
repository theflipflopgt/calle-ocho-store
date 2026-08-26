import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

/**
 * Grid de marcas destacadas
 * Muestra logos clickeables que llevan a la página de cada marca
 */
export async function BrandsGrid() {
  const supabase = await createClient();

  // El filtro debe ser explicito: una sesion administrativa puede leer tambien
  // las marcas inactivas por RLS, pero nunca deben mostrarse en la tienda.
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching storefront brands:', error);
    return null;
  }

  if (!brands || brands.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 lg:py-16">
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12">
        Nuestras Marcas
      </h2>

      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 lg:gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/marcas/${brand.slug}`}
            className="group flex aspect-square w-[145px] items-center justify-center rounded-lg border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-brand-blue hover:shadow-lg sm:w-[165px]"
          >
            {brand.logo_url ? (
              <div className="relative h-full w-full">
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  fill
                  sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ) : (
              <span className="text-sm lg:text-base font-semibold text-gray-600 group-hover:text-brand-black transition-colors text-center">
                {brand.name}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
