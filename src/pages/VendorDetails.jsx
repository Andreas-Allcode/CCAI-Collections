import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Building2, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Vendor, Portfolio, Case, Payment } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function VendorDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vendorId = searchParams.get('id');
  
  const [vendor, setVendor] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [cases, setCases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      loadVendorData();
    }
  }, [vendorId]);

  const loadVendorData = async () => {
    try {
      const [vendorData, portfolioData, caseData, paymentData] = await Promise.all([
        Vendor.get(vendorId),
        Portfolio.list(),
        Case.list(),
        Payment.list()
      ]);

      setVendor(vendorData);
      setPortfolios(portfolioData || []);
      setCases(caseData || []);
      setPayments(paymentData || []);

      // Calculate portfolio performance
      calculatePortfolioPerformance(portfolioData || [], caseData || [], paymentData || []);
    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast.error('Failed to load vendor details');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePortfolioPerformance = (portfolioData, caseData, paymentData) => {
    const performance = {};
    
    portfolioData.forEach(portfolio => {
      // Get ALL cases for this portfolio (not just vendor-specific)
      const portfolioCases = caseData.filter(c => c.portfolio_id === portfolio.id);
      
      // For vendor-specific view, we still show all portfolio cases but highlight vendor involvement
      const vendorCases = portfolioCases.filter(c => c.vendor_id === vendorId);
      
      // Calculate total value for all cases in portfolio
      const totalValue = portfolioCases.reduce((sum, c) => 
        sum + (parseFloat(c.current_balance) || 0), 0
      );
      
      // Calculate total collected for all cases in portfolio
      const allCaseIds = portfolioCases.map(c => c.id);
      const totalCollected = paymentData
        .filter(p => allCaseIds.includes(p.case_id) && p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      // Calculate vendor-specific values
      const vendorValue = vendorCases.reduce((sum, c) => 
        sum + (parseFloat(c.current_balance) || 0), 0
      );
      
      const vendorCaseIds = vendorCases.map(c => c.id);
      const vendorCollected = paymentData
        .filter(p => vendorCaseIds.includes(p.case_id) && p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      // Calculate collection rate
      const collectionRate = totalValue > 0 ? (totalCollected / totalValue) * 100 : 0;
      const vendorCollectionRate = vendorValue > 0 ? (vendorCollected / vendorValue) * 100 : 0;
      
      // Temporarily show all portfolios with any data
      if (portfolioCases.length > 0 || totalCollected > 0) {
        performance[portfolio.id] = {
          totalValue,
          totalCollected,
          collectionRate,
          caseCount: portfolioCases.length,
          vendorValue,
          vendorCollected,
          vendorCollectionRate,
          vendorCaseCount: vendorCases.length
        };
      }
    });
    
    console.log('=== VENDOR DETAILS DEBUG ===');
    console.log('Vendor ID:', vendorId, 'Type:', typeof vendorId);
    console.log('All Cases:', caseData);
    console.log('First case structure:', JSON.stringify(caseData[0], null, 2));
    console.log('Cases vendor_id values:', caseData.map(c => ({ id: c.id, vendor_id: c.vendor_id, vendor_id_type: typeof c.vendor_id })));
    console.log('Cases for this vendor:', caseData.filter(c => c.vendor_id === vendorId));
    console.log('Cases for vendor string match:', caseData.filter(c => c.vendor_id === String(vendorId)));
    console.log('All Payments:', paymentData);
    console.log('Portfolio Performance:', performance);
    console.log('=== END DEBUG ===');
    
    setPortfolioPerformance(performance);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.pending;
  };

  const getTypeColor = (type) => {
    const colors = {
      law_firm: 'bg-purple-100 text-purple-800',
      collection_agency: 'bg-blue-100 text-blue-800',
      service_provider: 'bg-green-100 text-green-800',
      technology: 'bg-indigo-100 text-indigo-800',
      financial: 'bg-yellow-100 text-yellow-800',
      debt_buyer: 'bg-teal-100 text-teal-800',
      debt_seller: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

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

  if (!vendor) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Vendors'))} className="pl-0 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vendors
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-500">Vendor not found</p>
        </div>
      </div>
    );
  }

  // Show all portfolios with performance data (temporary fix)
  const vendorPortfolios = portfolios.filter(p => 
    Object.keys(portfolioPerformance).includes(p.id) && 
    (portfolioPerformance[p.id].caseCount > 0 || portfolioPerformance[p.id].totalCollected > 0)
  );

  // Calculate totals using actual portfolio performance data
  const totalValue = Object.values(portfolioPerformance).reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalCollected = Object.values(portfolioPerformance).reduce((sum, p) => sum + (p.totalCollected || 0), 0);
  const overallCollectionRate = totalValue > 0 ? (totalCollected / totalValue) * 100 : 0;
  const totalCases = Object.values(portfolioPerformance).reduce((sum, p) => sum + (p.caseCount || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('Vendors'))} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vendors
      </Button>

      {/* Vendor Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                  <p className="text-gray-600">{vendor.contact_person}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={getTypeColor(vendor.type)}>
                  {vendor.type?.replace('_', ' ')}
                </Badge>
                <Badge className={getStatusColor(vendor.status)}>
                  {vendor.status}
                </Badge>
              </div>
            </div>
            <div className="text-right space-y-1">
              {vendor.email && <p className="text-sm text-gray-600">{vendor.email}</p>}
              {vendor.phone && <p className="text-sm text-gray-600">{vendor.phone}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">${totalCollected.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">{overallCollectionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-orange-600">{totalCases}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {vendorPortfolios.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No portfolios assigned to this vendor</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Collection Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorPortfolios.map((portfolio) => {
                  const performance = portfolioPerformance[portfolio.id];
                  return (
                    <TableRow key={portfolio.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{portfolio.name}</p>
                          <p className="text-sm text-gray-500">{portfolio.client}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {performance.vendorCaseCount > 0 ? performance.vendorCaseCount : performance.caseCount}
                        {performance.vendorCaseCount === 0 && performance.caseCount > 0 && (
                          <span className="text-xs text-gray-500 ml-1">(total)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        ${(performance.vendorValue > 0 ? performance.vendorValue : performance.totalValue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${(performance.vendorCollected > 0 ? performance.vendorCollected : performance.totalCollected).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(performance.vendorCollectionRate > 0 ? performance.vendorCollectionRate : performance.collectionRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {(performance.vendorCollectionRate > 0 ? performance.vendorCollectionRate : performance.collectionRate).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={portfolio.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {portfolio.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}