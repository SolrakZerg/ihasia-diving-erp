import React, { useState, useEffect } from 'react';
import { Mail, Send, Check, Loader2, X, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { buildInstructorPDFDoc } from './generateNominasPDF';
import { uploadNominasPDF, sendNominasEmail } from './sendNominasEmail';

const MESES_ESPANOL = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export default function Nominas_EmailModal({
  isOpen,
  onClose,
  payrollData,
  month,
  year,
  selectedStaffId,
  staff,
  activeStaffIds,
  getPayrollDataForStaff
}) {
  const [sendToInstructor, setSendToInstructor] = useState(true);
  const [instructorEmail, setInstructorEmail] = useState('');
  
  const [sendToAdmin, setSendToAdmin] = useState(true);
  const [adminEmail, setAdminEmail] = useState('ihasiakohtao@gmail.com');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAllMode = selectedStaffId === 'TODOS';
  const selectedMember = payrollData?.selectedMember;

  useEffect(() => {
    if (selectedMember) {
      setInstructorEmail(selectedMember.email || '');
    }
    setSuccess(false);
    setErrorMsg('');
    setStatusMessage('');
  }, [selectedMember, isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      if (isAllMode) {
        // Mode TODOS
        const activeMembers = staff.filter(s => activeStaffIds.has(s.id));
        if (activeMembers.length === 0) {
          throw new Error('No hay instructores activos este mes.');
        }

        let sentCount = 0;
        const monthName = MESES_ESPANOL[(month - 1) % 12] || '';

        for (let i = 0; i < activeMembers.length; i++) {
          const member = activeMembers[i];
          const data = getPayrollDataForStaff(member.id);
          if (!data) continue;

          setStatusMessage(`Generando y enviando informe de ${member.first_name} ${member.last_name}... (${i + 1}/${activeMembers.length})`);

          const doc = buildInstructorPDFDoc(data);
          const pdfBlob = doc.output('blob');

          const safeMemberName = `${member.first_name || ''}_${member.last_name || ''}`.trim().replace(/\s+/g, '_');
          const fileName = `nominas/nomina_${safeMemberName}_${month}_${year}_${Date.now()}.pdf`;

          const uploadRes = await uploadNominasPDF(fileName, pdfBlob);

          const recipients = [];
          if (sendToInstructor && member.email) recipients.push(member.email);
          if (sendToAdmin && adminEmail) recipients.push(adminEmail);

          if (recipients.length > 0) {
            await sendNominasEmail({
              filePath: uploadRes.path,
              targetEmails: recipients,
              instructorName: `${member.first_name} ${member.last_name}`,
              monthName,
              year
            });
            sentCount++;
          }
        }

        setSuccess(true);
        setStatusMessage(`¡Se han enviado correctamente ${sentCount} informes de nómina!`);
      } else {
        // Individual instructor mode
        if (!sendToInstructor && !sendToAdmin) {
          throw new Error('Debes seleccionar al menos un destinatario.');
        }

        const recipients = [];
        if (sendToInstructor && instructorEmail.trim()) recipients.push(instructorEmail.trim());
        if (sendToAdmin && adminEmail.trim()) recipients.push(adminEmail.trim());

        if (recipients.length === 0) {
          throw new Error('Debes ingresar al menos una dirección de email válida.');
        }

        setStatusMessage('Generando documento PDF...');
        const doc = buildInstructorPDFDoc(payrollData);
        const pdfBlob = doc.output('blob');

        const instructorName = `${selectedMember?.first_name || ''} ${selectedMember?.last_name || ''}`.trim() || 'Instructor';
        const safeMemberName = instructorName.replace(/\s+/g, '_');
        const fileName = `nominas/nomina_${safeMemberName}_${month}_${year}_${Date.now()}.pdf`;

        setStatusMessage('Subiendo documento a la nube...');
        const uploadRes = await uploadNominasPDF(fileName, pdfBlob);

        setStatusMessage('Enviando correo electrónico...');
        const monthName = MESES_ESPANOL[(month - 1) % 12] || '';
        await sendNominasEmail({
          filePath: uploadRes.path,
          targetEmails: recipients,
          instructorName,
          monthName,
          year
        });

        setSuccess(true);
        setStatusMessage(`¡Informe de nómina enviado a ${recipients.join(', ')}!`);
      }
    } catch (err) {
      console.error("Error al enviar el email:", err);
      setErrorMsg(err.message || 'Ocurrió un error al enviar el informe por correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1c2d] border border-surface-edge rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-edge/50 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">Enviar Informe por Email</h3>
              <p className="text-sm font-bold text-gray-300 mt-0.5">
                {isAllMode ? 'Envío masivo a todo el staff activo' : (selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Instructor')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-9 h-9" />
            </div>
            <p className="text-base font-bold text-emerald-300">{statusMessage}</p>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-surface-edge hover:bg-surface-soft text-white font-black text-base rounded-xl transition-all"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm font-black text-gray-300 uppercase tracking-widest mb-1">
              Seleccionar Destinatarios:
            </p>

            {/* Card 1: Instructor */}
            <div 
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                sendToInstructor 
                  ? 'bg-brand/10 border-brand/50 shadow-lg shadow-brand/10' 
                  : 'bg-surface-soft/40 border-surface-edge/40 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Large Vertical Checkbox Toggle */}
              <button
                type="button"
                onClick={() => setSendToInstructor(!sendToInstructor)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  sendToInstructor 
                    ? 'bg-brand text-white shadow-md shadow-brand/40 scale-105' 
                    : 'bg-surface-edge/60 text-transparent hover:border-gray-400 border border-surface-edge'
                }`}
                aria-label="Seleccionar Email del Instructor"
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </button>

              {/* Right Content Area */}
              <div className="flex-1 min-w-0 space-y-2">
                <div 
                  onClick={() => setSendToInstructor(!sendToInstructor)} 
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <User className={`w-5 h-5 ${sendToInstructor ? 'text-brand' : 'text-gray-400'}`} />
                    <span className={`text-base sm:text-lg font-black ${sendToInstructor ? 'text-brand' : 'text-gray-400'}`}>Email del Instructor</span>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${sendToInstructor ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {sendToInstructor ? 'Incluido' : 'Desactivado'}
                  </span>
                </div>

                {!isAllMode ? (
                  <input 
                    type="email"
                    value={instructorEmail}
                    disabled={!sendToInstructor}
                    onChange={(e) => setInstructorEmail(e.target.value)}
                    placeholder="correo@instructor.com"
                    className={`w-full bg-surface-soft/80 border rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-bold text-white outline-none transition-all ${
                      sendToInstructor ? 'border-brand/40 focus:border-brand' : 'border-surface-edge/40 cursor-not-allowed opacity-50'
                    }`}
                  />
                ) : (
                  <p className="text-xs font-bold text-gray-400 italic">
                    Se enviará automáticamente a la dirección registrada de cada instructor activo.
                  </p>
                )}
              </div>
            </div>

            {/* Card 2: Administración */}
            <div 
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                sendToAdmin 
                  ? 'bg-brand/10 border-brand/50 shadow-lg shadow-brand/10' 
                  : 'bg-surface-soft/40 border-surface-edge/40 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Large Vertical Checkbox Toggle */}
              <button
                type="button"
                onClick={() => setSendToAdmin(!sendToAdmin)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  sendToAdmin 
                    ? 'bg-brand text-white shadow-md shadow-brand/40 scale-105' 
                    : 'bg-surface-edge/60 text-transparent hover:border-gray-400 border border-surface-edge'
                }`}
                aria-label="Seleccionar Email Administración"
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </button>

              {/* Right Content Area */}
              <div className="flex-1 min-w-0 space-y-2">
                <div 
                  onClick={() => setSendToAdmin(!sendToAdmin)} 
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-5 h-5 ${sendToAdmin ? 'text-brand' : 'text-gray-400'}`} />
                    <span className={`text-base sm:text-lg font-black ${sendToAdmin ? 'text-brand' : 'text-gray-400'}`}>Email Administración</span>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${sendToAdmin ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {sendToAdmin ? 'Incluido' : 'Desactivado'}
                  </span>
                </div>

                <input 
                  type="email"
                  value={adminEmail}
                  disabled={!sendToAdmin}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className={`w-full bg-surface-soft/80 border rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-bold text-white outline-none transition-all ${
                    sendToAdmin ? 'border-brand/40 focus:border-brand' : 'border-surface-edge/40 cursor-not-allowed opacity-50'
                  }`}
                />
              </div>
            </div>

            {/* Loading status indicator */}
            {loading && (
              <div className="p-4 bg-brand/10 border border-brand/30 rounded-xl flex items-center gap-3 text-brand text-sm font-bold animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span>{statusMessage || 'Procesando...'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 bg-surface-edge hover:bg-surface-soft hover:text-white hover:scale-[1.02] active:scale-[0.98] text-gray-300 font-bold text-sm sm:text-base rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || (!sendToInstructor && !sendToAdmin)}
                className="flex-1 py-3.5 bg-brand hover:bg-brand-hover hover:brightness-110 hover:shadow-lg hover:shadow-brand/30 hover:scale-[1.02] active:scale-[0.98] text-white font-black text-sm sm:text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />}
                <span>Enviar Email</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
