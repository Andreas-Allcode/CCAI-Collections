import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Percent,
  CheckCircle,
  Scale,
  UserX,
  AlertTriangle,
  DollarSign
} from "lucide-react";

const KpiItem = ({ icon: Icon, value, label, colorClass }) => (
  <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 text-center">
      <Icon className={`w-5 h-5 mb-1 ${colorClass}`} />
      <p className="text-sm font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 leading-tight">{label}</p>
  </div>
);

export default function PortfolioCard({ portfolio, stats }) {
  const typeColors = {
    spec: "bg-green-100 text-green-800",
    committed: "bg-yellow-100 text-yellow-800"
  };

  return (
    <Link to={createPageUrl(`PortfolioDetails?id=${portfolio.id}`)}>
      <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
              {portfolio.name}
            </CardTitle>
            <Badge className={typeColors[portfolio.portfolio_type]}>
              {portfolio.portfolio_type}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 pt-1">{portfolio.original_creditor}</p>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          <div className="border-t pt-4">
             <div className="flex justify-between items-center mb-4">
                 <div>
                    <p className="text-xs text-gray-500">Total Collected</p>
                    <p className="text-lg font-semibold text-green-600">
                        ${stats.totalCollected?.toLocaleString() || 0}
                    </p>
                    {stats.paymentsCount > 0 && (
                      <p className="text-xs text-gray-400">
                        {stats.paymentsCount} payments
                      </p>
                    )}
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-500">Total Debts</p>
                    <p className="text-lg font-semibold text-gray-800">{stats.casesCount || 0}</p>
                    <p className="text-xs text-gray-400">
                      Face Value: ${portfolio.total_face_value?.toLocaleString() || 0}
                    </p>
                 </div>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <KpiItem icon={Percent} value={`${stats.collectionRate?.toFixed(1) || 0}%`} label="Collection Rate" colorClass="text-blue-600" />
                <KpiItem icon={CheckCircle} value={`${stats.successPercent?.toFixed(1) || 0}%`} label="Success Rate" colorClass="text-green-600" />
                <KpiItem icon={AlertTriangle} value={`${stats.disputedPercent?.toFixed(1) || 0}%`} label="Disputed" colorClass="text-yellow-600" />
                <KpiItem icon={Scale} value={`${stats.bankruptcyPercent?.toFixed(1) || 0}%`} label="Bankrupt" colorClass="text-purple-600" />
                <KpiItem icon={UserX} value={`${stats.deceasedPercent?.toFixed(1) || 0}%`} label="Deceased" colorClass="text-slate-600" />
             </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}