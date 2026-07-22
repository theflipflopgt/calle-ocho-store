import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { appLogger } from '@/lib/logger';

export async function POST() {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    );
  }

  let page = 1;
  const perPage = 100;
  let inserted = 0;
  let updated = 0;

  try {
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) throw error;

      const users = data.users || [];
      if (users.length === 0) break;

      const profiles = users
        .filter((user) => Boolean(user.email))
        .map((user) => ({
          id: user.id,
          email: user.email!,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.user_name ||
            null,
          avatar_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null,
          updated_at: new Date().toISOString(),
        }));

      if (profiles.length > 0) {
        const ids = profiles.map((profile) => profile.id);
        const { data: existingProfiles, error: existingError } = await (admin as any)
          .from('profiles')
          .select('id')
          .in('id', ids);

        if (existingError) throw existingError;

        const existingIds = new Set((existingProfiles || []).map((profile: any) => profile.id));
        const profilesToUpdate = profiles.filter((profile) => existingIds.has(profile.id));
        const profilesToInsert = profiles
          .filter((profile) => !existingIds.has(profile.id))
          .map((profile) => ({
            ...profile,
            role: 'customer',
          }));

        for (const profile of profilesToUpdate) {
          const { error: updateError } = await (admin as any)
            .from('profiles')
            .update({
              email: profile.email,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              updated_at: profile.updated_at,
            })
            .eq('id', profile.id);

          if (updateError) throw updateError;
          updated += 1;
        }

        if (profilesToInsert.length > 0) {
          const { error: insertError } = await (admin as any)
            .from('profiles')
            .insert(profilesToInsert);

          if (insertError) throw insertError;
          inserted += profilesToInsert.length;
        }
      }

      if (users.length < perPage) break;
      page += 1;
    }

    return NextResponse.json({
      success: true,
      synced: inserted + updated,
      inserted,
      updated,
    });
  } catch (error) {
    appLogger.error('admin.users.sync_auth.failed', {
      adminUserId: auth.user.id,
      error: error instanceof Error ? error.message : 'unknown_error',
    });

    return NextResponse.json(
      { error: 'No se pudieron sincronizar los usuarios de Supabase Auth.' },
      { status: 500 }
    );
  }
}
