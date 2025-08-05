import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SettlementOffer, PaymentConfiguration } from '@/api/entities';

export default function SettlementOfferForm({ caseData }) {
  const [offerAmount, setOfferAmount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('lump_sum');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    loadPaymentConfiguration();
  }, []);

  const loadPaymentConfiguration = async () => {
    try {
      const configs = await PaymentConfiguration.list();
      const currentBalance = caseData.current_balance || 0;
      
      const tierConfig = configs.find(config => 
        currentBalance >= config.debt_tier_min && 
        currentBalance <= config.debt_tier_max
      );

      setPaymentConfig(tierConfig);
    } catch (error) {
      console.error('Error loading payment configuration:', error);
    }
  };

  const getOfferRange = () => {
    if (!paymentConfig || !caseData.current_balance) return { min: 0, max: 0 };
    
    const balance = caseData.current_balance;
    return {
      min: Math.round(balance * paymentConfig.settlement_percentage_min),
      max: Math.round(balance * paymentConfig.settlement_percentage_max)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      toast.error('Please enter a valid offer amount.');
      return;
    }

    const amount = parseFloat(offerAmount);
    const range = getOfferRange();
    
    if (amount < range.min || amount > range.max) {
      toast.error(`Settlement offers must be between $${range.min.toLocaleString()} and $${range.max.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const offerData = {
        case_id: caseData.id,
        offer_amount: amount,
        offer_percentage: (amount / caseData.current_balance) * 100,
        payment_terms: paymentTerms,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        submitted_by_debtor: true
      };

      await SettlementOffer.create(offerData);

      toast.success('Settlement offer submitted successfully! We will review your offer and respond within 5-10 business days.');
      
      // Reset form
      setOfferAmount('');
      setPaymentTerms('lump_sum');
      setNotes('');

    } catch (error) {
      console.error('Error submitting settlement offer:', error);
      toast.error('Failed to submit settlement offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const range = getOfferRange();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Submit Settlement Offer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Calculator className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-green-800 font-semibold">Settlement Information</p>
              <p className="text-green-700">
                Current Balance: ${caseData.current_balance?.toLocaleString()}
              </p>
              {paymentConfig && (
                <p className="text-green-700">
                  Acceptable Range: ${range.min.toLocaleString()} - ${range.max.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="offerAmount">Settlement Offer Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="offerAmount"
                type="number"
                step="0.01"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="pl-10"
                placeholder="Enter your offer amount"
                min={range.min}
                max={range.max}
                required
              />
            </div>
            {paymentConfig && (
              <p className="text-xs text-gray-600">
                Settlement offers must be between ${range.min.toLocaleString()} and ${range.max.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms *</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lump_sum">Lump Sum Payment</SelectItem>
                <SelectItem value="short_term_plan">Short-term Payment Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about your settlement offer..."
              className="min-h-24"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            size="lg"
            disabled={isSubmitting || !offerAmount}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Offer...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Submit Settlement Offer
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}