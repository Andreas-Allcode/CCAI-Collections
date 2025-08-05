import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Case } from '@/api/entities';
import { Debtor } from '@/api/entities';
import { Portfolio } from '@/api/entities';
import { Payment } from '@/api/entities';
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2, User, Building, CreditCard, Search } from "lucide-react";

export default function RecordPaymentForm({ isOpen, onClose, onSuccess }) {
  const [debtors, setDebtors] = useState([]);
  const [cases, setCases] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [availableDebtors, setAvailableDebtors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [availableCases, setAvailableCases] = useState([]);
  const [selectedDebtorInfo, setSelectedDebtorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'credit_card',
    payment_date: new Date(),
    status: 'completed',
    transaction_id: '',
    notes: ''
  });

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadDataWithRetry();
    }
  }, [isOpen]);

  // Process debtors to show only those with active (non-deceased) debts
  useEffect(() => {
    if (cases.length > 0 && debtors.length > 0) {
      // Get all active cases (not deceased)
      const activeCases = cases.filter(c => c.status !== 'deceased');
      
      // Create a map of debtor info from cases
      const debtorInfoMap = new Map();
      
      activeCases.forEach(caseItem => {
        const debtor = debtors.find(d => d.id === caseItem.debtor_id);
        const debtorName = debtor ? debtor.name : caseItem.debtor_name;
        const debtorEmail = debtor ? debtor.email : caseItem.debtor_email;
        const debtorId = debtor ? debtor.id : `legacy_${caseItem.id}`;
        
        if (debtorName) {
          if (!debtorInfoMap.has(debtorId)) {
            debtorInfoMap.set(debtorId, {
              id: debtorId,
              name: debtorName,
              email: debtorEmail,
              cases: []
            });
          }
          debtorInfoMap.get(debtorId).cases.push(caseItem);
        }
      });
      
      const processedDebtors = Array.from(debtorInfoMap.values());
      setAvailableDebtors(processedDebtors);
    } else {
      setAvailableDebtors([]);
    }
  }, [cases, debtors]);

  // Filter debtors based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableDebtors.filter(debtor => 
        debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (debtor.email && debtor.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDebtors(filtered);
      setShowSearchResults(true);
    } else {
      setFilteredDebtors([]);
      setShowSearchResults(false);
    }
  }, [searchTerm, availableDebtors]);

  // Update available cases and debtor info when debtor selection changes
  useEffect(() => {
    if (selectedDebtorId && availableDebtors.length > 0) {
      const selectedDebtor = availableDebtors.find(d => d.id === selectedDebtorId);
      if (selectedDebtor) {
        setAvailableCases(selectedDebtor.cases);
        setSelectedDebtorInfo(selectedDebtor);
        setSelectedCaseId(''); // Reset case selection
      }
    } else {
      setAvailableCases([]);
      setSelectedDebtorInfo(null);
      setSelectedCaseId('');
    }
  }, [selectedDebtorId, availableDebtors]);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const loadDataWithRetry = async (retryCount = 0) => {
    setIsLoadingData(true);
    try {
      // Add delay between requests to avoid rate limiting
      const debtorResults = await Debtor.list();
      
      await delay(500);
      
      const caseResults = await Case.list();
      
      await delay(500);
      
      const portfolioResults = await Portfolio.list();
      
      setDebtors(Array.isArray(debtorResults) ? debtorResults : []);
      setCases(Array.isArray(caseResults) ? caseResults : []);
      setPortfolios(Array.isArray(portfolioResults) ? portfolioResults : []);
    } catch (error) {
      console.error('Error loading data:', error);
      
      if (error.response?.status === 429 && retryCount < 2) {
        const retryDelay = Math.pow(2, retryCount) * 1000;
        toast.error(`Rate limit exceeded. Retrying in ${retryDelay / 1000} seconds...`);
        
        setTimeout(() => {
          loadDataWithRetry(retryCount + 1);
        }, retryDelay);
      } else {
        toast.error("Failed to load data. Please close and try again later.");
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const getPortfolioName = (portfolioId) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    return portfolio?.name || 'Unknown Portfolio';
  };

  const getSelectedCaseInfo = () => {
    if (!selectedCaseId || !availableCases.length) return null;
    return availableCases.find(c => c.id === selectedCaseId);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, payment_date: date }));
  };

  const handleDebtorSelect = (debtor) => {
    setSelectedDebtorId(debtor.id);
    setSelectedDebtorInfo(debtor);
    setSearchTerm(debtor.name);
    setShowSearchResults(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear selection if search term changes
    if (selectedDebtorId && value !== selectedDebtorInfo?.name) {
      setSelectedDebtorId('');
      setSelectedDebtorInfo(null);
      setSelectedCaseId('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCaseId || !formData.amount || !formData.payment_method) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      await Payment.create({
        case_id: selectedCaseId,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date.toISOString().split('T')[0],
        status: formData.status,
        transaction_id: formData.transaction_id,
        notes: formData.notes
      });
      
      toast.success("Payment recorded successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      if (error.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Failed to record payment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAvailableDebtors([]);
    setSearchTerm('');
    setFilteredDebtors([]);
    setSelectedDebtorId('');
    setSelectedCaseId('');
    setAvailableCases([]);
    setSelectedDebtorInfo(null);
    setShowSearchResults(false);
    setFormData({
      amount: '',
      payment_method: 'credit_card',
      payment_date: new Date(),
      status: 'completed',
      transaction_id: '',
      notes: ''
    });
    onClose();
  };

  const selectedCaseInfo = getSelectedCaseInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record a New Payment</DialogTitle>
          <DialogDescription>
            Search for a debtor and select their debt account to record a payment.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingData ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8 mb-4" />
            <p className="text-gray-600">Loading debtors and cases...</p>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {/* Debtor Search */}
            <div className="space-y-2">
              <Label>Search for Debtor *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Type debtor name or email to search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && filteredDebtors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredDebtors.map((debtor) => (
                      <div
                        key={debtor.id}
                        onClick={() => handleDebtorSelect(debtor)}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{debtor.name}</span>
                          {debtor.email && (
                            <span className="text-sm text-gray-500">{debtor.email}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {debtor.cases.length} active debt{debtor.cases.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No Results Message */}
                {showSearchResults && filteredDebtors.length === 0 && searchTerm.trim() && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg px-4 py-3 text-gray-500 text-sm">
                    No debtors found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Selected Debtor Information Card */}
            {selectedDebtorInfo && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">Selected Debtor</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {selectedDebtorInfo.name}</div>
                    {selectedDebtorInfo.email && <div><strong>Email:</strong> {selectedDebtorInfo.email}</div>}
                    <div><strong>Active Debts:</strong> {selectedDebtorInfo.cases.length}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Case Selection - Only show if debtor is selected */}
            {selectedDebtorId && (
              <div className="space-y-2">
                <Label>Debt Account *</Label>
                <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a debt account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {caseItem.account_number || 'No Account #'} - ${(caseItem.current_balance || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getPortfolioName(caseItem.portfolio_id)}
                            {caseItem.original_creditor && ` • ${caseItem.original_creditor}`}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selected Case Information Card */}
            {selectedCaseInfo && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">Debt Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Account:</strong> {selectedCaseInfo.account_number || 'N/A'}</div>
                    <div><strong>Current Balance:</strong> ${(selectedCaseInfo.current_balance || 0).toLocaleString()}</div>
                    <div><strong>Original Balance:</strong> ${(selectedCaseInfo.original_balance || 0).toLocaleString()}</div>
                    <div><strong>Status:</strong> <Badge variant="outline" className="ml-1 capitalize">{selectedCaseInfo.status?.replace('_', ' ')}</Badge></div>
                    <div className="col-span-2"><strong>Portfolio:</strong> {getPortfolioName(selectedCaseInfo.portfolio_id)}</div>
                    {selectedCaseInfo.original_creditor && (
                      <div className="col-span-2"><strong>Original Creditor:</strong> {selectedCaseInfo.original_creditor}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.payment_date ? format(formData.payment_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={formData.payment_date} 
                      onSelect={handleDateChange} 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => handleSelectChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="money_order">Money Order</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID (Optional)</Label>
              <Input 
                id="transaction_id" 
                value={formData.transaction_id} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isLoadingData}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}