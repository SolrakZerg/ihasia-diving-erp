export const actividadesManual = {
  id: 'actividades',
  title: 'Gestión de Actividades y Catálogo',
  subtitle: 'Aprende a añadir actividades, configurar campos técnicos, mapeos SSI y organizar el widget de facturación.',
  icon: 'SettingsIcon',
  badge: 'Configuración',
  topics: [
    {
      id: 'add-edit-activity',
      title: '1. Cómo Añadir o Editar una Actividad',
      summary: 'Pasos para crear un nuevo curso o servicio en el catálogo del centro.',
      content: [
        {
          type: 'steps',
          items: [
            'Navega al menú lateral y entra en Configuración ⚙️.',
            'Haz clic en la pestaña Catálogo / Actividades.',
            'Para añadir una nueva actividad, completa los campos del formulario superior y haz clic en Guardar Actividad.',
            'Para editar una actividad existente, localízala en la tabla y haz clic en el icono de edición ✏️ o edita directamente sus campos.'
          ]
        }
      ]
    },
    {
      id: 'fields-explanation',
      title: '2. Diccionario de Campos y Parámetros Técnicos',
      summary: 'Qué significa cada campo y cómo afecta al resto de módulos del ERP.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Acrónimo',
              badge: 'Visual',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Código corto de 2 a 5 letras (ej: OW, SD, DSD_2, AOW). Es el nombre compacto que aparece en la tarjeta de recuento de facturación y en las tablas resumen.'
            },
            {
              name: 'Mapear a Curso SSI (ssi_parent_id)',
              badge: 'Liquidación SSI',
              badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
              description: 'Permite vincular una actividad derivada o de 1 día (ej: "Scuba Diver 1 Day") a su curso oficial SSI (ej: "Scuba Diver"). Las ventas y alumnos de la actividad hija se acumularán automáticamente en el total del curso principal en la pantalla de SSI.'
            },
            {
              name: 'Tanques (tanks_weight)',
              badge: 'Barca Carabao',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Número de botellas de buceo consumidas por cada alumno en esta actividad. Se utiliza para multiplicar y calcular el total de tanques mensuales en la liquidación de la barca (Carabao).'
            },
            {
              name: 'Precio (THB / EUR)',
              badge: 'Facturación',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Importe de venta al público en Bahts tailandeses o Euros. Es el precio por defecto que se aplicará al seleccionar esta actividad en una factura.'
            },
            {
              name: 'Coste SSI (THB)',
              badge: 'SSI',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Tarifa que se paga a SSI por la certificación digital/materiales de esta actividad.'
            },
            {
              name: 'Comisionable / Paga a Instructor',
              badge: 'Staff',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Define si la actividad genera pago de comisión al instructor que la realiza.'
            }
          ]
        }
      ]
    },
    {
      id: 'widget-config',
      title: '3. Configurar el Widget de Actividades en Facturación',
      summary: 'Cómo elegir qué actividades aparecen en la tarjeta superior de la vista de Facturas.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: '¿Sabías qué?',
          text: 'El cuadro de "Actividades" en el encabezado de facturación se organiza en 3 columnas independientes y solo muestra las actividades que han tenido ventas en el mes activo.'
        },
        {
          type: 'steps',
          items: [
            'Ve a la pantalla de Facturación 📋.',
            'Haz clic en el icono de engranaje ⚙️ situado en la esquina superior de la tarjeta de Actividades.',
            'Se abrirá el modal de configuración. Para cada actividad puedes elegir su columna:',
            '• Columna 1 (Cursos): Suma +1 al recuento inferior de CURSOS.',
            '• Columna 2 (Tanques): Multiplica ventas × tanques de la actividad y suma al recuento de TANKS.',
            '• Columna 3 (Especialidades): Suma +1 al recuento inferior de ESPEC.',
            '• Ocultar: No se muestra en el widget.',
            'Asigna también el número de orden deseado para la posición vertical dentro de su columna.'
          ]
        }
      ]
    }
  ]
};
