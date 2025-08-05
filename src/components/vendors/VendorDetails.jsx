
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Portfolio, Case, Payment } from '@/api/entities';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Calendar,
  FileText,
  User,
  FolderOpen,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

export default function VendorDetails({ vendor, onClose }) {
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState([]);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true);

  useEffect(() => {
    loadVendorPortfolios();
  }, [vendor]);

  const loadVendorPortfolios = async () => {
    setIsLoadingPortfolios(true);
    try {
      // For demo purposes, we'll show some portfolios for collection agencies and law firms
      if (['collection_agency', 'law_firm'].includes(vendor.type)) {
        const [allPortfolios, allCases, allPayments] = await Promise.all([
          Portfolio.list(),
          Case.list(),
          Payment.list()
        ]);

        // Simulate that this vendor handles some portfolios
        const vendorPortfolios = allPortfolios.slice(0, Math.min(3, allPortfolios.length));
        
        const performanceData = vendorPortfolios.map(portfolio => {
          const portfolioCases = allCases.filter(c => c.portfolio_id === portfolio.id);
          const caseIds = portfolioCases.map(c => c.id);
          const portfolioPayments = allPayments.filter(p => caseIds.includes(p.case_id) && p.status === 'completed');
          
          const totalCollected = portfolioPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const totalValue = portfolio.total_face_value || 0;
          const recoveryRate = totalValue > 0 ? (totalCollected / totalValue) * 100 : 0;
          
          return {
            ...portfolio,
            totalCollected,
            totalValue,
            recoveryRate: Math.round(recoveryRate * 100) / 100,
            casesCount: portfolioCases.length,
            paymentsCount: portfolioPayments.length
          };
        });

        setPortfolios(vendorPortfolios);
        setPortfolioPerformance(performanceData);
      }
    } catch (error) {
      console.error('Error loading vendor portfolios:', error);
    } finally {
      setIsLoadingPortfolios(false);
    }
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

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{vendor.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getTypeColor(vendor.type)}>
              {vendor.type.replace('_', ' ')}
            </Badge>
            <Badge className={getStatusColor(vendor.status)}>
              {vendor.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendor.contact_person && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-medium">{vendor.contact_person}</p>
              </div>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{vendor.email}</p>
              </div>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{vendor.phone}</p>
              </div>
            </div>
          )}
          {vendor.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a 
                  href={vendor.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {vendor.website}
                </a>
              </div>
            </div>
          )}
        </div>
        {vendor.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{vendor.address}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contract Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contract Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendor.contract_start_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Contract Start</p>
                <p className="font-medium">
                  {format(new Date(vendor.contract_start_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
          {vendor.contract_end_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Contract End</p>
                <p className="font-medium">
                  {format(new Date(vendor.contract_end_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Performance - Only for collection agencies and law firms */}
      {['collection_agency', 'law_firm'].includes(vendor.type) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Portfolio Performance
          </h3>
          {isLoadingPortfolios ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : portfolioPerformance.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No portfolios assigned to this vendor yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {portfolioPerformance.map((portfolio) => (
                <Card key={portfolio.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {portfolio.casesCount} cases
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${portfolio.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Collected</p>
                        <p className="text-lg font-bold text-green-600">
                          ${portfolio.totalCollected.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Recovery Rate</p>
                        <p className="text-lg font-bold text-blue-600">
                          {portfolio.recoveryRate}%
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{portfolio.paymentsCount} payments</span>
                      </div>
                      <Progress value={Math.min(portfolio.recoveryRate, 100)} className="h-2" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Client: {portfolio.client}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {portfolio.purchase_date ? 
                            format(new Date(portfolio.purchase_date), 'MMM yyyy') : 
                            'No date'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services */}
      {vendor.services && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Services Provided</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{vendor.services}</p>
        </div>
      )}

      {/* Notes */}
      {vendor.notes && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {vendor.email && (
          <Button 
            variant="outline" 
            onClick={() => window.location.href = `mailto:${vendor.email}`}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        )}
        {vendor.phone && (
          <Button 
            variant="outline" 
            onClick={() => window.location.href = `tel:${vendor.phone}`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        )}
        {vendor.website && (
          <Button 
            variant="outline" 
            onClick={() => window.open(vendor.website, '_blank')}
          >
            <Globe className="w-4 h-4 mr-2" />
            Visit Website
          </Button>
        )}
      </div>
    </div>
  );
}
