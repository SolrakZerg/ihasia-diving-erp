export const gastosGeneralesManual = {
  id: 'expenses-generales',
  title: 'Gastos Diarios y Operativos',
  subtitle: 'Registro de salidas de caja, categorías personalizadas, proveedores y cálculo de acumulado mensual.',
  icon: 'DollarSign',
  badge: 'Gastos',
  topics: [
    {
      id: 'expenses-add-steps',
      title: '1. Registro de Salidas de Caja',
      summary: 'Cómo anotar un nuevo gasto operativo del centro de buceo.',
      content: [
        {
          type: 'steps',
          items: [
            'Accede al módulo de Gastos 💵 desde el menú lateral.',
            'Asegúrate de tener seleccionado el mes y año deseado en la barra superior.',
            'En la tabla izquierda (Gastos Diarios), completa el formulario de entrada: fecha del gasto, importe en Bahts (THB), concepto descriptivo y categoría asignada.',
            'Pulsa en Añadir Gasto para guardar el registro.',
            'Puedes editar inline cualquier dato de un gasto registrado o hacer clic en la papelera para eliminarlo.'
          ]
        }
      ]
    },
    {
      id: 'expenses-categories',
      title: '2. Configuración de Categorías de Gasto',
      summary: 'Personalización de etiquetas de color y clasificación de salidas.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Categorías Personalizadas',
              badge: 'Etiquetas',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Permite crear categorías con colores distintivos (ej: Combustible, Mantenimiento, Suministros, Alquiler) para organizar las cuentas.'
            },
            {
              name: 'Total Acumulado Mensual',
              badge: 'Balance',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Tarjeta superior que suma automáticamente todas las salidas del mes para el control contable.'
            }
          ]
        }
      ]
    }
  ]
};
