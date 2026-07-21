import { ShieldCheck } from 'lucide-react';
import { FooterInfoPage } from '@/components/content/footer-info-page';

export const metadata = {
  title: 'Política de Privacidad | Calle Ocho Store',
  description: 'Política de privacidad de Calle Ocho Store.',
};

export default function PrivacidadPage() {
  return (
    <FooterInfoPage
      icon={<ShieldCheck className="h-7 w-7" />}
      title="Politica de Privacidad"
      intro="Protegemos la informacion necesaria para atender pedidos, coordinar entregas y mantener una experiencia de compra confiable."
      sections={[
        {
          title: 'Datos que usamos',
          body: 'Podemos usar nombre, correo, telefono, direccion y detalles del pedido para confirmar compras y brindar seguimiento.',
        },
        {
          title: 'Pagos y seguridad',
          body: 'No almacenamos datos completos de tarjetas dentro de la base de datos de Calle Ocho Store.',
        },
        {
          title: 'Credenciales',
          body: 'Las claves y tokens privados se manejan en el servidor. La sesion del cliente se guarda para evitar pedir login en cada visita.',
        },
      ]}
      primaryAction={{ label: 'Contactar soporte', href: '/contacto' }}
    />
  );
}
