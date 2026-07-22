import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
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

const formatPrice = (amount: number) => {
  return `Q${amount.toFixed(2)}`;
};

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
  return (
    <Html>
      <Head />
      <Preview>Nuevo pedido {orderNumber} - Calle Ocho Store</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Nuevo Pedido Recibido</Heading>
          </Section>

          {/* Order Info */}
          <Section style={content}>
            <Text style={text}>
              <strong>Pedido:</strong> {orderNumber}<br />
              <strong>Fecha:</strong> {orderDate}<br />
              <strong>Cliente:</strong> {customerName} ({customerEmail})
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Order Items */}
          <Section style={content}>
            <Heading style={h2}>Productos ({items.length})</Heading>

            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemDetailsColumn}>
                  <Text style={itemBrand}>{item.brand_name}</Text>
                  <Text style={itemName}>{item.product_name}</Text>
                  <Text style={itemVariant}>
                    Color: {item.color_name} · Talla: {item.size_us} · Cantidad: {item.quantity}
                  </Text>
                </Column>
                <Column style={itemPriceColumn}>
                  <Text style={itemPrice}>{formatPrice(item.subtotal)}</Text>
                  {item.quantity > 1 && (
                    <Text style={itemUnitPrice}>
                      {formatPrice(item.unit_price)} c/u
                    </Text>
                  )}
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Totals */}
          <Section style={content}>
            <Row style={totalRow}>
              <Column style={totalLabel}>
                <Text style={text}>Subtotal:</Text>
              </Column>
              <Column style={totalValue}>
                <Text style={text}>{formatPrice(subtotal)}</Text>
              </Column>
            </Row>

            <Row style={totalRow}>
              <Column style={totalLabel}>
                <Text style={text}>Envío:</Text>
              </Column>
              <Column style={totalValue}>
                <Text style={text}>
                  {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                </Text>
              </Column>
            </Row>

            {discount > 0 && (
              <Row style={totalRow}>
                <Column style={totalLabel}>
                  <Text style={discountText}>Descuento:</Text>
                </Column>
                <Column style={totalValue}>
                  <Text style={discountText}>-{formatPrice(discount)}</Text>
                </Column>
              </Row>
            )}

            <Hr style={hr} />

            <Row style={totalRow}>
              <Column style={totalLabel}>
                <Text style={totalAmount}>Total:</Text>
              </Column>
              <Column style={totalValue}>
                <Text style={totalAmount}>{formatPrice(total)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Shipping Address */}
          <Section style={content}>
            <Heading style={h2}>📍 Dirección de Envío</Heading>
            <Text style={address}>
              <strong>{shippingAddress.recipient_name}</strong><br />
              📞 {shippingAddress.phone}<br />
              {shippingAddress.street_address}<br />
              {shippingAddress.zone && `Zona ${shippingAddress.zone}, `}
              {shippingAddress.neighborhood && `${shippingAddress.neighborhood}, `}
              {shippingAddress.city}, {shippingAddress.department}
            </Text>
          </Section>

          {/* Customer Notes */}
          {customerNotes && (
            <>
              <Hr style={hr} />
              <Section style={content}>
                <Heading style={h2}>📝 Notas del Cliente</Heading>
                <Text style={notesText}>{customerNotes}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* Actions */}
          <Section style={content}>
            <Text style={text}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://calleochostore.com'}/admin/ordenes`} style={button}>
                Ver pedido en el panel de administración
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este es un email automático del sistema de Calle Ocho Store.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#16a34a',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 40px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
  padding: '0',
};

const text = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const itemRow = {
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #f3f4f6',
};

const itemDetailsColumn = {
  verticalAlign: 'top' as const,
};

const itemPriceColumn = {
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
  width: '120px',
};

const itemBrand = {
  color: '#6b7280',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
};

const itemName = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px',
};

const itemVariant = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '2px 0',
};

const itemPrice = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const itemUnitPrice = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '4px 0 0',
};

const totalRow = {
  marginBottom: '8px',
};

const totalLabel = {
  width: '70%',
};

const totalValue = {
  width: '30%',
  textAlign: 'right' as const,
};

const totalAmount = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const discountText = {
  color: '#16a34a',
  fontSize: '14px',
  fontWeight: '500',
  margin: '8px 0',
};

const address = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '8px',
};

const notesText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  backgroundColor: '#fef3c7',
  padding: '16px',
  borderRadius: '8px',
  fontStyle: 'italic' as const,
};

const button = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '500',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const footer = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
};
