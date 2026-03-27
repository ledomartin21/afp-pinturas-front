<p align="center">
  <img src="public/images/logo.png" alt="AFP Pinturas" height="80" />
</p>

<h1 align="center">AFP Pinturas</h1>

<p align="center">
  E-commerce movil B2B para AFP Pinturas — corralon de pinturas y materiales.
</p>

---

## Sobre el proyecto

Aplicacion web mobile-first orientada a clientes mayoristas de AFP Pinturas. Permite explorar el catalogo de productos, gestionar pedidos, realizar reservas de productos sin stock y administrar carruseles promocionales.

### Funcionalidades principales

- **Catalogo de productos** — Busqueda con debounce, filtros por categoria/marca/precio, paginacion y navegacion por categorias desde el menu lateral.
- **Carrito de compras** — Agregar productos desde el catalogo o detalle, controles de cantidad inline, descuentos administrativos por item.
- **Reservas** — Productos sin stock o con cantidad superior al disponible pueden reservarse mediante un dialog de confirmacion (tanto desde el catalogo como desde el detalle del producto).
- **Checkout** — Metodo de entrega (delivery/retiro en sucursal), metodo de pago (transferencia/efectivo), direccion de entrega con 4 campos.
- **Pago por transferencia** — Pantalla con datos bancarios, botones de copiar y envio de comprobante por WhatsApp.
- **Mis pedidos** — Listado de pedidos con cards colapsables, detalle con stepper de progreso visual.
- **Perfil de usuario** — Datos personales editables, direccion de entrega (misma estructura que el checkout).
- **Admin** — Gestion de carruseles promocionales (crear, editar, activar/desactivar, subir flyers via Cloudinary).
- **WhatsApp flotante** — Boton de contacto disponible en todas las pantallas.

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | [Next.js](https://nextjs.org/) 16 + React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) v4 con CSS variables (oklch) |
| Componentes | [shadcn/ui](https://ui.shadcn.com/) (New York) + Radix UI |
| Iconos | [Lucide](https://lucide.dev/) |
| Carousel | [Embla Carousel](https://www.embla-carousel.com/) |
| Deploy | [Vercel](https://vercel.com/) |

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- Backend corriendo en `http://localhost:3002` (el frontend hace proxy via `/api/*`)

## Instalacion

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd afp-pinturas-front

# Instalar dependencias
npm install
```

## Uso

```bash
# Servidor de desarrollo
npm run dev

# Build de produccion
npm run build

# Servidor de produccion
npm run start

# Linter
npm run lint
```

La aplicacion estara disponible en [http://localhost:3000](http://localhost:3000).

## Arquitectura

La aplicacion es una **SPA** (Single Page Application) que maneja toda la navegacion client-side dentro de `app/page.tsx` usando `window.history.pushState`. No utiliza el routing de Next.js.

```
app/
  page.tsx              # Router principal SPA y estado global
  layout.tsx            # Root layout
  globals.css           # Tema de colores y Tailwind

components/
  login-screen.tsx      # Autenticacion
  home-screen.tsx       # Pantalla de inicio
  catalog-screen.tsx    # Catalogo de productos
  product-detail-screen.tsx  # Detalle de producto
  cart-screen.tsx       # Carrito de compras
  checkout-screen.tsx   # Proceso de pago
  orders-screen.tsx     # Listado de pedidos
  profile-screen.tsx    # Perfil de usuario
  sidebar-menu.tsx      # Menu lateral de navegacion
  ui/                   # Componentes shadcn/ui

lib/
  api/                  # Servicios HTTP (auth, productos, pedidos, etc.)
  config/               # Configuracion de API y constantes
  types/                # Tipos TypeScript
```

## Conexion con el backend

El frontend se comunica con el backend a traves de un proxy configurado en `next.config.mjs`:

```
/api/* → http://localhost:3002/*
```

La autenticacion usa cookies HTTP-only con auto-refresh de token en respuestas 401.

### Endpoints principales

| Modulo | Endpoint | Descripcion |
|--------|----------|-------------|
| Auth | `POST /auth/login` | Inicio de sesion |
| Auth | `POST /auth/registrar` | Registro |
| Productos | `GET /producto/paginado` | Catalogo paginado con filtros |
| Productos | `GET /producto/{id}` | Detalle de producto |
| Pedidos | `POST /pedido` | Crear pedido |
| Pedidos | `GET /pedido` | Listar pedidos |
| Usuario | `GET/PUT /user/profile` | Perfil de usuario |
| Carrusel | `GET/POST /carrusel` | Gestion de carruseles |

## Variables de entorno

No se requieren variables de entorno para desarrollo local. El proxy al backend esta configurado directamente en `next.config.mjs`.

Para produccion, las rewrites deben apuntar a la URL del backend desplegado.

## Licencia

Proyecto privado - AFP Pinturas.
