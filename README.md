# GuateGambas - Full Stack Portfolio Project

Proyecto de portafolio orientado a una tienda digital de gambas ornamentales e insumos para gambario.

## Objetivo
Construir una vitrina y sistema de pedidos enfocado en tu inventario actual:
- Bloody Mary
- Cherry
- Golden Bee
- Sustrato por porciones
- Salty Shrimp por porciones
- Filtros de pulmón
- Hojas de catappa

## Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- API Routes (backend en el mismo proyecto)
- Prisma ORM + PostgreSQL
- GitHub Actions para CI
- Vercel para CD

## Funcionalidades implementadas
- Catalogo por productos y secciones
- Carrito de compras para pedidos
- Formulario de pedidos conectado a backend (`POST /api/orders`)
- Endpoint para pedidos (`GET /api/orders`)
- Endpoint para inventario (`GET /api/species`)
- Panel admin para ver y filtrar pedidos (`/admin`)
- Pipeline CI (lint + build)
- CD a Vercel en push a `main`

## Productos actuales
- Bloody Mary
- Cherry
- Golden Bee
- Sustrato por porciones
- Salty Shrimp por porciones
- Filtros de pulmón
- Hojas de catappa

## Variables de entorno
1. Copia `.env.example` a `.env`.
2. Configura:
   - `DATABASE_URL`
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID`

Para GitHub Actions (secrets del repo):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL` (si necesitas ejecutar migraciones en CI/CD)

## Ejecutar local
```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
Abre `http://localhost:3000`.

## Endpoints
- `GET /api/species`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/social`

### Filtros de admin
- `GET /api/orders?city=guatemala`
- `GET /api/orders?from=2026-03-01&to=2026-03-31`

## CI/CD
Flujo en `.github/workflows/ci.yml`:
- Instala dependencias
- Genera Prisma Client
- Ejecuta lint
- Ejecuta build

Flujo en `.github/workflows/cd-vercel.yml`:
- Se ejecuta en push a `main`
- Compila artefactos con Vercel CLI
- Publica a Vercel en produccion

## Roadmap siguiente fase
- Autenticacion para `/admin`
- Inventario por stock real
- Estados de pedido (`pending`, `confirmed`, `delivered`)
- Notificaciones por WhatsApp/Email
