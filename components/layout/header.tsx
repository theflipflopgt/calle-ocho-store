'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { LayoutDashboard, Menu, X, ShoppingCart, User, Heart, Truck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderSearchForm, MobileSearchButton, MobileSearchModal } from '@/components/search/header-search';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, profile, isLoading, signOut } = useAuth();
  const { itemCount, openCart } = useCart();
  const isAdmin = profile?.role === 'admin';

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
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50 transition-colors">
      {/* Free Shipping Banner - smaller on mobile */}
      <div className="bg-brand-black dark:bg-gray-950 text-white py-1.5 sm:py-2 text-center">
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2">
          <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-[11px] sm:text-sm truncate">ENVÍO GRATIS en compras mayores a Q1,500</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 h-20 sm:h-24 md:h-24">
          {/* Logo - dark/light variants */}
          <Link href="/" className="flex-shrink-0" aria-label="Ir al inicio">
            <Image
              src="/logo.png"
              alt="Calle Ocho Store"
              width={180}
              height={60}
              className="h-[52px] w-[156px] object-contain sm:h-[60px] sm:w-[180px] dark:hidden"
              priority
            />
            <Image
              src="/logo-light.png"
              alt="Calle Ocho Store"
              width={180}
              height={60}
              className="hidden h-[52px] w-[156px] object-contain sm:h-[60px] sm:w-[180px] dark:block"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-7 text-sm ml-8">
            <Link href="/hombre" className="text-brand-black dark:text-white hover:text-brand-blue dark:hover:text-brand-blue transition-colors font-medium">
              Hombre
            </Link>
            <Link href="/mujer" className="text-brand-black dark:text-white hover:text-brand-blue dark:hover:text-brand-blue transition-colors font-medium">
              Mujer
            </Link>
            <Link href="/ninos" className="text-brand-black dark:text-white hover:text-brand-blue dark:hover:text-brand-blue transition-colors font-medium">
              Niños
            </Link>
            <Link href="/marcas" className="text-brand-black dark:text-white hover:text-brand-blue dark:hover:text-brand-blue transition-colors font-medium">
              Marcas
            </Link>
            <Link href="/ofertas" className="text-brand-red dark:text-brand-orange font-semibold">
              Ofertas
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <HeaderSearchForm />

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1 md:gap-2">
            {/* Search Icon - Mobile */}
            <MobileSearchButton onClick={() => setSearchOpen(true)} />

            {/* Theme Toggle - Desktop only */}
            <div className="hidden sm:flex">
              <ThemeToggle />
            </div>

            {/* Wishlist - hidden on mobile, show on tablet+ */}
            <Link href="/wishlist">
              <Button size="icon" variant="ghost" className="hidden sm:flex text-brand-black dark:text-white w-9 h-9 sm:w-10 sm:h-10">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Button
              size="icon"
              variant="ghost"
              className="relative text-brand-black dark:text-white w-9 h-9 sm:w-10 sm:h-10"
              onClick={openCart}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-brand-blue text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>

            {/* User access - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {isLoading ? (
                <Button variant="ghost" size="icon" className="text-brand-black dark:text-white" disabled>
                  <User className="h-5 w-5" />
                </Button>
              ) : user ? (
                <>
                  {isAdmin && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="inline-flex gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                    >
                      <Link href="/admin">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden md:inline">Panel Admin</span>
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" className="gap-2 text-brand-black dark:text-white">
                    <Link href="/cuenta" aria-label="Ir a mi cuenta">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden md:inline text-sm">Hola, {displayName}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 dark:text-red-400"
                    onClick={handleSignOut}
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="gap-2 text-brand-black dark:text-white">
                    <Link href="/auth/login">
                      <User className="h-4 w-4" />
                      <span className="hidden md:inline">Entrar</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-brand-black dark:bg-brand-blue hover:bg-gray-800 dark:hover:bg-blue-700 text-white hidden md:inline-flex">
                    <Link href="/auth/registro">Registrarse</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden text-brand-black dark:text-white w-9 h-9 sm:w-10 sm:h-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full screen overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[calc(theme(spacing.16)+theme(spacing.7))] sm:top-[calc(theme(spacing.20)+theme(spacing.8))] bg-white dark:bg-gray-900 z-40 overflow-y-auto">
          <nav className="container mx-auto px-4 py-2 sm:py-4 flex flex-col">
            {/* Main navigation */}
            <Link
              href="/hombre"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black dark:text-white font-medium border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hombre
            </Link>
            <Link
              href="/mujer"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black dark:text-white font-medium border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mujer
            </Link>
            <Link
              href="/ninos"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black dark:text-white font-medium border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Niños
            </Link>
            <Link
              href="/marcas"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-black dark:text-white font-medium border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marcas
            </Link>
            <Link
              href="/ofertas"
              className="py-3 sm:py-4 text-base sm:text-lg text-brand-red dark:text-brand-orange font-semibold border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ofertas
            </Link>

            {/* Secondary navigation */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/wishlist"
                className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5" />
                Lista de Deseos
              </Link>

              {/* Auth section in mobile menu */}
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-brand-blue font-medium active:bg-gray-50 dark:active:bg-gray-800"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Panel Admin
                        </Link>
                      )}
                      <Link
                        href="/cuenta"
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        Mi Cuenta
                      </Link>
                      <button
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-red-600 dark:text-red-400 w-full text-left active:bg-gray-50 dark:active:bg-gray-800"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        Iniciar Sesión
                      </Link>
                      <Link
                        href="/auth/registro"
                        className="flex items-center gap-3 py-2.5 sm:py-3 text-sm sm:text-base text-brand-blue font-medium active:bg-gray-50 dark:active:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        Registrarse
                      </Link>
                    </>
                  )}
                </>
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
