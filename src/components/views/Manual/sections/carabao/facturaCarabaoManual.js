export const facturaCarabaoManual = {
  id: 'carabao-factura',
  title: 'Factura de Carabao y Ajustes',
  subtitle: 'Vista de factura oficial de embarcación, panel lateral flotante de ajustes (Tanques a Quitar) e impresión PDF.',
  icon: 'CarabaoIcon',
  badge: 'Factura Barca',
  topics: [
    {
      id: 'carabao-invoice-view',
      title: '1. Formato Oficial Impreso de Factura Carabao',
      summary: 'Estructura del documento visual con membrete, desglose de botellas e importes.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Documento Justificante de Embarcación',
          text: 'Esta pantalla genera la factura oficial de Carabao lista para imprimir o guardar en PDF. Incluye la cabecera de la empresa, desglose detallado de tanques por curso, subtotal en THB y espacio de firma.'
        }
      ]
    },
    {
      id: 'carabao-invoice-sidebar',
      title: '2. Panel Lateral Flotante de Ajustes de Factura (Sidebar)',
      summary: 'Ajustes visuales de tanques a descontar sin alterar las ventas reales.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: 'Ajustes Visuales para la Impresión',
          text: 'Al desplegar el panel lateral derecho mediante la flecha < / >, puedes realizar modificaciones sobre la factura impresa para acordar ajustes de tanques con el patrón sin modificar los datos contables del ERP.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Tanques a Quitar',
              badge: 'Descuento Visual',
              badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
              description: 'Casilla numérica donde se especifican las botellas a descontar de la factura impresa (ej: 5 botellas).'
            },
            {
              name: 'Impacto en Total (-500 THB / tanque)',
              badge: 'Cálculo',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Muestra el descuento resultante en Bahts (-2.500 THB por 5 tanques descontados).'
            },
            {
              name: 'Resumen de Saldos Imprimible',
              badge: 'Totales',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Muestra el Total Factura ajustado, el importe Ya Pagado y el saldo Por Pagar definitivo que aparecerá en el papel.'
            }
          ]
        }
      ]
    },
    {
      id: 'carabao-invoice-print',
      title: '3. Impresión y Descarga en PDF',
      summary: 'Pasos para imprimir o exportar la factura de la embarcación.',
      content: [
        {
          type: 'steps',
          items: [
            'Accede a la pestaña o vista Factura de Carabao ⛵.',
            'Despliega el panel lateral de ajustes si necesitas aplicar algún descuento de tanques acordado.',
            'Haz clic en el botón de impresora o exportación para generar la versión limpia de impresión.',
            'Guarda el PDF o entrega la copia firmada al patrón de la embarcación.'
          ]
        }
      ]
    }
  ]
};
