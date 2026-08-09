export const widgetCuentasIngresosManual = {
  id: 'dashboard-cuentas-ingresos',
  title: 'Widget Cuentas, Ingresos y Cuadre de Caja',
  subtitle: 'Explicación detallada del Widget de Cuentas, desglose por socio (CR/BT) y cuadre diario de Cash Real vs. Debería.',
  icon: 'BarChart3',
  badge: 'Finanzas',
  topics: [
    {
      id: 'widget-cuentas-details',
      title: '1. Widget Cuentas: Estructura y Significado de cada Línea',
      summary: 'Desglose de los 8 indicadores clave de tesorería del widget Cuentas.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Control Global de Tesorería (Widget Cuentas)',
          text: 'El widget de Cuentas consolida la entrada y salida de dinero del mes activo y calcula la liquidez real sumando el saldo de apertura del mes anterior.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Mes Anterior',
              badge: 'Apertura',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Saldo sobrante o acumulado del cierre de caja del mes previo. Campo editable para ajustar el remanente de inicio.'
            },
            {
              name: 'Facturado',
              badge: 'Venta Bruta',
              badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
              description: 'Suma global del importe total de todas las facturas emitidas en el mes.'
            },
            {
              name: 'Cobrado',
              badge: 'Liquidez',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Importe de facturas efectivamente cobradas y liquidadas en caja o banco.'
            },
            {
              name: 'Por Cobrar',
              badge: 'Pendiente Cliente',
              badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
              description: 'Facturas o saldos pendientes de pago por parte de los alumnos o grupos.'
            },
            {
              name: 'Pagado',
              badge: 'Gastos',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Total acumulado de salidas de dinero y gastos abonados durante el mes.'
            },
            {
              name: 'Cob. + M. Ant. (Cobrado + Mes Anterior)',
              badge: 'Disponible Real',
              badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              description: 'Líquido total disponible en caja sumando lo cobrado este mes más el saldo inicial.'
            },
            {
              name: 'Fac. + M. Ant. (Facturado + Mes Anterior)',
              badge: 'Capacidad Teórica',
              badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              description: 'Suma de lo facturado más el saldo inicial traído del mes previo.'
            },
            {
              name: 'Hay o Habrá + Pag.',
              badge: 'Previsión Total',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Previsión final proyectada sumando lo cobrado, lo por cobrar y los gastos abonados.'
            }
          ]
        }
      ]
    },
    {
      id: 'widget-ingresos-cash',
      title: '2. Widget Ingresos y Cuadre de Cash (Falta o Sobra)',
      summary: 'Desglose por método de pago/socio y conciliación del dinero físico en caja.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Cobros por Socio (CR / BT)',
              badge: 'Canales',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Desglose de cobros recibidos en EUR, Wise o Cash asignados a Carlos (CR) o Berta (BT).'
            },
            {
              name: 'CASH REAL',
              badge: 'Caja Física',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Efectivo real recontado físicamente en la caja del centro.'
            },
            {
              name: 'DEBERÍA',
              badge: 'Cálculo Teórico',
              badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
              description: 'Suma teórica de efectivo que debería haber en caja según los registros de cobro.'
            },
            {
              name: 'FALTA O SOBRA',
              badge: 'Cuadre Caja',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Diferencia numérica (Cash Real - Debería). Se muestra en azul/verde si la caja cuadra o sobra, y en rojo si hay descuadre.'
            }
          ]
        }
      ]
    }
  ]
};
