import { CategoryForm } from '../category-form';

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Nueva Categoría</h1>
        <p className="text-gray-600 mt-1">Agrega una nueva categoría de productos</p>
      </div>

      <CategoryForm />
    </div>
  );
}
