export const matrizLiquidacionManual = {
  id: 'crbt-matriz',
  title: 'Matriz de Cursos y Diario CRBT',
  subtitle: 'Desglose de actividades por socio (CR/BT), comisiones, ajustes manuales y registro diario de turnos.',
  icon: 'UsersRound',
  badge: 'Dirección',
  topics: [
    {
      id: 'crbt-matrix-overview',
      title: '1. Matriz de Cursos y Comisiones de Socios',
      summary: 'Recuento de actividades realizadas por los socios y asignación de comisiones.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Módulo de Gestión de Socios (CRBT)',
          text: 'El módulo CRBT (Carlos - CR / Berta - BT) gestiona la contabilidad de la dirección del centro, contabilizando los cursos impartidos por cada socio, las comisiones asignadas y la división de beneficios.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Columnas Fijas y Dinámicas',
              badge: 'Actividades',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Matriz que desglosa los cursos principales (FD, DSD, OW, AOW, Rescue, etc.) y su tarifa por socio.'
            },
            {
              name: 'Ajustes Manuales (Aj.)',
              badge: 'Corrección',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Permite ingresar correcciones de importe directamente sobre el total devengado por cada socio.'
            },
            {
              name: 'Total Comisiones',
              badge: 'Devengado',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Suma matemática total de comisiones y trabajos realizados por el socio durante el mes.'
            }
          ]
        }
      ]
    },
    {
      id: 'crbt-daily-log',
      title: '2. Registro Diario de Presencia y Turnos (Daily Log)',
      summary: 'Control día a día de la asistencia de los socios en el centro de buceo.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Opciones de Log Diario',
              badge: 'Turnos',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Selector para cada día del mes: CR (Carlos), BT (Berta), CRBT (Ambos), CR ½ DÍA, BT ½ DÍA.'
            },
            {
              name: 'Balance de Días Trabajados',
              badge: 'Estadísticas',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Suma el total de jornadas acumuladas por cada socio para el reparto proporcional de gastos o beneficios.'
            }
          ]
        }
      ]
    }
  ]
};
