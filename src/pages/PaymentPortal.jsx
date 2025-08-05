
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DebtorPortalSession, Case, Debtor, Payment, Communication } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldAlert, Clock } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Import Portal Components
import PaymentForm from '../components/portal/PaymentForm';
import PaymentPlanSetup from '../components/portal/PaymentPlanSetup';
import AccountHistory from '../components/portal/AccountHistory';
import DisputeForm from '../components/portal/DisputeForm';
import SettlementOfferForm from '../components/portal/SettlementOfferForm';
import CommunicationPreferences from '../components/portal/CommunicationPreferences';

export default function PaymentPortal() {
  const [session, setSession] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [debtor, setDebtor] = useState(null);
  const [relatedData, setRelatedData] = useState({ payments: [], communications: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState("Access Denied");
  const location = useLocation();

  useEffect(() => {
    const verifySession = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setDenialReason("No access token provided. This page requires a secure link to be accessed.");
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }
      
      try {
        const sessions = await DebtorPortalSession.filter({ access_token: token });
        if (sessions.length === 0) {
          setDenialReason("Invalid access token. Please use the link provided to you.");
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        const currentSession = sessions[0];
        if (!currentSession.is_active || new Date(currentSession.expires_at) < new Date()) {
          setDenialReason("This secure link has expired. Please request a new one.");
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        setSession(currentSession);
        
        // Fetch all related data
        const [caseDetails, payments, communications] = await Promise.all([
            Case.filter({ id: currentSession.case_id }).then(res => res[0]),
            Payment.filter({ case_id: currentSession.case_id }, '-payment_date'),
            Communication.filter({ case_id: currentSession.case_id }, '-sent_date'),
        ]);

        if (!caseDetails) {
          throw new Error("Case data not found for this session.");
        }

        setCaseData(caseDetails);
        setRelatedData({ payments, communications });
        
        // If debtor_id exists, fetch from Debtor entity. Otherwise, use legacy fields.
        if (caseDetails.debtor_id) {
            const debtorDetails = await Debtor.filter({ id: caseDetails.debtor_id }).then(res => res[0]);
            setDebtor(debtorDetails);
        } else {
            setDebtor({
                name: caseDetails.debtor_name,
                email: caseDetails.debtor_email,
                phone: caseDetails.debtor_phone,
                address: caseDetails.debtor_address,
            });
        }
        
      } catch (error) {
        console.error("Error verifying portal session:", error);
        setDenialReason("An error occurred while trying to access the portal.");
        setAccessDenied(true);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-lg text-gray-700">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">{denialReason}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
        <Toaster richColors />
        <header className="bg-white shadow-sm">
            <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Debtor Payment Portal</h1>
                <div className="text-right">
                    <p className="font-semibold">{debtor?.name}</p>
                    <p className="text-sm text-gray-600">Account #: {caseData?.account_number}</p>
                </div>
            </div>
        </header>

        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Payment & Plans */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Make a Payment</CardTitle>
                            <CardDescription>
                                Your current balance is ${caseData.current_balance?.toLocaleString()}. You can pay in full, or set up a payment plan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="one-time-payment">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="one-time-payment">One-Time Payment</TabsTrigger>
                                    <TabsTrigger value="payment-plan">Set Up Payment Plan</TabsTrigger>
                                </TabsList>
                                <TabsContent value="one-time-payment" className="pt-6">
                                    <PaymentForm caseData={caseData} />
                                </TabsContent>
                                <TabsContent value="payment-plan" className="pt-6">
                                    <PaymentPlanSetup caseData={caseData} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                    <AccountHistory 
                        caseData={caseData}
                        payments={relatedData.payments} 
                        communications={relatedData.communications} 
                    />
                </div>
                {/* Right Column - Actions */}
                <div className="space-y-8">
                    <DisputeForm caseData={caseData} />
                    <SettlementOfferForm caseData={caseData} />
                    <CommunicationPreferences session={session} onUpdate={setSession} />
                </div>
            </div>
        </main>
    </div>
  );
}
