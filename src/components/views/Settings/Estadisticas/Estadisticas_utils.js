// ─────────────────────────────────────────────────────────────────────────────
// Estadisticas_utils.js
// Constantes y funciones puras compartidas por todo el módulo Estadisticas.
// Sin estado, sin JSX, sin efectos secundarios.
// ─────────────────────────────────────────────────────────────────────────────

export const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const TOOLTIP_CONFIG = {
  monthSize: '11px',
  yearSize:  '12px',
  valueSize: '13px',
  percentSize: '12px',
  padding: 'p-3',
  gap: 'gap-3'
};

// Paleta de colores relativos al año actual (índice 0 = año actual)
export const RELATIVE_PALETTE  = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];
export const RELATIVE_FALLBACK = '#64748b';

// Color de acento por métrica (usado en bordes, fondos y textos)
export const METRIC_THEMES = {
  facturado:   '#ffffff',
  carabao:     '#38bdf8',
  ssi:         '#ff7070',
  total_crbt:  '#4ade80',
  courses:     '#fbbf24',
  comparativa: '#facc15',
  ihasia:      '#22c55e',
  sueldos:     '#facc15',
};

// Colores fijos para el modo Comparativa Anual
export const COMPARISON_COLORS = {
  facturado: '#94a3b8',
  carabao:   '#38bdf8',
  ssi:       '#ff7070',
  crbt:      '#a78bfa',
  ihasia:    '#22c55e',
  sueldos:   '#facc15',
};

// Configuración de las 6 métricas del selector (id, label, logo/icon)
export const METRIC_CONFIGS = [
  {
    id: 'facturado',
    label: 'Facturado',
    logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg',
  },
  {
    id: 'carabao',
    label: 'Carabao',
    logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png',
  },
  {
    id: 'ssi',
    label: 'SSI',
    logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png',
  },
  { id: 'total_crbt',  label: 'CRBT',        iconName: 'TrendingUp'  },
  { id: 'courses',     label: 'Cursos',       iconName: 'ArrowUpRight' },
  { id: 'comparativa', label: 'Comparativa',  iconName: 'LayoutGrid'  },
];

// URLs de logos usados en comparativa
export const LOGO_URLS = {
  ihasia:  'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg',
  carabao: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png',
  ssi:     'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png',
};

// ── Funciones puras ───────────────────────────────────────────────────────────

/**
 * Devuelve estilos de color para un año dado, relativos al año actual.
 * @param {number}  year
 * @param {boolean} isChart — si true, incluye strokeWidth y dotRadius
 */
export const getYearStyle = (year, isChart = false) => {
  const offset = new Date().getFullYear() - year;
  const color  = RELATIVE_PALETTE[offset] || RELATIVE_FALLBACK;

  if (isChart) {
    let width = 1, dotRadius = 2;
    if      (offset === 0) { width = 5; dotRadius = 3; }
    else if (offset === 1) { width = 3; dotRadius = 2.5; }
    else if (offset === 2) { width = 2; dotRadius = 2; }
    return { color, opacity: Math.max(0.5, 1 - offset * 0.1), width, dotRadius };
  }

  return { color };
};

/**
 * Genera un objeto de estilo CSS para una métrica activa.
 * @param {string} metric
 * @param {'text'|'border'|'bg'|'bg-solid'} type
 */
export const getMetricStyle = (metric, type = 'text') => {
  const color = METRIC_THEMES[metric] || '#ffffff';
  switch (type) {
    case 'text':     return { color };
    case 'border':   return { borderColor: `${color}80` };
    case 'bg':       return { backgroundColor: `${color}0d` };
    case 'bg-solid': return { backgroundColor: color };
    default:         return {};
  }
};

/**
 * Devuelve la etiqueta legible de una métrica.
 * @param {string} m
 */
export const getMetricLabel = (m) => {
  switch (m) {
    case 'facturado':   return 'Total Facturado';
    case 'carabao':     return 'Carabao';
    case 'ssi':         return 'SSI';
    case 'total_crbt':  return 'CRBT';
    case 'sueldos':     return 'SUELDOS';
    case 'courses':     return 'Total Cursos';
    case 'comparativa': return 'Comparativa Anual';
    case 'ihasia':      return 'IHASIA';
    default:            return '';
  }
};
