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
} from '@react-email/components';

interface OrderShippedEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://calleochostore.com';
const logoUrl = 'https://res.cloudinary.com/dv5nlnc0r/image/upload/v1/theflipflop/logo';

export default function OrderShippedEmail({
  customerName,
  orderNumber,
  trackingNumber,
  estimatedDelivery,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu pedido {orderNumber} ya fue enviado - Calle Ocho Store</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandHeader}>
            <Img src={logoUrl} width="148" height="52" alt="Calle Ocho Store" style={logo} />
          </Section>

          <Section style={hero}>
            <Text style={eyebrow}>Pedido enviado</Text>
            <Heading style={h1}>Tu pedido va en camino</Heading>
            <Text style={lead}>
              Hola {customerName}, tu pedido <strong>{orderNumber}</strong> ya salió de calleOCHO.
            </Text>
          </Section>

          <Section style={statusPanel}>
            <Text style={statusTitle}>Información de envío</Text>
            {trackingNumber ? (
              <>
                <Text style={mutedText}>Número de rastreo</Text>
                <Text style={trackingNumberStyle}>{trackingNumber}</Text>
              </>
            ) : (
              <Text style={statusText}>Tu pedido fue marcado como enviado. Si aplica guía, nuestro equipo puede compartirla por WhatsApp.</Text>
            )}
            {estimatedDelivery && (
              <Text style={deliveryText}>Entrega estimada: {estimatedDelivery}</Text>
            )}
          </Section>

          <Section style={content}>
            <Text style={text}>
              Puedes revisar el estado de tu pedido desde la página de seguimiento. Ten a mano tu número de pedido.
            </Text>
            <Link href={`${siteUrl}/seguimiento`} style={button}>
              Consultar seguimiento
            </Link>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              ¿Necesitas ayuda? WhatsApp: <Link href="https://wa.me/50252498898" style={footerLink}>+502 5249 8898</Link>
            </Text>
            <Text style={finePrint}>Gracias por comprar en Calle Ocho Store.</Text>
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
  margin: '0 auto',
  maxWidth: '500px',
};

const statusPanel = {
  backgroundColor: '#eef4ff',
  border: '1px solid #dbeafe',
  borderRadius: '8px',
  margin: '0 32px 28px',
  padding: '22px 24px',
  textAlign: 'center' as const,
};

const statusTitle = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const statusText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const mutedText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0 0 6px',
};

const trackingNumberStyle = {
  color: '#111827',
  fontFamily: 'monospace',
  fontSize: '24px',
  fontWeight: '800',
  letterSpacing: '0',
  margin: '0',
};

const deliveryText = {
  color: '#374151',
  fontSize: '14px',
  margin: '14px 0 0',
};

const content = {
  padding: '0 40px 30px',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '23px',
  margin: '0 0 18px',
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

const hr = {
  borderColor: '#e5e7eb',
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
