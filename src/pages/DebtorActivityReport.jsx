import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Search, Calendar, User, FileText } from 'lucide-react';
import { Case, ActivityLog, Payment, Communication } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function DebtorActivityReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get('caseId');
  
  const [caseData, setCaseData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [payments, setPayments] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      loadDebtorData();
    }
  }, [caseId]);

  const loadDebtorData = async () => {
    try {
      const [caseInfo, activityData, paymentData, commData] = await Promise.all([
        Case.get(caseId),
        ActivityLog.list(),
        Payment.list(),
        Communication.list()
      ]);

      setCaseData(caseInfo);
      setActivities((activityData || []).filter(a => a.case_id === caseId));
      setPayments((paymentData || []).filter(p => p.case_id === caseId));
      setCommunications((commData || []).filter(c => c.case_id === caseId));
    } catch (error) {
      console.error('Error loading debtor data:', error);
      toast.error('Failed to load debtor activity');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!caseData) return;

    const reportData = [
      ['Debtor Activity Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Debtor Information:'],
      ['Name:', caseData.debtor_name],
      ['Account:', caseData.account_number],
      ['Current Balance:', `$${caseData.current_balance}`],
      ['Status:', caseData.status],
      [''],
      ['Activity Log:'],
      ['Date', 'Type', 'Description', 'Performed By'],
      ...activities.map(a => [
        new Date(a.activity_date).toLocaleString(),
        a.activity_type,
        a.description,
        a.performed_by
      ]),
      [''],
      ['Payments:'],
      ['Date', 'Amount', 'Method', 'Status'],
      ...payments.map(p => [
        new Date(p.payment_date).toLocaleDateString(),
        `$${p.amount}`,
        p.payment_method,
        p.status
      ]),
      [''],
      ['Communications:'],
      ['Date', 'Type', 'Subject', 'Status'],
      ...communications.map(c => [
        new Date(c.sent_date).toLocaleDateString(),
        c.type,
        c.subject || c.content?.substring(0, 50) + '...',
        c.delivery_status
      ])
    ];

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debtor_activity_${caseData.account_number}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('Report exported successfully');
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      account_created: 'bg-blue-100 text-blue-800',
      dvn_sent: 'bg-purple-100 text-purple-800',
      scrub_started: 'bg-orange-100 text-orange-800',
      payment_received: 'bg-green-100 text-green-800',
      communication_sent: 'bg-indigo-100 text-indigo-800',
      status_changed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredActivities = activities.filter(activity =>
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.activity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Debts'))} className="pl-0 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debts
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-500">Debtor not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('Debts'))} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debts
      </Button>

      {/* Debtor Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{caseData.debtor_name}</h1>
                  <p className="text-gray-600">Account: {caseData.account_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={caseData.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                  {caseData.status?.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-gray-600">
                  Current Balance: <span className="font-semibold">${caseData.current_balance?.toLocaleString()}</span>
                </span>
              </div>
            </div>
            <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payments</p>
                <p className="text-2xl font-bold text-green-600">{payments.length}</p>
              </div>
              <div className="text-green-500">$</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Communications</p>
                <p className="text-2xl font-bold text-purple-600">{communications.length}</p>
              </div>
              <div className="text-purple-500">@</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-green-500">✓</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Activity Timeline</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No activities found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities
                  .sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date))
                  .map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        {new Date(activity.activity_date).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActivityTypeColor(activity.activity_type)}>
                          {activity.activity_type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>{activity.performed_by}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments & Communications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payments recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">${payment.amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication History</CardTitle>
          </CardHeader>
          <CardContent>
            {communications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No communications sent</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communications.map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>{new Date(comm.sent_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{comm.type}</TableCell>
                      <TableCell>
                        <Badge className={comm.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {comm.delivery_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}