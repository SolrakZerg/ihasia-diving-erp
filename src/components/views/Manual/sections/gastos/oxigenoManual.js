export const oxigenoManual = {
  id: 'expenses-oxigeno',
  title: 'Tours Snorkeling (Oxygen)',
  subtitle: 'Control de tickets vendidos para la empresa externa Oxygen Tours y liquidación de importes pendientes.',
  icon: 'DollarSign',
  badge: 'Tours Externos',
  topics: [
    {
      id: 'oxygen-tours-concept',
      title: '1. Venta de Tickets y Liquidación con Oxygen Tours',
      summary: 'Funcionamiento del control de excursiones de snorkeling vendidas para el operador externo Oxygen.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Operador Externo de Snorkeling Oxygen',
          text: 'Oxygen es una empresa externa proveedora de tours y excursiones de snorkeling. Nuestro centro comercializa sus tickets a los clientes y registra las liquidaciones de cobros y pagos con dicha empresa.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Cliente y Excursión',
              badge: 'Reserva',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Muestra la fecha del tour, el cliente comprador y el tipo de excursión de snorkeling seleccionada.'
            },
            {
              name: 'Pax / Cantidad (Num)',
              badge: 'Pasajeros',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Número de plazas o tickets vendidos para esa excursión.'
            },
            {
              name: 'Importe por Pagar (X Pagar)',
              badge: 'Deuda Proveedor',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Importe total que se debe abonar a la empresa Oxygen por la venta de esas plazas.'
            },
            {
              name: 'Estado: Pagado / Por Pagar',
              badge: 'Liquidación',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Botón con marca verde para confirmar que la transferencia a la empresa Oxygen Tours se ha realizado.'
            }
          ]
        }
      ]
    },
    {
      id: 'oxygen-tours-steps',
      title: '2. Procedimiento de Control y Cierre de Pagos a Oxygen',
      summary: 'Pasos para revisar los tours vendidos y marcar los abonos a la empresa.',
      content: [
        {
          type: 'steps',
          items: [
            'En la pantalla de Gastos, desciende hasta la tabla Oxygen (Tours de Snorkeling).',
            'Comprueba las ventas del mes activo y el importe acumulado en el contador superior "Por Pagar".',
            'Revisa la lista de clientes y billetes comercializados para las excursiones de Oxygen.',
            'Al efectuar el pago periódico a la empresa Oxygen Tours, haz clic en el botón de la celda "Pagado" (check verde) para cerrar la liquidación de la reserva.'
          ]
        }
      ]
    }
  ]
};
