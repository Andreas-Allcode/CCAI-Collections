
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Debtor } from '@/api/entities';
import { Case } from '@/api/entities';
import { Portfolio } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, ArrowLeft, Edit, Hash, Briefcase, FileText, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import DebtorForm from '../components/debtors/DebtorForm';
import DebtTable from '../components/debts/DebtTable';

export default function DebtorDetails() {
    const location = useLocation();
    const [debtor, setDebtor] = useState(null);
    const [cases, setCases] = useState([]);
    const [portfolios, setPortfolios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [debtorId, setDebtorId] = useState(null);

    const mockImportData = [
        {
            id: 'mock-debt-1',
            account_number: 'ACC-2024-1001',
            original_creditor: 'Chase Bank',
            current_balance: 2500,
            face_value: 100000,
            status: 'in_collection',
            last_contact_date: '2024-01-15',
            notes: 'Contacted via phone, debtor agreed to payment plan'
        },
        {
            id: 'mock-debt-2', 
            account_number: 'ACC-2024-1002',
            original_creditor: 'Capital One',
            current_balance: 1800,
            face_value: 100000,
            status: 'new',
            last_contact_date: null,
            notes: 'Recently added to portfolio'
        }
    ];

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('id');
        if (id) {
            setDebtorId(id);
            loadData(id);
        } else {
            setIsLoading(false);
        }
    }, [location.search]);

    const loadData = async (id) => {
        setIsLoading(true);
        try {
            const [debtorData, caseData, portfolioData] = await Promise.all([
                Debtor.get(id),
                Case.filter({ debtor_id: id }),
                Portfolio.list()
            ]);
            setDebtor(debtorData);
            setCases(caseData);
            setPortfolios(portfolioData);
        } catch (error) {
            console.error("Error loading debtor details:", error);
            toast.error("Failed to load debtor details.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEditSuccess = () => {
        setIsEditing(false);
        if(debtorId) loadData(debtorId);
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


    if (isLoading) {
        return <div className="p-8 space-y-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
    }

    if (!debtor) {
        return <div className="p-8 text-center"><p>Debtor not found.</p></div>;
    }
    
    const totalBalance = cases.reduce((sum, c) => sum + (c.current_balance || 0), 0);

    return (
        <div className="p-6 md:p-8 space-y-6">
            <Link to="/Debtors" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Debtors
            </Link>

            {isEditing ? (
                <DebtorForm debtor={debtor} onSuccess={handleEditSuccess} onCancel={() => setIsEditing(false)} />
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{debtor.name}</h1>
                            <p className="text-gray-600 mt-1">Debtor Profile & Associated Debts</p>
                        </div>
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Debtor
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-blue-600" />Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{debtor.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{debtor.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{debtor.address || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span>SSN (Last 4): {debtor.ssn_last4 || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>DOB: {debtor.dob ? format(new Date(debtor.dob), 'MMM d, yyyy') : 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Debts</CardTitle>
                                <Briefcase className="w-4 h-4 text-gray-400"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{cases.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                                <DollarSign className="w-4 h-4 text-gray-400"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Active Debts</CardTitle>
                                <BarChart3 className="w-4 h-4 text-gray-400"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{cases.filter(c => c.status === 'in_collection').length}</div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Debts for {debtor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                     <DebtTable
                        cases={cases}
                        portfolios={portfolios}
                        isLoading={isLoading}
                        onCaseSelect={() => {}}
                        getStatusColor={getStatusColor}
                        showDebtorName={false} // Don't need to show name since it's on this page
                    />
                </CardContent>
            </Card>
        </div>
    );
}
