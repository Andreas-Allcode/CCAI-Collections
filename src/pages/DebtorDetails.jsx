
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Debtor } from '@/api/entities';
import { Case } from '@/api/entities';
import { Portfolio } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, ArrowLeft, Edit, Hash, Briefcase, FileText, DollarSign, BarChart3, Calendar, MessageSquare, Send, Clock, LinkIcon, Copy, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import DebtorForm from '../components/debtors/DebtorForm';
import DebtTable from '../components/debts/DebtTable';
import ActivityLogModal from '../components/debts/ActivityLogModal';
import CommunicationPanel from '../components/debts/CommunicationPanel';
import { DebtorPortalSession } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';

export default function DebtorDetails() {
    const location = useLocation();
    const [debtor, setDebtor] = useState(null);
    const [cases, setCases] = useState([]);
    const [portfolios, setPortfolios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [debtorId, setDebtorId] = useState(null);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showCommunications, setShowCommunications] = useState(false);
    const [portalLink, setPortalLink] = useState(null);

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

    const handleGeneratePortalLink = async () => {
        if (!primaryCase) return;
        setPortalLink({ loading: true, url: null });
        try {
            const accessToken = `tok_${primaryCase.id}_${Date.now()}`;
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await DebtorPortalSession.create({
                case_id: primaryCase.id,
                access_token: accessToken,
                expires_at: expiresAt.toISOString(),
                is_active: true
            });
            
            const url = `${window.location.origin}${createPageUrl(`PaymentPortal?token=${accessToken}`)}`;
            setPortalLink({ loading: false, url: url });
            toast.success("Portal link generated successfully!");
        } catch (error) {
            console.error("Error generating portal link", error);
            toast.error("Failed to generate portal link.");
            setPortalLink(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.info("Link copied to clipboard!");
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
    const totalOriginalBalance = cases.reduce((sum, c) => sum + (c.original_balance || 0), 0);
    
    // Get the primary case for timeline and creditor info
    const primaryCase = cases.length > 0 ? cases[0] : null;
    
    const getCaseAge = () => {
        if (!primaryCase?.charge_off_date) return null;
        const chargeOffDate = new Date(primaryCase.charge_off_date);
        const today = new Date();
        return differenceInDays(today, chargeOffDate);
    };
    
    const getAgeColor = (days) => {
        if (days <= 60) return "bg-green-100 text-green-800";
        if (days <= 90) return "bg-yellow-100 text-yellow-800";
        if (days <= 120) return "bg-orange-100 text-orange-800";
        if (days <= 150) return "bg-red-100 text-red-800";
        return "bg-red-200 text-red-900";
    };
    
    const caseAge = getCaseAge();

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
                                {primaryCase?.original_creditor && (
                                    <div>
                                        <p className="text-sm text-gray-600">Original Creditor</p>
                                        <p className="font-semibold">{primaryCase.original_creditor}</p>
                                        {primaryCase.original_creditor_address && (
                                            <p className="text-sm text-gray-500">{primaryCase.original_creditor_address}</p>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Current Balance</p>
                                        <p className="text-lg font-bold text-red-600">${totalBalance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Original Balance</p>
                                        <p className="text-lg font-semibold">${totalOriginalBalance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Debt Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {caseAge !== null && primaryCase?.charge_off_date ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-600">Days Since Charge Off</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-gray-500">
                                                    {format(new Date(primaryCase.charge_off_date), 'MMM d, yyyy')}
                                                </span>
                                                <span className={`${getAgeColor(caseAge)} px-2 py-1 rounded text-sm font-medium`}>
                                                    {caseAge} days
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Fresh (0-60)</span>
                                                <span>Aging (61-90)</span>
                                                <span>Stale (91-120)</span>
                                                <span>Critical (121-150)</span>
                                                <span>Urgent (150+)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500"></div>
                                            </div>
                                            <div className="mt-1 text-center">
                                                <div
                                                    className="w-3 h-3 bg-gray-800 rounded-full mx-auto transform -translate-y-1"
                                                    style={{
                                                        marginLeft: `${Math.min((caseAge / 180) * 100, 100)}%`,
                                                        transform: 'translateX(-50%) translateY(-4px)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">No charge off date available</p>
                                )}
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
                        {primaryCase?.charge_off_date && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">Charge Off</p>
                                    <p className="font-medium">{format(new Date(primaryCase.charge_off_date), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        )}
                        {primaryCase?.last_payment_date && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">Last Payment</p>
                                    <p className="font-medium">{format(new Date(primaryCase.last_payment_date), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        )}
                        {!primaryCase?.charge_off_date && !primaryCase?.last_payment_date && (
                            <p className="text-sm text-gray-500 col-span-2">No important dates available</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {primaryCase?.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">{primaryCase.notes}</p>
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle>Communication & Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowActivityLog(true)} className="flex-1" disabled={!primaryCase}>
                            <Clock className="w-4 h-4 mr-2" /> Activity Log
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleGeneratePortalLink} disabled={portalLink?.loading || !primaryCase} className="flex-1">
                            {portalLink?.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                            Generate Portal Link
                        </Button>
                    </div>

                    {portalLink && !portalLink.loading && portalLink.url && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-800">Secure Debtor Portal Link:</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Input value={portalLink.url} readOnly className="text-xs h-8"/>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(portalLink.url)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="w-full hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                            onClick={() => setShowCommunications(true)}
                            disabled={!primaryCase}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Communication
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                            onClick={() => {
                                const note = prompt('Enter a note for this debtor:');
                                if (note) {
                                    toast.success('Note added successfully!');
                                    console.log('Note added:', note);
                                }
                            }}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Add Note
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {showActivityLog && primaryCase && (
                <ActivityLogModal
                    isOpen={showActivityLog}
                    onClose={() => setShowActivityLog(false)}
                    caseId={primaryCase.id}
                    debtorName={debtor.name}
                />
            )}
            
            {showCommunications && primaryCase && (
                <CommunicationPanel
                    caseData={primaryCase}
                    debtor={debtor}
                    onClose={() => setShowCommunications(false)}
                />
            )}
        </div>
    );
}
