'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Check, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
      setIsGoogleLoading(false);
    }
  };

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasNumber && hasUppercase;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) return;
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            phone: phone || null,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este correo ya está registrado');
        } else {
          setError(error.message);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-black mb-3 sm:mb-4">¡Cuenta creada!</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
            Revisa tu correo electrónico para confirmar tu cuenta y comenzar a comprar.
          </p>
          <Link href="/auth/login">
            <Button className="bg-brand-black hover:bg-brand-black/90 text-white px-6 sm:px-8 h-11 sm:h-12">
              Ir a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-4 sm:py-8">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden block text-center mb-6 sm:mb-8">
            <Image
              src="/logo.png"
              alt="Calle Ocho Store"
              width={120}
              height={120}
              className="mx-auto h-24 w-24 object-contain sm:h-28 sm:w-28"
              priority
            />
          </Link>

          <div className="mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-black">Crea tu cuenta</h2>
            <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Únete a la familia Calle Ocho Store</p>
          </div>

          {/* Google Button First */}
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleSignUp}
            className="w-full h-11 sm:h-12 font-medium gap-3 border-gray-300 hover:bg-gray-50 mb-4 sm:mb-6"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google
          </Button>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="bg-white px-4 text-gray-400">o continúa con</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700 font-medium">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 sm:h-12 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 sm:h-12 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+502 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="h-11 sm:h-12 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 sm:h-12 pr-10 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <p className="text-gray-600 font-medium">Tu contraseña debe tener:</p>
                  <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check size={14} className={`sm:w-4 sm:h-4 ${hasMinLength ? 'text-green-600' : 'text-gray-300'}`} />
                    Mínimo 8 caracteres
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check size={14} className={`sm:w-4 sm:h-4 ${hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                    Al menos un número
                  </div>
                  <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check size={14} className={`sm:w-4 sm:h-4 ${hasUppercase ? 'text-green-600' : 'text-gray-300'}`} />
                    Al menos una mayúscula
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 sm:h-12 border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
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
              disabled={isLoading || isGoogleLoading || !isPasswordValid || !passwordsMatch}
              className="w-full h-11 sm:h-12 bg-brand-black hover:bg-brand-black/90 text-white font-semibold transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <p className="text-center mt-6 sm:mt-8 text-sm sm:text-base text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/auth/login"
              className="text-brand-blue font-semibold hover:text-brand-blue/80"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-brand-black via-gray-900 to-brand-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-brand-blue rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-brand-blue rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <Link href="/" className="mb-8">
            <Image
              src="/logo-light.png"
              alt="Calle Ocho Store"
              width={180}
              height={180}
              className="h-36 w-36 object-contain sm:h-44 sm:w-44"
              priority
            />
          </Link>
          <p className="text-xl text-gray-300 mt-4">Tu estilo, tu paso</p>
        </div>
      </div>
    </div>
  );
}
