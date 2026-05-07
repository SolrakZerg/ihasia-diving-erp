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
  Download,
  LayoutGrid
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Configuration for UI standard styling
const TOOLTIP_CONFIG = {
  monthSize: '11px',
  yearSize: '12px',
  valueSize: '13px',
  percentSize: '12px',
  padding: 'p-3',
  gap: 'gap-3'
};

const RELATIVE_PALETTE = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6']; // Emerald, Amber, Violet, Blue
const RELATIVE_FALLBACK = '#64748b'; // Slate/Grey for older years

const METRIC_THEMES = {  
  facturado: '#ffffff', 
  carabao: '#38bdf8',   
  ssi: '#ff7070',       
  total_crbt: '#4ade80', 
  courses: '#fbbf24',   
  comparativa: '#facc15',
  ihasia: '#22c55e',
  sueldos: '#facc15',
};

const COMPARISON_COLORS = {
  facturado: '#94a3b8',
  carabao: '#38bdf8',
  ssi: '#ff7070',
  crbt: '#a78bfa',
  ihasia: '#22c55e',
  sueldos: '#facc15'
};

const getYearStyle = (year, isChart = false) => {
  const currentYear = new Date().getFullYear();
  const offset = currentYear - year;
  
  const color = RELATIVE_PALETTE[offset] || RELATIVE_FALLBACK;
  
  if (isChart) {
    let width = 1;
    let dotRadius = 2;
    if (offset === 0) {
      width = 5;
      dotRadius = 3;
    } else if (offset === 1) {
      width = 3;
      dotRadius = 2.5;
    } else if (offset === 2) {
      width = 2;
      dotRadius = 2;
    }

    return {
      color,
      opacity: Math.max(0.5, 1 - (offset * 0.1)),
      width,
      dotRadius
    };
  }
  
  return { color };
};

const ComparisonCollage = ({ active, size = "large" }) => {
  const logos = [
    { id: 'facturado', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg' },
    { id: 'carabao', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png' },
    { id: 'ssi', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png' }
  ];

  if (size === "small") {
    return (
      <div className="relative w-10 h-10 grid grid-cols-2 grid-rows-[1fr,0.6fr] gap-1 p-0.5">
         <div className="flex items-center justify-center overflow-hidden">
           <img src={logos[0].logo} alt="ihasia" className="w-full h-full object-contain invert brightness-2" />
         </div>
         <div className="flex items-center justify-center overflow-hidden">
           <img src={logos[1].logo} alt="carabao" className="w-full h-full object-contain" />
         </div>
         <div className="col-span-2 flex items-center justify-center overflow-hidden opacity-40 px-1">
           <img src={logos[2].logo} alt="ssi" className="w-full h-full object-contain" />
         </div>
      </div>
    );
  }

  return (
    <div className={`relative w-40 h-28 grid grid-cols-2 grid-rows-[1fr,0.5fr] gap-2 p-1 transition-all duration-700 ${active ? 'scale-110' : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80'}`}>
       {/* Top Row: IHASIA & Carabao (Main Focus) */}
       <div className="flex items-center justify-center overflow-hidden">
         <img 
            src={logos[0].logo} 
            alt="ihasia" 
            className="w-full h-full object-contain"
            style={{ filter: 'invert(1) brightness(2)' }}
         />
       </div>
       <div className="flex items-center justify-center overflow-hidden">
         <img src={logos[1].logo} alt="carabao" className="w-full h-full object-contain" />
       </div>
       
       {/* Bottom Row: SSI (Minimized) */}
       <div className="col-span-2 flex items-center justify-center overflow-hidden px-14 opacity-50">
         <img src={logos[2].logo} alt="ssi" className="w-full h-full object-contain" />
       </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, isComparison = false }) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => {
      if (isComparison) return Number(b.value) - Number(a.value);
      // Orden cronológico descendente (2026, 2025...)
      return Number(b.dataKey) - Number(a.dataKey);
    });
    
    // Find facturado to calculate percentages in comparison mode
    const facturadoItem = payload.find(p => p.dataKey === 'facturado');
    const facturadoVal = facturadoItem ? Number(facturadoItem.value) : 0;
    
    return (
      <div className={`bg-[#0f172a]/95 backdrop-blur-md border border-white/10 ${TOOLTIP_CONFIG.padding} rounded-xl shadow-2xl min-w-[165px] w-fit`}>
        <p className={`text-[${TOOLTIP_CONFIG.monthSize}] font-black text-white uppercase tracking-[0.3em] mb-2.5 border-b border-white/10 pb-2 text-center`}>{label}</p>
        <div className="space-y-1">
          {sortedPayload.map((item) => {
            const dataKey = item.dataKey;
            const id = dataKey === 'crbt' ? 'CRBT' : dataKey === 'ihasia' ? 'IHASIA' : (item.name || dataKey);
            const value = Number(item.value);
            const color = isComparison ? COMPARISON_COLORS[dataKey.toLowerCase().replace(/ .*/, '')] : item.stroke || item.color;
            
            let percentageDisplay = "";
            if (isComparison) {
              if (dataKey !== 'facturado' && facturadoVal > 0) {
                const p = (value / facturadoVal) * 100;
                percentageDisplay = `(${p.toFixed(0)}%)`;
              }
            } else {
              const currentYear = parseInt(dataKey);
              if (!isNaN(currentYear)) {
                const prevYear = currentYear - 1;
                const prevValue = payload[0].payload[prevYear];
                if (prevValue !== undefined && prevValue > 0) {
                  const diff = ((value - prevValue) / prevValue) * 100;
                  const sign = diff >= 0 ? '+' : '';
                  percentageDisplay = `(${sign}${diff.toFixed(0)}%)`;
                }
              }
            }

            return (
              <div key={id} className="flex items-center gap-1.5 py-0.5 leading-none">
                {/* Columna 1: Año/ID (Ultra-ajustado) */}
                <div className="flex items-center gap-1 w-[38px] shrink-0">
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className={`text-[${TOOLTIP_CONFIG.yearSize}] font-black uppercase tracking-tighter truncate`} style={{ color }}>
                    {id.toUpperCase()}
                  </span>
                </div>
                
                {/* Columna 2: Valor (Optimizado para millones) */}
                <div className="w-[72px] text-right">
                  <span className={`text-[${TOOLTIP_CONFIG.valueSize}] font-black text-white font-mono tracking-tighter`}>
                    {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Columna 3: Porcentaje */}
                <div className="w-[42px] text-right shrink-0">
                  <span className={`text-[${TOOLTIP_CONFIG.percentSize}] font-bold font-mono ${
                    percentageDisplay.includes('+') ? 'text-emerald-400' : 
                    percentageDisplay.includes('-') ? 'text-rose-400' : 
                    'text-gray-500'
                  }`}>
                    {percentageDisplay}
                  </span>
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
  const [settlementsData, setSettlementsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('facturado');
  const [selectedComparisonYear, setSelectedComparisonYear] = useState(new Date().getFullYear());
  const [hiddenYears, setHiddenYears] = useState([]);
  const [hiddenMetrics, setHiddenMetrics] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const toggleYear = (year) => {
    setHiddenYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const toggleMetric = (m) => {
    setHiddenMetrics(prev => 
      prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, settlementsRes] = await Promise.all([
        supabase
          .from('monthly_reports')
          .select('*')
          .order('year', { ascending: true })
          .order('month', { ascending: true }),
        supabase
          .from('supplier_settlements')
          .select('*')
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (settlementsRes.error) throw settlementsRes.error;
      
      const reports = reportsRes.data || [];
      const settlements = settlementsRes.data || [];

      // Calculate dynamic years from both sources + current year
      const yearsInData = [
        ...new Set([
          ...reports.map(r => r.year),
          ...settlements.map(s => s.year)
        ])
      ];
      const currentYear = new Date().getFullYear();
      if (!yearsInData.includes(currentYear)) yearsInData.push(currentYear);
      
      // Sort years descending (newest first)
      const sortedYears = yearsInData.sort((a, b) => b - a);
      
      setAvailableYears(sortedYears);
      setData(reports);
      setSettlementsData(settlements);
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

    if (metric === 'carabao' || metric === 'ssi') {
      settlementsData.forEach(item => {
        const sName = item.supplier_name?.toUpperCase() || '';
        const target = metric === 'carabao' ? 'CARABAO' : 'SSI';
        
        if (sName === target && grid[item.year]) {
          grid[item.year][item.month - 1] += parseFloat(item.paid_amount) || 0;
        }
      });
    } else {
      data.forEach(item => {
        if (grid[item.year]) {
          let value = 0;
          if (metric === 'facturado') value = parseFloat(item.facturado) || 0;
          else if (metric === 'total_crbt') value = parseFloat(item.partner_split) || 0;
          else if (metric === 'courses') value = parseInt(item.total_courses) || 0;

          grid[item.year][item.month - 1] = value;
        }
      });
    }

    return grid;
  };

  const getMetricLabel = (m) => {
    switch(m) {
      case 'facturado': return 'Total Facturado';
      case 'carabao': return 'Carabao';
      case 'ssi': return 'SSI';
      case 'total_crbt': return 'CRBT';
      case 'sueldos': return 'SUELDOS';
      case 'courses': return 'Total Cursos';
      case 'comparativa': return 'Comparativa Anual';
      case 'ihasia': return 'IHASIA';
      default: return '';
    }
  };

  const getYearlyComparisonData = (year) => {
    return MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const point = { month: name };
      
      // From reports
      const report = data.find(r => r.year === year && r.month === month);
      point.facturado = parseFloat(report?.facturado) || 0;
      point.crbt = parseFloat(report?.partner_split) || 0;
      point.ihasia = (parseFloat(report?.partner_split) || 0) * 2;
      point.sueldos = parseFloat(report?.sueldos_total) || 0;

      // From settlements
      let cAmount = 0;
      let sAmount = 0;
      settlementsData.forEach(s => {
        if (s.year === year && s.month === month) {
          const sName = s.supplier_name?.toUpperCase() || '';
          if (sName === 'CARABAO') cAmount += parseFloat(s.paid_amount) || 0;
          if (sName === 'SSI') sAmount += parseFloat(s.paid_amount) || 0;
        }
      });
      point.carabao = cAmount;
      point.ssi = sAmount;

      return point;
    });
  };

  // Process data for Recharts (Line Chart)
  const getChartData = (metric) => {
    if (metric === 'comparativa') {
      return getYearlyComparisonData(selectedComparisonYear);
    }

    const grid = getGridData(metric);
    const chartData = MONTH_NAMES.map((name, idx) => {
      const point = { month: name };
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

  // Helpers para colores dinámicos usando Hex
  const getMetricStyle = (m, type = 'text') => {
    const color = METRIC_THEMES[m] || '#ffffff';
    switch(type) {
      case 'text': return { color };
      case 'border': return { borderColor: `${color}80` }; // 50% opacidad
      case 'bg': return { backgroundColor: `${color}0d` };     // 5% opacidad (0d hex = 5% approx)
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

  const handleExportCSV = () => {
    const months = MONTH_NAMES;
    let csvContent = "";
    
    if (activeMetric === 'comparativa') {
      csvContent = `Categoría,${months.join(',')},Total Anual\n`;
      const comparisonData = getYearlyComparisonData(selectedComparisonYear);
      const categories = ['ihasia', 'carabao', 'sueldos', 'ssi', 'crbt', 'facturado'];
      
      categories.forEach(catId => {
        const catLabel = catId === 'crbt' ? 'CRBT' : catId === 'ihasia' ? 'IHASIA' : catId.toUpperCase();
        const values = comparisonData.map(d => d[catId]);
        const total = values.reduce((a, b) => a + b, 0);
        csvContent += `${catLabel},${values.join(',')},${total}\n`;
      });
    } else {
      const grid = getGridData(activeMetric);
      csvContent = `Año,${months.join(',')},Total Anual\n`;
      availableYears.forEach(year => {
        const row = grid[year];
        const total = row.reduce((a, b) => a + b, 0);
        csvContent += `${year},${row.join(',')},${total}\n`;
      });
    }
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Estadisticas_${getMetricLabel(activeMetric).replace(/ /g, '_')}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-unfold">
      {/* Metrics Selector */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { id: 'facturado', label: 'Facturado', icon: BarChart3, logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg' },
          { id: 'carabao', label: 'Carabao', icon: Activity, logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png' },
          { id: 'ssi', label: 'SSI', icon: Waves, logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png' },
          { id: 'total_crbt', label: 'CRBT', icon: TrendingUp },
          { id: 'courses', label: 'Cursos', icon: ArrowUpRight },
          { id: 'comparativa', label: 'Comparativa', icon: LayoutGrid },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            style={activeMetric === m.id ? { ...getMetricStyle(m.id, 'bg'), ...getMetricStyle(m.id, 'border') } : {}}
            className={`relative group flex flex-col items-center justify-between gap-6 p-6 h-56 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
              activeMetric === m.id 
                ? 'shadow-[0_25px_60px_rgba(0,0,0,0.4)] scale-[1.02]' 
                : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10 hover:translate-y-[-4px]'
            }`}
          >
            <div className="flex-1 flex items-center justify-center w-full">
              {m.id === 'comparativa' ? (
                <ComparisonCollage active={activeMetric === m.id} />
              ) : m.logo ? (
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
      <div className="bg-surface-soft border border-surface-edge rounded-[2.5rem] py-4 shadow-2xl">
        <div className="flex items-center mb-2 px-8">
          {/* Left: Logos */}
          <div className="w-1/4 flex justify-start">
             {(() => {
                  if (activeMetric === 'comparativa') {
                    const compLogos = [
                      { id: 'ihasia', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg', color: '#ffffff', size: 'w-10 h-10' },
                      { id: 'carabao', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png', color: COMPARISON_COLORS.carabao, size: 'w-10 h-10' },
                      { id: 'ssi', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png', color: COMPARISON_COLORS.ssi, size: 'w-10 h-10' }
                    ];
                    return (
                      <div className="flex items-center gap-4">
                        {compLogos.map(l => (
                          <div 
                            key={l.id}
                            style={{
                              backgroundColor: l.color,
                              maskImage: `url(${l.src})`,
                              WebkitMaskImage: `url(${l.src})`,
                              maskSize: 'contain',
                              WebkitMaskSize: 'contain',
                              maskRepeat: 'no-repeat',
                              WebkitMaskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              WebkitMaskPosition: 'center'
                            }}
                            className={l.size}
                          />
                        ))}
                      </div>
                    );
                  }

                  const metricConfig = [
                    { id: 'facturado', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg' },
                    { id: 'carabao', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png' },
                    { id: 'ssi', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png' }
                  ].find(m => m.id === activeMetric);

                  if (metricConfig?.logo) {
                    return (
                      <div 
                        style={{
                          backgroundColor: getMetricStyle(activeMetric, 'text').color,
                          maskImage: `url(${metricConfig.logo})`,
                          WebkitMaskImage: `url(${metricConfig.logo})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center'
                        }}
                        className="w-10 h-10"
                      />
                    );
                  }
                  
                  return null;
                })()}
          </div>

          {/* Center: Title & Period */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-7 h-7" style={getMetricStyle(activeMetric, 'text')} />
              {activeMetric === 'comparativa' ? `Comparativa Anual ${selectedComparisonYear}` : `Evolución: ${getMetricLabel(activeMetric)}`}
            </h2>
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] translate-y-[3px]">
              {activeMetric === 'comparativa' 
                ? '(Categorías)' 
                : `(${chartYears[0]} - ${chartYears[chartYears.length-1]})`}
            </span>
          </div>

          {/* Right: Legend/Filters */}
          <div className="w-1/4 flex justify-end gap-4">
              {activeMetric === 'comparativa' ? (
                ['ihasia', 'carabao', 'sueldos', 'ssi', 'crbt', 'facturado'].map(catId => {
                  const isHidden = hiddenMetrics.includes(catId);
                  const color = COMPARISON_COLORS[catId];
                  const label = catId === 'crbt' ? 'CRBT' : catId === 'ihasia' ? 'IHASIA' : catId === 'sueldos' ? 'SUELDOS' : catId.toUpperCase();
                  return (
                    <button 
                      key={catId} 
                      className={`flex items-center gap-2 transition-all duration-300 ${isHidden ? 'opacity-30 grayscale' : 'opacity-100 hover:scale-105'}`}
                      onClick={() => toggleMetric(catId)}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
                    </button>
                  );
                })
              ) : (
                chartYears.map(year => {
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
                })
              )}
          </div>
        </div>

        <div className="h-[400px] w-full px-8">
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
              <Tooltip content={<CustomTooltip isComparison={activeMetric === 'comparativa'} />} />
              {activeMetric === 'comparativa' ? (
                <>
                  <Line type="monotone" dataKey="facturado" stroke={COMPARISON_COLORS.facturado} strokeWidth={3} dot={{ r: 4 }} name="Facturado" hide={hiddenMetrics.includes('facturado')} />
                  <Line type="monotone" dataKey="ihasia" stroke={COMPARISON_COLORS.ihasia} strokeWidth={4} dot={{ r: 5 }} name="IHASIA" hide={hiddenMetrics.includes('ihasia')} />
                  <Line type="monotone" dataKey="carabao" stroke={COMPARISON_COLORS.carabao} strokeWidth={3} dot={{ r: 4 }} name="Carabao" hide={hiddenMetrics.includes('carabao')} />
                  <Line type="monotone" dataKey="ssi" stroke={COMPARISON_COLORS.ssi} strokeWidth={3} dot={{ r: 4 }} name="SSI" hide={hiddenMetrics.includes('ssi')} />
                  <Line type="monotone" dataKey="crbt" stroke={COMPARISON_COLORS.crbt} strokeWidth={3} dot={{ r: 4 }} name="CRBT" hide={hiddenMetrics.includes('crbt')} />
                  <Line type="monotone" dataKey="sueldos" stroke={COMPARISON_COLORS.sueldos} strokeWidth={3} dot={{ r: 4 }} name="Sueldos" hide={hiddenMetrics.includes('sueldos')} />
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
                      connectNulls={true}
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

      {/* Monthly Grid Section */}
      <div className="bg-surface-soft border border-surface-edge rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col mt-4">
        <div className="py-2 px-8 border-b border-surface-edge flex items-center bg-white/2">
          {/* Left: Logos */}
          <div className="w-1/4 flex justify-start">
             {(() => {
                  if (activeMetric === 'comparativa') {
                    const compLogos = [
                      { id: 'ihasia', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg', color: '#ffffff', size: 'w-10 h-10' },
                      { id: 'carabao', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png', color: COMPARISON_COLORS.carabao, size: 'w-10 h-10' },
                      { id: 'ssi', src: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png', color: COMPARISON_COLORS.ssi, size: 'w-10 h-10' }
                    ];
                    return (
                      <div className="flex items-center gap-4">
                        {compLogos.map(l => (
                          <div 
                            key={l.id}
                            style={{
                              backgroundColor: l.color,
                              maskImage: `url(${l.src})`,
                              WebkitMaskImage: `url(${l.src})`,
                              maskSize: 'contain',
                              WebkitMaskSize: 'contain',
                              maskRepeat: 'no-repeat',
                              WebkitMaskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              WebkitMaskPosition: 'center'
                            }}
                            className={l.size}
                          />
                        ))}
                      </div>
                    );
                  }

                  const metricConfig = [
                    { id: 'facturado', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg' },
                    { id: 'carabao', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png' },
                    { id: 'ssi', logo: 'https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png' }
                  ].find(m => m.id === activeMetric);

                  if (metricConfig?.logo) {
                    return (
                      <div 
                        style={{
                          backgroundColor: getMetricStyle(activeMetric, 'text').color,
                          maskImage: `url(${metricConfig.logo})`,
                          WebkitMaskImage: `url(${metricConfig.logo})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center'
                        }}
                        className="w-10 h-10"
                      />
                    );
                  }
                  
                  return (
                    <FileSpreadsheet 
                      style={getMetricStyle(activeMetric, 'text')}
                      className="w-10 h-10" 
                    />
                  );
                })()}
          </div>

          {/* Center: Title */}
          <div className="flex-1 flex justify-center">
             <h3 className="text-xl font-black text-white tracking-tight uppercase">Tabla Comparativa Mensual</h3>
          </div>

          {/* Right: Controls */}
          <div className="w-1/4 flex items-center justify-end gap-4">
            {activeMetric === 'comparativa' && (
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20">
                <th className="px-6 py-3 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] w-32 min-w-[128px] border-r border-surface-edge/30 text-center leading-tight">
                  {activeMetric === 'comparativa' ? 'CATEGORÍA' : 'AÑO'}
                </th>
                {MONTH_NAMES.map(m => (
                  <th key={m} className="px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-widest text-center leading-tight">{m}</th>
                ))}
                <th 
                  style={getMetricStyle(activeMetric, 'text')}
                  className="px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-center border-l border-surface-edge/30 w-40 min-w-[160px] leading-tight"
                >
                  TOTAL
                </th>
                <th className="px-6 py-3 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] text-center border-l border-surface-edge/30 w-32 leading-tight">VAR. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/20">
              {activeMetric === 'comparativa' ? (
                (() => {
                  const categories = ['ihasia', 'carabao', 'sueldos', 'ssi', 'crbt', 'facturado'];
                  const comparisonData = getYearlyComparisonData(selectedComparisonYear);
                  
                  // Pre-calculate Facturado Total for this year
                  const facturadoRow = comparisonData.map(d => d.facturado);
                  const facturadoTotal = facturadoRow.reduce((a, b) => a + b, 0);

                  return categories.filter(catId => !hiddenMetrics.includes(catId)).map((catId) => {
                    const catLabel = catId === 'crbt' ? 'CRBT' : catId === 'ihasia' ? 'IHASIA' : catId === 'sueldos' ? 'SUELDOS' : catId.toUpperCase();
                    const catColor = COMPARISON_COLORS[catId];
                    const values = comparisonData.map(d => d[catId]);
                    const totalYear = values.reduce((a, b) => a + b, 0);
                    const weight = facturadoTotal > 0 ? (totalYear / facturadoTotal) * 100 : 0;

                    return (
                      <tr key={catId} className="hover:bg-white/5 transition-colors group relative">
                        <td className="px-6 py-4 border-r border-surface-edge/30 relative text-center leading-tight">
                          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: catColor }} />
                          <span className="text-xs font-black text-white uppercase tracking-wider relative z-10">{catLabel}</span>
                        </td>
                        {values.map((val, i) => (
                          <td key={i} className="px-2 py-3 text-center relative leading-tight">
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: catColor }} />
                            <span className={`relative z-10 text-[15px] font-black font-mono tracking-tighter ${val === 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                              {val > 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                            </span>
                          </td>
                        ))}
                        <td className="px-6 py-3 text-center border-l border-surface-edge/30 relative leading-tight" style={{ backgroundColor: `${catColor}15` }}>
                          <span className="relative z-10 text-lg font-black font-mono tracking-tighter" style={{ color: catColor }}>
                            {totalYear.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                availableYears.filter(year => !hiddenYears.includes(year)).map((year) => {
                  const idx = availableYears.indexOf(year);
                  const yearRow = currentMetricGrid[year];
                  const yearTotal = yearRow.reduce((a, b) => a + b, 0);
                  const yearStyle = getYearStyle(year);
                  const currentYear = new Date().getFullYear();
                  
                  const prevYear = availableYears[idx + 1];
                  let variation = null;
                  
                  if (prevYear) {
                    const prevYearRow = currentMetricGrid[prevYear];
                    if (year === currentYear) {
                      const currentMonthIndex = new Date().getMonth();
                      if (currentMonthIndex > 0) {
                        const ytdTotal = yearRow.slice(0, currentMonthIndex).reduce((a, b) => a + b, 0);
                        const prevYtdTotal = prevYearRow.slice(0, currentMonthIndex).reduce((a, b) => a + b, 0);
                        if (prevYtdTotal > 0) variation = ((ytdTotal - prevYtdTotal) / prevYtdTotal) * 100;
                      }
                    } else {
                      const prevTotal = prevYearRow.reduce((a, b) => a + b, 0);
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
    </div>
  );
}
