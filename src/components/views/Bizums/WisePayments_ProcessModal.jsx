import { 
  X, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Pencil
} from 'lucide-react';
import useWiseProcessModal from './useWiseProcessModal';
import WisePayments_ProcessForm from './WisePayments_ProcessForm';

export default function WisePayments_ProcessModal({ 
  payment, 
  isOpen, 
  onClose, 
  onProcessedSuccess,
  isEditMode = false 
}) {
  const {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    clientName,
    setClientName,
    activity,
    setActivity,
    phone,
    setPhone,
    isEnglish,
    setIsEnglish,
    isMultipleActivities,
    setIsMultipleActivities,
    handleToggleMultipleActivities,
    activityLines,
    handleAddLine,
    handleRemoveLine,
    handleLineChange,
    totalAssignedPax,
    isPaxCountValid,
    handleManualPasteClipboard,
    generateWhatsappMessageText,
    combinedActivitiesText,
    activityAcronymText,
    loadingCalendar,
    eventLink,
    calendarError,
    completedList,
    isDoneView,
    handleAllActions,
    handleWhatsappOnly,
    handleCalendarOnly,
    notes,
    setNotes,
    isProcessed,
    setIsProcessed,
    isRetained,
    setIsRetained,
    retainedPeople,
    setRetainedPeople,
    isSettled,
    setIsSettled,
    savingEdit,
    handleSaveEdit
  } = useWiseProcessModal({ payment, isOpen, onClose, onProcessedSuccess });

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[96vh] flex flex-col">
        
        {/* Header del Modal */}
        <div className="p-4 sm:p-5 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isEditMode 
                ? 'bg-brand/20 text-brand border-brand/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isEditMode ? <Pencil className="w-5 h-5" /> : <CheckCircle2 className="w-5.5 h-5.5" />}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isEditMode ? 'Editar Pago de Wise' : 'Procesar Reserva Wise'}
              </h2>
              {isEditMode && (
                <p className="text-xs text-gray-400 font-mono">
                  ID: #{payment.id}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isDoneView ? (
          <WisePayments_ProcessForm
            payment={payment}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            currentMonth={currentMonth}
            onChangeMonth={setCurrentMonth}
            clientName={clientName}
            onChangeClientName={setClientName}
            phone={phone}
            onChangePhone={setPhone}
            onPasteClipboard={handleManualPasteClipboard}
            activity={activity}
            onChangeActivity={setActivity}
            isEnglish={isEnglish}
            onChangeIsEnglish={setIsEnglish}
            isMultipleActivities={isMultipleActivities}
            onToggleMultipleActivities={handleToggleMultipleActivities}
            activityLines={activityLines}
            onAddLine={handleAddLine}
            onRemoveLine={handleRemoveLine}
            onLineChange={handleLineChange}
            totalAssignedPax={totalAssignedPax}
            isPaxCountValid={isPaxCountValid}
            previewMessage={generateWhatsappMessageText()}
            calendarError={calendarError}
            loadingCalendar={loadingCalendar}
            onAllActions={handleAllActions}
            onWhatsappOnly={handleWhatsappOnly}
            onCalendarOnly={handleCalendarOnly}
            notes={notes}
            onChangeNotes={setNotes}
            isEditMode={isEditMode}
            combinedActivitiesText={combinedActivitiesText}
            activityAcronymText={activityAcronymText}
            isProcessed={isProcessed}
            onChangeIsProcessed={setIsProcessed}
            isRetained={isRetained}
            onChangeIsRetained={setIsRetained}
            retainedPeople={retainedPeople}
            onChangeRetainedPeople={setRetainedPeople}
            isSettled={isSettled}
            onChangeIsSettled={setIsSettled}
            savingEdit={savingEdit}
            onSaveEdit={handleSaveEdit}
          />
        ) : (
          /* Vista de Éxito Limpia con Enlace Directo a Calendar */
          <div className="p-6 sm:p-7 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400">Resumen de Acciones:</h4>
            <ul className="space-y-3.5 text-sm font-medium">
              {completedList.map((item, idx) => {
                const isError = typeof item === 'object' ? item.type === 'error' : (item.includes('No se abrió') || item.includes('Error'));
                const itemText = typeof item === 'object' ? item.text : item;

                return (
                  <li key={idx} className="flex items-start gap-3">
                    {isError ? (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <span className={`leading-tight ${isError ? 'text-rose-300 font-bold' : 'text-gray-100'}`}>
                      {itemText}
                    </span>
                  </li>
                );
              })}
            </ul>

            {eventLink ? (
              <a
                href={eventLink}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="w-full py-4 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/20 cursor-pointer mt-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Ver el evento en Calendar</span>
              </a>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3.5 px-5 rounded-2xl bg-surface-soft hover:bg-surface-edge text-white font-bold text-sm transition-all cursor-pointer mt-2"
              >
                Cerrar
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
