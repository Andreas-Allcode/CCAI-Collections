
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, FileText, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Portfolio } from '@/api/entities';
import { Case } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import usePermissions from '@/components/hooks/usePermissions'; // Updated import path

// Dynamically get fields, can be extended with a schema utility if needed
const caseSchema = Case.schema() || { properties: {} };
const caseFields = Object.keys(caseSchema.properties);

export default function PortfolioImport() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [fullFileRows, setFullFileRows] = useState([]); // Store all rows from file
  const [previewRows, setPreviewRows] = useState([]); // For display (first 10 rows)
  const [mapping, setMapping] = useState({});
  const [portfolioDetails, setPortfolioDetails] = useState({
    name: '',
    client: '',
    original_creditor: '',
    portfolio_type: 'spec',
    litigation_eligible: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { canEdit } = usePermissions(); // Use the permissions hook

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const allLines = text.split('\n').filter(line => line.trim() !== ''); // Filter out empty lines
        if (allLines.length === 0) {
          alert("CSV file is empty.");
          return;
        }

        const fileHeaders = allLines[0].trim().split(',');
        // Store all rows, excluding the header
        const allParsedRows = allLines.slice(1).map(line => line.trim().split(','));
        // Preview only 10 rows for display
        const previewParsedRows = allParsedRows.slice(0, 10);

        setHeaders(fileHeaders);
        setFullFileRows(allParsedRows);
        setPreviewRows(previewParsedRows);
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

  const handlePortfolioDetailChange = (field, value) => {
    setPortfolioDetails(prev => ({...prev, [field]: value}));
  };
  
  const handleSave = async () => {
    setIsProcessing(true);
    try {
        // Calculate total face value from the mapped field
        let totalFaceValue = 0;
        const faceValueField = Object.keys(mapping).find(key => mapping[key] === 'face_value'); // Assuming 'face_value' is the target field for face value
        if (faceValueField) {
            const faceValueColIndex = headers.indexOf(faceValueField);
            if (faceValueColIndex !== -1) {
                fullFileRows.forEach(row => {
                    const value = parseFloat(row[faceValueColIndex]);
                    if (!isNaN(value)) {
                        totalFaceValue += value;
                    }
                });
            }
        }

        // 1. Create Portfolio
        const newPortfolio = await Portfolio.create({
            ...portfolioDetails,
            account_count: fullFileRows.length, // Use the full count of rows
            total_face_value: totalFaceValue, // Calculated from file data
        });
        
        // 2. Map and prepare case data
        const casesToCreate = fullFileRows.map(row => { // Use fullFileRows for case creation
            const caseData = {};
            headers.forEach((header, index) => {
                const mappedField = mapping[header];
                if(mappedField && mappedField !== 'ignore') { // Ignore columns explicitly marked to be ignored
                    let value = row[index];
                    // Basic type conversion based on schema
                    const schemaProp = Case.schema().properties[mappedField];
                    if (schemaProp) {
                      switch (schemaProp.type) {
                        case 'number':
                          value = parseFloat(value) || 0;
                          break;
                        case 'boolean':
                          value = ['true', '1', 'yes'].includes(String(value).toLowerCase());
                          break;
                        // Add more type conversions as needed (e.g., date)
                      }
                    }
                    caseData[mappedField] = value;
                }
            });
            caseData.portfolio_id = newPortfolio.id;
            return caseData;
        });

        // 3. Bulk create cases
        if (casesToCreate.length > 0) {
            await Case.bulkCreate(casesToCreate);
        }
        
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
          <p className="text-gray-600">Select the CSV file containing the debt accounts for the new portfolio.</p>
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
          <p className="text-gray-600">Match the columns from your CSV file to the corresponding fields in the system.</p>
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
                    <TableCell className="text-gray-500">{previewRows[0]?.[index]}</TableCell> {/* Use previewRows for sample data */}
                    <TableCell>
                      <Select onValueChange={(value) => handleMappingChange(header, value)} disabled={!canEdit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">-- Ignore this column --</SelectItem>
                          {caseFields.map(field => (
                            <SelectItem key={field} value={field}>{field}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={() => setActiveStep(2)} disabled={!canEdit}>Next: Review</Button>
        </div>
      )
    },
    { 
      label: 'Review & Save', 
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Portfolio Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              placeholder="Portfolio Name" 
              value={portfolioDetails.name} 
              onChange={e => handlePortfolioDetailChange('name', e.target.value)} 
              disabled={!canEdit}
            />
            <Input 
              placeholder="Client LLC" 
              value={portfolioDetails.client} 
              onChange={e => handlePortfolioDetailChange('client', e.target.value)} 
              disabled={!canEdit}
            />
            <Input 
              placeholder="Original Creditor" 
              value={portfolioDetails.original_creditor} 
              onChange={e => handlePortfolioDetailChange('original_creditor', e.target.value)} 
              disabled={!canEdit}
            />
            <Select 
              value={portfolioDetails.portfolio_type} 
              onValueChange={value => handlePortfolioDetailChange('portfolio_type', value)}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="spec">Spec</SelectItem>
                <SelectItem value="committed">Committed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="litigation_eligible" 
              checked={portfolioDetails.litigation_eligible} 
              onCheckedChange={(checked) => handlePortfolioDetailChange('litigation_eligible', checked)} 
              disabled={!canEdit}
            />
            <Label htmlFor="litigation_eligible">
              Eligible for Litigation
            </Label>
          </div>
          <h3 className="text-lg font-semibold">Data Preview</h3>
          <p>{fullFileRows.length} records will be imported.</p> {/* Use fullFileRows for total count */}
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
          <p className="text-gray-500 mt-2">The portfolio and its cases have been imported.</p>
          <Link to={createPageUrl("Portfolios")}>
            <Button className="mt-6">View Portfolios</Button>
          </Link>
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
