import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CatalogExportButtonsProps {
  compact?: boolean;
}

export function CatalogExportButtons({ compact = false }: CatalogExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/api/admin/exports/catalog" className={compact ? 'w-full sm:w-auto' : 'w-full sm:w-auto'}>
        <Button variant="outline" size={compact ? 'sm' : 'default'} className="w-full sm:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          {compact ? 'Catálogo' : 'PDF catálogo completo'}
        </Button>
      </Link>
    </div>
  );
}
