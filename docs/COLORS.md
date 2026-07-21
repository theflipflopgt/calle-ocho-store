# Paleta de Colores - Calle Ocho Store

Diseño gráfico por Urban Studios

## Colores de Marca

### Color Principal - Negro
```css
#140d07
```
- **Uso**: Textos principales, fondos de header/footer
- **Tailwind**: `bg-brand-black` `text-brand-black`
- **RGB**: R: 20, G: 13, B: 7
- **CMYK**: C: 74%, M: 72%, Y: 66%, K: 91%

### Azul RGB (Principal)
```css
#0001fb
```
- **Uso**: CTAs, botones primarios, enlaces
- **Tailwind**: `bg-brand-blue` `text-brand-blue`
- **RGB**: R: 0, G: 1, B: 251
- **CMYK**: C: 94%, M: 75%, Y: 0%, K: 0%

### Color Secundario - Naranja
```css
#e4641d
```
- **Uso**: Acentos, ofertas, destacados
- **Tailwind**: `bg-brand-orange` `text-brand-orange`
- **RGB**: R: 228, G: 100, B: 29
- **CMYK**: C: 4%, M: 71%, Y: 95%, K: 0%

### Azul CMYK (Secundario)
```css
#002283
```
- **Uso**: Fondos secundarios, variaciones
- **Tailwind**: `bg-brand-blue-dark` `text-brand-blue-dark`
- **RGB**: R: 0, G: 34, B: 131
- **CMYK**: C: 100%, M: 89%, Y: 25%, K: 8%

## Ejemplos de Uso

### Botón Principal (CTA)
```tsx
<button className="bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-3 rounded-lg">
  Comprar Ahora
</button>
```

### Botón Secundario
```tsx
<button className="bg-brand-orange hover:opacity-90 text-white px-6 py-3 rounded-lg">
  Ver Más
</button>
```

### Card de Producto
```tsx
<div className="bg-white border border-gray-200 rounded-lg">
  <div className="p-4">
    <h3 className="text-brand-black font-bold">Nike Air Max</h3>
    <p className="text-brand-blue font-semibold">Q899.00</p>
  </div>
</div>
```

### Badge de Oferta
```tsx
<span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-semibold">
  -20% OFF
</span>
```

### Header
```tsx
<header className="bg-brand-black text-white">
  <nav className="container mx-auto">
    {/* Contenido */}
  </nav>
</header>
```

## Shadcn UI Integration

Los colores están integrados en el sistema de Shadcn UI:
- `primary` → brand-blue (#0001fb)
- `secondary` → brand-orange (#e4641d)
- `accent` → brand-orange (#e4641d)
- `foreground` → brand-black (#140d07)

Esto permite usar componentes de Shadcn con la paleta de la marca:
```tsx
<Button>Texto</Button> // Automáticamente usa brand-blue
<Button variant="secondary">Texto</Button> // Usa brand-orange
```

## Accesibilidad

- ✅ Negro + Blanco: Contraste AAA
- ✅ Azul + Blanco: Contraste AA
- ✅ Naranja + Blanco: Contraste AA
- ⚠️ Evitar: Azul sobre Negro (bajo contraste)
- ⚠️ Evitar: Naranja sobre Azul (bajo contraste)

## Recursos

- Archivo fuente: `docs/paleta-colores.png`
- Tailwind config: `tailwind.config.ts`
- CSS Variables: `app/globals.css`
