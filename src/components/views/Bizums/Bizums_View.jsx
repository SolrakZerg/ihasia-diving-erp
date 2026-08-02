import { useState } from 'react';
import { CheckCircle2, CreditCard, Layers } from 'lucide-react';
import useBizumsData from './useBizumsData';
import Bizums_Header from './Bizums_Header';
import Bizums_Table from './Bizums_Table';
import Bizums_ActionsModal from './Bizums_ActionsModal';
import Bizums_EditModal from './Bizums_EditModal';
import ConfirmModal from '../../common/ConfirmModal';
import WisePayments_Table from './WisePayments_Table';

export default function Bizums_View() {
  const [subSection, setSubSection] = useState('reservas'); // 'reservas' or 'wise'
  
  const {
    // Data & Pagination
    bizums,
    loading,
    totalCount,
    totalPages,
    PAGE_SIZE,

    // Tabs
    activeTab,
    handleTabChange,

    // Search & Sort
    searchTerm,
    handleSearchChange,
    sortConfig,
    handleSort,

    // Pagination Nav
    currentPage,
    goToPage,
    getPageNumbers,

    // Handlers
    handleTogglePaid,
    handleToggleReturned,
    handleToggleRetained,
    handleToggleSettled,
    handleDelete,
    handleAdd,
    handleEdit,
    fetchBizums,

    // Edit Modal State
    editingBizum,
    isEditModalOpen,
    setIsEditModalOpen,

    // Actions Modal State
    actionsModalData,
    isActionsModalOpen,
    setIsActionsModalOpen,

    // Toast & Confirm
    showToast,
    toastMsg,
    confirmConfig,
    dismissConfirm,
  } = useBizumsData();

  return (
    <div className="customers-main-container h-auto md:h-full flex flex-col bg-surface md:overflow-hidden overflow-y-auto relative">
      {/* Subsección Selector Tabs - Centrado en pantalla */}
      <div className="flex border-b border-surface-edge bg-surface-soft/20 p-2 gap-2 justify-center">
        <button
          onClick={() => setSubSection('reservas')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            subSection === 'reservas'
              ? 'bg-brand text-white shadow-lg shadow-brand/20 border border-brand/30 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" />
          Reservas Bizum
        </button>
        <button
          onClick={() => setSubSection('wise')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            subSection === 'wise'
              ? 'bg-brand text-white shadow-lg shadow-brand/20 border border-brand/30 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Ingresos de Wise
        </button>
      </div>

      {subSection === 'reservas' ? (
        <div className="flex-1 md:overflow-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
          {/* Cabecera Bizum */}
          <Bizums_Header
            totalCount={totalCount}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onAddClick={handleAdd}
          />

          {/* Main Content Area */}
          <div className="flex-1 md:overflow-hidden pt-4 w-full transition-all duration-500 flex flex-col h-full min-h-0">
            <Bizums_Table
              bizums={bizums}
              loading={loading}
              activeTab={activeTab}
              totalCount={totalCount}
              currentPage={currentPage}
              totalPages={totalPages}
              PAGE_SIZE={PAGE_SIZE}
              sortConfig={sortConfig}
              onSort={handleSort}
              onTogglePaid={handleTogglePaid}
              onToggleReturned={handleToggleReturned}
              onToggleRetained={handleToggleRetained}
              onToggleSettled={handleToggleSettled}
              onEdit={handleEdit}
              onDelete={handleDelete}
              goToPage={goToPage}
              getPageNumbers={getPageNumbers}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 md:overflow-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
          {/* Cabecera Wise con la misma tarjeta y estructura que Bizum */}
          <WisePayments_Table />
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-8 z-[150] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/50">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-xs tracking-wide">{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmConfig.show}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={dismissConfirm}
      />

      {/* Actions Modal (al marcar como Pagado) */}
      <Bizums_ActionsModal
        data={actionsModalData}
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
      />

      {/* Edit Modal (al crear o editar) */}
      <Bizums_EditModal
        bizum={editingBizum}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={fetchBizums}
      />
    </div>
  );
}
