import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://calleochostore.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    ['', 1, 'daily'],
    ['/hombre', 0.9, 'daily'],
    ['/mujer', 0.9, 'daily'],
    ['/ninos', 0.9, 'daily'],
    ['/ofertas', 0.8, 'daily'],
    ['/marcas', 0.8, 'weekly'],
    ['/nosotros', 0.5, 'monthly'],
    ['/contacto', 0.5, 'monthly'],
    ['/envios', 0.4, 'monthly'],
    ['/devoluciones', 0.4, 'monthly'],
    ['/guia-de-tallas', 0.5, 'monthly'],
  ].map(([path, priority, changeFrequency]) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: priority as number,
  }));

  try {
    const supabase = await createClient();
    const [{ data: products }, { data: brands }] = await Promise.all([
      supabase
        .from('products')
        .select('slug, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false }),
      supabase
        .from('brands')
        .select('slug, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false }),
    ]);

    return [
      ...staticRoutes,
      ...(products || []).map((product) => ({
        url: `${BASE_URL}/producto/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...(brands || []).map((brand) => ({
        url: `${BASE_URL}/marcas/${brand.slug}`,
        lastModified: brand.updated_at ? new Date(brand.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
