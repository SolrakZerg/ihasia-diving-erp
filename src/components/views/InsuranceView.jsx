import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, Mail, Send, Trash2, Search, AlertCircle, Loader2, ArrowLeft, Activity, UserPlus, Download, Calendar, Edit2, Check, X, Settings } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InsuranceView({ initialSelectedIds, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [paxBalance, setPaxBalance] = useState(0);
  const [targetEmails, setTargetEmails] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [contractTitle, setContractTitle] = useState('EFF. 18/10/2024-2025 ( 200 Pax )');
  const [customers, setCustomers] = useState([]);
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ first_name: '', last_name: '', passport_number: '' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ emails: '', addPax: 0, durationDays: 30, contractTitle: '' });
  const [historyBatches, setHistoryBatches] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Async Search for adding manually
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addResults, setAddResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (addSearchQuery.length < 2) {
      setAddResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      let query = supabase.from('customers').select('id, first_name, last_name, passport_number, booking_date');
      
      const terms = addSearchQuery.trim().split(/\s+/).filter(t => t.length > 0);
      terms.forEach(term => {
        query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,passport_number.ilike.%${term}%`);
      });
      
      const { data } = await query.limit(5);
      setAddResults(data || []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [addSearchQuery]);
  
  useEffect(() => {
    fetchInitialData();
  }, [initialSelectedIds]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*');
        
      if (settingsError) throw settingsError;
      
      if (settingsData) {
        const paxRow = settingsData.find(row => row.key === 'insurance_pax_balance');
        const emailsRow = settingsData.find(row => row.key === 'insurance_emails');
        const durationRow = settingsData.find(row => row.key === 'insurance_duration_days');
        const titleRow = settingsData.find(row => row.key === 'insurance_contract_title');
        
        setPaxBalance(paxRow ? Number(paxRow.value) : 0);
        setTargetEmails(emailsRow ? String(emailsRow.value) : '');
        setDurationDays(durationRow ? Number(durationRow.value) : 30);
        if (titleRow) setContractTitle(titleRow.value);
      }

      // 1.5 Fetch history batches
      const { data: histData } = await supabase.from('insurance_batches').select('*').order('created_at', { ascending: false }).limit(10);
      if (histData) setHistoryBatches(histData);

      // 2. Fetch customers based strictly on localStorage + passed initialSelectedIds
      let savedIds = [];
      try { savedIds = JSON.parse(localStorage.getItem('antigravity_insurance_queue') || '[]'); } catch(e){}
      
      const toFetch = new Set([...savedIds, ...(initialSelectedIds || [])]);
      const fetchArr = Array.from(toFetch);
      
      if (fetchArr.length > 0) {
        const { data, error } = await supabase.from('customers').select('*').in('id', fetchArr);
        if (error) throw error;
        
        const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setCustomers(sorted);
        localStorage.setItem('antigravity_insurance_queue', JSON.stringify(sorted.map(c => c.id)));
      } else {
        setCustomers([]);
      }

    } catch (error) {
      console.error('Error fetching insurance data:', error);
      showToast('Error cargando datos: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayCustomers = async () => {
    setProcessing(true);
    try {
      const todayTemp = new Date();
      const offset = todayTemp.getTimezoneOffset();
      const today = new Date(todayTemp.getTime() - (offset*60*1000)).toISOString().split('T')[0];

      const { data, error } = await supabase.from('customers').select('*').eq('booking_date', today);
      if (error) throw error;
      
      const newCustomers = [...customers];
      let changes = 0;
      data.forEach(d => {
        if (!newCustomers.find(c => c.id === d.id)) {
          newCustomers.push(d);
          changes++;
        }
      });
      
      if (changes > 0) {
        setCustomers([...newCustomers]);
        localStorage.setItem('antigravity_insurance_queue', JSON.stringify(newCustomers.map(c => c.id)));
        showToast(`Se añadieron ${changes} buceadores nuevos de hoy.`);
      } else {
        showToast('Todos los buceadores de hoy ya están en la lista.', 'success');
      }
    } catch (error) {
      showToast('Error cargando reservas: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const syncToLocalStorage = (newCustomers) => {
    setCustomers(newCustomers);
    localStorage.setItem('antigravity_insurance_queue', JSON.stringify(newCustomers.map(c => c.id)));
  };

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase.from('customers').update({
        first_name: editData.first_name.trim(),
        last_name: editData.last_name.trim(),
        passport_number: editData.passport_number.trim()
      }).eq('id', id);

      if (error) throw error;
      
      const updatedCustomers = customers.map(c => 
        c.id === id ? { ...c, first_name: editData.first_name.trim(), last_name: editData.last_name.trim(), passport_number: editData.passport_number.trim() } : c
      );
      
      syncToLocalStorage(updatedCustomers);
      setEditingId(null);
      showToast('Datos corregidos y guardados.', 'success');
    } catch (error) {
      showToast('Error al actualizar datos: ' + error.message, 'error');
    }
  };

  const handleSaveSettings = async () => {
    setProcessing(true);
    try {
      const newPax = parseInt(settingsForm.addPax) || 0;
      const updatedPax = paxBalance + newPax;
      
      const updates = [
        { key: 'insurance_pax_balance', value: updatedPax, updated_at: new Date().toISOString() },
        { key: 'insurance_emails', value: settingsForm.emails, updated_at: new Date().toISOString() },
        { key: 'insurance_duration_days', value: settingsForm.durationDays || 30, updated_at: new Date().toISOString() },
        { key: 'insurance_contract_title', value: settingsForm.contractTitle || 'EFF. 18/10/2024-2025 ( 200 Pax )', updated_at: new Date().toISOString() }
      ];

      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      
      setPaxBalance(updatedPax);
      setTargetEmails(settingsForm.emails);
      setDurationDays(settingsForm.durationDays || 30);
      setContractTitle(settingsForm.contractTitle || 'EFF. 18/10/2024-2025 ( 200 Pax )');
      setShowSettingsModal(false);
      showToast('Configuración guardada correctamente.', 'success');
    } catch (error) {
      showToast('Error al guardar: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCustomer = (id) => {
    syncToLocalStorage(customers.filter(c => c.id !== id));
  };
  
  const handleGenerateAndSend = async () => {
    setProcessing(true);
    try {
      if (!targetEmails || customers.length === 0) {
        throw new Error('No hay clientes seleccionados o no has configurado destinatarios.');
      }

      showToast('📄 Preparando PDF de alta de seguros...', 'success');

      // 1. GENERAR PDF (Moderno - Optimizado y Compacto)
      const doc = new jsPDF({ orientation: 'portrait' });
      
      // Construir Cabecera Moderna
      doc.setFontSize(22);
      doc.setTextColor(0, 102, 204);
      doc.text('Ihasia Diving Koh Tao', 14, 22);
      
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text(contractTitle || 'Daily Insurance Report', 14, 32);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString('es-ES')}`, 14, 40);

      // 2. CONSTRUIR TABLA
      const tableHead = [
        ["#", "Name", "Surname", "Gen.", "Passport", "Start", "End"]
      ];
      const tableRows = [];
      let currentPaxTracker = paxBalance;

      // Datos de Clientes (Solo los que hay)
      for (let i = 0; i < customers.length; i++) {
        const d = customers[i];
        
        const startObj = new Date();
        const startStr = startObj.toLocaleDateString('es-ES');
        
        const endObj = new Date();
        endObj.setDate(endObj.getDate() + (durationDays - 1));
        const endStr = endObj.toLocaleDateString('es-ES');

        tableRows.push([
          String(currentPaxTracker),
          (d.first_name || '').trim(),
          (d.last_name || '').trim(),
          d.gender?.[0]?.toUpperCase() || 'M',
          d.passport_number || 'S/P',
          startStr,
          endStr
        ]);
        currentPaxTracker--;
      }

      // Fila de Total final incrustada
      tableRows.push([
        "",
        "TOTAL:",
        String(customers.length) + " PAX",
        "",
        "",
        "",
        ""
      ]);

      autoTable(doc, {
        startY: 48,
        head: tableHead,
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], halign: 'center' },
        styles: { fontSize: 10, cellPadding: 2, textColor: [50, 50, 50] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
          1: { cellWidth: 38 },
          2: { cellWidth: 42 },
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'center', cellWidth: 28 },
          5: { halign: 'center', cellWidth: 23 },
          6: { halign: 'center', cellWidth: 23 }
        },
        didParseCell: function(data) {
          // Destacar un poco la fila de TOTAL al final
          if (data.row.index === customers.length && data.section === 'body') {
            data.cell.styles.fillColor = [240, 245, 250];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [0, 102, 204];
            if (data.column.index === 1) data.cell.styles.halign = 'right';
          }
        }
      });

      const pdfBlob = doc.output('blob');
      const safeName = new Date().toISOString().split('T')[0] + '_' + Date.now();
      const fileName = `seguros_${safeName}.pdf`;

      // 3. Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('insurance_pdfs')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf'
        });

      if (uploadError) throw uploadError;

      const filePath = uploadData.path;
      showToast('☁️ PDF subido a la nube. Actualizando bases de datos...', 'success');

      // 4. Enviar Email llamando a la Edge Function
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-insurance', {
        body: { 
          filePath, 
          targetEmails: targetEmails.split(',').map(e => e.trim()).filter(Boolean),
          paxCount: customers.length 
        }
      });

      if (edgeError) throw new Error("Error en Edge Function: " + edgeError.message);
      if (edgeData?.success === false) throw new Error("Error alojado: " + edgeData.error);

      // 4. Restar PAX en settings
      const newBalance = paxBalance - customers.length;
      const updates = [
        { key: 'insurance_pax_balance', value: newBalance, updated_at: new Date().toISOString() }
      ];
      const { error: settingsError } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (settingsError) console.error("Error restando PAX:", settingsError);

      // 5. Actualizar Clientes sumando los días de duración al día de hoy
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() + (durationDays - 1)); // Si es 1 dia, expira hoy noche. Si son 2 dias, expira mañana.
      const expiryDateStr = todayDate.toISOString().split('T')[0];

      await Promise.all(customers.map(async (c) => {
        return supabase.from('customers').update({ insurance_expiry: expiryDateStr }).eq('id', c.id);
      }));

      // 6. Crear registro en Historial
      const { data: insertedBatch } = await supabase.from('insurance_batches').insert([{
        pdf_url: filePath,
        total_pax: customers.length,
        recipients: targetEmails
      }]).select().single();
      
      if (insertedBatch) {
        setHistoryBatches(prev => [insertedBatch, ...prev].slice(0, 10));
      }

      // 7. Limpiar UI
      syncToLocalStorage([]);
      setPaxBalance(newBalance);
      
      showToast('✅ ¡Seguros generados, guardados y descontados correctamente!', 'success');

    } catch (error) {
      showToast('Error: ' + error.message, 'error');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddDirectly = async (customerMin) => {
    if (customers.find(c => c.id === customerMin.id)) {
      setAddSearchQuery('');
      return; // Already in list
    }
    const { data } = await supabase.from('customers').select('*').eq('id', customerMin.id).maybeSingle();
    if (data) syncToLocalStorage([data, ...customers]);
    setAddSearchQuery('');
    setAddResults([]);
  };
  
  const filteredCustomers = customers.filter(c => 
    ((c.first_name || '') + ' ' + (c.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.passport_number && c.passport_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getExpiryWarning = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    if (expiry > now) {
      return (
        <span className="text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 mt-1 w-fit">
          <AlertCircle className="w-3 h-3" /> Seguro Activo hasta {expiry.toLocaleDateString('es-ES')}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col h-[calc(100vh-40px)] overflow-hidden">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 flex-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('customers')}
            className="w-10 h-10 rounded-full bg-surface-soft border border-surface-edge flex items-center justify-center text-gray-400 hover:text-white transition-all transform hover:-translate-x-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-brand" />
              Seguros Diarios
            </h1>
            <p className="text-gray-400">Automatización y envío de PDFs a la aseguradora</p>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-inner">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Pax Restantes</p>
            <p className={`text-3xl font-black ${paxBalance < 25 ? 'text-rose-500 animate-pulse' : 'text-brand'}`}>
              {paxBalance}
            </p>
          </div>
          
          <div className="w-px h-12 bg-surface-edge mx-2"></div>
          
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Destinatarios
            </p>
            <p className="text-sm font-semibold text-brand max-w-[200px] truncate" title={targetEmails}>
              {targetEmails || 'Sin configurar'}
            </p>
          </div>
          
          <div className="w-px h-12 bg-surface-edge mx-2"></div>
          
          <button
            onClick={() => {
              setSettingsForm({ emails: targetEmails, addPax: 0, durationDays: durationDays, contractTitle: contractTitle });
              setShowSettingsModal(true);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-edge/30 text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
            title="Ajustes de envío y recargo de plazas"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row gap-6 min-h-0 relative">
        {/* Main List Area - "The Box" */}
        <div className="flex-1 bg-surface-soft border border-surface-edge shadow-xl rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none">
            <h3 className="font-bold text-white flex items-center gap-2">Lista a Enviar ({customers.length})</h3>
            
            <div className="flex gap-3 items-center">
              {/* Add directly inline search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Añadir a alguien..." 
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    className="bg-surface/50 border border-brand/30 rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-brand w-[360px] transition-colors shadow-inner"
                  />
                  
                  {/* Search Results Dropdown */}
                  {addSearchQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-edge rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto w-full">
                      {isSearching ? (
                        <div className="p-3 text-center text-gray-500 text-xs">Buscando...</div>
                      ) : addResults.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-xs">Sin resultados</div>
                      ) : (
                        <div className="py-1">
                          {addResults.map(res => (
                            <button
                              key={res.id}
                              onClick={() => handleAddDirectly(res)}
                              className="w-full text-left px-3 py-2 hover:bg-brand/10 transition-colors flex flex-row items-center justify-between gap-3"
                            >
                              <span className="text-sm font-semibold text-white capitalize flex-1 truncate pr-2">{res.first_name} {res.last_name}</span>
                              <div className="flex flex-col items-end shrink-0 w-20">
                                <span className="text-[12px] text-brand font-mono font-bold uppercase">
                                  {res.passport_number || 'S/P'}
                                </span>
                                {res.booking_date ? (
                                  <span className="text-[12px] text-gray-400 font-mono mt-0.5">
                                    {new Date(res.booking_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                                  </span>
                                ) : (
                                  <span className="text-[12px] text-gray-600 font-mono mt-0.5">-</span>
                                )}
                              </div>
                            </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-surface-edge mx-1"></div>

              <div className="relative group/filter">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Filtrar en la lista..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface/50 border border-surface-edge rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-surface-edge hover:border-gray-500 w-48 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto relative custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-sm text-gray-500">Cargando datos...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 pt-8">
                <ShieldCheck className="w-12 h-12 opacity-20 mb-4" />
                <p>No tienes a nadie preparado en la bandeja de salida de seguros.</p>
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={loadTodayCustomers}
                    disabled={processing}
                    className="flex items-center gap-2 bg-surface border border-brand/50 text-brand px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand/10 transition-colors"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Cargar Reservas de Hoy
                  </button>
                  <button 
                    onClick={() => onNavigate('customers')}
                    className="flex items-center gap-2 bg-surface border border-surface-edge text-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-edge transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Buscador Avanzado
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buceador y Registro</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Gen.</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-48">Pasaporte / ID</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-edge/20">
                  {filteredCustomers.map(customer => editingId === customer.id ? (
                    <tr key={customer.id} className="bg-brand/5 border-l-2 border-brand">
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <input value={editData.first_name} onChange={e=>setEditData({...editData, first_name: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-3 py-1.5 text-sm text-white w-full focus:border-brand focus:outline-none" placeholder="Nombre" />
                          <input value={editData.last_name} onChange={e=>setEditData({...editData, last_name: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-3 py-1.5 text-sm text-white w-full focus:border-brand focus:outline-none" placeholder="Apellidos" />
                        </div>
                      </td>
                      
                      <td className="px-6 py-3 text-center text-gray-500 font-bold uppercase text-sm">
                        {customer.gender?.[0] || '-'}
                      </td>

                      <td className="px-6 py-3">
                        <input value={editData.passport_number} onChange={e=>setEditData({...editData, passport_number: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-3 py-1.5 font-mono text-[13px] text-brand-light w-full uppercase focus:border-brand focus:outline-none text-center" placeholder="Pasaporte" />
                      </td>

                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          <button onClick={() => saveEdit(customer.id)} title="Guardar cambios" className="p-1.5 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/30"> <Check className="w-4 h-4" /> </button>
                          <button onClick={() => setEditingId(null)} title="Cancelar" className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-edge rounded-lg transition-colors border border-transparent"> <X className="w-4 h-4" /> </button>
                        </div>
                      </td>
                    </tr>
                ) : (
                    <tr key={customer.id} className="hover:bg-brand/5 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex flex-col justify-center min-w-0">
                          <p className="font-bold text-white text-[15px] capitalize truncate">
                            {(customer.first_name || '') + ' ' + (customer.last_name || '')}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {customer.booking_date && (
                              <p className="text-[11px] text-cyan-500/80 font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> 
                                {new Date(customer.booking_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                              </p>
                            )}
                            {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0,0,0,0)) && (
                              <span className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider">
                                <AlertCircle className="w-3 h-3" /> Seguro Activo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-3 text-center text-gray-500 font-bold uppercase text-sm">
                        {customer.gender?.[0] || '-'}
                      </td>

                      <td className="px-6 py-3 text-center">
                        <p className="text-[15px] text-brand-light font-mono font-bold tracking-wider">
                          {customer.passport_number || 'N/A'}
                        </p>
                      </td>

                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(customer.id);
                              setEditData({ first_name: customer.first_name || '', last_name: customer.last_name || '', passport_number: customer.passport_number || '' });
                            }}
                            className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                            title="Corregir datos"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveCustomer(customer.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Quitar de la lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-4 border-t border-surface-edge bg-surface/50 flex justify-between items-center flex-none">
            
            <button 
              onClick={loadTodayCustomers}
              disabled={processing || loading}
              title="Añadir a la lista todos los registrados para hoy"
              className="text-xs text-brand border border-brand/30 bg-brand/5 hover:bg-brand/20 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors"
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Cargar Reservas de Hoy
            </button>

            <div className="flex items-center gap-6">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-brand" /> Se descontarán {customers.length} plazas
              </p>
              <button 
                disabled={customers.length === 0 || processing}
                onClick={handleGenerateAndSend}
                className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-light transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Generar y Enviar Seguros
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar for History */}
        <div className="w-64 bg-surface-soft border border-surface-edge shadow-xl rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-edge bg-surface-soft/50">
            <h3 className="font-bold text-white text-sm">Historial Reciente</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Últimos envíos</p>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
            {historyBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center mt-12">
                <Activity className="w-8 h-8 text-surface-edge mb-3" />
                <p className="text-xs text-gray-500">Aún no hay envíos recientes.</p>
              </div>
            ) : (
              <div className="w-full space-y-3">
                {historyBatches.map(batch => (
                  <div key={batch.id} className="bg-surface border border-surface-edge p-3 rounded-xl hover:border-brand/30 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-brand font-bold">
                          {new Date(batch.created_at).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(batch.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {batch.total_pax} PAX
                      </span>
                    </div>
                    {batch.pdf_url && (
                      <button 
                        onClick={async () => {
                          const { data } = await supabase.storage.from('insurance_pdfs').createSignedUrl(batch.pdf_url, 60);
                          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        }}
                        className="w-full mt-2 bg-surface-soft border border-surface-edge text-gray-400 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:text-white hover:bg-surface-edge transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Ver PDF Generado
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-edge shadow-brand/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand" /> 
              Configuración de Seguros
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Correos de destino
                </label>
                <input 
                  type="text" 
                  value={settingsForm.emails}
                  onChange={(e) => setSettingsForm({...settingsForm, emails: e.target.value})}
                  placeholder="admin@ejemplo.com, otro@ejec.com"
                  className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">Pudes separar varios correos con comas.</p>
              </div>

              <div className="p-4 rounded-xl bg-brand/5 border border-brand/20">
                <label className="block text-xs uppercase tracking-wider text-brand font-bold mb-2">
                  Recargar Plazas de Seguro (PAX)
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">Saldo actual en base de datos: <strong className="text-white">{paxBalance}</strong></p>
                    <input 
                      type="number" 
                      min="0"
                      value={settingsForm.addPax || ''}
                      onChange={(e) => setSettingsForm({...settingsForm, addPax: parseInt(e.target.value) || 0})}
                      placeholder="Ej: Sumar 100 plazas..."
                      className="w-full bg-surface border border-brand/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Días de duración del seguro
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={settingsForm.durationDays || 30}
                  onChange={(e) => setSettingsForm({...settingsForm, durationDays: parseInt(e.target.value) || 30})}
                  className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">
                  Cabecera (Contrato de Seguro Activo)
                </label>
                <input 
                  type="text" 
                  value={settingsForm.contractTitle || ''}
                  onChange={(e) => setSettingsForm({...settingsForm, contractTitle: e.target.value})}
                  placeholder="Ej: EFF. 18/10/2024-2025 ( 200 Pax )"
                  className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-surface-edge transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-light flex items-center gap-2 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`backdrop-blur-xl rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl border ${
            toast.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
              : 'bg-brand/10 border-brand/30 text-brand-light'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <ShieldCheck className="w-5 h-5 flex-shrink-0" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
