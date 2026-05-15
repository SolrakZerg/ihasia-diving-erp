# Auditoría Completa de Colores en la Aplicación

Este documento contiene el resumen detallado de la auditoría de colores realizada en todas las carpetas de `src/components/views/`. Sirve como referencia para saber qué colores corregir en cada módulo.

---

## 1. Sección SSI y Dashboard (Ya auditados previamente)
*   **Patrón**: Predominio de `rose-400` para negativos/gastos, `emerald-400` para positivos/pagados, y `amber-400/500` para pendientes/destacados.
*   **Problema**: Uso de `gray-500` y `slate-500` en cabeceras de tablas (bajo contraste).
*   **Entidades**: `bg-blue-600` para CR y `bg-pink-600` para BT.

---

## 2. Facturación (Billing)
*   **Inconsistencias de Rojo**: Usa `text-red-500/80` en `Billing_ThemeSettings.jsx` para el badge de "PENDIENTE", en lugar de `rose-400`.
*   **Cabeceras**: Usa `text-gray-500` en varios sitios, confirmando el problema de contraste.
*   **Colores de Fondo**: Usa `bg-slate-800`, `bg-slate-900`, `bg-slate-950` para tarjetas y pies de página. Estos no están definidos en el `@theme` de `index.css` (que usa `surface`).
*   **Bordes**: Usa `border-gray-500` en filtros.

---

## 3. CRBT
*   **Entidades**: Muy consistente con `bg-blue-600` (CR), `bg-pink-600` (BT), `text-blue-400` y `text-pink-400`.
*   **Inconsistencias**: Usa `text-gray-500` y `text-slate-500` en cabeceras y nombres de días.
*   **Fondos**: Usa `bg-[#1f2937]` hardcodeado para tarjetas.

---

## 4. Carabao (¡Ojo con la Factura Imprimible!)
*   **Módulo Normal**: Sigue el patrón (`emerald-400` para totales de botellas, `rose-400` para balances negativos).
*   **FACTURA IMPRIMIBLE** (`Carabao_Invoice_View.jsx` y `Table`):
    *   > [!WARNING]
    *   > Estas vistas usan un **TEMA CLARO** (`bg-white`, `text-gray-900`, `border-gray-100`, `hover:bg-gray-50`) porque imitan el papel para ser impresas.
    *   > Usan un color verde/oliva específico: `border-[#8a8e6b]` y `text-[#8a8e6b]`.
    *   > **NO debemos unificar estos colores con la paleta oscura de la app.** Deben mantenerse hardcodeados o en variables separadas de "impresión".

---

## 5. Clientes (Customers)
*   **Utilidades de Actividad**: `Customers_Utils.js` asigna colores según la actividad:
    *   'try dive' / 'bautizo': `text-rose-400/90`
    *   'open water' / 'owd': `text-emerald-400`
    *   'refresh': `text-amber-400`
    *   (Esto está muy bien y es consistente).
*   **Inconsistencias**: Usa `bg-red-500/10` y `border-red-500/20` en la caja de error de `Customer_Edit.jsx` y en el hover del botón de borrar en la tabla. Debería ser `rose`.

---

## 6. Gastos (Expenses)
*   **Categorías**: `useExpensesData.js` devuelve clases hardcodeadas para categorías (incluye `text-red-400` y `text-rose-400`).
*   **Cabeceras**: Usa `text-slate-500` en `Expenses_Oxygen_Table.jsx`.
*   **Éxito/Pendiente**: Consistente con `emerald-400` (Pagado) y `amber-400` (Por Pagar).

---

## 7. Seguros (Insurance)
*   **Mezcla de Rojos**: En `InsuranceTable.jsx` usa `text-rose-400` combinado con `bg-red-500/10` y `border-red-500/20` para el badge de caducado. Es una mezcla rara de `red` y `rose`.
*   **Cabeceras**: Usa `text-slate-400` (¡Bien!).

---

## 8. Nóminas (Nominas)
*   **Sueldo Card**: Usa `bg-emerald-600` para la tarjeta principal de sueldo.
*   **Estados**: Consistente con `emerald-400` (OFF) y `amber-400` (HALF).
*   **Ajustes**: Usa `bg-slate-500/30` para la celda de ajuste manual.

---

## 9. Configuración (Settings)
*   **El Caos Mayor**: Al ser el módulo más grande y antiguo (antes de la refactorización), tiene de todo:
    *   `text-red-400` y `text-red-500` en botones de borrar.
    *   `text-rose-500` para estados inactivos.
    *   `text-slate-400` en cabeceras de tablas (¡Bien!).
    *   Muchos `text-gray-500` sueltos.
