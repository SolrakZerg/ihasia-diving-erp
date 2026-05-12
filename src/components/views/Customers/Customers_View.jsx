import { CheckCircle2, Loader2 } from 'lucide-react';
import useCustomersData from './useCustomersData';
import Customers_Header from './Customers_Header';
import Customers_Table from './Customers_Table';
import Customers_ActionBar from './Customers_ActionBar';
import Customer_Details from './Customer_Details';
import Customer_Edit from './Customer_Edit';
import ConfirmModal from '../../common/ConfirmModal';

export default function Customers_View({ onNavigate }) {
  const {
    // Datos
    customers,
    loading,
    totalCount,
    totalPages,
    PAGE_SIZE,

    // Búsqueda
    searchTerm,
    handleSearchChange,
    isSearching,

    // Filtros
    isFilterOpen,
    setIsFilterOpen,
    activeDateFilter,
    showDuplicates,
    handleDateFilterChange,
    toggleDuplicates,

    // Ordenación
    sortConfig,
    handleSort,

    // Paginación
    currentPage,
    goToPage,
    getPageNumbers,

    // UI
    isExtendedView,
    setIsExtendedView,

    // Drawer de detalle
    selectedCustomer,
    isDrawerOpen,
    setIsDrawerOpen,
    handleRowClick,

    // Modal de edición
    editingCustomer,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEdit,

    // Selección múltiple
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,

    // Facturación
    isProcessingBilling,
    handleSendToBilling,

    // Toast
    showToast,
    toastMsg,

    // Confirmación de borrado
    confirmConfig,
    dismissConfirm,
    handleDelete,

    // Refresh
    fetchCustomers,
  } = useCustomersData();

  // ── Loading inicial (sin datos aún) ──────────────────────────────────────
  if (loading && customers.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-10 ${isExtendedView ? 'max-w-none' : 'max-w-7xl'} mx-auto w-full transition-all duration-500`}>

      {/* ── Cabecera ── */}
      <Customers_Header
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        isSearching={isSearching}
        isExtendedView={isExtendedView}
        setIsExtendedView={setIsExtendedView}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        activeDateFilter={activeDateFilter}
        showDuplicates={showDuplicates}
        handleDateFilterChange={handleDateFilterChange}
        toggleDuplicates={toggleDuplicates}
      />

      {/* ── Tabla + Paginación ── */}
      <Customers_Table
        customers={customers}
        loading={loading && !isSearching}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        PAGE_SIZE={PAGE_SIZE}
        sortConfig={sortConfig}
        handleSort={handleSort}
        isExtendedView={isExtendedView}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        toggleSelectOne={toggleSelectOne}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleRowClick={handleRowClick}
        goToPage={goToPage}
        getPageNumbers={getPageNumbers}
      />

      {/* ── Barra de acciones masivas ── */}
      <Customers_ActionBar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onSend={() => onNavigate('insurance', Array.from(selectedIds))}
        onBilling={handleSendToBilling}
        isProcessing={isProcessingBilling}
      />

      {/* ── Toast de confirmación ── */}
      {showToast && (
        <div className="fixed bottom-6 right-8 z-[150] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/50">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación de borrado ── */}
      <ConfirmModal
        show={confirmConfig.show}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={dismissConfirm}
      />

      {/* ── Drawer de detalle del cliente ── */}
      <Customer_Details
        customer={selectedCustomer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* ── Modal de edición del cliente ── */}
      <Customer_Edit
        customer={editingCustomer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => fetchCustomers()}
      />

    </div>
  );
}
