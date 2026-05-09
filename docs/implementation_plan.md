# Añadir Ordenación de Actividades en SSI

El objetivo es permitir que el usuario pueda definir el orden en el que se muestran las actividades en la tabla de SSI, gestionándolo desde el modal de configuración (la rueda dentada).

## User Review Required
> [!IMPORTANT]
> Este cambio requiere añadir una columna a la tabla `activities` en la base de datos de producción. La operación es segura y no borrará datos existentes.

## Proposed Changes

### Base de Datos

#### [MODIFY] Tabla `activities`
Añadir una columna `ssi_order` de tipo `integer` con valor por defecto `0`.

### Frontend (Web)

#### [MODIFY] [SSIConfigModal.jsx](file:///c:/Users/solra/Documents/Antigravity/diving-erp/src/components/views/SSI/SSIConfigModal.jsx)
*   Añadir botones de flecha (Arriba / Abajo) en cada curso para poder cambiar su posición en la lista.
*   O bien, un campo numérico para poner el orden directamente (más simple). *Propuesta: Botones de flecha para una mejor experiencia de usuario.*

#### [MODIFY] [test_SSIView.jsx](file:///c:/Users/solra/Documents/Antigravity/diving-erp/src/components/views/SSI/test_SSIView.jsx)
*   **Carga de datos**: Modificar la consulta para que ordene por `ssi_order` ascendente.
*   **Guardado**: Modificar `saveConfig` para que actualice el campo `ssi_order` de cada actividad según el orden establecido en el modal.

## Verification Plan

### Manual Verification
1.  Abrir el modal de configuración.
2.  Cambiar el orden de un curso (ej. moverlo al principio).
3.  Guardar y verificar que en la tabla principal ese curso ahora aparece en la primera posición.
4.  Refrescar la página para asegurar que el orden persiste (se lee de la BD).
