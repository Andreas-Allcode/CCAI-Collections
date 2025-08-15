
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, FileText, Check, Download, ChevronsUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Portfolio, Case, Debtor, Vendor } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import usePermissions from '@/components/hooks/usePermissions'; // Updated import path
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Required fields for portfolio import
const requiredFields = [
  { key: 'portfolio_name', label: 'Portfolio Name', required: true, type: 'portfolio' },
  { key: 'client', label: 'Client', required: true, type: 'portfolio' },
  { key: 'original_creditor', label: 'Original Creditor', required: false, type: 'portfolio' },
  { key: 'portfolio_type', label: 'Portfolio Type', required: false, type: 'portfolio' },
  { key: 'portfolio_category', label: 'Portfolio Category', required: false, type: 'portfolio' },
  { key: 'litigation_eligible', label: 'Litigation Eligible', required: false, type: 'portfolio' },
  { key: 'debtor_name', label: 'Debtor Name', required: true, type: 'case' },
  { key: 'first_name', label: 'First Name', required: false, type: 'case' },
  { key: 'last_name', label: 'Last Name', required: false, type: 'case' },
  { key: 'email', label: 'Email', required: false, type: 'case' },
  { key: 'phone', label: 'Phone', required: false, type: 'case' },
  { key: 'address', label: 'Address', required: false, type: 'case' },
  { key: 'account_number', label: 'Account Number', required: true, type: 'case' },
  { key: 'original_balance', label: 'Original Balance', required: true, type: 'case' },
  { key: 'current_balance', label: 'Current Balance', required: false, type: 'case' },
  { key: 'charge_off_date', label: 'Charge Off Date', required: false, type: 'case' },
  { key: 'last_payment_date', label: 'Last Payment Date', required: false, type: 'case' },
  { key: 'status', label: 'Status', required: false, type: 'case' },
  { key: 'priority', label: 'Priority', required: false, type: 'case' },
  { key: 'scrub_method', label: 'Scrub Method', required: false, type: 'case' }
];

// Auto-mapping function with no duplicates
const autoMapFields = (csvHeaders) => {
  const mapping = {};
  const usedFields = new Set();
  
  // Priority order for auto-mapping (most important fields first)
  const fieldPriority = [
    'portfolio_name', 'client', 'debtor_name', 'account_number', 'original_balance',
    'first_name', 'last_name', 'email', 'phone', 'address', 'current_balance',
    'original_creditor', 'charge_off_date', 'last_payment_date', 'status',
    'portfolio_type', 'portfolio_category', 'litigation_eligible', 'priority', 'scrub_method'
  ];
  
  const mappingRules = {
    'portfolio_name': ['portfolio_name', 'name', 'portfolio'],
    'client': ['client', 'client_name', 'client_llc'],
    'original_creditor': ['original_creditor', 'creditor', 'orig_creditor'],
    'portfolio_type': ['portfolio_type', 'type'],
    'portfolio_category': ['portfolio_category', 'category'],
    'litigation_eligible': ['litigation_eligible', 'litigation', 'legal'],
    'debtor_name': ['debtor_name', 'name', 'customer_name', 'borrower_name', 'full_name'],
    'first_name': ['first_name', 'fname', 'given_name'],
    'last_name': ['last_name', 'lname', 'surname', 'family_name'],
    'email': ['email', 'email_address', 'e_mail'],
    'phone': ['phone', 'phone_number', 'telephone', 'mobile'],
    'address': ['address', 'street_address', 'mailing_address'],
    'account_number': ['account_number', 'account', 'acct_number', 'acct_no'],
    'original_balance': ['original_balance', 'balance', 'amount', 'principal'],
    'current_balance': ['current_balance', 'curr_balance', 'outstanding'],
    'charge_off_date': ['charge_off_date', 'chargeoff_date', 'co_date'],
    'last_payment_date': ['last_payment_date', 'last_pay_date', 'payment_date'],
    'status': ['status', 'account_status', 'state'],
    'priority': ['priority', 'risk_level'],
    'scrub_method': ['scrub_method', 'scrub', 'verification_method']
  };
  
  // Auto-map in priority order, ensuring no duplicates
  fieldPriority.forEach(fieldKey => {
    if (usedFields.has(fieldKey)) return;
    
    const patterns = mappingRules[fieldKey];
    const matchingHeader = csvHeaders.find(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return patterns.some(pattern => normalizedHeader.includes(pattern)) && !mapping[header];
    });
    
    if (matchingHeader) {
      mapping[matchingHeader] = fieldKey;
      usedFields.add(fieldKey);
    }
  });
  
  return mapping;
};

// Dynamically get fields, can be extended with a schema utility if needed
const caseSchema = Case.schema() || { properties: {} };
const caseFields = Object.keys(caseSchema.properties);

// Portfolio template data structure
const portfolioTemplateHeaders = [
  'Portfolio Name',
  'Client',
  'Original Creditor', 
  'Portfolio Type',
  'Portfolio Category',
  'Litigation Eligible',
  'Debtor Name',
  'Email',
  'Phone',
  'Address',
  'Account Number',
  'Original Balance',
  'Current Balance',
  'Charge Off Date',
  'Last Payment Date',
  'Status',
  'Priority',
  'Scrub Method'
];

const portfolioSampleData = [
  [
    'Q1 2024 Medical Portfolio',
    'MedCorp LLC',
    'City Hospital',
    'committed',
    'purchased',
    'true',
    'John Smith',
    'john.smith@email.com',
    '555-0101',
    '123 Main St, City, ST 12345',
    'MED001',
    '2500.00',
    '2500.00',
    '2024-01-01',
    '2023-12-15',
    'new',
    'medium',
    'experian'
  ],
  [
    'Q1 2024 Medical Portfolio',
    'MedCorp LLC', 
    'City Hospital',
    'committed',
    'purchased',
    'true',
    'Jane Doe',
    'jane.doe@email.com',
    '555-0102',
    '456 Oak Ave, City, ST 12345',
    'MED002',
    '1800.00',
    '1800.00',
    '2023-12-15',
    '2023-11-20',
    'new',
    'high',
    'rnn'
  ],
  [
    'Credit Card Portfolio B',
    'FinanceFirst LLC',
    'National Bank',
    'spec',
    'purchased',
    'false',
    'Bob Johnson',
    'bob.johnson@email.com',
    '555-0103',
    '789 Pine St, City, ST 12345',
    'CC001',
    '3200.00',
    '3200.00',
    '2023-11-01',
    '2023-10-15',
    'new',
    'medium',
    'tlo'
  ]
];

// Template download functions
const downloadCSVTemplate = () => {
  const csvContent = Papa.unparse({
    fields: portfolioTemplateHeaders,
    data: portfolioSampleData
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'portfolio_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadXLSXTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([portfolioTemplateHeaders, ...portfolioSampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Portfolio Import');
  XLSX.writeFile(wb, 'portfolio_import_template.xlsx');
};

export default function PortfolioImport() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [fullFileRows, setFullFileRows] = useState([]); // Store all rows from file
  const [previewRows, setPreviewRows] = useState([]); // For display (first 10 rows)
  const [mapping, setMapping] = useState({});
  const [importMode, setImportMode] = useState('single'); // 'single' or 'multiple'
  const [portfolioDetails, setPortfolioDetails] = useState({
    name: '',
    client: '',
    original_creditor: '',
    portfolio_type: 'spec',
    litigation_eligible: true,
    vendor_id: 'none'
  });
  const [vendors, setVendors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { canEdit } = usePermissions(); // Use the permissions hook

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv'))) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const parsed = Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          transform: (value) => value.trim()
        });
        
        if (parsed.errors.length > 0) {
          console.error('CSV parsing errors:', parsed.errors);
        }
        
        if (!parsed.data || parsed.data.length === 0) {
          alert("CSV file is empty.");
          return;
        }

        const fileHeaders = parsed.data[0];
        const allParsedRows = parsed.data.slice(1);
        const previewParsedRows = allParsedRows.slice(0, 10);

        // Auto-map fields
        const autoMapping = autoMapFields(fileHeaders);
        
        setHeaders(fileHeaders);
        setFullFileRows(allParsedRows);
        setPreviewRows(previewParsedRows);
        setMapping(autoMapping);
        
        // Load vendors
        Vendor.list().then(vendorList => {
          setVendors(vendorList || []);
        }).catch(err => console.error('Error loading vendors:', err));
        
        setActiveStep(1);
      };
      reader.readAsText(uploadedFile);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleMappingChange = (header, field) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };
  
  const handleFieldMapping = (fieldKey, csvColumn) => {
    const newMapping = { ...mapping };
    
    // Clear any existing mapping for this field
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === fieldKey) {
        delete newMapping[key];
      }
    });
    
    // Set new mapping if not 'none'
    if (csvColumn && csvColumn !== 'none') {
      newMapping[csvColumn] = fieldKey;
    }
    
    setMapping(newMapping);
  };

  const handlePortfolioDetailChange = (field, value) => {
    setPortfolioDetails(prev => ({...prev, [field]: value}));
  };
  
  const handleSave = async () => {
    setIsProcessing(true);
    try {
        // Group rows by portfolio using mapped fields
        const portfolioGroups = {};
        
        // Get column indices based on mapping
        const getColumnIndex = (fieldKey) => {
            const header = Object.keys(mapping).find(key => mapping[key] === fieldKey);
            return header ? headers.indexOf(header) : -1;
        };
        
        // Always create single portfolio mode - use portfolio details form
        const portfolioName = portfolioDetails.name || 'Imported Portfolio';
        
        portfolioGroups[portfolioName] = {
            details: {
                name: portfolioName,
                client: portfolioDetails.client || '',
                original_creditor: portfolioDetails.original_creditor || '',
                portfolio_type: portfolioDetails.portfolio_type || 'spec',
                portfolio_category: 'purchased',
                litigation_eligible: portfolioDetails.litigation_eligible || false
            },
            cases: []
        };
        
        // Add all CSV rows as cases to the single portfolio
        fullFileRows.forEach((row, rowIndex) => {
            
            // Add case data using mapped fields
            let debtorName = '';
            if (getColumnIndex('debtor_name') >= 0) {
                debtorName = row[getColumnIndex('debtor_name')];
            } else if (getColumnIndex('first_name') >= 0 || getColumnIndex('last_name') >= 0) {
                const firstName = getColumnIndex('first_name') >= 0 ? row[getColumnIndex('first_name')] : '';
                const lastName = getColumnIndex('last_name') >= 0 ? row[getColumnIndex('last_name')] : '';
                debtorName = `${firstName} ${lastName}`.trim();
            }
            
            const caseData = {
                debtor_name: debtorName,
                account_number: getColumnIndex('account_number') >= 0 ? row[getColumnIndex('account_number')] : '',
                original_balance: getColumnIndex('original_balance') >= 0 ? 
                    parseFloat(row[getColumnIndex('original_balance')] || '0') || 0 : 0,
                current_balance: getColumnIndex('current_balance') >= 0 ? 
                    parseFloat(row[getColumnIndex('current_balance')] || '0') || 0 : 0,
                face_value: getColumnIndex('original_balance') >= 0 ? 
                    parseFloat(row[getColumnIndex('original_balance')] || '0') || 0 : 0,
                original_creditor: getColumnIndex('original_creditor') >= 0 ? row[getColumnIndex('original_creditor')] : '',
                charge_off_date: getColumnIndex('charge_off_date') >= 0 ? row[getColumnIndex('charge_off_date')] : '',
                last_payment_date: getColumnIndex('last_payment_date') >= 0 ? row[getColumnIndex('last_payment_date')] : '',
                status: getColumnIndex('status') >= 0 ? row[getColumnIndex('status')] : 'new',
                priority: getColumnIndex('priority') >= 0 ? row[getColumnIndex('priority')] : 'medium',
                scrub_method: getColumnIndex('scrub_method') >= 0 ? row[getColumnIndex('scrub_method')] : 'experian',
                rowIndex: rowIndex // Add row index to track which row this case came from
            };
            
            portfolioGroups[portfolioName].cases.push(caseData);
        });

        // Create portfolios, debtors, and cases
        for (const [portfolioName, group] of Object.entries(portfolioGroups)) {
            const totalFaceValue = group.cases.reduce((sum, c) => sum + c.face_value, 0);
            
            // Create portfolio (remove unsupported fields for Supabase)
            const validPortfolioTypes = ['spec', 'committed'];
            const portfolioType = validPortfolioTypes.includes(group.details.portfolio_type) ? 
                group.details.portfolio_type : 'spec';
                
            const portfolioData = {
                name: group.details.name,
                client: group.details.client,
                original_creditor: group.details.original_creditor,
                portfolio_type: portfolioType,
                litigation_eligible: group.details.litigation_eligible,
                account_count: group.cases.length,
                total_face_value: totalFaceValue,
                status: 'active'
            };
            const newPortfolio = await Portfolio.create(portfolioData);
            
            // Get existing debtors
            const existingDebtors = await Debtor.list();
            
            // Create cases and debtors for this portfolio
            const casesToCreate = [];
            
            for (const caseData of group.cases) {
                const row = fullFileRows[caseData.rowIndex]; // Get the correct CSV row for this case
                let debtorId = null;
                
                // Extract debtor info from the correct CSV row
                const emailIndex = getColumnIndex('email');
                const phoneIndex = getColumnIndex('phone');
                const addressIndex = getColumnIndex('address');
                
                const debtorEmail = emailIndex >= 0 ? row[emailIndex] : '';
                const debtorPhone = phoneIndex >= 0 ? row[phoneIndex] : '';
                const debtorAddress = addressIndex >= 0 ? row[addressIndex] : '';
                
                // Get debtor name from the case data (which already has the combined name)
                const debtorName = caseData.debtor_name || 'Unnamed Debtor';
                
                console.log('Processing debtor:', debtorName, 'Email:', debtorEmail, 'Phone:', debtorPhone);
                
                // Find existing debtor by name or email
                let existingDebtor = existingDebtors.find(d => 
                    d.name === debtorName || 
                    (debtorEmail && d.email === debtorEmail)
                );
                
                if (existingDebtor) {
                    debtorId = existingDebtor.id;
                    console.log('Found existing debtor:', existingDebtor.id);
                } else {
                    // Create new debtor with proper name
                    console.log('Creating new debtor:', debtorName);
                    const newDebtor = await Debtor.create({
                        name: debtorName,
                        email: debtorEmail || '',
                        phone: debtorPhone || '',
                        address: debtorAddress || ''
                    });
                    debtorId = newDebtor.id;
                    existingDebtors.push(newDebtor); // Add to list to avoid duplicates
                    console.log('Created debtor with ID:', debtorId, 'Name:', debtorName);
                }
                
                // Clean case data for Supabase compatibility
                const validStatuses = ['new', 'in_collection', 'payment_plan', 'paid', 'settled', 'bankruptcy', 'deceased', 'disputed', 'legal_action'];
                const caseStatus = validStatuses.includes(caseData.status) ? caseData.status : 'new';
                
                const cleanCaseData = {
                    debtor_name: debtorName, // Use the properly extracted name
                    account_number: caseData.account_number,
                    original_balance: caseData.original_balance,
                    current_balance: caseData.current_balance,
                    original_creditor: caseData.original_creditor,
                    charge_off_date: caseData.charge_off_date || null,
                    last_payment_date: caseData.last_payment_date || null,
                    status: caseStatus,
                    portfolio_id: newPortfolio.id,
                    debtor_id: debtorId
                };
                console.log('Creating case for portfolio:', newPortfolio.id, 'debtor:', debtorId);
                casesToCreate.push(cleanCaseData);
            }
            
            if (casesToCreate.length > 0) {
                console.log('Creating', casesToCreate.length, 'cases for portfolio:', newPortfolio.id);
                console.log('Sample case data:', casesToCreate[0]);
                
                // Create cases one by one to ensure they're saved
                const createdCases = [];
                for (const caseData of casesToCreate) {
                    try {
                        const createdCase = await Case.create(caseData);
                        console.log('Created case:', createdCase.id, 'for debtor:', caseData.debtor_name);
                        createdCases.push(createdCase);
                    } catch (error) {
                        console.error('Failed to create case:', error, caseData);
                        // Still add to localStorage even if Supabase fails
                        const fallbackCase = {
                            id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            ...caseData,
                            created_at: new Date().toISOString()
                        };
                        createdCases.push(fallbackCase);
                    }
                }
                
                // Ensure cases are saved to localStorage
                const mockData = JSON.parse(localStorage.getItem('ccai_mock_data') || '{}');
                mockData.cases = mockData.cases || [];
                mockData.cases.push(...createdCases);
                localStorage.setItem('ccai_mock_data', JSON.stringify(mockData));
                console.log('Saved', createdCases.length, 'cases to localStorage');
                
                // Update portfolio with final statistics
                await Portfolio.update(newPortfolio.id, {
                    account_count: casesToCreate.length,
                    total_face_value: totalFaceValue
                });
                
                console.log('Portfolio updated with', casesToCreate.length, 'cases');
            }
        }
        
        // Force refresh localStorage to ensure data is available
        window.location.reload();
        setActiveStep(3);
    } catch (error) {
        console.error("Error saving portfolio and cases:", error);
        alert("An error occurred during import. Check console for details.");
    } finally {
        setIsProcessing(false);
    }
  };

  const steps = [
    { 
      label: 'Upload CSV', 
      content: (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-gray-600">Select the CSV file containing the portfolio and debt accounts data.</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadCSVTemplate}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadXLSXTemplate}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                XLSX Template
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg ${canEdit ? 'cursor-pointer bg-gray-50 hover:bg-gray-100' : 'bg-gray-200 cursor-not-allowed'} transition-colors`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} disabled={!canEdit} />
            </label>
          </div>
        </div>
      )
    },
    { 
      label: 'Map Columns', 
      content: (
        <div className="space-y-6">

          <p className="text-gray-600">Map your CSV columns to the required system fields. Auto-mapping has been applied based on column names.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Required Fields */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Required System Fields</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {requiredFields.map(field => {
                  const mappedColumn = Object.keys(mapping).find(key => mapping[key] === field.key);
                  const isMapped = !!mappedColumn;
                  const isRequired = field.required;
                  
                  return (
                    <div key={field.key} className={`p-3 rounded-lg border ${
                      isRequired && !isMapped ? 'border-red-200 bg-red-50' : 
                      isMapped ? 'border-green-200 bg-green-50' : 
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`font-medium ${
                              isRequired ? 'text-red-700' : 'text-gray-700'
                            }`}>
                              {field.label}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Type: {field.type === 'portfolio' ? 'Portfolio Info' : 'Case Data'}
                            </div>
                          </div>
                          <div className="text-right">
                            {isMapped ? (
                              <div className="text-sm">
                                <div className="text-green-600 font-medium">✓ Mapped</div>
                                <div className="text-gray-500 text-xs">{mappedColumn}</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">
                                {isRequired ? 'Required' : 'Optional'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Searchable dropdown for mapping CSV columns to this field */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !mappedColumn && "text-muted-foreground"
                              )}
                              disabled={!canEdit}
                            >
                              {mappedColumn || `Select CSV column for ${field.label}...`}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search columns..." />
                              <CommandEmpty>No column found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="none"
                                  onSelect={() => {
                                    // Clear existing mapping for this field
                                    const newMapping = { ...mapping };
                                    Object.keys(newMapping).forEach(key => {
                                      if (newMapping[key] === field.key) {
                                        delete newMapping[key];
                                      }
                                    });
                                    setMapping(newMapping);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !mappedColumn ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  -- No mapping --
                                </CommandItem>
                                {headers.map(header => {
                                  const isAlreadyMapped = mapping[header] && mapping[header] !== field.key;
                                  const isSelected = mappedColumn === header;
                                  return (
                                    <CommandItem
                                      key={header}
                                      value={header}
                                      onSelect={() => {
                                        // Clear existing mapping for this field
                                        const newMapping = { ...mapping };
                                        Object.keys(newMapping).forEach(key => {
                                          if (newMapping[key] === field.key) {
                                            delete newMapping[key];
                                          }
                                        });
                                        // Clear any existing mapping for this header (manual override)
                                        Object.keys(newMapping).forEach(key => {
                                          if (key === header) {
                                            delete newMapping[key];
                                          }
                                        });
                                        newMapping[header] = field.key;
                                        setMapping(newMapping);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {header} {isAlreadyMapped ? '(will override)' : ''}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Show sample data if mapped */}
                        {mappedColumn && (
                          <div className="text-xs text-gray-500">
                            Sample: {previewRows[0]?.[headers.indexOf(mappedColumn)] || 'No data'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* CSV Columns Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">CSV Columns Overview</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {headers.map((header, index) => {
                  const currentMapping = mapping[header];
                  const sampleData = previewRows[0]?.[index] || 'No data';
                  const mappedField = requiredFields.find(f => f.key === currentMapping);
                  
                  return (
                    <div key={index} className={`p-3 border rounded-lg ${
                      currentMapping && currentMapping !== 'ignore' ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{header}</div>
                          <div className="text-xs text-gray-500 truncate">Sample: {sampleData}</div>
                        </div>
                        <div className="text-right">
                          {currentMapping && currentMapping !== 'ignore' ? (
                            <div className="text-sm">
                              <div className="text-green-600 font-medium">✓ Mapped to</div>
                              <div className="text-gray-700 text-xs font-medium">
                                {mappedField?.label || currentMapping}
                              </div>
                            </div>
                          ) : currentMapping === 'ignore' ? (
                            <div className="text-sm text-gray-400">Ignored</div>
                          ) : (
                            <div className="text-sm text-orange-600">Not mapped</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Mapping Instructions</h4>
                <p className="text-xs text-blue-700">
                  Use the dropdowns in the "Required System Fields" section on the left to map your CSV columns to the appropriate system fields. 
                  Each CSV column can only be mapped to one system field.
                </p>
              </div>
            </div>
          </div>
          
          {/* Validation Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Mapping Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Required fields mapped:</span>
                <span className="ml-2 font-medium">
                  {requiredFields.filter(f => f.required && Object.values(mapping).includes(f.key)).length} / 
                  {requiredFields.filter(f => f.required).length}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Total fields mapped:</span>
                <span className="ml-2 font-medium">
                  {Object.values(mapping).filter(v => v !== 'ignore').length} / {requiredFields.length}
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setActiveStep(2)} 
            disabled={!canEdit || (() => {
              const hasDebtorName = Object.values(mapping).includes('debtor_name');
              const hasFirstName = Object.values(mapping).includes('first_name');
              const hasLastName = Object.values(mapping).includes('last_name');
              const hasValidNameMapping = hasDebtorName || (hasFirstName && hasLastName);
              
              return requiredFields.filter(f => f.required && f.key !== 'debtor_name').some(f => !Object.values(mapping).includes(f.key)) || !hasValidNameMapping;
            })()}
            className="w-full"
          >
            {(() => {
              const hasDebtorName = Object.values(mapping).includes('debtor_name');
              const hasFirstName = Object.values(mapping).includes('first_name');
              const hasLastName = Object.values(mapping).includes('last_name');
              const hasValidNameMapping = hasDebtorName || (hasFirstName && hasLastName);
              const missingRequired = requiredFields.filter(f => f.required && f.key !== 'debtor_name').some(f => !Object.values(mapping).includes(f.key));
              
              if (!hasValidNameMapping) {
                return 'Map Debtor Name OR both First Name and Last Name';
              }
              if (missingRequired) {
                return 'Map all required fields to continue';
              }
              return 'Next: Review & Import';
            })()} 
          </Button>
        </div>
      )
    },
    { 
      label: 'Review & Save', 
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Portfolio Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Portfolio Name" 
                value={portfolioDetails.name} 
                onChange={e => setPortfolioDetails(prev => ({...prev, name: e.target.value}))} 
                disabled={!canEdit}
              />
              <Input 
                placeholder="Client" 
                value={portfolioDetails.client} 
                onChange={e => setPortfolioDetails(prev => ({...prev, client: e.target.value}))} 
                disabled={!canEdit}
              />
              <Input 
                placeholder="Original Creditor" 
                value={portfolioDetails.original_creditor} 
                onChange={e => setPortfolioDetails(prev => ({...prev, original_creditor: e.target.value}))} 
                disabled={!canEdit}
              />
              <Select 
                value={portfolioDetails.portfolio_type} 
                onValueChange={value => setPortfolioDetails(prev => ({...prev, portfolio_type: value}))}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spec">Spec</SelectItem>
                  <SelectItem value="committed">Committed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="litigation_eligible" 
                  checked={portfolioDetails.litigation_eligible} 
                  onCheckedChange={(checked) => setPortfolioDetails(prev => ({...prev, litigation_eligible: checked}))} 
                  disabled={!canEdit}
                />
                <Label htmlFor="litigation_eligible">Eligible for Litigation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="vendor_select">Vendor:</Label>
                <Select 
                  value={portfolioDetails.vendor_id} 
                  onValueChange={value => setPortfolioDetails(prev => ({...prev, vendor_id: value}))}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Vendor</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold">Import Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Mapped Fields:</span>
                <div className="text-xs text-gray-600 mt-1">
                  {Object.entries(mapping)
                    .filter(([_, value]) => value !== 'ignore')
                    .map(([header, field]) => (
                      <div key={header} className="flex justify-between">
                        <span>{header}</span>
                        <span>→ {requiredFields.find(f => f.key === field)?.label || field}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Import Statistics:</span>
                <div className="text-xs text-gray-600 mt-1">
                  <div>Total Records: {fullFileRows.length}</div>
                  <div>Required Fields: {requiredFields.filter(f => f.required && Object.values(mapping).includes(f.key)).length}/{requiredFields.filter(f => f.required).length}</div>
                  <div>Optional Fields: {requiredFields.filter(f => !f.required && Object.values(mapping).includes(f.key)).length}/{requiredFields.filter(f => !f.required).length}</div>
                </div>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold">Data Preview</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">{fullFileRows.length} debt records will be imported and organized into portfolios.</p>
            <p className="text-xs text-blue-600 mt-1">All debt records will be added to one portfolio using the details above.</p>
          </div>
          <Button onClick={handleSave} disabled={isProcessing || !canEdit} className="w-full">
            {isProcessing ? "Processing..." : "Save and Import"}
          </Button>
        </div>
      )
    },
    { 
      label: 'Completed', 
      content: (
        <div className="text-center py-12">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
          <h3 className="text-xl font-semibold text-gray-800">Import Successful</h3>
          <p className="text-gray-500 mt-2">The portfolios and their cases have been imported successfully.</p>
          <Button 
            className="mt-6" 
            onClick={() => {
              // Force refresh portfolios data
              window.location.href = createPageUrl("Portfolios");
            }}
          >
            View Portfolios
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Link to={createPageUrl("Portfolios")} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Portfolios
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900">Import New Portfolio</h1>
      
      <Card>
        <CardContent className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= activeStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < activeStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  index <= activeStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    index < activeStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-96">
            {!canEdit && activeStep < 3 && ( // Show message if not allowed and not on the completed step
                <div className="text-center py-12 text-red-600 bg-red-50 rounded-lg mb-6">
                    <p className="font-semibold">Permission Denied</p>
                    <p className="text-sm">You do not have permission to import new portfolios.</p>
                </div>
            )}
            {steps[activeStep].content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
