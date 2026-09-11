import React, { useState, useEffect } from 'react';
import { X, Calculator, Users } from 'lucide-react';
import Nominas_AdjModal_ShareMode from './Nominas_AdjModal_ShareMode';

// Función para evaluar de forma segura expresiones matemáticas simples
const evaluateExpression = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).trim();
  if (!str) return 0;

  const cleanStr = str.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().]+$/.test(cleanStr)) {
    throw new Error('Expresión matemática inválida');
  }

  try {
    const evaluated = new Function(`return (${cleanStr})`)();
    if (typeof evaluated === 'number' && !isNaN(evaluated) && isFinite(evaluated)) {
      return evaluated;
    }
    throw new Error('Resultado no numérico');
  } catch (e) {
    throw new Error('Error al evaluar');
  }
};

export default function Nominas_AdjModal({ 
  adjModal, 
  setAdjModal, 
  handleAdjUpdate, 
  handleShareActivity,
  month, 
  year,
  staff = [],
  selectedStaffId,
  invoiceItems = [],
  payoutRules = [],
  rawAdjustments = []
}) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [mode, setMode] = useState('manual'); // 'manual' | 'share'

  useEffect(() => {
    if (adjModal.open) {
      setMode('manual');
    }
  }, [adjModal.open, adjModal.day]);

  if (!adjModal.open) return null;

  // Lógica del modo manual
  const isSingleNumber = /^[+-]?\d*\.?\d+$/.test(String(adjModal.amount).trim());
  const isExpression = !isSingleNumber && String(adjModal.amount).trim() !== '';

  let previewValue = null;
  let hasEvaluationError = false;

  if (isExpression) {
    try {
      previewValue = evaluateExpression(adjModal.amount);
    } catch (e) {
      hasEvaluationError = true;
    }
  }

  const handleConfirmManual = () => {
    let finalAmount = 0;
    try {
      finalAmount = evaluateExpression(adjModal.amount);
    } catch (e) {
      return;
    }

    let existingFormulaEvaluated = null;
    const formulaMatch = String(adjModal.concept || '').match(/\bFórmula:\s*(.+)$/m);
    if (formulaMatch) {
      try {
        existingFormulaEvaluated = evaluateExpression(formulaMatch[1]);
      } catch (e) {}
    }

    const cleanedConcept = (adjModal.concept || '')
      .replace(/(?:\r?\n)?\bFórmula:.*$/g, '')
      .trim();

    const keepOrAddFormula = isExpression || (existingFormulaEvaluated !== null && existingFormulaEvaluated === finalAmount);

    let finalConcept = cleanedConcept;
    if (keepOrAddFormula) {
      const formulaToSave = isExpression ? adjModal.amount : formulaMatch[1];
      finalConcept = cleanedConcept 
        ? `${cleanedConcept}\nFórmula: ${formulaToSave}` 
        : `Fórmula: ${formulaToSave}`;
    }

    handleAdjUpdate(adjModal.day, finalAmount, finalConcept);
    setAdjModal({ open: false, day: null, amount: 0, concept: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1a1c2d]/95 border border-surface-edge/50 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl max-h-[92vh] flex flex-col">
        
        {/* CABECERA */}
        <div className="p-6 border-b border-surface-edge/30 bg-white/5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-none">Ajuste de Extra</h3>
            <p className="text-xs sm:text-sm font-black text-brand uppercase tracking-[0.2em] mt-2">
              Día {adjModal.day} · {months[month-1]} {year}
            </p>
          </div>
          <button 
            onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTOR DE MODO */}
        <div className="p-4 bg-surface-soft/40 border-b border-surface-edge/20 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-surface-edge/30 rounded-xl gap-1 border border-surface-edge/30">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-brand text-white shadow-md font-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Ajuste Libre
            </button>
            <button
              type="button"
              onClick={() => setMode('share')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'share'
                  ? 'bg-brand text-white shadow-md font-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              A Medias con Instructor
            </button>
          </div>
        </div>
        
        {/* CUERPO DEL MODAL */}
        {mode === 'manual' ? (
          <>
            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  Cantidad del Extra
                </label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-brand transition-colors">฿</span>
                  <input 
                    type="text" 
                    autoFocus
                    value={adjModal.amount} 
                    onChange={(e) => setAdjModal(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full bg-surface-edge/20 border rounded-[20px] p-5 pl-12 text-3xl font-black text-white outline-none transition-all ${
                      hasEvaluationError 
                        ? 'border-rose-500/50 focus:border-rose-500/80 focus:bg-rose-500/5' 
                        : 'border-surface-edge/50 focus:border-brand/50 focus:bg-brand/5'
                    }`}
                    placeholder="0"
                  />
                </div>
                {isExpression && !hasEvaluationError && (
                  <div className="text-right text-xs font-black text-amber-400 mt-1 uppercase tracking-wider animate-in fade-in slide-in-from-top-1 duration-200">
                    Resultado: <span className="text-lg text-white font-black ml-1">฿ {previewValue?.toLocaleString()}</span>
                  </div>
                )}
                {isExpression && hasEvaluationError && (
                  <div className="text-right text-[10px] font-black text-rose-500 mt-1 uppercase tracking-wider animate-in fade-in duration-200">
                    Expresión incompleta o inválida...
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  Concepto o Motivo
                </label>
                <textarea 
                  value={adjModal.concept} 
                  onChange={(e) => setAdjModal(prev => ({ ...prev, concept: e.target.value }))}
                  className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-[20px] p-5 text-sm sm:text-base font-bold text-gray-300 outline-none focus:border-brand/50 focus:bg-brand/5 transition-all min-h-[130px] resize-none placeholder:text-gray-700 font-mono"
                  placeholder="Escribe aquí el motivo del ajuste o fórmulas..."
                />
              </div>
            </div>

            {/* BOTONES MODO MANUAL */}
            <div className="p-6 bg-white/5 border-t border-surface-edge/20 flex gap-4 shrink-0">
              <button 
                onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })}
                className="flex-1 btn-modal-cancel"
              >
                Cancelar
              </button>
              <button 
                disabled={hasEvaluationError}
                onClick={handleConfirmManual}
                className="flex-[2] btn-modal-confirm"
              >
                Confirmar
              </button>
            </div>
          </>
        ) : (
          <Nominas_AdjModal_ShareMode
            adjModal={adjModal}
            setAdjModal={setAdjModal}
            handleShareActivity={handleShareActivity}
            year={year}
            month={month}
            staff={staff}
            selectedStaffId={selectedStaffId}
            invoiceItems={invoiceItems}
            payoutRules={payoutRules}
          />
        )}
      </div>
    </div>
  );
}
