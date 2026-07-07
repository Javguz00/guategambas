# GuateGambas - Sistema de Venta Online de Gambas 🦐

**Sistema profesional de e-commerce para la venta de gambas premium en Guatemala.**

Plataforma completa, moderna y responsive para vender gambas en línea con catálogo profesional, carrito de compras, admin dashboard y gestión de órdenes.

## 🎯 Características Principales

### 🛒 Para Clientes
- ✅ **Catálogo moderno** con búsqueda y filtros por categoría
- ✅ **Detalle de producto** con imágenes y stock en tiempo real
- ✅ **Carrito de compras** persistente (localStorage)
- ✅ **Checkout seguro** con múltiples métodos de pago
- ✅ **Diseño responsive** (móvil, tablet, desktop)
- ✅ **Landing page** profesional

### 👨‍💼 Para Administradores
- ✅ **Dashboard** con estadísticas en tiempo real
- ✅ **Gestión de productos** (CRUD completo)
- ✅ **Gestión de categorías**
- ✅ **Gestión de órdenes** con cambio de estado
- ✅ **Control de inventario**
- ✅ **Autenticación segura** con JWT + bcryptjs

## 🛠️ Stack Tecnológico

| Aspecto | Tecnología |
|---------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 3 |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcryptjs |
| Hosting | Vercel (recomendado) |

## 📊 Estructura del Proyecto

```
app/
├── (public)/              # Rutas públicas (clientes)
│   ├── page.tsx           # 🏠 Landing page
│   ├── products/          # 🛍️ Catálogo
│   ├── products/[id]/     # 📄 Detalle producto
│   ├── checkout/          # 🛒 Carrito y checkout
│   └── login/             # 🔐 Login admin
│
├── (admin)/               # Rutas protegidas (admin only)
│   ├── dashboard/         # 📊 Dashboard principal
│   ├── products/          # 📦 Gestión productos
│   ├── products/new       # ➕ Crear producto
│   ├── products/[id]      # ✏️ Editar producto
│   ├── orders/            # 📋 Gestión órdenes
│   └── inventory/         # 📈 Control inventario
│
├── api/                   # 🔌 API REST
│   ├── products/          # Productos CRUD
│   ├── categories/        # Categorías
│   ├── orders/            # Órdenes
│   ├── checkout/          # Checkout
│   └── auth/              # Autenticación
│
├── components/            # 🎨 Componentes React
│   ├── ui/                # Botones, inputs, badges
│   ├── layout/            # Header, footer, sidebar
│   ├── products/          # ProductCard, grid
│   ├── cart/              # CartSummary, checkout form
│   └── orders/            # OrderTable, detail
│
└── lib/                   # 🔧 Utilidades
    ├── db.ts              # Prisma singleton
    ├── auth.ts            # Funciones auth
    ├── types.ts           # Tipos TypeScript
    ├── validators.ts      # Validadores
    └── api-helpers.ts     # Helpers API
```

## 🚀 Inicio Rápido

### Prerrequisitos
- **Node.js** 18+
- **npm** o yarn
- **PostgreSQL** (local o en la nube)

### Instalación

1️⃣ **Instalar dependencias**
```bash
npm install
```

2️⃣ **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus datos
```

3️⃣ **Migrar y llenar base de datos**
```bash
npx prisma migrate dev
npm run prisma:seed
```

4️⃣ **Iniciar en desarrollo**
```bash
npm run dev
```

5️⃣ **Abrir en navegador**
```
http://localhost:3000
```

## 👤 Credenciales por Defecto

| Campo | Valor |
|-------|-------|
| Email | `admin@guategambas.com` |
| Contraseña | `admin123` |

⚠️ **IMPORTANTE**: Cambiar credenciales en producción

## 🔌 API Endpoints

### 📦 Productos
```
GET    /api/products              # Listar todos
GET    /api/products?category=X   # Filtrar por categoría
POST   /api/products              # Crear (admin)
PUT    /api/products/[id]         # Actualizar (admin)
DELETE /api/products/[id]         # Eliminar (admin)
```

### 🏷️ Categorías
```
GET  /api/categories       # Listar
POST /api/categories       # Crear (admin)
```

### 📋 Órdenes
```
POST   /api/orders         # Crear
GET    /api/orders         # Listar (admin)
GET    /api/orders/[id]    # Detalle
PUT    /api/orders/[id]    # Actualizar estado (admin)
```

### 🔐 Autenticación
```
POST /api/auth/login       # Login
POST /api/auth/logout      # Logout
```

### 💳 Checkout
```
POST /api/checkout         # Procesar carrito
```

## 🎨 Diseño y Colores

| Elemento | Color | Valor |
|----------|-------|-------|
| Primario | Rojo | #FF6B6B |
| Secundario | Verde agua | #4ECDC4 |
| Oscuro | Gris oscuro | #2D3436 |
| Claro | Blanco gris | #F5F5F5 |

### 📱 Responsive
- **Desktop**: 4 columnas producto
- **Tablet**: 3 columnas
- **Mobile**: 2 columnas (menú colapsable)

## 📊 Modelos de Base de Datos

### User (Admin)
```prisma
id          String (PK)
email       String (UNIQUE)
password    String (hashed)
name        String
role        UserRole (ADMIN, OWNER)
active      Boolean
createdAt   DateTime
updatedAt   DateTime
```

### Product (Gambas)
```prisma
id          String (PK)
name        String
slug        String (UNIQUE)
description String?
price       Float
stock       Int
categoryId  String (FK)
image       String?
active      Boolean
featured    Boolean
createdAt   DateTime
updatedAt   DateTime
```

### Category (Tipos de Gambas)
```prisma
id          String (PK)
name        String (UNIQUE)
slug        String (UNIQUE)
description String?
icon        String?
createdAt   DateTime
updatedAt   DateTime
```

### Order (Órdenes)
```prisma
id              String (PK)
customerName    String
customerEmail   String
customerPhone   String
city            String
department      String?
address         String?
notes           String?
items           OrderItem[]
subtotal        Float
shippingCost    Float
total           Float
status          OrderStatus
paymentMethod   PaymentMethod
paymentStatus   PaymentStatus
createdAt       DateTime
updatedAt       DateTime
```

### OrderItem (Items en Orden)
```prisma
id          String (PK)
orderId     String (FK)
productId   String (FK)
quantity    Int
price       Float
createdAt   DateTime
```

## 🔒 Seguridad

- ✅ Autenticación JWT en cookies
- ✅ Contraseñas hasheadas con bcryptjs
- ✅ Validación de datos (cliente + servidor)
- ✅ CSRF protection (Next.js built-in)
- ✅ Rate limiting recomendado en producción

## 🛠️ Comandos Disponibles

```bash
# 🚀 Desarrollo
npm run dev          # Iniciar dev server

# 📦 Build
npm run build        # Build producción
npm start            # Start producción

# 🔍 Calidad
npm run lint         # ESLint

# 🗄️ Base de datos
npx prisma migrate dev              # Crear migration
npm run prisma:seed                 # Llenar datos iniciales
npx prisma generate                 # Generar cliente Prisma

# 📝 Troubleshooting
npx prisma studio                   # Visualizar DB (GUI)
```

## 📈 Estadísticas del Proyecto

| Métrica | Cantidad |
|---------|----------|
| Rutas | 24 |
| Componentes | 15+ |
| API Endpoints | 8 |
| Páginas | 13 |
| Modelos Prisma | 5 |
| Commits | 15+ |
| Líneas de código | ~5,000 |

## 🚢 Deployment

### Vercel (Recomendado)

1. **Push a GitHub**
```bash
git push origin javguz00-cleanup-restructure
```

2. **Conectar a Vercel**
   - Ir a [vercel.com](https://vercel.com)
   - Conectar tu repositorio
   - Configurar variables de entorno
   - Deploy automático

3. **Configurar Base de Datos**
   - Usar **Vercel Postgres** o **AWS RDS**
   - Actualizar `DATABASE_URL` en Vercel

## 🐛 Solución de Problemas

### "Base de datos no conecta"
```bash
# Verificar conexión y ejecutar:
npx prisma db push
# O si es primera vez:
npx prisma migrate dev --name init
```

### "Build falla"
```bash
# Limpiar caché:
rm -rf node_modules .next
npm install
npx prisma generate
npm run build
```

### "Middleware auth no funciona"
- Verificar cookies habilitadas en navegador
- Verificar variables de entorno cargadas

## 📧 Variables de Entorno

```env
# Base de Datos
DATABASE_URL="postgresql://user:password@localhost:5432/guategambas"

# Seguridad (cambiar en producción)
JWT_SECRET="tu-secreto-super-seguro"
ADMIN_PASSWORD="admin123"

# Vercel (si deployas allá)
VERCEL_TOKEN=""
VERCEL_ORG_ID=""
VERCEL_PROJECT_ID=""
```

## 🔄 Fases de Desarrollo

| Fase | Estado | Descripción |
|------|--------|-------------|
| **1** | ✅ Completada | Limpieza y restructuración |
| **2** | ✅ Completada | Funcionalidad base (APIs, auth, componentes) |
| **3** | ✅ Completada | Estilos Tailwind CSS |
| **4** | ⏳ Próxima | Testing y optimizaciones |
| **5** | ⏳ Final | Deploy a producción |

## 📝 Próximos Pasos

- [ ] Integración de pagos (Stripe/PayPal)
- [ ] Email automáticos (confirmación órdenes)
- [ ] Sistema de reportes
- [ ] Reviews de productos
- [ ] Multi-idioma (Español/Inglés)
- [ ] Integraciones: WhatsApp, Instagram Feed

## 📄 Licencia

Proyecto privado y propietario de **GuateGambas**.

---

**Construido con ❤️ para los amantes de las gambas de Guatemala** 🦐✨

*Última actualización: 2025-01-06*
