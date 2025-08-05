
import React, { useState, useEffect } from 'react';
import { Payment } from '@/api/entities';
import { Case } from '@/api/entities';
import { Debtor } from '@/api/entities';
import { Portfolio } from '@/api/entities';
import { PaymentPlan } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  CreditCard,
  Calendar,
  Search,
  Plus,
  TrendingUp,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import RecordPaymentForm from '../components/payments/RecordPaymentForm';
import { exportPayments } from '@/api/functions';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [cases, setCases] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPortfolio, setFilterPortfolio] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        Payment.list('-payment_date'),
        PaymentPlan.list(),
        Case.list(),
        Debtor.list(),
        Portfolio.list()
      ]);

      const getSafeArray = (result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          return result.value.filter(item => item != null);
        }
        return [];
      };

      const safePayments = getSafeArray(results[0]);
      const safePlans = getSafeArray(results[1]);
      const safeCases = getSafeArray(results[2]);
      const safeDebtors = getSafeArray(results[3]);
      const safePortfolios = getSafeArray(results[4]);

      // Create a temporary debtor map for enriching cases
      const tempDebtorMap = safeDebtors.reduce((map, obj) => {
        if (obj && obj.id) map[obj.id] = obj;
        return map;
      }, {});

      // Generate account numbers for cases that don't have them
      // And enrich cases with the latest debtor name from the fetched debtor list
      const casesToUpdate = [];
      const updatedCases = safeCases.map(caseItem => {
        let newCaseItem = { ...caseItem }; // Create a mutable copy

        // Enrich with debtor name from the fetched debtors list
        if (newCaseItem.debtor_id && tempDebtorMap[newCaseItem.debtor_id]) {
          newCaseItem.debtor_name = tempDebtorMap[newCaseItem.debtor_id].name;
        }

        if (!newCaseItem.account_number) {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const newAccountNumber = `ACC-${dateStr}-${randomNum}`;
          
          casesToUpdate.push({ id: newCaseItem.id, account_number: newAccountNumber });
          newCaseItem.account_number = newAccountNumber; // Update the copy
        }
        return newCaseItem; // Return the potentially modified copy
      });

      // Update cases with missing account numbers in background
      if (casesToUpdate.length > 0) {
        casesToUpdate.forEach(async ({ id, account_number }) => {
          try {
            await Case.update(id, { account_number });
          } catch (error) {
            console.error(`Failed to update case ${id} with account number:`, error);
          }
        });
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyPayments = safePayments.filter(payment => {
        try {
          const paymentDate = new Date(payment.payment_date);
          return paymentDate.getMonth() === currentMonth &&
                 paymentDate.getFullYear() === currentYear;
        } catch {
          return false;
        }
      });

      const totalCollected = safePayments
        .filter(p => p && p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const monthlyCollected = monthlyPayments
        .filter(p => p && p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setPayments(safePayments);
      setPaymentPlans(safePlans);
      setCases(updatedCases);
      setDebtors(safeDebtors);
      setPortfolios(safePortfolios);
      setStats({
        totalCollected,
        monthlyCollected,
        totalPayments: safePayments.length,
        activePlans: safePlans.filter(p => p && p.status === 'active').length
      });
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error("Failed to load payment data.");
      // Set empty arrays on error to prevent crashes
      setPayments([]);
      setPaymentPlans([]);
      setCases([]);
      setDebtors([]);
      setPortfolios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, status } = await exportPayments();
      if (status !== 200) {
        throw new Error("Failed to fetch export data.");
      }

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Payments exported successfully!");

    } catch (error) {
        console.error("Export error:", error);
        toast.error("Failed to export payments.");
    } finally {
        setIsExporting(false);
    }
  };

  // Create lookup maps with safe array handling
  const caseMap = Array.isArray(cases) ? cases.reduce((map, obj) => {
    if (obj && obj.id) map[obj.id] = obj;
    return map;
  }, {}) : {};

  const debtorMap = Array.isArray(debtors) ? debtors.reduce((map, obj) => {
    if (obj && obj.id) map[obj.id] = obj;
    return map;
  }, {}) : {};

  const portfolioMap = Array.isArray(portfolios) ? portfolios.reduce((map, obj) => {
    if (obj && obj.id) map[obj.id] = obj;
    return map;
  }, {}) : {};

  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    if (!payment) return false;
    const caseForPayment = caseMap[payment.case_id];
    const accountNumber = caseForPayment ? caseForPayment.account_number : '';

    const matchesSearch = accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesPortfolio = filterPortfolio === 'all' || (caseForPayment && caseForPayment.portfolio_id === filterPortfolio);
    
    return matchesSearch && matchesStatus && matchesPortfolio;
  }) : [];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Toaster richColors />
      <RecordPaymentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={loadData} />
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track payments and manage payment plans</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(stats.totalCollected || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  ${(stats.monthlyCollected || 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{stats.totalPayments || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold">{stats.activePlans || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="plans">Payment Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by account number or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Select value={filterPortfolio} onValueChange={setFilterPortfolio}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Portfolios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portfolios</SelectItem>
                  {(portfolios || []).map(portfolio => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('completed')}
                size="sm"
              >
                Completed
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'failed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('failed')}
                size="sm"
              >
                Failed
              </Button>
            </div>
          </div>

          {/* Payments Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Debtor</TableHead>
                    <TableHead>Portfolio</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(10).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No payments found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => {
                      const caseForPayment = caseMap[payment.case_id];
                      const debtor = caseForPayment ? debtorMap[caseForPayment.debtor_id] : null;
                      const portfolio = caseForPayment ? portfolioMap[caseForPayment.portfolio_id] : null;

                      let debtorName = 'Unknown Case';
                      if (caseForPayment) {
                          if (debtor && debtor.name) {
                              debtorName = debtor.name;
                          } else if (caseForPayment.debtor_name) {
                              debtorName = caseForPayment.debtor_name;
                          } else {
                              debtorName = '[Unnamed Debtor]';
                          }
                      }

                      const debtorId = debtor ? debtor.id : null;
                      const accountNumber = caseForPayment ? caseForPayment.account_number : 'N/A';

                      return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-gray-400" />
                           {debtorId ? (
                              <Link to={createPageUrl(`DebtorDetails?id=${debtorId}`)} className="font-medium text-blue-600 hover:underline">
                                  {debtorName}
                              </Link>
                           ) : (
                              <span className="font-medium">{debtorName}</span>
                           )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {portfolio ? (
                            <Link to={createPageUrl(`PortfolioDetails?id=${portfolio.id}`)} className="text-blue-600 hover:underline">
                              {portfolio.name}
                            </Link>
                          ) : (
                            <span className="text-gray-500">Unknown Portfolio</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{accountNumber}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            ${(payment.amount || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payment.payment_method)}
                            <span className="capitalize">
                              {(payment.payment_method || '').replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.payment_date ?
                            format(new Date(payment.payment_date), 'MMM d, yyyy') :
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.transaction_id || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )})
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(paymentPlans) && paymentPlans.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800">No Payment Plans</h3>
                    <p className="text-gray-500 mt-2">Payment plans will appear here once created.</p>
                  </div>
                ) : (
                  (paymentPlans || []).map((plan) => {
                    const caseForPlan = caseMap[plan.case_id];
                    const planAccountNumber = caseForPlan ? caseForPlan.account_number : 'N/A';

                    return (
                      <Card key={plan.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{planAccountNumber}</Badge>
                              <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {plan.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">
                                ${(plan.monthly_payment || 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">per {plan.frequency}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{plan.payments_made || 0} payments made</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(((plan.amount_paid || 0) / (plan.total_amount || 1)) * 100, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>${(plan.amount_paid || 0).toLocaleString()} paid</span>
                                <span>${(plan.total_amount || 0).toLocaleString()} total</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
