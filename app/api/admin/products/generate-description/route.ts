import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { generateProductDescription } from '@/lib/products/product-description';

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  try {
    const description = generateProductDescription({
      name: body?.name,
      brand: body?.brand,
      category: body?.category,
      color: body?.color,
      gender: body?.gender,
    });

    return NextResponse.json({ description });
  } catch (error) {
    if (error instanceof Error && error.message === 'PRODUCT_NAME_REQUIRED') {
      return NextResponse.json(
        { error: 'Escribe primero el nombre del producto.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'No se pudo generar la descripción.' },
      { status: 500 }
    );
  }
}
