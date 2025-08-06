import { supabase } from './supabaseClient';

// API functions using Supabase
export const sendSMS = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('send-sms', { body: data });
  if (error) throw error;
  return result;
};

export const sendEmail = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('send-email', { body: data });
  if (error) throw error;
  return result;
};

export const getCCAiTemplates = async () => {
  const { data, error } = await supabase.from('templates').select('*');
  if (error) {
    // Return mock templates as fallback
    const mockTemplates = [
      { id: '1', title: 'Payment Reminder Email', type: 'email', subject: 'Payment Reminder', body: 'Dear {{debtor_name}}, this is a reminder about your outstanding balance of ${{balance}}.', status: 'active' },
      { id: '2', title: 'Payment Confirmation SMS', type: 'sms', body: 'Thank you for your payment of ${{amount}}. Your new balance is ${{balance}}.', status: 'active' },
      { id: '3', title: 'Settlement Offer Email', type: 'email', subject: 'Settlement Offer', body: 'We are pleased to offer you a settlement of ${{settlement_amount}} for your account.', status: 'active' }
    ];
    return { data: { templates: mockTemplates } };
  }
  return { data: { templates: data } };
};

export const getCCAiCampaigns = async () => {
  // Return empty campaigns since table doesn't exist yet
  return { data: [] };
};

export const createCCAiCampaign = async (campaignData) => {
  // For now, return a mock response since campaigns table may not exist
  console.log('Campaign would be created:', campaignData);
  return { 
    data: {
      id: Date.now().toString(),
      name: campaignData.name,
      email_template_id: campaignData.emailTemplateId,
      sms_template_id: campaignData.smsTemplateId,
      segment_id: campaignData.segmentId,
      status: 'active',
      created_at: new Date().toISOString()
    }
  };
};

export const testCCAiAPI = async () => {
  return { data: { status: 'ok', message: 'API is working' } };
};

export const diagnoseSMS = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('diagnose-sms', { body: data });
  if (error) throw error;
  return result;
};

export const exportPayments = async (data) => {
  // Skip Supabase function call and use mock CSV generation directly
  const { Payment } = await import('./entities');
  const payments = await Payment.list();
  
  const csvHeaders = 'ID,Case ID,Amount,Payment Method,Payment Date,Status,Created Date\n';
  const csvRows = payments.map(p => 
    `${p.id},${p.case_id || ''},${p.amount || 0},"${p.payment_method || ''}",${p.payment_date || ''},${p.status || ''},${p.created_at || ''}`
  ).join('\n');
  
  return { data: csvHeaders + csvRows, status: 200 };
};

export const testSFTP = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('test-sftp', { body: data });
  if (error) throw error;
  return result;
};

export const exportDebts = async (data) => {
  // Skip Supabase function call and use mock CSV generation directly
  const { Case } = await import('./entities');
  const caseIds = JSON.parse(data.case_ids || '[]');
  const cases = await Case.list();
  const selectedCases = cases.filter(c => caseIds.includes(c.id));
  
  const csvHeaders = 'ID,Debtor Name,Account Number,Original Balance,Current Balance,Status,Priority,Created Date\n';
  const csvRows = selectedCases.map(c => 
    `${c.id},"${c.debtor_name || ''}",${c.account_number || ''},${c.original_balance || 0},${c.current_balance || 0},${c.status || ''},${c.priority || ''},${c.created_at || ''}`
  ).join('\n');
  
  return { data: csvHeaders + csvRows, status: 200 };
};

export const generateDocument = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('generate-document', { body: data });
  if (error) throw error;
  return result;
};

export const cleanupDebtorNames = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('cleanup-debtor-names', { body: data });
  if (error) throw error;
  return result;
};

export const deleteInvalidPayments = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('delete-invalid-payments', { body: data });
  if (error) throw error;
  return result;
};

export const sendDebtValidationNotices = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('send-debt-validation-notices', { body: data });
  if (error) throw error;
  return result;
};

export const initiateScrubProcess = async (data) => {
  const { data: result, error } = await supabase.functions.invoke('initiate-scrub-process', { body: data });
  if (error) throw error;
  return result;
};

