'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
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

  const handleDelete = async () => {
    setIsDeleting(true);

    const supabase = createClient();

    // Delete in order: images -> colors -> variants -> tags -> product
    // Due to foreign key constraints

    // First, get all color IDs
    const { data: colors } = await supabase
      .from('product_colors')
      .select('id')
      .eq('product_id', productId);

    if (colors && colors.length > 0) {
      const colorIds = colors.map((c) => c.id);

      // Delete images
      await supabase
        .from('product_color_images')
        .delete()
        .in('product_color_id', colorIds);

      // Delete variants
      await supabase
        .from('product_variants')
        .delete()
        .in('product_color_id', colorIds);

      // Delete colors
      await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', productId);
    }

    // Delete product tags
    await supabase
      .from('product_tags')
      .delete()
      .eq('product_id', productId);

    // Delete wishlists
    await supabase
      .from('wishlists')
      .delete()
      .eq('product_id', productId);

    // Finally, delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto. Puede que tenga órdenes asociadas.');
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
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar <strong>{productName}</strong> y todos sus colores, variantes e imágenes asociadas.
            {'\n\n'}
            Esta acción no se puede deshacer.
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
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
