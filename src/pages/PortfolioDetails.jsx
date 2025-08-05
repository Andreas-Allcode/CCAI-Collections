
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Portfolio, Case, Payment } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  DollarSign,
  Percent,
  BarChart3,
  Download,
  Loader2,
  Scale,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import DebtTable from '../components/debts/DebtTable';
import PortfolioDebtFilters from '../components/debts/PortfolioDebtFilters';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from 'recharts';
import { subDays, isAfter } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

const initialFilters = {
  status: 'all',
  priority: 'all',
  balanceRange: 'all',
  lastContact: 'all',
  search: ''
};

export default function PortfolioDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [casePaymentsMap, setCasePaymentsMap] = useState({});
  const [portfolioStats, setPortfolioStats] = useState({ totalCases: 0, totalCollected: 0, collectionRate: 0, paymentCount: 0 });
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      loadPortfolioDetails(id);
    }
  }, [location.search]);

  useEffect(() => {
    applyFilters();
  }, [debts, filters]);

  const loadPortfolioDetails = async (id) => {
    setIsLoading(true);
    try {
      const [portfolioData, allDebts, allPayments] = await Promise.all([
        Portfolio.get(id),
        Case.filter({ portfolio_id: id }),
        Payment.list(),
      ]);

      const portfolioPayments = allPayments.filter(p => allDebts.some(c => c.id === p.case_id) && p.status === 'completed');
      const totalCollected = portfolioPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const collectionRate = portfolioData.total_face_value > 0 ? (totalCollected / portfolioData.total_face_value) * 100 : 0;
      const totalCases = allDebts.length;
      const paymentCount = portfolioPayments.length;

      const statusCounts = allDebts.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Calculate per-case payment totals
      const newCasePaymentsMap = allPayments
        .filter(p => p.status === 'completed')
        .reduce((map, payment) => {
          if (payment.case_id) {
            map[payment.case_id] = (map[payment.case_id] || 0) + (payment.amount || 0);
          }
          return map;
        }, {});
      setCasePaymentsMap(newCasePaymentsMap);
      
      // Ensure litigation_eligible exists for display, even if not directly returned by mock entity
      const processedPortfolioData = {
        ...portfolioData,
        litigation_eligible: portfolioData.litigation_eligible !== undefined ? portfolioData.litigation_eligible : true, // Default to true for demo
      };

      setPortfolio(processedPortfolioData);
      setDebts(allDebts);
      setPortfolioStats({ totalCases, totalCollected, collectionRate, paymentCount });
      setStatusDistribution(statusChartData);
    } catch (error) {
      console.error("Error loading portfolio details:", error);
      setPortfolio(null); // Set to null on error to trigger "not found"
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...debts];

    if (filters.status !== 'all') {
      filtered = filtered.filter(debt => debt.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(debt => debt.priority === filters.priority);
    }

    if (filters.balanceRange !== 'all') {
      filtered = filtered.filter(debt => {
        const balance = debt.current_balance || 0;
        switch (filters.balanceRange) {
          case '0-500': return balance >= 0 && balance <= 500;
          case '501-1000': return balance >= 501 && balance <= 1000;
          case '1001-5000': return balance >= 1001 && balance <= 5000;
          case '5001-10000': return balance >= 5001 && balance <= 10000;
          case '10001-25000': return balance >= 10001 && balance <= 25000;
          case '25001+': return balance >= 25001;
          default: return true;
        }
      });
    }

    if (filters.lastContact !== 'all') {
      filtered = filtered.filter(debt => {
        if (filters.lastContact === 'never') {
          return !debt.last_contact_date;
        }
        if (!debt.last_contact_date) return false;
        const contactDate = new Date(debt.last_contact_date);
        const now = new Date();
        switch (filters.lastContact) {
          case '7days': return isAfter(contactDate, subDays(now, 7));
          case '30days': return isAfter(contactDate, subDays(now, 30));
          case '90days': return isAfter(contactDate, subDays(now, 90));
          case '180days': return isAfter(contactDate, subDays(now, 180));
          case '365days': return isAfter(contactDate, subDays(now, 365));
          default: return true;
        }
      });
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(debt =>
        debt.debtor_name?.toLowerCase().includes(searchTerm) ||
        debt.account_number?.toLowerCase().includes(searchTerm) ||
        debt.debtor_email?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredDebts(filtered);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleDebtSelect = (debt) => {
    navigate(`${createPageUrl("Debts")}?caseId=${debt.id}`);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Portfolio not found</h2>
        <Link to={createPageUrl("Portfolios")}>
          <Button className="mt-4">Back to Portfolios</Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-50 text-blue-700 border-blue-200",
      in_collection: "bg-yellow-50 text-yellow-700 border-yellow-200",
      payment_plan: "bg-purple-50 text-purple-700 border-purple-200",
      paid: "bg-green-50 text-green-700 border-green-200",
      settled: "bg-indigo-50 text-indigo-700 border-indigo-200",
      legal_action: "bg-red-50 text-red-700 border-red-200",
      credit_reporting: "bg-orange-50 text-orange-700 border-orange-200",
      uncollectible: "bg-gray-50 text-gray-700 border-gray-200",
      disputed: "bg-orange-50 text-orange-700 border-orange-200",
      deceased: "bg-slate-50 text-slate-700 border-slate-200",
      bankruptcy: "bg-pink-50 text-pink-700 border-pink-200",
      military: "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
    return colors[status] || colors.new;
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to={createPageUrl("Portfolios")} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolios
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{portfolio.name}</h1>
          <p className="text-gray-600 mt-1">{portfolio.original_creditor}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Debts
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to={createPageUrl("NewDebt")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Debt
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {portfolio.account_count} originally imported
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${portfolioStats.totalCollected?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              from {portfolioStats.paymentCount} payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{portfolioStats.collectionRate?.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              of ${portfolio.total_face_value?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        {/* New Legal Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legal Status</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolio.litigation_eligible ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.litigation_eligible ? "Eligible" : "Ineligible"}
            </div>
            <p className="text-xs text-muted-foreground">
              For legal action
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600"/>
                      Debts in this Portfolio
                    </CardTitle>
                    <CardDescription>
                      A complete list of all debts associated with this portfolio.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <PortfolioDebtFilters
                      filters={filters}
                      setFilters={setFilters}
                      onClearFilters={handleClearFilters}
                    />
                    <DebtTable
                      cases={filteredDebts}
                      portfolios={[portfolio]}
                      casePaymentsMap={casePaymentsMap}
                      isLoading={false}
                      onCaseSelect={handleDebtSelect}
                      getStatusColor={getStatusColor}
                    />
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600"/>Debt Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
