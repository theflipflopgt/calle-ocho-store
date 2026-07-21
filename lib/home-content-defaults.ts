export interface HomeCategoryContent {
  title: string;
  description: string;
  href: string;
  image: string;
  alt: string;
  badge?: string;
  overlay: 'dark' | 'sale';
}

export interface HomeHeroSlide {
  image: string;
  mobileImage?: string;
  alt: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface HomeContent {
  hero: {
    mode: 'video' | 'slider';
    desktopVideoSrc: string;
    mobileVideoSrc: string;
    fallbackImage: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    buttonLabel: string;
    buttonHref: string;
    slides: HomeHeroSlide[];
  };
  categories: HomeCategoryContent[];
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    mode: 'video',
    desktopVideoSrc:
      'https://res.cloudinary.com/dv5nlnc0r/video/upload/q_auto,f_auto/v1770445271/video-h_ktgozh.mp4',
    mobileVideoSrc:
      'https://res.cloudinary.com/dv5nlnc0r/video/upload/q_auto,f_auto/v1770445093/video-v_yu5vvi.mp4',
    fallbackImage:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
    titleLine1: 'Descubre tu',
    titleLine2: 'Estilo Único',
    subtitle: 'Los mejores sneakers de las marcas más exclusivas',
    buttonLabel: 'COMPRAR AHORA',
    buttonHref: '/hombre',
    slides: [
      {
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
        mobileImage:
          'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=1200&auto=format&fit=crop',
        alt: 'Tenis destacados calleOCHO',
        titleLine1: 'Descubre tu',
        titleLine2: 'Estilo Único',
        subtitle: 'Los mejores sneakers de las marcas más exclusivas',
        buttonLabel: 'COMPRAR AHORA',
        buttonHref: '/hombre',
      },
      {
        image:
          'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2071&auto=format&fit=crop',
        mobileImage:
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop',
        alt: 'Ofertas de calzado calleOCHO',
        titleLine1: 'Nuevas',
        titleLine2: 'Llegadas',
        subtitle: 'Modelos listos para estrenar con asesoría de tallas',
        buttonLabel: 'VER NOVEDADES',
        buttonHref: '/hombre',
      },
    ],
  },
  categories: [
    {
      title: 'HOMBRE',
      description: 'Descubre los últimos lanzamientos',
      href: '/hombre',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
      alt: 'Tenis para hombre',
      overlay: 'dark',
    },
    {
      title: 'MUJER',
      description: 'Estilo y comodidad en cada paso',
      href: '/mujer',
      image:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=2070&auto=format&fit=crop',
      alt: 'Tenis para mujer',
      overlay: 'dark',
    },
    {
      title: 'NIÑOS',
      description: 'Diversión y confort para los más pequeños',
      href: '/ninos',
      image:
        'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=2070&auto=format&fit=crop',
      alt: 'Tenis para niños',
      overlay: 'dark',
    },
    {
      title: 'OFERTAS',
      description: 'Hasta 50% de descuento',
      href: '/ofertas',
      image:
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2071&auto=format&fit=crop',
      alt: 'Ofertas especiales',
      badge: 'SALE',
      overlay: 'sale',
    },
  ],
};
