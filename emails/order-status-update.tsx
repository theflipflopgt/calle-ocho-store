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
import type { OrderStatus } from '@/types/order-workflow';

interface OrderStatusUpdateEmailProps {
  customerName: string;
  orderNumber: string;
  status: OrderStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

const statusCopy: Record<OrderStatus, { title: string; preview: string; message: string }> = {
  pending: {
    title: 'Tu pedido está pendiente',
    preview: 'Recibimos tu pedido y está pendiente de confirmación.',
    message: 'Recibimos tu pedido y está pendiente de confirmación. Te avisaremos cuando avance.',
  },
  paid: {
    title: 'Pago confirmado',
    preview: 'El pago de tu pedido fue confirmado.',
    message: 'El pago de tu pedido fue confirmado. Nuestro equipo empezará a prepararlo.',
  },
  processing: {
    title: 'Estamos preparando tu pedido',
    preview: 'Tu pedido está en preparación.',
    message: 'Tu pedido está en preparación. Lo estamos dejando listo para entrega.',
  },
  shipped: {
    title: 'Tu pedido va en camino',
    preview: 'Tu pedido fue enviado.',
    message: 'Tu pedido fue enviado y va en camino.',
  },
  delivered: {
    title: 'Pedido entregado',
    preview: 'Tu pedido fue marcado como entregado.',
    message: 'Tu pedido fue marcado como entregado. Gracias por comprar en Calle Ocho Store.',
  },
  cancelled: {
    title: 'Pedido cancelado',
    preview: 'Tu pedido fue cancelado.',
    message: 'Tu pedido fue cancelado. Si tienes dudas, contáctanos para ayudarte.',
  },
  refunded: {
    title: 'Reembolso actualizado',
    preview: 'Tu pedido fue marcado como reembolsado.',
    message: 'Tu pedido fue marcado como reembolsado. Si tienes dudas, contáctanos para ayudarte.',
  },
};

export default function OrderStatusUpdateEmail({
  customerName,
  orderNumber,
  status,
  trackingNumber,
  trackingUrl,
}: OrderStatusUpdateEmailProps) {
  const copy = statusCopy[status];
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cuenta/pedidos`;

  return (
    <Html>
      <Head />
      <Preview>{copy.preview} - Calle Ocho Store</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://res.cloudinary.com/dv5nlnc0r/image/upload/v1/theflipflop/logo"
              width="150"
              height="50"
              alt="Calle Ocho Store"
              style={logo}
            />
          </Section>

          <Section style={content}>
            <Heading style={h1}>{copy.title}</Heading>
            <Text style={text}>Hola {customerName},</Text>
            <Text style={text}>
              {copy.message}
            </Text>
            <Text style={orderNumberText}>
              Pedido: <strong>{orderNumber}</strong>
            </Text>
          </Section>

          {status === 'shipped' && (trackingNumber || trackingUrl) && (
            <>
              <Hr style={hr} />
              <Section style={content}>
                <Heading style={h2}>Información de envío</Heading>
                {trackingNumber && (
                  <Text style={text}>
                    Número de guía: <strong>{trackingNumber}</strong>
                  </Text>
                )}
                {trackingUrl && (
                  <Text style={text}>
                    <Link href={trackingUrl} style={link}>
                      Ver seguimiento
                    </Link>
                  </Text>
                )}
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Section style={content}>
            <Text style={text}>
              <Link href={orderUrl} style={button}>
                Ver mis pedidos
              </Link>
            </Text>
          </Section>

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

const orderNumberText = {
  ...text,
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '14px 16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
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
