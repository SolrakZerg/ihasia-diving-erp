import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import useCRBTData, { LOG_OPTIONS } from './useCRBTData';
import CRBT_Header from './CRBT_Header';
import CRBT_Matrix from './CRBT_Matrix';
import CRBT_DailyLog from './CRBT_DailyLog';
import CRBT_Sidebar from './CRBT_Sidebar';

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
`;

export default function CRBT_View() {
  const {
    month, setMonth,
    year, setYear,
    crForm, setCrForm,
    btForm, setBtForm,
    dailyLog,
    loading,
    sidebarOpen, setSidebarOpen,
    manualAdj,
    assists,
    advances,
    prevMonthBalance,
    initialBote,
    boteStats,
    months,
    fixedColumns,
    dynamicActivities,
    matrixData,
    stats,
    diffDays,
    totalComm,
    totalAssists,
    totalAdj,
    updateAssist,
    updateAdjustment,
    updateLog,
    addAdvance,
    deleteAdvance,
    saveInlineEdit
  } = useCRBTData();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-fit xl:h-full bg-surface animate-in fade-in duration-700 overflow-y-auto xl:overflow-hidden text-slate-300 pb-10 xl:pb-0">
      <style>{noSpinnerStyle}</style>

      <CRBT_Header
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        months={months}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-stretch overflow-y-auto xl:overflow-hidden relative">
        <div className="w-full flex flex-col p-2 lg:py-2 lg:px-8 overflow-hidden">
          <div className="overflow-x-auto xl:overflow-y-auto custom-scrollbar">
            <div className="flex flex-col xl:flex-row gap-6 justify-start xl:justify-center items-center xl:items-start w-full h-fit xl:h-full px-2 py-0">

              <CRBT_Matrix
                fixedColumns={fixedColumns}
                dynamicActivities={dynamicActivities}
                matrixData={matrixData}
                assists={assists}
                manualAdj={manualAdj}
                updateAssist={updateAssist}
                updateAdjustment={updateAdjustment}
                totalAdj={totalAdj}
                totalComm={totalComm}
                totalAssists={totalAssists}
              />

              <CRBT_DailyLog
                year={year}
                month={month}
                dailyLog={dailyLog}
                updateLog={updateLog}
                stats={stats}
                LOG_OPTIONS={LOG_OPTIONS}
              />

            </div>
          </div>
        </div>

        {/* SIDEBAR TOGGLE - HIDDEN ON MOBILE */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex fixed right-0 top-[85px] z-50 bg-brand-primary p-2 rounded-l-2xl shadow-2xl hover:bg-brand-primary/80 transition-all border-l border-y border-white/20 group"
        >
          <ChevronLeft className={`w-6 h-6 text-white transition-transform duration-500 ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        <CRBT_Sidebar
          sidebarOpen={sidebarOpen}
          stats={stats}
          prevMonthBalance={prevMonthBalance}
          diffDays={diffDays}
          advances={advances}
          crForm={crForm}
          setCrForm={setCrForm}
          btForm={btForm}
          setBtForm={setBtForm}
          addAdvance={addAdvance}
          deleteAdvance={deleteAdvance}
          saveInlineEdit={saveInlineEdit}
          initialBote={initialBote}
          boteStats={boteStats}
          months={months}
          month={month}
        />
      </div>

    </div>
  );
}
