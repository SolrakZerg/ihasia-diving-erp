import { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
      <div className="bg-[#1a1c2d] border border-surface-edge p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[120px]">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
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

export default function Dashboard_Chart_Gastos({ expenseData, monthlyReport, incomeData }) {
  const [activeExpense, setActiveExpense] = useState(null);

  const commonTooltip = <Tooltip content={<CustomTooltip />} cursor={false} />;

  const chartData = [
    { name: 'CRBT', value: (monthlyReport?.partner_split || 0) * 2, isProfit: true },
    ...expenseData
  ].map(item => ({ 
    ...item, 
    perc: incomeData.total > 0 ? ((item.value / incomeData.total) * 100).toFixed(1) : 0 
  }));

  return (
    <div style={{ flex: '3 1 450px', maxWidth: '900px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col min-h-[240px]">
       <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Gastos</h3>
       <div className="w-full h-[180px]">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
              {commonTooltip}
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => {
                  const isHovered = activeExpense === index;
                  const fillCol = entry.isProfit ? '#10b981' : tailwindToHex(entry.color);
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      onMouseEnter={() => setActiveExpense(index)}
                      onMouseLeave={() => setActiveExpense(null)}
                      fill={fillCol} 
                      fillOpacity={isHovered ? 1 : 0.6}
                      stroke={isHovered ? 'white' : 'transparent'}
                      strokeWidth={isHovered ? 1 : 0}
                      className="transition-all duration-300 cursor-pointer" 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
