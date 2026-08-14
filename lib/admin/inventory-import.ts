import { inflateRawSync } from 'zlib';
import { createXlsx, type XlsxCell } from '@/lib/exports/xlsx';
import { calculateFinalPrice as calculateCommercialPrice } from '@/lib/pricing/calculate-final-price';
import { generateBaseSKU, generateSlug } from '@/lib/utils/slug';

export const INVENTORY_IMPORT_COLUMNS = [
  'codigo_producto',
  'nombre',
  'marca',
  'seccion',
  'categoria',
  'descripcion',
  'talla_us',
  'talla_eu',
  'talla_uk',
  'talla_cm',
  'color',
  'codigo_color',
  'sku_variante',
  'costo',
  'porcentaje_factura',
  'porcentaje_neo_link',
  'ganancia_deseada',
  'precio_base',
  'precio_final_calculado',
  'precio_anterior',
  'precio_especial_talla',
  'stock',
  'stock_minimo',
  'warehouse',
  'link_imagen_cloudinary',
  'estado',
] as const;

type InventoryImportColumn = (typeof INVENTORY_IMPORT_COLUMNS)[number];

export interface InventoryImportPreviewRow {
  rowNumber: number;
  raw: Record<string, string | number | null>;
  normalized: Record<string, string | number | boolean | null>;
  action: 'create_product' | 'update_product' | 'update_variant' | 'skip';
  errors: string[];
  warnings: string[];
}

interface ReferenceData {
  productsBySku: Map<string, any>;
  productsBySlug: Map<string, any>;
  brandsByName: Map<string, any>;
  categoriesByName: Map<string, any>;
  variantsBySku: Map<string, any>;
}

const REQUIRED_COLUMNS: InventoryImportColumn[] = [
  'nombre',
  'marca',
  'seccion',
  'categoria',
  'talla_us',
  'color',
  'stock',
  'link_imagen_cloudinary',
];

const VALID_SECTIONS = new Set(['calzado', 'hombre', 'mujer', 'ninos', 'unisex']);
const VALID_STATUSES = new Set(['draft', 'active', 'archived']);

function xmlDecode(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function normalizeKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function normalizedKey(value: string) {
  return normalizeKey(value);
}

function columnIndex(cellRef: string) {
  const letters = cellRef.replace(/[0-9]/g, '');
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }
  return index - 1;
}

function unzipXlsx(buffer: Buffer) {
  const entries: { name: string; content: Buffer }[] = [];
  let offset = 0;

  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    if (!name.endsWith('/')) {
      const content = compression === 8 ? inflateRawSync(compressed) : Buffer.from(compressed);
      entries.push({ name, content });
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

function readSharedStrings(xml?: string) {
  if (!xml) return [];
  return [...xml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((match) => {
    const parts = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((text) => text[1]);
    return xmlDecode(parts.join(''));
  });
}

function parseWorksheet(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];

  for (const rowMatch of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowIndex = Number(rowMatch[1]) - 1;
    const cells: string[] = [];

    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] || '';
      const ref = attrs.match(/r="([^"]+)"/)?.[1] || '';
      const type = attrs.match(/t="([^"]+)"/)?.[1] || '';
      const index = columnIndex(ref);

      if (type === 'inlineStr') {
        cells[index] = xmlDecode(body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || '');
      } else {
        const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || '';
        cells[index] = type === 's' ? sharedStrings[Number(rawValue)] || '' : xmlDecode(rawValue);
      }
    }

    rows[rowIndex] = cells;
  }

  return rows.filter(Boolean);
}

export function parseInventoryWorkbook(buffer: Buffer) {
  const entries = unzipXlsx(buffer);
  const entryMap = new Map(entries.map((entry) => [entry.name, entry.content.toString('utf8')]));
  const sharedStrings = readSharedStrings(entryMap.get('xl/sharedStrings.xml'));
  const worksheet = entryMap.get('xl/worksheets/sheet1.xml');

  if (!worksheet) {
    throw new Error('El Excel no contiene una hoja valida.');
  }

  return parseWorksheet(worksheet, sharedStrings);
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isNumericValue(value: unknown) {
  const text = cleanText(value);
  return text !== '' && Number.isFinite(Number(text.replace(',', '.')));
}

function toMoney(value: unknown) {
  return Math.round(toNumber(value) * 100) / 100;
}

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeSection(value: unknown) {
  const section = normalizeKey(value);
  if (section === 'caballero') return 'hombre';
  if (section === 'dama') return 'mujer';
  if (section === 'niños') return 'ninos';
  return section || 'unisex';
}

function colorSuffix(value: string) {
  return normalizeKey(value).slice(0, 4).toUpperCase() || 'CLR';
}

function calculateFinalPrice(row: Record<string, string | number | null>) {
  return (
    calculateCommercialPrice(
      toMoney(row.costo),
      toMoney(row.ganancia_deseada ?? row.porcentaje_margen),
      toNumber(row.porcentaje_neo_link),
      toNumber(row.porcentaje_factura)
    ) ?? 0
  );
}

export function createInventoryTemplate() {
  const rows: XlsxCell[][] = [
    [...INVENTORY_IMPORT_COLUMNS],
    [
      'CO-0001',
      'Nike Air Max Negro',
      'Nike',
      'hombre',
      'Sneakers',
      'Descripcion breve del producto',
      9,
      42,
      8.5,
      27,
      'Negro',
      '#000000',
      'CO-0001-NEG-9',
      500,
      5,
      4,
      100,
      500,
      '',
      '',
      '',
      4,
      2,
      'Principal',
      'https://res.cloudinary.com/tu-cloud/image/upload/v1/producto.jpg',
      'active',
    ],
    [],
    ['Opciones validas'],
    ['seccion', 'hombre, mujer, ninos, unisex, calzado'],
    ['estado', 'draft, active, archived'],
    ['warehouse', 'Principal, Bodega 1, Bodega 2'],
    ['nota', 'Cada fila representa una talla/variante. Repite el producto para cargar varias tallas.'],
  ];

  return createXlsx(rows);
}

export async function getInventoryReferenceData(db: any): Promise<ReferenceData> {
  const [{ data: products }, { data: brands }, { data: categories }, { data: variants }] =
    await Promise.all([
      db.from('products').select('id, sku, slug, name'),
      db.from('brands').select('id, name, slug'),
      db.from('categories').select('id, name, slug'),
      db.from('product_variants').select('id, sku, product_id, product_color_id'),
    ]);

  return {
    productsBySku: new Map((products || []).map((item: any) => [item.sku, item])),
    productsBySlug: new Map((products || []).map((item: any) => [item.slug, item])),
    brandsByName: new Map((brands || []).map((item: any) => [normalizeKey(item.name), item])),
    categoriesByName: new Map((categories || []).map((item: any) => [normalizeKey(item.name), item])),
    variantsBySku: new Map((variants || []).map((item: any) => [item.sku, item])),
  };
}

export function normalizeInventoryRows(rows: string[][], refs: ReferenceData): InventoryImportPreviewRow[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => normalizeKey(header));
  const previews: InventoryImportPreviewRow[] = [];
  const uploadedVariantSkus = new Map<string, number>();
  const uploadedProductStates = new Map<string, { status: string; finalPrice: number; rowNumber: number }>();
  const uploadedColorImages = new Map<string, Set<string>>();

  rows.slice(1).forEach((cells, index) => {
    const raw: Record<string, string | number | null> = {};

    headers.forEach((header, cellIndex) => {
      if (!header) return;
      raw[header] = cleanText(cells[cellIndex]);
    });

    if (Object.values(raw).every((value) => cleanText(value) === '')) return;
    if (cleanText(raw.codigo_producto) === 'Opciones validas') return;
    if (['seccion', 'estado', 'warehouse', 'nota'].includes(cleanText(raw.codigo_producto))) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const column of REQUIRED_COLUMNS) {
      if (!cleanText(raw[column])) errors.push(`Falta ${column}.`);
    }

    const name = cleanText(raw.nombre);
    const productSku = cleanText(raw.codigo_producto) || generateBaseSKU(name);
    const slug = generateSlug(name);
    const section = normalizeSection(raw.seccion);
    const status = cleanText(raw.estado) || 'draft';
    const colorName = cleanText(raw.color);
    const skuSuffix = colorSuffix(colorName);
    const variantSku =
      cleanText(raw.sku_variante) ||
      `${productSku}-${skuSuffix}-${cleanText(raw.talla_us)}`.toUpperCase();
    const imageUrl = cleanText(raw.link_imagen_cloudinary);
    const finalPrice = calculateFinalPrice(raw);
    const providedFinalPrice = toMoney(raw.precio_final_calculado);
    const desiredProfit = toMoney(raw.ganancia_deseada ?? raw.porcentaje_margen);
    const stock = Math.floor(toNumber(raw.stock));
    const lowStockThreshold = Math.floor(toNumber(raw.stock_minimo, 5));
    const compareAtPrice = toMoney(raw.precio_anterior);
    const specialPrice = toMoney(raw.precio_especial_talla);
    const normalizedVariantSku = variantSku.toUpperCase();
    const normalizedProductSku = productSku.toUpperCase();
    const currentRowNumber = index + 2;

    if (!VALID_SECTIONS.has(section)) errors.push('La seccion no coincide con las opciones permitidas.');
    if (!VALID_STATUSES.has(status)) errors.push('Estado invalido.');
    if (!isNumericValue(raw.talla_us)) errors.push('La talla US debe ser numerica.');
    if (!isNumericValue(raw.stock)) errors.push('El stock debe ser numerico.');
    if (cleanText(raw.precio_final_calculado) && !isNumericValue(raw.precio_final_calculado)) {
      errors.push('El precio final debe ser numerico.');
    }
    if (providedFinalPrice > 0 && Math.abs(providedFinalPrice - finalPrice) > 0.01) {
      errors.push('El precio final no coincide con el calculo comercial.');
    }
    if (toNumber(raw.talla_us) <= 0) errors.push('La talla US debe ser mayor a 0.');
    if (stock < 0) errors.push('El stock no puede ser negativo.');
    if (lowStockThreshold < 0) errors.push('El stock minimo no puede ser negativo.');
    if (finalPrice <= 0) errors.push('El precio final debe ser mayor a 0.');
    if (compareAtPrice < 0) errors.push('El precio anterior no puede ser negativo.');
    if (compareAtPrice > 0 && compareAtPrice <= finalPrice) {
      errors.push('El precio anterior debe ser mayor que el precio final.');
    }
    if (specialPrice < 0) errors.push('El precio especial por talla no puede ser negativo.');
    if (toNumber(raw.costo) < 0) errors.push('El costo no puede ser negativo.');
    if (toNumber(raw.porcentaje_factura) < 0) errors.push('El porcentaje de factura no puede ser negativo.');
    if (toNumber(raw.porcentaje_neo_link) < 0) errors.push('El porcentaje de Neo Link no puede ser negativo.');
    if (desiredProfit < 0) errors.push('La ganancia deseada no puede ser negativa.');
    if (toNumber(raw.porcentaje_factura) + toNumber(raw.porcentaje_neo_link) >= 100) {
      errors.push('La suma de factura y Neo Link debe ser menor al 100 %.');
    }

    const colorImageKey = `${normalizedProductSku}:${normalizeKey(colorName)}`;
    const colorImages = uploadedColorImages.get(colorImageKey) || new Set<string>();
    if (imageUrl) colorImages.add(imageUrl);
    uploadedColorImages.set(colorImageKey, colorImages);
    if (colorImages.size > 5) {
      errors.push('Cada color puede tener un maximo de 5 imagenes diferentes.');
    }

    const previousVariantRow = uploadedVariantSkus.get(normalizedVariantSku);
    if (previousVariantRow) {
      errors.push(`El SKU de variante esta repetido en las filas ${previousVariantRow} y ${currentRowNumber}.`);
    } else {
      uploadedVariantSkus.set(normalizedVariantSku, currentRowNumber);
    }

    const previousProductState = uploadedProductStates.get(normalizedProductSku);
    if (
      previousProductState &&
      (previousProductState.status !== status || previousProductState.finalPrice !== finalPrice)
    ) {
      errors.push(
        `El estado y el precio final deben coincidir con la fila ${previousProductState.rowNumber} del mismo producto.`
      );
    } else if (!previousProductState) {
      uploadedProductStates.set(normalizedProductSku, { status, finalPrice, rowNumber: currentRowNumber });
    }
    if (imageUrl && !/^https:\/\/res\.cloudinary\.com\//.test(imageUrl)) {
      warnings.push('El link de imagen no parece ser de Cloudinary.');
    }
    if (!refs.brandsByName.has(normalizeKey(raw.marca))) {
      warnings.push('La marca no existe; se creara automaticamente.');
    }
    if (!refs.categoriesByName.has(normalizeKey(raw.categoria))) {
      warnings.push('La categoria no existe; se creara automaticamente.');
    }

    const productExists = refs.productsBySku.has(productSku) || refs.productsBySlug.has(slug);
    const variantExists = refs.variantsBySku.has(variantSku);

    previews.push({
      rowNumber: currentRowNumber,
      raw,
      normalized: {
        codigo_producto: productSku,
        nombre: name,
        marca: cleanText(raw.marca),
        seccion: section,
        categoria: cleanText(raw.categoria),
        descripcion: cleanText(raw.descripcion),
        talla_us: toNumber(raw.talla_us),
        talla_eu: toNumber(raw.talla_eu),
        talla_uk: toNumber(raw.talla_uk),
        talla_cm: toNumber(raw.talla_cm),
        color: colorName,
        codigo_color: cleanText(raw.codigo_color) || '#000000',
        sku_variante: variantSku,
        costo: toMoney(raw.costo),
        porcentaje_factura: toNumber(raw.porcentaje_factura),
        porcentaje_neo_link: toNumber(raw.porcentaje_neo_link),
        ganancia_deseada: desiredProfit,
        // La funcion SQL actual conserva este nombre por compatibilidad.
        porcentaje_margen: desiredProfit,
        precio_base: toMoney(raw.precio_base),
        precio_final_calculado: finalPrice,
        precio_anterior: compareAtPrice || null,
        precio_especial_talla: specialPrice || null,
        stock,
        stock_minimo: lowStockThreshold,
        warehouse: cleanText(raw.warehouse) || 'Principal',
        link_imagen_cloudinary: imageUrl,
        estado: status,
        slug,
        colorSkuSuffix: skuSuffix,
        isAvailable: stock > 0,
      },
      action: errors.length
        ? 'skip'
        : variantExists
          ? 'update_variant'
          : productExists
            ? 'update_product'
            : 'create_product',
      errors,
      warnings,
    });
  });

  return previews;
}
