export const cajaCobrosManual = {
  id: 'billing-caja-cobros',
  title: 'Caja, Formas de Pago y Divisas',
  subtitle: 'Registro de cobros, estados de pago (Pagado, Pendiente, Depósito) y divisas THB/EUR.',
  icon: 'Rows3',
  badge: 'Facturación',
  topics: [
    {
      id: 'payment-statuses',
      title: '1. Estados de Pago y Formas de Cobro',
      summary: 'Diferencia entre facturas pagadas, pendientes o con seña previa.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Estado: Pagado',
              badge: 'Completo',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'La factura se ha cobrado en su totalidad. El importe pendiente es 0 THB y el registro queda cerrado.'
            },
            {
              name: 'Estado: Pendiente',
              badge: 'Por Cobrar',
              badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
              description: 'Servicio disfrutado o reservado que aún no se ha abonado. Suma al total de saldo pendiente del centro.'
            },
            {
              name: 'Estado: Depósito / Seña',
              badge: 'Reserva',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'El cliente ha realizado un pago parcial previo de reserva. El resto queda como saldo a cobrar en el centro.'
            },
            {
              name: 'Métodos de Pago',
              badge: 'Caja Diaria',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Clasificación de los ingresos en Cash (Efectivo), Card (Tarjeta), Bizum o Transferencia Bancaria.'
            }
          ]
        }
      ]
    },
    {
      id: 'cash-panel',
      title: '2. Panel Financiero y Arqueo de Caja',
      summary: 'Control del total recaudado en el mes y saldo pendiente de cobro.',
      content: [
        {
          type: 'steps',
          items: [
            'Consulta el widget de Finanzas en el encabezado de Facturación.',
            'Verifica el desglose de ingresos totales cobrados en Efectivo vs. Tarjeta/Banco.',
            'Comprueba el saldo pendiente total para realizar el seguimiento de cobros antes del check-out.'
          ]
        }
      ]
    }
  ]
};
