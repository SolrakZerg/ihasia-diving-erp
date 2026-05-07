import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  Waves, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Configuration for UI standard styling
const TOOLTIP_CONFIG = {
  monthSize: '11px',
  yearSize: '13px',
  valueSize: '14px',
  percentSize: '13px',
  padding: 'p-2',
  gap: 'gap-2'
};

const RELATIVE_PALETTE = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6']; // Emerald, Amber, Violet, Blue
const RELATIVE_FALLBACK = '#64748b'; // Slate/Grey for older years

const METRIC_THEMES = {  
  facturado: '#ffffff', // emerald-400
  carabao: '#38bdf8',   // sky-400
  ssi: '#d73d30',       // rose-500
  total_crbt: '#34d399', // white
  courses: '#fbbf24',   // amber-400
};

const getYearStyle = (year, isChart = false) => {
  const currentYear = new Date().getFullYear();
  const offset = currentYear - year;
  
  const color = RELATIVE_PALETTE[offset] || RELATIVE_FALLBACK;
  
  if (isChart) {
    return {
      color,
      opacity: Math.max(0.5, 1 - (offset * 0.1)),
      width: offset === 0 ? 4 : 2
    };
  }
  
  return { color };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Create a lookup map for values by year
    const valuesByYear = {};
    payload.forEach(p => {
      valuesByYear[Number(p.dataKey)] = p.value;
    });

    // Sort payload by year (descending)
    const sortedPayload = [...payload].sort((a, b) => Number(b.dataKey) - Number(a.dataKey));
    
    return (
      <div className={`bg-[#0f172a]/95 backdrop-blur-md border border-white/10 ${TOOLTIP_CONFIG.padding} rounded-xl shadow-2xl`}>
        <p className={`text-[${TOOLTIP_CONFIG.monthSize}] font-black text-white uppercase tracking-[0.3em] mb-2.5 border-b border-white/10 pb-2 text-center`}>{label}</p>
        <div className="space-y-2">
          {sortedPayload.map((item) => {
            const year = Number(item.dataKey);
            const value = Number(item.value);
            const style = getYearStyle(year);
            
            // Calculate monthly variation vs previous year
            const prevYearValue = valuesByYear[year - 1];
            let variation = null;
            if (prevYearValue && prevYearValue > 0) {
              variation = ((value - prevYearValue) / prevYearValue) * 100;
            }

            return (
              <div key={year} className={`flex items-center justify-between ${TOOLTIP_CONFIG.gap}`}>
                <div className="flex items-center gap-1.5 w-12">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: style.color }} />
                  <span className={`text-[${TOOLTIP_CONFIG.yearSize}] font-black font-mono tracking-tighter`} style={{ color: style.color }}>{year}</span>
                </div>
                
                <div className="flex items-center justify-end gap-2.5 flex-1">
                  <span className={`text-[${TOOLTIP_CONFIG.valueSize}] font-black text-white font-mono tracking-tighter`}>
                    {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <div className="w-12 text-right">
                    {variation !== null ? (
                      <span className={`text-[${TOOLTIP_CONFIG.percentSize}] font-black font-mono ${variation >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {variation >= 0 ? '+' : ''}{variation.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-700 font-mono text-[10px]">-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function BusinessAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('facturado');
  const [hiddenYears, setHiddenYears] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const toggleYear = (year) => {
    setHiddenYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: reports, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) throw error;
      
      // Calculate dynamic years from data + current year
      const yearsInData = [...new Set(reports.map(r => r.year))];
      const currentYear = new Date().getFullYear();
      if (!yearsInData.includes(currentYear)) yearsInData.push(currentYear);
      
      // Sort years descending (newest first)
      const sortedYears = yearsInData.sort((a, b) => b - a);
      
      setAvailableYears(sortedYears);
      setData(reports || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for the monthly grid
  const getGridData = (metric) => {
    const grid = {};
    availableYears.forEach(year => {
      grid[year] = Array(12).fill(0);
    });

    data.forEach(item => {
      if (grid[item.year]) {
        let value = 0;
        if (metric === 'facturado') value = parseFloat(item.facturado) || 0;
        else if (metric === 'carabao') value = (parseFloat(item.cr_eur) || 0) + (parseFloat(item.cr_wise) || 0) + (parseFloat(item.cr_cash) || 0);
        else if (metric === 'ssi') value = (parseFloat(item.bt_eur) || 0) + (parseFloat(item.bt_wise) || 0) + (parseFloat(item.bt_cash) || 0);
        else if (metric === 'total_crbt') value = parseFloat(item.total_crbt) || 0;
        else if (metric === 'courses') value = parseInt(item.total_courses) || 0;

        grid[item.year][item.month - 1] = value;
      }
    });

    return grid;
  };

  // Process data for Recharts (Line Chart)
  const getChartData = (metric) => {
    const grid = getGridData(metric);
    const chartData = MONTH_NAMES.map((name, idx) => {
      const point = { month: name };
      // For charts, we usually want years in ascending order for legend, or just consistent
      availableYears.slice().sort().forEach(year => {
        const val = grid[year][idx];
        if (val > 0 || (year === new Date().getFullYear() && idx < new Date().getMonth())) {
            point[year] = val;
        }
      });
      return point;
    });
    return chartData;
  };

  const currentMetricGrid = getGridData(activeMetric);
  const chartData = getChartData(activeMetric);
  const chartYears = availableYears.slice().sort();

  const getMetricLabel = (m) => {
    switch(m) {
      case 'facturado': return 'Total Facturado';
      case 'carabao': return 'Carabao';
      case 'ssi': return 'SSI';
      case 'total_crbt': return 'CRBT';
      case 'courses': return 'Total Cursos';
      default: return '';
    }
  };

  // Helpers para colores dinámicos usando Hex
  const getMetricStyle = (m, type = 'text') => {
    const color = METRIC_THEMES[m] || '#ffffff';
    switch(type) {
      case 'text': return { color };
      case 'border': return { borderColor: `${color}80` }; // 50% opacidad
      case 'bg': return { backgroundColor: `${color}1a` };     // 10% opacidad
      case 'bg-solid': return { backgroundColor: color };
      default: return {};
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
        <Loader2 className="w-12 h-12 animate-spin text-brand" />
        <span className="text-xs font-black uppercase tracking-widest">Cargando Histórico...</span>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-unfold">
      {/* Metrics Selector */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { id: 'facturado', label: 'Facturado', icon: BarChart3, logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg' },
          { id: 'carabao', label: 'Carabao', icon: Activity, logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png' },
          { id: 'ssi', label: 'SSI', icon: Waves, logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png' },
          { id: 'total_crbt', label: 'CRBT', icon: TrendingUp },
          { id: 'courses', label: 'Cursos', icon: ArrowUpRight },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            style={activeMetric === m.id ? { ...getMetricStyle(m.id, 'bg'), ...getMetricStyle(m.id, 'border') } : {}}
            className={`relative group flex flex-col items-center justify-between gap-6 p-10 h-56 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
              activeMetric === m.id 
                ? 'shadow-[0_25px_60px_rgba(0,0,0,0.4)] scale-[1.02]' 
                : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10 hover:translate-y-[-4px]'
            }`}
          >
            <div className="flex-1 flex items-center justify-center w-full">
              {m.logo ? (
                <img 
                  src={m.logo} 
                  alt={m.label} 
                  style={{
                    filter: m.id === 'facturado' 
                      ? (activeMetric === m.id ? 'invert(1) brightness(2)' : 'invert(1)')
                      : (activeMetric === m.id ? 'none' : '')
                  }}
                  className={`w-40 h-28 object-contain transition-all duration-700 ${
                    activeMetric === m.id 
                      ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                      : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 group-hover:scale-110'
                  }`} 
                />
              ) : (
                <m.icon 
                  style={activeMetric === m.id ? getMetricStyle(m.id, 'text') : {}}
                  className={`w-20 h-20 transition-all duration-700 ${
                  activeMetric === m.id 
                    ? 'drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]' 
                    : 'text-white/60 group-hover:text-white/80 group-hover:scale-110'
                }`} />
              )}
            </div>
            
            <span className={`text-[13px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
              activeMetric === m.id ? 'text-white translate-y-0 opacity-100' : 'text-white/20 group-hover:text-white/40 group-hover:translate-y-[-2px]'
            }`}>
              {m.label}
            </span>
            
            {activeMetric === m.id && (
              <div 
                style={getMetricStyle(m.id, 'bg-solid')}
                className="absolute bottom-0 left-0 right-0 h-1.5 animate-pulse shadow-[0_0_20px_rgba(0,0,0,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="bg-surface-soft border border-surface-edge rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-7 h-7" style={getMetricStyle(activeMetric, 'text')} />
              Comparativa Anual: {getMetricLabel(activeMetric)}
            </h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Evolución mensual consolidada ({chartYears[0]} - {chartYears[chartYears.length-1]})</p>
          </div>
          <div className="flex gap-4">
              {chartYears.map(year => {
                const isHidden = hiddenYears.includes(year);
                return (
                  <button 
                    key={year} 
                    className={`flex items-center gap-2 transition-all duration-300 ${isHidden ? 'opacity-30 grayscale' : 'opacity-100 hover:scale-105'}`}
                    onClick={() => toggleYear(year)}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getYearStyle(year).color }} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{year}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af" 
                fontSize={10} 
                fontWeight="black" 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={10} 
                fontWeight="black" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
                {chartYears.map(year => {
                  const style = getYearStyle(year, true);
                  return (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={year.toString()}
                      stroke={style.color}
                      strokeWidth={style.width}
                      strokeOpacity={style.opacity}
                      dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', strokeOpacity: style.opacity }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1000}
                      connectNulls={true}
                      hide={hiddenYears.includes(year)}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Grid Section */}
      <div className="bg-surface-soft border border-surface-edge rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-surface-edge flex justify-between items-center bg-white/2">
          <div className="flex items-center gap-4">
             <div 
                style={getMetricStyle(activeMetric, 'bg')}
                className="p-3 rounded-2xl"
              >
                <FileSpreadsheet 
                  style={getMetricStyle(activeMetric, 'text')}
                  className="w-6 h-6" 
                />
             </div>
             <div>
                <h3 className="text-xl font-black text-white tracking-tight uppercase">Tabla Comparativa Mensual</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Valores numéricos por periodo</p>
             </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-surface-edge/30 hover:bg-surface-edge/50 rounded-2xl border border-surface-edge/30 text-[11px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20">
                <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] w-32 border-r border-surface-edge/30 text-center">AÑO</th>
                {MONTH_NAMES.map(m => (
                  <th key={m} className="px-4 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest text-center">{m}</th>
                ))}
                <th 
                  style={getMetricStyle(activeMetric, 'text')}
                  className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-center border-l border-surface-edge/30 w-40"
                >
                  TOTAL
                </th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] text-center border-l border-surface-edge/30 w-32">VAR. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/20">
              {availableYears.map((year, idx) => {
                const yearRow = currentMetricGrid[year];
                const yearTotal = yearRow.reduce((a, b) => a + b, 0);
                const yearStyle = getYearStyle(year);
                const currentYear = new Date().getFullYear();
                
                // Calculate variation % from the chronologically PREVIOUS year
                // availableYears is sorted newest first, so previous year is availableYears[idx + 1]
                const prevYear = availableYears[idx + 1];
                let variation = null;
                
                if (prevYear) {
                  const prevYearRow = currentMetricGrid[prevYear];
                  
                  if (year === currentYear) {
                    // YTD Logic: Only use FULLY COMPLETED months
                    const currentMonthIndex = new Date().getMonth(); // e.g., 4 for May
                    
                    if (currentMonthIndex > 0) {
                      // Sum only completed months (0 to currentMonthIndex - 1)
                      const ytdTotal = yearRow.slice(0, currentMonthIndex).reduce((a, b) => a + b, 0);
                      const prevYtdTotal = prevYearRow.slice(0, currentMonthIndex).reduce((a, b) => a + b, 0);
                      
                      if (prevYtdTotal > 0) {
                        variation = ((ytdTotal - prevYtdTotal) / prevYtdTotal) * 100;
                      }
                    }
                  } else {
                    // Full year comparison for past years
                    const prevTotal = prevYearRow.reduce((a, b) => a + b, 0);
                    if (prevTotal > 0) {
                      variation = ((yearTotal - prevTotal) / prevTotal) * 100;
                    }
                  }
                }

                return (
                  <tr key={year} className="hover:bg-white/5 transition-colors group relative">
                    <td className="px-6 py-5 border-r border-surface-edge/30 relative text-center">
                      <div 
                        className="absolute inset-0 opacity-20 pointer-events-none" 
                        style={{ backgroundColor: yearStyle.color }}
                      />
                      <div className="flex items-center justify-center gap-3 relative z-10">
                         <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: yearStyle.color }} />
                         <span className="text-lg font-black text-white font-mono tracking-tighter drop-shadow-md">{year}</span>
                      </div>
                    </td>
                    {yearRow.map((val, i) => (
                      <td key={i} className="px-2 py-5 text-center relative">
                        <div 
                          className="absolute inset-0 opacity-10 pointer-events-none" 
                          style={{ backgroundColor: yearStyle.color }}
                        />
                        <span className={`relative z-10 text-[15px] font-black font-mono tracking-tighter ${val === 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                          {val > 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                        </span>
                      </td>
                    ))}
                     <td 
                      style={getMetricStyle(activeMetric, 'bg')}
                      className="px-6 py-5 text-center border-l border-surface-edge/30 relative"
                    >
                      <span 
                        style={getMetricStyle(activeMetric, 'text')}
                        className="relative z-10 text-lg font-black font-mono tracking-tighter"
                      >
                        {yearTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center border-l border-surface-edge/30 relative bg-black/10">
                      {variation !== null ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className={`flex items-center gap-1.5 font-mono font-black ${variation >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                            <span className="text-lg tracking-tighter">{Math.abs(variation).toFixed(1)}%</span>
                            {variation >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          {year === currentYear && (
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider -mt-1 opacity-60">YTD</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-700 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
