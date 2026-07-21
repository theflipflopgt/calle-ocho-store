# 🎨 Framer Motion - Guía de Animaciones

Sistema de animaciones implementado con **Framer Motion** en Calle Ocho Store.

## ✨ Animaciones Implementadas

### 1. **Product Cards** ⭐ MÁS IMPORTANTE
**Archivo:** `components/products/product-card.tsx`

**Animaciones:**
- ✅ Fade in al hacer scroll (suave, se ve profesional)
- ✅ Hover lift effect (sube -4px al pasar el mouse)
- ✅ Lazy loading viewport (solo anima cuando se ve)

**Performance:**
- `viewport={{ once: true }}` - Solo anima una vez
- `margin: "-50px"` - Pre-carga antes de entrar al viewport
- `duration: 0.3` - Animación rápida, no pesada

**Uso:**
```tsx
// Se aplica automáticamente a todas las product cards
<ProductCard product={product} />
```

---

### 2. **Cart Drawer** 🛒
**Archivo:** `components/cart/cart-drawer.tsx`

**Animaciones:**
- ✅ Slide in desde la derecha
- ✅ Backdrop fade in
- ✅ Spring physics (rebote suave al abrir)
- ✅ AnimatePresence para exit animations

**Performance:**
- `type: 'spring', damping: 30, stiffness: 300` - Suave pero rápido
- Sale completamente del DOM cuando está cerrado

**Uso:**
```tsx
// Automático cuando abres el carrito
const { openCart } = useCart();
openCart();
```

---

### 3. **Mobile Search Modal** 🔍
**Archivo:** `components/search/header-search.tsx`

**Animaciones:**
- ✅ Fade in del overlay
- ✅ Slide down del input
- ✅ Exit animations

**Performance:**
- `duration: 0.2` - Muy rápido
- Solo activo en mobile (<768px)

---

### 4. **Toast Notifications** 🔔
**Archivo:** `components/ui/toast.tsx`

**Animaciones:**
- ✅ Slide down + fade in desde arriba
- ✅ Scale in effect
- ✅ Spring physics

**Uso:**
```tsx
import { Toast } from '@/components/ui/toast';

<Toast
  message="Producto agregado al carrito"
  type="success"
  isVisible={showToast}
  onClose={() => setShowToast(false)}
/>
```

**Tipos disponibles:**
- `success` - Verde, con checkmark
- `error` - Rojo, con X
- `warning` - Amarillo, con alert
- `info` - Azul, con alert

---

### 5. **Fade In Sections** 📄
**Archivo:** `components/ui/fade-in-section.tsx`

**Uso:**
Para animar secciones completas al hacer scroll:

```tsx
import { FadeInSection } from '@/components/ui/fade-in-section';

<FadeInSection delay={0.1}>
  <h2>Título que aparece con fade</h2>
  <p>Contenido...</p>
</FadeInSection>
```

**Props:**
- `delay` - Retraso en segundos (default: 0)
- `className` - Clases CSS adicionales

---

### 6. **Animated Button** 🎯
**Archivo:** `components/ui/animated-button.tsx`

**Uso:**
Para botones importantes con micro-interacciones:

```tsx
import { AnimatedButton } from '@/components/ui/animated-button';

<AnimatedButton size="lg">
  Agregar al Carrito
</AnimatedButton>
```

**Animaciones default:**
- Hover: Scale 1.02 (crece 2%)
- Tap: Scale 0.98 (se comprime al clickear)

---

## 🚀 Performance Tips

### ✅ Buenas Prácticas Implementadas:

1. **`whileInView` en lugar de `whileInScroll`**
   - Solo anima cuando entra al viewport
   - No consume recursos fuera de pantalla

2. **`viewport={{ once: true }}`**
   - Animación solo una vez
   - No re-anima en cada scroll

3. **`margin: "-50px"` en viewport**
   - Pre-carga animaciones antes de ser visibles
   - Transiciones más suaves

4. **`AnimatePresence` para modals**
   - Exit animations limpias
   - Componentes removidos del DOM

5. **Duraciones cortas**
   - 0.2s - 0.5s máximo
   - No bloquean interacción del usuario

6. **Spring physics suaves**
   - `damping: 25-30`
   - `stiffness: 300-400`
   - Rápido pero natural

---

## ⚠️ NO Hacer

### ❌ Evitar Estos Anti-Patterns:

1. **NO animar todo**
   ```tsx
   // ❌ MAL - Demasiada animación
   <motion.div animate={{ rotate: 360 }}>
     <motion.p animate={{ scale: 1.5 }}>
       <motion.span>Texto</motion.span>
     </motion.p>
   </motion.div>

   // ✅ BIEN - Solo lo necesario
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
     <p>Texto</p>
   </motion.div>
   ```

2. **NO usar ScrollTrigger en mobile**
   - Consume mucha batería
   - Lag en dispositivos de gama baja

3. **NO animaciones largas**
   ```tsx
   // ❌ MAL
   transition={{ duration: 2 }}

   // ✅ BIEN
   transition={{ duration: 0.3 }}
   ```

4. **NO olvidar `once: true`**
   ```tsx
   // ❌ MAL - Anima siempre
   viewport={{ margin: "-50px" }}

   // ✅ BIEN - Solo una vez
   viewport={{ once: true, margin: "-50px" }}
   ```

---

## 📊 Bundle Size

Framer Motion añade **~35KB** (minified + gzipped):
- ✅ Más ligero que GSAP (~50KB)
- ✅ Mejor integración con React
- ✅ Tree-shaking automático

**Componentes usados:**
- `motion` - 20KB
- `AnimatePresence` - 8KB
- `viewport` - 4KB
- `spring` - 3KB

**Total:** ~35KB adicionales al bundle

---

## 🎯 Dónde NO Agregamos Animaciones

Por razones de performance, NO animamos:

1. **Formularios** - Pueden causar lag al escribir
2. **Inputs** - Interfieren con el focus
3. **Tablas** - Muchos elementos, muy pesado
4. **Imágenes grandes** - Ya tienen lazy loading
5. **Scrollbars** - Puede causar jank

---

## 🔧 Cómo Agregar Más Animaciones

### Ejemplo: Animar un componente nuevo

```tsx
'use client';

import { motion } from 'framer-motion';

export function MiComponente() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <h2>Mi contenido</h2>
    </motion.div>
  );
}
```

### Ejemplo: Toast custom

```tsx
const [showToast, setShowToast] = useState(false);

const handleAddToCart = () => {
  // ... lógica de agregar al carrito
  setShowToast(true);
  setTimeout(() => setShowToast(false), 3000);
};

<Toast
  message="✓ Agregado al carrito"
  type="success"
  isVisible={showToast}
  onClose={() => setShowToast(false)}
/>
```

---

## 📚 Recursos

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Examples](https://www.framer.com/motion/examples/)
- [Performance Guide](https://www.framer.com/motion/guide-performance/)

---

## ✅ Checklist de Performance

Antes de desplegar, verifica:

- [ ] Todas las animaciones usan `once: true` en viewport
- [ ] Duraciones menores a 0.5s
- [ ] No más de 2-3 animaciones simultáneas
- [ ] Exit animations implementadas con AnimatePresence
- [ ] Tested en mobile (Chrome DevTools)
- [ ] No hay jank en scroll
- [ ] Bundle size < 40KB para Framer Motion

---

## 🎉 Resultado Final

**Animaciones sutiles, profesionales y performantes** que mejoran la UX sin sacrificar velocidad.

- ⚡ Carga rápida
- 🎨 Visualmente atractivo
- 📱 Funciona perfecto en mobile
- 🚀 No afecta Core Web Vitals
