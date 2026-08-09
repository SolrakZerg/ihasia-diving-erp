export const bizumManual = {
  id: 'depositos-bizum',
  title: 'Reservas por Bizum',
  subtitle: 'Flujo de entrada desde Google Forms/Sheets, control de señas, modal contextual (WhatsApp + Google Calendar) y estados.',
  icon: 'CreditCard',
  badge: 'Depósitos',
  topics: [
    {
      id: 'bizum-data-flow',
      title: '1. Origen del Dato: Formulario y Hoja de Google',
      summary: 'Cómo entran automáticamente las reservas de Bizum en el ERP.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Flujo de Integración Automatizado (Google Forms ➔ Google Sheets ➔ Base de Datos)',
          text: 'Las reservas de Bizum no requieren introducción manual. El cliente rellena un formulario de reserva de Google Form, las respuestas se recopilan automáticamente en una Hoja de Cálculo de Google (Google Sheet) y esta sincroniza los registros en tiempo real con la Base de Datos del ERP, haciéndolos visibles de inmediato en esta pantalla.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Formulario de Cliente (Google Form)',
              badge: 'Entrada Cliente',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Formulario web donde el alumno introduce sus datos, actividad elegida, fecha deseada y comprobante/teléfono Bizum.'
            },
            {
              name: 'Hoja de Cálculo de Google (Google Sheets)',
              badge: 'Sincronización',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Hoja central que recibe los envíos y los conecta mediante webhook con la Base de Datos (Supabase).'
            },
            {
              name: 'Tabla ERP',
              badge: 'Visualización',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Muestra todas las señas entrantes ordenadas para que el equipo compruebe el pago y gestione la reserva.'
            }
          ]
        }
      ]
    },
    {
      id: 'bizum-paid-modal',
      title: '2. Modal Contextual al Marcar "Pagado": WhatsApp + Google Calendar',
      summary: 'Acciones automáticas para agendar la reserva y enviar la confirmación al cliente.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Modal de Acciones Automatizadas al Confirmar Seña',
          text: 'Al hacer clic en el botón de la casilla "Pagado", el ERP abre un modal contextual para agendar inmediatamente la cita en el calendario del centro y enviar la plantilla de confirmación por WhatsApp al cliente.'
        },
        {
          type: 'fields',
          items: [
            {
              name: '🚀 WhatsApp y Calendario (Acción Completa)',
              badge: '1-Clic Automático',
              badgeColor: 'bg-brand/20 text-brand-light border-brand/30',
              description: 'Abre la app/web de WhatsApp con la plantilla de confirmación preparada y registra automáticamente la reserva en la API de Google Calendar.'
            },
            {
              name: '💬 Solo Enviar WhatsApp',
              badge: 'Mensajería',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Genera el enlace personalizado con los datos del buceador, fecha y plazas reservadas para enviar por chat.'
            },
            {
              name: '📅 Solo Crear Evento en Calendario (API)',
              badge: 'Google Calendar',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Conecta con la API de Google Calendar y genera la cita del curso/salida con enlace directo para visualizarla.'
            }
          ]
        }
      ]
    },
    {
      id: 'bizum-statuses',
      title: '3. Estados de la Reserva (Pagado, Devuelto, Retenido, Repartido)',
      summary: 'Manejo de casillas de verificación y estados parciales en cancelaciones.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Pagado (Reserva Recibida)',
              badge: 'Confirmado',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Marca la seña como verificada y abonada en la cuenta bancaria.'
            },
            {
              name: 'Devuelto',
              badge: 'Reembolso',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Aplica en cancelaciones donde se reembolsa el importe al cliente, moviendo el registro al historial.'
            },
            {
              name: 'Retenido (Parcial o Total)',
              badge: 'No-Show / Retención',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Para cancelaciones fuera de plazo o incomparecencias. Si asistieron solo parte de los pax (ej: 2 de 4), se activa un icono de alerta con el cálculo parcial del importe retenido.'
            },
            {
              name: 'Repartido (Liquidadas entre Socios)',
              badge: 'Cierre',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'En la pestaña de retenidos, marca que la seña no reembolsada ha sido repartida entre los socios del centro.'
            }
          ]
        }
      ]
    }
  ]
};
