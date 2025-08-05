
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label'; // Added import for Label
import { Case } from '@/api/entities';
import { Portfolio } from '@/api/entities';
import { Debtor } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Search, UserPlus } from 'lucide-react';
import usePermissions from '@/components/hooks/usePermissions';
import DebtorForm from '../components/debtors/DebtorForm';
import { sendDebtValidationNotices } from "@/api/functions";
import { initiateScrubProcess } from "@/api/functions";

export default function NewDebt() {
    const [portfolios, setPortfolios] = useState([]);
    const [debtors, setDebtors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [showNewDebtorForm, setShowNewDebtorForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Added loading state for initial data fetch
    const [retryCount, setRetryCount] = useState(0); // Added retry count for rate limiting
    const [caseData, setCaseData] = useState({
        portfolio_id: '',
        debtor_id: '',
        account_number: '',
        original_creditor: '',
        original_creditor_address: '',
        original_balance: '',
        current_balance: '',
        charge_off_date: '',
        last_payment_date: '',
        status: 'new',
        priority: 'medium',
        notes: ''
    });

    const navigate = useNavigate();
    const { canEdit, isLoading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchDataWithRetry(); // Call the retry-enabled fetch function
    }, []);

    // Utility for delaying execution
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchDataWithRetry = async () => {
        setIsLoading(true);
        try {
            // Fetch portfolios first
            const [portfolioList] = await Promise.all([
                Portfolio.list()
            ]);

            // Add delay between requests to avoid rate limiting
            await delay(500); // Wait a bit before the next request

            // Then fetch debtors
            const debtorList = await Debtor.list();

            setPortfolios(portfolioList || []);
            setDebtors(debtorList || []);
            setRetryCount(0); // Reset retry count on success
        } catch (error) {
            console.error("Error loading data:", error);

            if (error.response?.status === 429 && retryCount < 3) {
                // Rate limit hit, retry with exponential backoff
                const retryDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
                toast.error(`Rate limit exceeded. Retrying in ${retryDelay / 1000} seconds...`);

                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    fetchDataWithRetry();
                }, retryDelay);
            } else {
                toast.error("Failed to load data. Please refresh the page or try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setCaseData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setCaseData(prev => ({ ...prev, [id]: value }));
    };

    const handleDebtorSelect = (debtor) => {
        setSelectedDebtor(debtor);
        setCaseData(prev => ({ ...prev, debtor_id: debtor.id }));
        setSearchTerm('');
    };

    const handleNewDebtorSuccess = (newDebtor) => {
        const newDebtorsList = [...debtors, newDebtor];
        setDebtors(newDebtorsList);
        setSelectedDebtor(newDebtor);
        setCaseData(prev => ({ ...prev, debtor_id: newDebtor.id }));
        setShowNewDebtorForm(false);
    };

    const handleSave = async () => {
        if (!caseData.portfolio_id || !caseData.debtor_id) {
            toast.error("Please select a portfolio and a debtor.");
            return;
        }
        setIsSaving(true);
        try {
            const newCase = await Case.create(caseData);
            toast.success("Debt created successfully!");
            
            // Send debt validation notices
            toast.info("Sending debt validation notices...");
            try {
                const validationResult = await sendDebtValidationNotices({ caseIds: [newCase.id] });
                if (validationResult.data.success) {
                    toast.success("Debt validation notices sent successfully!");
                    
                    // Wait a moment, then initiate scrub process
                    setTimeout(async () => {
                        try {
                            toast.info("Initiating data scrub process...");
                            const scrubResult = await initiateScrubProcess({ caseIds: [newCase.id] });
                            if (scrubResult.data.success) {
                                toast.success("Data scrub process completed!");
                            } else {
                                toast.warning(`Scrub process warning: ${scrubResult.data.error || "An unknown error occurred during scrub."}`);
                            }
                        } catch (scrubError) {
                            console.error("Scrub process error:", scrubError);
                            toast.error("Data scrub process failed, but debt was created successfully.");
                        }
                    }, 2000); // 2-second delay
                } else {
                    toast.warning(`Validation notices warning: ${validationResult.data.error || "An unknown error occurred during validation."}`);
                }
            } catch (validationError) {
                console.error("Validation notices error:", validationError);
                toast.error("Failed to send validation notices, but debt was created successfully.");
            }
            
            navigate(createPageUrl('Debts'));
        } catch (error) {
            console.error("Error creating debt:", error);
            if (error.response?.status === 429) {
                toast.error("Rate limit exceeded. Please wait a moment and try again.");
            } else {
                toast.error("Failed to create debt.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (permissionsLoading || isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-screen">
                <Loader2 className="animate-spin w-8 h-8 mb-4 text-gray-500" />
                <p className="text-gray-600">
                    {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading data...'}
                </p>
            </div>
        );
    }

    if (!canEdit) {
        return <div className="p-8">You do not have permission to perform this action.</div>;
    }

    const filteredDebtors = searchTerm
        ? debtors.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase())) // Added optional chaining for d.name
        : [];

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(createPageUrl('Debts'))} className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debts
            </Button>

            {portfolios.length === 0 && debtors.length === 0 && !isLoading ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500 mb-4">Unable to load required data. This might be due to a network error or rate limiting.</p>
                        <Button onClick={fetchDataWithRetry} variant="outline" disabled={retryCount >= 3}>
                            <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Retrying...' : 'Retry Loading Data'}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Debt</CardTitle>
                            <CardDescription>First, link a debtor to this new debt record.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedDebtor ? (
                                <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{selectedDebtor.name}</p>
                                        <p className="text-sm text-gray-500">{selectedDebtor.email}</p>
                                    </div>
                                    <Button variant="outline" onClick={() => { setSelectedDebtor(null); setCaseData(p => ({ ...p, debtor_id: '' })) }}>Change</Button>
                                </div>
                            ) : showNewDebtorForm ? (
                                <DebtorForm onSuccess={handleNewDebtorSuccess} onCancel={() => setShowNewDebtorForm(false)} />
                            ) : (
                                <div className="space-y-2">
                                    <Label>Find Existing Debtor</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search for a debtor by name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                        {searchTerm && filteredDebtors.length > 0 && ( // Only show dropdown if searchTerm is not empty
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredDebtors.map(d => (
                                                    <div key={d.id} onClick={() => handleDebtorSelect(d)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                                        {d.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {searchTerm && filteredDebtors.length === 0 && ( // Show no results if search term is active and no results
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg px-4 py-2 text-gray-500 text-sm">
                                                No debtors found.
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center my-2">or</div>
                                    <Button variant="secondary" className="w-full" onClick={() => setShowNewDebtorForm(true)}>
                                        <UserPlus className="mr-2 h-4 w-4" /> Create New Debtor
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Debt Details</CardTitle>
                            <CardDescription>Fill in the details for the new debt record.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="portfolio_id">Portfolio</Label>
                                    <Select onValueChange={(value) => handleSelectChange('portfolio_id', value)} value={caseData.portfolio_id}>
                                        <SelectTrigger><SelectValue placeholder="Select a portfolio" /></SelectTrigger>
                                        <SelectContent>
                                            {portfolios.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_number">Account Number</Label>
                                    <Input id="account_number" value={caseData.account_number} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="original_creditor">Original Creditor</Label>
                                    <Input id="original_creditor" value={caseData.original_creditor} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="original_creditor_address">Original Creditor Address</Label>
                                    <Input id="original_creditor_address" value={caseData.original_creditor_address} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="original_balance">Original Balance</Label>
                                    <Input id="original_balance" type="number" value={caseData.original_balance} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current_balance">Current Balance</Label>
                                    <Input id="current_balance" type="number" value={caseData.current_balance} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="charge_off_date">Charge Off Date</Label>
                                    <Input id="charge_off_date" type="date" value={caseData.charge_off_date} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_payment_date">Last Payment Date</Label>
                                    <Input id="last_payment_date" type="date" value={caseData.last_payment_date} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Initial Status</Label>
                                    <Select onValueChange={(value) => handleSelectChange('status', value)} defaultValue="new" value={caseData.status}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="in_collection">In Collection</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select onValueChange={(value) => handleSelectChange('priority', value)} defaultValue="medium" value={caseData.priority}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" value={caseData.notes} onChange={handleInputChange} placeholder="Add any notes for this debt..." />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving || !selectedDebtor || !caseData.portfolio_id}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Create Debt
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
