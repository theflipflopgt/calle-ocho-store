# Corrección de transferencia y dependencias

## Transferencia bancaria

La ruta `app/api/orders/create/route.ts` ahora usa la función existente
`create_manual_order` para transferencias bancarias. Por eso la compra por
transferencia ya no depende de ejecutar la migración opcional de NeoPay.

La migración `20260721005000_neopay_readiness.sql` puede permanecer pendiente
hasta contar con la documentación y credenciales oficiales de NeoPay.

## Dependencias

Se actualizaron:

- `next` a `16.2.11`
- `resend` a `6.18.0`

Estas actualizaciones reducen los avisos de auditoría detectados. No se usó
`npm audit fix --force` porque puede introducir cambios incompatibles.

Después de copiar esta versión al repositorio, ejecutar:

```powershell
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm audit --omit=dev
npm run build
```

Los avisos restantes deben revisarse según las versiones disponibles en ese
momento. No se deben ignorar vulnerabilidades críticas ni usar `--force` sin
probar primero el build y el checkout.
