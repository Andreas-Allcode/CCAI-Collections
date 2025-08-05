import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Building2, DollarSign, Calculator, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/api/entities';

export default function PaymentForm({ caseData }) {
  const [paymentType, setPaymentType] = useState('full_payment');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentBalance = caseData?.current_balance || 0;
  const settlementAmount = Math.round(currentBalance * 0.9); // 10% discount

  const getPaymentAmount = () => {
    switch (paymentType) {
      case 'full_payment':
        return currentBalance;
      case 'settled_full':
        return settlementAmount;
      case 'custom':
        return parseFloat(customAmount) || 0;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = getPaymentAmount();
    if (amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    if (paymentType === 'custom' && amount > currentBalance) {
      toast.error('Payment amount cannot exceed the current balance.');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        case_id: caseData.id,
        amount: amount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        notes: paymentType === 'settled_full' ? 'Settled in Full Payment' : 
               paymentType === 'full_payment' ? 'Full Payment' : 'Partial Payment'
      };

      await Payment.create(paymentData);

      toast.success(`Payment of $${amount.toLocaleString()} processed successfully!`);
      
      // Reset form
      setPaymentType('full_payment');
      setCustomAmount('');

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Make a Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_payment" id="full_payment" />
                <Label htmlFor="full_payment" className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span>Pay Full Balance</span>
                    <span className="font-semibold text-lg">${currentBalance.toLocaleString()}</span>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="settled_full" id="settled_full" />
                <Label htmlFor="settled_full" className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Settled in Full</span>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Save 10%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 line-through">${currentBalance.toLocaleString()}</div>
                      <div className="font-semibold text-lg text-green-600">${settlementAmount.toLocaleString()}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Pay 90% of your balance and settle this account in full
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <span>Custom Amount</span>
                </Label>
              </div>
            </RadioGroup>

            {paymentType === 'custom' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="customAmount">Enter Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="customAmount"
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    max={currentBalance}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4" />
              <span className="font-semibold">Payment Summary</span>
            </div>
            
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span>${currentBalance.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Payment Amount:</span>
              <span className="font-semibold">${getPaymentAmount().toLocaleString()}</span>
            </div>
            
            {paymentType === 'settled_full' && (
              <div className="flex justify-between text-green-600">
                <span>You Save:</span>
                <span className="font-semibold">${(currentBalance - settlementAmount).toLocaleString()}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Remaining Balance:</span>
              <span>
                {paymentType === 'full_payment' || paymentType === 'settled_full' 
                  ? '$0.00' 
                  : `$${Math.max(0, currentBalance - getPaymentAmount()).toLocaleString()}`
                }
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-4 h-4" />
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ach" id="ach" />
                <Label htmlFor="ach" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="w-4 h-4" />
                  Bank Transfer (ACH)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Special Settlement Notice */}
          {paymentType === 'settled_full' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-800 font-semibold">Settlement Agreement</p>
                  <p className="text-green-700">
                    By selecting "Settled in Full", you agree that this payment of ${settlementAmount.toLocaleString()} 
                    will satisfy the entire debt obligation and close this account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing || getPaymentAmount() <= 0}
          >
            {isProcessing ? (
              <>Processing Payment...</>
            ) : (
              <>Pay ${getPaymentAmount().toLocaleString()}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}