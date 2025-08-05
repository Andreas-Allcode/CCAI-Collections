import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Integration } from '@/api/entities';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { testSFTP } from '@/api/functions';
import { Loader2, Save, Wifi, WifiOff, ShieldQuestion } from 'lucide-react';

export default function IntegrationForm({ integration, onSave }) {
  const [formData, setFormData] = useState({
    name: integration.name,
    type: 'sftp',
    hostname: integration.config?.hostname || '',
    port: integration.config?.port || 22,
    username: integration.config?.username || '',
    password: '' // Always empty for security
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: id === 'port' ? parseInt(value) : value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, status } = await testSFTP(formData);
      if (status === 200 && data.success) {
        setTestResult({ success: true, message: "Connection successful!" });
        toast.success("SFTP connection test successful!");
      } else {
        throw new Error(data.error || "Connection test failed.");
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
      toast.error(`Connection test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = { ...formData };
      if (!formData.password) {
        delete dataToSave.password; // Don't overwrite with empty password
      }

      if (integration.config) {
        await Integration.update(integration.config.id, dataToSave);
      } else {
        await Integration.create(dataToSave);
      }
      toast.success(`${integration.name} configuration saved successfully!`);
      onSave();
    } catch (error) {
      toast.error(`Failed to save configuration: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Toaster richColors />
      <DialogHeader>
        <DialogTitle>Configure {integration.name} SFTP</DialogTitle>
        <DialogDescription>
          Enter the connection details for {integration.name}. Your password is encrypted and stored securely.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hostname">Hostname</Label>
            <Input id="hostname" value={formData.hostname} onChange={handleChange} placeholder="sftp.experian.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input id="port" type="number" value={formData.port} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={formData.username} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="Enter new password or leave blank" />
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.success ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldQuestion className="w-4 h-4 mr-2" />}
            Test Connection
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}