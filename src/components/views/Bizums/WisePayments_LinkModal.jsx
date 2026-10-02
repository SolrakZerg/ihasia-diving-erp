import { useState, useEffect } from 'react';
import { Link2, X, AlertCircle, CheckCircle2, User, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function WisePayments_LinkModal({
  isOpen,
  onClose,
  sourcePayment,
  onLinkSuccess
}) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isSourceWeb = sourcePayment?.id?.startsWith('WEB_');

  // Algoritmo de puntuación de afinidad inteligente
  const scoreCandidate = (source, cand, isSrcWeb) => {
    let score = 0;
    let reasons = [];

    const web = isSrcWeb ? source : cand;
    const bank = isSrcWeb ? cand : source;

    const getWords = (str) => {
      if (!str) return [];
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .split(/[\s,.-]+/)
        .filter((w) => w.length >= 3);
    };

    const bankWords = [
      ...getWords(bank.sender_name),
      ...getWords(bank.reference)
    ];

    const webWords = [
      ...getWords(web.customer_name),
      ...getWords(web.sender_name),
      ...getWords(web.titular_wise)
    ];

    // 1. Coincidencia de palabras (apellidos o nombres)
    const exactMatches = webWords.filter((w) => bankWords.includes(w));
    if (exactMatches.length > 0) {
      score += 100 * exactMatches.length;
      reasons.push(`Coincide "${exactMatches[0]}"`);
    } else {
      const partialMatch = webWords.some((w) => bankWords.some((bw) => bw.includes(w) || w.includes(bw)));
      if (partialMatch) {
        score += 30;
        reasons.push('Nombre similar');
      }
    }

    // 2. Coincidencia de importe con número de personas (1.000 THB por Pax)
    const bankAmount = Number(bank.amount_raw || bank.amount_eur || 0);
    const expectedAmount = Number(web.num_people || 1) * 1000;
    if (bankAmount > 0 && bankAmount === expectedAmount) {
      score += 50;
      reasons.push(`${web.num_people} Pax (${bankAmount} THB)`);
    }

    // 3. Proximidad temporal entre creación del banco y de la web
    if (source.created_at && cand.created_at) {
      const diffHours = Math.abs(new Date(source.created_at) - new Date(cand.created_at)) / (1000 * 60 * 60);
      if (diffHours <= 2) {
        score += 25;
        reasons.push('Misma hora');
      } else if (diffHours <= 24) {
        score += 10;
      }
    }

    return {
      score,
      reason: reasons.length > 0 ? reasons.join(' · ') : null
    };
  };

  useEffect(() => {
    if (!isOpen || !sourcePayment) return;

    setSelectedCandidateId('');
    setErrorMsg('');
    setLoadingCandidates(true);

    const loadCandidates = async () => {
      try {
        let rawList = [];

        if (isSourceWeb) {
          const { data, error } = await supabase
            .from('wise_payments')
            .select('*')
            .not('id', 'like', 'WEB_%')
            .eq('is_processed', false)
            .is('booking_date', null)
            .order('created_at', { ascending: false });

          if (error) throw error;
          rawList = data || [];
        } else {
          const { data, error } = await supabase
            .from('wise_payments')
            .select('*')
            .like('id', 'WEB_%')
            .eq('is_processed', false)
            .eq('is_paid', false)
            .order('created_at', { ascending: false });

          if (error) throw error;
          rawList = data || [];
        }

        const scoredList = rawList.map((cand) => {
          const { score, reason } = scoreCandidate(sourcePayment, cand, isSourceWeb);
          return {
            ...cand,
            affinityScore: score,
            affinityReason: reason
          };
        });

        scoredList.sort((a, b) => {
          if (b.affinityScore !== a.affinityScore) {
            return b.affinityScore - a.affinityScore;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setCandidates(scoredList);

        if (scoredList.length > 0) {
          setSelectedCandidateId(scoredList[0].id);
        }
      } catch (err) {
        console.error('Error cargando candidatos de vinculación:', err);
        setErrorMsg('Error al consultar registros disponibles.');
      } finally {
        setLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, [isOpen, sourcePayment, isSourceWeb]);

  if (!isOpen || !sourcePayment) return null;

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const webRecord = isSourceWeb ? sourcePayment : selectedCandidate;
  const bankRecord = isSourceWeb ? selectedCandidate : sourcePayment;

  const bankAmount = Number(bankRecord?.amount_raw || bankRecord?.amount_eur || 0);
  const paxCount = Number(webRecord?.num_people || 1);
  const expectedAmount = paxCount * 1000;
  const hasDepositDiscrepancy = Boolean(bankRecord && webRecord && bankAmount > 0 && bankAmount !== expectedAmount);
  const depositDiff = bankAmount - expectedAmount;

  const handleConfirm = async () => {
    if (!webRecord || !bankRecord) {
      setErrorMsg('Debes seleccionar un registro para vincular.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const { error: updateError } = await supabase
        .from('wise_payments')
        .update({
          customer_name: webRecord.customer_name || webRecord.sender_name,
          titular_wise: bankRecord.sender_name,
          booking_date: webRecord.booking_date,
          phone: webRecord.phone,
          activity: webRecord.activity,
          activity_lines: webRecord.activity_lines,
          num_people: webRecord.num_people || 1,
          is_english: webRecord.is_english ?? true,
          web_created_at: webRecord.created_at || new Date().toISOString(),
          is_paid: true
        })
        .eq('id', bankRecord.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('wise_payments')
        .delete()
        .eq('id', webRecord.id);

      if (deleteError) throw deleteError;

      if (onLinkSuccess) {
        await onLinkSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error al vincular registros:', err);
      setErrorMsg(err.message || 'Error al completar la vinculación.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface-soft border border-surface-edge rounded-3xl max-w-2xl w-full p-7 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-edge pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Link2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xl sm:text-2xl tracking-tight leading-snug">
                Vincular Reserva con Pago Wise
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Unifica una reserva web con su transferencia bancaria huérfana
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors p-2 rounded-xl hover:bg-surface-edge/50 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* 1. Registro Origen */}
        <div className="bg-surface border border-surface-edge rounded-2xl p-4 sm:p-5 space-y-3">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">
            {isSourceWeb ? '1. Reserva Web Seleccionada' : '1. Transferencia Bancaria de Wise'}
          </span>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-brand shrink-0" />
              <span className="font-extrabold text-white text-base sm:text-lg">
                {sourcePayment.customer_name || sourcePayment.sender_name}
              </span>
            </div>
            {isSourceWeb ? (
              <span className="px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-sm font-black shadow-sm">
                {sourcePayment.activity || 'Actividad'} ({sourcePayment.num_people} Pax)
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-black shadow-sm">
                {sourcePayment.amount_raw || sourcePayment.amount_eur} THB
              </span>
            )}
          </div>
          {isSourceWeb && sourcePayment.booking_date && (
            <div className="text-sm text-gray-300 flex items-center gap-2 pl-7 flex-wrap">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Fecha curso: <strong className="text-emerald-400 font-bold">{sourcePayment.booking_date}</strong></span>
              {sourcePayment.phone && <span className="text-gray-400 font-medium">· WhatsApp: <strong className="text-gray-200">{sourcePayment.phone}</strong></span>}
            </div>
          )}
        </div>

        {/* 2. Selector del registro complementario */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-gray-200 block">
              {isSourceWeb 
                ? '2. Selecciona la Transferencia de Wise recibida en el banco:' 
                : '2. Selecciona el Formulario Web del alumno:'}
            </label>
            {candidates.some(c => c.affinityScore > 0) && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-400/15 px-2.5 py-1 rounded-lg border border-amber-400/30 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sugerencia detectada
              </span>
            )}
          </div>

          {loadingCandidates ? (
            <div className="py-6 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              Buscando registros incompletos...
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-6 h-6 shrink-0 text-amber-400" />
              <span>
                {isSourceWeb 
                  ? 'No hay transferencias de Wise huérfanas disponibles para vincular en este momento.' 
                  : 'No hay formularios web pendientes de pago en este momento.'}
              </span>
            </div>
          ) : (
            <>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full bg-surface border border-surface-edge rounded-2xl px-4 py-3 text-sm sm:text-base font-bold text-white focus:outline-none focus:border-brand cursor-pointer shadow-sm transition-all"
              >
                {candidates.map((c) => {
                  const prefix = c.affinityScore > 0 ? `⭐ [Sugerido] ` : '';
                  if (isSourceWeb) {
                    const cAmount = Number(c.amount_raw || c.amount_eur || 0);
                    const expected = Number(sourcePayment.num_people || 1) * 1000;
                    const diff = cAmount - expected;
                    const discrepancyTag = cAmount > 0 && cAmount !== expected 
                      ? ` ⚠️ [${diff < 0 ? `Faltan ${Math.abs(diff)}` : `+${diff}`} THB]` 
                      : '';
                    return (
                      <option key={c.id} value={c.id}>
                        {prefix}[{formatDateDisplay(c.created_at)}] {c.sender_name} — {cAmount} THB (ID #{c.id}){discrepancyTag}
                      </option>
                    );
                  } else {
                    const srcAmount = Number(sourcePayment.amount_raw || sourcePayment.amount_eur || 0);
                    const expected = Number(c.num_people || 1) * 1000;
                    const diff = srcAmount - expected;
                    const discrepancyTag = srcAmount > 0 && srcAmount !== expected 
                      ? ` ⚠️ [${diff < 0 ? `Faltan ${Math.abs(diff)}` : `+${diff}`} THB]` 
                      : '';
                    return (
                      <option key={c.id} value={c.id}>
                        {prefix}[{c.booking_date || 'Sin fecha'}] {c.customer_name || c.sender_name} — {c.activity || 'Curso'} ({c.num_people} Pax){discrepancyTag}
                      </option>
                    );
                  }
                })}
              </select>

              {/* Mensaje de afinidad encontrada */}
              {selectedCandidate?.affinityReason && (
                <div className="text-xs sm:text-sm text-amber-300 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="font-bold">Coincidencia inteligente:</strong> {selectedCandidate.affinityReason}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Aviso Prominente de Discrepancia Depósito vs Pax */}
        {hasDepositDiscrepancy && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 flex items-start gap-3.5 shadow-lg animate-in fade-in duration-200">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-sm sm:text-base text-amber-300 flex items-center gap-1.5">
                <span>⚠️ Discrepancia en depósito de reserva</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                La reserva web solicita <strong className="text-white font-bold">{paxCount} {paxCount === 1 ? 'Persona' : 'Personas'}</strong> (depósito esperado: <strong className="text-amber-300">{expectedAmount.toLocaleString()} THB</strong>), pero la transferencia bancaria es de <strong className="text-emerald-400 font-bold">{bankAmount.toLocaleString()} THB</strong>.
              </p>
              <p className="text-xs sm:text-sm font-black text-amber-400">
                {depositDiff < 0 
                  ? `👉 Faltan ${Math.abs(depositDiff).toLocaleString()} THB por cobrar del depósito. (Quedará marcado de forma llamativa en la tabla para cobrar en el centro).` 
                  : `👉 Hay un excedente de +${depositDiff.toLocaleString()} THB sobre el depósito estándar.`}
              </p>
            </div>
          </div>
        )}

        {/* 3. Previsualización del Resultado de la Fusión */}
        {webRecord && bankRecord && (
          <div className="p-4 sm:p-5 rounded-2xl bg-brand/5 border border-brand/20 space-y-2.5">
            <span className="text-xs font-black text-brand uppercase tracking-wider block">
              Resultado final tras la vinculación:
            </span>
            <div className="text-sm space-y-1.5 text-gray-200">
              <p>• <strong>Alumno:</strong> <span className="text-white font-extrabold text-base">{webRecord.customer_name || webRecord.sender_name}</span></p>
              <p>• <strong>Titular cuenta Wise:</strong> <span className="text-amber-400 font-bold">{bankRecord.sender_name}</span></p>
              <p>• <strong>Curso / Pax:</strong> <span className="font-semibold">{webRecord.activity || '---'} ({webRecord.num_people} Pax)</span></p>
              <p>• <strong>Fecha Actividad:</strong> <span className="font-bold text-emerald-400">{webRecord.booking_date || '---'}</span></p>
              <p>
                • <strong>Importe Confirmado:</strong> <span className="text-emerald-400 font-black text-base">{bankAmount} THB</span> (Recibido ✅)
                {hasDepositDiscrepancy && (
                  <span className="text-amber-400 font-bold text-xs ml-2 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30">
                    ⚠️ {depositDiff < 0 ? `Faltan ${Math.abs(depositDiff)} THB` : `+${depositDiff} THB`}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-surface-edge">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white cursor-pointer transition-colors hover:bg-surface disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || candidates.length === 0 || !selectedCandidateId}
            className="px-7 py-3 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-400 text-white shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Vinculando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>Confirmar y Unir</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
