import React, { useState, useMemo } from 'react';
import { useExpensesData } from './useExpensesData';
import Expenses_Header from './Expenses_Header';
import Expenses_Daily_Table from './Expenses_Daily_Table';
import Expenses_Commissions_Table from './Expenses_Commissions_Table';
import Expenses_Oxygen_Table from './Expenses_Oxygen_Table';
import Expenses_ConfigModal from './Expenses_ConfigModal';
import { AlertCircle, PlusCircle } from 'lucide-react';

const Expenses_View = () => {
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
    selectedYear,
    dateFilter,
    setDateFilter,
    handlePrevMonth,
    handleNextMonth,
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
    <div className="h-full flex flex-col bg-surface md:overflow-hidden overflow-auto relative">

      {/* CONFIRMATION MODAL */}
      {confirmConfig.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-soft border border-surface-edge w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${confirmConfig.type === 'danger' ? 'bg-danger/10 text-danger' : 'bg-brand/10 text-brand'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">{confirmConfig.title}</h3>
              </div>
              <p className="text-text-header/60 font-bold ml-16">{confirmConfig.message}</p>
            </div>
            <div className="bg-surface-edge/20 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}
                className="px-4 py-2 rounded-xl text-sm font-black text-text-header hover:text-white hover:bg-surface-edge/30 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (confirmConfig.onConfirm) confirmConfig.onConfirm();
                }}
                className={`px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg transition-all ${
                  confirmConfig.type === 'danger' ? 'bg-danger hover:bg-danger/80 shadow-danger/20' : 'bg-brand hover:bg-brand-light shadow-brand/20'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <Expenses_Header 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        monthlyTotal={monthlyTotal}
        commissionsPaid={commissionsPaid}
        commissionsPending={commissionsPending}
        oxygenTotal={oxygenTotal}
        oxygenPending={oxygenPending}
        setShowConfigModal={setShowConfigModal}
        pendingByRecipient={pendingByRecipient}
      />

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 md:overflow-auto overflow-visible custom-scrollbar p-5">
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

            <Expenses_Oxygen_Table 
              oxygenTotal={oxygenTotal}
              oxygenPending={oxygenPending}
              oxygenTours={oxygenTours}
              updateItem={updateItem}
            />
          </div>

        </div>
      </div>

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
