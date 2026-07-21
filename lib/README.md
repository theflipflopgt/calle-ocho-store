# Lib

Utilidades, configuraciones y clientes de servicios externos.

## Estructura:

- **`supabase/`** - Cliente de Supabase (ya configurado con tipos)
  - client.ts - Cliente del navegador
  - server.ts - Cliente del servidor
- **`cloudinary/`** - Utilidades de Cloudinary
  - Configuración
  - Helpers para transformaciones de imágenes
- **`ai/`** - Cliente de Groq para chatbot
  - Configuración
  - Funciones de streaming
- **`utils/`** - Funciones utilitarias
  - Formateo de precios
  - Validaciones
  - Conversión de tallas
  - Generación de slugs
