import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Copy, Eye, Mail, MessageSquare, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function TemplateManager() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    variables: '',
    status: 'active'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const savedTemplates = JSON.parse(localStorage.getItem('communication_templates') || '[]');
    const defaultTemplates = [
      {
        id: '1',
        name: 'Initial Contact Email',
        type: 'email',
        subject: 'Important Notice Regarding Your Account - {{account_number}}',
        content: `Dear {{debtor_name}},

We are writing to inform you about an outstanding balance on your account.

Account Details:
- Account Number: {{account_number}}
- Original Creditor: {{original_creditor}}
- Current Balance: ${{current_balance}}
- Charge-off Date: {{charge_off_date}}

Please contact us at your earliest convenience to discuss payment options.

Best regards,
{{company_name}}
Phone: {{company_phone}}`,
        variables: 'debtor_name,account_number,original_creditor,current_balance,charge_off_date,company_name,company_phone',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Payment Reminder SMS',
        type: 'sms',
        subject: '',
        content: 'Reminder: Your account {{account_number}} has an outstanding balance of ${{current_balance}}. Please call {{company_phone}} to arrange payment.',
        variables: 'account_number,current_balance,company_phone',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Settlement Offer Letter',
        type: 'letter',
        subject: 'Settlement Offer - Account {{account_number}}',
        content: `{{date}}

{{debtor_name}}
{{debtor_address}}

RE: Account Number {{account_number}}
Original Creditor: {{original_creditor}}
Current Balance: ${{current_balance}}

Dear {{debtor_name}},

We are pleased to offer you a settlement opportunity for the above-referenced account.

Settlement Offer: ${{settlement_amount}} ({{settlement_percentage}}% of current balance)
Offer Valid Until: {{offer_expiration}}

This is a limited-time offer to resolve your account. Please contact us immediately to accept this settlement.

Sincerely,
{{company_name}}`,
        variables: 'date,debtor_name,debtor_address,account_number,original_creditor,current_balance,settlement_amount,settlement_percentage,offer_expiration,company_name',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    if (savedTemplates.length === 0) {
      localStorage.setItem('communication_templates', JSON.stringify(defaultTemplates));
      setTemplates(defaultTemplates);
    } else {
      setTemplates(savedTemplates);
    }
  };

  const saveTemplate = () => {
    if (!formData.name || !formData.content) {
      toast.error('Please fill in required fields');
      return;
    }

    const newTemplate = {
      id: selectedTemplate?.id || Date.now().toString(),
      ...formData,
      created_at: selectedTemplate?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedTemplates;
    if (selectedTemplate) {
      updatedTemplates = templates.map(t => t.id === selectedTemplate.id ? newTemplate : t);
    } else {
      updatedTemplates = [...templates, newTemplate];
    }

    setTemplates(updatedTemplates);
    localStorage.setItem('communication_templates', JSON.stringify(updatedTemplates));
    
    setIsFormOpen(false);
    setSelectedTemplate(null);
    setFormData({ name: '', type: 'email', subject: '', content: '', variables: '', status: 'active' });
    toast.success(selectedTemplate ? 'Template updated' : 'Template created');
  };

  const deleteTemplate = (template) => {
    if (window.confirm(`Delete template "${template.name}"?`)) {
      const updatedTemplates = templates.filter(t => t.id !== template.id);
      setTemplates(updatedTemplates);
      localStorage.setItem('communication_templates', JSON.stringify(updatedTemplates));
      toast.success('Template deleted');
    }
  };

  const duplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString()
    };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('communication_templates', JSON.stringify(updatedTemplates));
    toast.success('Template duplicated');
  };

  const editTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables || '',
      status: template.status
    });
    setIsFormOpen(true);
  };

  const previewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'letter': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'letter': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('AdminDashboard'))} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
          <p className="text-gray-600 mt-1">Manage communication templates for emails, SMS, and letters</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'email' && (
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter template content. Use {{variable_name}} for dynamic content."
                  rows={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Available Variables</Label>
                <Input
                  value={formData.variables}
                  onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                  placeholder="Comma-separated list: debtor_name,account_number,current_balance"
                />
                <p className="text-xs text-gray-500">
                  Common variables: debtor_name, account_number, current_balance, original_creditor, company_name
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button onClick={saveTemplate}>
                  {selectedTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="font-medium">{template.name}</div>
                    {template.subject && (
                      <div className="text-sm text-gray-500">{template.subject}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(template.type)}>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(template.type)}
                        {template.type.toUpperCase()}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {template.variables ? template.variables.split(',').length : 0} variables
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(template.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => previewTemplate(template)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => editTemplate(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => duplicateTemplate(template)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedTemplate.type)}
                    <span className="capitalize">{selectedTemplate.type}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={selectedTemplate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedTemplate.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedTemplate.subject && (
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {selectedTemplate.subject}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Content</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded border whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              </div>

              {selectedTemplate.variables && (
                <div>
                  <Label className="text-sm font-medium">Variables</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedTemplate.variables.split(',').map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {`{{${variable.trim()}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}