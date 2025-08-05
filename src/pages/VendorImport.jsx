
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Upload, FileText, Check, Save, Loader2, ChevronsUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Vendor, ImportTemplate } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const vendorFields = Object.keys(Vendor.schema().properties);

export default function VendorImport() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileRows, setFileRows] = useState([]);
  const [fullFileRows, setFullFileRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await ImportTemplate.filter({ target_entity: 'Vendor' });
        setTemplates(data || []);
      } catch (e) {
        toast.error("Could not load import templates.");
      }
    };
    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const allLines = text.split(/\r\n|\n/); // Fix: Use correct regex for newline
        const headers = allLines[0].trim().split(',');
        // Filter out empty lines before mapping
        const fullRows = allLines.slice(1).filter(line => line.trim() !== '').map(line => line.trim().split(','));

        setFileHeaders(headers);
        setFullFileRows(fullRows);
        setFileRows(fullRows.slice(0, 5)); // Preview 5 rows
        setMapping(headers.reduce((acc, h) => ({...acc, [h]: ''}), {}));
        setActiveStep(1);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleMappingChange = (header, field) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };
  
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setMapping(fileHeaders.reduce((acc, h) => ({...acc, [h]: ''}), {}));
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMapping(template.mapping);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
        // 1. Save template if requested
        if (saveTemplate && newTemplateName) {
            await ImportTemplate.create({
                name: newTemplateName,
                target_entity: 'Vendor',
                mapping: mapping,
            });
            toast.success(`Template "${newTemplateName}" saved!`);
        }
        
        // 2. Map and prepare vendor data
        const vendorsToCreate = fullFileRows.map(row => {
            const vendorData = {};
            fileHeaders.forEach((header, index) => {
                const mappedField = mapping[header];
                if(mappedField && mappedField !== 'ignore' && row[index] !== undefined) { // Check for undefined
                    vendorData[mappedField] = row[index];
                }
            });
            return vendorData;
        }).filter(v => Object.keys(v).length > 0); // Filter out empty objects, assume at least one field mapped

        // Basic validation: Ensure 'name' or 'type' (or any critical field) is present if they are required.
        // For simplicity, let's just ensure they have *some* mapped data.
        const validVendorsToCreate = vendorsToCreate.filter(v => 
          vendorFields.some(field => mapping[fileHeaders.find(h => mapping[h] === field)] && v[field])
        );

        if(validVendorsToCreate.length === 0) {
          toast.error("No valid vendors to import. Check your mapping and file data.");
          setIsProcessing(false);
          return;
        }

        // 3. Bulk create vendors
        await Vendor.bulkCreate(validVendorsToCreate);
        toast.success(`${validVendorsToCreate.length} vendors imported successfully!`);
        setActiveStep(3);

    } catch (error) {
        console.error("Error saving vendors:", error);
        toast.error("An error occurred during import.");
    } finally {
        setIsProcessing(false);
    }
  };

  const steps = [
    { label: 'Upload File' },
    { label: 'Map Columns' },
    { label: 'Review & Import' },
    { label: 'Completed' },
  ];
  
  const renderContent = () => {
    switch(activeStep) {
      case 0:
        return (
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select a Mapping Template (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handleTemplateSelect} value={selectedTemplate}>
                  <SelectTrigger><SelectValue placeholder="Load a saved template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>-- None --</SelectItem> {/* Use empty string for 'none' */}
                    {(templates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Map Your Columns</CardTitle>
                <CardDescription>Match columns from your file to the system's vendor fields.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Column</TableHead>
                        <TableHead>Sample Data</TableHead>
                        <TableHead>System Field</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fileHeaders.map((header, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{header}</TableCell>
                          <TableCell className="text-gray-500">{fileRows[0]?.[index]}</TableCell>
                          <TableCell>
                            <Select value={mapping[header] || ''} onValueChange={(value) => handleMappingChange(header, value)}>
                              <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore">-- Ignore --</SelectItem>
                                {vendorFields.map(field => (
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
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => setActiveStep(2)}>Next: Review</Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Import</h3>
            <p className="text-gray-600">{fullFileRows.length} records will be imported.</p>
            <Card>
              <CardHeader><CardTitle>Save Mapping Template</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="save-template" checked={saveTemplate} onCheckedChange={setSaveTemplate} />
                  <Label htmlFor="save-template">Save this column mapping as a new template</Label>
                </div>
                {saveTemplate && (
                  <Input 
                    placeholder="Enter template name..." 
                    value={newTemplateName} 
                    onChange={e => setNewTemplateName(e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setActiveStep(1)}>Back</Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Confirm and Import
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center py-12">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
            <h3 className="text-xl font-semibold text-gray-800">Import Successful</h3>
            <p className="text-gray-500 mt-2">The vendor data has been imported.</p>
            <Button className="mt-6" onClick={() => navigate(createPageUrl("Vendors"))}>
              View Vendors
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Toaster richColors />
      <Link to={createPageUrl("Vendors")} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Vendors
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900">Import New Vendors</h1>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={index} className="flex-1">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${index <= activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {index < activeStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`ml-3 hidden sm:inline ${index <= activeStep ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>{step.label}</span>
                </div>
                {/* Horizontal line for progress indicator */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-4 h-0.5 -z-10 ${index < activeStep ? 'bg-blue-600' : 'bg-gray-200'}`} 
                    style={{
                      left: `calc(${100 / (steps.length - 1) * index}% + 40px)`, 
                      width: `calc(${100 / (steps.length - 1)}% - 80px)`
                    }}
                  ></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="min-h-96">
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
