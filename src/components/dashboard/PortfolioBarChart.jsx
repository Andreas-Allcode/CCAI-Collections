
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from "lucide-react";
import { Portfolio, Case, Payment } from "@/api/entities";
import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioBarChart() {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
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

        return {
          name: portfolio.name,
          collected: totalCollected,
        };
      }).sort((a, b) => b.collected - a.collected);

      setChartData(performanceData);
    } catch (error) {
      console.error("Error loading portfolio performance data for chart:", error);
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
        <CardContent>
          <div className="h-96 w-full flex items-center justify-center">
             <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Total Collected by Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
              />
              <YAxis 
                dataKey="name"
                type="category"
                width={150}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Collected']}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
              />
              <Bar 
                dataKey="collected" 
                fill="#3b82f6" 
                radius={[0, 4, 4, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
