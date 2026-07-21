'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
}

export function SearchBar({
  defaultValue = '',
  placeholder = 'Polo, Adidas, Skechers, nombre del calzado...',
  className,
  size = 'md',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Preserve other search params
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', query.trim());

    router.push(`/buscar?${params.toString()}`);
  }, [query, router, searchParams]);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <Search className={cn(
          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400",
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "pl-10 sm:pl-12 pr-20 sm:pr-24 rounded-full border-gray-200 focus:border-brand-blue",
            sizeClasses[size],
            size === 'lg' && 'text-base sm:text-lg'
          )}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 sm:right-20 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Button
          type="submit"
          size={size === 'lg' ? 'default' : 'sm'}
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-black hover:bg-gray-800",
            size === 'sm' && 'h-7 px-3',
            size === 'md' && 'h-9 px-4',
            size === 'lg' && 'h-11 px-5'
          )}
        >
          Buscar
        </Button>
      </div>
    </form>
  );
}

// Compact search for header
export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Mobile Search Button */}
      <Button
        size="icon"
        variant="ghost"
        className="lg:hidden text-brand-black w-9 h-9 sm:w-10 sm:h-10"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Mobile Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Polo, Adidas, Skechers, modelo..."
                  autoFocus
                  className="pl-10 h-12 rounded-full"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
