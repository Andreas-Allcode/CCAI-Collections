
import React, { useState, useEffect, useCallback } from "react";
import { Case } from "@/api/entities";
import { Portfolio } from "@/api/entities";
import { Vendor } from "@/api/entities";
import { Debtor } from "@/api/entities";
import { Payment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  PlusCircle,
  Download,
  Loader2,
  MessageSquare,
  Upload,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DebtFilters from "../components/debts/DebtFilters";
import DebtTable from "../components/debts/DebtTable";
import DebtDetails from "../components/debts/DebtDetails";
import CommunicationPanel from "../components/debts/CommunicationPanel";
import { toast } from "sonner";
import { exportDebts } from "@/api/functions";
import usePermissions from "@/components/hooks/usePermissions";

export default function Debts() {
  const [cases, setCases] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [debtorMap, setDebtorMap] = useState({});
  const [casePaymentsMap, setCasePaymentsMap] = useState({});
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    portfolio: "all",
    priority: "all"
  });
  const [showCommunications, setShowCommunications] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const location = useLocation();
  const { canEdit } = usePermissions();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [caseData, portfolioData, vendorData, debtorData, paymentData] = await Promise.all([
        Case.list('-updated_date'),
        Portfolio.list(),
        Vendor.list({ type: 'law_firm' }),
        Debtor.list(),
        Payment.list()
      ]);

      setCases(caseData || []);
      setPortfolios(portfolioData || []);
      setVendors(vendorData || []);
      setDebtors(debtorData || []);

      const payments = paymentData || [];
      const newCasePaymentsMap = payments
        .filter(p => p.status === 'completed')
        .reduce((map, payment) => {
          if (payment.case_id) {
            map[payment.case_id] = (map[payment.case_id] || 0) + (payment.amount || 0);
          }
          return map;
        }, {});
      setCasePaymentsMap(newCasePaymentsMap);

      const newDebtorMap = (debtorData || []).reduce((map, debtor) => {
        map[debtor.id] = debtor;
        return map;
      }, {});
      setDebtorMap(newDebtorMap);

      const params = new URLSearchParams(location.search);
      const caseIdFromUrl = params.get('caseId');
      if (caseIdFromUrl) {
        const caseToSelect = (caseData || []).find(c => c.id === caseIdFromUrl);
        if (caseToSelect) {
          setSelectedCase(caseToSelect);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilters();
  }, [cases, searchTerm, filters, debtorMap]);

  useEffect(() => {
    setSelectedRowIds([]);
  }, [searchTerm, filters]);

  const applyFilters = () => {
    let filtered = [...(cases || [])];

    // Search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(case_ => {
        const debtor = debtorMap[case_.debtor_id];
        const debtorName = debtor ? debtor.name : case_.debtor_name;
        const debtorEmail = debtor ? debtor.email : case_.debtor_email;

        return (
          debtorName?.toLowerCase().includes(lowercasedTerm) ||
          case_.account_number?.toLowerCase().includes(lowercasedTerm) ||
          debtorEmail?.toLowerCase().includes(lowercasedTerm)
        );
      });
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(case_ => case_.status === filters.status);
    }

    // Portfolio filter
    if (filters.portfolio !== "all") {
      filtered = filtered.filter(case_ => case_.portfolio_id === filters.portfolio);
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter(case_ => case_.priority === filters.priority);
    }

    setFilteredCases(filtered);
  };

  const handleStatusUpdate = async (caseId, newStatus) => {
    if (!canEdit) {
      toast.error("You do not have permission to edit debts.");
      return;
    }
    
    try {
      if (newStatus === 'deleted') {
        // Handle deletion
        await Case.delete(caseId);
        
        // Refresh the cases list
        const updatedCases = await Case.list('-updated_date');
        setCases(updatedCases || []);
        
        // Clear selected case if it was the deleted one
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase(null);
        }
        
        toast.success("Debt case deleted successfully!");
      } else if (newStatus === 'close') {
        // Handle closing the debt details panel
        setSelectedCase(null);
        return;
      } else {
        // Handle status update
        await Case.update(caseId, { status: newStatus });

        const updatedCases = await Case.list('-updated_date');
        setCases(updatedCases || []);

        if (selectedCase && selectedCase.id === caseId) {
          const newlyUpdatedCase = (updatedCases || []).find(c => c.id === caseId);
          if (newlyUpdatedCase) {
            setSelectedCase(newlyUpdatedCase);
          }
        }
        toast.success("Debt status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating debt:", error);
      toast.error(newStatus === 'deleted' ? "Failed to delete debt case." : "Failed to update debt status.");
    }
  };

  const handleExport = async () => {
    const exportIds = selectedRowIds.length > 0 ? selectedRowIds : filteredCases.map(c => c.id);
    setIsExporting(true);
    try {
      const { data, status } = await exportDebts({ case_ids: JSON.stringify(exportIds) });
      if (status !== 200) {
        throw new Error("Failed to fetch export data.");
      }

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'debts-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(`${exportIds.length} debts exported successfully!`);

    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export debts.");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-50 text-blue-700 border-blue-200",
      in_collection: "bg-yellow-50 text-yellow-700 border-yellow-200",
      payment_plan: "bg-purple-50 text-purple-700 border-purple-200",
      paid: "bg-green-50 text-green-700 border-green-200",
      settled: "bg-indigo-50 text-indigo-700 border-indigo-200",
      legal_action: "bg-red-50 text-red-700 border-red-200",
      credit_reporting: "bg-orange-50 text-orange-700 border-orange-200",
      uncollectible: "bg-gray-50 text-gray-700 border-gray-200",
      disputed: "bg-orange-50 text-orange-700 border-orange-200",
      deceased: "bg-slate-50 text-slate-700 border-slate-200",
      bankruptcy: "bg-pink-50 text-pink-700 border-pink-200",
      military: "bg-emerald-50 text-emerald-700 border-emerald-200",
      buyback: "bg-cyan-50 text-cyan-700 border-cyan-200"
    };
    return colors[status] || colors.new;
  };

  return (
    <div className="flex h-full">
      <div className={`transition-all duration-300 ${selectedCase ? 'w-2/3' : 'w-full'} overflow-y-auto`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Debts</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export {selectedRowIds.length > 0 ? `(${selectedRowIds.length})` : 'All'}
              </Button>
              {canEdit && (
                <>
                  <Button asChild variant="outline">
                    <Link to={createPageUrl("DebtImport")}>
                      <Upload className="mr-2 h-4 w-4" /> Import Debts
                    </Link>
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link to={createPageUrl("NewDebt")}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Debt
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, account number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <DebtFilters
            filters={filters}
            setFilters={setFilters}
            portfolios={portfolios}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Total Debts</p>
              <p className="text-2xl font-bold text-gray-900">{cases.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">
                {cases.filter(c => c.status === 'in_collection').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Payment Plans</p>
              <p className="text-2xl font-bold text-purple-600">
                {cases.filter(c => c.status === 'payment_plan').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {cases.filter(c => ['paid', 'settled'].includes(c.status)).length}
              </p>
            </div>
          </div>

          <DebtTable
            cases={filteredCases}
            portfolios={portfolios}
            debtorMap={debtorMap}
            casePaymentsMap={casePaymentsMap}
            isLoading={isLoading}
            onCaseSelect={setSelectedCase}
            onStatusUpdate={handleStatusUpdate}
            getStatusColor={getStatusColor}
            selectedCaseId={selectedCase?.id}
            selectedRowIds={selectedRowIds}
            setSelectedRowIds={setSelectedRowIds}
          />
        </div>
      </div>

      {selectedCase && (
        <div className="w-1/3 p-6 border-l overflow-y-auto bg-white">
          <DebtDetails
            selectedCase={selectedCase}
            portfolios={portfolios}
            debtor={debtorMap[selectedCase.debtor_id]}
            lawFirms={vendors}
            getStatusColor={getStatusColor}
            onStatusUpdate={handleStatusUpdate}
          />

          <div className="space-y-2 mt-6">
            <Button
              onClick={() => setShowCommunications(!showCommunications)}
              variant="outline"
              className="w-full hover:bg-blue-50 hover:text-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {showCommunications ? 'Hide Communications' : 'Send Communication'}
            </Button>

            {showCommunications && (
              <CommunicationPanel
                caseData={selectedCase}
                debtor={debtorMap[selectedCase.debtor_id]}
                onClose={() => setShowCommunications(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
