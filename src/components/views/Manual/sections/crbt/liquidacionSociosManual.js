export const liquidacionSociosManual = {
  id: 'crbt-liquidacion',
  title: 'Liquidación de Socios y Reparto',
  subtitle: 'Control de adelantos a cuenta, arrastre de saldo del bote, liquidaciones mensuales y reparto final entre socios.',
  icon: 'UsersRound',
  badge: 'Dirección',
  topics: [
    {
      id: 'crbt-advances',
      title: '1. Registro de Adelantos a Cuenta (Advances)',
      summary: 'Anotación de retiradas de dinero y anticipos efectuados por los socios.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Control de Retiradas de Socios',
          text: 'Permite registrar cualquier retiro de dinero o adelanto recibido por los socios a lo largo del mes, especificando el concepto, la fecha y el importe en Bahts (THB).'
        },
        {
          type: 'steps',
          items: [
            'En el panel lateral de CRBT, pulsa en el botón para ingresar un nuevo adelanto.',
            'Selecciona el socio beneficiario (Carlos - CR o Berta - BT).',
            'Escribe la cantidad en THB y el concepto de la retirada.',
            'El sistema descuenta automáticamente el adelanto de la liquidación final del mes.'
          ]
        }
      ]
    },
    {
      id: 'crbt-bote-payouts',
      title: '2. Arrastre del Bote y Reparto Final de Beneficios',
      summary: 'Integración con el fondo del Bote y liquidación neta por socio.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Arrastre del Mes Anterior',
              badge: 'Remanente',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Incorpora el saldo a favor o en contra traído del cierre del mes previo.'
            },
            {
              name: 'Fondo del Bote Común',
              badge: 'Integración',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Suma la aportación acumulada del Bote de camisetas y seguros a la masa a repartir.'
            },
            {
              name: 'Liquidación Neta por Socio (Partner Payout)',
              badge: 'Cierre Final',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Resultado final a percibir o ingresar por cada socio (Comisiones + Días trabajados + Bote - Adelantos).'
            }
          ]
        }
      ]
    }
  ]
};
