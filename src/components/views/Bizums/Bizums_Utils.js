export const BIZUM_ACTIVITY_OPTIONS = [
  { code: 'OW 2', acronym: 'OW 2', nameEs: 'Open Water en 2 días', nameEn: 'Open Water Course (in 2 days)' },
  { code: 'OW', acronym: 'OW', nameEs: 'Open Water', nameEn: 'Open Water Course' },
  { code: 'AA', acronym: 'AA', nameEs: 'Avanzado', nameEn: 'Advanced' },
  { code: 'DSD', acronym: 'DSD', nameEs: 'Bautizo', nameEn: 'Discover Scuba Diving' },
  { code: 'SR', acronym: 'SR', nameEs: 'Refresh', nameEn: 'Refresh' },
  { code: 'FD', acronym: 'FD', nameEs: 'Fun Dives', nameEn: 'Fun Dives' },
  { code: 'Rescue', acronym: 'Rescue', nameEs: 'Rescue', nameEn: 'Rescue' }
];

// Visual color badges for activities in Bizums table (matching exact billing colors)
export const BIZUM_ACTIVITY_COLORS = {
  BAUTIZO: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  OPENWATER: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  AVANZADO: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  REFRESH: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  FUNDIVES: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  RESCUE: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  SSI: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  DEFAULT: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' }
};

export function getActivityColor(activityName) {
  if (!activityName) return BIZUM_ACTIVITY_COLORS.DEFAULT;
  const upper = activityName.toUpperCase().replace(/\s+/g, '');
  if (upper.includes('BAUTIZO') || upper.includes('DSD') || upper.includes('TRY')) return BIZUM_ACTIVITY_COLORS.BAUTIZO;
  if (upper.includes('OPEN') || upper.includes('OWE')) return BIZUM_ACTIVITY_COLORS.OPENWATER;
  if (upper.includes('AVANZADO') || upper.includes('ADVANCED') || upper.includes('AA')) return BIZUM_ACTIVITY_COLORS.AVANZADO;
  if (upper.includes('REFRESH') || upper.includes('SR')) return BIZUM_ACTIVITY_COLORS.REFRESH;
  if (upper.includes('FUN') || upper.includes('FD')) return BIZUM_ACTIVITY_COLORS.FUNDIVES;
  if (upper.includes('RESCUE')) return BIZUM_ACTIVITY_COLORS.RESCUE;
  if (upper.includes('SSI')) return BIZUM_ACTIVITY_COLORS.SSI;
  return BIZUM_ACTIVITY_COLORS.DEFAULT;
}

export function getTranslucentBg(color) {
  if (!color) return 'transparent';
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, '0.3)');
  if (color.startsWith('#')) return color + '4D'; // 30% opacity
  return color;
}

export function cleanPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+00')) {
    cleaned = '+' + cleaned.slice(3);
  } else if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (!cleaned.startsWith('+')) {
    if (cleaned.length >= 9) {
      cleaned = '+34' + cleaned;
    }
  }

  cleaned = cleaned.replace(/^\+34(?:00)?34/, '+34');
  cleaned = cleaned.replace(/^\+3400/, '+34');

  return cleaned;
}

export function formatPrettyPhone(phoneStr) {
  if (!phoneStr) return '-';
  const cleaned = cleanPhone(phoneStr);
  if (!cleaned) return phoneStr;

  if (cleaned.startsWith('+34') && cleaned.length === 12) {
    return `+34 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('+')) {
    const country = cleaned.slice(0, 3);
    const rest = cleaned.slice(3);
    const chunks = rest.match(/.{1,3}/g) || [];
    return `${country} ${chunks.join(' ')}`;
  }
  return phoneStr;
}

export function formatSpanishDate(dateStr) {
  if (!dateStr) return 'Fecha desconocida';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

export function getShortCodeFromActivityName(activityName) {
  if (!activityName) return 'OW';
  const upper = activityName.toUpperCase().replace(/\s+/g, '');
  if (upper.includes('BAUTIZO') || upper.includes('DSD') || upper.includes('TRY')) return 'DSD';
  if (upper.includes('OW2') || upper.includes('2DIA') || upper.includes('2DAY') || upper.includes('EN2')) return 'OW 2';
  if (upper.includes('OPEN') || upper.includes('OWE') || upper.includes('OW')) return 'OW';
  if (upper.includes('AVANZADO') || upper.includes('ADVANCED') || upper.includes('AA')) return 'AA';
  if (upper.includes('REFRESH') || upper.includes('SR')) return 'SR';
  if (upper.includes('FUN') || upper.includes('FD')) return 'FD';
  if (upper.includes('RESCUE')) return 'Rescue';
  return 'OW';
}

export function getActivitySpanishName(codeOrName) {
  if (!codeOrName) return 'tu actividad de buceo';
  const match = BIZUM_ACTIVITY_OPTIONS.find(o => o.code === codeOrName || o.acronym === codeOrName);
  if (match) return match.nameEs;

  const upper = codeOrName.toUpperCase();
  if (upper.includes('OW 2') || upper.includes('OW2')) return 'Open Water en 2 días';
  if (upper.includes('BAUTIZO') || upper.includes('DSD')) return 'Bautizo';
  if (upper.includes('OPEN') || upper.includes('OW')) return 'Open Water';
  if (upper.includes('AVANZADO') || upper.includes('AA')) return 'Avanzado';
  if (upper.includes('REFRESH') || upper.includes('SR')) return 'Refresh';
  if (upper.includes('FUN') || upper.includes('FD')) return 'Fun Dives';
  if (upper.includes('RESCUE')) return 'Rescue';
  return codeOrName;
}

export function generateWhatsappMessage(customerName, numPeople, activityText, bookingDate) {
  const firstName = customerName ? customerName.trim().split(' ')[0] : 'Cliente';
  const formattedDate = formatSpanishDate(bookingDate);
  const peopleText = `${numPeople || 1} persona(s)`;
  const actText = activityText || 'tu actividad de buceo';

  return `Hola ${firstName}, gracias por tu reserva de ${peopleText} para ${actText} el ${formattedDate}.\n\n` +
         `Ya puedes realizar los registros necesarios en https://ihasiadivingkohtao.com/registro\n\n` +
         `Ahí encontrarás las instrucciones para hacerlo, cualquier duda nos comentas. Saludos y hasta pronto.`;
}

export function generateWhatsappLink(phone, customerName, numPeople, activityText, bookingDate) {
  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone || !cleanedPhone.startsWith('+')) return null;
  const message = generateWhatsappMessage(customerName, numPeople, activityText, bookingDate);
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
