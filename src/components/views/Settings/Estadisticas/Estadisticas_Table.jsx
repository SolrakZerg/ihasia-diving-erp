import { FileSpreadsheet, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MONTH_NAMES, COMPARISON_COLORS, getMetricStyle, getYearStyle } from './Estadisticas_utils';
import Estadisticas_MetricLogo from './Estadisticas_MetricLogo';

/**
 * Estadisticas_Table — Tabla comparativa mensual.
 *
 * Props:
 *  - activeMetric             {string}
 *  - currentMetricGrid        {object}  { [year]: number[12] }
 *  - availableYears           {number[]}
 *  - hiddenYears              {number[]}
 *  - hiddenMetrics            {string[]}
 *  - selectedComparisonYear   {number}
 *  - setSelectedComparisonYear {function}
 *  - getYearlyComparisonData  {function}
 *  - handleExportCSV          {function}
 */
export default function Estadisticas_Table({
  activeMetric,
  currentMetricGrid,
  availableYears,
  hiddenYears,
  hiddenMetrics,
  selectedComparisonYear,
  setSelectedComparisonYear,
  getYearlyComparisonData,
  handleExportCSV,
}) {
  const isComparison = activeMetric === 'comparativa';

  return (
    <div className="bg-surface-soft border border-surface-edge rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col mt-4">
      {/* Header */}
      <div className="py-2 px-8 border-b border-surface-edge flex items-center bg-white/2">
        {/* Logo izquierda */}
        <div className="w-1/4 flex justify-start">
          <Estadisticas_MetricLogo
            activeMetric={activeMetric}
            fallbackIcon={<FileSpreadsheet style={getMetricStyle(activeMetric, 'text')} className="w-10 h-10" />}
          />
        </div>

        {/* Título centro */}
        <div className="flex-1 flex justify-center">
          <h3 className="text-xl font-black text-white tracking-tight uppercase">Tabla Comparativa Mensual</h3>
        </div>

        {/* Controles derecha */}
        <div className="w-1/4 flex items-center justify-end gap-4">
          {isComparison && (
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedComparisonYear(year)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    selectedComparisonYear === year
                      ? 'bg-white/10 text-white shadow-xl'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-surface-edge/30 hover:bg-surface-edge/50 rounded-2xl border border-surface-edge/30 text-[11px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest active:scale-95"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20">
              <th className="px-6 py-3 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] w-32 min-w-[128px] border-r border-surface-edge/30 text-center leading-tight">
                {isComparison ? 'CATEGORÍA' : 'AÑO'}
              </th>
              {MONTH_NAMES.map(m => (
                <th key={m} className="px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-widest text-center leading-tight">{m}</th>
              ))}
              <th style={getMetricStyle(activeMetric, 'text')} className="px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-center border-l border-surface-edge/30 w-40 min-w-[160px] leading-tight">
                TOTAL
              </th>
              <th className="px-6 py-3 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] text-center border-l border-surface-edge/30 w-32 leading-tight">VAR. %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/20">
            {isComparison ? (
              /* ── Modo Comparativa ─────────────────────────────────────────── */
              (() => {
                const categories    = ['ihasia', 'carabao', 'sueldos', 'ssi', 'crbt', 'facturado'];
                const compData      = getYearlyComparisonData(selectedComparisonYear);
                const facturadoTotal = compData.map(d => d.facturado).reduce((a, b) => a + b, 0);

                return categories
                  .filter(catId => !hiddenMetrics.includes(catId))
                  .map(catId => {
                    const label    = catId === 'crbt' ? 'CRBT' : catId === 'ihasia' ? 'IHASIA' : catId === 'sueldos' ? 'SUELDOS' : catId.toUpperCase();
                    const color    = COMPARISON_COLORS[catId];
                    const values   = compData.map(d => d[catId]);
                    const total    = values.reduce((a, b) => a + b, 0);
                    const weight   = facturadoTotal > 0 ? (total / facturadoTotal) * 100 : 0;

                    return (
                      <tr key={catId} className="hover:bg-white/5 transition-colors group relative">
                        <td className="px-6 py-4 border-r border-surface-edge/30 relative text-center leading-tight">
                          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: color }} />
                          <span className="text-xs font-black text-white uppercase tracking-wider relative z-10">{label}</span>
                        </td>
                        {values.map((val, i) => (
                          <td key={i} className="px-2 py-3 text-center relative leading-tight">
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: color }} />
                            <span className={`relative z-10 text-[15px] font-black font-mono tracking-tighter ${val === 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                              {val > 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                            </span>
                          </td>
                        ))}
                        <td className="px-6 py-3 text-center border-l border-surface-edge/30 relative leading-tight" style={{ backgroundColor: `${color}15` }}>
                          <span className="relative z-10 text-lg font-black font-mono tracking-tighter" style={{ color }}>
                            {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center border-l border-surface-edge/30 relative bg-black/10 leading-tight">
                          {catId !== 'facturado' ? (
                            <span className={`text-sm font-mono font-black ${weight > 0 ? 'text-white' : 'text-gray-700'}`}>
                              {weight > 0 ? `${weight.toFixed(1)}%` : '-'}
                            </span>
                          ) : (
                            <span className="text-gray-700 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
              })()
            ) : (
              /* ── Modo Métrica por año ─────────────────────────────────────── */
              availableYears
                .filter(year => !hiddenYears.includes(year))
                .map((year, idx) => {
                  const yearRow    = currentMetricGrid[year];
                  const yearTotal  = yearRow.reduce((a, b) => a + b, 0);
                  const yearStyle  = getYearStyle(year);
                  const currentYear = new Date().getFullYear();
                  const prevYear   = availableYears.filter(y => !hiddenYears.includes(y))[idx + 1];
                  let variation    = null;

                  if (prevYear) {
                    const prevRow = currentMetricGrid[prevYear];
                    if (year === currentYear) {
                      const mo = new Date().getMonth();
                      if (mo > 0) {
                        const ytd     = yearRow.slice(0, mo).reduce((a, b) => a + b, 0);
                        const prevYtd = prevRow.slice(0, mo).reduce((a, b) => a + b, 0);
                        if (prevYtd > 0) variation = ((ytd - prevYtd) / prevYtd) * 100;
                      }
                    } else {
                      const prevTotal = prevRow.reduce((a, b) => a + b, 0);
                      if (prevTotal > 0) variation = ((yearTotal - prevTotal) / prevTotal) * 100;
                    }
                  }

                  return (
                    <tr key={year} className="hover:bg-white/5 transition-colors group relative">
                      <td className="px-6 py-3 border-r border-surface-edge/30 relative text-center leading-tight">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: yearStyle.color }} />
                        <div className="flex items-center justify-center gap-3 relative z-10">
                          <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: yearStyle.color }} />
                          <span className="text-lg font-black text-white font-mono tracking-tighter drop-shadow-md">{year}</span>
                        </div>
                      </td>
                      {yearRow.map((val, i) => (
                        <td key={i} className="px-2 py-3 text-center relative leading-tight">
                          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: yearStyle.color }} />
                          <span className={`relative z-10 text-[15px] font-black font-mono tracking-tighter ${val === 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                            {val > 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                          </span>
                        </td>
                      ))}
                      <td style={getMetricStyle(activeMetric, 'bg')} className="px-6 py-3 text-center border-l border-surface-edge/30 relative leading-tight">
                        <span style={getMetricStyle(activeMetric, 'text')} className="relative z-10 text-lg font-black font-mono tracking-tighter">
                          {yearTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center border-l border-surface-edge/30 relative bg-black/10 leading-tight">
                        {variation !== null ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className={`flex items-center gap-1.5 font-mono font-black ${variation >= 0 ? 'text-emerald-500' : 'text-rose-400'} leading-none`}>
                              <span className="text-lg tracking-tighter">{Math.abs(variation).toFixed(1)}%</span>
                              {variation >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-700 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
