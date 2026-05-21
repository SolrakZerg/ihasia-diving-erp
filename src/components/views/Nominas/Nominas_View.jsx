import React from 'react';
import { useNominasData } from './useNominasData';
import Nominas_Header from './Nominas_Header';
import Nominas_Table from './Nominas_Table';
import Nominas_Sidebar from './Nominas_Sidebar';
import Nominas_AdjModal from './Nominas_AdjModal';

export default function Nominas_View() {
  const {
    selectedStaffId, setSelectedStaffId,
    month, setMonth,
    year, setYear,
    staff, activeStaffIds,
    loading, syncing,
    adjModal, setAdjModal,
    manualAdj, assists, advances,
    fixedColumns, dynamicActivities, matrixData, attendanceData,
    totalComm, totalAssists, totalAdj, totalAdvances, finalBalance,
    selectedMember,
    
    handleAdjUpdate, handleAssChange, handleAttendanceToggle, addAdvance, removeAdvance, updateAdvance
  } = useNominasData();

  return (
    <div className="h-full flex flex-col bg-surface lg:overflow-hidden overflow-auto relative animate-in fade-in duration-700">
      <Nominas_Header 
        month={month} setMonth={setMonth}
        year={year} setYear={setYear}
        selectedMember={selectedMember}
        staff={staff} activeStaffIds={activeStaffIds}
        selectedStaffId={selectedStaffId} setSelectedStaffId={setSelectedStaffId}
      />

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-visible gap-6 p-2 sm:p-6 lg:p-8">
        <Nominas_Table 
          matrixData={matrixData}
          fixedColumns={fixedColumns}
          dynamicActivities={dynamicActivities}
          attendanceData={attendanceData}
          assists={assists}
          handleAssChange={handleAssChange}
          setAdjModal={setAdjModal}
          manualAdj={manualAdj}
          handleAttendanceToggle={handleAttendanceToggle}
          totalComm={totalComm}
          totalAssists={totalAssists}
          totalAdj={totalAdj}
        />

        <Nominas_Sidebar 
          finalBalance={finalBalance}
          attendanceData={attendanceData}
          assists={assists}
          syncing={syncing}
          totalComm={totalComm}
          totalAdj={totalAdj}
          totalAssists={totalAssists}
          totalAdvances={totalAdvances}
          advances={advances}
          addAdvance={addAdvance}
          removeAdvance={removeAdvance}
          updateAdvance={updateAdvance}
        />
      </div>

      <Nominas_AdjModal 
        adjModal={adjModal}
        setAdjModal={setAdjModal}
        handleAdjUpdate={handleAdjUpdate}
        month={month}
        year={year}
      />
    </div>
  );
}
