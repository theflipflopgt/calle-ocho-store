import { BrandForm } from '../brand-form';

export default function NewBrandPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Nueva Marca</h1>
        <p className="text-gray-600 mt-1">Agrega una nueva marca de tenis</p>
      </div>

      <BrandForm />
    </div>
  );
}
