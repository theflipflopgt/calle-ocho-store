import { Store } from 'lucide-react';
import { FooterInfoPage } from '@/components/content/footer-info-page';

export const metadata = {
  title: 'Nuestra Historia | Calle Ocho Store',
  description: 'Conoce la historia de Calle Ocho Store.',
};

export default function NosotrosPage() {
  return (
    <FooterInfoPage
      icon={<Store className="h-7 w-7" />}
      title="Nuestra Historia"
      intro="Calle Ocho Store nace para acercar calzado, sneakers y estilo urbano a clientes que quieren comprar facil, claro y con confianza."
      sections={[
        {
          title: 'Lo que buscamos',
          body: 'Ofrecer modelos seleccionados con informacion visible sobre marca, talla, precio, disponibilidad y estado del producto.',
        },
        {
          title: 'Atencion cercana',
          body: 'Acompañamos al cliente durante la compra para resolver dudas de talla, entrega, cambios y seguimiento del pedido.',
        },
        {
          title: 'Experiencia digital',
          body: 'La tienda esta pensada para comprar desde telefono con un proceso simple, rapido y orientado a encontrar el calzado correcto.',
        },
      ]}
      primaryAction={{ label: 'Ver productos', href: '/mujer' }}
    />
  );
}
