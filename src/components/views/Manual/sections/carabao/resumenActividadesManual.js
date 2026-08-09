export const resumenActividadesManual = {
  id: 'carabao-resumen',
  title: 'Resumen y Consumo por Actividad',
  subtitle: 'Cálculo automático de botellas consumidas, tarifas por embarcación y balance de liquidación mensual.',
  icon: 'CarabaoIcon',
  badge: 'Operaciones',
  topics: [
    {
      id: 'carabao-overview',
      title: '1. Control de Consumo de Botellas por Actividad',
      summary: 'Multiplicación de buceadores por el peso de botellas (Tanks Weight).',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Cálculo por Peso de Botella (Tanks Weight)',
          text: 'El ERP contabiliza las botellas consumidas multiplicando el número de buceadores de cada curso o actividad vendida por el peso de tanques (tanks_weight) asignado en Configuración > Catálogo.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Tanques por Actividad',
              badge: 'Consumo',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Cálculo automático de botellas requeridas (ej: 2 tanques por DSD/Bautizo, 4-5 tanques por Open Water Diver).'
            },
            {
              name: 'Tarifa por Botella (THB)',
              badge: 'Coste Barca',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Precio acordado por botella consumida (ej: 500 THB por tanque).'
            },
            {
              name: 'Resumen Mensual',
              badge: 'Contabilidad',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Suma global de tanques del mes activo y total abonable a la embarcación Carabao.'
            }
          ]
        }
      ]
    },
    {
      id: 'carabao-sidebar-settlement',
      title: '2. Panel Lateral de Liquidación y Pagos',
      summary: 'Seguimiento del Total Real, entregas a cuenta y balance Por Pagar.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Total THB (Real)',
              badge: 'Devengado',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Importe bruto acumulado por todas las actividades facturables realizadas en la barca durante el mes.'
            },
            {
              name: 'Pagado (Campo Editable)',
              badge: 'Abonos',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Casilla editable para ingresar entregas a cuenta o transferencias realizadas a la barca.'
            },
            {
              name: 'Por Pagar (Saldo Restante)',
              badge: 'Pendiente',
              badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
              description: 'Diferencia automática (Total Real - Pagado). Si el saldo llega a 0 ฿, se marca como "Liquidación Completa" en verde.'
            }
          ]
        }
      ]
    },
    {
      id: 'carabao-config-modal',
      title: '3. Modal ⚙️ de Configuración de Actividades Facturables',
      summary: 'Selección de actividades del catálogo que imputan coste a Carabao.',
      content: [
        {
          type: 'steps',
          items: [
            'Haz clic en el icono de engranaje ⚙️ para abrir el modal de Configuración de Facturación.',
            'Revisa la lista de actividades del catálogo y marca las casillas de verificación para incluir o excluir actividades facturables por Carabao.',
            'El sistema recalcula instantáneamente la suma de botellas y el Total Real al guardar los cambios.'
          ]
        }
      ]
    }
  ]
};
