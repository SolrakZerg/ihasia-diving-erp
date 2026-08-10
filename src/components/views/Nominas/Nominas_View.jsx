import React, { useState } from 'react';
import { useNominasData } from './useNominasData';
import Nominas_Header from './Nominas_Header';
import Nominas_Table from './Nominas_Table';
import Nominas_Sidebar from './Nominas_Sidebar';
import Nominas_AdjModal from './Nominas_AdjModal';
import Nominas_EmailModal from './Nominas_EmailModal';
import {
  downloadInstructorPDF,
  previewInstructorPDF,
  downloadAllInstructorsPDF,
  previewAllInstructorsPDF,
  downloadIndividualPDFs
} from './generateNominasPDF';

export default function Nominas_View() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);

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
    getPayrollDataForStaff,
    
    handleAdjUpdate, handleAssChange, handleAttendanceToggle, addAdvance, removeAdvance, updateAdvance
  } = useNominasData();

  const handleDownloadPDF = () => {
    if (selectedStaffId === 'TODOS') {
      const activeMembersData = staff
        .filter(s => activeStaffIds.has(s.id))
        .map(member => getPayrollDataForStaff(member.id))
        .filter(Boolean);
      downloadAllInstructorsPDF(activeMembersData, month, year);
    } else {
      const currentPayrollData = {
        selectedMember,
        month,
        year,
        matrixData,
        fixedColumns,
        dynamicActivities,
        assists,
        manualAdj,
        advances,
        totalComm,
        totalAssists,
        totalAdj,
        totalAdvances,
        finalBalance
      };
      downloadInstructorPDF(currentPayrollData);
    }
  };

  const handleDownloadIndividualPDFs = () => {
    const activeMembersData = staff
      .filter(s => activeStaffIds.has(s.id))
      .map(member => getPayrollDataForStaff(member.id))
      .filter(Boolean);
    downloadIndividualPDFs(activeMembersData);
  };

  const handlePreviewPDF = () => {
    if (selectedStaffId === 'TODOS') {
      const activeMembersData = staff
        .filter(s => activeStaffIds.has(s.id))
        .map(member => getPayrollDataForStaff(member.id))
        .filter(Boolean);
      previewAllInstructorsPDF(activeMembersData);
    } else {
      const currentPayrollData = {
        selectedMember,
        month,
        year,
        matrixData,
        fixedColumns,
        dynamicActivities,
        assists,
        manualAdj,
        advances,
        totalComm,
        totalAssists,
        totalAdj,
        totalAdvances,
        finalBalance
      };
      previewInstructorPDF(currentPayrollData);
    }
  };

  const currentPayrollData = {
    selectedMember,
    month,
    year,
    matrixData,
    fixedColumns,
    dynamicActivities,
    assists,
    manualAdj,
    advances,
    totalComm,
    totalAssists,
    totalAdj,
    totalAdvances,
    finalBalance
  };

  return (
    <div className="nominas-main-container h-auto md:h-full flex flex-col bg-surface md:overflow-hidden overflow-y-auto relative animate-in fade-in duration-700">
      <Nominas_Header 
        month={month} setMonth={setMonth}
        year={year} setYear={setYear}
        selectedMember={selectedMember}
        staff={staff} activeStaffIds={activeStaffIds}
        selectedStaffId={selectedStaffId} setSelectedStaffId={setSelectedStaffId}
        onDownloadPDF={handleDownloadPDF}
        onDownloadIndividualPDFs={handleDownloadIndividualPDFs}
        onPreviewPDF={handlePreviewPDF}
        onOpenEmailModal={() => setEmailModalOpen(true)}
      />

      {selectedStaffId === 'TODOS' ? (
        activeStaffIds.size === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
            <p className="text-lg font-bold">No hay actividad de instructores registrada para este mes.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto flex flex-row gap-6 p-2 sm:p-4 lg:p-6 items-start custom-scrollbar">
            {staff.filter(s => activeStaffIds.has(s.id)).map(member => {
              const data = getPayrollDataForStaff(member.id);
              if (!data) return null;
              const tableWidth = 690 + (data.dynamicActivities.length * 35);
              return (
                <div 
                  key={member.id} 
                  style={{ width: `${tableWidth}px` }}
                  className="flex-none max-w-[90%]"
                >
                  <Nominas_Table 
                    matrixData={data.matrixData}
                    fixedColumns={fixedColumns}
                    dynamicActivities={data.dynamicActivities}
                    attendanceData={data.attendanceData}
                    assists={data.assists}
                    handleAssChange={() => {}}
                    setAdjModal={() => {}}
                    manualAdj={data.manualAdj}
                    handleAttendanceToggle={() => {}}
                    totalComm={data.totalComm}
                    totalAssists={data.totalAssists}
                    totalAdj={data.totalAdj}
                    readOnly={true}
                    headerTitle={member.initials}
                  />
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row md:overflow-hidden overflow-visible gap-6 lg:gap-2 xl:gap-6 p-2 sm:p-4 lg:py-4 lg:px-6 lg:pr-0">
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
      )}

      <Nominas_AdjModal 
        adjModal={adjModal}
        setAdjModal={setAdjModal}
        handleAdjUpdate={handleAdjUpdate}
        month={month}
        year={year}
      />

      <Nominas_EmailModal 
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        payrollData={currentPayrollData}
        month={month}
        year={year}
        selectedStaffId={selectedStaffId}
        staff={staff}
        activeStaffIds={activeStaffIds}
        getPayrollDataForStaff={getPayrollDataForStaff}
      />
    </div>
  );
}
