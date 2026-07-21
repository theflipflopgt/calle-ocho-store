'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  zone: string | null;
  neighborhood: string | null;
  city: string;
  department: string;
  postal_code: string | null;
  additional_references: string | null;
  is_default: boolean | null;
}

const DEPARTMENTS = [
  'Guatemala', 'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
  'El Progreso', 'Escuintla', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa',
  'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
  'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa'
];

export default function DireccionesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error al eliminar la dirección');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    try {
      // Remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
      alert('Error al establecer dirección predeterminada');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-black">
          Mis Direcciones ({addresses.length})
        </h2>
        <Button
          onClick={() => {
            setEditingId(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Dirección
        </Button>
      </div>

      {/* Address Form Modal */}
      {isFormOpen && (
        <AddressForm
          addressId={editingId}
          onClose={() => {
            setIsFormOpen(false);
            setEditingId(null);
          }}
          onSave={() => {
            setIsFormOpen(false);
            setEditingId(null);
            fetchAddresses();
          }}
        />
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No tienes direcciones guardadas</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar primera dirección
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => {
                setEditingId(address.id);
                setIsFormOpen(true);
              }}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => handleSetDefault(address.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className={cn(
      "bg-white rounded-xl border p-4 sm:p-6",
      address.is_default ? "border-brand-blue bg-brand-blue/5" : "border-gray-100"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className={cn(
            "w-5 h-5",
            address.is_default ? "text-brand-blue" : "text-gray-400"
          )} />
          {address.is_default && (
            <span className="text-xs font-medium text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-full">
              Predeterminada
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="text-sm space-y-1">
        <p className="font-medium text-brand-black">{address.recipient_name}</p>
        <p className="text-gray-600">{address.phone}</p>
        <p className="text-gray-600">{address.street_address}</p>
        {(address.zone || address.neighborhood) && (
          <p className="text-gray-600">
            {[address.zone, address.neighborhood].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="text-gray-600">
          {address.city}, {address.department}
        </p>
        {address.additional_references && (
          <p className="text-gray-500 italic text-xs mt-2">
            {address.additional_references}
          </p>
        )}
      </div>

      {!address.is_default && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full sm:w-auto"
          onClick={onSetDefault}
        >
          <Check className="w-4 h-4 mr-2" />
          Establecer como predeterminada
        </Button>
      )}
    </div>
  );
}

function AddressForm({
  addressId,
  onClose,
  onSave,
}: {
  addressId: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: '',
    phone: '',
    street_address: '',
    zone: '',
    neighborhood: '',
    city: '',
    department: 'Guatemala',
    postal_code: '',
    additional_references: '',
  });

  const supabase = createClient();

  useEffect(() => {
    if (addressId) {
      fetchAddress();
    }
  }, [addressId]);

  async function fetchAddress() {
    if (!addressId) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          recipient_name: data.recipient_name || '',
          phone: data.phone || '',
          street_address: data.street_address || '',
          zone: data.zone || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          department: data.department || 'Guatemala',
          postal_code: data.postal_code || '',
          additional_references: data.additional_references || '',
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const addressData = {
        user_id: user.id,
        ...formData,
        zone: formData.zone || null,
        neighborhood: formData.neighborhood || null,
        postal_code: formData.postal_code || null,
        additional_references: formData.additional_references || null,
        updated_at: new Date().toISOString(),
      };

      if (addressId) {
        // Update existing
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', addressId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('addresses')
          .insert(addressData);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error al guardar la dirección');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-black">
            {addressId ? 'Editar Dirección' : 'Nueva Dirección'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="recipient_name">Nombre del destinatario *</Label>
            <Input
              id="recipient_name"
              name="recipient_name"
              value={formData.recipient_name}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="street_address">Dirección *</Label>
            <Input
              id="street_address"
              name="street_address"
              value={formData.street_address}
              onChange={handleChange}
              placeholder="5ta Avenida 10-50"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zone">Zona</Label>
              <Input
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                placeholder="Zona 10"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="neighborhood">Colonia/Barrio</Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="Oakland"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ciudad/Municipio *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="department">Departamento *</Label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="postal_code">Código Postal</Label>
            <Input
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              placeholder="01010"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="additional_references">Referencias adicionales</Label>
            <Textarea
              id="additional_references"
              name="additional_references"
              value={formData.additional_references}
              onChange={handleChange}
              placeholder="Casa color azul, portón negro..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-black hover:bg-gray-800"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
