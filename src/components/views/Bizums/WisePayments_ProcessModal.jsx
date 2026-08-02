import { 
  X, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import useWiseProcessModal from './useWiseProcessModal';
import WisePayments_ProcessForm from './WisePayments_ProcessForm';

export default function WisePayments_ProcessModal({ payment, isOpen, onClose, onProcessedSuccess }) {
  const {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    activity,
    setActivity,
    phone,
    setPhone,
    isEnglish,
    setIsEnglish,
    isMultipleActivities,
    setIsMultipleActivities,
    paxActivities,
    handlePaxActivityChange,
    handleManualPasteClipboard,
    generateWhatsappMessageText,
    loadingCalendar,
    eventLink,
    calendarError,
    completedList,
    isDoneView,
    handleAllActions,
    handleWhatsappOnly,
    handleCalendarOnly
  } = useWiseProcessModal({ payment, isOpen, onClose, onProcessedSuccess });

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header del Modal */}
        <div className="p-5 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">Procesar Reserva Wise</h2>
              <p className="text-sm text-gray-400 font-bold">Addtocalendar v5.1</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all cursor-pointer"
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
            phone={phone}
            onChangePhone={setPhone}
            onPasteClipboard={handleManualPasteClipboard}
            activity={activity}
            onChangeActivity={setActivity}
            isEnglish={isEnglish}
            onChangeIsEnglish={setIsEnglish}
            isMultipleActivities={isMultipleActivities}
            onToggleMultipleActivities={() => setIsMultipleActivities(!isMultipleActivities)}
            paxActivities={paxActivities}
            onPaxActivityChange={handlePaxActivityChange}
            previewMessage={generateWhatsappMessageText()}
            calendarError={calendarError}
            loadingCalendar={loadingCalendar}
            onAllActions={handleAllActions}
            onWhatsappOnly={handleWhatsappOnly}
            onCalendarOnly={handleCalendarOnly}
          />
        ) : (
          /* Vista de Éxito Limpia con Enlace Directo a Calendar */
          <div className="p-6 sm:p-7 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400">Acciones Completadas:</h4>
            <ul className="space-y-3.5 text-sm text-gray-100 font-medium">
              {completedList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
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
