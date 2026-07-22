'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasNumber && hasUppercase;

  useEffect(() => {
    const urlError = searchParams.get('error_code');

    if (urlError === 'otp_expired') {
      setError('El enlace expiró o ya fue usado. Solicita uno nuevo para restablecer tu contraseña.');
      setIsCheckingSession(false);
      return;
    }

    const checkSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      setHasRecoverySession(Boolean(data.user));
      if (!data.user) {
        setError('El enlace no es válido o expiró. Solicita uno nuevo para restablecer tu contraseña.');
      }
      setIsCheckingSession(false);
    };

    void checkSession();
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('La contraseña debe tener mínimo 8 caracteres, un número y una mayúscula.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError('No se pudo actualizar la contraseña. Solicita un nuevo enlace e intenta otra vez.');
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);

      setTimeout(() => {
        router.push('/auth/login');
        router.refresh();
      }, 2200);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-brand-black mb-4">Contraseña actualizada</h1>
          <p className="text-gray-600 mb-8">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link href="/auth/login">
            <Button className="bg-brand-black hover:bg-brand-black/90 text-white">
              Ir a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-brand-black mb-4">Enlace no válido</h1>
          <p className="text-gray-600 mb-8">
            {error || 'Solicita un nuevo enlace para restablecer tu contraseña.'}
          </p>
          <Link href="/auth/recuperar">
            <Button className="bg-brand-black hover:bg-brand-black/90 text-white">
              Solicitar nuevo enlace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Nueva contraseña</h1>
          <p className="text-gray-600 mt-2">
            Crea una contraseña segura para volver a entrar a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Nueva contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 pr-10 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <p className="text-gray-600 font-medium">Tu contraseña debe tener:</p>
                <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check size={16} className={hasMinLength ? 'text-green-600' : 'text-gray-300'} />
                  Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check size={16} className={hasNumber ? 'text-green-600' : 'text-gray-300'} />
                  Al menos un número
                </div>
                <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check size={16} className={hasUppercase ? 'text-green-600' : 'text-gray-300'} />
                  Al menos una mayúscula
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Confirmar contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
            />
            {confirmPassword.length > 0 && (
              <p className={`text-sm flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                {passwordsMatch ? <Check size={16} /> : null}
                {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="w-full h-12 bg-brand-black hover:bg-brand-black/90 text-white font-semibold disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Actualizar contraseña'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>}>
      <NewPasswordForm />
    </Suspense>
  );
}
