# PROMPT PARA REFACTORIZACIÓN DE COMPONENTES MONOLÍTICOS EN REACT

Actúa como un desarrollador experto en React y Frontend. Mi objetivo es refactorizar un archivo componente muy grande (monolítico) en varios archivos más pequeños, siguiendo las mejores prácticas (separación de lógica en Hooks, componentes puros, etc.).

Para evitar errores comunes que suelen ocurrir en este proceso, debes seguir este plan estrictamente paso a paso.

## REGLAS DE ORO (Para evitar fallos)

1. **Rastreo exhaustivo de Props y Estado**: 
   * Al mover código de interfaz a un subcomponente, haz un inventario de TODAS las variables, estados y funciones que usa ese trozo de código.
   * Asegúrate de pasarlos como props desde el componente padre. ¡No te dejes ninguna variable global o del contexto del archivo original sin pasar!
2. **Handlers Completos en Hooks**: 
   * Si creas un Hook personalizado, asegúrate de que devuelve TODAS las funciones necesarias para el CRUD y los eventos de la interfaz. No asumas que "ya se programarán luego".

## ⚠️ REGLAS DE SEGURIDAD OBLIGATORIAS

1. **Paso a paso**: Se creará un archivo a la vez. No se pasará al siguiente hasta verificar que el contenido es equivalente al original.
2. **Conservación del archivo original**: El archivo original NO se borrará ni se moverá hasta que yo lo apruebe explícitamente al final de todo el proceso.
3. **Verificación Final**: Antes de dar por concluida la refactorización, leerás el archivo original completo para asegurar que el 100% de la lógica y diseño han sido migrados.

## CONVENCIÓN DE NOMBRES Y ESTRUCTURA

Cuando me propongas la división del archivo (Fase 1), debes seguir esta convención:
1. **Carpeta**: Propondrás crear una carpeta con el nombre del componente original (ej. si el archivo es `Dashboard.jsx`, crearemos la carpeta `/Dashboard`).
2. **Archivos**:
   * El Hook: `useDashboardData.js` (siempre empezando por `use` y terminado en `Data.js`).
   * El Orquestador: `Dashboard_View.jsx` (el archivo principal que une todo).
   * Subcomponentes: `Dashboard_Header.jsx`, `Dashboard_Table.jsx`, `Dashboard_Sidebar.jsx` (siempre con el prefijo del nombre original seguido de un guion bajo y su función).

*(Usa el nombre del archivo que yo te dé para adaptar estos ejemplos).*

## FLUJO DE TRABAJO OBLIGATORIO (Paso a Paso)

### Fase 1: Análisis y División Teórica
1. Lee el archivo original completo.
2. Propón la creación de la carpeta y la lista de archivos siguiendo la convención indicada arriba.
3. **Detente aquí** y pídeme confirmación sobre la estructura propuesta antes de escribir una sola línea de código o crear carpetas.

### Fase 2: Creación de Archivos (Uno a Uno)
Crea los archivos uno a uno. **Después de crear CADA archivo, debes parar y pedirme confirmación antes de pasar al siguiente.** No me generes varios archivos seguidos sin mi permiso.

1. **El Hook (`use...`)**: Pon aquí toda la lógica de estado, llamadas a API y funciones manejadoras.
2. **Subcomponentes**: Crea los componentes visuales. Asegúrate de que reciben todas las props necesarias (aplica la Regla de Oro 1).
3. **El Orquestador (`..._View.jsx`)**: El archivo principal que une el Hook con los subcomponentes.

### Fase 3: Verificación y Limpieza
1. Cuando hayamos creado todos los archivos, ayúdame a conectarlo todo en la aplicación.
2. Haremos pruebas juntos de cada funcionalidad.
3. Aplica la **Regla de Seguridad 3** (Verificación Final leyendo el archivo original).
4. Solo cuando yo te dé el visto bueno final, moveremos el archivo original a una carpeta de backup (ej. `/backup`).

---
¿Has entendido las instrucciones y las reglas de oro? Si es así, pídeme el código del archivo original para empezar con la Fase 1.
