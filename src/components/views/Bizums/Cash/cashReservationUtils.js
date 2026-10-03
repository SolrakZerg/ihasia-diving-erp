/**
 * Utilidades para el Módulo de Reservas Cash (Addtocalendar 5.2 para ERP)
 */

export const COURSES = [
  {
    code: 'OW',
    nameEs: 'Open Water',
    nameEn: 'Open Water',
    emoji: '🟢',
    badge: {
      border: 'border-emerald-500/40 focus:border-emerald-400',
      text: 'text-white',
      bgSoft: 'bg-emerald-500/15'
    }
  },
  {
    code: 'OW 2',
    nameEs: 'Open Water (2 días)',
    nameEn: 'Open Water (in 2 days)',
    emoji: '🟢',
    badge: {
      border: 'border-emerald-500/40 focus:border-emerald-400',
      text: 'text-white',
      bgSoft: 'bg-emerald-500/15'
    }
  },
  {
    code: 'AA',
    nameEs: 'Curso Avanzado',
    nameEn: 'Advanced Course',
    emoji: '🔵',
    badge: {
      border: 'border-sky-500/40 focus:border-sky-400',
      text: 'text-white',
      bgSoft: 'bg-sky-500/15'
    }
  },
  {
    code: 'RES',
    nameEs: 'Curso de Rescate',
    nameEn: 'Rescue Diver',
    emoji: '🟠',
    badge: {
      border: 'border-orange-500/40 focus:border-orange-400',
      text: 'text-white',
      bgSoft: 'bg-orange-500/15'
    }
  },
  {
    code: 'DSD',
    nameEs: 'Bautizo',
    nameEn: 'Try Dive',
    emoji: '🔴',
    badge: {
      border: 'border-rose-500/40 focus:border-rose-400',
      text: 'text-white',
      bgSoft: 'bg-rose-500/15'
    }
  },
  {
    code: 'SR',
    nameEs: 'Refresh',
    nameEn: 'Refresh',
    emoji: '🟡',
    badge: {
      border: 'border-amber-500/40 focus:border-amber-400',
      text: 'text-white',
      bgSoft: 'bg-amber-500/15'
    }
  },
  {
    code: 'FD',
    nameEs: 'Fun Dives',
    nameEn: 'Fun Dives',
    emoji: '🟣',
    badge: {
      border: 'border-purple-500/40 focus:border-purple-400',
      text: 'text-white',
      bgSoft: 'bg-purple-500/15'
    }
  }
];

export const WA_TEXTS = {
  es: {
    greeting: "Hola {nombre}, gracias por tu reserva de {numero} persona(s) para {actividad} el {fecha}.\n\n",
    register_url: "https://ihasiadivingkohtao.com/registro",
    instructions: "Ya puedes realizar los registros necesarios en {url}\n\nAhí encontrarás las instrucciones para hacerlo, cualquier duda nos comentas. Saludos y hasta pronto.",
    btn_confirm: "📲 ENVIAR MENSAJE CONFIRMACIÓN"
  },
  en: {
    greeting: "Hi {nombre}, thank you for your booking for {numero} person(s) for {actividad} on {fecha}.\n\n",
    register_url: "https://ihasiadivingkohtao.com/en/register/",
    instructions: "You can now complete the necessary registration at {url}\n\nThere you will find the instructions on how to do it. Let us know if you have any questions. Best regards and see you soon.",
    btn_confirm: "📲 SEND CONFIRMATION MESSAGE"
  }
};

/**
 * Formatear fecha larga en español para WhatsApp
 */
export function formatFechaEs(dateObj) {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[dateObj.getDay()]}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
}

/**
 * Formatear fecha larga en inglés para WhatsApp
 */
export function formatFechaEn(dateObj) {
  const dias = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const meses = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${dias[dateObj.getDay()]}, ${meses[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

/**
 * Formatea la fecha en formato ISO (YYYY-MM-DD)
 */
export function formatISODate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Limpieza de número de teléfono
 */
export function cleanPhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  return String(rawPhone).replace(/[^\d+]/g, '');
}

/**
 * Parser de portapapeles idéntico a TextParser de Addtocalendar 5.2
 */
export function parseClipboardText(rawText) {
  if (!rawText) return { name: '', phone: '', detectedCourse: null };
  const text = String(rawText).trim();

  // Regex para teléfono internacional o estándar (mínimo 8 dígitos)
  const phonePattern = /(\+?\d[\d\s-]{8,})/;
  const phoneMatch = text.match(phonePattern);

  let phone = '';
  let name = '';

  if (phoneMatch) {
    const rawMatch = phoneMatch[1];
    phone = rawMatch.replace(/[\s-]/g, '');
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    let cleanName = text
      .replace(rawMatch, '')
      .replace(/~/g, '')
      .replace(/^[\s_.~-]+|[\s_.~-]+$/g, '')
      .trim();

    // Si viene en múltiples líneas (ej: Carlos en línea 1 y teléfono en línea 2), extraer el nombre limpio
    if (cleanName.includes('\n')) {
      cleanName = cleanName.split('\n').map(l => l.trim()).filter(Boolean)[0] || '';
    }

    // Un nombre real (incluso un caso nobiliario o compuesto extremo) cabe perfectamente en 90 caracteres
    if (cleanName.length <= 90) {
      name = cleanName;
    }
  } else {
    // Si NO hay teléfono, solo se acepta si es un texto corto (< 50 caracteres), sin saltos de línea ni URLs
    const isShortSingleLine = text.length <= 50 && !text.includes('\n') && !text.includes('http');
    if (isShortSingleLine) {
      name = text.replace(/~/g, '').trim();
    }
  }

  // Detección heurística de curso
  let detectedCourse = null;
  const upperText = text.toUpperCase();
  if (upperText.includes('OW 2') || upperText.includes('OW2')) {
    detectedCourse = 'OW 2';
  } else if (upperText.includes('OPEN WATER') || upperText.includes('OW')) {
    detectedCourse = 'OW';
  } else if (upperText.includes('ADVANCED') || upperText.includes('AVANZADO') || upperText.includes('AA')) {
    detectedCourse = 'AA';
  } else if (upperText.includes('RESCUE') || upperText.includes('RESCATE') || upperText.includes('RES')) {
    detectedCourse = 'RES';
  } else if (upperText.includes('BAUTIZO') || upperText.includes('DSD') || upperText.includes('DISCOVER')) {
    detectedCourse = 'DSD';
  } else if (upperText.includes('REFRESH') || upperText.includes('SR')) {
    detectedCourse = 'SR';
  } else if (upperText.includes('FUN DIVE') || upperText.includes('FD')) {
    detectedCourse = 'FD';
  }

  return { name, phone, detectedCourse };
}

/**
 * Obtener nombre completo de la actividad para WhatsApp
 */
export function getCourseFullName(code, lang = 'es') {
  if (code === 'OW 2' || code === 'OW') {
    return 'Open Water';
  }
  if (code === 'RES' || code === 'Rescue') {
    return lang === 'en' ? 'Rescue Diver' : 'Curso de Rescate';
  }
  const found = COURSES.find(c => c.code === code);
  if (!found) return code;
  return lang === 'en' ? found.nameEn : found.nameEs;
}

/**
 * Construir el resumen de actividades (ej: "OW (in 2 days)x1 + RESx1 + AAx1")
 */
export function buildActivitySummary(activities = [], isEnglish = false) {
  if (!activities || activities.length === 0) return { codesStr: 'OWx1', hasOw2: false, totalPax: 1 };
  
  let hasOw2 = false;
  let totalPax = 0;
  const chunks = [];

  for (const item of activities) {
    let act = item.activity || 'OW';
    const num = Number(item.num) || 1;
    totalPax += num;

    if (act === 'Rescue') {
      act = 'RES';
    }

    if (act === 'OW 2') {
      hasOw2 = true;
      const sufijo = isEnglish ? ' (in 2 days)' : ' (en 2 días)';
      chunks.push(`OW${sufijo}x${num}`);
    } else {
      chunks.push(`${act}x${num}`);
    }
  }

  return {
    codesStr: chunks.join(' + '),
    hasOw2,
    totalPax: totalPax || 1
  };
}

/**
 * Genera el texto y enlace de confirmación de WhatsApp
 */
export function buildWhatsAppMessage({
  customerName,
  activities = [],
  bookingDate,
  isEnglish = false,
  phone = ''
}) {
  const lang = isEnglish ? 'en' : 'es';
  const textos = WA_TEXTS[lang];
  const { codesStr, hasOw2, totalPax } = buildActivitySummary(activities, isEnglish);

  const fechaStr = isEnglish ? formatFechaEn(bookingDate) : formatFechaEs(bookingDate);

  // Nombres de actividades para el texto
  const nombresWaChunks = activities.map(item => {
    let fullName = getCourseFullName(item.activity, lang);
    if (item.activity === 'OW 2') {
      fullName += lang === 'en' ? ' in 2 days' : ' en 2 días';
    }
    return activities.length > 1 ? `${fullName} (x${item.num || 1})` : fullName;
  });

  let actividadWaStr = '';
  const conector = lang === 'en' ? ' and ' : ' y ';
  if (nombresWaChunks.length === 1) {
    actividadWaStr = nombresWaChunks[0];
  } else if (nombresWaChunks.length === 2) {
    actividadWaStr = nombresWaChunks.join(conector);
  } else if (nombresWaChunks.length > 2) {
    actividadWaStr = nombresWaChunks.slice(0, -1).join(', ') + conector + nombresWaChunks[nombresWaChunks.length - 1];
  } else {
    actividadWaStr = getCourseFullName('OW', lang);
  }

  let text = textos.greeting
    .replace('{nombre}', customerName || 'Amigo/a')
    .replace('{numero}', String(totalPax))
    .replace('{actividad}', actividadWaStr)
    .replace('{fecha}', fechaStr);

  text += textos.instructions.replace('{url}', textos.register_url);

  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : '';

  return {
    text,
    waLink,
    cleanPhone,
    codesStr,
    sufijoDias: '',
    totalPax
  };
}
