import { COMPARISON_COLORS, LOGO_URLS, getMetricStyle } from './Estadisticas_utils';

/**
 * Estadisticas_MetricLogo
 * Renderiza el logo o ícono correspondiente a la métrica activa.
 * Usado en el header del gráfico Y en el header de la tabla (elimina duplicación).
 *
 * Props:
 *  - activeMetric   {string}
 *  - fallbackIcon   {ReactNode}  Ícono a mostrar si no hay logo definido (opcional)
 */
export default function Estadisticas_MetricLogo({ activeMetric, fallbackIcon = null }) {
  const maskStyle = (src, color) => ({
    backgroundColor: color,
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  });

  // Modo Comparativa — muestra los 3 logos
  if (activeMetric === 'comparativa') {
    const compLogos = [
      { id: 'ihasia',  src: LOGO_URLS.ihasia,  color: '#ffffff' },
      { id: 'carabao', src: LOGO_URLS.carabao, color: COMPARISON_COLORS.carabao },
      { id: 'ssi',     src: LOGO_URLS.ssi,     color: COMPARISON_COLORS.ssi },
    ];
    return (
      <div className="flex items-center gap-4">
        {compLogos.map(l => (
          <div key={l.id} style={maskStyle(l.src, l.color)} className="w-10 h-10" />
        ))}
      </div>
    );
  }

  // Métricas con logo propio
  const logoSrc = LOGO_URLS[activeMetric === 'facturado' ? 'ihasia' : activeMetric];
  if (logoSrc) {
    return (
      <div
        style={maskStyle(logoSrc, getMetricStyle(activeMetric, 'text').color)}
        className="w-10 h-10"
      />
    );
  }

  // Métricas sin logo (CRBT, Cursos…) — renderiza el icono que le pase el padre
  return fallbackIcon;
}
