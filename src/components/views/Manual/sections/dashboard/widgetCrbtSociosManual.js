export const widgetCrbtSociosManual = {
  id: 'dashboard-crbt-socios',
  title: 'Widgets de CRBT y Saldos de Socios (CR / BT)',
  subtitle: 'Resumen ejecutivo para la dirección, margen de beneficio y gráficos de saldos por cobrar.',
  icon: 'BarChart3',
  badge: 'Dirección',
  topics: [
    {
      id: 'widget-crbt-card',
      title: '1. Widget Tarjeta CRBT (Dirección)',
      summary: 'Métricas de beneficio por socio, margen de rentabilidad y saldos a cobrar.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'X SOCIO (Beneficio por Socio)',
              badge: 'Beneficio',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Importe neto que corresponde a cada socio (Carlos - CR / Berta - BT) en la liquidación del mes.'
            },
            {
              name: 'MARGEN %',
              badge: 'Rentabilidad',
              badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              description: 'Porcentaje de margen bruto de beneficio respecto al total facturado en el mes.'
            },
            {
              name: 'CR (X COBRAR) / BT (X COBRAR)',
              badge: 'Pendiente Socios',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Tarjetas individuales en azul (CR) y rosa (BT) que muestran el saldo pendiente de percibir por cada socio.'
            }
          ]
        }
      ]
    },
    {
      id: 'widget-saldos-cr-bt',
      title: '2. Widgets Donut Saldos CR y Saldos BT',
      summary: 'Representación gráfica en Donut del saldo cobrado vs. por cobrar.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Saldos CR (Donut Azul)',
              badge: 'Carlos',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Gráfico circular que representa la proporción de la liquidación de Carlos (CR).'
            },
            {
              name: 'Saldos BT (Donut Rosa)',
              badge: 'Berta',
              badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
              description: 'Gráfico circular que representa la proporción de la liquidación de Berta (BT).'
            }
          ]
        }
      ]
    }
  ]
};
