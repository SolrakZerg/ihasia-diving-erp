/**
 * Formatea el nombre de un cliente al estándar compacto del Roster:
 * Nombre + Iniciales de Apellidos
 * Ejemplos:
 * "Carlos", "Julia Revilla" -> "Carlos J.R."
 * "Maria", "Garcia" -> "Maria G."
 */
export function formatRosterName(firstName = '', lastName = '') {
  const first = (firstName || '').trim();
  const lastParts = (lastName || '').trim().split(/\s+/).filter(Boolean);

  if (!first) return (lastName || '').trim();
  if (!lastParts.length) return first;

  const initials = lastParts.map(part => part[0].toUpperCase() + '.').join('');
  return `${first} ${initials}`;
}

/**
 * Mapea el nombre comercial/ERP de una actividad al código del Roster
 */
export function mapActivityCode(rawActivity = '') {
  const act = (rawActivity || '').toLowerCase().trim();

  if (act.includes('fun dive') || act.includes('fun-dive') || act === 'fd') return 'FD';
  if (act.includes('try dive') || act.includes('bautizo') || act.includes('dsd') || act.includes('discover scuba')) return 'DSD';
  if (act.includes('open water') || act === 'ow') return 'OW';
  if (act.includes('scuba diver') || act === 'sd') return 'SD';
  if (act.includes('advanced') || act.includes('aow')) return 'AOW';
  if (act.includes('refresher') || act.includes('refresh') || act === 'ref' || act === 'sr') return 'SR';

  return rawActivity ? rawActivity.trim().toUpperCase() : 'FD';
}

/**
 * Normaliza el nivel de certificación para el Roster.
 * REGLA:
 * - Si dice "I'm not Certified", "Uncertified", "No certificado", "None", etc. -> Queda VACÍO ("").
 * - Si la actividad no es FD (ej. DSD, OW, SD) -> Queda VACÍO ("") porque no requiere nivel previo.
 * - Solo se asigna el nivel (OW, AA, PRO, etc.) si el cliente REALMENTE tiene una titulación Y la actividad es FD.
 */
export function normalizeRosterLevel(rawLevel = '', activityCode = '') {
  if (!rawLevel) return '';
  
  const levelStr = rawLevel.trim();
  const lower = levelStr.toLowerCase();

  // 1. Filtrar cadenas no certificadas
  if (
    lower.includes("not certified") ||
    lower.includes("no certificado") ||
    lower.includes("uncertified") ||
    lower.includes("none") ||
    lower.includes("sin nivel") ||
    lower.includes("bautizo") ||
    lower.includes("sin titulación")
  ) {
    return '';
  }

  // 2. Si la actividad es un curso de iniciación (DSD, OW, SD), no escribir nivel previo
  const code = mapActivityCode(activityCode);
  if (code === 'DSD' || code === 'OW' || code === 'SD') {
    return '';
  }

  // 3. Mapear niveles estándar del Roster (OW, AA, PRO)
  if (lower.includes("open water") || lower === "ow") return "OW";
  if (lower.includes("advanced") || lower.includes("aow") || lower === "aa") return "AA";
  if (lower.includes("pro") || lower.includes("instructor") || lower.includes("dm") || lower.includes("divemaster")) return "PRO";

  return levelStr;
}

/**
 * Devuelve el turno por defecto de una actividad:
 * - FD (Fun Dives) -> 'morning' (Mañana)
 * - Resto de actividades (DSD, OW, SD, AOW, REF) -> 'afternoon' (Tarde)
 */
export function getDefaultShiftForActivity(rawActivity = '') {
  const code = mapActivityCode(rawActivity);
  if (code === 'FD') return 'morning';
  return 'afternoon';
}

/**
 * Normaliza las iniciales de Staff a MAYÚSCULAS para coincidir con la lista del Roster
 */
export function formatStaffInitials(staffStr = '') {
  if (!staffStr) return '';
  return staffStr.trim().toUpperCase();
}

/**
 * Calcula la fecha sumando días manteniendo el formato YYYY-MM-DD
 */
export function addDaysToDate(dateStr, days) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export const ROSTER_BCD_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL'];
export const ROSTER_SUIT_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const ROSTER_FINS_SIZES = [
  '36/37', '38/39', '40/41', '42/43', '44/45', '46/47',
  'AMA', 'NARA', 'AZUL', 'VED', 'R&N', 'A&N', 'Flex', 'B&V', 'B&R', 'B&M'
];

/**
 * Devuelve el objeto de estilo inline { backgroundColor, color } oficial del Roster para la etiqueta <option>
 */
export function getRosterOptionStyle(val) {
  if (!val) return { backgroundColor: '#333333', color: '#ffffff' };
  switch (val.toUpperCase()) {
    case 'XXS': return { backgroundColor: '#6b21a8', color: '#ffffff' };
    case 'XS': return { backgroundColor: '#166534', color: '#ffffff' };
    case 'S': return { backgroundColor: '#1e3a8a', color: '#ffffff' };
    case 'M': return { backgroundColor: '#ca8a04', color: '#ffffff' };
    case 'L': return { backgroundColor: '#1d4ed8', color: '#ffffff' };
    case 'XL': return { backgroundColor: '#dc2626', color: '#ffffff' };
    case 'XXL': return { backgroundColor: '#020617', color: '#ffffff' };
    case 'XXXL': return { backgroundColor: '#333333', color: '#ffffff' };
    case 'AMA': return { backgroundColor: '#ca8a04', color: '#ffffff' };
    case 'NARA': return { backgroundColor: '#ea580c', color: '#ffffff' };
    case 'AZUL': return { backgroundColor: '#1e3a8a', color: '#ffffff' };
    case 'VED': return { backgroundColor: '#166534', color: '#ffffff' };
    case 'R&N':
    case 'A&N':
    case 'FLEX':
    case 'B&V':
    case 'B&R':
    case 'B&M':
      return { backgroundColor: '#0f172a', color: '#ffffff' };
    default: return { backgroundColor: '#1e293b', color: '#ffffff' };
  }
}

/**
 * Devuelve la clase de color oficial del Roster para BCD y Trajes
 */
export function getRosterSizeColor(size) {
  if (!size) return 'bg-slate-900 text-slate-400 border border-slate-700';
  switch (size.toUpperCase()) {
    case 'XXS':
      return 'bg-purple-800 text-white border border-purple-600 font-bold';
    case 'XS':
      return 'bg-emerald-800 text-white border border-emerald-600 font-bold';
    case 'S':
      return 'bg-blue-900 text-white border border-blue-700 font-bold';
    case 'M':
      return 'bg-amber-600 text-white border border-amber-500 font-bold';
    case 'L':
      return 'bg-blue-600 text-white border border-blue-500 font-bold';
    case 'XL':
      return 'bg-red-600 text-white border border-red-500 font-bold';
    case 'XXL':
      return 'bg-slate-950 text-white border border-slate-700 font-bold';
    case 'XXXL':
      return 'bg-slate-800 text-white border border-slate-600 font-bold';
    default:
      return 'bg-slate-800 text-white border border-slate-700 font-bold';
  }
}

/**
 * Devuelve la clase de color oficial del Roster para Actividades (DSD, FD, CONF, 1+2, 3+4, AOW, REF)
 */
export function getRosterActivityColor(activity = '') {
  if (!activity) return 'bg-slate-800 text-slate-300 border border-slate-700';
  const act = activity.toUpperCase().trim();
  
  if (['CONF', '1+2', '3+4', 'OW', 'SD'].includes(act)) {
    return 'bg-blue-900 text-white border border-blue-700 font-extrabold'; // Azul Marino Roster (CONF, 1+2, 3+4)
  }
  
  switch (act) {
    case 'DSD':
      return 'bg-amber-700 text-white border border-amber-600 font-extrabold'; // Dorado / Ocre Roster (DSD)
    case 'FD':
      return 'bg-teal-700 text-white border border-teal-600 font-extrabold'; // Verde Teal Roster (FD)
    case 'REF':
    case 'SR':
      return 'bg-purple-700 text-white border border-purple-600 font-extrabold'; // Púrpura Roster (REF)
    case 'AOW':
    case 'AA':
      return 'bg-emerald-800 text-white border border-emerald-600 font-extrabold'; // Verde Esmeralda Roster (AOW)
    default:
      return 'bg-blue-900 text-white border border-blue-700 font-extrabold';
  }
}

/**
 * Devuelve la clase de color oficial del Roster para Aletas (FINS), incluyendo los 2 colores en diagonal
 */
export function getRosterFinsColor(fins) {
  if (!fins) return 'bg-slate-900 text-slate-400 border border-slate-700';
  switch (fins.toUpperCase()) {
    case 'AMA':
      return 'bg-[#ca8a04] text-white border border-amber-500 font-bold';
    case 'NARA':
      return 'bg-[#ea580c] text-white border border-orange-500 font-bold';
    case 'AZUL':
      return 'bg-[#1e3a8a] text-white border border-blue-700 font-bold';
    case 'VED':
      return 'bg-[#166534] text-white border border-emerald-600 font-bold';
    case 'R&N':
      return 'bg-[linear-gradient(135deg,_#dc2626_50%,_#000000_50%)] text-white border border-red-900 font-bold';
    case 'A&N':
      return 'bg-[linear-gradient(135deg,_#1e3a8a_50%,_#000000_50%)] text-white border border-blue-950 font-bold';
    case 'FLEX':
      return 'bg-slate-100 text-slate-900 border border-slate-300 font-bold';
    case 'B&V':
      return 'bg-[linear-gradient(135deg,_#ffffff_50%,_#166534_50%)] text-slate-900 font-extrabold border border-emerald-600';
    case 'B&R':
      return 'bg-[linear-gradient(135deg,_#ffffff_50%,_#dc2626_50%)] text-slate-900 font-extrabold border border-red-600';
    case 'B&M':
      return 'bg-[linear-gradient(135deg,_#ffffff_50%,_#6b21a8_50%)] text-slate-900 font-extrabold border border-purple-600';
    default:
      return 'bg-slate-800 text-white border border-slate-700 font-bold';
  }
}

/**
 * Genera la lista de filas para roster_assignments según las reglas de negocio multi-día
 */
export function generateRosterSchedule({ customer, activityCode, startDate, staff = '', customShift = null, customBcd = undefined, customSuit = undefined, customFins = undefined }) {
  const formattedName = formatRosterName(customer.first_name || customer.firstName, customer.last_name || customer.lastName);
  const code = mapActivityCode(activityCode || customer.booked_activity || customer.activity || 'FD');
  const level = normalizeRosterLevel(customer.level || customer.certification_level || '', code);
  
  const bcd = customBcd !== undefined ? (customBcd || null) : (customer.bcd_size || customer.bcd || null);
  const suit = customSuit !== undefined ? (customSuit || null) : (customer.suit_size || customer.suit || null);
  const fins = customFins !== undefined ? (customFins || null) : (customer.fins_size || customer.fins || null);
  const formattedStaff = formatStaffInitials(staff);

  const initialShift = customShift || getDefaultShiftForActivity(code);

  const baseRow = {
    staff: formattedStaff,
    level: level,
    nombre_alumno: formattedName,
    bcd: bcd,
    suit: suit,
    fins: fins,
  };

  // Reglas de negocio multi-día
  if (code === 'OW') {
    // Open Water: 3 Días (Día 1: CONF Tarde, Día 2: 1+2 Tarde, Día 3: 3+4 Mañana)
    return [
      {
        ...baseRow,
        date: startDate,
        shift: initialShift,
        activity: 'CONF',
      },
      {
        ...baseRow,
        date: addDaysToDate(startDate, 1),
        shift: 'afternoon',
        activity: '1+2',
      },
      {
        ...baseRow,
        date: addDaysToDate(startDate, 2),
        shift: 'morning',
        activity: '3+4',
      },
    ];
  }

  if (code === 'SD') {
    // Scuba Diver: 2 Días (Día 1: CONF Tarde, Día 2: 1+2 Tarde)
    return [
      {
        ...baseRow,
        date: startDate,
        shift: initialShift,
        activity: 'CONF',
      },
      {
        ...baseRow,
        date: addDaysToDate(startDate, 1),
        shift: 'afternoon',
        activity: '1+2',
      },
    ];
  }

  if (code === 'AOW') {
    // Advanced Open Water (AOW / AA): 2 Días (Día 1: AA Tarde, Día 2: AA Mañana)
    return [
      {
        ...baseRow,
        date: startDate,
        shift: 'afternoon',
        activity: 'AA',
      },
      {
        ...baseRow,
        date: addDaysToDate(startDate, 1),
        shift: 'morning',
        activity: 'AA',
      },
    ];
  }

  if (code === 'DSD') {
    // Bautizo: 1 Día
    return [
      {
        ...baseRow,
        date: startDate,
        shift: initialShift,
        activity: 'DSD',
      },
    ];
  }

  // Fun Dives, Refresher, u otras actividades: 1 Día
  return [
    {
      ...baseRow,
      date: startDate,
      shift: initialShift,
      activity: code,
    },
  ];
}
