export const facturasGruposManual = {
  id: 'billing-facturas-grupos',
  title: 'Facturas y Grupos de Clientes',
  subtitle: 'Pasos para registrar ventas, agrupar reservas familiares y asignar instructores.',
  icon: 'Rows3',
  badge: 'Facturación',
  topics: [
    {
      id: 'create-invoice-steps',
      title: '1. Cómo Registrar una Nueva Factura',
      summary: 'Procedimiento paso a paso para dar de alta una venta en la cuadrícula principal.',
      content: [
        {
          type: 'steps',
          items: [
            'Haz clic en el botón "+ Nueva Factura" o añade una nueva línea en la cuadrícula de facturación.',
            'Completa el Nombre del cliente y selecciona su nacionalidad o idioma.',
            'Selecciona la actividad o producto del catálogo inteligente. El precio por defecto y el coste SSI se cargarán automáticamente.',
            'Asigna el Instructor o Guía responsable de la actividad para que la comisión se compute en su recibo de nómina.',
            'Aplica descuentos o suplementos si la reserva lo requiere y guarda la línea.'
          ]
        }
      ]
    },
    {
      id: 'customer-groups',
      title: '2. Agrupación Visual de Clientes y Familias',
      summary: 'Uso del identificador y color de grupo para cobros conjuntos.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Cobros Rápidos de Grupo',
          text: 'Al asignar un mismo color a los miembros de una familia o grupo de amigos, sus facturas destacarán juntas en la tabla, permitiendo consultar su saldo total y efectuar el cobro unificado al hacer el check-out.'
        }
      ]
    }
  ]
};
