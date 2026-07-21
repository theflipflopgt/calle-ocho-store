import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PromoTicker } from "@/components/home/promo-ticker";
import { NewArrivalsSlider } from "@/components/home/new-arrivals-slider";
import { BrandsGrid } from "@/components/home/brands-grid";
import { HeroVideo } from "@/components/home/hero-video";
import { getProducts } from "@/lib/queries/products";

/**
 * Homepage Calle Ocho Store
 * Diseño inspirado en Kicks.com.gt pero mejorado y adaptado
 */
export default async function Home() {
  // Obtener nuevos lanzamientos (últimos 12 productos)
  const newArrivals = await getProducts({
    limit: 12,
    sortBy: 'newest'
  });

  return (
    <main>
      {/* Hero Section - Video de fondo estilo Kicks */}
      <section className="relative h-[600px] sm:h-[650px] lg:h-[700px] bg-brand-black overflow-hidden">
        <HeroVideo
          desktopVideoSrc="https://res.cloudinary.com/dv5nlnc0r/video/upload/q_auto,f_auto/v1770445271/video-h_ktgozh.mp4"
          mobileVideoSrc="https://res.cloudinary.com/dv5nlnc0r/video/upload/q_auto,f_auto/v1770445093/video-v_yu5vvi.mp4"
          fallbackImage="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="container mx-auto px-4 h-full relative z-10">
          <div className="flex flex-col justify-center h-full max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 lg:mb-6 leading-tight">
              Descubre tu
              <br />
              <span className="text-brand-blue">Estilo Único</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 lg:mb-10">
              Los mejores sneakers de las marcas más exclusivas
            </p>
            <div>
              <Button
                size="lg"
                className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-base lg:text-lg h-12 sm:h-14 lg:h-16 px-8 sm:px-10 lg:px-12 shadow-xl hover:shadow-2xl transition-all"
                asChild
              >
                <Link href="/hombre">
                  COMPRAR AHORA
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
          <Link
            href="/hombre"
            className="group relative h-[280px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Image
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop"
              alt="Tenis para hombre"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              <h3 className="text-white text-3xl lg:text-4xl font-bold mb-2">
                HOMBRE
              </h3>
              <p className="text-white/90 text-sm lg:text-base">
                Descubre los últimos lanzamientos
              </p>
            </div>
          </Link>

          <Link
            href="/mujer"
            className="group relative h-[280px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Image
              src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=2070&auto=format&fit=crop"
              alt="Tenis para mujer"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              <h3 className="text-white text-3xl lg:text-4xl font-bold mb-2">
                MUJER
              </h3>
              <p className="text-white/90 text-sm lg:text-base">
                Estilo y comodidad en cada paso
              </p>
            </div>
          </Link>

          <Link
            href="/ninos"
            className="group relative h-[280px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Image
              src="https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=2070&auto=format&fit=crop"
              alt="Tenis para niños"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              <h3 className="text-white text-3xl lg:text-4xl font-bold mb-2">
                NIÑOS
              </h3>
              <p className="text-white/90 text-sm lg:text-base">
                Diversión y confort para los más pequeños
              </p>
            </div>
          </Link>

          <Link
            href="/ofertas"
            className="group relative h-[280px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Image
              src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2071&auto=format&fit=crop"
              alt="Ofertas especiales"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-red/90 via-brand-orange/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              <div className="bg-white text-brand-red inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 w-fit">
                ⚡ SALE
              </div>
              <h3 className="text-white text-3xl lg:text-4xl font-bold mb-2">
                OFERTAS
              </h3>
              <p className="text-white text-sm lg:text-base font-semibold">
                Hasta 50% de descuento
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
