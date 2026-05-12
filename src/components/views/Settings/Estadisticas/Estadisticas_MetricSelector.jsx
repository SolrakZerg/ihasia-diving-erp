import { TrendingUp, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { METRIC_CONFIGS, METRIC_THEMES, getMetricStyle } from './Estadisticas_utils';

/** Colage de logos para el modo Comparativa (solo usado aquí) */
function ComparisonCollage({ active, size = 'large' }) {
  const logos = [
    { id: 'ihasia',  src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg', alt: 'ihasia' },
    { id: 'carabao', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png', alt: 'carabao' },
    { id: 'ssi',     src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png', alt: 'ssi' },
  ];

  if (size === 'small') {
    return (
      <div className="relative w-10 h-10 grid grid-cols-2 grid-rows-[1fr,0.6fr] gap-1 p-0.5">
        <div className="flex items-center justify-center overflow-hidden">
          <img src={logos[0].src} alt={logos[0].alt} className="w-full h-full object-contain invert brightness-2" />
        </div>
        <div className="flex items-center justify-center overflow-hidden">
          <img src={logos[1].src} alt={logos[1].alt} className="w-full h-full object-contain" />
        </div>
        <div className="col-span-2 flex items-center justify-center overflow-hidden opacity-40 px-1">
          <img src={logos[2].src} alt={logos[2].alt} className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-40 h-28 grid grid-cols-2 grid-rows-[1fr,0.5fr] gap-2 p-1 transition-all duration-700 ${active ? 'scale-110' : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80'}`}>
      <div className="flex items-center justify-center overflow-hidden">
        <img src={logos[0].src} alt={logos[0].alt} className="w-full h-full object-contain" style={{ filter: 'invert(1) brightness(2)' }} />
      </div>
      <div className="flex items-center justify-center overflow-hidden">
        <img src={logos[1].src} alt={logos[1].alt} className="w-full h-full object-contain" />
      </div>
      <div className="col-span-2 flex items-center justify-center overflow-hidden px-14 opacity-50">
        <img src={logos[2].src} alt={logos[2].alt} className="w-full h-full object-contain" />
      </div>
    </div>
  );
}

const ICON_MAP = { TrendingUp, ArrowUpRight, LayoutGrid };

/**
 * Estadisticas_MetricSelector — Las 6 tarjetas de selección de métrica.
 *
 * Props:
 *  - activeMetric   {string}
 *  - setActiveMetric {function}
 */
export default function Estadisticas_MetricSelector({ activeMetric, setActiveMetric }) {
  return (
    <div className="grid grid-cols-6 gap-4">
      {METRIC_CONFIGS.map(m => {
        const isActive = activeMetric === m.id;
        const Icon     = m.iconName ? ICON_MAP[m.iconName] : null;

        return (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            style={isActive ? { ...getMetricStyle(m.id, 'bg'), ...getMetricStyle(m.id, 'border') } : {}}
            className={`relative group flex flex-col items-center justify-between gap-6 p-6 h-56 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
              isActive
                ? 'shadow-[0_25px_60px_rgba(0,0,0,0.4)] scale-[1.02]'
                : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10 hover:translate-y-[-4px]'
            }`}
          >
            {/* Visual principal */}
            <div className="flex-1 flex items-center justify-center w-full">
              {m.id === 'comparativa' ? (
                <ComparisonCollage active={isActive} />
              ) : m.logo ? (
                <img
                  src={m.logo}
                  alt={m.label}
                  style={{ filter: m.id === 'facturado' ? (isActive ? 'invert(1) brightness(2)' : 'invert(1)') : (isActive ? 'none' : '') }}
                  className={`w-40 h-28 object-contain transition-all duration-700 ${
                    isActive
                      ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                      : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 group-hover:scale-110'
                  }`}
                />
              ) : (
                <Icon
                  style={isActive ? getMetricStyle(m.id, 'text') : {}}
                  className={`w-20 h-20 transition-all duration-700 ${
                    isActive
                      ? 'drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                      : 'text-white/60 group-hover:text-white/80 group-hover:scale-110'
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <span className={`text-[13px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
              isActive ? 'text-white translate-y-0 opacity-100' : 'text-white/20 group-hover:text-white/40 group-hover:translate-y-[-2px]'
            }`}>
              {m.label}
            </span>

            {/* Barra inferior activa */}
            {isActive && (
              <div
                style={getMetricStyle(m.id, 'bg-solid')}
                className="absolute bottom-0 left-0 right-0 h-1.5 animate-pulse shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
