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

export default function OrderShippedEmail({
  customerName,
  orderNumber,
  trackingNumber,
  estimatedDelivery,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu pedido {orderNumber} ha sido enviado - Calle Ocho Store</Preview>
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
            <div style={iconContainer}>
              <span style={icon}>📦</span>
            </div>
            <Heading style={h1}>¡Tu pedido va en camino!</Heading>
            <Text style={text}>
              Hola {customerName},
            </Text>
            <Text style={text}>
              Tu pedido <strong>{orderNumber}</strong> ha sido enviado y está en camino.
            </Text>
          </Section>

          {trackingNumber && (
            <>
              <Hr style={hr} />
              <Section style={content}>
                <Heading style={h2}>Número de Rastreo</Heading>
                <div style={trackingBox}>
                  <Text style={trackingNumberStyle}>{trackingNumber}</Text>
                </div>
                <Text style={smallText}>
                  Usa este número para hacer seguimiento de tu paquete
                </Text>
              </Section>
            </>
          )}

          {estimatedDelivery && (
            <>
              <Hr style={hr} />
              <Section style={content}>
                <Heading style={h2}>Fecha Estimada de Entrega</Heading>
                <Text style={deliveryDate}>{estimatedDelivery}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* Actions */}
          <Section style={content}>
            <Text style={text}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cuenta/pedidos`} style={button}>
                Ver detalles del pedido
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

const iconContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const icon = {
  fontSize: '64px',
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

const smallText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const trackingBox = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const trackingNumberStyle = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  margin: '0',
  letterSpacing: '2px',
};

const deliveryDate = {
  color: '#2563eb',
  fontSize: '18px',
  fontWeight: '600',
  margin: '8px 0',
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
