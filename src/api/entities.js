import { supabase } from './supabaseClient';

// Basic schemas for entities
const schemas = {
  cases: {
    properties: {
      id: { type: 'string' },
      portfolio_id: { type: 'string' },
      debtor_name: { type: 'string' },
      account_number: { type: 'string' },
      face_value: { type: 'number' },
      current_balance: { type: 'number' },
      original_creditor: { type: 'string' },
      charge_off_date: { type: 'string' },
      last_payment_date: { type: 'string' },
      status: { type: 'string' },
      created_at: { type: 'string' },
      updated_at: { type: 'string' }
    }
  },
  campaigns: {
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      emailTemplateId: { type: 'string' },
      smsTemplateId: { type: 'string' },
      segmentId: { type: 'string' },
      status: { type: 'string' },
      created_at: { type: 'string' }
    }
  }
};

// Load mock data from localStorage or use defaults
const loadMockData = () => {
  const stored = localStorage.getItem('ccai_mock_data');
  if (stored) {
    return JSON.parse(stored);
  }
  return getDefaultMockData();
};

const saveMockData = (data) => {
  localStorage.setItem('ccai_mock_data', JSON.stringify(data));
};

const getDefaultMockData = () => ({
  vendors: [
    { id: '1', name: 'Smith & Associates Law Firm', type: 'law_firm', contact_person: 'John Smith', email: 'john@smithlaw.com', phone: '555-0101', status: 'active', created_at: '2024-01-15T10:00:00Z' },
    { id: '2', name: 'ABC Collection Agency', type: 'collection_agency', contact_person: 'Sarah Johnson', email: 'sarah@abccollect.com', phone: '555-0102', status: 'active', created_at: '2024-01-20T10:00:00Z' },
    { id: '3', name: 'TechServ Solutions', type: 'technology', contact_person: 'Mike Davis', email: 'mike@techserv.com', phone: '555-0103', status: 'inactive', created_at: '2024-02-01T10:00:00Z' }
  ],
  portfolios: [
    { id: '1', name: 'Q1 2024 Medical Debt', client: 'MedCorp LLC', portfolio_type: 'committed', status: 'active', created_at: '2024-01-10T10:00:00Z' },
    { id: '2', name: 'Credit Card Portfolio A', client: 'FinanceFirst LLC', portfolio_type: 'spec', status: 'active', created_at: '2024-02-15T10:00:00Z' },
    { id: '3', name: 'Auto Loan Defaults', client: 'AutoCredit LLC', portfolio_type: 'committed', status: 'completed', created_at: '2024-03-01T10:00:00Z' }
  ],
  cases: [
    { id: '1', portfolio_id: '1', debtor_id: '1', debtor_name: 'John Doe', account_number: 'MED001', original_balance: 2500, current_balance: 2500, original_creditor: 'City Hospital', charge_off_date: '2024-01-01', status: 'new', priority: 'medium', created_at: '2024-01-10T10:00:00Z' },
    { id: '2', portfolio_id: '1', debtor_id: '2', debtor_name: 'Jane Smith', account_number: 'MED002', original_balance: 1800, current_balance: 1800, original_creditor: 'City Hospital', charge_off_date: '2023-12-15', status: 'in_collection', priority: 'high', created_at: '2024-01-10T10:00:00Z' },
    { id: '3', portfolio_id: '2', debtor_id: '3', debtor_name: 'Bob Johnson', account_number: 'CC001', original_balance: 3200, current_balance: 3200, original_creditor: 'National Bank', charge_off_date: '2023-11-01', status: 'payment_plan', priority: 'medium', created_at: '2024-02-15T10:00:00Z' },
    { id: '4', portfolio_id: '2', debtor_id: '4', debtor_name: 'Alice Brown', account_number: 'CC002', original_balance: 1500, current_balance: 750, original_creditor: 'National Bank', charge_off_date: '2023-10-15', status: 'paid', priority: 'low', created_at: '2024-02-15T10:00:00Z' },
    { id: '5', portfolio_id: '3', debtor_id: '5', debtor_name: 'Charlie Wilson', account_number: 'AUTO001', original_balance: 15000, current_balance: 12000, original_creditor: 'Car Finance Co', charge_off_date: '2023-08-01', status: 'settled', priority: 'high', created_at: '2024-03-01T10:00:00Z' },
    { id: '6', portfolio_id: '1', debtor_id: '6', debtor_name: 'Sarah Chen', account_number: 'ACC-20241201-5678', original_balance: 12000, current_balance: 13500, original_creditor: 'Wells Fargo', charge_off_date: '2023-09-21', status: 'legal_action', priority: 'high', created_at: '2024-01-10T10:00:00Z' }
  ],
  debtors: [
    { id: '1', name: 'John Doe', email: 'john.doe@email.com', phone: '555-1001', created_at: '2024-01-05T10:00:00Z' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', phone: '555-1002', created_at: '2024-01-05T10:00:00Z' },
    { id: '3', name: 'Bob Johnson', email: 'bob.johnson@email.com', phone: '555-1003', created_at: '2024-01-05T10:00:00Z' },
    { id: '4', name: 'Alice Brown', email: 'alice.brown@email.com', phone: '555-1004', created_at: '2024-01-05T10:00:00Z' },
    { id: '5', name: 'Charlie Wilson', email: 'charlie.wilson@email.com', phone: '555-1005', created_at: '2024-01-05T10:00:00Z' },
    { id: '6', name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '555-1006', created_at: '2024-01-05T10:00:00Z' }
  ],
  payments: [
    { id: '1', case_id: '4', amount: 750, payment_method: 'credit_card', payment_date: '2024-03-15', status: 'completed', created_at: '2024-03-15T14:30:00Z' },
    { id: '2', case_id: '3', amount: 200, payment_method: 'ach', payment_date: '2024-03-20', status: 'completed', created_at: '2024-03-20T09:15:00Z' },
    { id: '3', case_id: '5', amount: 3000, payment_method: 'check', payment_date: '2024-03-25', status: 'completed', created_at: '2024-03-25T11:45:00Z' }
  ],
  communications: [
    { id: '1', case_id: '1', type: 'email', direction: 'outbound', subject: 'Payment Reminder', content: 'This is a reminder about your outstanding balance.', sent_date: '2024-03-10T10:00:00Z', delivery_status: 'delivered', created_at: '2024-03-10T10:00:00Z' },
    { id: '2', case_id: '2', type: 'sms', direction: 'outbound', content: 'Please call us to discuss your account.', sent_date: '2024-03-12T14:30:00Z', delivery_status: 'delivered', created_at: '2024-03-12T14:30:00Z' },
    { id: '3', case_id: '3', type: 'email', direction: 'inbound', subject: 'Payment Plan Request', content: 'I would like to set up a payment plan.', sent_date: '2024-03-14T16:20:00Z', delivery_status: 'delivered', created_at: '2024-03-14T16:20:00Z' },
    { id: '4', case_id: '1', type: 'call', direction: 'outbound', content: 'Called debtor to discuss payment options', sent_date: '2024-03-15T09:00:00Z', delivery_status: 'delivered', created_at: '2024-03-15T09:00:00Z' },
    { id: '5', case_id: '4', type: 'email', direction: 'outbound', subject: 'Settlement Offer', content: 'We are offering a settlement of 60% of your balance.', sent_date: '2024-03-16T11:30:00Z', delivery_status: 'opened', created_at: '2024-03-16T11:30:00Z' },
    { id: '6', case_id: '5', type: 'letter', direction: 'outbound', content: 'Final notice before legal action', sent_date: '2024-03-18T08:00:00Z', delivery_status: 'delivered', created_at: '2024-03-18T08:00:00Z' }
  ],
  templates: [
    { id: '1', name: 'Settlement Offer', type: 'letter', body: 'AllCode\n101 Montgomery Street\n(415) 890-6431\n\nSettlement Offer - Account {{account_number}}\n\nDear {{debtor_name}},\n\nWe are pleased to offer you a settlement opportunity for your account {{account_number}}.\n\nOriginal Balance: ${{original_balance}}\nSettlement Offer: ${{settlement_offer}}\n\nThis offer is valid for 30 days from the date of this letter. To accept this settlement, please contact us immediately.\n\nSincerely,\nDebtFlow Legal Department', status: 'active', created_at: '2024-01-01T10:00:00Z' },
    { id: '2', name: 'Debt Validation Notice (DVN)', type: 'letter', body: 'AllCode\n101 Montgomery Street\n(415) 890-6431\n\nAccount Information and Validation Notice\n\nDate: {{current_date}}\n\nTo: {{debtor_name}}\n{{debtor_address}}\n\nFrom:\nAllCode\n101 Montgomery Street\n\nRE: Account Number {{account_number}}\nOriginal Creditor: {{original_creditor}}\nOriginal Balance: ${{original_balance}}\nCurrent Balance: ${{current_balance}}\n\nDear {{debtor_name}},\n\nThis letter is to inform you that our agency is now managing the above-referenced account.\n\nUnless you notify this office within 30 days after receiving this notice that you dispute the validity of this debt or any portion thereof, this debt will be assumed to be valid. If you notify this office in writing within 30 days from receiving this notice that you dispute the validity of this debt or any portion thereof, this office will obtain verification of the debt or obtain a copy of a judgment and mail you a copy of such judgment or verification. If you request of this office in writing within 30 days after receiving this notice, this office will provide you with the name and address of the original creditor, if different from the current creditor.\n\nThis is a communication from a debt collector. This is an attempt to collect a debt and any information obtained will be used for that purpose.\n\nSincerely,\nAllCode', status: 'active', created_at: '2024-01-01T10:00:00Z' },
    { id: '3', name: 'Notice of Legal Representation', type: 'letter', body: 'AllCode\n101 Montgomery Street\n(415) 890-6431\n\nNotice of Legal Representation\n\nDate: {{current_date}}\n\nTo: {{debtor_name}}\n{{debtor_address}}\n\nFrom:\nAllCode\n101 Montgomery Street\n\nRE: Account Number {{account_number}}\n\nDear {{debtor_name}},\n\nPlease be advised that our firm, AllCode, has been retained to represent the current creditor regarding the above-referenced account. All future communications regarding this matter should be directed to our office.\n\nYou have certain rights under federal and state law. We are required to inform you that this communication is from a debt collector and is an attempt to collect a debt. Any information obtained will be used for that purpose.\n\nPlease contact our office to discuss this matter further.\n\nSincerely,\nLegal Department\nAllCode', status: 'active', created_at: '2024-01-01T10:00:00Z' }
  ],
  campaigns: [
    { id: '1', name: 'Q1 2024 Payment Reminder Campaign', status: 'active', created_at: '2024-01-15T10:00:00Z', description: 'Automated payment reminder campaign for overdue accounts', target_count: 150, sent_count: 142, opened_count: 89, clicked_count: 23 }
  ],
  activity_logs: [
    { id: '1', case_id: '4', amount: 750, payment_method: 'credit_card', payment_date: '2024-03-15', status: 'completed', created_at: '2024-03-15T14:30:00Z' },
    { id: '2', case_id: '3', amount: 200, payment_method: 'ach', payment_date: '2024-03-20', status: 'completed', created_at: '2024-03-20T09:15:00Z' },
    { id: '3', case_id: '5', amount: 3000, payment_method: 'check', payment_date: '2024-03-25', status: 'completed', created_at: '2024-03-25T11:45:00Z' }
  ],
  communications: [
    { id: '1', case_id: '1', type: 'email', direction: 'outbound', subject: 'Payment Reminder', content: 'This is a reminder about your outstanding balance.', sent_date: '2024-03-10T10:00:00Z', delivery_status: 'delivered', created_at: '2024-03-10T10:00:00Z' },
    { id: '2', case_id: '2', type: 'sms', direction: 'outbound', content: 'Please call us to discuss your account.', sent_date: '2024-03-12T14:30:00Z', delivery_status: 'delivered', created_at: '2024-03-12T14:30:00Z' },
    { id: '3', case_id: '3', type: 'email', direction: 'inbound', subject: 'Payment Plan Request', content: 'I would like to set up a payment plan.', sent_date: '2024-03-14T16:20:00Z', delivery_status: 'delivered', created_at: '2024-03-14T16:20:00Z' },
    { id: '4', case_id: '1', type: 'call', direction: 'outbound', content: 'Called debtor to discuss payment options', sent_date: '2024-03-15T09:00:00Z', delivery_status: 'delivered', created_at: '2024-03-15T09:00:00Z' },
    { id: '5', case_id: '4', type: 'email', direction: 'outbound', subject: 'Settlement Offer', content: 'We are offering a settlement of 60% of your balance.', sent_date: '2024-03-16T11:30:00Z', delivery_status: 'opened', created_at: '2024-03-16T11:30:00Z' },
    { id: '6', case_id: '5', type: 'letter', direction: 'outbound', content: 'Final notice before legal action', sent_date: '2024-03-18T08:00:00Z', delivery_status: 'delivered', created_at: '2024-03-18T08:00:00Z' }
  ],
  templates: [
    { id: '1', name: 'Settlement Offer', type: 'letter', body: 'AllCode\n101 Montgomery Street\n(415) 890-6431\n\nSettlement Offer - Account {{account_number}}\n\nDear {{debtor_name}},\n\nWe are pleased to offer you a settlement opportunity for your account {{account_number}}.\n\nOriginal Balance: ${{original_balance}}\nSettlement Offer: ${{settlement_offer}}\n\nThis offer is valid for 30 days from the date of this letter. To accept this settlement, please contact us immediately.\n\nSincerely,\nDebtFlow Legal Department', status: 'active', created_at: '2024-01-01T10:00:00Z' },
    { id: '2', name: 'Debt Validation Notice (DVN)', type: 'letter', body: 'AllCode\n101 Montgomery Street\n(415) 890-6431\n\nAccount Information and Validation Notice\n\nDate: {{current_date}}\n\nTo: {{debtor_name}}\n{{debtor_address}}\n\nFrom:\nAllCode\n101 Montgomery Street\n\nRE: Account Number {{account_number}}\nOriginal Creditor: {{original_creditor}}\nOriginal Balance: ${{original_balance}}\nCurrent Balance: ${{current_balance}}\n\nDear {{debtor_name}},\n\nThis letter is to inform you that our agency is now managing the above-referenced account.\n\nUnless you notify this office within 30 days after receiving this notice that you dispute the validity of this debt or any portion thereof, this debt will be assumed to be valid. If you notify this office in writing within 30 days from receiving this notice that you dispute the validity of this debt or any portion thereof, this office will obtain verification of the debt or obtain a copy of a judgment and mail you a copy of such judgment or verification. If you request of this office in writing within 30 days after receiving this notice, this office will provide you with the name and address of the original creditor, if different from the current creditor.\n\nThis is a communication from a debt collector. This is an attempt to collect a debt and any information obtained will be used for that purpose.\n\nSincerely,\nAllCode', status: 'active', created_at: '2024-01-01T10:00:00Z' },
    { id: '3', name: 'Notice of Legal Representation', type: 'letter', body: 'AllCode\n101 Montgomery Street\n(415) 890-6431\n\nNotice of Legal Representation\n\nDate: {{current_date}}\n\nTo: {{debtor_name}}\n{{debtor_address}}\n\nFrom:\nAllCode\n101 Montgomery Street\n\nRE: Account Number {{account_number}}\n\nDear {{debtor_name}},\n\nPlease be advised that our firm, AllCode, has been retained to represent the current creditor regarding the above-referenced account. All future communications regarding this matter should be directed to our office.\n\nYou have certain rights under federal and state law. We are required to inform you that this communication is from a debt collector and is an attempt to collect a debt. Any information obtained will be used for that purpose.\n\nPlease contact our office to discuss this matter further.\n\nSincerely,\nLegal Department\nAllCode', status: 'active', created_at: '2024-01-01T10:00:00Z' }
  ],
  campaigns: [
    { id: '1', name: 'Q1 2024 Payment Reminder Campaign', status: 'active', created_at: '2024-01-15T10:00:00Z', description: 'Automated payment reminder campaign for overdue accounts', target_count: 150, sent_count: 142, opened_count: 89, clicked_count: 23 }
  ],
  activity_logs: [
    // Case 1 - John Doe
    { id: 'log_1_1', case_id: '1', activity_type: 'debt_validation_sent', description: 'Account Created', performed_by: 'system', activity_date: '2024-01-10T10:00:00Z', metadata: JSON.stringify({ event: 'account_created' }), created_at: '2024-01-10T10:00:00Z' },
    { id: 'log_1_2', case_id: '1', activity_type: 'debt_validation_sent', description: 'DVN was sent', performed_by: 'system', activity_date: '2024-01-10T10:01:00Z', metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }), created_at: '2024-01-10T10:01:00Z' },
    // Case 2 - Jane Smith
    { id: 'log_2_1', case_id: '2', activity_type: 'debt_validation_sent', description: 'Account Created', performed_by: 'system', activity_date: '2024-01-10T10:00:00Z', metadata: JSON.stringify({ event: 'account_created' }), created_at: '2024-01-10T10:00:00Z' },
    { id: 'log_2_2', case_id: '2', activity_type: 'debt_validation_sent', description: 'DVN was sent', performed_by: 'system', activity_date: '2024-01-10T10:01:00Z', metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }), created_at: '2024-01-10T10:01:00Z' },
    // Case 3 - Bob Johnson
    { id: 'log_3_1', case_id: '3', activity_type: 'debt_validation_sent', description: 'Account Created', performed_by: 'system', activity_date: '2024-02-15T10:00:00Z', metadata: JSON.stringify({ event: 'account_created' }), created_at: '2024-02-15T10:00:00Z' },
    { id: 'log_3_2', case_id: '3', activity_type: 'debt_validation_sent', description: 'DVN was sent', performed_by: 'system', activity_date: '2024-02-15T10:01:00Z', metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }), created_at: '2024-02-15T10:01:00Z' },
    // Case 4 - Alice Brown
    { id: 'log_4_1', case_id: '4', activity_type: 'debt_validation_sent', description: 'Account Created', performed_by: 'system', activity_date: '2024-02-15T10:00:00Z', metadata: JSON.stringify({ event: 'account_created' }), created_at: '2024-02-15T10:00:00Z' },
    { id: 'log_4_2', case_id: '4', activity_type: 'debt_validation_sent', description: 'DVN was sent', performed_by: 'system', activity_date: '2024-02-15T10:01:00Z', metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }), created_at: '2024-02-15T10:01:00Z' },
    // Case 5 - Charlie Wilson
    { id: 'log_5_1', case_id: '5', activity_type: 'debt_validation_sent', description: 'Account Created', performed_by: 'system', activity_date: '2024-03-01T10:00:00Z', metadata: JSON.stringify({ event: 'account_created' }), created_at: '2024-03-01T10:00:00Z' },
    { id: 'log_5_2', case_id: '5', activity_type: 'debt_validation_sent', description: 'DVN was sent', performed_by: 'system', activity_date: '2024-03-01T10:01:00Z', metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }), created_at: '2024-03-01T10:01:00Z' },
    // Case 6 - Sarah Chen
    { id: 'log_6_1', case_id: '6', activity_type: 'debt_validation_sent', description: 'Account Created', performed_by: 'system', activity_date: '2024-01-10T10:00:00Z', metadata: JSON.stringify({ event: 'account_created' }), created_at: '2024-01-10T10:00:00Z' },
    { id: 'log_6_2', case_id: '6', activity_type: 'debt_validation_sent', description: 'DVN was sent', performed_by: 'system', activity_date: '2024-01-10T10:01:00Z', metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }), created_at: '2024-01-10T10:01:00Z' }
  ]
});

// Initialize mock data from localStorage
let mockData = loadMockData();

// Save initial data to localStorage if not exists
if (!localStorage.getItem('ccai_mock_data')) {
  saveMockData(mockData);
}

// Entity helpers using Supabase
const createEntity = (tableName) => ({
  findMany: async (filters = {}) => {
    let mockResult = mockData[tableName] || [];
    if (filters && Object.keys(filters).length > 0) {
      mockResult = mockResult.filter(item => {
        return Object.entries(filters).every(([key, value]) => item[key] === value);
      });
    }
    return mockResult;
  },
  findUnique: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  create: async (data) => {
    // For portal sessions, store in localStorage for demo
    if (tableName === 'debtor_portal_sessions') {
      const newRecord = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
      };
      const sessions = JSON.parse(localStorage.getItem('portal_sessions') || '[]');
      sessions.push(newRecord);
      localStorage.setItem('portal_sessions', JSON.stringify(sessions));
      return newRecord;
    }
    
    // For cases, add activity logging
    if (tableName === 'cases') {
      const newRecord = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
      };
      
      // Add to mock data
      mockData.cases.push(newRecord);
      
      // Save to localStorage for persistence
      saveMockData(mockData);
      
      // Create activity log entries
      const now = new Date().toISOString();
      
      // Account Created entry
      const accountCreatedLog = {
        id: `log_${Date.now()}_1`,
        case_id: newRecord.id,
        activity_type: 'debt_validation_sent',
        description: 'Account Created',
        performed_by: 'system',
        activity_date: now,
        metadata: JSON.stringify({ event: 'account_created' }),
        created_at: now
      };
      
      // DVN Sent entry (slightly after account creation)
      const dvnSentLog = {
        id: `log_${Date.now()}_2`,
        case_id: newRecord.id,
        activity_type: 'debt_validation_sent',
        description: 'DVN was sent',
        performed_by: 'system',
        activity_date: new Date(Date.now() + 1000).toISOString(),
        metadata: JSON.stringify({ event: 'dvn_sent', method: 'automated' }),
        created_at: new Date(Date.now() + 1000).toISOString()
      };
      
      mockData.activity_logs.push(accountCreatedLog, dvnSentLog);
      
      // Save to localStorage
      saveMockData(mockData);
      
      return newRecord;
    }
    
    // For campaigns, add with default metrics
    if (tableName === 'campaigns') {
      const newRecord = {
        id: Date.now().toString(),
        ...data,
        status: data.status || 'active',
        target_count: data.target_count || 0,
        sent_count: data.sent_count || 0,
        opened_count: data.opened_count || 0,
        clicked_count: data.clicked_count || 0,
        created_at: new Date().toISOString()
      };
      
      mockData.campaigns.push(newRecord);
      saveMockData(mockData);
      return newRecord;
    }
    
    // For other entities, try Supabase but fall back to mock
    try {
      const { data: result, error } = await supabase.from(tableName).insert([data]).select().single();
      if (error) throw error;
      return result;
    } catch (error) {
      console.log(`Mock create for ${tableName}:`, data);
      const newRecord = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
      };
      mockData[tableName] = mockData[tableName] || [];
      mockData[tableName].push(newRecord);
      saveMockData(mockData);
      return newRecord;
    }
  },
  update: async (id, data) => {
    try {
      const { data: result, error } = await supabase.from(tableName).update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    } catch (error) {
      // Fallback to mock update
      const items = mockData[tableName] || [];
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        mockData[tableName][index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
        return mockData[tableName][index];
      }
      throw new Error(`${tableName} with id ${id} not found`);
    }
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  bulkCreate: async (dataArray) => {
    const { data, error } = await supabase.from(tableName).insert(dataArray).select();
    if (error) throw error;
    return data;
  },
  list: async (orderBy) => {
    let data = [...(mockData[tableName] || [])];
    
    // Handle ordering if provided
    if (typeof orderBy === 'string' && orderBy.length > 0) {
      const isDescending = orderBy.startsWith('-');
      let column = isDescending ? orderBy.substring(1) : orderBy;
      
      // Map column variations
      const columnMap = {
        'created_date': 'created_at',
        'updated_date': 'created_at',
        'updated_at': 'created_at'
      };
      column = columnMap[column] || column;
      
      data.sort((a, b) => {
        const aVal = a[column] || '';
        const bVal = b[column] || '';
        const comparison = aVal.localeCompare(bVal);
        return isDescending ? -comparison : comparison;
      });
    }
    
    return data;
  },
  filter: async (filters = {}, orderBy) => {
    let mockResult = mockData[tableName] || [];
    
    // Debug logging
    if (tableName === 'activity_logs') {
      console.log(`Filtering ${tableName}:`, { filters, totalRecords: mockResult.length });
    }
    
    // For portal sessions, check localStorage
    if (tableName === 'debtor_portal_sessions') {
      const storedSessions = JSON.parse(localStorage.getItem('portal_sessions') || '[]');
      mockResult = [...mockResult, ...storedSessions];
    }
    
    if (filters && Object.keys(filters).length > 0) {
      mockResult = mockResult.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }
    
    // Handle ordering if provided
    if (typeof orderBy === 'string' && orderBy.length > 0) {
      const isDescending = orderBy.startsWith('-');
      let column = isDescending ? orderBy.substring(1) : orderBy;
      
      const columnMap = {
        'created_date': 'created_at',
        'updated_date': 'created_at',
        'updated_at': 'created_at',
        'activity_date': 'activity_date'
      };
      column = columnMap[column] || column;
      
      mockResult.sort((a, b) => {
        const aVal = a[column] || '';
        const bVal = b[column] || '';
        const comparison = aVal.localeCompare(bVal);
        return isDescending ? -comparison : comparison;
      });
    }
    
    if (tableName === 'activity_logs') {
      console.log(`Filtered ${tableName} result:`, mockResult);
    }
    
    return mockResult;
  },
  schema: () => schemas[tableName] || { properties: {} },

  delete: async (id) => {
    if (tableName === 'cases') {
      // Remove from mock data
      const index = mockData.cases.findIndex(item => item.id === id);
      if (index !== -1) {
        mockData.cases.splice(index, 1);
        saveMockData(mockData);
        console.log(`Deleted case ${id} from mock data`);
      } else {
        console.log(`Case ${id} not found in mock data, but treating as successful delete`);
      }
      return true;
    }
    
    // For other entities, try Supabase first
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.log(`Mock delete for ${tableName}:`, id);
      return true;
    }
  },
  get: async (id) => {
    let data = mockData[tableName] || [];
    
    // For portal sessions, check localStorage
    if (tableName === 'debtor_portal_sessions') {
      const storedSessions = JSON.parse(localStorage.getItem('portal_sessions') || '[]');
      data = [...data, ...storedSessions];
    }
    
    const record = data.find(item => item.id === id);
    if (!record) {
      if (tableName === 'debtors') {
        // Return a placeholder debtor for missing records
        return {
          id: id,
          name: 'Unknown Debtor',
          email: '',
          phone: '',
          address: '',
          created_at: new Date().toISOString()
        };
      }
      throw new Error(`${tableName} with id ${id} not found`);
    }
    return record;
  },
  findUnique: async (id) => {
    return await createEntity(tableName).get(id);
  }
});

export const Portfolio = createEntity('portfolios');
export const Case = createEntity('cases');
export const Payment = createEntity('payments');
export const PaymentPlan = createEntity('payment_plans');
export const Communication = createEntity('communications');
export const Template = createEntity('templates');
export const CompanyProfile = createEntity('company_profiles');
export const AppSettings = createEntity('app_settings');
export const Vendor = createEntity('vendors');
export const ImportTemplate = createEntity('import_templates');
export const Integration = createEntity('integrations');
export const Debtor = createEntity('debtors');
export const PaymentConfiguration = createEntity('payment_configurations');
export const DebtorPortalSession = createEntity('debtor_portal_sessions');
export const Dispute = createEntity('disputes');
export const SettlementOffer = createEntity('settlement_offers');
export const ActivityLog = createEntity('activity_logs');
export const Campaign = createEntity('campaigns');

// Auth helpers
export const User = {
  signUp: async (email, password, fullName) => {
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    if (existingUsers.find(u => u.email === email)) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      full_name: fullName,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    // Store user credentials
    const newUserWithPassword = { ...newUser, password };
    existingUsers.push(newUserWithPassword);
    localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
    
    // Auto-login the new user
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    return { user: newUser };
  },
  signIn: async (email, password) => {
    // Default demo users
    const defaultUsers = [
      { id: '1', email: 'admin@ccai.com', password: 'admin123', full_name: 'CCAI Administrator', role: 'admin' },
      { id: '2', email: 'user@ccai.com', password: 'user123', full_name: 'CCAI User', role: 'user' },
      { id: '3', email: 'manager@ccai.com', password: 'manager123', full_name: 'CCAI Manager', role: 'admin' }
    ];
    
    // Get registered users from localStorage
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Combine default and registered users
    const allUsers = [...defaultUsers, ...registeredUsers];
    
    const user = allUsers.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return { user: userWithoutPassword };
    } else {
      throw new Error('Invalid email or password');
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
  me: async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      return JSON.parse(currentUser);
    }
    return null;
  },
  logout: async () => {
    localStorage.removeItem('currentUser');
    return true;
  },
  list: async () => {
    // Return mock users since no user management is set up
    return [
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        email: 'user@example.com',
        full_name: 'Demo User',
        role: 'user',
        created_at: new Date().toISOString()
      }
    ];
  },
  create: async (userData) => {
    console.log('User would be created:', userData);
    return {
      id: Date.now().toString(),
      ...userData,
      created_at: new Date().toISOString()
    };
  },
  update: async (id, userData) => {
    console.log('User would be updated:', id, userData);
    return {
      id,
      ...userData,
      updated_at: new Date().toISOString()
    };
  },
  delete: async (id) => {
    console.log('User would be deleted:', id);
    return true;
  }
};