import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

export default function PortfolioDebtFilters({ filters, setFilters, onClearFilters }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== 'all' && value !== '' && value !== null
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter Debts</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_collection">In Collection</SelectItem>
              <SelectItem value="payment_plan">Payment Plan</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="legal_action">Legal Action</SelectItem>
              <SelectItem value="credit_reporting">Credit Reporting</SelectItem>
              <SelectItem value="uncollectible">Uncollectible</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="deceased">Deceased</SelectItem>
              <SelectItem value="bankruptcy">Bankruptcy</SelectItem>
              <SelectItem value="military">Military</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</label>
          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange('priority', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Balance Range Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance Range</label>
          <Select
            value={filters.balanceRange}
            onValueChange={(value) => handleFilterChange('balanceRange', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All Balances" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Balances</SelectItem>
              <SelectItem value="0-500">$0 - $500</SelectItem>
              <SelectItem value="501-1000">$501 - $1,000</SelectItem>
              <SelectItem value="1001-5000">$1,001 - $5,000</SelectItem>
              <SelectItem value="5001-10000">$5,001 - $10,000</SelectItem>
              <SelectItem value="10001-25000">$10,001 - $25,000</SelectItem>
              <SelectItem value="25001+">$25,001+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Last Contact Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Contact</label>
          <Select
            value={filters.lastContact}
            onValueChange={(value) => handleFilterChange('lastContact', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Any Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="over90">Over 90 days</SelectItem>
              <SelectItem value="never">Never Contacted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}