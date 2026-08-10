import { supabase } from '../../../lib/supabaseClient';

export const uploadNominasPDF = async (fileName, pdfBlob) => {
  const { data, error } = await supabase
    .storage
    .from('insurance_pdfs')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
  if (error) throw error;
  return data;
};

export const sendNominasEmail = async ({ filePath, targetEmails, instructorName, monthName, year }) => {
  const emailsArray = Array.isArray(targetEmails) 
    ? targetEmails 
    : targetEmails.split(',').map(e => e.trim()).filter(Boolean);

  if (emailsArray.length === 0) {
    throw new Error('No se han especificado destinatarios válidos.');
  }

  const { data, error } = await supabase.functions.invoke('send-insurance', {
    body: { 
      filePath, 
      targetEmails: emailsArray,
      paxCount: 1,
      subject: `Informe de Nómina – ${instructorName} (${monthName} ${year})`,
      text: `Hola,\n\nAdjunto se encuentra el informe mensual de nómina correspondiente a ${instructorName} para el período ${monthName} ${year}.\n\nUn saludo,\nIhasia Diving Koh Tao`
    }
  });

  if (error) throw error;
  return data;
};
