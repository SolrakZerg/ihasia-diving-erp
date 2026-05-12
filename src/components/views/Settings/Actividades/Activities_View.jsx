import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ConfirmModal from '../../../common/ConfirmModal';
import { useActivitiesData } from './useActivitiesData';
import Activities_Header from './Activities_Header';
import Activities_Table from './Activities_Table';
import Activities_AddForm from './Activities_AddForm';
import Activities_CategoryModal from './Activities_CategoryModal';

export default function Activities_View({ isNested = false }) {
  const data = useActivitiesData();

  if (data.loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (data.view === 'add') {
    return (
      <Activities_AddForm 
        setView={data.setView}
        saveActivity={data.saveActivity}
        saving={data.saving}
        formData={data.formData}
        setFormData={data.setFormData}
        categories={data.categories}
        colorPresets={data.colorPresets}
        payoutGroups={data.payoutGroups}
        handleThbChange={data.handleThbChange}
      />
    );
  }

  return (
    <div className={`${isNested ? 'p-0' : 'p-6 lg:p-10'} mx-auto w-full flex flex-col h-full overflow-hidden transition-all duration-500 max-w-7xl`}>
      {!isNested && (
        <Activities_Header 
          isEditingRate={data.isEditingRate}
          setIsEditingRate={data.setIsEditingRate}
          newRate={data.newRate}
          setNewRate={data.setNewRate}
          exchangeRate={data.exchangeRate}
          updateExchangeRate={data.updateExchangeRate}
          selectedIds={data.selectedIds}
          handleBulkDelete={data.handleBulkDelete}
          setShowCatModal={data.setShowCatModal}
          setView={data.setView}
        />
      )}

      <Activities_Table 
        isNested={isNested}
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        setShowCatModal={data.setShowCatModal}
        setView={data.setView}
        filteredAndSortedActivities={data.filteredAndSortedActivities}
        selectedIds={data.selectedIds}
        toggleSelectAll={data.toggleSelectAll}
        toggleSelectOne={data.toggleSelectOne}
        handleSort={data.handleSort}
        editingId={data.editingId}
        setEditingId={data.setEditingId}
        editData={data.editData}
        setEditData={data.setEditData}
        handleThbChange={data.handleThbChange}
        exchangeRate={data.exchangeRate}
        categories={data.categories}
        payoutGroups={data.payoutGroups}
        saveEdit={data.saveEdit}
        startEditing={data.startEditing}
        deleteActivity={data.deleteActivity}
        getCategoryColor={data.getCategoryColor}
      />

      <ConfirmModal
        show={data.confirmConfig.show}
        title={data.confirmConfig.title}
        message={data.confirmConfig.message}
        type={data.confirmConfig.type}
        onConfirm={data.confirmConfig.onConfirm}
        onCancel={() => data.setConfirmConfig(prev => ({ ...prev, show: false }))}
      />

      {data.showCatModal && (
        <Activities_CategoryModal 
          setShowCatModal={data.setShowCatModal}
          categories={data.categories}
          editingCat={data.editingCat}
          catForm={data.catForm}
          setCatForm={data.setCatForm}
          colorPresets={data.colorPresets}
          handleAddCategory={data.handleAddCategory}
          startEditingCat={data.startEditingCat}
          cancelEditingCat={data.cancelEditingCat}
          handleDeleteCategory={data.handleDeleteCategory}
        />
      )}

      {data.toast && (
        <div className="fixed bottom-6 right-8 z-[300] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
            data.toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/30 text-white' : 'bg-rose-500/90 border-rose-400/30 text-white'
          }`}>
            {data.toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-tight">{data.toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
