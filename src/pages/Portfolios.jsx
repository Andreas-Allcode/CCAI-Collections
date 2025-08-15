
import React, { useState, useEffect } from "react";
import { Portfolio, Case, Payment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Upload, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioCard from "../components/portfolios/PortfolioCard";
import { Card, CardContent } from "@/components/ui/card";

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    setIsLoading(true);
    try {
      const [portfolioListRes, casesRes, paymentsRes] = await Promise.all([
        Portfolio.list('-created_date'),
        Case.list(),
        Payment.list()
      ]);
      
      const portfolioList = portfolioListRes || [];
      
      // Combine and deduplicate cases from Supabase and localStorage
      const mockData = JSON.parse(localStorage.getItem('ccai_mock_data') || '{}');
      const localCases = mockData.cases || [];
      
      // Use Map for deduplication
      const caseMap = new Map();
      
      // Add Supabase cases first (they take priority)
      (casesRes || []).forEach(case_ => {
        caseMap.set(case_.id, case_);
      });
      
      // Add local cases only if not already present
      localCases.forEach(case_ => {
        if (!caseMap.has(case_.id)) {
          caseMap.set(case_.id, case_);
        }
      });
      
      const cases = Array.from(caseMap.values());
      console.log('Portfolios page - Supabase cases:', (casesRes || []).length, 'Local cases:', localCases.length, 'Total unique:', cases.length);
      const payments = paymentsRes || [];

      const portfolioStats = {};
      portfolioList.forEach(p => {
        const portfolioCases = cases.filter(c => c.portfolio_id === p.id);
        
        // Get payments specifically for cases in this portfolio
        const portfolioPayments = payments.filter(pay => {
          const relatedCase = portfolioCases.find(c => c.id === pay.case_id);
          return relatedCase && pay.status === 'completed';
        });
        
        const totalCollected = portfolioPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const collectionRate = p.total_face_value > 0 ? (totalCollected / p.total_face_value) * 100 : 0;
        
        const totalCases = portfolioCases.length;
        const successfulCount = portfolioCases.filter(c => ['paid', 'settled'].includes(c.status)).length;
        const bankruptcyCount = portfolioCases.filter(c => c.status === 'bankruptcy').length;
        const deceasedCount = portfolioCases.filter(c => c.status === 'deceased').length;
        const disputedCount = portfolioCases.filter(c => c.status === 'disputed').length;

        const successPercent = totalCases > 0 ? (successfulCount / totalCases) * 100 : 0;
        const bankruptcyPercent = totalCases > 0 ? (bankruptcyCount / totalCases) * 100 : 0;
        const deceasedPercent = totalCases > 0 ? (deceasedCount / totalCases) * 100 : 0;
        const disputedPercent = totalCases > 0 ? (disputedCount / totalCases) * 100 : 0;

        portfolioStats[p.id] = {
          casesCount: totalCases,
          totalCollected,
          paymentsCount: portfolioPayments.length,
          collectionRate,
          successPercent,
          bankruptcyPercent,
          deceasedPercent,
          disputedPercent,
        };
      });

      setPortfolios(portfolioList);
      setStats(portfolioStats);
    } catch (error) {
      console.error("Error loading portfolios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioDelete = (portfolioId) => {
    setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
    setStats(prev => {
      const newStats = { ...prev };
      delete newStats[portfolioId];
      return newStats;
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolios</h1>
          <p className="text-gray-600 mt-1">Manage and import debt portfolios</p>
        </div>
        <Link to={createPageUrl("PortfolioImport")}>
          <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
            <Upload className="w-4 h-4 mr-2" />
            Import New Portfolio
          </Button>
        </Link>
      </div>

      {/* Portfolio List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between items-end pt-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : portfolios.length > 0 ? (
          portfolios.map(portfolio => (
            <PortfolioCard 
              key={portfolio.id}
              portfolio={portfolio}
              stats={stats[portfolio.id] || {}}
              onDelete={handlePortfolioDelete}
            />
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 border-2 border-dashed rounded-lg">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">No Portfolios Found</h3>
            <p className="text-gray-500 mt-2">Get started by importing a new portfolio.</p>
          </div>
        )}
      </div>
    </div>
  );
}
