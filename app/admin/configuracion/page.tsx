import Link from 'next/link';
import { Settings, ShieldCheck, Mail, Globe, ExternalLink } from 'lucide-react';

const settings = [
  {
    icon: Globe,
    title: 'Sitio',
    description: 'La URL pública se controla con NEXT_PUBLIC_APP_URL en Vercel.',
  },
  {
    icon: Mail,
    title: 'Correos',
    description: 'Resend usa RESEND_API_KEY, EMAIL_FROM y BUSINESS_EMAIL desde variables de entorno.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad',
    description: 'Las funciones administrativas validan sesión y rol admin antes de ejecutar cambios.',
  },
];

const adminLinks = [
  { title: 'Google Analytics', href: 'https://analytics.google.com/' },
  { title: 'Supabase', href: 'https://supabase.com/dashboard/projects' },
  { title: 'Resend', href: 'https://resend.com/login' },
  { title: 'Vercel', href: 'https://vercel.com/login' },
  { title: 'Cloudinary', href: 'https://cloudinary.com/users/login' },
];

export default function AdminConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Configuración</h1>
        <p className="mt-1 text-gray-600">
          Resumen de configuración técnica de Calle Ocho Store.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Settings className="h-5 w-5 text-brand-black" />
          </div>
          <div>
            <h2 className="font-semibold text-brand-black">Variables principales</h2>
            <p className="text-sm text-gray-600">Estas se administran en Vercel, no desde el navegador.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {settings.map((item) => (
            <div key={item.title} className="rounded-lg border border-gray-200 p-4">
              <item.icon className="mb-3 h-5 w-5 text-brand-blue" />
              <h3 className="font-medium text-brand-black">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="enlaces" className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <ExternalLink className="h-5 w-5 text-brand-black" />
          </div>
          <div>
            <h2 className="font-semibold text-brand-black">Accesos externos</h2>
            <p className="text-sm text-gray-600">Solo abre las paginas de login; no guarda credenciales.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {adminLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue"
            >
              {item.title}
              <ExternalLink className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
