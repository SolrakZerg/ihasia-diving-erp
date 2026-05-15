# Plan Detallado - Aplicación de Fase 1 en Sección "Clientes"

Este documento contiene el plan detallado para aplicar las reglas de colores y estilos de la Fase 1 en los archivos de la carpeta `src/components/views/Customers/`, eliminando los colores prohibidos y usando las variables de accesibilidad.

---

## 📄 Archivo 1: `Customers_Header.jsx`

### Cambios de Color a Realizar (Sustitución de Grises):
1.  **Línea 24**: Cambiar `text-gray-400` por `text-text-muted` en el subtítulo de conteo de registros.
2.  **Línea 34**: Cambiar `text-gray-500` por `text-text-dim` en el icono de búsqueda (`Search`).
3.  **Línea 53**: Cambiar `text-gray-400` por `text-text-muted` en el estado inactivo del botón de vista extendida.
4.  **Línea 70**: Cambiar `text-gray-400` por `text-text-muted` en el estado inactivo del botón de filtros.
5.  **Línea 84**: Cambiar `text-slate-400` por `text-text-header` en el título "Filtros Avanzados" del dropdown.
6.  **Línea 145**: Cambiar `text-gray-400` por `text-text-muted` en los botones de opción del filtro (componente `FilterButton`).

### Cambios de Estructura/Fondo (Opcional - Para igualar a SSI):
- El contenedor principal (línea 20) no tiene fondo ni bordes. Se propone (si el usuario lo aprueba) envolver la cabecera o darle las clases `bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50` para que tenga el efecto cristal.

---

## 📄 Archivo 2: `Customers_Table.jsx`

### Cambios de Color a Realizar (Sustitución de Grises):
1.  **Línea 61**: Cambiar `text-slate-400` por `text-text-header` en la cabecera de la columna "WhatsApp".
2.  **Línea 79**: Cambiar `text-gray-400` por `text-text-header` en la cabecera de la columna "Acciones".
3.  **Línea 169**: Cambiar `text-gray-400` por `text-text-muted` en la celda de género.
4.  **Línea 180**: Cambiar `text-gray-300` por `text-text-muted` en el texto de actividad.
5.  **Línea 190**: Cambiar `text-gray-400` por `text-text-muted` en el contenedor de fecha de reserva.
6.  **Línea 228, 232, 235, 244**: Cambiar `text-gray-400` por `text-text-muted` en las celdas de Fecha de Nacimiento, Dirección, Conocido y Última Inmersión.
7.  **Línea 229, 238**: Cambiar `text-gray-300` por `text-text-muted` en Contacto de Emergencia y Nivel.
8.  **Línea 247**: Cambiar `text-gray-500` por `text-text-dim` en la celda de origen del formulario.
9.  **Línea 285**: Cambiar `text-gray-400` por `text-text-muted` en el mensaje de "No se encontraron buceadores".
10. **Línea 300**: Cambiar `text-gray-500` por `text-text-dim` en el texto del footer "Mostrando X de Y registros".
11. **Línea 319**: Cambiar `text-gray-400` por `text-text-muted` en los números de página inactivos.
12. **Línea 345**: Cambiar `text-slate-400` por `text-text-header` en el componente `SortableHeader`.
13. **Línea 364**: Cambiar `text-gray-400` por `text-text-muted` en el componente `PageBtn`.

### Cambios de Rojos a Rose:
- **Línea 268**: El botón de eliminar usa `hover:text-rose-400` (¡Bien!), pero usa `hover:bg-red-500/10`. Se propone cambiar por `hover:bg-rose-500/10` para ser consistentes con el uso de Rose.

---

## 📄 Archivo 3: `Customer_Edit.jsx` (Si existe en esta carpeta)
- Se debe revisar si existe y aplicar los cambios de `red` por `rose` en los mensajes de error y botones de cancelar/eliminar.

---
Este plan es puramente para la **Fase 1 (Colores)**. No se tocan paddings ni comportamientos responsivos de la Fase 2.
