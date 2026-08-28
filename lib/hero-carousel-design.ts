export const HERO_FONT_OPTIONS = [
  { value: 'inherit', label: 'Fuente de la tienda' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet' },
  { value: '"Courier New", monospace', label: 'Courier' },
] as const;

export interface HeroCarouselDesign {
  fontFamily: string;
  leftBackground: string;
  rightBackground: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  primaryButtonBackground: string;
  primaryButtonText: string;
  secondaryButtonBorder: string;
  backgroundTextColor: string;
  backgroundTextStroke: string;
  titleSize: number;
  contentX: number;
  contentY: number;
  imageX: number;
  imageY: number;
  imageScale: number;
  backgroundTextX: number;
  backgroundTextY: number;
  backgroundTextSize: number;
}

export const DEFAULT_HERO_CAROUSEL_DESIGN: HeroCarouselDesign = {
  fontFamily: 'inherit', leftBackground: '#0b1024', rightBackground: '#ffffff',
  textColor: '#ffffff', mutedTextColor: '#aeb3c1', accentColor: '#f97316',
  primaryButtonBackground: '#ffffff', primaryButtonText: '#0b1024',
  secondaryButtonBorder: '#ffffff', backgroundTextColor: '#ffffff',
  backgroundTextStroke: '#111111', titleSize: 60, contentX: 0, contentY: 0,
  imageX: 0, imageY: 0, imageScale: 100, backgroundTextX: 0,
  backgroundTextY: 0, backgroundTextSize: 112,
};

const numberInRange = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
const color = (value: unknown, fallback: string) =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

export function normalizeHeroCarouselDesign(value: unknown): HeroCarouselDesign {
  const input = value && typeof value === 'object' ? value as Partial<HeroCarouselDesign> : {};
  const d = DEFAULT_HERO_CAROUSEL_DESIGN;
  return {
    fontFamily: typeof input.fontFamily === 'string' ? input.fontFamily : d.fontFamily,
    leftBackground: color(input.leftBackground, d.leftBackground), rightBackground: color(input.rightBackground, d.rightBackground),
    textColor: color(input.textColor, d.textColor), mutedTextColor: color(input.mutedTextColor, d.mutedTextColor),
    accentColor: color(input.accentColor, d.accentColor), primaryButtonBackground: color(input.primaryButtonBackground, d.primaryButtonBackground),
    primaryButtonText: color(input.primaryButtonText, d.primaryButtonText), secondaryButtonBorder: color(input.secondaryButtonBorder, d.secondaryButtonBorder),
    backgroundTextColor: color(input.backgroundTextColor, d.backgroundTextColor), backgroundTextStroke: color(input.backgroundTextStroke, d.backgroundTextStroke),
    titleSize: numberInRange(input.titleSize, d.titleSize, 28, 84), contentX: numberInRange(input.contentX, d.contentX, -120, 120),
    contentY: numberInRange(input.contentY, d.contentY, -120, 120), imageX: numberInRange(input.imageX, d.imageX, -180, 180),
    imageY: numberInRange(input.imageY, d.imageY, -140, 140), imageScale: numberInRange(input.imageScale, d.imageScale, 55, 145),
    backgroundTextX: numberInRange(input.backgroundTextX, d.backgroundTextX, -180, 180),
    backgroundTextY: numberInRange(input.backgroundTextY, d.backgroundTextY, -120, 120),
    backgroundTextSize: numberInRange(input.backgroundTextSize, d.backgroundTextSize, 42, 160),
  };
}
