# Plan Detallado - Fase 2: Adaptabilidad a Móvil (Responsive)

Este documento contiene el plan detallado sin resúmenes para aplicar la adaptabilidad móvil en cada sección de la aplicación, basado en las reglas de comportamiento implementadas en la sección SSI y Expenses.

## Objetivo
Asegurar que cada vista de la aplicación sea perfectamente utilizable y visualmente atractiva en dispositivos móviles (pantallas estrechas), eliminando roturas de diseño y scrolls horizontales innecesarios.

## 1. Cabeceras de Sección (Header)

### 1.1 Control de Desbordamiento
- **Regla**: El contenedor de la cabecera debe tener la clase `overflow-x-auto` y `custom-scrollbar`.
- **Detalle**: Si los elementos de la cabecera (título, selectores, botones) no caben en el ancho del móvil, el contenedor permitirá deslizar horizontalmente en lugar de empujar el contenido hacia abajo o romper la cuadrícula. Esto asegura que todo sea accesible sin romper el layout.

### 1.2 Apilamiento (Stacking)
- **Regla**: Cambiar la dirección de flexbox de fila a columna.
- **Detalle**: El contenedor principal de la cabecera debe usar `flex flex-col md:flex-row`. En móvil se verán los elementos uno debajo de otro para aprovechar el espacio vertical; en escritorio se poner uno al lado del otro.

### 1.3 Comportamiento Pegajoso (Sticky)
- **Regla**: Eliminar `sticky` en móvil.
- **Detalle**: No uses `sticky top-0` de forma general. Usa `md:sticky top-0` para que la cabecera solo se quede fija en la parte superior en pantallas grandes. En móvil debe desplazarse hacia arriba con el resto de la página para dejar el 100% del espacio libre para las tablas.

### 1.4 Alineación y Centrado
- **Regla**: Centrar contenido en móvil.
- **Detalle**: Usa las clases `items-center justify-center` combinadas con el `flex-col` en móvil para que los títulos y logos queden perfectamente centrados en la pantalla del teléfono, dándole un aspecto de app nativa.

### 1.5 Padding Horizontal Dinámico
- **Regla**: Escalar el padding según el tamaño de pantalla.
- **Detalle**: El contenedor de la cabecera debe usar `px-3 sm:px-6 lg:px-8`.
  - En móviles (< 640px): `12px` de padding (`px-3`).
  - En pantallas medianas (>= 640px): `24px` de padding (`sm:px-6`).
  - En pantallas grandes (>= 1024px): `32px` de padding (`lg:px-8`).
  - *Nota*: Esto asegura que la cabecera guarde proporción con el contenido de abajo.

### 1.6 Gestión de Widgets o Tarjetas de Resumen
- **Regla**: Usar `flex flex-wrap` en lugar de grids rígidos.
- **Detalle**: Si la cabecera incluye widgets de resumen (como en Gastos), NO uses `grid grid-cols-2` sin control. Usa `flex flex-wrap gap-4 justify-center` y define un ancho mínimo (`min-w-[140px]`). Esto garantiza que si la pantalla es extremadamente estrecha, el segundo widget salte abajo limpiamente en lugar de pisarse con el primero.

## 2. Secciones y Tablas de Datos

### 2.1 Apilamiento de Bloques Principales
- **Regla**: El contenedor que envuelve la tabla y el sidebar debe usar `flex flex-col lg:flex-row`.
- **Detalle**: En móvil, el sidebar (o paneles de resumen) se irá abajo del todo, dejando que la tabla ocupe todo el ancho arriba. En escritorio volverán a estar lado a lado.

### 2.2 Padding Lateral del Contenedor
- **Regla**: Reducir a `8px` en móvil.
- **Detalle**: El contenedor que envuelve las tablas debe usar `p-2 sm:p-6 lg:p-8`. En móvil se reduce a `p-2` (8px) para no desperdiciar ni un milímetro de pantalla en los bordes y dejar espacio para las columnas.

### 2.3 Gestión de Columnas en Tablas
- **Regla 1 (CRÍTICA)**: ⚠️ **PREGUNTAR SIEMPRE AL USUARIO** antes de reducir el padding interno de las columnas (`px-X` en `<td>` o `<th>`) para no amontonar los textos.
- **Regla 2**: Si falta espacio para evitar el scroll horizontal, propone al usuario ocultar columnas no críticas (como hicimos con la columna "Curso" en SSI).
- **Regla 3**: Utilizar `ResizeObserver` en el componente de la tabla para detectar el ancho del contenedor y activar estados de "modo estrecho" que oculten dichas columnas dinámicamente.

---
Este plan se aplicará de manera incremental en cada sección, asegurando que se cumplan todos los puntos antes de dar la vista por terminada.
