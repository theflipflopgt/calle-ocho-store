import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Cliente anónimo para lecturas públicas del catálogo.
 *
 * No lee cookies ni intenta refrescar sesiones. Esto permite que Next.js
 * almacene en caché las páginas públicas y evita que una degradación del
 * servicio de autenticación bloquee la portada completa.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
