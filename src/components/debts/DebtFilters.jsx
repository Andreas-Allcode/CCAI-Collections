
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DebtFilters({ filters, setFilters, portfolios }) {
  return (
    <div className="flex gap-3">
      <Select
        value={filters.status}
        onValueChange={(value) => setFilters({ ...filters, status: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
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
          <SelectItem value="buyback">Buyback</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.portfolio}
        onValueChange={(value) => setFilters({ ...filters, portfolio: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Portfolio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Portfolios</SelectItem>
          {portfolios.map((portfolio) => (
            <SelectItem key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) => setFilters({ ...filters, priority: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
