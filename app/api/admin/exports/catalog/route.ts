import { NextRequest, NextResponse } from 'next/server';
import {
  getProductExportRows,
  requireAdminExport,
  rowsToCatalogProducts,
} from '@/lib/exports/admin-data';
import { createCatalogPdf } from '@/lib/exports/pdf';
import { exportDateStamp } from '@/lib/exports/xlsx';

export const runtime = 'nodejs';

type CatalogType = 'mujer' | 'hombre' | 'ninos' | 'ofertas' | 'completo';

const catalogConfig: Record<CatalogType, { title: string; filename: string }> = {
  mujer: { title: 'Catálogo Mujer', filename: 'mujer' },
  hombre: { title: 'Catálogo Hombre', filename: 'hombre' },
  ninos: { title: 'Catálogo Niños', filename: 'ninos' },
  ofertas: { title: 'Catálogo de Ofertas', filename: 'ofertas' },
  completo: { title: 'Catálogo Completo', filename: 'completo' },
};

function isCatalogType(value: string | null): value is CatalogType {
  return Boolean(value && value in catalogConfig);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminExport();
  if (auth.error) return auth.error;

  const requestedType = request.nextUrl.searchParams.get('tipo');
  const catalogType: CatalogType = isCatalogType(requestedType) ? requestedType : 'completo';
  const config = catalogConfig[catalogType];

  try {
    const rows = await getProductExportRows(auth.db);
    const activeRows = rows.filter(({ product }) => product.status === 'active');
    const filteredRows = activeRows.filter(({ product }) => {
      if (catalogType === 'completo') return true;
      if (catalogType === 'ofertas') {
        return Number(product.compare_at_price || 0) > Number(product.base_price || 0);
      }
      return product.gender === catalogType;
    });

    const products = rowsToCatalogProducts(filteredRows);
    const file = await createCatalogPdf(products, {
      title: config.title,
      showPreviousPrice: catalogType === 'ofertas',
    });

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="catalogo-calle-ocho-${config.filename}-${exportDateStamp()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting catalog:', error);
    return NextResponse.json({ error: 'No se pudo exportar el catálogo.' }, { status: 500 });
  }
}
