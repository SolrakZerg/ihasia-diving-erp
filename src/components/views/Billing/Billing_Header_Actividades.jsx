import { Target } from 'lucide-react';

// Sub-componente interno: fila de estadística con label y valor
const StatItem = ({ label, value, color = "text-white", noBorder = false, first = false }) => (
  <div className={`flex items-center justify-between gap-0.5 ${first ? 'pb-0.5 pt-0' : 'py-0.5'} w-full ${noBorder ? '' : 'border-b border-white/[0.04]'}`}>
    <span className={`text-[12px] font-bold tracking-tighter truncate ${value === 0 ? 'text-gray-400/60' : 'text-text-muted'}`}>{label}</span>
    <span className={`text-[12px] font-black tabular-nums transition-colors ${value === 0 ? 'text-text-muted' : color}`}>{value}</span>
  </div>
);

export default function Billing_Header_Actividades({
  activities = [],
  activityStats,
  monthlyDbData,
}) {
  return (
    <div className="flex-none w-[250px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-2xl overflow-hidden shrink-0">
      <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
        <span className="flex items-center gap-1.5 text-brand text-xs font-bold">
          <Target className="w-3.5 h-3.5" /> Actividades
        </span>
      </div>

      <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 p-1.5 pb-1 overflow-y-auto">

        {/* COLUMNA 1: CURSOS */}
        <div className="pr-2 flex flex-col">
          <div className="flex flex-col gap-0">
            {activities
              .filter(a => a.widget_column === 1 && (activityStats[a.acronym] > 0))
              .sort((a, b) => (a.widget_order || 0) - (b.widget_order || 0))
              .map((act, idx, arr) => (
                <StatItem
                  key={act.id}
                  label={act.acronym || act.name}
                  value={activityStats[act.acronym] || 0}
                  first={idx === 0}
                  noBorder={idx === arr.length - 1}
                />
              ))}
          </div>
        </div>

        {/* COLUMNA 2: TANQUES */}
        <div className="px-2 flex flex-col">
          <div className="flex flex-col gap-0">
            {activities
              .filter(a => a.widget_column === 2 && (activityStats[a.acronym] > 0))
              .sort((a, b) => (a.widget_order || 0) - (b.widget_order || 0))
              .map((act, idx, arr) => (
                <StatItem
                  key={act.id}
                  label={act.acronym || act.name}
                  value={activityStats[act.acronym] || 0}
                  first={idx === 0}
                  noBorder={idx === arr.length - 1}
                />
              ))}
          </div>
        </div>

        {/* COLUMNA 3: ESPECIALIDADES */}
        <div className="pl-2 flex flex-col">
          <div className="flex flex-col gap-0">
            {activities
              .filter(a => a.widget_column === 3 && (
                (activityStats[a.acronym] > 0) ||
                (a.acronym === 'CAN' && (Number(activityStats.CAN || 0) + Number(activityStats.CAN2 || 0)) > 0)
              ))
              .sort((a, b) => (a.widget_order || 0) - (b.widget_order || 0))
              .map((act, idx, arr) => {
                const isCancel = (act.acronym || '').toLowerCase().startsWith('can');
                const val = isCancel
                  ? (Number(activityStats.CAN || 0) + Number(activityStats.CAN2 || 0))
                  : (activityStats[act.acronym] || 0);

                return (
                  <StatItem
                    key={act.id}
                    label={isCancel ? 'CANCEL' : (act.acronym || act.name)}
                    value={val}
                    first={idx === 0}
                    color={isCancel ? "text-red-400" : undefined}
                    noBorder={idx === arr.length - 1}
                  />
                );
              })}
          </div>
        </div>

      </div>

      {/* Pie unificado con los totales por columna */}
      <div className="grid grid-cols-3 divide-x divide-white/10 bg-surface border-t border-surface-edge/30 py-2 px-1.5 shrink-0">
        <div className="pr-2 flex justify-between items-center">
          <span className="text-[9px] font-black text-brand-light uppercase">CURSOS</span>
          <span className="text-[14px] font-black text-white">{monthlyDbData?.total_courses || 0}</span>
        </div>
        <div className="px-2 flex justify-between items-center">
          <span className="text-[9px] font-black text-brand-light uppercase">TANKS</span>
          <span className="text-[14px] font-black text-white">{monthlyDbData?.total_tanks || 0}</span>
        </div>
        <div className="pl-2 flex justify-between items-center">
          <span className="text-[9px] font-black text-brand-light uppercase">ESPEC</span>
          <span className="text-[14px] font-black text-white">{monthlyDbData?.total_spec || 0}</span>
        </div>
      </div>
    </div>
  );
}
