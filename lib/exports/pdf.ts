import fs from 'node:fs/promises';
import path from 'node:path';

function escapePdfText(value: string): string {
  const replacements: Record<string, string> = {
    '–': '-',
    '—': '-',
    '“': '"',
    '”': '"',
    '‘': "'",
    '’': "'",
  };

  return Array.from(value)
    .map((char) => {
      const replacement = replacements[char] || char;
      const code = replacement.charCodeAt(0);

      if (replacement === '\\') return '\\\\';
      if (replacement === '(') return '\\(';
      if (replacement === ')') return '\\)';
      if (code < 32) return ' ';
      if (code <= 126) return replacement;
      if (code <= 255) return `\\${code.toString(8).padStart(3, '0')}`;

      return replacement.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '');
    })
    .join('');
}

function wrapText(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
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

function text(value: string, x: number, y: number, size = 10, font = 'F1', color = '#111827') {
  return [
    'BT',
    fillColor(color),
    `/${font} ${size} Tf`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${escapePdfText(value)}) Tj`,
    'ET',
  ].join('\n');
}

function fillColor(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`;
}

function strokeColor(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`;
}

function rect(x: number, y: number, width: number, height: number, color: string) {
  return `${fillColor(color)}\n${x} ${y} ${width} ${height} re\nf`;
}

function borderedRect(x: number, y: number, width: number, height: number, fill: string, stroke: string) {
  return [
    fillColor(fill),
    strokeColor(stroke),
    `${x} ${y} ${width} ${height} re`,
    'B',
  ].join('\n');
}

function getJpegDimensions(buffer: Buffer) {
  let index = 2;

  while (index < buffer.length) {
    if (buffer[index] !== 0xff) {
      index += 1;
      continue;
    }

    const marker = buffer[index + 1];
    const length = buffer.readUInt16BE(index + 2);

    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(index + 5),
        width: buffer.readUInt16BE(index + 7),
      };
    }

    index += 2 + length;
  }

  return null;
}

async function fetchJpeg(url?: string | null) {
  if (!url) return null;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    const buffer = Buffer.from(await response.arrayBuffer());
    const looksLikeJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;

    if (!contentType.includes('jpeg') && !contentType.includes('jpg') && !looksLikeJpeg) {
      return null;
    }

    const dimensions = getJpegDimensions(buffer);
    if (!dimensions) return null;

    return { buffer, ...dimensions };
  } catch {
    return null;
  }
}

interface PdfImage {
  name: string;
  buffer: Buffer;
  width: number;
  height: number;
}

export interface CatalogPdfProduct {
  name: string;
  brand: string;
  sku: string;
  price: string;
  previousPrice?: string | null;
  status: string;
  imageUrl?: string | null;
  variants: string[];
}

interface PreparedProduct extends CatalogPdfProduct {
  image?: PdfImage;
}

function drawImage(image: PdfImage, x: number, y: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const drawX = x + (boxWidth - width) / 2;
  const drawY = y + (boxHeight - height) / 2;

  return [
    'q',
    `${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm`,
    `/${image.name} Do`,
    'Q',
  ].join('\n');
}

function drawHeader(pageNumber: number, totalPages: number, title: string) {
  return [
    rect(0, 742, 612, 50, '#111827'),
    rect(0, 735, 612, 7, '#1d4ed8'),
    text('calleOCHO', 42, 762, 22, 'F2', '#ffffff'),
    text(title, 172, 766, 12, 'F1', '#bfdbfe'),
    text(`Página ${pageNumber} de ${totalPages}`, 500, 766, 9, 'F1', '#bfdbfe'),
  ].join('\n');
}

function drawFooter() {
  return [
    strokeColor('#e5e7eb'),
    '42 42 528 0 m',
    'S',
    text('Precios y disponibilidad sujetos a cambios. Contáctanos para cotizaciones empresariales.', 42, 28, 8, 'F1', '#6b7280'),
    text('WhatsApp: 5249-8898  |  Correo: pedidos@calleochostore.com', 42, 16, 8, 'F2', '#1d4ed8'),
  ].join('\n');
}

function drawProductCard(product: PreparedProduct, index: number, showPreviousPrice = false) {
  const cardX = 42;
  const cardY = 520 - index * 178;
  const cardW = 528;
  const cardH = 160;
  const imageX = cardX + 16;
  const imageY = cardY + 18;
  const imageW = 120;
  const imageH = 120;
  const textX = cardX + 164;
  const topY = cardY + 126;
  const variants = product.variants.slice(0, 8).join('  |  ');
  const variantLines = wrapText(variants, 58).slice(0, 3);

  const commands = [
    borderedRect(cardX, cardY, cardW, cardH, '#ffffff', '#dbeafe'),
    rect(cardX, cardY + cardH - 8, cardW, 8, '#2563eb'),
    borderedRect(imageX, imageY, imageW, imageH, '#f3f4f6', '#e5e7eb'),
  ];

  if (product.image) {
    commands.push(drawImage(product.image, imageX + 4, imageY + 4, imageW - 8, imageH - 8));
  } else {
    commands.push(text('Imagen', imageX + 43, imageY + 70, 10, 'F2', '#6b7280'));
    commands.push(text('no disponible', imageX + 29, imageY + 54, 9, 'F1', '#6b7280'));
  }

  commands.push(text(product.brand.toUpperCase(), textX, topY, 9, 'F2', '#2563eb'));
  for (const [lineIndex, line] of wrapText(product.name, 44).slice(0, 2).entries()) {
    commands.push(text(line, textX, topY - 20 - lineIndex * 15, 14, 'F2'));
  }

  if (showPreviousPrice && product.previousPrice) {
    commands.push(text(`Antes: ${product.previousPrice}`, textX, cardY + 92, 9, 'F1', '#6b7280'));
    commands.push(text(`Oferta: ${product.price}`, textX, cardY + 72, 16, 'F2', '#b91c1c'));
  } else {
    commands.push(text(product.price, textX, cardY + 78, 16, 'F2', '#111827'));
  }
  commands.push(text(`SKU: ${product.sku || 'N/D'}`, textX, cardY + 56, 9, 'F1', '#4b5563'));
  commands.push(rect(textX, cardY + 36, 88, 18, '#dcfce7'));
  commands.push(text('DISPONIBLE', textX + 12, cardY + 42, 8, 'F2', '#166534'));

  commands.push(text('Tallas disponibles:', textX + 112, cardY + 45, 9, 'F2', '#111827'));
  variantLines.forEach((line, lineIndex) => {
    commands.push(text(line, textX + 112, cardY + 29 - lineIndex * 12, 8, 'F1', '#374151'));
  });

  return commands.join('\n');
}

async function prepareProducts(products: CatalogPdfProduct[]): Promise<PreparedProduct[]> {
  const productsWithStock = products.filter((product) => product.variants.length > 0);

  return Promise.all(
    productsWithStock.map(async (product, index) => {
      const image = await fetchJpeg(product.imageUrl);

      return {
        ...product,
        image: image
          ? {
              name: `Im${index + 1}`,
              ...image,
            }
          : undefined,
      };
    })
  );
}

async function loadLogoJpeg(): Promise<PdfImage | null> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public', 'logo.jpg'));
    const dimensions = getJpegDimensions(file);
    if (!dimensions) return null;

    return {
      name: 'Logo',
      buffer: file,
      ...dimensions,
    };
  } catch {
    return null;
  }
}

function buildPdf(pages: string[], images: PdfImage[]): Buffer {
  const objects: Buffer[] = [];
  const pageObjectIds: number[] = [];
  const fontRegularId = 3;
  const fontBoldId = 4;
  const imageObjectIds = new Map<string, number>();

  objects[0] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>');
  objects[1] = Buffer.from('');
  objects[2] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects[3] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  let nextObjectId = 5;

  for (const image of images) {
    const imageId = nextObjectId++;
    imageObjectIds.set(image.name, imageId);
    objects[imageId - 1] = Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.buffer.length} >>\nstream\n`
      ),
      image.buffer,
      Buffer.from('\nendstream'),
    ]);
  }

  for (const content of pages) {
    const pageId = nextObjectId++;
    const contentId = nextObjectId++;
    pageObjectIds.push(pageId);

    const xObjects = Array.from(imageObjectIds.entries())
      .map(([name, id]) => `/${name} ${id} 0 R`)
      .join(' ');
    const resources = [
      `/Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >>`,
      xObjects ? `/XObject << ${xObjects} >>` : '',
    ]
      .filter(Boolean)
      .join(' ');

    objects[pageId - 1] = Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << ${resources} >> /Contents ${contentId} 0 R >>`
    );
    objects[contentId - 1] = Buffer.from(
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
    );
  }

  objects[1] = Buffer.from(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  );

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets: number[] = [0];
  let offset = chunks[0].length;

  objects.forEach((object, index) => {
    const header = Buffer.from(`${index + 1} 0 obj\n`);
    const footer = Buffer.from('\nendobj\n');
    offsets.push(offset);
    chunks.push(header, object, footer);
    offset += header.length + object.length + footer.length;
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

  chunks.push(Buffer.from(xref));
  return Buffer.concat(chunks);
}

export async function createCatalogPdf(
  products: CatalogPdfProduct[],
  options: { title?: string; showPreviousPrice?: boolean } = {}
): Promise<Buffer> {
  const title = options.title || 'Catálogo Completo';
  const preparedProducts = await prepareProducts(products);
  const logo = await loadLogoJpeg();
  const allImages = [
    ...(logo ? [logo] : []),
    ...preparedProducts.map((product) => product.image).filter((image): image is PdfImage => Boolean(image)),
  ];

  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(preparedProducts.length / perPage));
  const pages: string[] = [];

  if (preparedProducts.length === 0) {
    pages.push(
      [
        drawHeader(1, 1, title),
        rect(42, 560, 528, 120, '#eff6ff'),
        text('No hay productos con stock disponible para catálogo.', 78, 620, 16, 'F2', '#111827'),
        text('Agrega stock a una talla para incluir el calzado en el PDF comercial.', 78, 596, 11, 'F1', '#374151'),
        drawFooter(),
      ].join('\n')
    );
  } else {
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const pageProducts = preparedProducts.slice(pageIndex * perPage, pageIndex * perPage + perPage);
      const commands = [
        drawHeader(pageIndex + 1, totalPages, title),
        rect(42, 704, 528, 24, '#eff6ff'),
        text('Productos disponibles para venta empresarial', 58, 712, 11, 'F2', '#1d4ed8'),
      ];

      if (logo) {
        commands.push(drawImage(logo, 492, 744, 54, 38));
      }

      pageProducts.forEach((product, index) => {
        commands.push(drawProductCard(product, index, options.showPreviousPrice));
      });

      commands.push(drawFooter());
      pages.push(commands.join('\n'));
    }
  }

  return buildPdf(pages, allImages);
}
