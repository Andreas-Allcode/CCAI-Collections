import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Case, Debtor, Portfolio, ActivityLog } from '@/api/entities';
import { toast } from 'sonner';

export default function TestActivityLog() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Step 1: Create a test debtor
      const testDebtor = await Debtor.create({
        name: 'Test Debtor',
        email: 'test@example.com',
        phone: '555-0123'
      });
      setTestResults(prev => [...prev, `✓ Created test debtor: ${testDebtor.name}`]);

      // Step 2: Create a test portfolio
      const testPortfolio = await Portfolio.create({
        name: 'Test Portfolio',
        client: 'Test Client',
        portfolio_type: 'committed',
        status: 'active'
      });
      setTestResults(prev => [...prev, `✓ Created test portfolio: ${testPortfolio.name}`]);

      // Step 3: Create a test debt (this should trigger activity logs)
      const testCase = await Case.create({
        portfolio_id: testPortfolio.id,
        debtor_id: testDebtor.id,
        account_number: 'TEST001',
        original_creditor: 'Test Bank',
        original_balance: 1000,
        current_balance: 1000,
        charge_off_date: '2024-01-01',
        status: 'new',
        priority: 'medium'
      });
      setTestResults(prev => [...prev, `✓ Created test debt: ${testCase.account_number}`]);

      // Step 4: Check activity logs
      const activityLogs = await ActivityLog.filter({ case_id: testCase.id });
      setTestResults(prev => [...prev, `✓ Found ${activityLogs.length} activity log entries`]);

      // Step 5: Verify specific entries
      const accountCreatedLog = activityLogs.find(log => log.description === 'Account Created');
      const dvnSentLog = activityLogs.find(log => log.description === 'DVN was sent');

      if (accountCreatedLog) {
        setTestResults(prev => [...prev, `✓ Account Created log entry found`]);
      } else {
        setTestResults(prev => [...prev, `✗ Account Created log entry NOT found`]);
      }

      if (dvnSentLog) {
        setTestResults(prev => [...prev, `✓ DVN was sent log entry found`]);
      } else {
        setTestResults(prev => [...prev, `✗ DVN was sent log entry NOT found`]);
      }

      // Step 6: Test status update (should create another activity log)
      await Case.update(testCase.id, { status: 'in_collection' });
      const updatedLogs = await ActivityLog.filter({ case_id: testCase.id });
      setTestResults(prev => [...prev, `✓ After status update: ${updatedLogs.length} activity log entries`]);

      toast.success('Test completed successfully!');
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults(prev => [...prev, `✗ Test failed: ${error.message}`]);
      toast.error('Test failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Activity Log Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTest} disabled={isRunning}>
            {isRunning ? 'Running Test...' : 'Run Activity Log Test'}
          </Button>
          
          {testResults.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className={`text-sm ${result.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}