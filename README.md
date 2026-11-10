# Dashboard Clarity

Plantilla de panel de datos creada con React, Vite y Bootstrap. Incluye un menú lateral desplegable, métricas, gráfica y tabla de pagos.

## Requisitos

Instala únicamente:

- [Node.js](https://nodejs.org/) 20 o superior
- [Visual Studio Code](https://code.visualstudio.com/)
- pnpm:

```bash
npm install -g pnpm
```

## Ejecutar en Visual Studio Code

1. Abre la carpeta del proyecto en Visual Studio Code.
2. Abre **Terminal > Nueva terminal**.
3. Instala las dependencias:

```bash
pnpm install
```

4. Inicia el servidor local:

```bash
pnpm dev
```

5. Abre en el navegador la dirección que aparece en la terminal. Por defecto:

```text
http://localhost:8443
```

## Compilar para producción

```bash
pnpm build
pnpm preview
```

## Tecnologías

- React
- Vite
- Bootstrap 5

Los datos actuales son de demostración. La conexión con Supabase puede agregarse después de configurar el proyecto y sus credenciales.
