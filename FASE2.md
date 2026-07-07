# GuateGambas - FASE 2 ✅

## Completado en FASE 2

### ✅ Autenticación y Backend
- [x] TASK 1: `lib/auth.ts` - Autenticación con bcryptjs y JWT
- [x] TASK 2: `lib/types.ts` - Tipos TypeScript completos
- [x] TASK 3: `lib/api-helpers.ts` - Funciones auxiliares API
- [x] TASK 4: `prisma/seed.ts` - Seed de datos iniciales
- [x] TASK 5: `package.json` - Dependencias (bcryptjs, ts-node)

### ✅ APIs REST
- [x] TASK 6: `/api/products` - CRUD de productos con autenticación admin
- [x] TASK 7: `/api/categories` - CRUD de categorías
- [x] TASK 8: `/api/orders` - CRUD de órdenes con validación de stock
- [x] TASK 9: `/api/checkout` - Procesar carrito a orden

### ✅ Componentes React
- [x] TASK 10: ProductCard, ProductGrid, Header, Footer, AdminSidebar, CartSummary

### ✅ Páginas Públicas
- [x] TASK 11: Landing page (public)
- [x] TASK 12: Catálogo (products) con filtros y paginación
- [x] TASK 13: Detalle producto (products/[id]) con cantidad ajustable

### ✅ Funcionalidad de Carrito y Checkout
- [x] TASK 13-14: Carrito persistente en localStorage y checkout

### ✅ Admin
- [x] TASK 14: Dashboard con estadísticas
- [x] TASK 15-16: Productos - listado y formularios (crear/editar)
- [x] TASK 17: Órdenes - listado y cambio de estado
- [x] TASK 18: Login page (public/login)
- [x] TASK 19: Middleware de autenticación admin

## Cómo ejecutar

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos
```bash
# Crear .env.local con DATABASE_URL (PostgreSQL)
# Ya incluido en el repositorio para desarrollo

# Crear migraciones
npx prisma migrate dev --name init
```

### 3. Ejecutar seed (llenar datos iniciales)
```bash
npm run prisma:seed
# O manualmente:
npx ts-node --transpile-only prisma/seed.ts
```

### 4. Ejecutar desarrollo
```bash
npm run dev
```

Acceso:
- **Public**: http://localhost:3000
- **Admin**: http://localhost:3000/login
  - Email: `admin@guategambas.com`
  - Password: `admin123`

## Estructura del Proyecto

```
app/
├── (admin)/                    # Rutas protegidas admin
│   ├── dashboard/             # Dashboard con stats
│   ├── products/              # CRUD productos
│   └── orders/                # Gestión órdenes
├── (public)/                  # Rutas públicas
│   ├── page.tsx              # Landing
│   ├── products/             # Catálogo
│   ├── checkout/             # Carrito
│   └── login/                # Login admin
├── api/                       # REST APIs
│   ├── auth/                 # Login/Logout
│   ├── products/             # Products CRUD
│   ├── categories/           # Categories CRUD
│   ├── orders/               # Orders CRUD
│   └── checkout/             # Crear orden
└── components/               # React components
    ├── admin/               # Admin components
    ├── products/            # Product components
    └── ui/                  # UI components

lib/
├── auth.ts                   # JWT + bcryptjs auth
├── db.ts                     # Prisma client
├── types.ts                  # TypeScript types
├── api-helpers.ts            # API utilities
├── jwt-utils.ts             # JWT encode/decode
├── cart.ts                   # Cart utilities
└── validators.ts            # Input validators

prisma/
├── schema.prisma            # Database schema
└── seed.ts                  # Initial data
```

## APIs Disponibles

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Productos
- `GET /api/products?category=slug` - Listar productos
- `POST /api/products` - Crear (admin)
- `PUT /api/products/[id]` - Actualizar (admin)
- `DELETE /api/products/[id]` - Eliminar (admin)

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear (admin)

### Órdenes
- `GET /api/orders` - Listar (admin)
- `POST /api/orders` - Crear orden
- `GET /api/orders/[id]` - Detalle
- `PUT /api/orders/[id]` - Actualizar estado (admin)

### Checkout
- `POST /api/checkout` - Procesar carrito

## Datos de Seed

Cuando ejecutas el seed, se crean:

**Admin User**
- Email: `admin@guategambas.com`
- Password: `admin123` (hasheado con bcryptjs)

**4 Categorías**
- Gambas Criadas
- Gambas Silvestres
- Gambas Premium
- Gambas Orgánicas

**8 Productos**
- 2 de cada categoría con precios y stock de ejemplo

## Notas

- Las contraseñas se hashean con bcryptjs (12 rounds)
- Sesiones con JWT en cookies httpOnly
- Autenticación required para rutas `/admin/*`
- Stock automáticamente decrementado en checkout
- Carrito persiste en localStorage del navegador
- Todas las páginas son componentes Client-side (`'use client'`)
