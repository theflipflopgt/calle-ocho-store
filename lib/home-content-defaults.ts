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
  footer: {
    image: string;
    alt: string;
  };
  footerPages: {
    seguimiento: HomeFooterPageContent;
    envios: HomeFooterPageContent;
    guiaTallas: HomeFooterPageContent;
    devoluciones: HomeFooterPageContent;
    contacto: HomeFooterPageContent;
    nosotros: HomeFooterPageContent;
    terminos: HomeFooterPageContent;
    privacidad: HomeFooterPageContent;
  };
}

export interface HomeFooterPageContent {
  image: string;
  alt: string;
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
  footer: {
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    alt: 'Calzado calleOCHO',
  },
  footerPages: {
    seguimiento: {
      image:
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1800&auto=format&fit=crop',
      alt: 'Seguimiento de pedido',
    },
    envios: {
      image:
        'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1800&auto=format&fit=crop',
      alt: 'Entrega de calzado',
    },
    guiaTallas: {
      image:
        'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=1800&auto=format&fit=crop',
      alt: 'Guía de tallas de calzado',
    },
    devoluciones: {
      image:
        'https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=1800&auto=format&fit=crop',
      alt: 'Tenis para cambios y devoluciones',
    },
    contacto: {
      image:
        'https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1800&auto=format&fit=crop',
      alt: 'Atención de Calle Ocho Store',
    },
    nosotros: {
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1800&auto=format&fit=crop',
      alt: 'Estilo urbano Calle Ocho Store',
    },
    terminos: {
      image:
        'https://images.unsplash.com/photo-1521093470119-a3acdc43374a?q=80&w=1800&auto=format&fit=crop',
      alt: 'Términos de Calle Ocho Store',
    },
    privacidad: {
      image:
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1800&auto=format&fit=crop',
      alt: 'Privacidad y seguridad',
    },
  },
};
