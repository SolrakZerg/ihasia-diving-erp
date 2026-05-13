import { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

export default function Dashboard_Chart_Staff({ staffData }) {
  const [activeStaff, setActiveStaff] = useState(null);

  const commonTooltip = <Tooltip content={<CustomTooltip />} cursor={false} />;

  return (
    <div style={{ flex: '3 1 350px', maxWidth: '900px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col min-h-[240px]">
       <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Generado Staff</h3>
       <div className="w-full h-[180px]">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={staffData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
              {commonTooltip}
              <Bar dataKey="totalEarned" radius={[4, 4, 0, 0]}>
                {staffData.map((entry, index) => {
                  const isHovered = activeStaff === index;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      onMouseEnter={() => setActiveStaff(index)}
                      onMouseLeave={() => setActiveStaff(null)}
                      fill={`hsl(260, 80%, ${70 - (index * 5)}%)`} 
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
