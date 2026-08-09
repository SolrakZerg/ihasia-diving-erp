export const clientesManual = {
  id: 'customers',
  title: 'Buceadores y Clientes',
  subtitle: 'Gestión del registro de buceadores, filtros por fecha, ficha técnica, acciones en lote y envío a Facturación o Seguros.',
  icon: 'UserRoundSearch',
  badge: 'Base de Datos',
  topics: [
    {
      id: 'customers-overview',
      title: '1. Búsqueda y Filtros Avanzados de Buceadores',
      summary: 'Búsqueda por pasaporte, nombre, rango de fechas y detección de duplicados.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Directorio Central de Buceadores',
          text: 'El módulo de Buceadores almacena el histórico completo de clientes del centro. Permite buscar instantáneamente por pasaporte, nombre o correo y aplicar filtros por fecha de llegada o coincidencia de duplicados.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Buscador Global en Tiempo Real',
              badge: 'Búsqueda',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Busca buceadores por nombre, apellidos, pasaporte o e-mail.'
            },
            {
              name: 'Filtro por Rango de Fechas',
              badge: 'Fecha',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Permite filtrar el listado de clientes previstos para hoy, esta semana, este mes o un rango personalizado.'
            },
            {
              name: 'Filtro de Duplicados',
              badge: 'Auditoría',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Detecta registros coincidentes para unificar fichas duplicadas de un mismo cliente.'
            }
          ]
        }
      ]
    },
    {
      id: 'customers-batch-actions',
      title: '2. Acciones en Lote: Mandar a Facturación o Seguros',
      summary: 'Selección múltiple para transferir buceadores a otros módulos del ERP.',
      content: [
        {
          type: 'steps',
          items: [
            'Selecciona una o varias casillas de verificación a la izquierda de la tabla de clientes.',
            'Aparecerá la barra flotante inferior de acciones en lote.',
            'Haz clic en "A Seguros" para transferir automáticamente los buceadores seleccionados al módulo de Seguros Diarios.',
            'Haz clic en "A Facturación" para generar las facturas de los clientes seleccionados en la pantalla de Facturación.',
            'Usa el botón "Eliminar" para realizar un borrado masivo tras confirmar el aviso de seguridad.'
          ]
        },
        {
          type: 'callout',
          style: 'tip',
          title: 'Ahorro de Tiempo en Recepción',
          text: 'Seleccionar un grupo de llegada entero y enviarlo a "Seguros" o "Facturación" ahorra tener que registrar cada buceador uno a uno.'
        }
      ]
    },
    {
      id: 'customers-details-drawer',
      title: '3. Ficha Técnica del Buceador (Drawer Lateral)',
      summary: 'Acceso a la información personal, pasaporte, nivel y certificaciones.',
      content: [
        {
          type: 'steps',
          items: [
            'Haz clic en cualquier fila de buceador para abrir su panel lateral (Drawer).',
            'Consulta sus datos de pasaporte, e-mail, nacionalidad, nivel de certificación y fechas de seguro contratadas.',
            'Usa el botón de edición ✏️ si necesitas corregir datos personales o actualizar su nivel SSI/PADI.'
          ]
        }
      ]
    }
  ]
};
