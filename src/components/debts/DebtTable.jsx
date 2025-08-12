
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";

export default function DebtTable({
    cases,
    portfolios,
    debtorMap = {},
    isLoading,
    onCaseSelect,
    selectedCaseId,
    getStatusColor,
    showDebtorName = true,
    selectedRowIds,
    setSelectedRowIds,
    casePaymentsMap = {}
}) {
    const showSelection = typeof setSelectedRowIds === 'function' && Array.isArray(selectedRowIds);

    const getPortfolioName = (portfolioId) => {
        const portfolio = portfolios.find(p => p.id === portfolioId);
        return portfolio?.name || "Unknown Portfolio";
    };

    const handleSelectAll = (checked) => {
        if (!showSelection) return;
        if (checked) {
            const allCaseIds = cases.map(c => c.id);
            setSelectedRowIds(allCaseIds);
        } else {
            setSelectedRowIds([]);
        }
    };

    const handleSelectRow = (caseId, checked) => {
        if (!showSelection) return;
        if (checked) {
            setSelectedRowIds(prev => [...prev, caseId]);
        } else {
            setSelectedRowIds(prev => prev.filter(id => id !== caseId));
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
        );
    }
    
    if (!cases || cases.length === 0) {
        return <div className="text-center py-12">No debts found.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {showSelection && (
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedRowIds.length > 0 && selectedRowIds.length === cases.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all rows"
                                />
                            </TableHead>
                        )}
                        {showDebtorName && <TableHead>Debtor</TableHead>}
                        <TableHead>Account #</TableHead>
                        <TableHead>Portfolio</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Total Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cases.map(case_ => {
                        const debtor = debtorMap[case_.debtor_id];
                        const debtorName = debtor ? debtor.name : case_.debtor_name;
                        const isSelected = case_.id === selectedCaseId;

                        return (
                            <TableRow 
                                key={case_.id} 
                                onClick={() => onCaseSelect(case_)}
                                className={`cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                {showSelection && (
                                    <TableCell onClick={e => e.stopPropagation()}>
                                         <Checkbox
                                            checked={selectedRowIds.includes(case_.id)}
                                            onCheckedChange={(checked) => handleSelectRow(case_.id, checked)}
                                            aria-label="Select row"
                                        />
                                    </TableCell>
                                )}
                                {showDebtorName && (
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {(debtor || case_.debtor_id) ? (
                                                <Link to={createPageUrl(`DebtorDetails?id=${debtor?.id || case_.debtor_id}`)} onClick={e => e.stopPropagation()} className="hover:underline text-blue-600">
                                                    <div className="flex items-center gap-1">
                                                        {debtorName || "Unnamed Debtor"} <LinkIcon className="w-3 h-3" />
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-500" title="Legacy Record">
                                                    {debtorName || "Unnamed Debtor (Legacy)"}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell>{case_.account_number}</TableCell>
                                <TableCell>{getPortfolioName(case_.portfolio_id)}</TableCell>
                                <TableCell>${case_.current_balance?.toLocaleString() || 0}</TableCell>
                                <TableCell className="text-green-600 font-medium">
                                    ${(casePaymentsMap[case_.id] || 0).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border ${getStatusColor(case_.status)}`}>
                                        {case_.status?.replace(/_/g, ' ') || 'unknown'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {case_.updated_date ? 
                                        formatDistanceToNow(new Date(case_.updated_date), { addSuffix: true }) : 
                                        'No update'
                                    }
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
