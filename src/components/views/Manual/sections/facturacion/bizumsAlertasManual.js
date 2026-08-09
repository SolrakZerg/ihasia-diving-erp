export const bizumsAlertasManual = {
  id: 'billing-bizums-alertas',
  title: 'Bizums y Alertas Operativas',
  subtitle: 'Conciliación de comprobantes de Bizum y sistema automático de alertas operativas.',
  icon: 'Rows3',
  badge: 'Facturación',
  topics: [
    {
      id: 'bizum-verification',
      title: '1. Verificación de Comprobantes por Bizum',
      summary: 'Procedimiento para validar justificantes bancarios recibidos.',
      content: [
        {
          type: 'steps',
          items: [
            'Abre el panel de comprobantes o el módulo de Bizums desde la factura o el menú principal.',
            'Comprueba el número de teléfono o referencia del pago con el movimiento bancario.',
            'Marca el cobro como "Verificado" para conciliar el pago con la contabilidad del centro.'
          ]
        }
      ]
    },
    {
      id: 'operational-alerts',
      title: '2. Panel de Alertas Automáticas',
      summary: 'Avisos del sistema para prevenir errores de cobro o comisiones omitidas.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Auditoría Previa a Nóminas',
          text: 'Consulta la tarjeta de Alertas antes de cerrar el mes: el sistema te advertirá si hay actividades comisionables sin instructor asignado, facturas sin fecha de llegada o diferencias de precio.'
        }
      ]
    }
  ]
};
