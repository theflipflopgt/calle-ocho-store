import { NextResponse } from 'next/server';
import {
  getProductExportRows,
  requireAdminExport,
  rowsToCatalogProducts,
} from '@/lib/exports/admin-data';
import { createCatalogPdf } from '@/lib/exports/pdf';
import { exportDateStamp } from '@/lib/exports/xlsx';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdminExport();
  if (auth.error) return auth.error;

  try {
    const rows = await getProductExportRows(auth.db);
    const activeRows = rows.filter(({ product }) => product.status === 'active');
    const products = rowsToCatalogProducts(activeRows);
    const file = await createCatalogPdf([], {
      title: 'Catálogo Completo',
      sections: [
        {
          title: 'Mujer',
          products: products.filter((product) => product.gender === 'mujer'),
        },
        {
          title: 'Hombre',
          products: products.filter((product) => product.gender === 'hombre'),
        },
        {
          title: 'Niños',
          products: products.filter((product) => product.gender === 'ninos'),
        },
        {
          title: 'Ofertas',
          products: products.filter((product) => product.isOffer),
          showPreviousPrice: true,
        },
      ],
    });

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="catalogo-calle-ocho-completo-${exportDateStamp()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting catalog:', error);
    return NextResponse.json({ error: 'No se pudo exportar el catálogo.' }, { status: 500 });
  }
}
