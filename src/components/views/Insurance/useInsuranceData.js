import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import * as insuranceService from './insuranceService';
import { generateInsurancePDF } from './generateInsurancePDF';

export const useInsuranceData = (initialSelectedIds) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [paxBalance, setPaxBalance] = useState(0);
  const [targetEmails, setTargetEmails] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [contractTitle, setContractTitle] = useState('EFF. 18/10/2024-2025 ( 200 Pax )');
  const [customers, setCustomers] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ first_name: '', last_name: '', passport_number: '' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ emails: '', addPax: 0, durationDays: 30, contractTitle: '', paxBalance: 0 });
  const [historyBatches, setHistoryBatches] = useState([]);

  // Async Search for adding manually
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addResults, setAddResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (addSearchQuery.length < 2) {
      setAddResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const q = addSearchQuery.trim();
      
      try {
        // Buscar clientes usando la función RPC de Supabase
        const { data } = await supabase.rpc('search_customers_v3', { query_text: q });
        setAddResults(data || []);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addSearchQuery]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const config = await insuranceService.fetchInsuranceConfig();
      if (config) {
        setPaxBalance(config.pax_balance || 0);
        setTargetEmails(config.target_emails || '');
        setDurationDays(config.duration_days || 30);
        setContractTitle(config.contract_title || 'EFF. 18/10/2024-2025 ( 200 Pax )');
      }

      const histData = await insuranceService.fetchHistoryBatches();
      if (histData) setHistoryBatches(histData);

      let savedIds = [];
      try { savedIds = JSON.parse(localStorage.getItem('antigravity_insurance_queue') || '[]'); } catch(e){}
      
      const toFetch = new Set([...savedIds, ...(initialSelectedIds || [])]);
      const fetchArr = Array.from(toFetch);
      
      if (fetchArr.length > 0) {
        const data = await insuranceService.fetchCustomersByIds(fetchArr);
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

      const data = await insuranceService.fetchTodayCustomers(today);
      
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
      await insuranceService.updateCustomer(id, editData);
      
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
      const updatedPax = (parseInt(settingsForm.paxBalance) || 0) + newPax;
      
      await insuranceService.updateInsuranceConfig(updatedPax, settingsForm.emails, settingsForm.durationDays, settingsForm.contractTitle);

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

      // 1. GENERAR PDF
      const pdfBlob = generateInsurancePDF(customers, contractTitle, paxBalance, durationDays);

      const safeName = new Date().toISOString().split('T')[0] + '_' + Date.now();
      const fileName = `seguros_${safeName}.pdf`;

      // 3. Subir a Supabase Storage
      const uploadData = await insuranceService.uploadPDF(fileName, pdfBlob);
      const filePath = uploadData.path;
      showToast('☁️ PDF subido a la nube. Actualizando bases de datos...', 'success');

      // 4. Enviar Email
      await insuranceService.sendInsuranceEmail(filePath, targetEmails, customers.length);

      // 4. Restar PAX en config
      const newBalance = paxBalance - customers.length;
      await insuranceService.updateInsuranceConfig(newBalance, targetEmails, durationDays, contractTitle);

      // 5. Actualizar Clientes
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() + (durationDays - 1));
      const expiryDateStr = todayDate.toISOString().split('T')[0];

      await insuranceService.updateCustomersExpiry(customers.map(c => c.id), expiryDateStr);

      // 6. Crear registro en Historial
      const customerList = customers.map(c => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
      }));

      const insertedBatch = await insuranceService.createInsuranceBatch(filePath, customers.length, targetEmails, customerList);
      
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
      return;
    }
    const data = await insuranceService.fetchCustomersByIds([customerMin.id]);
    if (data && data[0]) syncToLocalStorage([data[0], ...customers]);
    setAddSearchQuery('');
    setAddResults([]);
  };

  const filteredCustomers = customers.filter(c => 
    ((c.first_name || '') + ' ' + (c.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.passport_number && c.passport_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return {
    loading,
    processing,
    paxBalance,
    targetEmails,
    durationDays,
    contractTitle,
    customers,
    searchTerm,
    setSearchTerm,
    toast,
    showToast,
    editingId,
    setEditingId,
    editData,
    setEditData,
    showSettingsModal,
    setShowSettingsModal,
    settingsForm,
    setSettingsForm,
    historyBatches,
    addSearchQuery,
    setAddSearchQuery,
    addResults,
    isSearching,
    loadTodayCustomers,
    saveEdit,
    handleSaveSettings,
    handleRemoveCustomer,
    handleGenerateAndSend,
    handleAddDirectly,
    filteredCustomers
  };
};
