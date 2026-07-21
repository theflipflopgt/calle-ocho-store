'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Package, MapPin, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Mi Perfil', href: '/cuenta', icon: User },
  { name: 'Mis Pedidos', href: '/cuenta/pedidos', icon: Package },
  { name: 'Direcciones', href: '/cuenta/direcciones', icon: MapPin },
  { name: 'Lista de Deseos', href: '/wishlist', icon: Heart },
];

export default function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/cuenta');
    }
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (isLoading || !user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="h-64 bg-gray-200 rounded" />
            <div className="lg:col-span-3 h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-black mb-6 sm:mb-8">
        Mi Cuenta
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Sidebar Navigation */}
        <aside className="relative z-10 lg:col-span-1">
          <nav className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/cuenta' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-gray-50 last:border-b-0 transition-colors",
                    isActive
                      ? "bg-brand-blue/10 text-brand-blue border-l-2 border-l-brand-blue"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-brand-black dark:hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="relative z-0 lg:col-span-3">{children}</div>
      </div>
    </main>
  );
}
