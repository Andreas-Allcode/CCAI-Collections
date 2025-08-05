
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, FileText, Check, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Portfolio } from '@/api/entities';
import { Case } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import usePermissions from '@/components/hooks/usePermissions';
import { sendDebtValidationNotices } from "@/api/functions";
import { initiateScrubProcess } from "@/api/functions";

const caseSchema = Case.schema() || { properties: {} };
const caseFields = Object.keys(caseSchema.properties);

export default function DebtImport() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [fullFileRows, setFullFileRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { canEdit, isLoading: permissionsLoading } = usePermissions();

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const portfolioList = await Portfolio.list();
        setPortfolios(portfolioList || []);
      } catch (error) {
        toast.error("Failed to load portfolios.");
        console.error("Error fetching portfolios:", error);
      }
    };
    fetchPortfolios();
  }, []);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const allLines = text.split('\n').filter(line => line.trim() !== '');
        if (allLines.length === 0) {
          toast.error("CSV file is empty.");
          return;
        }

        const fileHeaders = allLines[0].trim().split(',');
        const allParsedRows = allLines.slice(1).map(line => line.trim().split(','));
        const previewParsedRows = allParsedRows.slice(0, 10);

        setHeaders(fileHeaders);
        setFullFileRows(allParsedRows);
        setPreviewRows(previewParsedRows);
        setActiveStep(1);
      };
      reader.readAsText(uploadedFile);
    } else {
      toast.error("Please upload a valid CSV file.");
    }
  };

  const handleMappingChange = (header, field) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handleSave = async () => {
    if (!selectedPortfolioId) {
      toast.error("Please select a portfolio to import the debts into.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const casesToCreate = fullFileRows.map(row => {
        const caseData = {};
        headers.forEach((header, index) => {
          const mappedField = mapping[header];
          if(mappedField && mappedField !== 'ignore') {
            let value = row[index];
            const schemaProp = Case.schema().properties[mappedField];
            if (schemaProp) {
              switch (schemaProp.type) {
                case 'number':
                  value = parseFloat(value) || 0;
                  break;
                case 'boolean':
                  value = ['true', '1', 'yes'].includes(String(value).toLowerCase());
                  break;
              }
            }
            caseData[mappedField] = value;
          }
        });
        caseData.portfolio_id = selectedPortfolioId;
        return caseData;
      });

      if (casesToCreate.length > 0) {
        const createdCases = await Case.bulkCreate(casesToCreate);
        const caseIds = createdCases.map(c => c.id);
        
        toast.success(`${casesToCreate.length} debts imported successfully!`);
        
        // Send debt validation notices for all imported cases
        toast.info("Sending debt validation notices for all imported debts...");
        try {
          const validationResult = await sendDebtValidationNotices({ caseIds });
          if (validationResult.data.success) {
            toast.success("Debt validation notices sent for all imported debts!");
            
            // Wait a moment, then initiate scrub process
            setTimeout(async () => {
              try {
                toast.info("Initiating data scrub process for imported debts...");
                const scrubResult = await initiateScrubProcess({ caseIds });
                if (scrubResult.data.success) {
                  toast.success("Data scrub process completed for all imported debts!");
                } else {
                  toast.warning(`Scrub process warning: ${scrubResult.data.error}`);
                }
              } catch (scrubError) {
                console.error("Scrub process error:", scrubError);
                toast.error("Data scrub process failed, but debts were imported successfully.");
              }
            }, 3000);
          } else {
            toast.warning(`Validation notices warning: ${validationResult.data.error}`);
          }
        } catch (validationError) {
          console.error("Validation notices error:", validationError);
          toast.error("Failed to send validation notices, but debts were imported successfully.");
        }
      } else {
        toast.info("No debts were imported.");
      }
        
      setActiveStep(2);
    } catch (error) {
      console.error("Error importing cases:", error);
      toast.error("An error occurred during import. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (permissionsLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  
  if (!canEdit) {
     return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
            <p className="font-semibold">Permission Denied</p>
            <p className="text-sm">You do not have permission to import new debts.</p>
        </div>
     );
  }

  const steps = [
    { 
      label: 'Upload CSV', 
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">Select the CSV file containing the debt accounts to import.</p>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          </div>
        </div>
      )
    },
    { 
      label: 'Map & Save', 
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="portfolio-select">Select Portfolio *</Label>
            <Select onValueChange={setSelectedPortfolioId} value={selectedPortfolioId}>
              <SelectTrigger id="portfolio-select">
                <SelectValue placeholder="Select which portfolio to add these debts to..." />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">These debts will be added to the portfolio you select here.</p>
          </div>
          <p className="text-gray-600 pt-4 border-t">Match the columns from your CSV file to the corresponding fields.</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Column</TableHead>
                  <TableHead>Sample Data</TableHead>
                  <TableHead>System Field</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell className="text-gray-500">{previewRows[0]?.[index]}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleMappingChange(header, value)}>
                        <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">-- Ignore this column --</SelectItem>
                          {caseFields.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={handleSave} disabled={isProcessing || !selectedPortfolioId} className="w-full">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Review and Import"}
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
          <p className="text-gray-500 mt-2">The new debts have been imported successfully.</p>
          <div className="flex justify-center gap-4 mt-6">
            <Link to={createPageUrl("Debts")}><Button>View Debts</Button></Link>
            <Link to={createPageUrl("Portfolios")}><Button variant="outline">View Portfolios</Button></Link>
          </div>
        </div>
      )
    },
  ];

  const getStepContent = () => {
    if (activeStep === 0) return steps[0].content;
    if (activeStep === 1) return steps[1].content;
    return steps[2].content;
  };

  const getStepLabel = (index) => {
    if (index === 0) return "Upload";
    if (index === 1) return "Map & Save";
    return "Completed";
  };


  return (
    <div className="p-6 md:p-8 space-y-6">
      <Link to={createPageUrl("Debts")} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Debts
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900">Import Debts into a Portfolio</h1>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex-1">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index <= activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {index < activeStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`ml-3 hidden sm:inline ${index <= activeStep ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>{getStepLabel(index)}</span>
                </div>
                {index < 2 && (
                  <div className={`absolute top-1/2 left-0 right-0 h-0.5 -z-10 ${index < activeStep ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ transform: 'translateY(-50%)'}} />
                )}
              </div>
            ))}
          </div>
          <div className="min-h-96">
            {getStepContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
