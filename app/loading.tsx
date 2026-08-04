import { Loader2 } from 'lucide-react';

export default function Loading() {
  return <div className="flex min-h-[45vh] items-center justify-center" aria-label="Cargando"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>;
}
