import React from 'react';
import { X } from 'lucide-react';

// Función para evaluar de forma segura expresiones matemáticas simples
const evaluateExpression = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).trim();
  if (!str) return 0;

  // Remover todos los espacios
  const cleanStr = str.replace(/\s+/g, '');

  // Validar caracteres permitidos: dígitos, operadores +, -, *, /, decimal ., y paréntesis ( )
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
  month, 
  year 
}) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (!adjModal.open) return null;

  // Determinar si el valor ingresado es un único número o una expresión
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1a1c2d]/90 border border-surface-edge/50 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl">
        <div className="p-8 border-b border-surface-edge/30 bg-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white leading-none">Ajuste Manual</h3>
            <p className="text-sm font-black text-brand uppercase tracking-[0.2em] mt-3">Día {adjModal.day} · {months[month-1]} {year}</p>
          </div>
          <button onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad del Extra</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-brand transition-colors">฿</span>
              <input 
                type="text" 
                autoFocus
                value={adjModal.amount} 
                onChange={(e) => setAdjModal(prev => ({ ...prev, amount: e.target.value }))}
                className={`w-full bg-surface-edge/20 border rounded-[20px] p-6 pl-12 text-4xl font-black text-white outline-none transition-all ${
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

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Concepto o Motivo</label>
            <textarea 
              value={adjModal.concept} 
              onChange={(e) => setAdjModal(prev => ({ ...prev, concept: e.target.value }))}
              className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-[20px] p-6 text-base font-bold text-gray-300 outline-none focus:border-brand/50 focus:bg-brand/5 transition-all min-h-[140px] resize-none placeholder:text-gray-700"
              placeholder="Escribe aquí el motivo del ajuste..."
            />
          </div>
        </div>

        <div className="p-6 bg-white/5 flex gap-4">
          <button 
            onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })}
            className="flex-1 btn-modal-cancel"
          >
            Cancelar
          </button>
          <button 
            disabled={hasEvaluationError}
            onClick={() => {
              let finalAmount = 0;
              try {
                finalAmount = evaluateExpression(adjModal.amount);
              } catch (e) {
                return;
              }

              // Extraer y evaluar la fórmula existente en el concepto (si hay una)
              let existingFormulaEvaluated = null;
              const formulaMatch = String(adjModal.concept || '').match(/\bFórmula:\s*(.+)$/m);
              if (formulaMatch) {
                try {
                  existingFormulaEvaluated = evaluateExpression(formulaMatch[1]);
                } catch (e) {
                  // Ignorar errores en fórmulas anteriores
                }
              }

              // Limpiar cualquier línea previa de Fórmula
              const cleanedConcept = (adjModal.concept || '')
                .replace(/(?:\r?\n)?\bFórmula:.*$/g, '')
                .trim();

              // Conservamos o añadimos la fórmula si:
              // 1. Es una nueva expresión activa.
              // 2. Ya existía una fórmula y su evaluación da el mismo resultado que la cantidad actual (no hubo cambios).
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
            }}
            className="flex-[2] btn-modal-confirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

