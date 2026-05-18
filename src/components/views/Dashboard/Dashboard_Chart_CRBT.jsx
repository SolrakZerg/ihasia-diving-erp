import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef } from 'react';

export default function Dashboard_Chart_CRBT({ incomeData }) {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ flex: '1 1 200px' }} 
      className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px] max-md:w-full md:max-w-[300px]"
    >
      <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-3 text-center">Saldos CR</h3>
      <div className="flex-1 flex flex-col items-center justify-center">
        {isReady ? (
          <ResponsiveContainer width="100%" height={180} minWidth={0}>
            <PieChart>
              <Pie data={incomeData.crData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                {incomeData.crData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-xs text-text-muted">Cargando...</span>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-surface-edge/30 flex-1 flex flex-col items-center justify-center">
        <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-3 text-center">Saldos BT</h3>
        {isReady ? (
          <ResponsiveContainer width="100%" height={180} minWidth={0}>
            <PieChart>
              <Pie data={incomeData.btData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                {incomeData.btData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-xs text-text-muted">Cargando...</span>
        )}
      </div>
    </div>
  );
}
