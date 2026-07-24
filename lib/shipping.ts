export const GUATEMALA_DEPARTMENTS = [
  'Guatemala', 'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
  'El Progreso', 'Escuintla', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa',
  'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
  'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa',
] as const;

export const GUATEMALA_MUNICIPALITIES = [
  'Ciudad de Guatemala',
  'Santa Catarina Pinula',
  'San José Pinula',
  'San José del Golfo',
  'Palencia',
  'Chinautla',
  'San Pedro Ayampuc',
  'Mixco',
  'San Pedro Sacatepéquez',
  'San Juan Sacatepéquez',
  'San Raymundo',
  'Chuarrancho',
  'Fraijanes',
  'Amatitlán',
  'Villa Nueva',
  'Villa Canales',
  'San Miguel Petapa',
] as const;

export const FREE_SHIPPING_THRESHOLD_GTQ = 1000;

export type DeliveryType = 'own_delivery' | 'guatex_collect';

export interface DeliveryCoverage {
  deliveryType: DeliveryType;
  isOwnDelivery: boolean;
  shippingCost: number;
  deliveryLabel: string;
  paymentHint: string;
  detail: string;
  cashOnDeliveryAllowed: boolean;
}

export function normalizeLocation(value?: string | null) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getDeliveryCoverage(
  department: string,
  municipality: string,
  subtotal: number,
  cashOnDeliveryEnabled: boolean
): DeliveryCoverage {
  const normalizedDepartment = normalizeLocation(department);
  const normalizedMunicipality = normalizeLocation(municipality);

  let baseCost: number | null = null;
  if (normalizedDepartment === 'guatemala') {
    if (['ciudad de guatemala', 'guatemala', 'guatemala city', 'capital', 'ciudad capital'].includes(normalizedMunicipality)) {
      baseCost = 35;
    } else if (normalizedMunicipality === 'mixco') {
      baseCost = 35;
    } else if (normalizedMunicipality === 'villa nueva') {
      baseCost = 40;
    }
  }

  if (baseCost !== null) {
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD_GTQ ? 0 : baseCost;
    return {
      deliveryType: 'own_delivery',
      isOwnDelivery: true,
      shippingCost,
      deliveryLabel: 'Entrega con mensajería propia',
      paymentHint: cashOnDeliveryEnabled
        ? 'Puedes pagar por transferencia o contra entrega. El equipo confirmará el horario por WhatsApp.'
        : 'Puedes pagar por transferencia. El equipo confirmará el horario por WhatsApp.',
      detail: shippingCost === 0
        ? 'Envío gratis por compra de Q1,000 o más.'
        : `Tarifa de entrega: Q${baseCost.toFixed(2)}.`,
      cashOnDeliveryAllowed: cashOnDeliveryEnabled,
    };
  }

  return {
    deliveryType: 'guatex_collect',
    isOwnDelivery: false,
    shippingCost: 0,
    deliveryLabel: 'Envío por cobrar mediante Guatex',
    paymentHint: 'El pedido se paga previamente por transferencia. El costo del envío se cancela directamente a Guatex al recibir el paquete.',
    detail: 'El total de la tienda no incluye la tarifa de Guatex, porque depende del destino, peso y volumen.',
    cashOnDeliveryAllowed: false,
  };
}
