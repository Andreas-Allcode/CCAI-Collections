import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, Eye, Download, TrendingUp, Users, 
  FileText, Calendar, Building2, Target
} from 'lucide-react';
import { Portfolio, Case } from '@/api/entities';
import { toast } from 'sonner';

export default function DebtBuyerPortal() {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [portfolioCases, setPortfolioCases] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const [portfolioData, caseData] = await Promise.all([
        Portfolio.list(),
        Case.list()
      ]);

      // Filter only portfolios for sale
      const forSalePortfolios = (portfolioData || []).filter(p => p.portfolio_category === 'for_sale');
      
      // Add case counts and metrics to each portfolio
      const enrichedPortfolios = forSalePortfolios.map(portfolio => {
        const cases = (caseData || []).filter(c => c.portfolio_id === portfolio.id);
        const totalBalance = cases.reduce((sum, c) => sum + (parseFloat(c.current_balance) || 0), 0);
        
        return {
          ...portfolio,
          actual_case_count: cases.length,
          actual_total_value: totalBalance,
          cases: cases
        };
      });

      setPortfolios(enrichedPortfolios);
    } catch (error) {
      console.error('Error loading portfolios:', error);
      toast.error('Failed to load portfolios');
    } finally {
      setIsLoading(false);
    }
  };

  const viewPortfolioDetails = async (portfolio) => {
    setSelectedPortfolio(portfolio);
    setPortfolioCases(portfolio.cases || []);
    setIsDetailsOpen(true);
  };

  const downloadPortfolioData = (portfolio) => {
    const csvData = [
      ['Portfolio Summary'],
      ['Name:', portfolio.name],
      ['Type:', portfolio.portfolio_type],
      ['Total Face Value:', `$${portfolio.total_face_value?.toLocaleString()}`],
      ['Asking Price:', `$${portfolio.asking_price?.toLocaleString()}`],
      ['Account Count:', portfolio.account_count],
      ['Status:', portfolio.status],
      [''],
      ['Individual Accounts:'],
      ['Account Number', 'Debtor Name', 'Original Balance', 'Current Balance', 'Original Creditor', 'Status'],
      ...(portfolio.cases || []).map(c => [
        c.account_number,
        c.debtor_name,
        `$${c.original_balance}`,
        `$${c.current_balance}`,
        c.original_creditor,
        c.status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${portfolio.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('Portfolio data downloaded');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'for_sale': return 'bg-blue-100 text-blue-800';
      case 'sold': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'committed': return 'bg-purple-100 text-purple-800';
      case 'spec': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  const totalValue = portfolios.reduce((sum, p) => sum + (p.total_face_value || 0), 0);
  const totalAskingPrice = portfolios.reduce((sum, p) => sum + (p.asking_price || 0), 0);
  const totalAccounts = portfolios.reduce((sum, p) => sum + (p.account_count || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Debt Portfolio Marketplace</h1>
        <p className="text-gray-600">Available portfolios for purchase</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Portfolios</p>
                <p className="text-2xl font-bold">{portfolios.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Face Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asking Price</p>
                <p className="text-2xl font-bold text-blue-600">${totalAskingPrice.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold text-purple-600">{totalAccounts.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolios.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No portfolios available for sale</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Face Value</TableHead>
                  <TableHead>Asking Price</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolios.map((portfolio) => {
                  const discountPercent = portfolio.total_face_value > 0 
                    ? ((portfolio.total_face_value - portfolio.asking_price) / portfolio.total_face_value) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={portfolio.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{portfolio.name}</p>
                          <p className="text-sm text-gray-500">Created: {new Date(portfolio.created_at).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(portfolio.portfolio_type)}>
                          {portfolio.portfolio_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium">{portfolio.account_count}</p>
                          {portfolio.actual_case_count !== portfolio.account_count && (
                            <p className="text-xs text-gray-500">({portfolio.actual_case_count} loaded)</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${portfolio.total_face_value?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        ${portfolio.asking_price?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {discountPercent.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(portfolio.status)}>
                          {portfolio.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewPortfolioDetails(portfolio)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadPortfolioData(portfolio)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio Details: {selectedPortfolio?.name}</DialogTitle>
          </DialogHeader>
          {selectedPortfolio && (
            <div className="space-y-6">
              {/* Portfolio Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Face Value</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${selectedPortfolio.total_face_value?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Asking Price</p>
                  <p className="text-xl font-bold text-green-600">
                    ${selectedPortfolio.asking_price?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Account Count</p>
                  <p className="text-xl font-bold text-purple-600">
                    {selectedPortfolio.account_count}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Balance</p>
                  <p className="text-xl font-bold text-orange-600">
                    ${selectedPortfolio.total_face_value && selectedPortfolio.account_count 
                      ? Math.round(selectedPortfolio.total_face_value / selectedPortfolio.account_count).toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>

              {/* Individual Accounts */}
              <div>
                <h3 className="text-lg font-medium mb-4">Individual Accounts ({portfolioCases.length})</h3>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Debtor</TableHead>
                        <TableHead>Original Balance</TableHead>
                        <TableHead>Current Balance</TableHead>
                        <TableHead>Original Creditor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolioCases.map((case_) => (
                        <TableRow key={case_.id}>
                          <TableCell className="font-medium">{case_.account_number}</TableCell>
                          <TableCell>{case_.debtor_name}</TableCell>
                          <TableCell>${case_.original_balance?.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">${case_.current_balance?.toLocaleString()}</TableCell>
                          <TableCell>{case_.original_creditor}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {case_.status?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => downloadPortfolioData(selectedPortfolio)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Data
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Request Purchase
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}