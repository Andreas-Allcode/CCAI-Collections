
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
            <Link to="/Debts" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Debts
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Original Creditor</p>
                                    <p className="font-semibold">Wells Fargo</p>
                                    <p className="text-sm text-gray-500">2222 Wells St, San Francisco, CA 94101</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Current Balance</p>
                                        <p className="text-lg font-bold text-red-600">${totalBalance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Original Balance</p>
                                        <p className="text-lg font-semibold">$12,000</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Debt Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Days Since Charge Off</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">Sep 21, 2023</span>
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">684 days</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Fresh (0-60)</span>
                                        <span>Aging (61-90)</span>
                                        <span>Stale (91-120)</span>
                                        <span>Critical (121-180)</span>
                                        <span>Urgent (180+)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{width: '100%'}}></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Legal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Assigned Attorney</span>
                                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">Not Assigned</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select className="w-full p-2 border rounded">
                            <option>Quantum Financial ForwardFlow</option>
                        </select>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Important Dates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Charge Off</p>
                                <p className="font-medium">Sep 21, 2023</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Last Payment</p>
                                <p className="font-medium">Jul 17, 2023</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600">Recent charge-off, first contact pending</p>
                </CardContent>
            </Card>
        </div>
    );
}
