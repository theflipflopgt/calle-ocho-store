import { Truck } from 'lucide-react';
import { FooterInfoPage } from '@/components/content/footer-info-page';

export const metadata = {
  title: 'Envío y Entrega | Calle Ocho Store',
  description: 'Información de envíos y entregas de Calle Ocho Store en Guatemala.',
};

export default function EnviosPage() {
  return (
    <FooterInfoPage
      icon={<Truck className="h-7 w-7" />}
      title="Envio y Entrega"
      intro="Coordinamos entregas dentro de Guatemala con informacion clara sobre cobertura, tiempos estimados y condiciones de envio."
      sections={[
        {
          title: 'Cobertura',
          body: 'La entrega depende de la direccion, disponibilidad del producto y cobertura activa del servicio de mensajeria.',
        },
        {
          title: 'Tiempo estimado',
          body: 'El tiempo se confirma al validar el pedido. Te avisamos si existe alguna condicion especial para tu zona.',
        },
        {
          title: 'Envio gratis',
          body: 'Las compras mayores a Q1,500 pueden aplicar a envio gratis cuando la zona de entrega este dentro de cobertura.',
        },
      ]}
      primaryAction={{ label: 'Comprar calzado', href: '/mujer' }}
      secondaryAction={{ label: 'Consultar pedido', href: '/seguimiento' }}
    />
  );
}
