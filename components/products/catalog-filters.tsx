'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tables } from '@/types/database.types';

type Brand = Tables<'brands'>;
type Category = Tables<'categories'>;

interface CatalogFiltersProps {
  brands: Brand[];
  categories: Category[];
  currentBrand?: string;
  currentCategory?: string;
  currentSort?: string;
  showGenderFilter?: boolean;
  currentGender?: string;
}

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre A-Z' },
];

export function CatalogFilters({
  brands,
  categories,
  currentBrand,
  currentCategory,
  currentSort = 'newest',
  showGenderFilter = false,
  currentGender,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(window.location.pathname);
  };

  const hasActiveFilters = currentBrand || currentCategory || (showGenderFilter && currentGender);

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div className="border-b border-gray-200 py-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-sm text-white">{title}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && <div className="mt-3 space-y-2">{children}</div>}
      </div>
    );
  };

  const FilterContent = () => (
    <>
      {/* Ordenar */}
      <FilterSection title="Ordenar por">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => updateFilter('sort', option.value)}
            className={cn(
              "block w-full text-left px-2 py-1.5 text-sm rounded transition-colors",
              currentSort === option.value
                ? "bg-brand-black text-white"
                : "text-white hover:bg-gray-100"
            )}
          >
            {option.label}
          </button>
        ))}
      </FilterSection>

      {/* Marcas */}
      {brands.length > 0 && (
        <FilterSection title="Marca">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => updateFilter('marca', currentBrand === brand.slug ? null : brand.slug)}
              className={cn(
                "block w-full text-left px-2 py-1.5 text-sm rounded transition-colors",
                currentBrand === brand.slug
                  ? "bg-brand-black text-white"
                  : "text-white hover:bg-gray-100"
              )}
            >
              {brand.name}
            </button>
          ))}
        </FilterSection>
      )}

      {/* Categorías */}
      {categories.length > 0 && (
        <FilterSection title="Categoría">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateFilter('categoria', currentCategory === category.slug ? null : category.slug)}
              className={cn(
                "block w-full text-left px-2 py-1.5 text-sm rounded transition-colors",
                currentCategory === category.slug
                  ? "bg-brand-black text-white"
                  : "text-white hover:bg-gray-100"
              )}
            >
              {category.name}
            </button>
          ))}
        </FilterSection>
      )}

      {/* Género (solo si se muestra) */}
      {showGenderFilter && (
        <FilterSection title="Género">
          {['hombre', 'mujer', 'unisex'].map((gender) => (
            <button
              key={gender}
              onClick={() => updateFilter('genero', currentGender === gender ? null : gender)}
              className={cn(
                "block w-full text-left px-2 py-1.5 text-sm rounded transition-colors capitalize",
                currentGender === gender
                  ? "bg-brand-black text-white"
                  : "text-white hover:bg-gray-100"
              )}
            >
              {gender}
            </button>
          ))}
        </FilterSection>
      )}

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <div className="pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full justify-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros y ordenar
          {hasActiveFilters && (
            <span className="bg-brand-black text-white text-xs px-1.5 py-0.5 rounded-full">
              {[currentBrand, currentCategory, currentGender].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-[300px] bg-white z-50 lg:hidden overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-brand-black">Filtros</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0">
        <div className="sticky top-24">
          <h2 className="font-semibold text-white mb-4">Filtros</h2>
          <FilterContent />
        </div>
      </div>
    </>
  );
}
