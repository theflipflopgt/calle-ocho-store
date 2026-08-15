import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export async function listOrdersWithServerFallback(filters: any, auth: any) {
  const rpc = await (auth.supabase as any).rpc('staff_list_orders', {
    p_status: filters.status || null,
    p_query: filters.q?.trim() || null,
    p_from: filters.from || null,
    p_to: filters.to || null,
  });
  if (!rpc.error) return { data: Array.isArray(rpc.data) ? rpc.data : [], error: null };

  // Fallback stays server-only. Authentication/role is established with the user's
  // session before the service-role client is ever used.
  if (!auth.user || !auth.canManageOrders) return { data: [], error: rpc.error };
  const admin = createAdminClient() as any;
  if (!admin) return { data: [], error: rpc.error };

  let query = admin.from('orders').select(`
    *,
    profiles:user_id (id, full_name, email, phone),
    seller:seller_id (id, full_name, email),
    order_items (id, product_name, quantity, unit_price)
  `).order('created_at', { ascending: false });
  if (!auth.isAdmin) query = query.eq('seller_id', auth.user.id);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%_,()]/g, '');
    query = query.or(`order_number.ilike.%${q}%,shipping_recipient_name.ilike.%${q}%`);
  }
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00-06:00`);
  if (filters.to) {
    const end = new Date(`${filters.to}T12:00:00-06:00`);
    end.setDate(end.getDate() + 1);
    query = query.lt('created_at', end.toISOString());
  }
  return query;
}

export async function getOrderWithServerFallback(id: string, auth: any) {
  const rpc = await (auth.supabase as any).rpc('staff_get_order', { p_order_id: id });
  if (!rpc.error && rpc.data) return { data: rpc.data, error: null };
  if (!auth.user || !auth.canManageOrders) return { data: null, error: rpc.error };
  const admin = createAdminClient() as any;
  if (!admin) return { data: null, error: rpc.error };

  let query = admin.from('orders').select(`
    *,
    profiles:user_id (id, full_name, email, phone),
    seller:seller_id (id, full_name, email),
    order_items (*),
    payments (*),
    seller_assignments:order_seller_assignments (*, assigned_seller:seller_id(id, full_name, email), previous_seller:previous_seller_id(id, full_name, email), actor:assigned_by(id, full_name, email)),
    shipments (*)
  `).eq('id', id);
  if (!auth.isAdmin) query = query.eq('seller_id', auth.user.id);
  return query.maybeSingle();
}
