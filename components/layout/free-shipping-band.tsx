import { PackageCheck, Truck } from 'lucide-react';

interface FreeShippingBandProps {
  compact?: boolean;
}

export function FreeShippingBand({ compact = false }: FreeShippingBandProps) {
  return (
    <section className={compact ? 'mb-6 sm:mb-8' : 'bg-brand-black text-white'}>
      <div
        className={
          compact
            ? 'rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 sm:px-6'
            : 'container mx-auto px-4 py-5 sm:py-6'
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
          <div className="flex items-center gap-3">
            <div
              className={
                compact
                  ? 'flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue text-white'
                  : 'flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-black'
              }
            >
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className={compact ? 'text-lg font-bold text-brand-black' : 'text-xl font-bold'}>
                Envío gratis desde Q1,000
              </p>
              <p className={compact ? 'text-base text-gray-700' : 'text-base text-white/80'}>
                Entregas a toda Guatemala. Te confirmamos disponibilidad antes de enviar.
              </p>
            </div>
          </div>
          <div className={compact ? 'hidden items-center gap-2 text-sm font-semibold text-brand-blue sm:flex' : 'hidden items-center gap-2 text-sm font-semibold text-blue-100 sm:flex'}>
            <PackageCheck className="h-5 w-5" />
            Compra segura y asesoría de tallas
          </div>
        </div>
      </div>
    </section>
  );
}
