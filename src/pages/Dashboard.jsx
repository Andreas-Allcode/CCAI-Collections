
import React, { useState, useEffect } from "react";
import { Portfolio, Case, Payment } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Users, 
  FolderOpen, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatsCard from "../components/dashboard/StatsCard";
import PortfolioBarChart from "../components/dashboard/PortfolioBarChart";
import PortfolioPerformance from "../components/dashboard/PortfolioPerformance";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalPortfolios: 0,
    totalCollected: 0,
    monthlyCollection: 0,
    activeCases: 0,
    paymentPlans: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [casesRes, portfoliosRes, paymentsRes] = await Promise.all([
        Case.list(),
        Portfolio.list(),
        Payment.list()
      ]);

      const cases = casesRes || [];
      const portfolios = portfoliosRes || [];
      const payments = paymentsRes || [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      });

      setStats({
        totalCases: cases.length,
        totalPortfolios: portfolios.length,
        totalCollected: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        monthlyCollection: monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        activeCases: cases.filter(c => c.status === 'in_collection').length,
        paymentPlans: cases.filter(c => c.status === 'payment_plan').length
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Collection performance overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Debts"
          value={stats.totalCases.toLocaleString()}
          icon={Users}
          trend="+12%"
          trendUp={true}
          loading={isLoading}
        />
        <StatsCard
          title="Monthly Collections"
          value={`$${stats.monthlyCollection.toLocaleString()}`}
          icon={DollarSign}
          trend="+8.2%"
          trendUp={true}
          loading={isLoading}
        />
        <StatsCard
          title="Active Debts"
          value={stats.activeCases.toLocaleString()}
          icon={TrendingUp}
          trend="+5.1%"
          trendUp={true}
          loading={isLoading}
        />
        <StatsCard
          title="Payment Plans"
          value={stats.paymentPlans.toLocaleString()}
          icon={Calendar}
          trend="-2.3%"
          trendUp={false}
          loading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        <PortfolioBarChart />
        <PortfolioPerformance />
      </div>
    </div>
  );
}
