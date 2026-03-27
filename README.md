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
- Persistencia de pedidos en `data/orders.json` (fase actual)
- GitHub Actions para CI

## Funcionalidades implementadas
- Catalogo por especies con galeria de fotos y enlaces de video
- Packs de venta con carrito de compras
- Formulario de pedidos conectado a backend (`POST /api/orders`)
- Endpoint para publicaciones/redes (`GET /api/social`)
- Endpoint para especies y packs (`GET /api/species`)
- Pipeline CI (lint + build)

## Ejecutar local
```powershell
npm install
npm run dev
```
Abre `http://localhost:3000`.

## Endpoints
- `GET /api/species`
- `GET /api/social`
- `GET /api/orders`
- `POST /api/orders`

## CI/CD
Flujo en `.github/workflows/ci.yml`:
- Instala dependencias
- Ejecuta lint
- Ejecuta build

## Roadmap siguiente fase
- Migrar pedidos a base de datos real (PostgreSQL/MongoDB)
- Login admin y panel de gestion de pedidos
- Integracion real de Instagram Graph API
- Deploy automatico (Vercel + GitHub)
