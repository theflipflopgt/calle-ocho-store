# Cómo hacer cambios y publicarlos

## 1. Editar el proyecto

Abre la carpeta `CalleOchoStore` en Visual Studio Code y modifica los archivos necesarios.

Ejemplos frecuentes:

- Logo principal: `public/logo.png`
- Logo para modo oscuro: `public/logo-light.png`
- Favicon: `app/icon.png`
- Encabezado: `components/layout/header.tsx`
- Pie de página: `components/layout/footer.tsx`
- Página de inicio: `app/(main)/page.tsx`
- Colores y estilos generales: `app/globals.css`

Para probar los cambios en tu computadora:

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en el navegador.

## 2. Publicar los cambios en GitHub

Después de guardar los archivos, abre la terminal dentro de la carpeta del proyecto y ejecuta:

```bash
git add .
git commit -m "Describe aquí el cambio realizado"
git push
```

Ejemplo:

```bash
git add .
git commit -m "Actualizar logo y favicon"
git push
```

## 3. Replicación automática en Vercel

Al ejecutar `git push`, GitHub recibe los cambios. Como el repositorio está conectado con Vercel, Vercel inicia automáticamente un nuevo despliegue.

El flujo normal es:

1. Editas y guardas el código.
2. Ejecutas `git add`, `git commit` y `git push`.
3. Vercel detecta el cambio.
4. Vercel compila y publica la versión nueva.
5. Los cambios aparecen en `calleochostore.com` cuando el despliegue finaliza correctamente.

No es necesario volver a importar el proyecto en Vercel cada vez.
