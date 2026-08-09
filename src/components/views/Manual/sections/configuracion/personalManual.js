export const personalManual = {
  id: 'config-personal',
  title: 'Personal (Staff)',
  subtitle: 'Gestión del equipo de trabajo, altas, asignación de roles, iniciales y visibilidad activa o inactiva.',
  icon: 'SettingsIcon',
  badge: 'Configuración',
  topics: [
    {
      id: 'staff-add',
      title: '1. Alta de Nuevo Miembro del Equipo',
      summary: 'Pasos para registrar un trabajador en la plantilla del centro.',
      content: [
        {
          type: 'steps',
          items: [
            'Accede a Configuración ⚙️ > Pestaña Staff / Personal.',
            'Haz clic en el botón "+ Nuevo Miembro de Staff".',
            'Completa el Nombre, Apellidos e Iniciales únicas (las iniciales identificarán al instructor de forma compacta en las facturas).',
            'Selecciona su Rol o Puesto (Instructor, Dive Master, Admin / Recepción, Staff Barco, Freelance).',
            'Introduce sus datos de contacto (Teléfono, Email) y su Número de Instructor oficial SSI o PADI.',
            'Asegúrate de marcar la casilla "Personal Activo" y guarda los datos.'
          ]
        }
      ]
    },
    {
      id: 'staff-status',
      title: '2. Control de Estado: Personal Activo vs. Inactivo',
      summary: 'Cómo gestionar bajas temporales o salidas de personal sin borrar su historial contable.',
      content: [
        {
          type: 'fields',
          items: [
            {
              name: 'Estado: Activo',
              badge: 'Operativo',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              description: 'El trabajador aparece disponible en los desplegables de Facturación para asignar servicios y acumula sueldos en las Nóminas del mes.'
            },
            {
              name: 'Estado: Inactivo',
              badge: 'Histórico',
              badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
              description: 'Oculta al trabajador de los desplegables de asignación diaria sin borrar su historial ni sus facturas o nóminas pasadas.'
            }
          ]
        },
        {
          type: 'callout',
          style: 'info',
          title: 'Preservación de Datos',
          text: 'Nunca es necesario eliminar a un trabajador antiguo. Cambiar su estado a "Inactivo" mantiene intactas todas las estadísticas e historial contable del centro.'
        }
      ]
    },
    {
      id: 'staff-drawer',
      title: '3. Ficha Técnica y Drawer de Detalle',
      summary: 'Acceso a la información personal, bancaria e historial del trabajador.',
      content: [
        {
          type: 'steps',
          items: [
            'En la tabla principal de Staff, haz clic en la fila de cualquier trabajador.',
            'Se desplegará un panel lateral (Drawer) con su ficha técnica completa, documentación de instructor y accesos rápidos de edición.'
          ]
        }
      ]
    }
  ]
};
