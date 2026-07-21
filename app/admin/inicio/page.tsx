'use client';

import { useEffect, useState } from 'react';
import { ImageIcon, Loader2, Plus, Save, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_HOME_CONTENT,
  type HomeCategoryContent,
  type HomeContent,
  type HomeHeroSlide,
} from '@/lib/home-content-defaults';

function blankCategory(order: number): HomeCategoryContent {
  return {
    title: `CATEGORIA ${order}`,
    description: '',
    href: '/',
    image: '',
    alt: '',
    overlay: 'dark',
  };
}

function blankSlide(order: number): HomeHeroSlide {
  return {
    image: '',
    mobileImage: '',
    alt: `Slide principal ${order}`,
    titleLine1: 'Nueva',
    titleLine2: 'Colección',
    subtitle: 'Edita este texto desde el panel de inicio.',
    buttonLabel: 'COMPRAR AHORA',
    buttonHref: '/hombre',
  };
}

export default function AdminHomeContentPage() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch('/api/admin/home-content', {
          cache: 'no-store',
        });
        const result = await response.json();

        if (response.ok && result.content) {
          setContent(result.content);
        } else if (result.error) {
          setError(result.error);
        }
      } catch {
        setError('No se pudo cargar la configuración de inicio.');
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  const updateHero = (updates: Partial<HomeContent['hero']>) => {
    setContent((current) => ({
      ...current,
      hero: { ...current.hero, ...updates },
    }));
  };

  const updateSlide = (index: number, updates: Partial<HomeHeroSlide>) => {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        slides: current.hero.slides.map((slide, slideIndex) =>
          slideIndex === index ? { ...slide, ...updates } : slide
        ),
      },
    }));
  };

  const addSlide = () => {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        slides: [...current.hero.slides, blankSlide(current.hero.slides.length + 1)],
      },
    }));
  };

  const removeSlide = (index: number) => {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        slides: current.hero.slides.filter((_, slideIndex) => slideIndex !== index),
      },
    }));
  };

  const updateCategory = (index: number, updates: Partial<HomeCategoryContent>) => {
    setContent((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...updates } : category
      ),
    }));
  };

  const addCategory = () => {
    setContent((current) => ({
      ...current,
      categories: [...current.categories, blankCategory(current.categories.length + 1)],
    }));
  };

  const removeCategory = (index: number) => {
    setContent((current) => ({
      ...current,
      categories: current.categories.filter((_, categoryIndex) => categoryIndex !== index),
    }));
  };

  const saveContent = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    let result: { error?: string };
    let ok = false;

    try {
      const response = await fetch('/api/admin/home-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      result = await response.json();
      ok = response.ok;
    } catch {
      result = { error: 'No se pudo guardar la configuración de inicio.' };
    } finally {
      setIsSaving(false);
    }

    if (!ok) {
      setError(result.error || 'No se pudo guardar la configuración de inicio.');
      return;
    }

    setMessage('Inicio actualizado correctamente.');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Inicio</h1>
          <p className="mt-1 text-gray-600">
            Cambia videos, imagenes, textos y botones de la portada.
          </p>
        </div>
        <Button
          type="button"
          onClick={saveContent}
          disabled={isSaving}
          className="bg-brand-blue hover:bg-brand-blue/90"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section id="hero" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <Video className="h-5 w-5 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Hero principal</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2">
            <Label>Modo del hero</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => updateHero({ mode: 'video' })}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  content.hero.mode === 'video'
                    ? 'border-brand-blue bg-blue-50 text-brand-blue'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-blue'
                }`}
              >
                <Video className="mb-2 h-5 w-5" />
                <span className="block font-semibold">Video actual</span>
                <span className="text-sm">Mantiene el video de fondo como está.</span>
              </button>
              <button
                type="button"
                onClick={() => updateHero({ mode: 'slider' })}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  content.hero.mode === 'slider'
                    ? 'border-brand-blue bg-blue-50 text-brand-blue'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-blue'
                }`}
              >
                <ImageIcon className="mb-2 h-5 w-5" />
                <span className="block font-semibold">Slider con flechas</span>
                <span className="text-sm">Muestra imágenes cambiantes con flechas y puntos.</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Video desktop</Label>
            <Input
              value={content.hero.desktopVideoSrc}
              onChange={(event) => updateHero({ desktopVideoSrc: event.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Video movil</Label>
            <Input
              value={content.hero.mobileVideoSrc}
              onChange={(event) => updateHero({ mobileVideoSrc: event.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Imagen de respaldo</Label>
            <Input
              value={content.hero.fallbackImage}
              onChange={(event) => updateHero({ fallbackImage: event.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Titulo linea 1</Label>
            <Input
              value={content.hero.titleLine1}
              onChange={(event) => updateHero({ titleLine1: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Titulo destacado</Label>
            <Input
              value={content.hero.titleLine2}
              onChange={(event) => updateHero({ titleLine2: event.target.value })}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Texto corto</Label>
            <Textarea
              value={content.hero.subtitle}
              onChange={(event) => updateHero({ subtitle: event.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Texto del boton</Label>
            <Input
              value={content.hero.buttonLabel}
              onChange={(event) => updateHero({ buttonLabel: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Link del boton</Label>
            <Input
              value={content.hero.buttonHref}
              onChange={(event) => updateHero({ buttonHref: event.target.value })}
              placeholder="/hombre"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand-blue" />
              <h2 className="font-semibold text-brand-black">Slides del hero</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Se usan solo cuando el modo del hero está en Slider con flechas.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addSlide}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar slide
          </Button>
        </div>

        <div className="space-y-5">
          {content.hero.slides.map((slide, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-medium text-brand-black">Slide {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlide(index)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={content.hero.slides.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label>Imagen desktop</Label>
                  <Input
                    value={slide.image}
                    onChange={(event) => updateSlide(index, { image: event.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Imagen móvil opcional</Label>
                  <Input
                    value={slide.mobileImage || ''}
                    onChange={(event) => updateSlide(index, { mobileImage: event.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titulo linea 1</Label>
                  <Input
                    value={slide.titleLine1}
                    onChange={(event) => updateSlide(index, { titleLine1: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titulo destacado</Label>
                  <Input
                    value={slide.titleLine2}
                    onChange={(event) => updateSlide(index, { titleLine2: event.target.value })}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Texto corto</Label>
                  <Textarea
                    value={slide.subtitle}
                    onChange={(event) => updateSlide(index, { subtitle: event.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto del botón</Label>
                  <Input
                    value={slide.buttonLabel}
                    onChange={(event) => updateSlide(index, { buttonLabel: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link del botón</Label>
                  <Input
                    value={slide.buttonHref}
                    onChange={(event) => updateSlide(index, { buttonHref: event.target.value })}
                    placeholder="/hombre"
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Texto alternativo</Label>
                  <Input
                    value={slide.alt}
                    onChange={(event) => updateSlide(index, { alt: event.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-brand-black">Categorias del inicio</h2>
            <p className="text-sm text-gray-600">
              Puedes cambiar imagen, texto, link y agregar más bloques.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar bloque
          </Button>
        </div>

        <div className="space-y-5">
          {content.categories.map((category, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-medium text-brand-black">Bloque {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCategory(index)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input
                    value={category.title}
                    onChange={(event) => updateCategory(index, { title: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    value={category.href}
                    onChange={(event) => updateCategory(index, { href: event.target.value })}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Imagen</Label>
                  <Input
                    value={category.image}
                    onChange={(event) => updateCategory(index, { image: event.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto</Label>
                  <Input
                    value={category.description}
                    onChange={(event) =>
                      updateCategory(index, { description: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto alternativo</Label>
                  <Input
                    value={category.alt}
                    onChange={(event) => updateCategory(index, { alt: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge opcional</Label>
                  <Input
                    value={category.badge || ''}
                    onChange={(event) => updateCategory(index, { badge: event.target.value })}
                    placeholder="SALE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estilo de sombra</Label>
                  <select
                    value={category.overlay}
                    onChange={(event) =>
                      updateCategory(index, {
                        overlay: event.target.value as HomeCategoryContent['overlay'],
                      })
                    }
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="dark">Oscuro</option>
                    <option value="sale">Oferta</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
