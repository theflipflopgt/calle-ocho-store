import Link from "next/link";
import Image from "next/image";
import { PromoTicker } from "@/components/home/promo-ticker";
import { NewArrivalsSlider } from "@/components/home/new-arrivals-slider";
import { BrandsGrid } from "@/components/home/brands-grid";
import { HeroMedia } from "@/components/home/hero-media";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { getHomeContent } from "@/lib/home-content";
import { getFeaturedProducts, getProducts } from "@/lib/queries/products";

/**
 * Homepage Calle Ocho Store
 * Diseño inspirado en Kicks.com.gt pero mejorado y adaptado
 */
export default async function Home() {
  const [newArrivals, featuredProducts, homeContent] = await Promise.all([
    getProducts({
      limit: 12,
      sortBy: 'newest'
    }),
    getFeaturedProducts(),
    getHomeContent(),
  ]);

  return (
    <main>
      {/* Hero principal: carrusel de productos administrable; fallback al hero multimedia */}
      {featuredProducts.length > 0 ? (
        <HeroCarousel products={featuredProducts} />
      ) : (
        <section className="relative h-[600px] sm:h-[650px] lg:h-[700px] bg-brand-black overflow-hidden">
          <HeroMedia hero={homeContent.hero} />
        </section>
      )}

      {/* Ticker Promocional - Scroll infinito */}
      <PromoTicker />

      {/* Nuevos Lanzamientos - Slider horizontal */}
      <NewArrivalsSlider products={newArrivals} />

      {/* Grid de Marcas */}
      <BrandsGrid />

      {/* Categorías por Género - 4 cards grandes */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12">
          Compra por Categoría
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {homeContent.categories.map((category, index) => (
            <Link
              key={`${category.href}-${index}`}
              href={category.href}
              className="group relative h-[280px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            >
              <Image
                src={category.image}
                alt={category.alt || category.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                className={
                  category.overlay === 'sale'
                    ? 'absolute inset-0 bg-gradient-to-t from-brand-red/90 via-brand-orange/50 to-transparent'
                    : 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent'
                }
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                {category.badge && (
                  <div className="bg-white text-brand-red inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 w-fit">
                    {category.badge}
                  </div>
                )}
                <h3 className="text-white text-3xl lg:text-4xl font-bold mb-2">
                  {category.title}
                </h3>
                <p className="text-white/90 text-sm lg:text-base font-semibold">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
