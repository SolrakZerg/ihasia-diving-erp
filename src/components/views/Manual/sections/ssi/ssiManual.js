export const ssiManual = {
  id: 'ssi',
  title: 'SSI y Certificaciones',
  subtitle: 'Desglose mensual de cursos SSI, acumulación de actividades derivadas, columna de ajustes y liquidaciones.',
  icon: 'SSIIcon',
  badge: 'Agencia',
  topics: [
    {
      id: 'ssi-overview',
      title: '1. Resumen y Control de Certificaciones SSI',
      summary: 'Consolidación de cursos, recuento de alumnos y cálculo automático de tasas de certificación.',
      content: [
        {
          type: 'callout',
          style: 'info',
          title: 'Consolidación Automática de Cursos Hijos',
          text: 'El módulo SSI agrupa automáticamente las ventas de actividades principales y sus derivadas (mapeadas a través del campo ssi_parent_id), garantizando que ningún alumno o tasa quede fuera de la liquidación.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Cursos Principales',
              badge: 'Oficial SSI',
              badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
              description: 'Cursos oficiales reconocidos por la agencia (ej: Open Water Diver, Advanced Adventurer, Enriched Air Nitrox).'
            },
            {
              name: 'Actividades Derivadas',
              badge: 'Catálogo ERP',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Variantes o experiencias de 1 día creadas en el catálogo que acumulan alumnos al curso SSI matriz.'
            },
            {
              name: 'Coste SSI (THB)',
              badge: 'Tasa Agencia',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Tarifa oficial por alumno abonada a SSI para la expedición de la certificación o materiales digitales.'
            }
          ]
        }
      ]
    },
    {
      id: 'ssi-adjustment-column',
      title: '2. Uso de la Columna de Ajuste Manual (Aj.) y Unidades Reales',
      summary: 'Cómo cuadrar las unidades entre el conteo automático del ERP y la liquidación real con SSI.',
      content: [
        {
          type: 'callout',
          style: 'tip',
          title: '¿Para qué sirve la Columna de Ajuste (Aj.)?',
          text: 'La columna de Ajuste (Aj.) permite sumar o restar certificados manualmente a la cifra automática del ERP sin modificar las facturas registradas. Es esencial para regularizar expediciones atrasadas, promociones o diferencias con el portal de SSI.'
        },
        {
          type: 'fields',
          items: [
            {
              name: 'Cant. Sist. (Cantidad del Sistema)',
              badge: 'Automático',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              description: 'Número de certificaciones e inscripciones calculadas automáticamente por el ERP a partir de las facturas cobradas del mes.'
            },
            {
              name: 'Aj. (Ajuste Manual)',
              badge: 'Modificador Editable',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              description: 'Casilla editable para introducir correcciones numéricas. Un ajuste positivo (+1, +2) se muestra en verde y uno negativo (-1, -2) en rojo.'
            },
            {
              name: 'Und. Reales (Unidades Reales)',
              badge: 'Resultado Final',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'Suma matemática directa de la Cantidad del Sistema más el Ajuste Manual (Cant. Sist. + Aj.).'
            },
            {
              name: 'Total ฿ (Total Fila)',
              badge: 'Liquidación',
              badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              description: 'Cálculo del coste exacto abonar a la agencia SSI: Unidades Reales × Precio Unitario por certificado.'
            }
          ]
        }
      ]
    },
    {
      id: 'ssi-verification',
      title: '3. Proceso de Verificación y Liquidación',
      summary: 'Pasos para revisar los cursos del mes y confirmar el importe abonado.',
      content: [
        {
          type: 'steps',
          items: [
            'Navega al módulo de SSI 🎴 en el menú lateral.',
            'Asegúrate de tener seleccionado el mes correspondiente en la barra superior.',
            'Comprueba la columna Cant. Sist. para cada curso.',
            'Si hay discrepancias con el portal de la agencia, introduce la diferencia en la columna Aj. (Ajuste).',
            'Verifica que las Und. Reales y el Total ฿ coincidan con el recibo definitivo antes de procesar el pago a SSI.'
          ]
        }
      ]
    }
  ]
};
