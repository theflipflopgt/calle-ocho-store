# Despliegue limpio en Vercel

Esta guia evita que el proyecto suba archivos locales de Windows, dependencias instaladas o patches incompletos. El despliegue debe reconstruirse siempre desde `package.json` y `package-lock.json`.

## Diagnostico actual

- El ZIP incluia `node_modules` instalado en Windows.
- Esa carpeta solo traia el paquete nativo de Next/SWC para Windows, no el de Linux que usa Vercel.
- GitHub Desktop mostro cientos de miles de cambios por caches, dependencias y cambios de saltos de linea.
- Algunos archivos `.patch` y `.ps1` quedaron como archivos locales y no deben subirse al repositorio.

## Archivos que si deben subirse

- Codigo de `app/`, `components/`, `lib/`, `contexts/`, `hooks/`, `types/`, `emails/`.
- Configuracion: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.gitignore`, `.gitattributes`, `.vercelignore`.
- Migraciones de Supabase en `supabase/migrations/`.
- Documentacion en `docs/`.

## Archivos que no deben subirse

- `node_modules/`
- `.next/`
- `.vercel/`
- `.env`, `.env.local`, `.env.production`
- Archivos `.patch` usados solo para pruebas locales.
- Scripts `.ps1` temporales.
- Caches de Windows, Codex, npm, pnpm, Vite o GitHub Desktop.

## Configuracion recomendada en Vercel

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: dejar vacio
- Node.js Version: `22.x`

## Variables de entorno requeridas

Publicas, disponibles en navegador:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

Privadas, solo servidor:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `BUSINESS_EMAIL`
- `INTERNAL_API_KEY`

Nunca agregues claves reales al repositorio ni las pegues en capturas publicas.

## Flujo seguro para publicar

1. Cierra el servidor local si esta corriendo.
2. Borra carpetas generadas locales:

   ```bash
   rm -rf node_modules .next
   ```

   En Windows PowerShell:

   ```powershell
   Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue
   ```

3. Instala y prueba localmente:

   ```bash
   npm ci
   npm run build
   npm run lint
   npm run test:run
   ```

4. Revisa cambios antes de hacer commit:

   ```bash
   git status
   git diff --stat
   ```

5. Si GitHub Desktop muestra miles de cambios, no hagas commit. Revisa que no se este seleccionando una carpeta superior como `Documents/` o el perfil de usuario.
6. Sube primero a una rama de prueba o Preview.
7. En Vercel, revisa el primer error real del build. No persigas errores secundarios.
8. Valida la Preview antes de promover a Production.

## Si Git muestra cambios por saltos de linea

Ejecuta una sola vez:

```bash
git add --renormalize .
git status
```

Luego revisa que el cambio sea razonable. Si aparecen archivos fuera del proyecto, cancela y verifica que estas dentro de la carpeta correcta del repositorio.

## Reversion

Si el despliegue falla:

1. En Vercel, vuelve al deploy anterior estable desde el panel de Deployments.
2. No cambies variables de produccion hasta confirmar la causa.
3. Revisa logs de Build y Function.
4. Corrige en una rama nueva y vuelve a generar Preview.
