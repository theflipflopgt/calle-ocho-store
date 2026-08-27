'use client';

import { useEffect, useState } from 'react';
import { ImageIcon, LayoutPanelTop, Loader2, Plus, Save, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_HOME_CONTENT,
  type HomeCategoryContent,
  type HomeContent,
  type HomeFooterPageContent,
  type HomeHeroSlide,
} from '@/lib/home-content-defaults';

const footerPageLabels: {
  key: keyof HomeContent['footerPages'];
  label: string;
}[] = [
  { key: 'seguimiento', label: 'Estado del pedido' },
  { key: 'envios', label: 'Envío y entrega' },
  { key: 'guiaTallas', label: 'Guía de tallas' },
  { key: 'devoluciones', label: 'Devoluciones' },
  { key: 'contacto', label: 'Contáctanos' },
  { key: 'nosotros', label: 'Nuestra historia' },
  { key: 'terminos', label: 'Términos de uso' },
  { key: 'privacidad', label: 'Política de privacidad' },
];

const footerLayoutOptions: Array<{
  value: HomeContent['footer']['layout'];
  label: string;
  description: string;
}> = [
  { value: 'classic', label: 'Clásico', description: 'Columnas y datos al pie.' },
  { value: 'centered', label: 'Centrado', description: 'Contenido alineado al centro.' },
  { value: 'minimal', label: 'Minimal', description: 'Solo redes y textos finales.' },
];

function relativeLuminance(hex: string) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) return 0;

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

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
  const footerContrast = contrastRatio(
    content.footer.backgroundColor,
    content.footer.textColor
  );

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

  const updateFooter = (updates: Partial<HomeContent['footer']>) => {
    setContent((current) => ({
      ...current,
      footer: { ...current.footer, ...updates },
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

  const updateFooterPage = (
    key: keyof HomeContent['footerPages'],
    updates: Partial<HomeFooterPageContent>
  ) => {
    setContent((current) => ({
      ...current,
      footerPages: {
        ...current.footerPages,
        [key]: {
          ...current.footerPages[key],
          ...updates,
        },
      },
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
        <div className="mb-5 flex items-start gap-3">
          <LayoutPanelTop className="mt-0.5 h-5 w-5 text-brand-blue" />
          <div>
            <h2 className="font-semibold text-brand-black">Diseño y textos del pie de página</h2>
            <p className="mt-1 text-sm text-gray-600">
              Los campos vacíos no se muestran. Los cambios se aplican a toda la tienda.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Diseño</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {footerLayoutOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateFooter({ layout: option.value })}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    content.footer.layout === option.value
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-200 text-gray-700 hover:border-brand-blue'
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {([
              ['backgroundColor', 'Color de fondo'],
              ['textColor', 'Color del texto'],
              ['accentColor', 'Color de acento'],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`footer-${key}`}>{label}</Label>
                <div className="flex h-10 items-center gap-3 rounded-md border border-gray-300 px-3">
                  <input
                    id={`footer-${key}`}
                    type="color"
                    value={content.footer[key]}
                    onChange={(event) =>
                      updateFooter({ [key]: event.target.value } as Partial<HomeContent['footer']>)
                    }
                    className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-sm uppercase text-gray-600">{content.footer[key]}</span>
                </div>
              </div>
            ))}
          </div>

          {footerContrast < 4.5 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              El fondo y el texto tienen poco contraste. Elige colores más diferentes para que el contenido sea legible.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ['showNavigation', 'Mostrar navegación'],
              ['showNewsletter', 'Mostrar boletín'],
              ['showSocialLinks', 'Mostrar redes y correo'],
            ] as const).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
              >
                <Label htmlFor={`footer-${key}`} className="cursor-pointer">{label}</Label>
                <Switch
                  id={`footer-${key}`}
                  checked={content.footer[key]}
                  onCheckedChange={(checked) =>
                    updateFooter({ [key]: checked } as Partial<HomeContent['footer']>)
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="footer-shop-title">Título de compras</Label>
              <Input
                id="footer-shop-title"
                value={content.footer.shopTitle}
                maxLength={40}
                onChange={(event) => updateFooter({ shopTitle: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer-help-title">Título de ayuda</Label>
              <Input
                id="footer-help-title"
                value={content.footer.helpTitle}
                maxLength={40}
                onChange={(event) => updateFooter({ helpTitle: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer-about-title">Título institucional</Label>
              <Input
                id="footer-about-title"
                value={content.footer.aboutTitle}
                maxLength={40}
                onChange={(event) => updateFooter({ aboutTitle: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer-newsletter-title">Título del boletín</Label>
              <Input
                id="footer-newsletter-title"
                value={content.footer.newsletterTitle}
                maxLength={40}
                onChange={(event) => updateFooter({ newsletterTitle: event.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="footer-newsletter-text">Texto del boletín</Label>
              <Input
                id="footer-newsletter-text"
                value={content.footer.newsletterText}
                maxLength={120}
                onChange={(event) => updateFooter({ newsletterText: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="footer-copyright">Primera línea</Label>
              <Input
                id="footer-copyright"
                value={content.footer.copyrightText}
                maxLength={160}
                placeholder="Usa {year} para mostrar el año actual"
                onChange={(event) => updateFooter({ copyrightText: event.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="footer-commercial">Segunda línea</Label>
              <Input
                id="footer-commercial"
                value={content.footer.commercialText}
                maxLength={200}
                onChange={(event) => updateFooter({ commercialText: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer-developer">Texto con enlace</Label>
              <Input
                id="footer-developer"
                value={content.footer.developerText}
                maxLength={120}
                onChange={(event) => updateFooter({ developerText: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer-developer-url">Enlace HTTPS</Label>
              <Input
                id="footer-developer-url"
                type="url"
                value={content.footer.developerUrl}
                placeholder="https://..."
                onChange={(event) => updateFooter({ developerUrl: event.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="footer-extra">Línea adicional</Label>
              <Input
                id="footer-extra"
                value={content.footer.extraText}
                maxLength={200}
                placeholder="Opcional"
                onChange={(event) => updateFooter({ extraText: event.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="footer-email">Correo del icono</Label>
              <Input
                id="footer-email"
                type="email"
                value={content.footer.email}
                maxLength={160}
                onChange={(event) => updateFooter({ email: event.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Imagenes de paginas del footer</h2>
        </div>

        <div className="space-y-5">
          {footerPageLabels.map(({ key, label }) => (
            <div key={key} className="rounded-lg border border-gray-200 p-4">
              <p className="mb-4 font-medium text-brand-black">{label}</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label>URL de imagen</Label>
                  <Input
                    value={content.footerPages[key].image}
                    onChange={(event) => updateFooterPage(key, { image: event.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Texto alternativo</Label>
                  <Input
                    value={content.footerPages[key].alt}
                    onChange={(event) => updateFooterPage(key, { alt: event.target.value })}
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
