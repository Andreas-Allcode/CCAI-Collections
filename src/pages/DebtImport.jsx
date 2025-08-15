import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Portfolio, Vendor, Case, Debtor } from '@/api/entities';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function DebtImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [scrubMethod, setScrubMethod] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfolioData, vendorData] = await Promise.all([
        Portfolio.list(),
        Vendor.list()
      ]);
      setPortfolios(portfolioData || []);
      setVendors(vendorData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load portfolios and vendors');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      // Use Papa Parse for better CSV parsing
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });
      
      const data = parsed.data.map((row, index) => ({
        ...row,
        _rowIndex: index + 2
      }));
      
      setPreviewData(data.slice(0, 10)); // Show first 10 rows for preview
    };
    reader.readAsText(file);
  };

  const generateTemplate = (format = 'csv') => {
    const templateData = [
      {
        'Debtor Name': 'John Doe',
        'Email': 'john.doe@email.com',
        'Phone': '555-1234',
        'Address': '123 Main St, City, State 12345',
        'Account Number': 'ACC-001',
        'Original Balance': '2500.00',
        'Current Balance': '2500.00',
        'Original Creditor': 'City Hospital',
        'Charge Off Date': '2024-01-01',
        'Last Payment Date': '2023-12-15'
      },
      {
        'Debtor Name': 'Jane Smith',
        'Email': 'jane.smith@email.com',
        'Phone': '555-5678',
        'Address': '456 Oak Ave, Town, State 67890',
        'Account Number': 'ACC-002',
        'Original Balance': '1800.00',
        'Current Balance': '1800.00',
        'Original Creditor': 'Medical Center',
        'Charge Off Date': '2023-12-15',
        'Last Payment Date': '2023-11-30'
      }
    ];

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Debt Import Template');
      XLSX.writeFile(wb, 'debt_import_template.xlsx');
    } else {
      const csv = Papa.unparse(templateData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'debt_import_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast.success(`${format.toUpperCase()} template downloaded successfully!`);
  };

  const handleImport = async () => {
    if (!file || !selectedPortfolio || !scrubMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    const results = { success: 0, errors: [] };

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        // Use Papa Parse for better CSV parsing
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });
        
        const data = parsed.data;

        // Define helper functions first
        const parseBalance = (value) => {
          if (!value || value === '') return 0;
          const cleanValue = String(value).replace(/[$,\s]/g, '').trim();
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? 0 : Math.abs(parsed);
        };
        
        const parseDate = (dateStr) => {
          if (!dateStr || dateStr === '') return null;
          try {
            let date;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              date = new Date(dateStr);
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
              const [month, day, year] = dateStr.split('-');
              date = new Date(year, month - 1, day);
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
              const [month, day, year] = dateStr.split('/');
              date = new Date(year, month - 1, day);
            } else {
              date = new Date(dateStr);
            }
            return date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
          } catch {
            return null;
          }
        };

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            const debtorData = {
              name: row['Debtor Name'] || 'Unknown Debtor',
              email: row['Email'] || '',
              phone: row['Phone'] || '',
              address: row['Address'] || ''
            };
            
            const debtor = await Debtor.create(debtorData);
            
            const originalBalance = parseBalance(row['Original Balance']);
            const currentBalance = parseBalance(row['Current Balance']);
            
            const debtData = {
              portfolio_id: selectedPortfolio,
              debtor_id: debtor.id,
              debtor_name: row['Debtor Name'],
              debtor_email: row['Email'],
              debtor_phone: row['Phone'],
              debtor_address: row['Address'],
              account_number: row['Account Number'],
              original_balance: originalBalance,
              current_balance: currentBalance,
              original_creditor: row['Original Creditor'],
              charge_off_date: parseDate(row['Charge Off Date']),
              last_payment_date: parseDate(row['Last Payment Date']),
              status: 'new',
              priority: 'medium',
              notes: `Scrub Method: ${scrubMethod}`,
              updated_date: new Date().toISOString()
            };
            
            console.log('Creating debt with data:', debtData);
            
            // Add vendor_id only if selected
            if (selectedVendor) {
              debtData.vendor_id = selectedVendor;
            }
            
            if (originalBalance === 0 && currentBalance === 0) {
              throw new Error('Both original and current balance cannot be zero');
            }

            const createdCase = await Case.create(debtData);
            console.log('Created case:', createdCase);
            results.success++;
          } catch (error) {
            results.errors.push(`Row ${i + 2}: ${error.message}`);
          }
        }

        // Force refresh of localStorage to ensure new data is used
        const mockData = JSON.parse(localStorage.getItem('ccai_mock_data') || '{}');
        localStorage.setItem('ccai_mock_data', JSON.stringify(mockData));
        
        setImportResults(results);
        toast.success(`Import completed! ${results.success} debts imported successfully`);
        if (results.errors.length > 0) {
          toast.warning(`${results.errors.length} rows had errors`);
        }
        
        // Trigger page reload to show new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('Debts'))} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debts
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Debts</h1>
          <p className="text-gray-600 mt-1">Upload a CSV file to import multiple debt records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateTemplate('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
          <Button variant="outline" onClick={() => generateTemplate('xlsx')}>
            <Download className="w-4 h-4 mr-2" />
            Download XLSX Template
          </Button>
        </div>
      </div>

      {!importResults ? (
        <>
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>1. Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select CSV File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>2. Import Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Portfolio *</Label>
                  <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendor (Optional)</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scrub Method *</Label>
                  <Select value={scrubMethod} onValueChange={setScrubMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scrub method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="experian">Experian</SelectItem>
                      <SelectItem value="rnn">RNN</SelectItem>
                      <SelectItem value="tlo">TLO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Data Preview (First 10 rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(previewData[0] || {}).filter(key => key !== '_rowIndex').map(header => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.entries(row).filter(([key]) => key !== '_rowIndex').map(([key, value]) => (
                            <TableCell key={key}>{value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleImport} 
              disabled={!file || !selectedPortfolio || !scrubMethod || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Importing...' : 'Import Debts'}
            </Button>
          </div>
        </>
      ) : (
        /* Results */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-700">Successfully Imported</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>
              
              {importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => navigate(createPageUrl('Debts'))}>
                  View Imported Debts
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Import Another File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}