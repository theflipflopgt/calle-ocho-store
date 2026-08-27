'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_HERO_CAROUSEL_DESIGN,
  HERO_FONT_OPTIONS,
  type HeroCarouselDesign,
} from '@/lib/hero-carousel-design';

interface Props {
  design: HeroCarouselDesign;
  imageUrl?: string;
  title: string;
  brand: string;
  price: string;
  onChange: (design: HeroCarouselDesign) => void;
}

const colors: Array<[keyof HeroCarouselDesign, string]> = [
  ['leftBackground', 'Fondo izquierdo'], ['rightBackground', 'Fondo derecho'],
  ['textColor', 'Texto principal'], ['mutedTextColor', 'Texto secundario'],
  ['accentColor', 'Etiqueta / acento'], ['primaryButtonBackground', 'Fondo botón'],
  ['primaryButtonText', 'Texto botón'], ['secondaryButtonBorder', 'Borde botón 2'],
  ['backgroundTextColor', 'Texto grande'], ['backgroundTextStroke', 'Contorno texto grande'],
];

const ranges: Array<[keyof HeroCarouselDesign, string, number, number, string]> = [
  ['titleSize', 'Tamaño del título', 28, 84, 'px'],
  ['contentX', 'Texto: izquierda / derecha', -120, 120, 'px'],
  ['contentY', 'Texto: arriba / abajo', -120, 120, 'px'],
  ['imageX', 'Producto: izquierda / derecha', -180, 180, 'px'],
  ['imageY', 'Producto: arriba / abajo', -140, 140, 'px'],
  ['imageScale', 'Tamaño del producto', 55, 145, '%'],
  ['backgroundTextX', 'Texto grande: izquierda / derecha', -180, 180, 'px'],
  ['backgroundTextY', 'Texto grande: arriba / abajo', -120, 120, 'px'],
  ['backgroundTextSize', 'Tamaño del texto grande', 42, 160, 'px'],
];

export function HeroDesignEditor({ design, imageUrl, title, brand, price, onChange }: Props) {
  const update = (key: keyof HeroCarouselDesign, value: string | number) => onChange({ ...design, [key]: value });
  return (
    <div className="mt-5 space-y-5 border-t border-gray-200 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="text-sm font-semibold text-brand-black">Diseño visual</h3><p className="mt-1 text-xs text-gray-500">Los cambios corresponden únicamente a este slide.</p></div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...DEFAULT_HERO_CAROUSEL_DESIGN })}><RotateCcw className="mr-2 h-4 w-4" />Restaurar</Button>
      </div>

      <div className="relative aspect-[16/7] overflow-hidden rounded-lg border shadow-inner" style={{ background: `linear-gradient(105deg, ${design.leftBackground} 0 46%, ${design.rightBackground} 46% 100%)`, fontFamily: design.fontFamily }}>
        <div className="absolute left-[5%] top-1/2 z-10 w-[40%] -translate-y-1/2" style={{ color: design.textColor, transform: `translate(${design.contentX * .18}px, calc(-50% + ${design.contentY * .18}px))` }}>
          <span className="rounded px-1.5 py-0.5 text-[7px] text-white" style={{ backgroundColor: design.accentColor }}>NUEVO</span>
          <p className="mt-1 text-[7px] font-semibold uppercase" style={{ color: design.mutedTextColor }}>{brand}</p>
          <p className="line-clamp-2 font-bold leading-none" style={{ fontSize: `${Math.max(10, design.titleSize * .23)}px` }}>{title}</p>
          <p className="mt-1 text-[9px] font-bold">{price}</p>
          <span className="mt-1.5 inline-block rounded px-2 py-1 text-[6px] font-bold" style={{ backgroundColor: design.primaryButtonBackground, color: design.primaryButtonText }}>Comprar ahora</span>
        </div>
        <div className="absolute left-[48%] right-0 top-[12%] text-center font-black uppercase leading-none" style={{ color: design.backgroundTextColor, WebkitTextStroke: `1px ${design.backgroundTextStroke}`, fontSize: `${Math.max(18, design.backgroundTextSize * .24)}px`, transform: `translate(${design.backgroundTextX * .15}px, ${design.backgroundTextY * .15}px)` }}>{brand}</div>
        {imageUrl && <img src={imageUrl} alt="Vista previa" className="absolute bottom-[7%] left-[51%] h-[67%] w-[43%] object-contain mix-blend-multiply" style={{ transform: `translate(${design.imageX * .15}px, ${design.imageY * .15}px) scale(${design.imageScale / 100})` }} />}
      </div>

      <div className="space-y-2"><Label>Tipografía</Label><select className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm" value={design.fontFamily} onChange={(e) => update('fontFamily', e.target.value)}>{HERO_FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>

      <details open className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-semibold">Colores</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{colors.map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 text-xs text-gray-700"><span>{label}</span><span className="flex items-center gap-2"><input type="color" value={String(design[key])} onChange={(e) => update(key, e.target.value)} className="h-8 w-10 cursor-pointer rounded border" /><code>{String(design[key])}</code></span></label>)}</div></details>

      <details className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-semibold">Tamaños y posiciones</summary><div className="mt-4 space-y-4">{ranges.map(([key, label, min, max, unit]) => <label key={key} className="block"><span className="mb-1 flex justify-between text-xs text-gray-700"><span>{label}</span><strong>{String(design[key])}{unit}</strong></span><input className="w-full accent-blue-700" type="range" min={min} max={max} value={Number(design[key])} onChange={(e) => update(key, Number(e.target.value))} /></label>)}</div></details>
    </div>
  );
}
