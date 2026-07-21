'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Home,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers,
  ImageIcon,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Inicio', href: '/admin/inicio', icon: Home },
  { name: 'Hero Carousel', href: '/admin/hero-carousel', icon: Sparkles },
  {
    name: 'Productos',
    icon: Package,
    children: [
      { name: 'Todos los productos', href: '/admin/productos' },
      { name: 'Crear producto', href: '/admin/productos/nuevo' },
      { name: 'Inventario', href: '/admin/productos/inventario' },
    ],
  },
  { name: 'Órdenes', href: '/admin/ordenes', icon: ShoppingCart },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Marcas', href: '/admin/marcas', icon: Layers },
  { name: 'Categorías', href: '/admin/categorias', icon: Tag },
  { name: 'Cupones', href: '/admin/cupones', icon: Ticket },
  { name: 'Media', href: '/admin/media', icon: ImageIcon },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Productos']);
  const pathname = usePathname();
  const { user, profile, signOut, isLoading } = useAuth();

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const NavItem = ({ item }: { item: (typeof navigation)[0] }) => {
    const hasChildren = 'children' in item && item.children;
    const isExpanded = expandedItems.includes(item.name);
    const active = hasChildren
      ? item.children?.some((child) => isActive(child.href))
      : isActive(item.href!);

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleExpand(item.name)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              active
                ? 'bg-gray-100 text-brand-black'
                : 'text-gray-600 hover:bg-gray-50 hover:text-brand-black'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {item.name}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </button>
          {isExpanded && (
            <div className="mt-1 ml-8 space-y-1">
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'block px-3 py-2 text-sm rounded-lg transition-colors',
                    isActive(child.href)
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-black'
                  )}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href!}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          active
            ? 'bg-brand-blue text-white'
            : 'text-gray-600 hover:bg-gray-50 hover:text-brand-black'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] sm:w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">TF</span>
            </div>
            <span className="font-semibold text-brand-black text-sm sm:text-base truncate">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-1 overflow-y-auto h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)]">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-200 bg-white">
          {isLoading && !user ? (
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-blue rounded-full flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-medium">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-brand-black truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                  {profile?.email || user?.email || 'Sesión activa'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={async () => {
              try {
                await signOut();
                // Force full page reload to clear all cached state
                window.location.href = '/';
              } catch (err) {
                console.error('Error en signOut:', err);
                window.location.href = '/';
              }
            }}
            disabled={isLoading && !user}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Admin Panel
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs sm:text-sm text-gray-600 hover:text-brand-black"
            >
              Ver tienda →
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
