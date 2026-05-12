import { AlertCircle } from 'lucide-react';

/**
 * ConfirmModal — Modal de confirmación compartido.
 *
 * Props:
 *  - show       {boolean}   Si el modal está visible.
 *  - title      {string}    Título del modal.
 *  - message    {string}    Mensaje / descripción de la acción a confirmar.
 *  - type       {string}    'danger' | 'info'  — controla el color del icono y el botón de confirmar.
 *  - onConfirm  {function}  Callback al pulsar "Confirmar".
 *  - onCancel   {function}  Callback al pulsar "Cancelar".
 */
export default function ConfirmModal({ show, title, message, type = 'danger', onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-soft border border-surface-edge w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-brand/10 text-brand'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">{title}</h3>
          </div>
          <p className="text-gray-400 font-bold ml-16">{message}</p>
        </div>
        <div className="bg-surface-soft/50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-black text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg transition-all ${
              type === 'danger'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                : 'bg-brand hover:bg-brand-light shadow-brand/20'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
