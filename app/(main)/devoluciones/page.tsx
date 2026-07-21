import { RotateCcw } from 'lucide-react';
import { FooterInfoPage } from '@/components/content/footer-info-page';

export const metadata = {
  title: 'Devoluciones | Calle Ocho Store',
  description: 'Política general de cambios y devoluciones de Calle Ocho Store.',
};

export default function DevolucionesPage() {
  return (
    <FooterInfoPage
      icon={<RotateCcw className="h-7 w-7" />}
      title="Devoluciones"
      intro="Queremos que compres con confianza. Por eso revisamos cada solicitud de cambio con datos claros y atencion personalizada."
      sections={[
        {
          title: 'Condicion del producto',
          body: 'El calzado debe conservar su estado original, empaque, etiquetas y comprobante de compra para ser evaluado.',
        },
        {
          title: 'Tiempo de solicitud',
          body: 'Reporta cualquier inconveniente lo antes posible despues de recibir tu pedido para poder revisar el caso.',
        },
        {
          title: 'Disponibilidad',
          body: 'Los cambios quedan sujetos a existencia de talla, color o modelo. Si no hay stock, te orientamos con opciones disponibles.',
        },
      ]}
      primaryAction={{ label: 'Contactar soporte', href: '/contacto' }}
    />
  );
}
