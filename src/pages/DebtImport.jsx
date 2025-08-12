import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Portfolio, Vendor, Case } from '@/api/entities';
import { toast } from 'sonner';

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
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          row._rowIndex = index + 2; // +2 because we start from line 2
          return row;
        });
      
      setPreviewData(data.slice(0, 10)); // Show first 10 rows for preview
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file || !selectedPortfolio || !selectedVendor || !scrubMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    const results = { success: 0, errors: [] };

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            const debtData = {
              portfolio_id: selectedPortfolio,
              vendor_id: selectedVendor,
              scrub_method: scrubMethod,
              debtor_name: row['Debtor Name'] || row['Name'] || '',
              debtor_email: row['Email'] || '',
              debtor_phone: row['Phone'] || '',
              debtor_address: row['Address'] || '',
              account_number: row['Account Number'] || row['Account'] || `ACC-${Date.now()}-${i}`,
              original_balance: parseFloat(row['Original Balance'] || row['Balance'] || 0),
              current_balance: parseFloat(row['Current Balance'] || row['Balance'] || 0),
              original_creditor: row['Original Creditor'] || row['Creditor'] || '',
              charge_off_date: row['Charge Off Date'] || '',
              last_payment_date: row['Last Payment Date'] || '',
              status: 'new',
              priority: 'medium'
            };

            await Case.create(debtData);
            results.success++;
          } catch (error) {
            results.errors.push(`Row ${i + 2}: ${error.message}`);
          }
        }

        setImportResults(results);
        toast.success(`Import completed! ${results.success} debts imported successfully`);
        if (results.errors.length > 0) {
          toast.warning(`${results.errors.length} rows had errors`);
        }
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

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Debts</h1>
        <p className="text-gray-600 mt-1">Upload a CSV file to import multiple debt records</p>
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
                  <Label>Vendor *</Label>
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
              disabled={!file || !selectedPortfolio || !selectedVendor || !scrubMethod || isProcessing}
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