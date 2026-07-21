# Subir Calle Ocho Store a GitHub

Este paquete ya fue limpiado para GitHub:

- No incluye `.env.local`.
- No incluye `node_modules`.
- No incluye `.next`.
- No incluye la carpeta `.git` anterior.
- El dominio y remitente se actualizaron a `calleochostore.com`.

## 1. Crear el repositorio

En GitHub crea un repositorio privado llamado `calle-ocho-store`. No agregues README, `.gitignore` ni licencia desde GitHub porque este proyecto ya los contiene.

## 2. Abrir una terminal en esta carpeta

```bash
git init
git branch -M main
git add .
git commit -m "Initial production-ready Calle Ocho Store"
git remote add origin https://github.com/TU_USUARIO/calle-ocho-store.git
git push -u origin main
```

## 3. Variables locales

Copia `.env.example` a `.env.local` y coloca tus valores reales:

```bash
cp .env.example .env.local
```

Nunca hagas `git add .env.local`.

## 4. Seguridad

La clave antigua de Resend que estuvo en archivos compartidos debe revocarse. Crea una nueva antes del despliegue.
