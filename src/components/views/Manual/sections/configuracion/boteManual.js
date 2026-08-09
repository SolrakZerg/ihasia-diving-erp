export const boteManual = {
  id: 'config-bote',
  title: 'Gestión de Bote',
  subtitle: 'Fondo económico común del centro, ingresos por camisetas y seguros, y control de gastos.',
  icon: 'SettingsIcon',
  badge: 'Configuración',
  topics: [
    {
      id: 'bote-concept',
      title: '1. Concepto y Funcionamiento del Bote Común',
      summary: 'Para qué sirve el bote del equipo y de dónde procede su financiación.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Fondo de Gastos Compartidos',
          text: 'El Bote es la caja común del centro utilizada para abonar gastos colectivos del staff (material de buceo común, repuestos, cenas de equipo o compras de centro).'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Ingresos por Camisetas',
              badge: 'Aportación',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Se ingresa una cantidad fija por cada actividad vendida en Facturación que tiene activado el parámetro de camiseta incluida.'
            },
            {
              name: 'Ingresos por Seguros',
              badge: 'Aportación',
              badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
              description: 'Aportación automática calculada a partir del número total de buceadores tramitados en los partes de seguro mensual.'
            },
            {
              name: 'Arrastre de Fondo Inicial',
              badge: 'Balance',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'El saldo disponible al cerrar el mes anterior se traspasa automáticamente como fondo de partida al iniciar el nuevo mes.'
            }
          ]
        }
      ]
    },
    {
      id: 'bote-expenses',
      title: '2. Registro y Categorización de Gastos',
      summary: 'Pasos para anotar compras o deducciones del bote común.',
      content: [
        {
          type: 'steps',
          items: [
            'Accede a Configuración ⚙️ > Pestaña Gestión de Bote 🐷.',
            'Selecciona el mes y año en el selector superior.',
            'Usa el formulario de la columna derecha para registrar la salida: introduce el Día, Importe (THB), Concepto descriptivo y Categoría (ej: Material, Eventos, Varios).',
            'Haz clic en Añadir Gasto para descontar el importe del balance actual del Bote.',
            'Puedes hacer clic directo en las celdas de la tabla para editar cualquier gasto o usar el icono de papelera para eliminarlo.'
          ]
        }
      ]
    }
  ]
};
