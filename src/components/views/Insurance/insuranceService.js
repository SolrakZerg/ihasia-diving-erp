import { supabase } from '../../../lib/supabaseClient';

export const fetchInsuranceConfig = async () => {
  const { data, error } = await supabase
    .from('insurance_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const fetchHistoryBatches = async () => {
  const { data, error } = await supabase
    .from('insurance_batches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) throw error;
  return data;
};

export const fetchCustomersByIds = async (ids) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return data;
};

export const fetchTodayCustomers = async (todayStr) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('booking_date', todayStr);
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id, editData) => {
  const { error } = await supabase
    .from('customers')
    .update({
      first_name: editData.first_name.trim(),
      last_name: editData.last_name.trim(),
      passport_number: editData.passport_number.trim()
    })
    .eq('id', id);
  if (error) throw error;
};

export const updateInsuranceConfig = async (paxBalance, emails, durationDays, contractTitle) => {
  const { error } = await supabase
    .from('insurance_config')
    .update({ 
      pax_balance: paxBalance, 
      target_emails: emails,
      duration_days: durationDays || 30,
      contract_title: contractTitle || 'EFF. 18/10/2024-2025 ( 200 Pax )',
      updated_at: new Date().toISOString() 
    })
    .eq('id', 1);
  if (error) throw error;
};

export const uploadPDF = async (fileName, pdfBlob) => {
  const { data, error } = await supabase
    .storage
    .from('insurance_pdfs')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf'
    });
  if (error) throw error;
  return data;
};

export const sendInsuranceEmail = async (filePath, targetEmails, paxCount) => {
  const { data, error } = await supabase.functions.invoke('send-insurance', {
    body: { 
      filePath, 
      targetEmails: targetEmails.split(',').map(e => e.trim()).filter(Boolean),
      paxCount 
    }
  });
  if (error) throw error;
  return data;
};

export const updateCustomersExpiry = async (customerIds, expiryDateStr) => {
  const results = await Promise.all(customerIds.map(async (id) => {
    return supabase.from('customers').update({ insurance_expiry: expiryDateStr }).eq('id', id);
  }));
  return results;
};

export const createInsuranceBatch = async (filePath, totalPax, recipients, customerList) => {
  const { data, error } = await supabase
    .from('insurance_batches')
    .insert([{
      pdf_url: filePath,
      total_pax: totalPax,
      recipients: recipients,
      customer_list: customerList
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};
