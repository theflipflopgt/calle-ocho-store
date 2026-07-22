'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function CuentaPage() {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
  });

  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: (profile as any).date_of_birth || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
      // Refresh the page to update profile context
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: (profile as any).date_of_birth || '',
      });
    }
    setIsEditing(false);
  };

  if (!user || !profile) return null;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-black">
            Información Personal
          </h2>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-black hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Correo Electrónico
            </Label>
            <div className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El correo no se puede modificar
            </p>
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">Nombre Completo</Label>
            {isEditing ? (
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Juan Pérez"
                className="mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formData.full_name || 'No especificado'}
                </span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            {isEditing ? (
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="5555-1234"
                className="mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formData.phone || 'No especificado'}
                </span>
              </div>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
            {isEditing ? (
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formData.date_of_birth
                    ? new Date(formData.date_of_birth).toLocaleDateString('es-GT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No especificado'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-brand-black mb-4">
          Información de la Cuenta
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Fecha de registro</span>
            <span className="font-medium text-brand-black">
              {new Date(user.created_at).toLocaleDateString('es-GT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Tipo de cuenta</span>
            <span className="font-medium text-brand-black">
              {profile.role === 'admin' ? 'Administrador' : profile.role === 'seller' ? 'Vendedor' : 'Cliente'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Estado</span>
            <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full" />
              Activa
            </span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-brand-black mb-4">
          Seguridad
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-brand-black">Contraseña</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Última actualización hace más de 30 días
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Cambiar
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Para cambiar tu contraseña, usa la opción &quot;Olvidé mi contraseña&quot; en la página de inicio de sesión.
          </p>
        </div>
      </div>
    </div>
  );
}
