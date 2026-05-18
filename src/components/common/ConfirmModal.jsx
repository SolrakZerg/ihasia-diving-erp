import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * ConfirmModal — Modal de confirmación compartido.
 *
 * Props:
 *  - show              {boolean}   Si el modal está visible.
 *  - title             {string}    Título del modal.
 *  - message           {string}    Mensaje / descripción de la acción a confirmar.
 *  - type              {string}    'danger' | 'info'  — controla el color del icono y el botón de confirmar.
 *  - confirmationWord  {string}    Opcional. Si se pasa, obliga a escribir esta palabra para confirmar.
 *  - onConfirm         {function}  Callback al pulsar "Confirmar".
 *  - onCancel          {function}  Callback al pulsar "Cancelar".
 */
export default function ConfirmModal({
  show,
  title,
  message,
  type = 'danger',
  confirmationWord,
  onConfirm,
  onCancel
}) {
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (show) {
      setInputText('');
    }
  }, [show]);

  if (!show) return null;

  const isConfirmDisabled = confirmationWord && inputText.trim().toUpperCase() !== confirmationWord.toUpperCase();

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-soft border border-surface-edge w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-rose-400/10 text-rose-400' : 'bg-brand/10 text-brand'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">{title}</h3>
          </div>
          <p className="text-gray-400 font-bold ml-16 leading-relaxed text-sm">{message}</p>

          {confirmationWord && (
            <div className="mt-5 ml-16 space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                Escribe <span className="text-rose-400 font-black tracking-normal select-all">{confirmationWord}</span> para confirmar:
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={confirmationWord}
                className="w-full bg-black/30 border border-surface-edge rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-rose-500/50 transition-all text-xs tracking-wider"
              />
            </div>
          )}
        </div>
        <div className="bg-surface-soft/50 px-6 py-4 flex justify-end gap-3 border-t border-surface-edge/30">
          <button
            onClick={onCancel}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg transition-all ${
              isConfirmDisabled
                ? 'opacity-40 cursor-not-allowed bg-rose-950/20 text-gray-500 shadow-none border border-white/5'
                : type === 'danger'
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
