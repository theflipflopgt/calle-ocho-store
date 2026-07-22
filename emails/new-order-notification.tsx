import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface OrderItem {
  product_name: string;
  brand_name: string;
  color_name: string;
  size_us: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface NewOrderNotificationEmailProps {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shippingAddress: {
    recipient_name: string;
    phone: string;
    street_address: string;
    zone?: string;
    neighborhood?: string;
    city: string;
    department: string;
  };
  customerNotes?: string;
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://calleochostore.com';
const formatPrice = (amount: number) => `Q${amount.toFixed(2)}`;

export default function NewOrderNotificationEmail({
  customerName,
  customerEmail,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shippingCost,
  discount = 0,
  total,
  shippingAddress,
  customerNotes,
}: NewOrderNotificationEmailProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Html>
      <Head />
      <Preview>Nuevo pedido {orderNumber} por {formatPrice(total)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={eyebrow}>Nuevo pedido recibido</Text>
            <Heading style={h1}>{formatPrice(total)}</Heading>
            <Text style={subtitle}>{orderNumber} · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Cliente</Heading>
            <Text style={text}>
              <strong>{customerName}</strong><br />
              {customerEmail}<br />
              {shippingAddress.phone}
            </Text>
            <Text style={mutedText}>Fecha: {orderDate}</Text>
          </Section>

          <Section style={highlightPanel}>
            <Text style={panelTitle}>Dirección de entrega</Text>
            <Text style={panelText}>
              {shippingAddress.street_address}<br />
              {shippingAddress.zone && `Zona ${shippingAddress.zone}, `}
              {shippingAddress.neighborhood && `${shippingAddress.neighborhood}, `}
              {shippingAddress.city}, {shippingAddress.department}
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Productos</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column>
                  <Text style={itemBrand}>{item.brand_name}</Text>
                  <Text style={itemName}>{item.product_name}</Text>
                  <Text style={itemMeta}>{item.color_name} · Talla {item.size_us} · Cantidad {item.quantity}</Text>
                </Column>
                <Column style={itemPriceColumn}>
                  <Text style={itemPrice}>{formatPrice(item.subtotal)}</Text>
                  {item.quantity > 1 && <Text style={itemUnitPrice}>{formatPrice(item.unit_price)} c/u</Text>}
                </Column>
              </Row>
            ))}
          </Section>

          <Section style={summaryPanel}>
            <Row style={summaryRow}>
              <Column><Text style={summaryLabel}>Subtotal</Text></Column>
              <Column style={summaryValue}><Text style={summaryText}>{formatPrice(subtotal)}</Text></Column>
            </Row>
            <Row style={summaryRow}>
              <Column><Text style={summaryLabel}>Envío</Text></Column>
              <Column style={summaryValue}><Text style={summaryText}>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</Text></Column>
            </Row>
            {discount > 0 && (
              <Row style={summaryRow}>
                <Column><Text style={discountLabel}>Descuento</Text></Column>
                <Column style={summaryValue}><Text style={discountLabel}>-{formatPrice(discount)}</Text></Column>
              </Row>
            )}
            <Hr style={thinHr} />
            <Row>
              <Column><Text style={totalLabel}>Total</Text></Column>
              <Column style={summaryValue}><Text style={totalValue}>{formatPrice(total)}</Text></Column>
            </Row>
          </Section>

          {customerNotes && (
            <Section style={highlightPanel}>
              <Text style={panelTitle}>Notas del cliente</Text>
              <Text style={panelText}>{customerNotes}</Text>
            </Section>
          )}

          <Section style={content}>
            <Link href={`${siteUrl}/admin/ordenes`} style={button}>
              Ver pedido en admin
            </Link>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Correo interno automático de Calle Ocho Store.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f4f6f8',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  padding: '24px 0',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '620px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#111111',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const eyebrow = {
  color: '#93c5fd',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 10px',
  textTransform: 'uppercase' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '34px',
  fontWeight: '800',
  margin: '0 0 8px',
};

const subtitle = {
  color: '#d1d5db',
  fontSize: '14px',
  margin: '0',
};

const content = {
  padding: '28px 40px 0',
};

const h2 = {
  color: '#111111',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 14px',
};

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '23px',
  margin: '0',
};

const mutedText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '12px 0 0',
};

const highlightPanel = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '26px 40px 0',
  padding: '18px 20px',
};

const panelTitle = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '800',
  margin: '0 0 6px',
};

const panelText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const itemRow = {
  borderBottom: '1px solid #eef0f3',
  padding: '0 0 14px',
  margin: '0 0 14px',
};

const itemPriceColumn = {
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
  width: '110px',
};

const itemBrand = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: '700',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
};

const itemName = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 4px',
};

const itemMeta = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const itemPrice = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '800',
  margin: '0',
};

const itemUnitPrice = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '4px 0 0',
};

const summaryPanel = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '26px 40px 0',
  padding: '20px',
};

const summaryRow = {
  margin: '0 0 8px',
};

const summaryLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const summaryText = {
  color: '#111827',
  fontSize: '14px',
  margin: '0',
};

const summaryValue = {
  textAlign: 'right' as const,
};

const discountLabel = {
  color: '#15803d',
  fontSize: '14px',
  margin: '0',
};

const thinHr = {
  borderColor: '#e5e7eb',
  margin: '14px 0',
};

const totalLabel = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0',
};

const totalValue = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: '800',
  margin: '0',
};

const button = {
  backgroundColor: '#111111',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 28px',
  padding: '12px 20px',
  textDecoration: 'none',
};

const footer = {
  backgroundColor: '#111111',
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};
