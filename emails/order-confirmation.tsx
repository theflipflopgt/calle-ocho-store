import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
  product_image_url: string | null;
}

interface OrderConfirmationEmailProps {
  customerName: string;
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
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://calleochostore.com';
const logoUrl = 'https://res.cloudinary.com/dv5nlnc0r/image/upload/v1/theflipflop/logo';

const formatPrice = (amount: number) => `Q${amount.toFixed(2)}`;

export default function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shippingCost,
  discount = 0,
  total,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Recibimos tu pedido {orderNumber} - Calle Ocho Store</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandHeader}>
            <Img src={logoUrl} width="148" height="52" alt="Calle Ocho Store" style={logo} />
          </Section>

          <Section style={hero}>
            <Text style={eyebrow}>Pedido recibido</Text>
            <Heading style={h1}>Gracias por tu compra</Heading>
            <Text style={lead}>
              Hola {customerName}, recibimos tu pedido <strong>{orderNumber}</strong>. Nuestro equipo validará disponibilidad, pago y cobertura de entrega.
            </Text>
            <Text style={mutedText}>Fecha del pedido: {orderDate}</Text>
          </Section>

          <Section style={statusPanel}>
            <Text style={statusTitle}>Siguiente paso</Text>
            <Text style={statusText}>
              Te contactaremos por WhatsApp si necesitamos confirmar datos. También puedes consultar el avance con tu número de pedido.
            </Text>
            <Link href={`${siteUrl}/seguimiento`} style={button}>
              Consultar seguimiento
            </Link>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Resumen del pedido</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageColumn}>
                  {item.product_image_url ? (
                    <Img src={item.product_image_url} width="72" height="72" alt={item.product_name} style={itemImage} />
                  ) : (
                    <div style={emptyImage} />
                  )}
                </Column>
                <Column style={itemDetailsColumn}>
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
              <Column style={summaryValue}>
                <Text style={summaryText}>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</Text>
              </Column>
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

          <Section style={content}>
            <Heading style={h2}>Entrega</Heading>
            <Text style={address}>
              <strong>{shippingAddress.recipient_name}</strong><br />
              {shippingAddress.phone}<br />
              {shippingAddress.street_address}<br />
              {shippingAddress.zone && `Zona ${shippingAddress.zone}, `}
              {shippingAddress.neighborhood && `${shippingAddress.neighborhood}, `}
              {shippingAddress.city}, {shippingAddress.department}
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Te notificaremos cuando tu pedido sea enviado o si hay una novedad importante.
            </Text>
            <Text style={footerText}>
              ¿Necesitas ayuda? WhatsApp: <Link href="https://wa.me/50252498898" style={footerLink}>+502 5249 8898</Link>
            </Text>
            <Text style={finePrint}>Calle Ocho Store, Guatemala.</Text>
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

const brandHeader = {
  backgroundColor: '#111111',
  padding: '28px 32px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  objectFit: 'contain' as const,
};

const hero = {
  padding: '34px 40px 22px',
  textAlign: 'center' as const,
};

const eyebrow = {
  color: '#2563eb',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0',
  margin: '0 0 10px',
  textTransform: 'uppercase' as const,
};

const h1 = {
  color: '#111111',
  fontSize: '30px',
  fontWeight: '800',
  lineHeight: '36px',
  margin: '0 0 14px',
};

const lead = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 auto 12px',
  maxWidth: '500px',
};

const mutedText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const statusPanel = {
  backgroundColor: '#eef4ff',
  border: '1px solid #dbeafe',
  borderRadius: '8px',
  margin: '0 32px 28px',
  padding: '22px 24px',
};

const statusTitle = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 6px',
};

const statusText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#111111',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '700',
  padding: '12px 20px',
  textDecoration: 'none',
};

const content = {
  padding: '0 40px 26px',
};

const h2 = {
  color: '#111111',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 16px',
};

const itemRow = {
  borderBottom: '1px solid #eef0f3',
  padding: '0 0 16px',
  margin: '0 0 16px',
};

const itemImageColumn = {
  verticalAlign: 'top' as const,
  width: '84px',
};

const itemImage = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  objectFit: 'cover' as const,
};

const emptyImage = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  height: '72px',
  width: '72px',
};

const itemDetailsColumn = {
  paddingLeft: '12px',
  verticalAlign: 'top' as const,
};

const itemPriceColumn = {
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
  width: '100px',
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
  lineHeight: '20px',
  margin: '0 0 4px',
};

const itemMeta = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '19px',
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
  margin: '0 40px 28px',
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

const address = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '23px',
  margin: '0',
};

const footer = {
  backgroundColor: '#111111',
  padding: '26px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#d1d5db',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const footerLink = {
  color: '#ffffff',
  textDecoration: 'underline',
};

const finePrint = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '12px 0 0',
};
