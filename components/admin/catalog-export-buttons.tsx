import Link from 'next/link';
import { FileText, Percent, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const catalogs = [
  { type: 'mujer', label: 'Mujer', icon: Users },
  { type: 'hombre', label: 'Hombre', icon: Users },
  { type: 'ninos', label: 'Niños', icon: Users },
  { type: 'ofertas', label: 'Ofertas', icon: Percent },
  { type: 'completo', label: 'Completo', icon: FileText },
] as const;

interface CatalogExportButtonsProps {
  compact?: boolean;
}

export function CatalogExportButtons({ compact = false }: CatalogExportButtonsProps) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap' : 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'}>
      {catalogs.map(({ type, label, icon: Icon }) => (
        <Link
          key={type}
          href={`/api/admin/exports/catalog?tipo=${type}`}
          className={compact ? 'w-full sm:w-auto' : 'w-full sm:w-auto'}
        >
          <Button variant="outline" size={compact ? 'sm' : 'default'} className="w-full sm:w-auto">
            <Icon className="mr-2 h-4 w-4" />
            {compact ? label : `PDF ${label}`}
          </Button>
        </Link>
      ))}
    </div>
  );
}
