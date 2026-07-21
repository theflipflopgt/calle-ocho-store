'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, ShoppingCart, User, Heart, Truck, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderSearchForm, MobileSearchButton, MobileSearchModal } from '@/components/search/header-search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, profile, isLoading, isAdmin, signOut } = useAuth();
  const { itemCount, openCart } = useCart();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force a hard refresh to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Still redirect even if there's an error
      window.location.href = '/';
    }
  };

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 transition-colors">
      {/* Free Shipping Banner - smaller on mobile */}
      <div className="bg-brand-black text-white py-1.5 sm:py-2 text-center">
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2">
          <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-[11px] sm:text-sm truncate">ENVÍO GRATIS en compras mayores a Q1,000</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-24 sm:h-28 md:h-32">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Calle Ocho Store"
              width={260}
              height={260}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24 md:h-28 md:w-28"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm ml-12 lg:ml-16">
            <Link href="/hombre" className="text-brand-black hover:text-brand-blue transition-colors font-medium">
              Hombre
            </Link>
            <Link href="/mujer" className="text-brand-black hover:text-brand-blue transition-colors font-medium">
              Mujer
            </Link>
            <Link href="/ninos" className="text-brand-black hover:text-brand-blue transition-colors font-medium">
              Niños
            </Link>
            <Link href="/marcas" className="text-brand-black hover:text-brand-blue transition-colors font-medium">
              Marcas
            </Link>
            <Link href="/ofertas" className="text-brand-red font-semibold">
              Ofertas
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <HeaderSearchForm />

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3">
            {/* Search Icon - Mobile */}
            <MobileSearchButton onClick={() => setSearchOpen(true)} />

            {/* Wishlist - hidden on mobile, show on tablet+ */}
            <Link href="/wishlist">
              <Button size="icon" variant="ghost" className="hidden sm:flex text-brand-black w-9 h-9 sm:w-10 sm:h-10">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Button
              size="icon"
              variant="ghost"
              className="relative text-brand-black w-9 h-9 sm:w-10 sm:h-10"
              onClick={openCart}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-brand-blue text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>

            {/* User Menu - Desktop */}
            <div className="hidden sm:flex">
              {isLoading && !user ? (
                <Button variant="ghost" size="icon" className="text-brand-black" disabled>
                  <User className="h-5 w-5" />
                </Button>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 text-brand-black">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden md:inline text-sm">Hola, {displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer font-medium text-brand-blue">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/cuenta" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mi Cuenta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cuenta/pedidos" className="cursor-pointer">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Mis Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-brand-black">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/auth/registro">
                    <Button size="sm" className="bg-brand-black hover:bg-gray-800 text-white hidden md:inline-flex">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden text-brand-black w-9 h-9 sm:w-10 sm:h-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full screen overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[calc(theme(spacing.16)+theme(spacing.7))] sm:top-[calc(theme(spacing.20)+theme(spacing.8))] bg-white z-40 overflow-y-auto">
          <nav className="container mx-auto px-4 py-2 sm:py-4 flex flex-col">
            {/* Main navigation */}
            <Link
              href="/hombre"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black font-medium border-b border-gray-100 active:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hombre
            </Link>
            <Link
              href="/mujer"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black font-medium border-b border-gray-100 active:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mujer
            </Link>
            <Link
              href="/ninos"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black font-medium border-b border-gray-100 active:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Niños
            </Link>
            <Link
              href="/marcas"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black font-medium border-b border-gray-100 active:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marcas
            </Link>
            <Link
              href="/ofertas"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-red font-semibold border-b border-gray-100 active:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ofertas
            </Link>

            {/* Secondary navigation */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <Link
                href="/wishlist"
                className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 active:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5" />
                Lista de Deseos
              </Link>

              {/* Auth section in mobile menu */}
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-brand-blue active:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShieldCheck className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}
                      <Link
                        href="/cuenta"
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 active:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        Mi Cuenta
                      </Link>
                      <button
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-red-600 w-full text-left active:bg-gray-50"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                      </button>
                </>
              ) : !isLoading ? (
                    <>
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 active:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        Iniciar Sesión
                      </Link>
                      <Link
                        href="/auth/registro"
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-brand-blue font-medium active:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        Registrarse
                      </Link>
                    </>
              ) : (
                <div className="py-2.5 text-sm text-gray-500">Cargando sesión...</div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Mobile Search Modal */}
      <MobileSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
