import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, TrendingUp, Users, AlertTriangle, Target, 
  Calendar, FileText, Settings, Download, RefreshCw
} from 'lucide-react';
import { Portfolio, Case, Payment, Vendor, Communication } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState({
    portfolios: [],
    cases: [],
    payments: [],
    vendors: [],
    communications: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [portfolios, cases, payments, vendors, communications] = await Promise.all([
        Portfolio.list(),
        Case.list(),
        Payment.list(),
        Vendor.list(),
        Communication.list()
      ]);

      setData({
        portfolios: portfolios || [],
        cases: cases || [],
        payments: payments || [],
        vendors: vendors || [],
        communications: communications || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getKPIs = () => {
    const totalValue = data.cases.reduce((sum, c) => sum + (parseFloat(c.current_balance) || 0), 0);
    const totalCollected = data.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const collectionRate = totalValue > 0 ? (totalCollected / totalValue) * 100 : 0;
    const activeVendors = data.vendors.filter(v => v.status === 'active').length;

    return {
      totalValue,
      totalCollected,
      collectionRate,
      activeVendors,
      totalCases: data.cases.length,
      activeCases: data.cases.filter(c => c.status === 'in_collection').length
    };
  };

  const getPortfolioPerformance = () => {
    return data.portfolios.map(portfolio => {
      const portfolioCases = data.cases.filter(c => c.portfolio_id === portfolio.id);
      const caseIds = portfolioCases.map(c => c.id);
      const collected = data.payments
        .filter(p => caseIds.includes(p.case_id) && p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const totalValue = portfolioCases.reduce((sum, c) => sum + (parseFloat(c.current_balance) || 0), 0);
      
      return {
        name: portfolio.name,
        cases: portfolioCases.length,
        value: totalValue,
        collected,
        rate: totalValue > 0 ? (collected / totalValue) * 100 : 0
      };
    });
  };

  const getVendorPerformance = () => {
    return data.vendors.map(vendor => {
      const vendorCases = data.cases.filter(c => c.vendor_id === vendor.id);
      const caseIds = vendorCases.map(c => c.id);
      const collected = data.payments
        .filter(p => caseIds.includes(p.case_id) && p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      return {
        name: vendor.name,
        type: vendor.type,
        cases: vendorCases.length,
        collected,
        status: vendor.status
      };
    });
  };

  const getStatusDistribution = () => {
    const statusCounts = data.cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
  };

  const kpis = getKPIs();
  const portfolioPerformance = getPortfolioPerformance();
  const vendorPerformance = getVendorPerformance();
  const statusDistribution = getStatusDistribution();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate(createPageUrl('TemplateManager'))}>
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl font-bold">${kpis.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collected</p>
                <p className="text-xl font-bold text-green-600">${kpis.totalCollected.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-xl font-bold text-purple-600">{kpis.collectionRate.toFixed(1)}%</p>
              </div>
              <Target className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-xl font-bold">{kpis.totalCases}</p>
              </div>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-xl font-bold text-orange-600">{kpis.activeCases}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-xl font-bold">{kpis.activeVendors}</p>
              </div>
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={portfolioPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Collected']} />
                      <Bar dataKey="collected" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
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

        <TabsContent value="portfolios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Portfolio</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Collection Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioPerformance.map((portfolio, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{portfolio.name}</TableCell>
                      <TableCell>{portfolio.cases}</TableCell>
                      <TableCell>${portfolio.value.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${portfolio.collected.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(portfolio.rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{portfolio.rate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorPerformance.map((vendor, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {vendor.type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{vendor.cases}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${vendor.collected.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Collection Rate']} />
                      <Area type="monotone" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" onClick={() => navigate(createPageUrl('ReportBuilder'))}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create Custom Report
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate(createPageUrl('Vendors'))}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Vendors
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate(createPageUrl('Portfolios'))}>
                  <Target className="w-4 h-4 mr-2" />
                  View Portfolios
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}