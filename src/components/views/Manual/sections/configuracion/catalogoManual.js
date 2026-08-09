export const catalogoManual = {
  id: 'config-catalogo',
  title: 'Catálogo de Actividades',
  subtitle: 'Creación de cursos y servicios, parámetros técnicos, acrónimos, tanques, precios e integración con Facturación.',
  icon: 'SettingsIcon',
  badge: 'Configuración',
  topics: [
    {
      id: 'add-edit-activity',
      title: '1. Cómo Añadir o Editar una Actividad en el Catálogo',
      summary: 'Pasos para crear un nuevo curso o servicio en la lista oficial del centro.',
      content: [
        {
          type: 'steps',
          items: [
            'Navega al menú lateral y entra en Configuración ⚙️ > Catálogo / Actividades.',
            'Para añadir una nueva actividad, completa los campos del formulario superior (Nombre, Acrónimo, Precio, Coste SSI, etc.).',
            'Haz clic en Guardar Actividad para darla de alta.',
            'Para editar una actividad existente, localízala en la tabla inferior y edita sus campos directamente o usa el icono ✏️.',
            '⚠️ RECUERDA: Tras crear la actividad en el Catálogo, debes añadir su tarifa en el apartado "Tarifas Staff" para que el instructor pueda cobrar su comisión.'
          ]
        },
        {
          type: 'callout',
          style: 'tip',
          title: 'Disponibilidad en Facturación',
          text: 'Las actividades guardadas en el Catálogo aparecerán de forma inmediata en los desplegables de creación de facturas.'
        }
      ]
    },
    {
      id: 'fields-explanation',
      title: '2. Diccionario de Campos y Parámetros Técnicos',
      summary: 'Qué significa cada campo del catálogo y cómo repercute en otros módulos.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Acrónimo',
              badge: 'Visual',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Código corto de 2 a 5 letras (ej: OW, SD, DSD_2, AOW) que identifica la actividad en las tarjetas resumen de Facturación.'
            },
            {
              name: 'Mapear a Curso SSI (ssi_parent_id)',
              badge: 'Liquidación SSI',
              badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
              description: 'Vincular una actividad derivada o de 1 día (ej: "Scuba Diver 1 Day") a su curso matriz SSI (ej: "Scuba Diver"). Las ventas se acumularán automáticamente en el módulo de SSI.'
            },
            {
              name: 'Tanques (tanks_weight)',
              badge: 'Barca Carabao',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Número de botellas de buceo consumidas por cada alumno. Multiplica las ventas mensuales para la liquidación de la barca Carabao.'
            },
            {
              name: 'Precio (THB / EUR)',
              badge: 'Facturación',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Importe de venta al público en Bahts tailandeses o Euros aplicado por defecto en las facturas.'
            },
            {
              name: 'Coste SSI (THB)',
              badge: 'SSI',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Tarifa oficial abonada a la agencia SSI por la certificación digital/materiales de esta actividad.'
            },
            {
              name: 'Comisionable / Paga a Instructor',
              badge: 'Staff',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Indica si la actividad genera pago de comisión al instructor responsable en Nóminas.'
            }
          ]
        }
      ]
    },
    {
      id: 'widget-config-ref',
      title: '3. Integración con el Widget de Facturación',
      summary: 'Vinculación de las actividades del catálogo con el encabezado de ventas.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Configuración desde la vista de Facturación',
          text: 'Una vez creada una actividad en el Catálogo, puedes personalizar su columna (Cursos, Tanques o Especialidades) y su posición en la cabecera haciendo clic en el icono ⚙️ de la tarjeta de Actividades en Facturación. Consulta la guía completa en Facturación > Resumen y Widgets.'
        }
      ]
    }
  ]
};
