
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Portfolio, Case, Payment } from "@/api/entities";
import { 
  TrendingUp, 
  Percent,
  CheckCircle,
  Scale,
  UserX,
  AlertTriangle,
  Trophy
} from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

const KpiItem = ({ icon: Icon, value, label, colorClass, size = 'sm' }) => (
  <div className={`flex flex-col items-center p-2 rounded-lg bg-gray-50/50 text-center`}>
      <Icon className={`w-5 h-5 mb-1 ${colorClass}`} />
      <p className={`font-bold text-gray-800 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>{value}</p>
      <p className="text-xs text-gray-500 leading-tight">{label}</p>
  </div>
);

export default function PortfolioPerformance() {
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioPerformance();
  }, []);

  const loadPortfolioPerformance = async () => {
    try {
      const [portfolioListRes, casesRes, paymentsRes] = await Promise.all([
        Portfolio.list(),
        Case.list(),
        Payment.list()
      ]);

      const portfolioList = portfolioListRes || [];
      const cases = casesRes || [];
      const payments = paymentsRes || [];

      // Create a definitive mapping of portfolio names to all their known IDs (real and legacy)
      const portfolioIdMap = {};
      portfolioList.forEach(p => {
          const ids = new Set([p.id]); // Start with the real ID
          if (p.name === 'Boston Financial Group') ids.add('portfolio_1');
          if (p.name === 'Stellar Recovery Ventures') ids.add('portfolio_2');
          if (p.name === 'East Coast Capital') ids.add('portfolio_3');
          portfolioIdMap[p.id] = ids;
      });

      const performanceData = portfolioList.map(portfolio => {
        const validIds = portfolioIdMap[portfolio.id] || new Set([portfolio.id]);
        
        const portfolioCases = cases.filter(c => validIds.has(c.portfolio_id));

        const portfolioCaseIds = new Set(portfolioCases.map(c => c.id));
        
        const portfolioPayments = payments.filter(p => 
            portfolioCaseIds.has(p.case_id) && p.status === 'completed'
        );

        const totalCollected = portfolioPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const collectionRate = portfolio.total_face_value > 0 
          ? (totalCollected / portfolio.total_face_value) * 100 
          : 0;

        const totalCases = portfolioCases.length;
        const successfulCount = portfolioCases.filter(c => ['paid', 'settled'].includes(c.status)).length;
        const bankruptcyCount = portfolioCases.filter(c => c.status === 'bankruptcy').length;
        const deceasedCount = portfolioCases.filter(c => c.status === 'deceased').length;
        const disputedCount = portfolioCases.filter(c => c.status === 'disputed').length;

        const successPercent = totalCases > 0 ? (successfulCount / totalCases) * 100 : 0;
        const bankruptcyPercent = totalCases > 0 ? (bankruptcyCount / totalCases) * 100 : 0;
        const deceasedPercent = totalCases > 0 ? (deceasedCount / totalCases) * 100 : 0;
        const disputedPercent = totalCases > 0 ? (disputedCount / totalCases) * 100 : 0;

        return {
          id: portfolio.id,
          name: portfolio.name,
          totalCollected,
          collectionRate,
          casesCount: totalCases,
          successPercent,
          bankruptcyPercent,
          deceasedPercent,
          disputedPercent,
        };
      }).sort((a,b) => b.totalCollected - a.totalCollected);

      setPortfolios(performanceData);
    } catch (error) {
      console.error("Error loading portfolio performance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="w-5 h-5 text-amber-500" />
          Top Portfolio Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map((p, index) => (
          <Card key={p.id} className={`border-2 ${index === 0 ? 'border-amber-400 shadow-lg' : 'border-transparent'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800">{p.name}</CardTitle>
              <p className="text-xs text-gray-500">{p.casesCount} debts</p>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Total Collected</p>
                  <p className="text-2xl font-bold text-green-600">${p.totalCollected.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <KpiItem icon={Percent} value={`${p.collectionRate.toFixed(1)}%`} label="Collection Rate" colorClass="text-blue-600" />
                  <KpiItem icon={CheckCircle} value={`${p.successPercent.toFixed(1)}%`} label="Success Rate" colorClass="text-green-600" />
                  <KpiItem icon={AlertTriangle} value={`${p.disputedPercent.toFixed(1)}%`} label="Disputed" colorClass="text-yellow-600" />
                  <KpiItem icon={Scale} value={`${p.bankruptcyPercent.toFixed(1)}%`} label="Bankrupt" colorClass="text-purple-600" />
                </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
