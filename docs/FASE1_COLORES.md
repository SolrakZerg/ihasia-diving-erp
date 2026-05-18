# Plan Detallado - Fase 1: Cambio de Colores y Estandarización CSS (DEFINTIVO)

Este documento contiene el plan detallado sin resúmenes para aplicar la estandarización de colores y estilos CSS en cada sección de la aplicación, utilizando las variables de accesibilidad reales creadas en `index.css` y la lista de colores prohibidos detectados en la auditoría.

## Objetivo
Transformar el aspecto visual de cada vista para que coincida con la paleta de colores oscuros, bordes sutiles y efectos de desenfoque (blur) de la sección SSI, garantizando una experiencia visual premium y uniforme en toda la aplicación.

## 1. Paleta de Colores y Clases Tailwind a Utilizar

### 1.1 Fondos (Backgrounds)
- **Fondo Principal de la Vista**: `bg-surface` (Variable: `--color-surface`). Es el color oscuro profundo que sirve de base para toda la pantalla.
- **Fondo de Cabeceras (Headers)**: `bg-surface/80` combinado con `backdrop-blur-xl`. Esto crea el efecto de cristal translúcido (glassmorphism) que deja ver lo que hay detrás difuminado.
- **Fondo de Barras Laterales o Paneles**: `bg-surface-soft` (Variable: `--color-surface-soft`). Un tono ligeramente más claro que el fondo principal para dar profundidad y separar zonas.
- **Fondo de Tarjetas o Bloques**: `bg-surface` o `bg-surface-soft` según la jerarquía y el contraste que se busque.
- **Fondo de Elementos Activos (Botones, Selección)**: `bg-brand` (color de marca azul) o `bg-brand/10` para estados hover/focus que no requieran tanto peso visual.

### 1.2 Bordes (Borders)
- **Borde Estándar**: `border-surface-edge` (Variable: `--color-surface-edge`). Se usa para delimitar secciones, tablas y tarjetas. Es un color sutil que no compite con el contenido.
- **Borde de Cabeceras**: `border-surface-edge/50`. Aún más sutil (50% de opacidad) para la línea inferior de las cabeceras pegajosas, para que no corte el diseño bruscamente.

### 1.3 Textos (Typography) ⚠️ USAR ESTAS VARIABLES SIEMPRE
- **Títulos Principales y Texto Destacado**: `text-white`. Máximo contraste sobre el fondo oscuro.
- **Textos Secundarios y Descripciones**: `text-text-muted` (Variable: `--color-text-muted`). Se usa para textos legibles pero secundarios.
- **Iconos y Decoración**: `text-text-dim` (Variable: `--color-text-dim`). Para elementos que no requieren lectura crítica o son puramente decorativos.
- **Cabeceras de Tablas**: `text-text-header` (Variable: `--color-text-header`). Específico para los títulos de las columnas en las tablas (`<th>`).
- **Textos de Marca o Acentos**: `text-brand-light` o `text-brand`. Se usa para resaltar números, iconos activos o enlaces que deban llamar la atención.

## 2. Aplicación Detallada por Componente

### 2.1 En las Cabeceras (Headers)
- El contenedor principal de la cabecera debe llevar las clases: `bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50`.
- Los títulos deben ser `text-white` y tener un tamaño grande (ej. `text-2xl` o `text-3xl`) con fuente semibold o bold.
- Los selectores de fecha o filtros deben usar fondos oscuros a juego y bordes sutiles para no desentonar con el cristal de la cabecera.

### 2.2 En las Tablas (Tables)
- La cabecera de la tabla (`<thead>`) debe tener un fondo sutil o ser transparente si el contenedor ya tiene fondo. Los textos de la cabecera deben usar la clase **`text-text-header`** en mayúsculas (`uppercase`) y tamaño pequeño (`text-xs` o `text-sm`).
- Las filas (`<tr>`) deben tener un borde inferior `border-b border-surface-edge/50` para separarlas de forma limpia sin usar líneas gruesas.
- Los textos de las celdas (`<td>`) deben usar `text-white` para los datos importantes (nombres, totales) y **`text-text-muted`** para datos secundarios o de relleno.
- Las columnas con dinero o totales deben usar colores de acento (ej. amarillo/dorado o verde según la semántica) pero manteniendo el estilo premium sin colores chillones.

### 2.3 En las Barras Laterales de Vista (Sidebars de Sección)
- El contenedor debe usar `bg-surface-soft` y tener un borde que lo separe de la tabla: `border-l border-surface-edge` (si va a la derecha).
- Los bloques de información dentro del sidebar (ej. "Ajustes", "Pagado") deben usar tarjetas con bordes sutiles y títulos claros.

## 3. Tabla de Colores Prohibidos y sus Sustitutos

Basándonos en la auditoría de la aplicación, **queda prohibido** usar los siguientes colores hardcodeados de Tailwind en las vistas normales. Se deben sustituir por las variables correctas:

| Color Prohibido | ¿Por qué no usarlo? | Sustituto Correcto | Uso Principal |
| :--- | :--- | :--- | :--- |
| `text-red-500`, `text-red-400` | No encajan en la estética premium y tienen peor contraste. | `text-danger` (o `text-rose-400`) | Gastos, negativos, botones de borrar, caducados. |
| `text-gray-500`, `text-slate-500` | Tienen muy bajo contraste sobre el fondo oscuro (no pasan accesibilidad). | `text-text-header` o `text-text-muted` | Cabeceras de tablas, subtítulos, textos secundarios. |
| `bg-slate-800`, `bg-slate-900`, `bg-slate-950` | No están en el tema y rompen la uniformidad de la interfaz. | `bg-surface` o `bg-surface-soft` | Fondos de contenedor, tarjetas, paneles. |
| `border-gray-500` | Rompe la sutileza de los bordes del diseño premium. | `border-surface-edge` (o `/50`) | Bordes de sección, tablas y filtros. |

---
*Excepción Única: La factura imprimible de Carabao (`Carabao_Invoice_View.jsx`) es la única que puede usar temas claros y colores hardcodeados porque imita al papel para impresión.*
