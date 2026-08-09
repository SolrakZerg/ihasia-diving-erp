export const comisionesManual = {
  id: 'expenses-comisiones',
  title: 'Comisiones de Captación',
  subtitle: 'Gestión de comisiones abonadas a captadores, comerciales, agencias o personal que trae alumnos al centro.',
  icon: 'DollarSign',
  badge: 'Gastos',
  topics: [
    {
      id: 'commissions-concept',
      title: '1. Diferencia entre Comisión de Captación y Sueldo del Instructor',
      summary: 'Aclaración de conceptos: Quién recibe la comisión y por qué.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: '¿Qué es una Comisión de Captación?',
          text: 'La Comisión es la recompensa abonada a la persona (comercial, agencia, promotor u otro trabajador) por traer al cliente o alumno a la escuela. Es independiente del Sueldo del Instructor, que se le paga a la persona por impartir el curso.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Factura Comisionable',
              badge: 'Origen',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Se activa marcando la casilla "Comisionable" en la factura e indicando el nombre del receptor/captador.'
            },
            {
              name: 'Receptor de la Comisión',
              badge: 'Beneficiario',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Puede ser un promotor externo, una agencia colaboradora o el propio instructor si fue él mismo quien captó la venta.'
            }
          ]
        }
      ]
    },
    {
      id: 'commissions-control',
      title: '2. Control de Comisiones Pagadas vs. Pendientes',
      summary: 'Pasos para liquidar y marcar comisiones pagadas a los captadores.',
      content: [
        {
          type: 'steps',
          items: [
            'En la tabla de Comisiones de Captación, consulta la lista de registros generados a partir de las facturas del mes.',
            'Revisa el estado de cada comisión: Pendiente de Pago o Pagada.',
            'Haz clic en el estado para cambiar la comisión a "Pagada" al efectuar la liquidación al comisionista.',
            'Usa el panel lateral desplegable para filtrar los importes pendientes agregados por cada receptor.'
          ]
        }
      ]
    }
  ]
};
