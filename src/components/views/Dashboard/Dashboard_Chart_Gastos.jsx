import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const tailwindToHex = (twClass) => {
  if (!twClass) return '#94a3b8';
  if (twClass.includes('blue-400')) return '#60a5fa';
  if (twClass.includes('rose-400')) return '#fb7185';
  if (twClass.includes('white')) return '#ffffff';
  if (twClass.includes('violet-300')) return '#c4b5fd';
  if (twClass.includes('orange-400')) return '#fb923c';
  if (twClass.includes('amber-400')) return '#fbbf24';
  if (twClass.includes('emerald-400')) return '#34d399';
  if (twClass.includes('fuchsia-400')) return '#e879f9';
  if (twClass.includes('purple-400')) return '#c084fc';

  if (twClass.includes('#00A3FF')) return '#00A3FF';
  if (twClass.includes('#a855f7')) return '#a855f7';
  if (twClass.includes('#f97316')) return '#f97316';
  if (twClass.includes('#d946ef')) return '#d946ef';
  if (twClass.includes('#ec4899')) return '#ec4899';
  if (twClass.includes('#eab308')) return '#eab308';
  return '#94a3b8';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/95 border border-surface-edge p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[120px]">
        <p className="text-[10px] font-black text-text-header uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xl font-black text-white font-mono tracking-tighter">
          {Math.round(payload[0].value).toLocaleString()} <span className="text-xs opacity-50 ml-0.5">฿</span>
        </p>
        {payload[0].payload.perc && (
          <p className="text-[12px] font-black text-emerald-400/80 font-mono tracking-widest mt-1">
            {payload[0].payload.perc}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomBar3D = (props) => {
  const { x, y, width, height, fill, payload, index, activeExpense } = props;
  if (!height || height < 0) return null;

  const depth = 6;
  const isHovered = activeExpense === index;
  const opacity = isHovered ? 1 : 0.7;

  return (
    <g className="transition-all duration-300 cursor-pointer">
      {/* Cara lateral (Derecha) - Más oscura */}
      <path
        d={`M ${x + width} ${y} L ${x + width + depth} ${y - depth} L ${x + width + depth} ${y + height - depth} L ${x + width} ${y + height} Z`}
        fill={fill}
        style={{ filter: 'brightness(0.6)' }}
        fillOpacity={opacity}
      />
      {/* Cara superior - Más clara */}
      <path
        d={`M ${x} ${y} L ${x + depth} ${y - depth} L ${x + width + depth} ${y - depth} L ${x + width} ${y} Z`}
        fill={fill}
        style={{ filter: 'brightness(1.3)' }}
        fillOpacity={opacity}
      />
      {/* Cara frontal */}
      <rect 
        x={x} y={y} width={width} height={height} 
        fill={fill} 
        fillOpacity={opacity}
        stroke={isHovered ? 'rgba(255,255,255,0.3)' : 'transparent'}
        strokeWidth={1}
      />
    </g>
  );
};

export default function Dashboard_Chart_Gastos({ expenseData, monthlyReport, incomeData }) {
  const [activeExpense, setActiveExpense] = useState(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const commonTooltip = <Tooltip content={<CustomTooltip />} cursor={false} />;

  const chartData = [
    { name: 'CRBT', value: (monthlyReport?.partner_split || 0) * 2, isProfit: true, color: '#10b981' },
    ...expenseData
  ].map(item => ({ 
    ...item, 
    perc: incomeData.total > 0 ? ((item.value / incomeData.total) * 100).toFixed(1) : 0 
  })).filter(item => item.value > 0);

  return (
    <div className="bg-surface-soft border border-surface-edge rounded-2xl py-4 px-0 shadow-xl flex flex-col md:flex-[3] flex-none h-auto min-h-[240px] max-md:w-full md:max-w-[900px]">
       <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-2 text-center">Gastos</h3>
        <div ref={containerRef} className="w-full h-[180px] flex items-center justify-center">
          {isReady ? (
            <ResponsiveContainer width="100%" height={180} minWidth={0}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                <CartesianGrid 
                  vertical={false} 
                  strokeDasharray="3 3" 
                  stroke="var(--color-surface-edge)"
                  strokeOpacity={0.1}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={35}
                  tick={{fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 800}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700}}
                  tickFormatter={(value) => value.toLocaleString('es-ES')}
                  width={50}
                />
                {commonTooltip}
                <Bar 
                  dataKey="value" 
                  shape={<CustomBar3D activeExpense={activeExpense} />}
                  onMouseEnter={(_, index) => setActiveExpense(index)}
                  onMouseLeave={() => setActiveExpense(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isProfit ? '#10b981' : tailwindToHex(entry.color)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-xs text-text-muted">Cargando gráfico...</span>
          )}
       </div>
    </div>
  );
}
