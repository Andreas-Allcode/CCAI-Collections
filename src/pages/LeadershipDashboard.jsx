import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, TrendingUp, Users, AlertTriangle, Target, 
  Calendar, Pause, RefreshCw, Download
} from 'lucide-react';
import { Portfolio, Case, Payment } from '@/api/entities';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function LeadershipDashboard() {
  const [timeRange, setTimeRange] = useState('monthly');
  const [data, setData] = useState({
    portfolios: [],
    cases: [],
    payments: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [portfolios, cases, payments] = await Promise.all([
        Portfolio.list(),
        Case.list(),
        Payment.list()
      ]);

      setData({
        portfolios: portfolios || [],
        cases: cases || [],
        payments: payments || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMetrics = () => {
    const now = new Date();
    const payments = data.payments.filter(p => p.status === 'completed');
    
    // Daily payments (today)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate >= today;
    });
    const dailyTotal = dailyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Weekly payments (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyPayments = payments.filter(p => new Date(p.payment_date) >= weekAgo);
    const weeklyTotal = weeklyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Monthly payments (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = payments.filter(p => new Date(p.payment_date) >= monthStart);
    const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Yearly payments (current year)
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearlyPayments = payments.filter(p => new Date(p.payment_date) >= yearStart);
    const yearlyTotal = yearlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return { dailyTotal, weeklyTotal, monthlyTotal, yearlyTotal };
  };

  const getOnHoldAccounts = () => {
    return data.cases.filter(c => c.status === 'on_hold' || c.status === 'disputed').length;
  };

  const getProjectedIncome = () => {
    // Calculate based on payment plans and scheduled payments
    const paymentPlanCases = data.cases.filter(c => c.status === 'payment_plan');
    const avgMonthlyPayment = 150; // Estimated average monthly payment
    return paymentPlanCases.length * avgMonthlyPayment * 12;
  };

  const getPortfolioPerformance = () => {
    return data.portfolios.map(portfolio => {
      const portfolioCases = data.cases.filter(c => c.portfolio_id === portfolio.id);
      const caseIds = portfolioCases.map(c => c.id);
      const collected = data.payments
        .filter(p => caseIds.includes(p.case_id) && p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalValue = portfolioCases.reduce((sum, c) => sum + (parseFloat(c.current_balance) || 0), 0);
      
      return {
        name: portfolio.name,
        collected,
        totalValue,
        cases: portfolioCases.length,
        rate: totalValue > 0 ? (collected / totalValue) * 100 : 0
      };
    });
  };

  const getPaymentChannelComparison = () => {
    const onlinePayments = data.payments.filter(p => 
      p.status === 'completed' && 
      ['online', 'credit_card', 'ach'].includes(p.payment_method)
    );
    const agentPayments = data.payments.filter(p => 
      p.status === 'completed' && 
      ['phone', 'check', 'money_order'].includes(p.payment_method)
    );

    const onlineTotal = onlinePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const agentTotal = agentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return [
      { name: 'Online Payments', value: onlineTotal, count: onlinePayments.length },
      { name: 'Agent Collected', value: agentTotal, count: agentPayments.length }
    ];
  };

  const getPaymentTrend = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthPayments = data.payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear() &&
               p.status === 'completed';
      });
      
      const total = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      months.push({ month: monthName, amount: total, count: monthPayments.length });
    }
    
    return months;
  };

  const paymentMetrics = getPaymentMetrics();
  const onHoldAccounts = getOnHoldAccounts();
  const projectedIncome = getProjectedIncome();
  const portfolioPerformance = getPortfolioPerformance();
  const paymentChannels = getPaymentChannelComparison();
  const paymentTrend = getPaymentTrend();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leadership dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leadership Dashboard</h1>
          <p className="text-gray-600 mt-1">Executive KPIs and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Payment KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Payments</p>
                <p className="text-xl font-bold text-green-600">${paymentMetrics.dailyTotal.toLocaleString()}</p>
              </div>
              <Calendar className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Payments</p>
                <p className="text-xl font-bold text-blue-600">${paymentMetrics.weeklyTotal.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Payments</p>
                <p className="text-xl font-bold text-purple-600">${paymentMetrics.monthlyTotal.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Yearly Payments</p>
                <p className="text-xl font-bold text-indigo-600">${paymentMetrics.yearlyTotal.toLocaleString()}</p>
              </div>
              <Target className="w-6 h-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Hold Accounts</p>
                <p className="text-xl font-bold text-orange-600">{onHoldAccounts}</p>
              </div>
              <Pause className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">12-Month Projected Income</p>
                <p className="text-2xl font-bold text-green-600">${projectedIncome.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Based on active payment plans</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Active Cases</p>
                <p className="text-2xl font-bold text-blue-600">{data.cases.length}</p>
                <p className="text-xs text-gray-500">Across all portfolios</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Payment Trends</TabsTrigger>
          <TabsTrigger value="portfolios">Portfolio Performance</TabsTrigger>
          <TabsTrigger value="channels">Payment Channels</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Payment Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={paymentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolioPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Collected']} />
                    <Bar dataKey="collected" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Online vs Agent Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChannels}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentChannels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentChannels.map((channel, index) => (
                    <div key={channel.name} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-sm text-gray-600">{channel.count} payments</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${channel.value.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">
                          Avg: ${channel.count > 0 ? Math.round(channel.value / channel.count).toLocaleString() : '0'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Next 30 Days</p>
                      <p className="text-sm text-gray-600">Based on payment plans</p>
                    </div>
                    <p className="font-bold text-xl text-green-600">
                      ${Math.round(projectedIncome / 12).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Next 90 Days</p>
                      <p className="text-sm text-gray-600">Quarterly projection</p>
                    </div>
                    <p className="font-bold text-xl text-blue-600">
                      ${Math.round(projectedIncome / 4).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium">Next 12 Months</p>
                      <p className="text-sm text-gray-600">Annual projection</p>
                    </div>
                    <p className="font-bold text-xl text-purple-600">
                      ${projectedIncome.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className="font-bold">
                      {portfolioPerformance.length > 0 
                        ? (portfolioPerformance.reduce((sum, p) => sum + p.rate, 0) / portfolioPerformance.length).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Payment Plans</span>
                    <span className="font-bold">{data.cases.filter(c => c.status === 'payment_plan').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Resolved Cases</span>
                    <span className="font-bold">{data.cases.filter(c => ['paid', 'settled'].includes(c.status)).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Portfolios</span>
                    <span className="font-bold">{data.portfolios.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}