import { TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MONTH_NAMES, COMPARISON_COLORS, TOOLTIP_CONFIG,
  getYearStyle, getMetricStyle, getMetricLabel
} from './Estadisticas_utils';
import Estadisticas_MetricLogo from './Estadisticas_MetricLogo';

// ── CustomTooltip — solo usado aquí ──────────────────────────────────────────
function CustomTooltip({ active, payload, label, isComparison = false }) {
  if (!active || !payload?.length) return null;

  const sortedPayload = [...payload].sort((a, b) =>
    isComparison ? Number(b.value) - Number(a.value) : Number(b.dataKey) - Number(a.dataKey)
  );
  const facturadoVal = payload.find(p => p.dataKey === 'facturado')?.value || 0;

  return (
    <div className={`bg-[#0f172a]/95 backdrop-blur-md border border-white/10 ${TOOLTIP_CONFIG.padding} rounded-xl shadow-2xl min-w-[165px] w-fit`}>
      <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-2.5 border-b border-white/10 pb-2 text-center">{label}</p>
      <div className="space-y-1">
        {sortedPayload.map(item => {
          const dataKey = item.dataKey;
          const id      = dataKey === 'crbt' ? 'CRBT' : dataKey === 'ihasia' ? 'IHASIA' : (item.name || dataKey);
          const value   = Number(item.value);
          const color   = isComparison
            ? COMPARISON_COLORS[dataKey.toLowerCase().replace(/ .*/, '')]
            : (item.stroke || item.color);

          let pct = '';
          if (isComparison) {
            if (dataKey !== 'facturado' && facturadoVal > 0)
              pct = `(${((value / facturadoVal) * 100).toFixed(0)}%)`;
          } else {
            const currentYear = parseInt(dataKey);
            if (!isNaN(currentYear)) {
              const prev = payload[0]?.payload?.[currentYear - 1];
              if (prev !== undefined && prev > 0) {
                const diff = ((value - prev) / prev) * 100;
                pct = `(${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%)`;
              }
            }
          }

          return (
            <div key={id} className="flex items-center gap-1.5 py-0.5 leading-none">
              <div className="flex items-center gap-1 w-[38px] shrink-0">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[12px] font-black uppercase tracking-tighter truncate" style={{ color }}>
                  {id.toUpperCase()}
                </span>
              </div>
              <div className="w-[72px] text-right">
                <span className="text-[13px] font-black text-white font-mono tracking-tighter">
                  {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-[42px] text-right shrink-0">
                <span className={`text-[12px] font-bold font-mono ${
                  pct.includes('+') ? 'text-emerald-400' : pct.includes('-') ? 'text-rose-400' : 'text-gray-500'
                }`}>
                  {pct}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Estadisticas_Chart — Panel del gráfico de líneas (Recharts).
 *
 * Props:
 *  - activeMetric           {string}
 *  - chartData              {Array}
 *  - chartYears             {number[]}
 *  - hiddenYears            {number[]}
 *  - toggleYear             {function}
 *  - hiddenMetrics          {string[]}
 *  - toggleMetric           {function}
 *  - selectedComparisonYear {number}
 */
export default function Estadisticas_Chart({
  activeMetric,
  chartData,
  chartYears,
  hiddenYears,
  toggleYear,
  hiddenMetrics,
  toggleMetric,
  selectedComparisonYear,
}) {
  const isComparison = activeMetric === 'comparativa';

  return (
    <div className="bg-surface-soft border border-surface-edge rounded-[2.5rem] py-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center mb-2 px-8">
        {/* Logo izquierda */}
        <div className="w-1/4 flex justify-start">
          <Estadisticas_MetricLogo activeMetric={activeMetric} />
        </div>

        {/* Título centro */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-7 h-7" style={getMetricStyle(activeMetric, 'text')} />
            {isComparison
              ? `Comparativa Anual ${selectedComparisonYear}`
              : `Evolución: ${getMetricLabel(activeMetric)}`}
          </h2>
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] translate-y-[3px]">
            {isComparison ? '(Categorías)' : `(${chartYears[0]} - ${chartYears[chartYears.length - 1]})`}
          </span>
        </div>

        {/* Leyenda / filtros derecha */}
        <div className="w-1/4 flex justify-end gap-4">
          {isComparison
            ? ['ihasia', 'carabao', 'sueldos', 'ssi', 'crbt', 'facturado'].map(catId => {
                const isHidden = hiddenMetrics.includes(catId);
                const label    = catId === 'crbt' ? 'CRBT' : catId === 'ihasia' ? 'IHASIA' : catId === 'sueldos' ? 'SUELDOS' : catId.toUpperCase();
                return (
                  <button
                    key={catId}
                    onClick={() => toggleMetric(catId)}
                    className={`flex items-center gap-2 transition-all duration-300 ${isHidden ? 'opacity-30 grayscale' : 'opacity-100 hover:scale-105'}`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[catId] }} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
                  </button>
                );
              })
            : chartYears.map(year => {
                const isHidden = hiddenYears.includes(year);
                return (
                  <button
                    key={year}
                    onClick={() => toggleYear(year)}
                    className={`flex items-center gap-2 transition-all duration-300 ${isHidden ? 'opacity-30 grayscale' : 'opacity-100 hover:scale-105'}`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getYearStyle(year).color }} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{year}</span>
                  </button>
                );
              })
          }
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[400px] w-full px-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#9ca3af" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} tickFormatter={v => v.toLocaleString()} />
            <Tooltip content={<CustomTooltip isComparison={isComparison} />} />

            {isComparison ? (
              <>
                <Line type="monotone" dataKey="facturado" stroke={COMPARISON_COLORS.facturado} strokeWidth={3} dot={{ r: 4 }} name="Facturado" hide={hiddenMetrics.includes('facturado')} />
                <Line type="monotone" dataKey="ihasia"    stroke={COMPARISON_COLORS.ihasia}    strokeWidth={4} dot={{ r: 5 }} name="IHASIA"    hide={hiddenMetrics.includes('ihasia')} />
                <Line type="monotone" dataKey="carabao"   stroke={COMPARISON_COLORS.carabao}   strokeWidth={3} dot={{ r: 4 }} name="Carabao"   hide={hiddenMetrics.includes('carabao')} />
                <Line type="monotone" dataKey="ssi"       stroke={COMPARISON_COLORS.ssi}       strokeWidth={3} dot={{ r: 4 }} name="SSI"       hide={hiddenMetrics.includes('ssi')} />
                <Line type="monotone" dataKey="crbt"      stroke={COMPARISON_COLORS.crbt}      strokeWidth={3} dot={{ r: 4 }} name="CRBT"      hide={hiddenMetrics.includes('crbt')} />
                <Line type="monotone" dataKey="sueldos"   stroke={COMPARISON_COLORS.sueldos}   strokeWidth={3} dot={{ r: 4 }} name="Sueldos"   hide={hiddenMetrics.includes('sueldos')} />
              </>
            ) : (
              chartYears.map(year => {
                const style = getYearStyle(year, true);
                return (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={year.toString()}
                    stroke={style.color}
                    strokeWidth={style.width}
                    strokeOpacity={style.opacity}
                    dot={{ r: style.dotRadius, strokeWidth: 1.5, fill: '#0f172a', strokeOpacity: style.opacity }}
                    activeDot={{ r: style.dotRadius + 2, strokeWidth: 0 }}
                    animationDuration={1000}
                    connectNulls
                    hide={hiddenYears.includes(year)}
                    name={year.toString()}
                  />
                );
              })
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
