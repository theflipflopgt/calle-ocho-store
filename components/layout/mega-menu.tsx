'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MegaMenuProps {
  brands: Brand[];
  categories: Category[];
}

export function MegaMenu({ brands, categories }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = [
    {
      key: 'men',
      label: 'Hombre',
      href: '/hombre',
    },
    {
      key: 'women',
      label: 'Mujer',
      href: '/mujer',
    },
    {
      key: 'brands',
      label: 'Marcas',
      href: '/marcas',
    },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1">
      {menuItems.map((item) => (
        <div
          key={item.key}
          className="relative"
          onMouseEnter={() => setActiveMenu(item.key)}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-md",
              activeMenu === item.key
                ? "text-brand-blue bg-blue-50"
                : "text-brand-black hover:text-brand-blue"
            )}
          >
            {item.label}
            {(item.key === 'brands') && (
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                activeMenu === item.key && "rotate-180"
              )} />
            )}
          </Link>

          {/* Mega Menu Dropdown - Brands */}
          {item.key === 'brands' && activeMenu === 'brands' && (
            <div className="absolute top-full left-0 w-[600px] bg-white shadow-xl rounded-lg border p-6 z-50">
              <div className="grid grid-cols-3 gap-6">
                {/* Brand logos */}
                <div className="col-span-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
                    Todas las Marcas
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {brands.slice(0, 9).map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/marca/${brand.slug}`}
                        className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {brand.logo_url ? (
                          <Image
                            src={brand.logo_url}
                            alt={brand.name}
                            width={80}
                            height={40}
                            className="object-contain h-8"
                          />
                        ) : (
                          <span className="text-sm font-medium">{brand.name}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/marcas"
                    className="inline-block mt-4 text-sm text-brand-blue hover:underline font-medium"
                  >
                    Ver Todo →
                  </Link>
                </div>

                {/* Featured brand promo */}
                <div className="col-span-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
                    Destacado
                  </h3>
                  <div className="relative h-40 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400"
                      alt="Featured brand"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                      <span className="text-white font-bold">Nike Air Max</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mega Menu Dropdown - Hombre/Mujer */}
          {(item.key === 'men' || item.key === 'women') && activeMenu === item.key && (
            <div className="absolute top-full left-0 w-[500px] bg-white shadow-xl rounded-lg border p-6 z-50">
              <div className="grid grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
                    Categorías
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/${item.key === 'men' ? 'hombre' : 'mujer'}/${cat.slug}`}
                          className="text-sm text-gray-700 hover:text-brand-blue transition-colors"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Brands */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
                    Marcas
                  </h3>
                  <ul className="space-y-2">
                    {brands.slice(0, 6).map((brand) => (
                      <li key={brand.id}>
                        <Link
                          href={`/${item.key === 'men' ? 'hombre' : 'mujer'}?marca=${brand.slug}`}
                          className="text-sm text-gray-700 hover:text-brand-blue transition-colors"
                        >
                          {brand.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <Link
                  href={item.href}
                  className="text-sm text-brand-blue hover:underline font-medium"
                >
                  Ver Todo {item.label} →
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Sales link - no dropdown */}
      <Link
        href="/ofertas"
        className="px-4 py-2 text-sm font-semibold text-brand-red hover:bg-red-50 rounded-md transition-colors"
      >
        Ofertas ⚡
      </Link>
    </nav>
  );
}
