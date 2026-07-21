import { FileText } from 'lucide-react';
import { FooterInfoPage } from '@/components/content/footer-info-page';

export const metadata = {
  title: 'Términos de Uso | Calle Ocho Store',
  description: 'Términos generales de uso de Calle Ocho Store.',
};

export default function TerminosPage() {
  return (
    <FooterInfoPage
      icon={<FileText className="h-7 w-7" />}
      title="Terminos de Uso"
      intro="Estos terminos explican las condiciones generales para navegar, consultar productos y realizar pedidos en Calle Ocho Store."
      sections={[
        {
          title: 'Informacion del sitio',
          body: 'Los precios, promociones, fotografias y disponibilidad pueden actualizarse para reflejar inventario y condiciones vigentes.',
        },
        {
          title: 'Confirmacion de pedidos',
          body: 'Cada compra queda sujeta a validacion de inventario, datos de entrega y confirmacion de pago cuando corresponda.',
        },
        {
          title: 'Uso correcto',
          body: 'No se permite usar el sitio para actividades fraudulentas, automatizadas o que afecten la operacion normal de la tienda.',
        },
      ]}
      primaryAction={{ label: 'Contactar soporte', href: '/contacto' }}
    />
  );
}
