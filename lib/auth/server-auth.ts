import { createClient } from '@/lib/supabase/server';
import { getServerProfile } from '@/lib/auth/server-profile';

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      role: null,
      isAdmin: false,
      isSeller: false,
      isWarehouse: false,
      canAccessAdmin: false,
      canManageOrders: false,
      canViewInventory: false,
      canManageProducts: false,
    };
  }

  const profile = await getServerProfile(supabase, user.id);

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isSeller = role === 'seller';
  const isWarehouse = role === 'warehouse';

  return {
    supabase,
    user,
    role,
    isAdmin,
    isSeller,
    isWarehouse,
    canAccessAdmin: isAdmin || isSeller || isWarehouse,
    canManageOrders: isAdmin || isSeller,
    canViewInventory: isAdmin || isSeller || isWarehouse,
    canManageProducts: isAdmin || isWarehouse,
  };
}
