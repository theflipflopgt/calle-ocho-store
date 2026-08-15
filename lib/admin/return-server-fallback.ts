import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

const CLOSED_RETURN_STATUSES = new Set(['rejected', 'completed', 'cancelled']);
const BATCH_SIZE = 150;

export type ReturnOrderLookup = {
  order: any | null;
  openRequest: any | null;
  error: unknown | null;
};

function normalizeOrderNumber(value: unknown) {
  return String(value || '').trim().replace(/^#/, '').toUpperCase();
}

function validOrderNumber(value: string) {
  return /^[A-Z0-9-]{3,64}$/.test(value);
}

function chunks<T>(values: T[], size = BATCH_SIZE) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function selectInBatches(
  db: any,
  table: string,
  columns: string,
  field: string,
  values: string[]
) {
  if (values.length === 0) return { data: [] as any[], error: null };
  const rows: any[] = [];
  for (const batch of chunks([...new Set(values)])) {
    const { data, error } = await db.from(table).select(columns).in(field, batch);
    if (error) return { data: [] as any[], error };
    rows.push(...(data || []));
  }
  return { data: rows, error: null };
}

function adminDatabase(auth: any) {
  if (!auth?.user || !auth?.isAdmin) return null;
  return (createAdminClient() || auth.supabase) as any;
}

export async function lookupOrderForReturn(auth: any, input: unknown): Promise<ReturnOrderLookup> {
  const db = adminDatabase(auth);
  if (!db) return { order: null, openRequest: null, error: new Error('ADMIN_ONLY') };

  const orderNumber = normalizeOrderNumber(input);
  if (!validOrderNumber(orderNumber)) {
    return { order: null, openRequest: null, error: new Error('INVALID_ORDER_NUMBER') };
  }

  const { data: order, error } = await db
    .from('orders')
    .select('id, order_number, user_id, guest_email, shipping_recipient_name, shipping_phone, total, status, created_at')
    .ilike('order_number', orderNumber)
    .limit(1)
    .maybeSingle();

  if (error || !order) return { order: null, openRequest: null, error };

  const [profileResult, paymentResult, returnResult] = await Promise.all([
    order.user_id
      ? db.from('profiles').select('id, full_name, email, phone').eq('id', order.user_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    db
      .from('payments')
      .select('id, payment_method, provider, amount, status, transaction_id, provider_reference, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('return_requests')
      .select('id, request_type, status, created_at')
      .eq('order_id', order.id)
      .not('status', 'in', '(rejected,completed,cancelled)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const relatedError = profileResult.error || paymentResult.error || returnResult.error;
  if (relatedError) return { order: null, openRequest: null, error: relatedError };

  return {
    error: null,
    openRequest: returnResult.data || null,
    order: {
      ...order,
      customer: profileResult.data || null,
      payment: paymentResult.data || null,
    },
  };
}

export async function listReturnRequestsForAdmin(auth: any) {
  if (!auth?.user || !auth?.isAdmin) {
    return { data: [], error: new Error('ADMIN_ONLY') };
  }

  const rpc = await (auth.supabase as any).rpc('admin_list_return_requests');
  if (!rpc.error) return { data: Array.isArray(rpc.data) ? rpc.data : [], error: null };

  const db = adminDatabase(auth);
  if (!db) return { data: [], error: rpc.error };

  const { data: requests, error } = await db
    .from('return_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error };

  const orderIds = (requests || []).map((request: any) => request.order_id).filter(Boolean);
  const ordersResult = await selectInBatches(db, 'orders', '*', 'id', orderIds);
  if (ordersResult.error) return { data: [], error: ordersResult.error };

  const userIds = ordersResult.data.map((order: any) => order.user_id).filter(Boolean);
  const [profilesResult, paymentsResult] = await Promise.all([
    selectInBatches(db, 'profiles', 'id, full_name, email, phone', 'id', userIds),
    selectInBatches(
      db,
      'payments',
      'id, order_id, payment_method, provider, provider_reference, transaction_id, amount, status, created_at',
      'order_id',
      orderIds
    ),
  ]);
  if (profilesResult.error) return { data: [], error: profilesResult.error };
  if (paymentsResult.error) return { data: [], error: paymentsResult.error };

  const profiles = new Map(profilesResult.data.map((profile: any) => [profile.id, profile]));
  const paymentsByOrder = new Map<string, any[]>();
  for (const payment of paymentsResult.data) {
    const payments = paymentsByOrder.get(payment.order_id) || [];
    payments.push(payment);
    paymentsByOrder.set(payment.order_id, payments);
  }
  const orders = new Map(
    ordersResult.data.map((order: any) => [
      order.id,
      {
        ...order,
        customer: profiles.get(order.user_id) || null,
        payments: (paymentsByOrder.get(order.id) || []).sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at))
        ),
      },
    ])
  );

  return {
    error: null,
    data: (requests || []).map((request: any) => ({
      ...request,
      orders: orders.get(request.order_id) || null,
    })),
  };
}

export async function createReturnRequestWithFallback(
  auth: any,
  input: { orderNumber: string; requestType: string; reason: string }
) {
  if (!auth?.user || !auth?.isAdmin) return { errorCode: 'permission' as const };

  const orderNumber = normalizeOrderNumber(input.orderNumber);
  const rpc = await (auth.supabase as any).rpc('admin_create_return_request', {
    p_order_number: orderNumber,
    p_request_type: input.requestType,
    p_reason: input.reason,
  });
  if (!rpc.error) return { errorCode: null };

  const rpcMessage = String(rpc.error.message || '');
  if (rpcMessage.includes('ORDER_NOT_FOUND')) return { errorCode: 'order' as const };
  if (rpcMessage.includes('OPEN_RETURN_EXISTS')) return { errorCode: 'duplicate' as const };

  const lookup = await lookupOrderForReturn(auth, orderNumber);
  if (!lookup.order) return { errorCode: 'order' as const };
  if (lookup.openRequest && !CLOSED_RETURN_STATUSES.has(lookup.openRequest.status)) {
    return { errorCode: 'duplicate' as const };
  }

  const db = adminDatabase(auth);
  if (!db) return { errorCode: 'save' as const };
  const { error } = await db.from('return_requests').insert({
    order_id: lookup.order.id,
    user_id: lookup.order.user_id || null,
    guest_email: lookup.order.guest_email || null,
    request_type: input.requestType,
    reason: input.reason,
    status: 'requested',
  });

  return { errorCode: error ? ('save' as const) : null };
}
