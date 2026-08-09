export const resumenManual = {
  id: 'billing-resumen',
  title: 'Resumen y Widgets del Encabezado',
  subtitle: 'Visión general de las tarjetas del encabezado: Actividades, Llegadas y Filtros de Facturación.',
  icon: 'Rows3',
  badge: 'Facturación',
  topics: [
    {
      id: 'header-widgets-overview',
      title: '1. Los Widgets Ejecutivos del Encabezado',
      summary: 'Qué información muestra cada una de las tarjetas superiores de la vista de Facturación.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Resumen Ejecutivo en Tiempo Real',
          text: 'Las tarjetas superiores condensan la actividad del mes sin necesidad de navegar a otros módulos: ventas por columna de actividades, previsiones de llegada de buceadores y balances de caja.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Widget de Actividades',
              badge: 'Ventas',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Organizado en 3 columnas personalizables (Cursos, Tanques y Especialidades). Contabiliza el número total de servicios vendidos en el mes activo.'
            },
            {
              name: 'Widget de Llegadas y Clientes',
              badge: 'Recepción',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Listado dinámico con las llegadas previstas por fecha y su canal de captación (agencia, web o directo).'
            },
            {
              name: 'Filtros y Buscador Global',
              badge: 'Búsqueda',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Filtra las facturas por rango de fechas, texto (cliente/concepto), instructor o estado de cobro (Pagado / Pendiente / Depósito).'
            }
          ]
        }
      ]
    },
    {
      id: 'widget-activities-config',
      title: '2. Configuración de Columnas del Widget de Actividades',
      summary: 'Cómo personalizar qué actividades se muestran y en qué columna del encabezado.',
      content: [
        {
          type: 'steps',
          items: [
            'Navega a la pantalla de Facturación 📋.',
            'Haz clic en el icono de engranaje ⚙️ ubicado en la esquina superior de la tarjeta de Actividades.',
            'Se abrirá el modal de configuración de la tarjeta.',
            'Para cada actividad del catálogo, elige la columna donde deseas contabilizar sus ventas:',
            '• Columna 1 (Cursos): Suma +1 al recuento inferior de CURSOS.',
            '• Columna 2 (Tanques): Multiplica las ventas por los tanques de la actividad y suma al recuento de TANKS.',
            '• Columna 3 (Especialidades): Suma +1 al recuento inferior de ESPEC.',
            '• Ocultar: No se muestra en la tarjeta superior.',
            'Asigna el número de orden vertical deseado y guarda los cambios.'
          ]
        },
        {
          type: 'callout',
          style: 'tip',
          title: 'Visibilidad Dinámica por Mes',
          text: 'El widget sólo mostrará de forma activa aquellas actividades configuradas que hayan registrado al menos 1 venta durante el mes que estés consultando.'
        }
      ]
    }
  ]
};
