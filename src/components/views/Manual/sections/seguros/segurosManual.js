export const segurosManual = {
  id: 'insurance',
  title: 'Seguros Diarios y Tramitación',
  subtitle: 'Gestión de partes de seguro diario, contador de plazas (Pax), generación automática de PDF y envío por email a la aseguradora.',
  icon: 'ShieldCheck',
  badge: 'Seguridad',
  topics: [
    {
      id: 'insurance-overview',
      title: '1. Alta y Tramitación Masiva de Seguros',
      summary: 'Registro diario de buceadores para la póliza de seguro de accidentes.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Gestión de Póliza y Plazas de Seguro (PAX)',
          text: 'El módulo de Seguros permite tramitar las coberturas diarias de los buceadores registrados en el centro. Mantiene un contador en tiempo real de las plazas (PAX) restantes contratadas con la entidad aseguradora.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Contador de Pax Restantes',
              badge: 'Saldo',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Muestra las plazas disponibles en la póliza actual. Si el balance cae por debajo de 25 plazas, parpadea en rojo como aviso de recarga.'
            },
            {
              name: 'Destinatarios Configurados',
              badge: 'Envío',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Correos electrónicos de la compañía aseguradora a los que se enviará automáticamente el informe diario.'
            },
            {
              name: 'Detección de Duplicados',
              badge: 'Auditoría',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Alertas en tabla que detectan coincidencias por pasaporte o nombre para evitar tramitar seguros duplicados.'
            }
          ]
        }
      ]
    },
    {
      id: 'insurance-process',
      title: '2. Proceso de Generación de PDF y Envío',
      summary: 'Pasos para validar la lista del día, generar el PDF y enviar a la aseguradora o a Facturación.',
      content: [
        {
          type: 'steps',
          items: [
            'Selecciona los buceadores a tramitar desde el listado diario o agrégalos mediante la barra de búsqueda rápida.',
            'Verifica los datos personales (Nombre, Apellidos, Número de Pasaporte y Fecha de Nacimiento).',
            'Haz clic en el botón "Enviar Seguros" para generar el informe PDF oficial y enviarlo por email a la aseguradora.',
            'Opcionalmente, activa la casilla "Enviar Seguros y a Facturación" para dar de alta la póliza y transferir simultáneamente las líneas de cobro a Facturación.'
          ]
        },
        {
          type: 'callout',
          style: 'tip',
          title: 'Historial y Descarga de PDF',
          text: 'En la columna derecha (Historial Reciente) puedes consultar las remesas enviadas con anterioridad, ver el desglose de buceadores de cada envío y volver a descargar el PDF firmado.'
        }
      ]
    },
    {
      id: 'insurance-settings',
      title: '3. Configuración de Póliza y Recarga de Plazas ⚙️',
      summary: 'Ajuste de emails de destino, título de contrato y compra de paquetes de plazas (PAX).',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Recargar Plazas (PAX)',
              badge: 'Recarga',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Permite sumar paquetes de plazas compradas a la póliza (ej: +100 PAX) para incrementar el saldo restante.'
            },
            {
              name: 'Duración (Días)',
              badge: 'Validez',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Días de cobertura otorgados por defecto en cada tramitación.'
            },
            {
              name: 'Título de Contrato de Seguro',
              badge: 'Referencia',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Texto de la póliza oficial activa que encabezará el documento PDF generado.'
            }
          ]
        }
      ]
    }
  ]
};
