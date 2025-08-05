
import React, { useState, useEffect } from 'react';
import { Portfolio } from '@/api/entities';
import { Case } from '@/api/entities';
import { Payment } from '@/api/entities';
import { Communication } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Download,
  Calendar,
  DollarSign,
  Users,
  Percent,
  AlertTriangle,
  UserX,
  Scale
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function Reports() {
  const [portfolios, setPortfolios] = useState([]);
  const [cases, setCases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfolioData, caseData, paymentData, commData] = await Promise.all([
        Portfolio.list(),
        Case.list(),
        Payment.list(),
        Communication.list()
      ]);

      setPortfolios(portfolioData || []);
      setCases(caseData || []);
      setPayments(paymentData || []);
      setCommunications(commData || []);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    let filteredCases = cases || [];
    let filteredPayments = payments || [];

    if (selectedPortfolio !== 'all') {
      filteredCases = (cases || []).filter(c => c.portfolio_id === selectedPortfolio);
      const caseIds = filteredCases.map(c => c.id);
      filteredPayments = (payments || []).filter(p => caseIds.includes(p.case_id));
    }

    return { filteredCases, filteredPayments };
  };

  const getCollectionTrend = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthlyPayments = (payments || []).filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'completed';
      });
      
      months.push({
        month: format(date, 'MMM yyyy'),
        collected: monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        count: monthlyPayments.length
      });
    }
    
    return months;
  };

  const getStatusDistribution = () => {
    const { filteredCases } = getFilteredData();
    const statusCounts = (filteredCases || []).reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  };

  const getPortfolioPerformance = () => {
    return (portfolios || []).map(portfolio => {
      const portfolioCases = (cases || []).filter(c => c.portfolio_id === portfolio.id);
      const caseIds = portfolioCases.map(c => c.id);
      const portfolioPayments = (payments || []).filter(p => caseIds.includes(p.case_id) && p.status === 'completed');
      const totalCollected = portfolioPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Calculate key metrics
      const bankruptcyCount = portfolioCases.filter(c => c.status === 'bankruptcy').length;
      const deceasedCount = portfolioCases.filter(c => c.status === 'deceased').length;
      const disputedCount = portfolioCases.filter(c => c.status === 'disputed').length;
      const successfulCount = portfolioCases.filter(c => ['paid', 'settled'].includes(c.status)).length;
      
      const totalCases = portfolioCases.length;
      const bankruptcyPercent = totalCases > 0 ? (bankruptcyCount / totalCases) * 100 : 0;
      const deceasedPercent = totalCases > 0 ? (deceasedCount / totalCases) * 100 : 0;
      const disputedPercent = totalCases > 0 ? (disputedCount / totalCases) * 100 : 0;
      const successPercent = totalCases > 0 ? (successfulCount / totalCases) * 100 : 0;
      const collectionRate = portfolio.total_face_value > 0 ? (totalCollected / portfolio.total_face_value) * 100 : 0;

      return {
        id: portfolio.id,
        name: portfolio.name,
        client: portfolio.client,
        original_creditor: portfolio.original_creditor,
        portfolio_type: portfolio.portfolio_type,
        total_face_value: portfolio.total_face_value,
        collected: totalCollected,
        collectionRate: collectionRate,
        cases: totalCases,
        bankruptcyPercent: Math.round(bankruptcyPercent * 100) / 100,
        deceasedPercent: Math.round(deceasedPercent * 100) / 100,
        disputedPercent: Math.round(disputedPercent * 100) / 100,
        successPercent: Math.round(successPercent * 100) / 100,
        bankruptcyCount,
        deceasedCount,
        disputedCount,
        successfulCount
      };
    });
  };

  const collectionTrend = getCollectionTrend();
  const statusDistribution = getStatusDistribution();
  const portfolioPerformance = getPortfolioPerformance();
  const { filteredCases, filteredPayments } = getFilteredData();

  const totalCollected = (filteredPayments || [])
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Portfolio performance insights and debt collection metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select portfolio" />
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debts</p>
                <p className="text-2xl font-bold">{(filteredCases || []).length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalCollected.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Active Debts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(filteredCases || []).filter(c => c.status === 'in_collection').length}
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
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(filteredCases || []).length > 0 ? 
                    Math.round(((filteredCases || []).filter(c => ['paid', 'settled'].includes(c.status)).length / (filteredCases || []).length) * 100) : 0}%
                </p>
              </div>
              <Percent className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Collection Trend (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={collectionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Collected']} />
                      <Line type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  Debt Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(statusDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={collectionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="collected" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolioPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Collected']} />
                    <Bar dataKey="collected" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Detailed Portfolio Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Original Creditor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Debts</TableHead>
                      <TableHead>Face Value</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Collection %</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Scale className="w-4 h-4" />
                          Bankrupt %
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UserX className="w-4 h-4" />
                          Deceased %
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Disputed %
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Success %
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(portfolioPerformance || []).map((portfolio) => (
                      <TableRow key={portfolio.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{portfolio.name}</TableCell>
                        <TableCell>{portfolio.client}</TableCell>
                        <TableCell>{portfolio.original_creditor}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            portfolio.portfolio_type === 'committed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {portfolio.portfolio_type}
                          </span>
                        </TableCell>
                        <TableCell>{portfolio.cases}</TableCell>
                        <TableCell>${portfolio.total_face_value?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ${portfolio.collected.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(portfolio.collectionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {portfolio.collectionRate.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-semibold ${
                              portfolio.bankruptcyPercent > 10 ? 'text-red-600' : 
                              portfolio.bankruptcyPercent > 5 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {portfolio.bankruptcyPercent}%
                            </span>
                            <span className="text-xs text-gray-500">
                              ({portfolio.bankruptcyCount})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-semibold ${
                              portfolio.deceasedPercent > 8 ? 'text-red-600' : 
                              portfolio.deceasedPercent > 3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {portfolio.deceasedPercent}%
                            </span>
                            <span className="text-xs text-gray-500">
                              ({portfolio.deceasedCount})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-semibold ${
                              portfolio.disputedPercent > 15 ? 'text-red-600' : 
                              portfolio.disputedPercent > 8 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {portfolio.disputedPercent}%
                            </span>
                            <span className="text-xs text-gray-500">
                              ({portfolio.disputedCount})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-semibold ${
                              portfolio.successPercent > 20 ? 'text-green-600' : 
                              portfolio.successPercent > 10 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {portfolio.successPercent}%
                            </span>
                            <span className="text-xs text-gray-500">
                              ({portfolio.successfulCount})
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Communication Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Sent</span>
                    <span className="font-semibold">{(communications || []).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivered</span>
                    <span className="font-semibold text-green-600">
                      {(communications || []).filter(c => c.delivery_status === 'delivered').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opened</span>
                    <span className="font-semibold text-blue-600">
                      {(communications || []).filter(c => c.delivery_status === 'opened').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed</span>
                    <span className="font-semibold text-red-600">
                      {(communications || []).filter(c => ['failed', 'bounced'].includes(c.delivery_status)).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['email', 'sms', 'call', 'letter'].map(type => {
                    const count = (communications || []).filter(c => c.type === type).length;
                    const percentage = (communications || []).length > 0 ? (count / (communications || []).length) * 100 : 0;
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize">{type}</span>
                          <span className="font-semibold">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
