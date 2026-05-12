// ─── Constantes y utilidades puras del módulo de Clientes ────────────────────
// Extraído de useCustomersData.js para separar lógica de negocio de estado React.

export const ACTIVITY_COLORS = {
  'try dive':   'text-rose-400/90',
  'bautizo':    'text-rose-400/90',
  'open water': 'text-emerald-400',
  'owd':        'text-emerald-400',
  'advanced':   'text-sky-400',
  'aowd':       'text-sky-400',
  'rescue':     'text-orange-400',
  'fun dive':   'text-purple-400',
  'fundive':    'text-purple-400',
  'ocio':       'text-purple-400',
  'refresh':    'text-amber-400',
  'refresher':  'text-amber-400',
  'ssi course': 'text-fuchsia-400',
};

export const getActivityColor = (activity) => {
  if (!activity) return 'text-gray-400';
  const a = activity.toLowerCase();
  for (const [key, color] of Object.entries(ACTIVITY_COLORS)) {
    if (a.includes(key)) return color;
  }
  return 'text-brand';
};

export const shortenLastDive = (lastDive) => {
  if (!lastDive) return '---';
  const ld = lastDive.toLowerCase();
  if (ld.includes('ufff') || ld.includes('mucho') || ld.includes('2 años')) return '+2 años';
  if (ld.includes('6 meses') && ld.includes('1 año')) return '6-12 meses';
  if (ld.includes('6 meses')) return '< 6 meses';
  if (ld.includes('1 año') && ld.includes('2 años')) return '1-2 años';
  return lastDive.slice(0, 15);
};

export const normalizeLevel = (level) => {
  if (!level) return 'Buceador';
  const l = level.trim().toLowerCase();
  if (l === 'advance' || l === 'advanced') return 'Advanced Open Water';
  if (l.includes('instructor') || l.includes('master')) return 'Pro (Inst/DM)';
  return level;
};
