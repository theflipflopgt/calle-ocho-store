import { createAdminClient } from '@/lib/supabase/admin';

export type ProfileRole = 'customer' | 'admin' | 'seller' | 'warehouse';

export interface ServerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: ProfileRole;
  avatar_url: string | null;
}

export async function getServerProfile(
  sessionClient: unknown,
  userId: string
): Promise<ServerProfile | null> {
  const db = (createAdminClient() || sessionClient) as any;
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, email, phone, role, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ServerProfile;
}
