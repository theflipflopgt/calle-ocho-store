import { PackageSearch } from 'lucide-react';
import { FooterInfoPage } from '@/components/content/footer-info-page';

export const metadata = {
  title: 'Estado del Pedido | Calle Ocho Store',
  description: 'Consulta como dar seguimiento a tu pedido en Calle Ocho Store.',
};

export default function SeguimientoPage() {
  return (
    <FooterInfoPage
      icon={<PackageSearch className="h-7 w-7" />}
      title="Estado del Pedido"
      intro="Damos seguimiento a cada compra para que sepas en que etapa va tu pedido, desde la confirmacion hasta la entrega."
      sections={[
        {
          title: 'Confirmacion',
          body: 'Despues de comprar, validamos disponibilidad, datos de entrega y forma de pago antes de preparar el pedido.',
        },
        {
          title: 'Preparacion',
          body: 'Cuando el pedido queda confirmado, revisamos talla, color y empaque para que el producto salga correctamente.',
        },
        {
          title: 'Seguimiento',
          body: 'Puedes revisar tus pedidos desde tu cuenta o contactarnos si necesitas una actualizacion puntual del estado.',
        },
      ]}
      primaryAction={{ label: 'Ver mis pedidos', href: '/cuenta/pedidos' }}
      secondaryAction={{ label: 'Contactar soporte', href: '/contacto' }}
    />
  );
}
