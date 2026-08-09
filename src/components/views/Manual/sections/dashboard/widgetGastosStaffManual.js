export const widgetGastosStaffManual = {
  id: 'dashboard-gastos-staff',
  title: 'Widgets de Gráficos de Gastos y Generado Staff',
  subtitle: 'Explicación del gráfico Generado Staff, gráfico de distribución de Gastos y tabla de salidas por categoría.',
  icon: 'BarChart3',
  badge: 'Analítica',
  topics: [
    {
      id: 'widget-generado-staff',
      title: '1. Widget Gráfico Generado Staff',
      summary: 'Ingresos brutos producidos por cada instructor según sus cursos.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Producción por Instructor',
          text: 'El widget de Generado Staff muestra un gráfico de barras que clasifica a los instructores (AND, ALE, HUG, DAV, CRI, MIG, EK, SAL) según la facturación total generada con sus actividades impartidas.'
        }
      ]
    },
    {
      id: 'widget-gastos-chart-table',
      title: '2. Widget Gráfico y Tabla de Gastos por Categoría',
      summary: 'Representación visual y tabulada del destino de las salidas del centro.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Widget Gráfico de Gastos',
              badge: 'Visual',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Barras de color que comparan el volumen de gasto por categoría (Carabao, SSI, Sueldos, Gastos, Bote, Office, Infinity, etc.).'
            },
            {
              name: 'Widget Tabla de Gastos',
              badge: 'Desglose',
              badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
              description: 'Tabla que detalla para cada categoría: Gastos Brutos, Importe Pagado, X Pagar pendiente y Porcentaje (%) del total.'
            }
          ]
        }
      ]
    }
  ]
};
