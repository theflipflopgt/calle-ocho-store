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

const formatPrice = (amount: number) => {
  return `Q${amount.toFixed(2)}`;
};

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
      <Preview>Tu pedido {orderNumber} ha sido confirmado - Calle Ocho Store</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://res.cloudinary.com/dv5nlnc0r/image/upload/v1/theflipflop/logo"
              width="150"
              height="50"
              alt="Calle Ocho Store"
              style={logo}
            />
          </Section>

          {/* Success Message */}
          <Section style={content}>
            <Heading style={h1}>¡Pedido Confirmado!</Heading>
            <Text style={text}>
              Hola {customerName},
            </Text>
            <Text style={text}>
              Gracias por tu compra. Hemos recibido tu pedido <strong>{orderNumber}</strong> y lo estamos preparando.
            </Text>
            <Text style={text}>
              Fecha del pedido: {orderDate}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Order Items */}
          <Section style={content}>
            <Heading style={h2}>Resumen del Pedido</Heading>

            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageColumn}>
                  {item.product_image_url && (
                    <Img
                      src={item.product_image_url}
                      width="80"
                      height="80"
                      alt={item.product_name}
                      style={itemImage}
                    />
                  )}
                </Column>
                <Column style={itemDetailsColumn}>
                  <Text style={itemBrand}>{item.brand_name}</Text>
                  <Text style={itemName}>{item.product_name}</Text>
                  <Text style={itemVariant}>
                    {item.color_name} · Talla {item.size_us}
                  </Text>
                  <Text style={itemVariant}>
                    Cantidad: {item.quantity}
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
            <Heading style={h2}>Dirección de Envío</Heading>
            <Text style={address}>
              <strong>{shippingAddress.recipient_name}</strong><br />
              {shippingAddress.phone}<br />
              {shippingAddress.street_address}<br />
              {shippingAddress.zone && `${shippingAddress.zone}, `}
              {shippingAddress.neighborhood && `${shippingAddress.neighborhood}, `}
              {shippingAddress.city}, {shippingAddress.department}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={content}>
            <Text style={text}>
              Te notificaremos cuando tu pedido sea enviado. Puedes hacer seguimiento de tu pedido en tu cuenta.
            </Text>
            <Text style={text}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cuenta/pedidos`} style={button}>
                Ver mi pedido
              </Link>
            </Text>
          </Section>

          {/* Contact */}
          <Section style={footer}>
            <Text style={footerText}>
              ¿Necesitas ayuda? Contáctanos por WhatsApp: <Link href="https://wa.me/50252498898" style={link}>+502 5249 8898</Link>
            </Text>
            <Text style={footerText}>
              © 2026 Calle Ocho Store. Todos los derechos reservados.
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
  backgroundColor: '#1a1a1a',
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 40px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '24px 0',
  padding: '0',
  textAlign: 'center' as const,
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
  marginBottom: '24px',
};

const itemImageColumn = {
  width: '100px',
  verticalAlign: 'top' as const,
};

const itemImage = {
  borderRadius: '8px',
  objectFit: 'cover' as const,
};

const itemDetailsColumn = {
  verticalAlign: 'top' as const,
  paddingLeft: '16px',
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

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};
