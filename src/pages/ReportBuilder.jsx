import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Play, Download, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Portfolio, Case, Payment, Vendor } from '@/api/entities';
import { toast } from 'sonner';

export default function ReportBuilder() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('portfolios');
  const [reportName, setReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const fieldOptions = {
    portfolios: [
      { id: 'name', label: 'Portfolio Name', type: 'text' },
      { id: 'client', label: 'Client', type: 'text' },
      { id: 'portfolio_type', label: 'Type', type: 'select', options: ['committed', 'spec'] },
      { id: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'inactive'] },
      { id: 'total_cases', label: 'Total Cases', type: 'number' },
      { id: 'total_value', label: 'Total Value', type: 'currency' },
      { id: 'total_collected', label: 'Total Collected', type: 'currency' },
      { id: 'collection_rate', label: 'Collection Rate', type: 'percentage' },
      { id: 'created_at', label: 'Created Date', type: 'date' }
    ],
    debts: [
      { id: 'debtor_name', label: 'Debtor Name', type: 'text' },
      { id: 'account_number', label: 'Account Number', type: 'text' },
      { id: 'original_balance', label: 'Original Balance', type: 'currency' },
      { id: 'current_balance', label: 'Current Balance', type: 'currency' },
      { id: 'original_creditor', label: 'Original Creditor', type: 'text' },
      { id: 'status', label: 'Status', type: 'select', options: ['new', 'in_collection', 'payment_plan', 'paid', 'settled', 'legal_action'] },
      { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
      { id: 'portfolio_name', label: 'Portfolio', type: 'text' },
      { id: 'vendor_name', label: 'Vendor', type: 'text' },
      { id: 'scrub_method', label: 'Scrub Method', type: 'select', options: ['experian', 'rnn', 'tlo'] },
      { id: 'charge_off_date', label: 'Charge Off Date', type: 'date' },
      { id: 'created_at', label: 'Created Date', type: 'date' }
    ]
  };

  const handleFieldToggle = (fieldId) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleFilterChange = (fieldId, value) => {
    setFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const runReport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    setIsRunning(true);
    try {
      let data = [];
      
      if (reportType === 'portfolios') {
        const [portfolios, cases, payments] = await Promise.all([
          Portfolio.list(),
          Case.list(),
          Payment.list()
        ]);

        data = portfolios.map(portfolio => {
          const portfolioCases = cases.filter(c => c.portfolio_id === portfolio.id);
          const totalValue = portfolioCases.reduce((sum, c) => sum + (parseFloat(c.current_balance) || 0), 0);
          const caseIds = portfolioCases.map(c => c.id);
          const totalCollected = payments
            .filter(p => caseIds.includes(p.case_id) && p.status === 'completed')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          const collectionRate = totalValue > 0 ? (totalCollected / totalValue) * 100 : 0;

          return {
            ...portfolio,
            total_cases: portfolioCases.length,
            total_value: totalValue,
            total_collected: totalCollected,
            collection_rate: collectionRate
          };
        });
      } else {
        const [cases, portfolios, vendors, payments] = await Promise.all([
          Case.list(),
          Portfolio.list(),
          Vendor.list(),
          Payment.list()
        ]);

        data = cases.map(case_ => {
          const portfolio = portfolios.find(p => p.id === case_.portfolio_id);
          const vendor = vendors.find(v => v.id === case_.vendor_id);
          
          return {
            ...case_,
            portfolio_name: portfolio?.name || '',
            vendor_name: vendor?.name || ''
          };
        });
      }

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value && value !== '') {
          data = data.filter(item => {
            const itemValue = item[field];
            if (typeof itemValue === 'string') {
              return itemValue.toLowerCase().includes(value.toLowerCase());
            }
            return itemValue === value;
          });
        }
      });

      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error running report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = selectedFields.map(fieldId => {
      const field = fieldOptions[reportType].find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        selectedFields.map(fieldId => {
          const value = row[fieldId];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName || 'report'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('Report exported successfully');
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'currency':
        return `$${parseFloat(value).toLocaleString()}`;
      case 'percentage':
        return `${parseFloat(value).toFixed(1)}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('Reports'))} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
        <p className="text-gray-600 mt-1">Create custom reports for portfolios and debts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolios">Portfolios</SelectItem>
                    <SelectItem value="debts">Debts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fieldOptions[reportType].map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => handleFieldToggle(field.id)}
                    />
                    <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fieldOptions[reportType]
                .filter(field => field.type === 'text')
                .slice(0, 3)
                .map(field => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    className="h-8"
                    placeholder={`Filter by ${field.label.toLowerCase()}`}
                    onChange={(e) => handleFilterChange(field.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={runReport} disabled={isRunning} className="w-full">
              {isRunning ? 'Running...' : <><Play className="w-4 h-4 mr-2" />Run Report</>}
            </Button>
            <Button onClick={exportReport} variant="outline" className="w-full" disabled={reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Report Results ({reportData.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Run a report to see results</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedFields.map(fieldId => {
                          const field = fieldOptions[reportType].find(f => f.id === fieldId);
                          return <TableHead key={fieldId}>{field?.label || fieldId}</TableHead>;
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.slice(0, 50).map((row, index) => (
                        <TableRow key={index}>
                          {selectedFields.map(fieldId => {
                            const field = fieldOptions[reportType].find(f => f.id === fieldId);
                            return (
                              <TableCell key={fieldId}>
                                {formatValue(row[fieldId], field?.type)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {reportData.length > 50 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing first 50 of {reportData.length} records. Export to see all data.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}