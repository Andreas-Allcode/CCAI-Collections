import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Settings, MessageSquare } from 'lucide-react';
import { diagnoseSMS } from '@/api/functions';

export default function TestAPI() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await diagnoseSMS();
      if (data.success) {
        setDiagnostics(data.diagnostics);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Diagnostics</h1>
        <p className="text-gray-600 mt-1">Test and diagnose CloudContactAI API connection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            CloudContactAI SMS Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
            Run SMS Diagnostics
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Client Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(diagnostics.clientInfo, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Phone Numbers</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(diagnostics.phoneNumbers, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recent Campaigns</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(diagnostics.recentCampaigns, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Configuration</h3>
                <div className="space-y-2">
                  <p><strong>Client ID:</strong> {diagnostics.clientId}</p>
                  <p><strong>Base URL:</strong> {diagnostics.baseUrl}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}