# Tienda responsive AFP Pinturas

## Alcance implementado

Una sola tienda para celular, tablet y PC. Se conserva la identidad dorada y la lógica comercial existente.

- Contenedor centrado de hasta 1280 px; espaciado adaptable desde 768 px.
- Navegación horizontal y buscador en escritorio desde 1024 px. Menú lateral accesible en pantallas menores.
- Encabezado y pie compartidos. En catálogo móvil se usa el buscador local para evitar duplicar búsquedas.
- Catálogo: filtros laterales en PC, Sheet inferior en móvil, productos en una/dos columnas y controles de cantidad accesibles por teclado.
- Detalle de producto: galería e información de compra en dos columnas desde 1024 px, acción de compra junto a cantidad y precio, relacionados en grilla.
- Carrito y checkout: productos/formulario y resumen en dos columnas en escritorio.
- Inicio: bienvenida y carrusel distribuidos en PC, novedades y accesos de cuenta adaptables. Carrusel con pausa y respeto por movimiento reducido.
- Pedidos, cuenta corriente, perfil, promociones, transferencia y formularios de carruseles con anchos y distribuciones adaptables.
- Diálogos de reserva/confirmación limitados a un ancho legible en PC.
- Texto oscuro sobre el color primario dorado y foco visible en controles. El foco del contenido se actualiza al navegar.

## Navegación y estado

`components/storefront.tsx` permanece montado desde `app/layout.tsx`. Las pantallas usan los tipos canónicos de `lib/types`, evitando duplicaciones incompatibles con el carrito persistido.

El catálogo toma su estado desde la URL:

| Parámetro | Ejemplo | Uso |
|---|---|---|
| `buscar` | `latex` | Búsqueda |
| `categoria` | `Pinturas` | Nombre de rubro |
| `marcas` | `AFP\|Otra marca` | Marcas seleccionadas |
| `min`, `max` | `1000`, `30000` | Rango de precio |
| `pagina` | `2` | Página activa |

`/promociones` selecciona el catálogo de promociones. Cambiar filtros reinicia la página. Volver desde un detalle recupera la URL del catálogo anterior.

La ruta independiente `/recuperar` no renderiza una segunda tienda debajo del formulario.

## Verificación realizada

- `npx tsc --noEmit --incremental false`.
- Build de producción con `npm run build` (la configuración existente omite validación de tipos, por eso se verifica TypeScript por separado).
- Navegador Edge/Chromium mediante Playwright, con respuestas de API simuladas:
  - Inicio, catálogo, detalle, carrito, checkout, pedidos, detalle de pedido, perfil y cuenta corriente en 375, 768, 1024 y 1440 px: sin desbordes horizontales.
  - Visibilidad de navegación, búsqueda y filtros según breakpoint.
  - Búsqueda desde encabezado, filtros en URL, regreso desde detalle y paginación.
  - Reserva sin stock y ancho del diálogo.
  - Persistencia del carrito al recargar.
  - Confirmación de pedido con retiro y efectivo (POST interceptado).
  - Invitado → login → regreso a checkout, conservando el carrito.
  - Menú móvil, Sheet de filtros, promociones, transferencia y formulario de carrusel.
  - Sin errores de ejecución de JavaScript en estos recorridos.

`npm run lint` no puede ejecutarse actualmente: el proyecto declara el comando pero no tiene ESLint instalado/configurado.

## Validación pendiente con entorno real

Revisar visualmente con productos y fotografías reales y completar un pedido de prueba contra el backend de desarrollo. Las pruebas de interfaz usan fixtures y no validan autenticación, stock ni creación de pedidos en el servidor real.

El ordenamiento global de resultados no se agregó en esta etapa; requiere definir su contrato con el backend para ordenar todo el catálogo y no solo la página visible.
