import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Users, Send, AlertCircle, CheckCircle2, Loader2, X, Lock, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { generateRosterSchedule, formatRosterName, mapActivityCode, getDefaultShiftForActivity, formatStaffInitials, ROSTER_BCD_SIZES, ROSTER_SUIT_SIZES, ROSTER_FINS_SIZES, getRosterSizeColor, getRosterFinsColor, getRosterOptionStyle, getRosterActivityColor } from '../../../utils/rosterUtils';
import { sendAssignmentsToRoster, getRosterSession } from '../../../lib/rosterSupabaseClient';
import { supabase } from '../../../lib/supabaseClient';

// Lista de iniciales de Staff registradas en el Roster
const ROSTER_STAFF_LIST = [
  "ALB", "AND", "BT", "CAR", "CR", "CRI", "DAV", "EK", "FREE", "HUG", "MDM", "MP", "SAL", "SAN", "XAV"
];

const ACTIVITIES_OPTIONS = [
  { code: 'DSD', label: 'Try Dive / Bautizo (1 día - Tarde)' },
  { code: 'FD', label: 'Fun Dives (1 día - Mañana)' },
  { code: 'OW', label: 'Open Water (3 días: CONF Tarde, 1+2 Tarde, 3+4 Mañana)' },
  { code: 'SD', label: 'Scuba Diver (2 días: CONF Tarde, 1+2 Tarde)' },
  { code: 'AOW', label: 'Advanced Open Water (AOW)' },
  { code: 'SR', label: 'Scuba Refresh (SR - Tarde)' },
];

export default function SendToRosterModal({
  isOpen,
  onClose,
  customers = [],
  defaultActivity = null,
  defaultStaff = '',
  onSuccess
}) {
  const dateInputRef = useRef(null);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) {}
    return null;
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const customerList = useMemo(() => {
    if (!customers) return [];
    return Array.isArray(customers) ? customers : [customers];
  }, [customers]);

  const isSingleCustomer = customerList.length === 1;
  const singleCustomer = isSingleCustomer ? customerList[0] : null;

  // Estado configurable individualmente por cada cliente { [custId]: { startDate, activityCode, shift, staff } }
  const [customerConfigs, setCustomerConfigs] = useState({});

  // Controles Globales (para aplicar a todos de golpe)
  const [globalDate, setGlobalDate] = useState(getTodayStr());
  const [globalActivity, setGlobalActivity] = useState('FD');
  const [globalShift, setGlobalShift] = useState('morning');
  const [globalStaff, setGlobalStaff] = useState(() => formatStaffInitials(defaultStaff));

  // Autenticación de Roster (Opción 3)
  const [hasRosterSession, setHasRosterSession] = useState(false);
  const [rosterEmail, setRosterEmail] = useState('');
  const [rosterPassword, setRosterPassword] = useState('');
  const [showAuthFields, setShowAuthFields] = useState(false);

  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inicializar configuraciones individuales de cada cliente
  useEffect(() => {
    if (isOpen && customerList.length > 0) {
      const initialConfigs = {};
      const today = getTodayStr();
      customerList.forEach(cust => {
        const custDate = formatDateForInput(cust.defaultDate || cust.booking_date || cust.reserva || cust.date) || today;
        const rawAct = cust.defaultActivity || defaultActivity || cust.booked_activity || cust.activity;
        const custAct = rawAct ? mapActivityCode(rawAct) : 'FD';
        const custShift = getDefaultShiftForActivity(custAct);
        const custStf = formatStaffInitials(cust.defaultStaff || defaultStaff);

        initialConfigs[cust.id] = {
          startDate: custDate,
          activityCode: custAct,
          shift: custShift,
          staff: custStf,
          bcd: cust.bcd_size || cust.bcd || '',
          suit: cust.suit_size || cust.suit || '',
          fins: cust.fins_size || cust.fins || ''
        };
      });

      setCustomerConfigs(initialConfigs);
      setErrorMsg('');
      setSuccessMsg('');

      // Comprobar sesión activa de Roster
      getRosterSession().then(session => {
        if (session && session.user) {
          setHasRosterSession(true);
          setShowAuthFields(false);
        } else {
          setHasRosterSession(false);
          setShowAuthFields(true);
        }
      });
    }
  }, [isOpen, customerList, defaultActivity, defaultStaff]);

  // Actualizar la configuración de un cliente específico
  const updateSingleCustomerConfig = (custId, field, value) => {
    setCustomerConfigs(prev => {
      const current = prev[custId] || {};
      const updated = { ...current, [field]: value };
      
      if (field === 'activityCode') {
        updated.shift = getDefaultShiftForActivity(value);
      }
      
      return { ...prev, [custId]: updated };
    });
  };

  // Aplicar fecha global a todos
  const applyGlobalDate = (newDate) => {
    setGlobalDate(newDate);
    setCustomerConfigs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], startDate: newDate };
      });
      return next;
    });
  };

  // Aplicar actividad global a todos
  const applyGlobalActivity = (newAct) => {
    setGlobalActivity(newAct);
    const defShift = getDefaultShiftForActivity(newAct);
    setGlobalShift(defShift);

    setCustomerConfigs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], activityCode: newAct, shift: defShift };
      });
      return next;
    });
  };

  // Aplicar staff global a todos
  const applyGlobalStaff = (newStaff) => {
    const formatted = formatStaffInitials(newStaff);
    setGlobalStaff(formatted);
    setCustomerConfigs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], staff: formatted };
      });
      return next;
    });
  };

  // Abrir el picker nativo del calendario
  const openDatePicker = () => {
    if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  };

  // Generar todas las filas a enviar agregando la config de cada cliente
  const { previewRows, customerPreviews } = useMemo(() => {
    let allRows = [];
    const custPreviews = [];

    customerList.forEach(cust => {
      const config = customerConfigs[cust.id] || {};
      const custRows = generateRosterSchedule({
        customer: cust,
        activityCode: config.activityCode || 'FD',
        startDate: config.startDate || getTodayStr(),
        staff: formatStaffInitials(config.staff || ''),
        customShift: config.shift,
        customBcd: config.bcd,
        customSuit: config.suit,
        customFins: config.fins
      });

      allRows = allRows.concat(custRows);
      custPreviews.push({
        customer: cust,
        config: config,
        rows: custRows
      });
    });

    return { previewRows: allRows, customerPreviews: custPreviews };
  }, [customerList, customerConfigs]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (previewRows.length === 0) {
      setErrorMsg('No hay filas para enviar.');
      return;
    }

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const authCreds = (showAuthFields && rosterEmail && rosterPassword) 
        ? { email: rosterEmail, password: rosterPassword } 
        : null;

      const { data, error } = await sendAssignmentsToRoster(previewRows, authCreds);

      if (error) {
        if (error.code === 'REQUIRES_ROSTER_AUTH' || error.message === 'REQUIRES_ROSTER_AUTH') {
          setShowAuthFields(true);
          setErrorMsg('Introduce tus credenciales de usuario del Roster para autorizar el envío.');
        } else {
          console.error("Error enviando al Roster:", error);
          setErrorMsg('Error al enviar al Roster: ' + error.message);
        }
      } else {
        setHasRosterSession(true);
        setShowAuthFields(false);
        setSuccessMsg(`¡${previewRows.length} fila(s) enviada(s) con éxito al Roster!`);

        // Actualizar tallas de equipamiento en la tabla `customers` del ERP
        customerList.forEach(async (cust) => {
          const cfg = customerConfigs[cust.id];
          if (cfg && cust.id) {
            try {
              await supabase.from('customers').update({
                bcd_size: cfg.bcd || null,
                suit_size: cfg.suit || null,
                fins_size: cfg.fins || null,
              }).eq('id', cust.id);
            } catch (err) {
              console.warn('No se pudieron actualizar tallas en ERP para cliente:', cust.id, err);
            }
          }
        });

        setTimeout(() => {
          if (onSuccess) onSuccess(previewRows);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error("Excepción en envío a Roster:", err);
      setErrorMsg('Error inesperado: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Mandar a Roster Diario</h3>
                {hasRosterSession && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Autenticado en Roster</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isSingleCustomer 
                  ? `Cliente: ${formatRosterName(customerList[0].first_name || customerList[0].firstName, customerList[0].last_name || customerList[0].lastName)}`
                  : `Lote de ${customerList.length} clientes seleccionados`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Form */}
        <div className="p-5 space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Mensajes de Alerta */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Autenticación Roster si no hay sesión iniciada */}
          {showAuthFields && !hasRosterSession && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Autorización requerida: Introduce tus credenciales del Roster</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Para cumplir con la política de seguridad RLS, el envío se firmará con tu usuario de Roster (solo una vez).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Email del Roster"
                  value={rosterEmail}
                  onChange={(e) => setRosterEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="password"
                  placeholder="Contraseña del Roster"
                  value={rosterPassword}
                  onChange={(e) => setRosterPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Controles de Grupo (Si hay múltiples clientes) */}
          {!isSingleCustomer && (
            <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4" />
                  <span>Acciones de Grupo (Aplicar a todos los {customerList.length} clientes)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  💡 También puedes modificar la actividad/fecha individual de cada cliente abajo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cambiar fecha a todos */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fijar Fecha a Todos:</label>
                  <input
                    type="date"
                    value={globalDate}
                    onChange={(e) => applyGlobalDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500"
                  />
                </div>

                {/* Cambiar actividad a todos */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fijar Actividad a Todos:</label>
                  <select
                    value={globalActivity}
                    onChange={(e) => applyGlobalActivity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500"
                  >
                    {ACTIVITIES_OPTIONS.map(a => (
                      <option key={a.code} value={a.code} className="bg-slate-900 text-white py-1">
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cambiar Staff a todos */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fijar Staff a Todos:</label>
                  <select
                    value={globalStaff}
                    onChange={(e) => applyGlobalStaff(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500 font-mono"
                  >
                    <option value="" className="bg-slate-900 text-white">-- Sin Instructor --</option>
                    {ROSTER_STAFF_LIST.map(s => (
                      <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Formulario Cliente Único (si solo hay 1) */}
          {isSingleCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Fecha de Inicio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Fecha de Inicio
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={customerConfigs[singleCustomer.id]?.startDate || getTodayStr()}
                    onChange={(e) => updateSingleCustomerConfig(singleCustomer.id, 'startDate', e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={openDatePicker}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                    title="Abrir calendario"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actividad / Curso */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Actividad / Curso
                </label>
                <select
                  value={customerConfigs[singleCustomer.id]?.activityCode || 'FD'}
                  onChange={(e) => updateSingleCustomerConfig(singleCustomer.id, 'activityCode', e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  {ACTIVITIES_OPTIONS.map(a => (
                    <option key={a.code} value={a.code} className="bg-slate-900 text-white py-1">
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Turno Inicial */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Turno Inicial
                </label>
                <select
                  value={customerConfigs[singleCustomer.id]?.shift || 'afternoon'}
                  onChange={(e) => updateSingleCustomerConfig(singleCustomer.id, 'shift', e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="afternoon" className="bg-slate-900 text-white">🌙 Tarde (Afternoon - Predeterminado)</option>
                  <option value="morning" className="bg-slate-900 text-white">☀️ Mañana (Morning - Predeterminado Fun Dives)</option>
                </select>
              </div>

              {/* Staff / Instructor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Staff / Instructor (Opcional)
                </label>
                <select
                  value={customerConfigs[singleCustomer.id]?.staff || ''}
                  onChange={(e) => updateSingleCustomerConfig(singleCustomer.id, 'staff', e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors font-mono"
                >
                  <option value="" className="bg-slate-900 text-white">-- Sin Instructor --</option>
                  {ROSTER_STAFF_LIST.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Previsualización e Edición de Filas por Cliente */}
          <div className="pt-3 border-t border-slate-800 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Previsualización y Edición Individual ({previewRows.length} fila(s))</span>
              </h4>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {customerPreviews.map(({ customer, config, rows }) => (
                <div key={customer.id} className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                  
                  {/* Ficha/Cabecera de Cliente Individual */}
                  <div className="border-b border-slate-800/80 pb-2.5 space-y-2">
                    
                    {/* Línea 1: Nombre (Izquierda) + Act/Fecha/Staff (Derecha) */}
                    <div className="flex items-center justify-between gap-3 flex-nowrap">
                      <span className="font-extrabold text-base sm:text-lg text-white tracking-wide truncate max-w-[220px] sm:max-w-[300px]">
                        {formatRosterName(customer.first_name || customer.firstName, customer.last_name || customer.lastName)}
                      </span>

                      {!isSingleCustomer && (
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm shrink-0">
                          {/* Selector de Actividad Individual (Compacto con Iniciales/Código) */}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-300 font-bold">Act:</span>
                            <select
                              value={config.activityCode || 'FD'}
                              onChange={(e) => updateSingleCustomerConfig(customer.id, 'activityCode', e.target.value)}
                              className="bg-slate-900 text-sky-400 border border-sky-500/40 rounded-lg px-2 py-1 text-xs sm:text-sm font-extrabold focus:outline-none focus:border-sky-400 cursor-pointer"
                              title="Seleccionar Actividad"
                            >
                              {ACTIVITIES_OPTIONS.map(a => (
                                <option key={a.code} value={a.code} className="bg-slate-900 text-white font-mono py-1 font-bold">
                                  {a.code}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Selector de Fecha Individual */}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-300 font-bold">Fecha:</span>
                            <input
                              type="date"
                              value={config.startDate || getTodayStr()}
                              onChange={(e) => updateSingleCustomerConfig(customer.id, 'startDate', e.target.value)}
                              className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          {/* Selector de Staff Individual */}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-300 font-bold">Staff:</span>
                            <select
                              value={config.staff || ''}
                              onChange={(e) => updateSingleCustomerConfig(customer.id, 'staff', e.target.value)}
                              className="bg-slate-900 text-purple-300 border border-purple-500/40 rounded-lg px-2 py-1 text-xs sm:text-sm font-mono font-extrabold focus:outline-none focus:border-purple-400 cursor-pointer"
                            >
                              <option value="" className="bg-slate-900 text-white">--</option>
                              {ROSTER_STAFF_LIST.map(s => (
                                <option key={s} value={s} className="bg-slate-900 text-white font-mono py-1">{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Línea 2: Desplegables de Tallas (Alineadas a la Derecha con Colores Roster) */}
                    <div className="flex items-center justify-end gap-3 text-xs sm:text-sm pt-1 border-t border-slate-800/40">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slate-300 font-bold">BCD:</span>
                        <select
                          value={config.bcd || ''}
                          onChange={(e) => updateSingleCustomerConfig(customer.id, 'bcd', e.target.value)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer transition-colors ${getRosterSizeColor(config.bcd)}`}
                        >
                          <option value="" style={getRosterOptionStyle('')}>--</option>
                          {ROSTER_BCD_SIZES.map(s => (
                            <option key={s} value={s} style={getRosterOptionStyle(s)} className="font-mono py-1 font-bold">{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slate-300 font-bold">Traje:</span>
                        <select
                          value={config.suit || ''}
                          onChange={(e) => updateSingleCustomerConfig(customer.id, 'suit', e.target.value)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer transition-colors ${getRosterSizeColor(config.suit)}`}
                        >
                          <option value="" style={getRosterOptionStyle('')}>--</option>
                          {ROSTER_SUIT_SIZES.map(s => (
                            <option key={s} value={s} style={getRosterOptionStyle(s)} className="font-mono py-1 font-bold">{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slate-300 font-bold">Aletas:</span>
                        <select
                          value={config.fins || ''}
                          onChange={(e) => updateSingleCustomerConfig(customer.id, 'fins', e.target.value)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer transition-colors ${getRosterFinsColor(config.fins)}`}
                        >
                          <option value="" style={getRosterOptionStyle('')}>--</option>
                          {ROSTER_FINS_SIZES.map(s => (
                            <option key={s} value={s} style={getRosterOptionStyle(s)} className="font-mono py-1 font-bold">{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Filas Generadas (Alineación Tabular Fija) */}
                  <div className="space-y-1.5 pt-0.5">
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-colors text-xs sm:text-sm">
                        
                        {/* Columna Fecha */}
                        <div className="w-28 text-center shrink-0">
                          <span className="font-mono text-slate-200 bg-slate-800 px-2.5 py-1 rounded-md text-xs sm:text-sm font-bold border border-slate-700/60 block">
                            {row.date}
                          </span>
                        </div>

                        {/* Columna Turno */}
                        <div className="w-28 text-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const newShift = row.shift === 'morning' ? 'afternoon' : 'morning';
                              updateSingleCustomerConfig(customer.id, 'shift', newShift);
                            }}
                            className={`w-full px-2 py-1 rounded-md font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                              row.shift === 'morning' 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                            }`}
                            title="Hacer clic para cambiar turno"
                          >
                            {row.shift === 'morning' ? '☀️ Mañana' : '🌙 Tarde'}
                          </button>
                        </div>

                        {/* Columna Actividad */}
                        <div className="w-20 text-center shrink-0">
                          <span className={`px-2.5 py-1 rounded-md text-xs sm:text-sm inline-block w-full text-center ${getRosterActivityColor(row.activity)}`}>
                            {row.activity}
                          </span>
                        </div>

                        {/* Columna Nivel */}
                        <div className="w-24 text-center shrink-0 font-mono">
                          {row.level ? (
                            <span className="text-emerald-300 bg-emerald-500/15 px-2 py-1 rounded-md text-xs sm:text-sm font-bold border border-emerald-500/30 inline-block w-full">
                              Lev: {row.level}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">sin nivel</span>
                          )}
                        </div>

                        {/* Columna Instructor y Tallas con Badges de Color Oficial */}
                        <div className="flex-1 flex items-center justify-end space-x-3 text-slate-300 text-xs sm:text-sm font-mono shrink-0 min-w-[220px]">
                          {row.staff ? (
                            <span className="text-purple-300 font-extrabold bg-purple-500/15 px-2 py-1 rounded-md border border-purple-500/30">
                              Inst: {row.staff}
                            </span>
                          ) : null}
                          
                          <div className="flex items-center space-x-1.5 font-mono text-xs sm:text-sm">
                            <span className="text-slate-300 font-bold mr-1">Tallas:</span>
                            <span className={`px-2 py-1 rounded-md text-xs sm:text-sm font-extrabold min-w-[32px] text-center shadow-sm ${getRosterSizeColor(row.bcd)}`}>
                              {row.bcd || '--'}
                            </span>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={`px-2 py-1 rounded-md text-xs sm:text-sm font-extrabold min-w-[32px] text-center shadow-sm ${getRosterSizeColor(row.suit)}`}>
                              {row.suit || '--'}
                            </span>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={`px-2 py-1 rounded-md text-xs sm:text-sm font-extrabold min-w-[32px] text-center shadow-sm ${getRosterFinsColor(row.fins)}`}>
                              {row.fins || '--'}
                            </span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || previewRows.length === 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-lg shadow-sky-600/20 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar al Roster ({previewRows.length})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
