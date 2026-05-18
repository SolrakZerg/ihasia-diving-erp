import React, { useState, useMemo } from 'react';
import { useExpensesData } from './useExpensesData';
import Expenses_Header from './Expenses_Header';
import Expenses_Daily_Table from './Expenses_Daily_Table';
import Expenses_Commissions_Table from './Expenses_Commissions_Table';
import Expenses_Oxygen_Table from './Expenses_Oxygen_Table';
import Expenses_ConfigModal from './Expenses_ConfigModal';
import ConfirmModal from '../../common/ConfirmModal';
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
