import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const CustomBar3D = (props) => {
  const { x, y, width, height, fill, index, activeStaff } = props;
  if (!height || height < 0) return null;

  const depth = 6;
  const isHovered = activeStaff === index;
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

export default function Dashboard_Chart_Staff({ staffData }) {
  const [activeStaff, setActiveStaff] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const commonTooltip = <Tooltip content={<CustomTooltip />} cursor={false} />;

  if (!mounted) {
    return (
      <div className="bg-surface-soft border border-surface-edge rounded-2xl py-4 px-0 shadow-xl flex flex-col md:flex-[3] flex-none h-[280px] md:h-auto min-h-[240px] max-md:w-full md:max-w-[900px] items-center justify-center text-xs text-text-muted">
        Cargando gráfico...
      </div>
    );
  }

  return (
    <div className="bg-surface-soft border border-surface-edge rounded-2xl py-4 px-0 shadow-xl flex flex-col md:flex-[3] flex-none h-[280px] md:h-auto min-h-[240px] max-md:w-full md:max-w-[900px]">
       <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-2 text-center">Generado Staff</h3>
       <div className="w-full flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={staffData} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
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
                dataKey="totalEarned" 
                shape={<CustomBar3D activeStaff={activeStaff} />}
                onMouseEnter={(_, index) => setActiveStaff(index)}
                onMouseLeave={() => setActiveStaff(null)}
              >
                {staffData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(260, 80%, ${70 - (index * 5)}%)`} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
