'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function RecoverPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/nueva-contrasena`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-brand-blue" />
          </div>
          <h1 className="text-3xl font-bold text-brand-black mb-4">Revisa tu correo</h1>
          <p className="text-gray-600 mb-8">
            Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.
            Si no lo ves en unos minutos, revisa spam, promociones o correo no deseado.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} />
              Volver a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-black mb-8"
        >
          <ArrowLeft size={16} />
          Volver a iniciar sesión
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Recuperar Contraseña</h1>
          <p className="text-gray-600 mt-2">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Si no aparece en tu bandeja de entrada, revisa spam, promociones o correo no deseado.
          </p>
        </div>

        <form onSubmit={handleRecover} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-12"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-brand-black hover:bg-gray-800 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar enlace'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
