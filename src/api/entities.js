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

// Mock data with relationships
const mockData = {
  vendors: [
    { id: '1', name: 'Smith & Associates Law Firm', type: 'law_firm', contact_person: 'John Smith', email: 'john@smithlaw.com', phone: '555-0101', status: 'active', created_at: '2024-01-15T10:00:00Z' },
    { id: '2', name: 'ABC Collection Agency', type: 'collection_agency', contact_person: 'Sarah Johnson', email: 'sarah@abccollect.com', phone: '555-0102', status: 'active', created_at: '2024-01-20T10:00:00Z' },
    { id: '3', name: 'TechServ Solutions', type: 'technology', contact_person: 'Mike Davis', email: 'mike@techserv.com', phone: '555-0103', status: 'inactive', created_at: '2024-02-01T10:00:00Z' }
  ],
  portfolios: [
    { id: '1', name: 'Q1 2024 Medical Debt', client: 'MedCorp LLC', original_creditor: 'City Hospital', portfolio_type: 'committed', total_face_value: 2500000, account_count: 1250, status: 'active', created_at: '2024-01-10T10:00:00Z' },
    { id: '2', name: 'Credit Card Portfolio A', client: 'FinanceFirst LLC', original_creditor: 'National Bank', portfolio_type: 'spec', total_face_value: 1800000, account_count: 900, status: 'active', created_at: '2024-02-15T10:00:00Z' },
    { id: '3', name: 'Auto Loan Defaults', client: 'AutoCredit LLC', original_creditor: 'Car Finance Co', portfolio_type: 'committed', total_face_value: 3200000, account_count: 800, status: 'completed', created_at: '2024-03-01T10:00:00Z' }
  ],
  cases: [
    { id: '1', portfolio_id: '1', debtor_id: '1', debtor_name: 'John Doe', debtor_email: 'john.doe@email.com', account_number: 'MED001', original_balance: 2500, current_balance: 2500, original_creditor: 'City Hospital', charge_off_date: '2024-01-01', status: 'new', priority: 'medium', created_at: '2024-01-10T10:00:00Z', updated_date: '2024-03-15T10:00:00Z' },
    { id: '2', portfolio_id: '1', debtor_id: '2', debtor_name: 'Jane Smith', debtor_email: 'jane.smith@email.com', account_number: 'MED002', original_balance: 1800, current_balance: 1800, original_creditor: 'City Hospital', charge_off_date: '2023-12-15', status: 'in_collection', priority: 'high', created_at: '2024-01-10T10:00:00Z', updated_date: '2024-03-20T10:00:00Z' },
    { id: '3', portfolio_id: '2', debtor_id: '3', debtor_name: 'Bob Johnson', debtor_email: 'bob.johnson@email.com', account_number: 'CC001', original_balance: 3200, current_balance: 3200, original_creditor: 'National Bank', charge_off_date: '2023-11-01', status: 'payment_plan', priority: 'medium', created_at: '2024-02-15T10:00:00Z', updated_date: '2024-03-18T10:00:00Z' },
    { id: '4', portfolio_id: '2', debtor_id: '4', debtor_name: 'Alice Brown', debtor_email: 'alice.brown@email.com', account_number: 'CC002', original_balance: 1500, current_balance: 750, original_creditor: 'National Bank', charge_off_date: '2023-10-15', status: 'paid', priority: 'low', created_at: '2024-02-15T10:00:00Z', updated_date: '2024-03-10T10:00:00Z' },
    { id: '5', portfolio_id: '3', debtor_id: '5', debtor_name: 'Charlie Wilson', debtor_email: 'charlie.wilson@email.com', account_number: 'AUTO001', original_balance: 15000, current_balance: 12000, original_creditor: 'Car Finance Co', charge_off_date: '2023-08-01', status: 'settled', priority: 'high', created_at: '2024-03-01T10:00:00Z', updated_date: '2024-03-25T10:00:00Z' },
    { id: '6', portfolio_id: '1', debtor_id: '6', debtor_name: 'Sarah Chen', debtor_email: 'sarah.chen@email.com', account_number: 'ACC-20241201-5678', original_balance: 12000, current_balance: 13500, original_creditor: 'Wells Fargo', charge_off_date: '2023-09-21', last_payment_date: '2023-07-17', status: 'legal_action', priority: 'high', created_at: '2024-01-10T10:00:00Z', updated_date: '2024-03-15T10:00:00Z' }
  ],
  debtors: [
    { id: '1', name: 'John Doe', email: 'john.doe@email.com', phone: '555-1001', created_at: '2024-01-05T10:00:00Z' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', phone: '555-1002', created_at: '2024-01-05T10:00:00Z' },
    { id: '3', name: 'Bob Johnson', email: 'bob.johnson@email.com', phone: '555-1003', created_at: '2024-01-05T10:00:00Z' },
    { id: '4', name: 'Alice Brown', email: 'alice.brown@email.com', phone: '555-1004', created_at: '2024-01-05T10:00:00Z' },
    { id: '5', name: 'Charlie Wilson', email: 'charlie.wilson@email.com', phone: '555-1005', created_at: '2024-01-05T10:00:00Z' },
    { id: '6', name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '(555) 234-5678', address: '456 Pine Avenue, Seattle, WA 98101', ssn_last4: '5678', dob: '1985-06-15', created_at: '2024-01-05T10:00:00Z' }
  ],
  payments: [
    { id: '1', case_id: '4', amount: 750, payment_method: 'credit_card', payment_date: '2024-03-15', status: 'completed', created_at: '2024-03-15T14:30:00Z' },
    { id: '2', case_id: '3', amount: 200, payment_method: 'ach', payment_date: '2024-03-20', status: 'completed', created_at: '2024-03-20T09:15:00Z' },
    { id: '3', case_id: '5', amount: 3000, payment_method: 'check', payment_date: '2024-03-25', status: 'completed', created_at: '2024-03-25T11:45:00Z' }
  ],
  communications: [
    { id: '1', case_id: '1', type: 'email', direction: 'outbound', subject: 'Payment Reminder', content: 'This is a reminder about your outstanding balance.', sent_date: '2024-03-10T10:00:00Z', delivery_status: 'delivered', created_at: '2024-03-10T10:00:00Z' },
    { id: '2', case_id: '2', type: 'sms', direction: 'outbound', content: 'Please call us to discuss your account.', sent_date: '2024-03-12T14:30:00Z', delivery_status: 'delivered', created_at: '2024-03-12T14:30:00Z' },
    { id: '3', case_id: '3', type: 'email', direction: 'inbound', subject: 'Payment Plan Request', content: 'I would like to set up a payment plan.', sent_date: '2024-03-14T16:20:00Z', delivery_status: 'delivered', created_at: '2024-03-14T16:20:00Z' }
  ],
  templates: [
    { id: '1', name: 'Payment Reminder Email', type: 'email', subject: 'Payment Reminder', body: 'Dear {{debtor_name}}, this is a reminder about your outstanding balance of ${{balance}}.', status: 'active', created_at: '2024-01-01T10:00:00Z' },
    { id: '2', name: 'Payment Confirmation SMS', type: 'sms', body: 'Thank you for your payment of ${{amount}}. Your new balance is ${{balance}}.', status: 'active', created_at: '2024-01-01T10:00:00Z' },
    { id: '3', name: 'Settlement Offer Letter', type: 'letter', body: 'We are pleased to offer you a settlement of {{settlement_amount}} for your account.', status: 'active', created_at: '2024-01-01T10:00:00Z' }
  ]
};

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
    
    // For other entities, try Supabase but fall back to mock
    try {
      const { data: result, error } = await supabase.from(tableName).insert([data]).select().single();
      if (error) throw error;
      return result;
    } catch (error) {
      console.log(`Mock create for ${tableName}:`, data);
      return {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
      };
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
  filter: async (filters = {}) => {
    let mockResult = mockData[tableName] || [];
    
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
    return mockResult;
  },
  schema: () => schemas[tableName] || { properties: {} },

  delete: async (id) => {
    console.log(`Mock delete for ${tableName}:`, id);
    return true;
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
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
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
    // For now, return a mock user since no auth is set up
    return {
      id: '1',
      email: 'user@example.com',
      full_name: 'Demo User',
      role: 'admin' // Make user admin so they can see all features
    };
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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