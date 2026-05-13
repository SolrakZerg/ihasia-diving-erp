import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-surface animate-in fade-in duration-700 overflow-hidden text-slate-300">
      <style>{noSpinnerStyle}</style>
      
      <CRBT_Header 
        month={month} 
        setMonth={setMonth} 
        year={year} 
        setYear={setYear} 
        months={months} 
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-2">
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar py-2">
            <div className="flex gap-6 justify-center items-start min-w-max h-full px-4">
              
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

        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="absolute top-4 right-0 z-50 p-2 bg-surface-edge border border-surface-edge text-white rounded-l-xl shadow-2xl hover:bg-brand transition-all duration-300"
        >
          {sidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
