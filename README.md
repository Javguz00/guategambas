# GuateGambas

Tienda digital de gambas ornamentales, insumos y pedidos para WhatsApp con panel admin y preparación para pagos con tarjeta.

## Objetivo
Construir una tienda lista para venta real con:
- Catálogo público con variantes por grado y unidad
- Pedido por WhatsApp
- Envío FORZA con reglas por departamento
- Panel admin para pedidos, inventario, CRM y pagos
- Preparación para integrar Cubo como pasarela de tarjeta

## Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- API Routes (backend en el mismo proyecto)
- Prisma ORM + PostgreSQL
- GitHub para versionado
- Vercel para deploy

## Funcionalidades implementadas
- Catálogo por productos y secciones
- Carrito de compras para pedidos
- Formulario de pedidos conectado a backend (`POST /api/orders`)
- Envío FORZA con tarifa del 3.8% para pago contra entrega fuera de Guatemala
- Opción de pago con tarjeta preparada para Cubo
- Panel admin para pedidos, inventario, clientes y productos CRM
- API de inventario (`GET /api/species`, `GET /api/catalog`)
- Preparación de pago (`/api/payments/cubo/intent`)

## Productos actuales
- Bloody Mary
- Green Jade
- Orange
- Blue Velvet
- Cherries
- Golden Bee
- Tai Bee
- CRS
- Taiwan CBS
- Suplementos y accesorios del catálogo

## Variables de entorno
1. Copia `.env.example` a `.env`.
2. Configura:
   - `DATABASE_URL`
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
   - `ADMIN_PASSWORD` (opcional, por defecto `G0ld3nb33`)
   - `CUBO_API_BASE_URL` (cuando compartan la API)
   - `CUBO_CHECKOUT_URL` (si Cubo entrega una URL de checkout)
   - `CUBO_API_KEY`
   - `CUBO_PUBLIC_KEY`
   - `CUBO_MERCHANT_ID`
   - `CUBO_WEBHOOK_SECRET`

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
- `GET /api/catalog`
- `PATCH /api/catalog`
- `GET /api/crm/customers`
- `POST /api/crm/customers`
- `GET /api/crm/products`
- `POST /api/crm/products`
- `GET /api/payments/cubo/intent`
- `POST /api/payments/cubo/intent`
- `GET /api/payments/cubo/attempts`

### Filtros de admin
- `GET /api/orders?city=guatemala`
- `GET /api/orders?from=2026-03-01&to=2026-03-31`

## Estado actual
- `admin` protegido por contraseña
- Inventario por variante con stock y ofertas
- CRM básico para clientes y productos
- Preparación de pagos con tarjeta mediante Cubo
- Checkout con WhatsApp como canal principal
