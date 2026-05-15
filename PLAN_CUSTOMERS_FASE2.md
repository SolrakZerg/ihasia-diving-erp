# Plan Detallado - Fase 2: Adaptabilidad Móvil en Sección "Clientes"

Este documento contiene las propuestas para mejorar la adaptabilidad móvil en la sección de Clientes, aplicando las reglas de `FASE2_MOVIL.md`.

## 1. Contenedor Principal (`Customers_View.jsx`)

### Propuestas:
- **Reducir Padding Lateral**: El contenedor actual usa `p-6 lg:p-10`. Se propone cambiarlo por **`p-2 sm:p-6 lg:p-8`** (siguiendo la Regla 2.2 de la Fase 2). Esto reducirá el padding en móvil de 24px a solo 8px, aprovechando mucho mejor la pantalla del teléfono para la tabla.

## 2. Cabecera (`Customers_Header.jsx`)

### Propuestas:
- **Control de Desbordamiento**: El contenedor de los controles (búsqueda, botones) usa `flex gap-3`. Si la pantalla es muy estrecha, estos botones se van a amontonar. Se propone añadir **`overflow-x-auto`** al contenedor de los controles (línea 30 aprox.) para que se puedan deslizar horizontalmente en móviles muy pequeños si no caben.
- **Centrado de Títulos**: Se propone añadir clases para que el título "Clientes" y el subtítulo se centren en móvil y se alineen a la izquierda en escritorio (Regla 1.4).

## 3. Tabla (`Customers_Table.jsx`)

### Propuestas:
- **El Problema del Ancho Mínimo**: Actualmente la tabla tiene un ancho mínimo forzado de `min-w-[1000px]` en vista normal y `min-w-[2200px]` en vista extendida. Esto asegura que los datos no se pisen, pero **obliga a hacer scroll horizontal** en móviles.
- **Acciones Propuestas**:
    1.  **Preguntar al usuario** qué columnas de la vista normal (1000px) se podrían ocultar en móvil (ej. "Registro", "WhatsApp" o "Reserva") para intentar bajar ese mínimo de 1000px a algo más manejable como 600px o 700px.
    2.  Para las columnas que se decidan ocultar, aplicar la clase **`hidden md:table-cell`**.
    3.  En la vista extendida (`min-w-[2200px]`), el scroll horizontal es inevitable y correcto, ya que son demasiados datos para un móvil.

---
*Este plan es puramente teórico. No se ha modificado ningún archivo.*
