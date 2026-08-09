export const wiseManual = {
  id: 'depositos-wise',
  title: 'Ingresos por Wise',
  subtitle: 'Captura automática por script de correo de depósitos Wise, modal de procesamiento (Fecha, Idioma ES/EN, WhatsApp + Calendar) y estados.',
  icon: 'CreditCard',
  badge: 'Depósitos',
  topics: [
    {
      id: 'wise-data-flow',
      title: '1. Origen del Dato: Captura Automática de Correos Wise',
      summary: 'Proceso automatizado de lectura de notificaciones por email de transferencias internacionales.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Automatización de Lectura de Correos (Email Scraper ➔ Base de Datos)',
          text: 'Un servicio automatizado ("espía de correo") monitoriza continuamente la bandeja de entrada del centro. Al recibir un email oficial de Wise notificando una transferencia o depósito en divisa extranjera, el script extrae automáticamente el remitente, el importe y el ID de referencia, insertando los datos directamente en la Base de Datos para su gestión en esta tabla.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Notificación de Correo (Wise Email)',
              badge: 'Entrada Email',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Correo electrónico emitido por Wise al confirmar una transferencia entrante.'
            },
            {
              name: 'Script Espía de Correo',
              badge: 'Lectura Automatizada',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Parser automatizado que procesa el texto del email, parsea montos/referencias e inserta la fila en Supabase.'
            },
            {
              name: 'Tabla ERP de Wise',
              badge: 'Visualización',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Pantalla donde el personal valida y procesa los fondos entrantes internacionalmente.'
            }
          ]
        }
      ]
    },
    {
      id: 'wise-process-modal',
      title: '2. Modal Contextual de Procesamiento: Configuración, Idioma y Calendario',
      summary: 'Formulario de preparación de la reserva al confirmar un ingreso Wise.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Modal de Procesamiento y Configuración de Reserva Wise',
          text: 'Al pulsar en la casilla de verificación de la columna "Procesado", se despliega un formulario avanzado para asociar la fecha del curso/salida, ajustar el idioma del mensaje (Español o Inglés), configurar actividades por buceador y agendar en Google Calendar.'
        },
        {
          type: 'fields',
          items: [
            {
              name: '📅 Selección de Fecha & Mini-Calendario',
              badge: 'Programación',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Permite seleccionar el día exacto de la actividad de buceo en el mini-calendario integrado.'
            },
            {
              name: '🌍 Idioma del Mensaje (Español / Inglés)',
              badge: 'Internacional',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Selector toggle para traducir automáticamente la plantilla de WhatsApp de confirmación según la nacionalidad del cliente.'
            },
            {
              name: '👥 Desglose de Actividades Múltiples por Pax',
              badge: 'Flexibilidad',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Si la transferencia incluye varios pasajeros, permite asignar actividades o cursos diferentes a cada buceador del grupo.'
            },
            {
              name: '🚀 WhatsApp y Google Calendar',
              badge: 'Acción Combinada',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Genera el mensaje en el idioma elegido, abre el chat de WhatsApp y crea el evento oficial en la API de Google Calendar.'
            }
          ]
        }
      ]
    },
    {
      id: 'wise-statuses',
      title: '3. Estados de Pago en Wise (Procesado, Retenido, Repartido)',
      summary: 'Manejo de estados de liquidación y retenciones parciales.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Procesado',
              badge: 'Confirmado',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Confirma la recepción de los fondos por Wise y permite vincular la reserva con el cliente en Facturación.'
            },
            {
              name: 'Retenido (Parcial o Total)',
              badge: 'Retención / No-Show',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Indica una retención por cancelación o no-show de buceadores (retained_people). En casos parciales, muestra una alerta avisando del porcentaje retenido.'
            },
            {
              name: 'Repartido / Liquidado',
              badge: 'Cierre Socios',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'En la pestaña de retenidos, confirma que la retención ingresada se ha repartido y liquidado entre los socios.'
            }
          ]
        }
      ]
    }
  ]
};
