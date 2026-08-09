export const tarifasManual = {
  id: 'config-tarifas',
  title: 'Tarifas Staff (Sueldos)',
  subtitle: 'Configuración de tarifas por actividad impartida para calcular el sueldo de los instructores.',
  icon: 'SettingsIcon',
  badge: 'Configuración',
  topics: [
    {
      id: 'staff-fees-intro',
      title: '1. Paso Obligatorio Post-Alta de Actividad',
      summary: 'Por qué es indispensable registrar la tarifa del instructor tras añadir una nueva actividad.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Conexión Catálogo - Nóminas',
          text: 'Dar de alta una actividad en el Catálogo activa su venta en Facturación, pero el módulo de Nóminas sólo sabrá cuánto pagar al instructor si creas previamente su tarifa en esta sección.'
        }
      ]
    },
    {
      id: 'add-edit-rate',
      title: '2. Cómo Asignar una Regla de Sueldo por Actividad',
      summary: 'Pasos para definir lo que cobra el staff por cada curso impartido.',
      content: [
        {
          type: 'steps',
          items: [
            'Accede a Configuración ⚙️ > Pestaña Tarifas Staff (Sueldos por Actividad).',
            'Haz clic en el botón "+ Nueva Regla".',
            'Selecciona la actividad del desplegable.',
            'Elige la categoría de trabajador (ej: Instructor, Instructor SSI, Guía) o déjala en modo general si la tarifa aplica a todo el equipo.',
            'Introduce el importe en THB o el porcentaje asignado y pulsa Guardar.'
          ]
        }
      ]
    },
    {
      id: 'payroll-integration',
      title: '3. Acumulación Automática en Nóminas',
      summary: 'Funcionamiento del cálculo mensual del sueldo de los instructores.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Asignación en Facturas',
              badge: 'Entrada',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Al incluir un instructor en una factura pagada, la tarifa configurada aquí se vincula a su registro.'
            },
            {
              name: 'Cierre de Nómina',
              badge: 'Liquidación',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Al abrir la pantalla de Nóminas del mes, el ERP suma las tarifas devengadas de todas las facturas del instructor sin necesidad de cálculos manuales.'
            }
          ]
        }
      ]
    }
  ]
};
