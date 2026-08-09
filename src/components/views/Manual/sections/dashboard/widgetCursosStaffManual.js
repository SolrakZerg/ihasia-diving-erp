export const widgetCursosStaffManual = {
  id: 'dashboard-cursos-staff',
  title: 'Widgets de Cursos y Tabla Staff',
  subtitle: 'Comparativa anual de cursos impartidos y tabla de sueldos/pendientes por instructor.',
  icon: 'BarChart3',
  badge: 'Operativa',
  topics: [
    {
      id: 'widget-cursos-donut',
      title: '1. Widget Cursos: Total del Mes y Comparativa Anual',
      summary: 'Gráfico circular con histórico porcentual vs. los últimos 3 años.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Histórico y Evolución de Ventas de Cursos',
          text: 'El widget de Cursos destaca el total de actividades vendidas en el mes (ej: 56 cursos) e incluye las insignias comparativas vs. los mismos meses de años anteriores (2025, 2024, 2023) mostrando el % de variación.'
        }
      ]
    },
    {
      id: 'widget-tabla-staff',
      title: '2. Widget Tabla Staff: Sueldos y Saldos Pendientes',
      summary: 'Listado tabulado del sueldo devengado y saldo por pagar de cada trabajador.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Sueldo Devengado (Sueldo)',
              badge: 'Devengado',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Importe acumulado por el instructor por sus cursos del mes según Tarifas Staff.'
            },
            {
              name: 'Pendiente de Cobro (Pend.)',
              badge: 'Pendiente',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Importe aún no abonado de la nómina del trabajador.'
            },
            {
              name: 'Fila TOTAL',
              badge: 'Suma Global',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Suma global del gasto en sueldos y saldo pendiente de todo el equipo docente.'
            }
          ]
        }
      ]
    }
  ]
};
