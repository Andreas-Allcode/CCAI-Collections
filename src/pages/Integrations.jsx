import React, { useState, useEffect } from 'react';
import { Integration } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Link, Server, Settings, Wifi, WifiOff, Loader2 } from 'lucide-react';
import IntegrationForm from '../components/integrations/IntegrationForm';

const integrationServices = [
  { name: 'Experian', description: 'Credit reporting and data services.', logo: '/path/to/experian-logo.png' },
  { name: 'RNN', description: 'Repossession and recovery network.', logo: '/path/to/rnn-logo.png' },
  { name: 'TLO', description: 'Data fusion and investigative solutions.', logo: '/path/to/tlo-logo.png' }
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const existingConfigs = await Integration.list();
      const configsMap = new Map(existingConfigs.map(item => [item.name, item]));
      
      const allIntegrations = integrationServices.map(service => ({
        ...service,
        config: configsMap.get(service.name) || null,
      }));

      setIntegrations(allIntegrations);
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration);
    setIsFormOpen(true);
  };
  
  const handleSave = () => {
    setIsFormOpen(false);
    setSelectedIntegration(null);
    loadIntegrations();
  };

  const getStatus = (config) => {
    if (!config) return { text: 'Not Configured', color: 'bg-gray-100 text-gray-800', icon: <Settings className="w-3 h-3" /> };
    if (config.status === 'error') return { text: 'Connection Error', color: 'bg-red-100 text-red-800', icon: <WifiOff className="w-3 h-3" /> };
    return { text: 'Connected', color: 'bg-green-100 text-green-800', icon: <Wifi className="w-3 h-3" /> };
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Dialog open={isFormOpen} onOpenChange={(open) => { if(!open) { setIsFormOpen(false); setSelectedIntegration(null); }}}>
        <DialogContent>
          {selectedIntegration && <IntegrationForm integration={selectedIntegration} onSave={handleSave} />}
        </DialogContent>
      </Dialog>
    
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Manage SFTP connections to third-party services.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-gray-200 rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-4 bg-gray-200 rounded w-full mb-4"></div><div className="h-10 bg-gray-200 rounded w-1/3"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const status = getStatus(integration.config);
            return (
              <Card key={integration.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{integration.name}</CardTitle>
                  <Server className="h-5 w-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">{integration.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={status.color + " gap-1.5 pl-2 pr-2.5 py-1"}>{status.icon}{status.text}</Badge>
                    <Button variant="outline" onClick={() => handleConfigure(integration)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}