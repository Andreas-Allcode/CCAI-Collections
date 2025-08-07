
import React, { useState, useEffect } from 'react';
import { Communication, Template, Case, Debtor } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Search,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Send,
  Eye,
  Edit,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Communications() {
  const [communications, setCommunications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [cases, setCases] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [commsRes, tempsRes, casesRes, debtorsRes] = await Promise.all([
        Communication.list('-sent_date'),
        Template.list(),
        Case.list(),
        Debtor.list()
      ]);
      setCommunications(commsRes || []);
      setTemplates(tempsRes || []);
      setCases(casesRes || []);
      setDebtors(debtorsRes || []);
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDebtorName = (caseId) => {
    const case_ = cases.find(c => c.id === caseId);
    if (case_?.debtor_id) {
      const debtor = debtors.find(d => d.id === case_.debtor_id);
      return debtor?.name || case_.debtor_name;
    }
    return case_?.debtor_name || 'Unknown';
  };

  const filteredCommunications = (communications || []).filter(comm => {
    const debtorName = getDebtorName(comm.case_id);
    const matchesSearch = comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || comm.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'letter': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      bounced: 'bg-red-100 text-red-800',
      opened: 'bg-blue-100 text-blue-800',
      clicked: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-1">Manage templates and communication logs</p>
        </div>
        <Link to={createPageUrl("NewTemplate")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Communication Logs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search communications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterType === 'email' ? 'default' : 'outline'}
                onClick={() => setFilterType('email')}
                size="sm"
              >
                Email
              </Button>
              <Button
                variant={filterType === 'sms' ? 'default' : 'outline'}
                onClick={() => setFilterType('sms')}
                size="sm"
              >
                SMS
              </Button>
              <Button
                variant={filterType === 'call' ? 'default' : 'outline'}
                onClick={() => setFilterType('call')}
                size="sm"
              >
                Calls
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold">{communications.length}</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">
                      {communications.filter(c => c.delivery_status === 'delivered').length}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Opened</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {communications.filter(c => c.delivery_status === 'opened').length}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {communications.filter(c => ['failed', 'bounced'].includes(c.delivery_status)).length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject/Content</TableHead>
                    <TableHead>Debtor</TableHead>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredCommunications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No communications found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommunications.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(comm.type)}
                            <span className="capitalize">{comm.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{comm.subject || 'No subject'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {comm.content?.substring(0, 50)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{getDebtorName(comm.case_id)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{comm.case_id}</Badge>
                        </TableCell>
                        <TableCell>
                          {comm.sent_date ? format(new Date(comm.sent_date), 'MMM d, h:mm a') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(comm.delivery_status)}>
                            {comm.delivery_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">No Templates Found</h3>
                <p className="text-gray-500 mt-2">Create your first communication template.</p>
              </div>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {template.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {template.body?.substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2">
                      <Link to={createPageUrl(`NewTemplate?id=${template.id}`)}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
