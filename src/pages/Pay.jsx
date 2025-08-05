import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Case, Payment, Portfolio } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast, Toaster } from "sonner";
import { DollarSign, ShieldCheck, Lock, CreditCard, CheckCircle } from 'lucide-react';

// This is a public page for debtors. No login required.
// In a real app, the case_id would be a secure, single-use token.
// For this demo, we use the direct case_id from the URL query parameter.

export default function Pay() {
  const [caseDetails, setCaseDetails] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const caseId = searchParams.get('case_id');

    if (!caseId) {
      setIsLoading(false);
      return;
    }

    const loadCase = async () => {
      try {
        const caseData = await Case.get(caseId);
        if (caseData) {
          setCaseDetails(caseData);
          setPaymentAmount(caseData.current_balance.toString());
          if (caseData.portfolio_id) {
             const portfolioData = await Portfolio.get(caseData.portfolio_id);
             setPortfolio(portfolioData);
          }
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        toast.error("Could not retrieve case details. The link may be invalid.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCase();
  }, [location.search]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    toast.info("Processing payment...");

    // Simulate payment gateway processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const paymentData = {
        case_id: caseDetails.id,
        amount: parseFloat(paymentAmount),
        payment_method: 'credit_card',
        payment_date: new Date().toISOString(),
        transaction_id: `txn_${Date.now()}`,
        status: 'completed',
        notes: 'Paid via debtor portal'
      };
      
      await Payment.create(paymentData);

      // Update case balance
      const newBalance = caseDetails.current_balance - parseFloat(paymentAmount);
      await Case.update(caseDetails.id, { 
        current_balance: newBalance,
        status: newBalance <= 0 ? 'paid' : caseDetails.status,
        last_payment_date: new Date().toISOString()
      });

      toast.success("Payment successful! Your records have been updated.");
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("There was an error processing your payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Basic formatting for card details
    if (name === 'number') {
        const formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardDetails(prev => ({...prev, [name]: formatted.slice(0, 19) }));
    } else if (name === 'expiry') {
        const formatted = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 / ');
        setCardDetails(prev => ({...prev, [name]: formatted.slice(0, 7) }));
    } else if (name === 'cvc') {
        setCardDetails(prev => ({...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
    } else {
        setCardDetails(prev => ({...prev, [name]: value}));
    }
  };


  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><Skeleton className="h-96 w-full max-w-lg" /></div>;
  }

  if (!caseDetails) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-red-600">Invalid Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>We could not find any case associated with this link. It may have expired or been used already.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (paymentSuccess) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-green-600">Payment Successful</CardTitle>
                    <CardDescription>Thank you for your payment.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>A confirmation has been sent to your email on file.</p>
                    <p className="font-semibold mt-4">Amount Paid: ${parseFloat(paymentAmount).toLocaleString()}</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Toaster richColors />
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Secure Payment Portal</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 w-full max-w-5xl">
            {/* Case Details */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Your Account Details</CardTitle>
                    <CardDescription>Review your outstanding balance below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Original Creditor:</span>
                        <span className="font-medium">{portfolio?.original_creditor || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium">...{caseDetails.account_number?.slice(-4)}</span>
                    </div>
                    <div className="border-t my-4" />
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-700">Current Balance:</span>
                        <span className="font-bold text-2xl text-blue-600">${caseDetails.current_balance?.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Make a Payment</CardTitle>
                    <CardDescription>Enter your payment details below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="paymentAmount" className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Payment Amount
                            </Label>
                            <Input
                                id="paymentAmount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                required
                                max={caseDetails.current_balance}
                                step="0.01"
                            />
                        </div>
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Card Information
                            </Label>
                            <Input name="name" placeholder="Name on Card" required value={cardDetails.name} onChange={handleInputChange}/>
                            <Input name="number" placeholder="Card Number" required value={cardDetails.number} onChange={handleInputChange}/>
                            <div className="flex gap-4">
                                <Input name="expiry" placeholder="MM / YY" required value={cardDetails.expiry} onChange={handleInputChange}/>
                                <Input name="cvc" placeholder="CVC" required value={cardDetails.cvc} onChange={handleInputChange}/>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : `Pay $${parseFloat(paymentAmount || 0).toLocaleString()}`}
                            <Lock className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
        <p className="text-xs text-gray-500 mt-8">
            All transactions are secure and encrypted.
        </p>
    </div>
  );
}