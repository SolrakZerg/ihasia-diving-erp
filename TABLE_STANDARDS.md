# Estándares de Tablas - Diving ERP

Este documento define los tamaños de fuente y espaciados estandarizados para todas las tablas del sistema, con el fin de garantizar una legibilidad óptima similar a la de documentos estándar (Google Docs/Word).

## 1. Tipografía (Fuentes)

| Elemento | Clase Tailwind | Tamaño (px) | Estilo |
| :--- | :--- | :--- | :--- |
| **Encabezados (TH)** | `text-sm` | 14px | `font-black`, `uppercase`, `tracking-widest` |
| **Datos Principales (Nombres, Totales)** | `text-base` | 16px | `font-bold` o `font-black` |
| **Cifras Críticas (Precios, Cantidades)** | `text-[17px]` | 17px | `font-black`, `font-mono` (opcional) |
| **Datos Secundarios (Tags, Acrónimos)** | `text-[12px]` | 12px | `font-black`, `uppercase` |
| **Textos muy pequeños (Hints)** | `text-[11px]` | 11px | `font-medium` |

## 2. Espaciado (Padding)

| Dimensión | Clase Tailwind | Tamaño (px) |
| :--- | :--- | :--- |
| **Padding Lateral (Celda/TH)** | `px-[15px]` | 15px |
| **Padding Vertical (Celda/TH)** | `py-2` | 8px |
| **Padding Vertical (Header)** | `py-4` | 16px |

## 3. Colores y Contraste
- **Encabezados**: `text-slate-400` o `text-gray-500`.
- **Datos Activos**: `text-white` o `text-gray-200`.
- **Datos Inactivos/Ceros**: `text-gray-600` o `text-gray-700`.
- **Fondos de Fila**: `hover:bg-white/5` o `hover:bg-brand/5`.

## 4. Cuadrícula de Facturación (Alta Densidad)

Para vistas con más de 12 columnas (como el Billing Grid), usamos un escalado más compacto:

| Elemento | Clase Tailwind | Tamaño (px) | Estilo |
| :--- | :--- | :--- | :--- |
| **Nombres y Apellidos** | `text-[13px]` | 13px | `font-bold` |
| **Actividades** | `text-sm` | 14px | `font-black` |
| **Precio, Q, Total** | `text-sm` | 14px | `font-black` |
| **Resto de Datos (Status, Medio, etc.)** | `text-[12px]` | 12px | `font-black` |
| **Notas** | `text-[12px]` | 12px | `font-medium` |

**Regla de Invisibilidad**: Los valores por defecto (`NULL` en DB) para Medio de Pago (Cash) y Bizum (0€) deben usar la clase `text-transparent` para reducir el ruido visual.
