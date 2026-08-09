export const nominasManual = {
  id: 'nominas',
  title: 'Nóminas y Sueldos',
  subtitle: 'Cálculo automático del sueldo del instructor por actividades impartidas, ajustes manuales y liquidación mensual de salarios.',
  icon: 'Handshake',
  badge: 'Finanzas',
  topics: [
    {
      id: 'nominas-overview',
      title: '1. Estructura y Cálculo Automático del Sueldo del Instructor',
      summary: 'Cómo calcula el ERP el salario mensual de cada trabajador en función de las actividades impartidas.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Cálculo Automático por Tarifas Staff',
          text: 'El módulo de Nóminas contabiliza todas las facturas cobradas del mes activo y calcula automáticamente el sueldo devengado por cada instructor según las reglas fijadas en Configuración > Tarifas Staff.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Sueldo por Actividades',
              badge: 'Acumulado',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Importes devengados por el trabajador al ser asignado como instructor o guía en facturas pagadas.'
            },
            {
              name: 'Ajustes y Bonificaciones',
              badge: 'Modificador',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Adelantos de sueldo, pluses por desempeño o deducciones manuales aplicadas directamente sobre el recibo del mes.'
            },
            {
              name: 'Panel Lateral (Ficha de Desglose)',
              badge: 'Auditoría',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Al seleccionar a un trabajador, el panel derecho desglosa cada curso impartido, el alumno asociado y la tarifa asignada por actividad.'
            },
            {
              name: 'Estado de Liquidación',
              badge: 'Cierre',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Seguimiento del estado de abono del recibo mensual (Pendiente de pago vs. Pagado/Liquidado).'
            }
          ]
        }
      ]
    },
    {
      id: 'nominas-steps',
      title: '2. Procedimiento de Revisión y Cierre de Nóminas',
      summary: 'Pasos para validar y liquidar los sueldos del personal al finalizar el mes.',
      content: [
        {
          type: 'steps',
          items: [
            'Accede al módulo de Nóminas 🤝 desde el menú lateral.',
            'Selecciona el mes y año que deseas liquidar en la barra superior.',
            'Haz clic en la fila de un instructor para abrir su desglose lateral y revisar los cursos realizados.',
            'Si necesitas añadir un adelanto, propina o deducción, pulsa el botón "+ Ajuste" para ingresar el concepto y el importe en THB.',
            'Una vez verificado el balance final del recibo, procede a efectuar el pago al trabajador y marcar la nómina como liquidada.'
          ]
        },
        {
          type: 'callout',
          style: 'tip',
          title: 'Revisión de Alertas Previa',
          text: 'Antes de cerrar las nóminas, comprueba que en Facturación no existan alertas rojas de "Sin Instructor", para garantizar que todas las tarifas del mes hayan quedado contabilizadas.'
        }
      ]
    }
  ]
};
