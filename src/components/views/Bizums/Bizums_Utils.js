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

  // Si empieza por +00 o 00, convertirlo a +
  if (cleaned.startsWith('+00')) {
    cleaned = '+' + cleaned.slice(3);
  } else if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Si no tiene +, añadir +34 si tiene 9 o más dígitos
  if (!cleaned.startsWith('+')) {
    if (cleaned.length >= 9) {
      cleaned = '+34' + cleaned;
    }
  }

  // Limpiar duplicaciones típicas del usuario como +340034..., +3434..., +3400...
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

export function generateWhatsappMessage(customerName, numPeople, activity, bookingDate) {
  const firstName = customerName ? customerName.trim().split(' ')[0] : 'Cliente';
  const formattedDate = formatSpanishDate(bookingDate);
  const peopleText = `${numPeople || 1} persona(s)`;
  const actText = activity || 'tu actividad de buceo';

  return `Hola ${firstName}, gracias por tu reserva de ${peopleText} para ${actText} el ${formattedDate}.\n\n` +
         `Ya puedes realizar los registros necesarios en https://ihasiadivingkohtao.com/registro\n\n` +
         `Ahí encontrarás las instrucciones para hacerlo, cualquier duda nos comentas. Saludos y hasta pronto.`;
}

export function generateWhatsappLink(phone, customerName, numPeople, activity, bookingDate) {
  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone || !cleanedPhone.startsWith('+')) return null;
  const message = generateWhatsappMessage(customerName, numPeople, activity, bookingDate);
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
