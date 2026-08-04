'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);

    const supabase = createClient();

    const { error } = await (supabase as any).rpc('admin_archive_product', {
      p_product_id: productId,
    });

    if (error) {
      console.error('Error deleting product:', error);
      alert('No se pudo archivar el producto.');
      setIsDeleting(false);
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Archive className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Archivar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{productName}</strong> dejará de mostrarse y sus variantes quedarán sin disponibilidad.
            {'\n\n'}
            El historial de pedidos y la información del producto se conservarán.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Archivando...
              </>
            ) : (
              'Archivar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
