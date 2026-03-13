# Guía de Integración con el Backend

## Estructura de la API

La aplicación está lista para conectarse con un backend. Todos los servicios están organizados en `lib/api/`.

## Configuración

1. **Variables de Entorno**: Copia `.env.local.example` a `.env.local` y configura:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.com/api
   ```

2. **Endpoints Disponibles**: Definidos en `lib/config/api.ts`

## Servicios Disponibles

### AuthService (`lib/api/auth.service.ts`)
```typescript
import { authService } from '@/lib/api'

// Login
const { user, token } = await authService.login({ email, password })

// Logout
await authService.logout()

// Verificar token
const user = await authService.verifyToken()
```

### ProductsService (`lib/api/products.service.ts`)
```typescript
import { productsService } from '@/lib/api'

// Obtener productos con filtros
const products = await productsService.getProducts({
  category: 'herramientas',
  brand: 'Bosch',
  minPrice: 100,
  maxPrice: 500
})

// Obtener producto por ID
const product = await productsService.getProductById('123')

// Buscar productos
const results = await productsService.searchProducts('taladro')
```

### OrdersService (`lib/api/orders.service.ts`)
```typescript
import { ordersService } from '@/lib/api'

// Crear pedido
const order = await ordersService.createOrder({
  items: cartItems,
  shippingAddress: { ... },
  paymentMethod: 'credit_card'
})

// Obtener pedidos del usuario
const orders = await ordersService.getOrders()

// Actualizar estado (admin)
await ordersService.updateOrderStatus('order123', 'shipped')
```

### InvoicesService (`lib/api/invoices.service.ts`)
```typescript
import { invoicesService } from '@/lib/api'

// Obtener facturas
const invoices = await invoicesService.getInvoices()

// Descargar PDF
const blob = await invoicesService.downloadInvoicePDF('invoice123')
```

## Manejo de Errores

Todos los servicios usan `ApiError` para errores consistentes:

```typescript
try {
  const products = await productsService.getProducts()
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.status}: ${error.message}`)
  }
}
```

## Próximos Pasos

1. Implementar el backend con los endpoints definidos en `lib/config/api.ts`
2. Actualizar los componentes para usar los servicios en lugar de datos mock
3. Agregar autenticación JWT en las peticiones (ya está preparado en el token storage)
4. Implementar refresh token si es necesario
