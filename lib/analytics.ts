export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

type AnalyticsParams = Record<string, unknown>;

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

export function trackSearch(searchTerm: string) {
  trackEvent('search', { search_term: searchTerm });
}

export function trackViewItemList(items: AnalyticsItem[], itemListName: string) {
  if (!items.length) return;
  trackEvent('view_item_list', {
    item_list_id: itemListName.toLowerCase().replace(/\s+/g, '_'),
    item_list_name: itemListName,
    items,
  });
}

export function trackViewItem(item: AnalyticsItem) {
  trackEvent('view_item', {
    currency: 'GTQ',
    value: Number(item.price || 0),
    items: [item],
  });
}

export function trackAddToCart(item: AnalyticsItem) {
  trackEvent('add_to_cart', {
    currency: 'GTQ',
    value: Number(item.price || 0) * Number(item.quantity || 1),
    items: [item],
  });
}

export function trackRemoveFromCart(item: AnalyticsItem) {
  trackEvent('remove_from_cart', {
    currency: 'GTQ',
    value: Number(item.price || 0) * Number(item.quantity || 1),
    items: [item],
  });
}

export function trackBeginCheckout(value: number, items: AnalyticsItem[], coupon?: string) {
  trackEvent('begin_checkout', {
    currency: 'GTQ',
    value,
    coupon,
    items,
  });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  shipping: number;
  tax?: number;
  coupon?: string;
  items: AnalyticsItem[];
}) {
  trackEvent('purchase', {
    transaction_id: params.transactionId,
    affiliation: 'Calle Ocho Store',
    currency: 'GTQ',
    value: params.value,
    shipping: params.shipping,
    tax: params.tax || 0,
    coupon: params.coupon,
    items: params.items,
  });
}
