import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PromoTicker } from "@/components/home/promo-ticker";
import { NewArrivalsSlider } from "@/components/home/new-arrivals-slider";
import { BrandsGrid } from "@/components/home/brands-grid";
import { HeroVideo } from "@/components/home/hero-video";
import { getHomeContent } from "@/lib/home-content";
import { getProducts } from "@/lib/queries/products";

/**
 * Homepage Calle Ocho Store
 * Diseño inspirado en Kicks.com.gt pero mejorado y adaptado
 */
export default async function Home() {
  const [newArrivals, homeContent] = await Promise.all([
    getProducts({
      limit: 12,
      sortBy: 'newest'
    }),
    getHomeContent(),
  ]);

  return (
    <main>
      {/* Hero Section - Video de fondo estilo Kicks */}
      <section className="relative h-[600px] sm:h-[650px] lg:h-[700px] bg-brand-black overflow-hidden">
        <HeroVideo
          desktopVideoSrc={homeContent.hero.desktopVideoSrc}
          mobileVideoSrc={homeContent.hero.mobileVideoSrc}
          fallbackImage={homeContent.hero.fallbackImage}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="container mx-auto px-4 h-full relative z-10">
          <div className="flex flex-col justify-center h-full max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 lg:mb-6 leading-tight">
              {homeContent.hero.titleLine1}
              <br />
              <span className="text-brand-blue">{homeContent.hero.titleLine2}</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 lg:mb-10">
              {homeContent.hero.subtitle}
            </p>
            <div>
              <Button
                size="lg"
                className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-base lg:text-lg h-12 sm:h-14 lg:h-16 px-8 sm:px-10 lg:px-12 shadow-xl hover:shadow-2xl transition-all"
                asChild
              >
                <Link href={homeContent.hero.buttonHref}>
                  {homeContent.hero.buttonLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

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
