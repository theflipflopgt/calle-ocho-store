function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function normalizePdfText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '');
}

function wrapText(value: string, maxLength: number): string[] {
  const words = normalizePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

interface PdfLine {
  text: string;
  size?: number;
  gapAfter?: number;
}

function pageContent(lines: PdfLine[]) {
  let y = 790;
  const commands = ['BT', '/F1 11 Tf'];

  for (const line of lines) {
    const size = line.size || 10;
    commands.push(`/F1 ${size} Tf`);
    commands.push(`1 0 0 1 48 ${y} Tm`);
    commands.push(`(${escapePdfText(normalizePdfText(line.text))}) Tj`);
    y -= line.gapAfter || Math.max(size + 5, 14);
  }

  commands.push('ET');
  return commands.join('\n');
}

export interface CatalogPdfProduct {
  name: string;
  brand: string;
  sku: string;
  price: string;
  status: string;
  variants: string[];
}

export function createCatalogPdf(products: CatalogPdfProduct[]): Buffer {
  const pages: PdfLine[][] = [];
  let current: PdfLine[] = [
    { text: 'Calle Ocho Store - Catalogo de productos', size: 18, gapAfter: 24 },
    { text: `Generado: ${new Date().toLocaleDateString('es-GT')}`, size: 10, gapAfter: 22 },
  ];
  let lineCount = current.length;

  const pushLine = (line: PdfLine) => {
    if (lineCount >= 42) {
      pages.push(current);
      current = [];
      lineCount = 0;
    }
    current.push(line);
    lineCount += line.gapAfter && line.gapAfter > 18 ? 2 : 1;
  };

  for (const product of products) {
    pushLine({ text: product.name, size: 13, gapAfter: 16 });
    pushLine({
      text: `${product.brand} | SKU: ${product.sku} | ${product.price} | ${product.status}`,
      size: 10,
    });

    const variants = product.variants.length > 0 ? product.variants.join(', ') : 'Sin tallas disponibles';
    for (const line of wrapText(`Tallas: ${variants}`, 88)) {
      pushLine({ text: line, size: 9 });
    }
    pushLine({ text: ' ', size: 6, gapAfter: 10 });
  }

  if (current.length > 0) pages.push(current);

  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const fontObjectId = 3;

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = '';
  objects[2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let nextObjectId = 4;
  for (const page of pages) {
    const pageId = nextObjectId;
    const contentId = nextObjectId + 1;
    pageObjectIds.push(pageId);

    const content = pageContent(page);
    objects[pageId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] =
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`;
    nextObjectId += 2;
  }

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;

  const chunks: string[] = ['%PDF-1.4\n'];
  const offsets: number[] = [0];
  let offset = Buffer.byteLength(chunks[0], 'utf8');

  objects.forEach((object, index) => {
    const entry = `${index + 1} 0 obj\n${object}\nendobj\n`;
    offsets.push(offset);
    chunks.push(entry);
    offset += Buffer.byteLength(entry, 'utf8');
  });

  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((item) => `${String(item).padStart(10, '0')} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    '%%EOF',
  ].join('\n');

  return Buffer.from(chunks.join('') + xref, 'utf8');
}
