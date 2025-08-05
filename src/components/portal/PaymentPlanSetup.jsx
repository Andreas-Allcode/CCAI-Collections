import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, Building2, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentPlan, PaymentConfiguration } from '@/api/entities';

export default function PaymentPlanSetup({ caseData, onSuccess }) {
  const [frequency, setFrequency] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    loadPaymentConfiguration();
  }, [caseData]);

  useEffect(() => {
    if (paymentConfig && frequency) {
      calculateAvailablePlans();
    }
  }, [paymentConfig, frequency, caseData.current_balance]);

  const loadPaymentConfiguration = async () => {
    try {
      const configs = await PaymentConfiguration.list();
      const currentBalance = caseData.current_balance || 0;
      
      // Find the appropriate tier configuration
      const tierConfig = configs.find(config => 
        currentBalance >= config.debt_tier_min && 
        currentBalance <= config.debt_tier_max
      );

      setPaymentConfig(tierConfig || {
        min_payment_percentage: 0.05, // 5% default
        min_payment_amount: 25,
        max_term_months: 36,
        weekly_available: true,
        monthly_available: true
      });

    } catch (error) {
      console.error('Error loading payment configuration:', error);
      // Use default configuration
      setPaymentConfig({
        min_payment_percentage: 0.05,
        min_payment_amount: 25,
        max_term_months: 36,
        weekly_available: true,
        monthly_available: true
      });
    }
  };

  const calculateAvailablePlans = () => {
    if (!paymentConfig) return;

    const balance = caseData.current_balance || 0;
    const minPaymentByPercentage = balance * paymentConfig.min_payment_percentage;
    const minPayment = Math.max(minPaymentByPercentage, paymentConfig.min_payment_amount);
    
    const plans = [];
    const maxTerms = frequency === 'weekly' ? paymentConfig.max_term_months * 4 : paymentConfig.max_term_months;

    // Generate standard plan options
    const planOptions = [
      { terms: frequency === 'weekly' ? 12 : 3, label: frequency === 'weekly' ? '3 months' : '3 months' },
      { terms: frequency === 'weekly' ? 24 : 6, label: frequency === 'weekly' ? '6 months' : '6 months' },
      { terms: frequency === 'weekly' ? 48 : 12, label: frequency === 'weekly' ? '12 months' : '12 months' },
      { terms: frequency === 'weekly' ? 96 : 24, label: frequency === 'weekly' ? '24 months' : '24 months' },
    ];

    planOptions.forEach(option => {
      if (option.terms <= maxTerms) {
        const paymentAmount = balance / option.terms;
        if (paymentAmount >= minPayment) {
          plans.push({
            terms: option.terms,
            label: option.label,
            payment: paymentAmount,
            total: balance
          });
        }
      }
    });

    setAvailablePlans(plans);
    if (plans.length > 0) {
      setSelectedPlan(plans[0]);
    }
  };

  const handleCustomPlan = () => {
    if (!customAmount || !paymentConfig) return;

    const amount = parseFloat(customAmount);
    const balance = caseData.current_balance || 0;
    const minPayment = Math.max(
      balance * paymentConfig.min_payment_percentage, 
      paymentConfig.min_payment_amount
    );

    if (amount < minPayment) {
      toast.error(`Minimum payment is $${minPayment.toFixed(2)}`);
      return;
    }

    const terms = Math.ceil(balance / amount);
    const maxTerms = frequency === 'weekly' ? paymentConfig.max_term_months * 4 : paymentConfig.max_term_months;

    if (terms > maxTerms) {
      toast.error(`Payment plan cannot exceed ${paymentConfig.max_term_months} months`);
      return;
    }

    setSelectedPlan({
      terms: terms,
      label: `Custom ${terms} ${frequency === 'weekly' ? 'weeks' : 'months'}`,
      payment: amount,
      total: balance,
      custom: true
    });
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast.error('Please select a payment plan.');
      return;
    }

    setIsCreating(true);

    try {
      const planData = {
        case_id: caseData.id,
        total_amount: selectedPlan.total,
        monthly_payment: frequency === 'weekly' ? selectedPlan.payment * 4.33 : selectedPlan.payment,
        frequency: frequency,
        start_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        auto_pay: true, // Default to auto-pay for portal plans
        status: 'active'
      };

      // Calculate end date
      const startDate = new Date();
      if (frequency === 'weekly') {
        startDate.setDate(startDate.getDate() + (selectedPlan.terms * 7));
      } else {
        startDate.setMonth(startDate.getMonth() + selectedPlan.terms);
      }
      planData.end_date = startDate.toISOString().split('T')[0];

      await PaymentPlan.create(planData);

      toast.success('Payment plan created successfully!');
      onSuccess();

    } catch (error) {
      console.error('Error creating payment plan:', error);
      toast.error('Failed to create payment plan. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Setup Payment Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePlan} className="space-y-6">
            {/* Payment Frequency */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Payment Frequency</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentConfig?.weekly_available && (
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      frequency === 'weekly' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFrequency('weekly')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="frequency"
                        value="weekly"
                        checked={frequency === 'weekly'}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold">Weekly Payments</p>
                        <p className="text-sm text-gray-600">Pay every week</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentConfig?.monthly_available && (
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      frequency === 'monthly' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFrequency('monthly')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="frequency"
                        value="monthly"
                        checked={frequency === 'monthly'}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold">Monthly Payments</p>
                        <p className="text-sm text-gray-600">Pay once per month</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Available Plans */}
            {availablePlans.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Choose a Plan</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePlans.map((plan, index) => (
                    <div 
                      key={index}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedPlan === plan 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan === plan}
                          onChange={() => setSelectedPlan(plan)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">${plan.payment.toFixed(2)} per {frequency.slice(0, -2)}</p>
                          <p className="text-sm text-gray-600">{plan.label} • ${plan.total.toLocaleString()} total</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Payment Amount */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Or Enter Custom Amount</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="customAmount">Payment Amount per {frequency.slice(0, -2)}</Label>
                  <Input
                    id="customAmount"
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="pt-6">
                  <Button type="button" variant="outline" onClick={handleCustomPlan}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </Button>
                </div>
              </div>
              {paymentConfig && (
                <p className="text-sm text-gray-600">
                  Minimum payment: ${Math.max(
                    (caseData.current_balance || 0) * paymentConfig.min_payment_percentage,
                    paymentConfig.min_payment_amount
                  ).toFixed(2)}
                </p>
              )}
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Auto-Payment Method</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'credit_card' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('credit_card')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Automatic payments</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'ach' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('ach')}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold">Bank Account (ACH)</p>
                      <p className="text-sm text-gray-600">Lower fees</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Plan Summary</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Payment:</span> ${selectedPlan.payment.toFixed(2)} per {frequency.slice(0, -2)}</p>
                  <p><span className="font-medium">Duration:</span> {selectedPlan.label}</p>
                  <p><span className="font-medium">Total Amount:</span> ${selectedPlan.total.toLocaleString()}</p>
                  <p><span className="font-medium">First Payment:</span> {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              size="lg"
              disabled={!selectedPlan || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Payment Plan...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Setup Payment Plan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}