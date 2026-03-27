# GuateGambas - Full Stack Portfolio Project

Proyecto orientado a portafolio profesional para practicar frontend, backend, APIs, pedidos y CI/CD.

## Objetivo
Construir una tienda y vitrina digital enfocada en:
- Bloody Mary (Neocaridina davidi)
- Golden Bee (Caridina logemanni)
- Tibee (hibrido Caridina)

## Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- API Routes (backend en el mismo proyecto)
- Prisma ORM + PostgreSQL
- GitHub Actions para CI
- Vercel para CD

## Funcionalidades implementadas
- Catalogo por especies con galeria de fotos y enlaces de video
- Packs de venta con carrito de compras
- Formulario de pedidos conectado a backend (`POST /api/orders`)
- Endpoint para publicaciones/redes (`GET /api/social`)
- Endpoint para especies y packs (`GET /api/species`)
- Panel admin para ver y filtrar pedidos (`/admin`)
- Pipeline CI (lint + build)
- CD a Vercel en push a `main`

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
- `GET /api/social`
- `GET /api/orders`
- `POST /api/orders`

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
- Webhooks de Instagram para actualizaciones en tiempo real
- Inventario y estados de pedido
- Notificaciones por WhatsApp/Email
