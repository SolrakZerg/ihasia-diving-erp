import React, { useState, useMemo, useEffect } from 'react';
import { useExpensesData } from './useExpensesData';
import Expenses_Header from './Expenses_Header';
import Expenses_Daily_Table from './Expenses_Daily_Table';
import Expenses_Commissions_Table from './Expenses_Commissions_Table';
import Expenses_Oxygen_Table from './Expenses_Oxygen_Table';
import Expenses_ConfigModal from './Expenses_ConfigModal';
import ConfirmModal from '../../common/ConfirmModal';
import Expenses_Sidebar from './Expenses_Sidebar';
import { AlertCircle, PlusCircle, ChevronLeft } from 'lucide-react';

const Expenses_View = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('expenses_sidebar_open');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('expenses_sidebar_open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);
  const {
    expenses,
    commissions,
    oxygenTours,
    promoters,
    staff,
    categories,
    loading,
    saving,
    monthlyTotal,
    commissionsPaid,
    commissionsPending,
    oxygenPending,
    oxygenTotal,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    dateFilter,
    setDateFilter,

    isAddingExpense,
    setIsAddingExpense,
    newDataExp,
    setNewDataExp,
    handleAddExpense,
    handleExpenseUpdate,
    handleDeleteExpense,
    updateItem,
    editingCommId,
    setEditingCommId,
    editCommVal,
    setEditCommVal,
    fetchData,
    // ¡Añadimos todo lo que estaba en el hook!
    showConfigModal,
    setShowConfigModal,
    configTab,
    setConfigTab,
    catForm,
    setCatForm,
    editingCat,
    setEditingCat,
    promoterForm,
    setPromoterForm,
    notification,
    confirmConfig,
    setConfirmConfig,
    colorPresets,
    showNotify,
    handleAddCategory,
    handleDeleteCategory,
    startEditingCat,
    cancelEditingCat,
    recipientOptions,
    pendingByRecipient
  } = useExpensesData();

  if (loading) {
    return <div className="h-full flex items-center justify-center text-white">Cargando datos...</div>;
  }

  return (
    <div className="expenses-main-container h-auto md:h-full flex flex-col bg-surface md:overflow-hidden overflow-y-auto relative">

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        show={confirmConfig.show}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
      />

      {/* HEADER */}
      <Expenses_Header 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        monthlyTotal={monthlyTotal}
        commissionsPaid={commissionsPaid}
        commissionsPending={commissionsPending}
        oxygenTotal={oxygenTotal}
        oxygenPending={oxygenPending}
        setShowConfigModal={setShowConfigModal}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-stretch md:overflow-y-auto xl:overflow-hidden relative">
        {/* MAIN CONTENT CONTAINER WITH SCROLL */}
        <div className="w-full flex-grow md:overflow-auto overflow-visible custom-scrollbar p-2 sm:p-6 lg:p-8">
          <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* TABLA DE GASTOS (COL-4) */}
            <div className="lg:col-span-4 flex flex-col lg:h-[calc(100vh-260px)]">
              <Expenses_Daily_Table 
                expenses={expenses}
                categories={categories}
                newDataExp={newDataExp}
                setNewDataExp={setNewDataExp}
                isAddingExpense={isAddingExpense}
                setIsAddingExpense={setIsAddingExpense}
                handleAddExpense={handleAddExpense}
                handleExpenseUpdate={handleExpenseUpdate}
                handleDeleteExpense={handleDeleteExpense}
                saving={saving}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                monthlyTotal={monthlyTotal}
                setConfirmConfig={setConfirmConfig}
                notification={notification}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>

            {/* COLUMNA DERECHA (COL-8) */}
            <div className="lg:col-span-8 flex flex-col lg:h-[calc(100vh-260px)] gap-6 max-w-[900px]">
              <Expenses_Commissions_Table 
                commissions={commissions}
                commissionsPaid={commissionsPaid}
                commissionsPending={commissionsPending}
                recipientOptions={recipientOptions}
                editingCommId={editingCommId}
                setEditingCommId={setEditingCommId}
                editCommVal={editCommVal}
                setEditCommVal={setEditCommVal}
                updateItem={updateItem}
              />

              <Expenses_Sidebar
                sidebarOpen={true}
                pendingByRecipient={pendingByRecipient}
                inline={true}
              />

              <Expenses_Oxygen_Table 
                oxygenTotal={oxygenTotal}
                oxygenPending={oxygenPending}
                oxygenTours={oxygenTours}
                updateItem={updateItem}
              />
            </div>

          </div>
        </div>

        <Expenses_Sidebar
          sidebarOpen={sidebarOpen}
          pendingByRecipient={pendingByRecipient}
          inline={false}
        />
      </div>

      {/* SIDEBAR TOGGLE - HIDDEN ON MOBILE */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden lg:flex fixed right-0 top-[180px] z-50 bg-brand-primary p-2 rounded-l-2xl shadow-2xl hover:bg-brand-primary/80 transition-all border-l border-y border-white/20 group"
      >
        <ChevronLeft className={`w-6 h-6 text-white transition-transform duration-500 ${sidebarOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* CONFIG MODAL */}
      <Expenses_ConfigModal 
        showConfigModal={showConfigModal}
        setShowConfigModal={setShowConfigModal}
        configTab={configTab}
        setConfigTab={setConfigTab}
        categories={categories}
        startEditingCat={startEditingCat}
        cancelEditingCat={cancelEditingCat}
        handleDeleteCategory={handleDeleteCategory}
        editingCat={editingCat}
        catForm={catForm}
        setCatForm={setCatForm}
        colorPresets={colorPresets}
        handleAddCategory={handleAddCategory}
        promoterForm={promoterForm}
        setPromoterForm={setPromoterForm}
        promoters={promoters}
        fetchData={fetchData}
        setConfirmConfig={setConfirmConfig}
      />

    </div>
  );
};

export default Expenses_View;
