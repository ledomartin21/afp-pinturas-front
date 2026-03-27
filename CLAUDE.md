# AFP Pinturas - Frontend

E-commerce móvil B2B para AFP Pinturas (corralón de pinturas). Next.js 16 + React 19 + TypeScript + Tailwind CSS v4.

## Stack

- **Framework**: Next.js 16.0.10, React 19.2.0, TypeScript 5
- **UI**: Shadcn/ui (New York style) + Radix UI + Lucide icons
- **Estilos**: Tailwind CSS 4.1.9 con CSS variables en oklch
- **Forms**: React Hook Form + Zod
- **Carousel**: Embla Carousel
- **Deploy**: Vercel (con Analytics)

## Comandos

```bash
npm run dev      # Dev server en localhost:3000
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # ESLint
```

## Arquitectura

SPA con navegación por screens dentro de `app/page.tsx`. No usa Next.js routing - toda la navegación es client-side con `window.history.pushState`.

### Estructura de directorios

```
app/
  layout.tsx          # Root layout (lang="es", Geist font, Vercel Analytics)
  page.tsx            # Router principal SPA (~340 líneas). Maneja estado global:
                      #   currentScreen, cart, isLoggedIn, isAdmin, sidebarOpen
                      #   Incluye WhatsApp flotante global y SidebarMenu
  globals.css         # Tema de colores (oklch), dark mode, Tailwind theme

components/
  login-screen.tsx    # Login/Register. Register redirige a WhatsApp para solicitar cuenta
  home-screen.tsx     # Home: header dorado, acciones rápidas (pedido/mis pedidos),
                      #   categorías expandibles, carruseles de flyers con auto-advance
  catalog-screen.tsx  # Catálogo: búsqueda con debounce, filtros (bottom sheet por categoría/
                      #   marca/precio), lista horizontal compacta con controles de cantidad inline,
                      #   paginación, reserva con dialog (mismo patrón que product-detail),
                      #   acepta initialCategory desde sidebar para filtrar por categoría
  product-detail-screen.tsx  # Detalle: header dorado con back/logo/carrito, galería de imágenes
                      #   con thumbnails, SKU, qty selector, descuento admin, productos relacionados
  cart-screen.tsx     # Carrito: items con qty controls, descuentos por item, resumen de totales
  checkout-screen.tsx # Checkout: método entrega (delivery $2500/pickup gratis), método pago
                      #   (transferencia/efectivo), dirección (4 campos), resumen del pedido
  transfer-payment-screen.tsx  # Datos bancarios (Banco Nación, CBU, alias) con botones copiar,
                      #   instrucciones paso a paso, envío comprobante por WhatsApp
  orders-screen.tsx   # Lista de pedidos: header dorado, cards colapsables con items
                      #   y botón "Ver detalle"
  order-detail-screen.tsx  # Detalle de pedido: stepper de progreso visual, entrega/pago, items
  profile-screen.tsx  # Perfil: header dorado con avatar/iniciales, datos personales
                      #   editables, dirección de entrega (4 campos: calle/ciudad/cp/provincia,
                      #   almacenados concatenados en campo "domicilio" del backend), logout
  admin-carousel-screen.tsx  # Admin: lista/crear/detalle de carruseles, activar/desactivar,
                      #   editar inline, upload de flyers (Cloudinary), eliminar con confirmación
  sidebar-menu.tsx    # Menú lateral (Sheet left): header dorado con logo, nav con catálogo
                      #   expandible (subcategorías con navegación filtrada), pedidos, perfil,
                      #   logout, redes sociales (Facebook/Instagram)
  mobile-nav.tsx      # Nav inferior fijo (4-5 items). No se usa actualmente en page.tsx
  theme-provider.tsx  # Wrapper de next-themes
  ui/                 # ~50 componentes Shadcn/ui (button, card, sheet, dialog, etc.)

lib/
  api/
    client.ts         # HTTP client con auto-refresh de token en 401
    auth.service.ts   # Login, register, refresh, logout, verify
    products.service.ts  # Productos paginados, filtros, imágenes, catálogos (rubros/marcas)
    orders.service.ts    # CRUD pedidos, mapeo de estados API→frontend
    carousel.service.ts  # CRUD carruseles, upload/delete flyers
    user.service.ts      # Get/update perfil de usuario
    index.ts             # Re-exports de todos los services
  config/
    api.ts            # BASE_URL="/api", endpoints map, headers
    constants.ts      # WHATSAPP_NUMBER, ITEMS_PER_PAGE=20, ADMIN_ROL_ID=1
  types/
    index.ts          # Todos los tipos TS: Screen, Product, CartItem, Order, User, Carrusel, etc.
  utils.ts            # cn() - classname merge helper (clsx + tailwind-merge)

hooks/
  use-mobile.ts       # useIsMobile() - breakpoint 768px
  use-toast.ts        # useToast() - sistema de notificaciones
```

## API Backend

- Proxy: `/api/*` → `http://localhost:3002/*` (configurado en `next.config.mjs`)
- Auth: Cookies HTTP-only (`credentials: "include"`)
- Auto-refresh: El client reintenta con refresh token en respuestas 401

### Endpoints principales

| Módulo | Método | Endpoint | Descripción |
|--------|--------|----------|-------------|
| Auth | POST | `/auth/login` | Login → `{ usuarioId, rolId }` |
| Auth | POST | `/auth/registrar` | Registro |
| Auth | GET | `/auth/refresh` | Refresh token |
| Auth | POST | `/auth/logout` | Logout |
| Productos | GET | `/producto/paginado` | Listado paginado con filtros |
| Productos | GET | `/producto/{id}` | Detalle producto |
| Productos | GET | `/producto/{codigo}/imagen` | Imágenes del producto |
| Pedidos | POST | `/pedido` | Crear pedido |
| Pedidos | GET | `/pedido` | Listar pedidos del usuario |
| Pedidos | GET | `/pedido/{id}` | Detalle pedido |
| Carrusel | GET/POST | `/carrusel` | CRUD carruseles |
| Flyer | POST | `/flyer` | Upload flyer (FormData) |
| User | GET/PUT | `/user/profile` | Perfil usuario |

### Mapeo de campos API → Frontend

Los services en `lib/api/` mapean campos del backend (español) al frontend (inglés):
- `codigo` → `id` (con trim, el backend envía espacios al final), `precio` → `price`, `urlImagen` → `image`
- `rubroId` → `category` (con lookup en mapa local), `marcaId` → `brand`
- Estados de pedido: `pendiente`→`pending`, `procesando`→`processing`, `enviado`→`shipped`, `entregado`→`delivered`

## Paleta de colores (Design System)

Definida en `app/globals.css` usando oklch. Para cambiar colores, modificar solo las CSS variables en `:root`.

| Token | Valor oklch | Uso |
|-------|------------|-----|
| `--primary` | `oklch(0.75 0.15 85)` | Header dorado, botones, iconos activos |
| `--secondary` | `oklch(0.65 0.12 85)` | Variante dorada más oscura |
| `--accent` | `oklch(0.85 0.12 85)` | Highlights, badges, hover |
| `--background` | `oklch(0.98 0.005 90)` | Fondo general crema cálido |
| `--foreground` | `oklch(0.2 0.02 90)` | Texto principal oscuro |
| `--destructive` | `oklch(0.45 0.15 25)` | Rojo (~#ae3b36) para SKUs y acciones destructivas |
| `--card` | `oklch(1 0 0)` | Fondo de tarjetas (blanco) |
| `--muted` | `oklch(0.96 0.005 90)` | Fondo suave, disabled |
| `--border` | `oklch(0.9 0.005 90)` | Bordes cálidos |
| `--radius` | `0.625rem` (10px) | Border radius global |

Dark mode está configurado en globals.css pero no está activo en la app.

## Patrones de diseño UI

### Dos patrones de header

1. **Header dorado (pantallas principales)**: `bg-primary rounded-b-xl shadow-lg` con botones circulares `bg-white/20 border-white/30`. Logo centrado. Usado en: home, catalog, orders, profile, product-detail.
   - Botón izquierdo: hamburger (Menu) o back (ArrowLeft)
   - Botón derecho: carrito con badge de cantidad
   - Stats cards con overlap negativo (`-mt-3` o `-mt-4`) (solo en home)

2. **Header blanco (sub-pantallas)**: `bg-card border-b` con barra `bg-accent` de 1-4px arriba. Usado en: cart, checkout, transfer-payment, order-detail, admin-carousel.
   - Back arrow simple + título

### Patrones generales

- **Cards**: `border-0 shadow-sm` en pantallas principales, `border-2` en formularios (checkout, cart)
- **Botones circulares en header**: `w-10 h-10 rounded-full bg-white/20 border border-white/30`
- **Badge de carrito**: `bg-white text-primary` sobre botón del header
- **Cards de producto**: Layout horizontal (imagen izq + info der) en catálogo, grid 2 cols en relacionados
- **SKU**: `text-[10px] font-bold uppercase tracking-wider text-destructive`
- **Bottom sheet**: Filtros del catálogo usan `Sheet` con `side="bottom"`
- **Floating WhatsApp**: Botón verde fijo en bottom-right, global para todas las pantallas logueadas (en page.tsx)
- **Status badges**: Color-coded por estado (amber/blue/purple/green) en pedidos
- **Section headers en cards**: `bg-primary/10 border-b border-primary/15` (profile), `bg-blue-50` (admin info), `bg-green-50` (admin upload)
- **Iconos con fondo**: `w-7 h-7 rounded-lg bg-primary` con icono blanco para section headers
- **Stats cards**: Grid de 3 columnas con icono en `bg-primary/15`, número grande, label pequeño (solo en home)
- **Border radius**: 10px (Stitch design language) global via `--radius`

## Flujos principales

### Autenticación
1. Bootstrap: `authService.refresh()` al montar → restaura sesión si hay cookie válida
2. Login con `nombreUsuario` + `contrasena` → guarda `rolId` y `usuarioId` en localStorage
3. Register: redirige a WhatsApp con datos para solicitar cuenta manualmente
4. Admin si `rolId === 1`

### Compra
1. Catálogo → filtros (categoría, marca, precio, búsqueda con debounce 400ms) → paginado 20 items
2. Agregar al carrito directo desde catálogo (controles +/- inline) o desde detalle de producto
3. Detalle producto → galería con thumbnails, cantidad, descuento admin opcional, productos relacionados
4. Carrito → resumen con descuentos por item
5. Checkout → entrega (delivery $2500 / pickup gratis) + pago (transferencia/efectivo)
6. Si transferencia → pantalla con datos bancarios (Banco Nación, CBU, alias) + envío comprobante por WhatsApp
7. Pedido creado → lista de pedidos

### Reserva (sin stock)
1. Producto sin stock o cantidad mayor al stock → dialog de confirmación (tanto en catálogo como en detalle de producto)
2. Si acepta → se agrega al carrito como reserva con feedback visual
3. En catálogo se muestra icono CalendarClock amber cuando qty >= stock

### Admin
- Gestión de carruseles (activar/desactivar, crear, editar nombre/descripción, eliminar)
- Upload de flyers (imágenes vía Cloudinary)
- Descuento porcentual en detalle de producto

## Referencia de diseño

Las vistas de referencia están en Stitch (MCP). Ver `docs/stitch.md` para IDs de proyecto y pantallas.
- Catálogo: `dafefe152aae4b079941f358b8ffb570`
- Menú: `fa608980b57a489cb94c2f36ed0584c2`
- Home: `07231ca1a717429497012a2217568572`
