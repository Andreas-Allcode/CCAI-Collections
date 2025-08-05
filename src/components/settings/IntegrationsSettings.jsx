
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSettings } from "@/api/entities";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function IntegrationsSettings() {
    const [settings, setSettings] = useState(null);
    // Updated default values to reflect the TEST environment
    const [formData, setFormData] = useState({
        ccai_base_url: 'https://core-test-cloudcontactai.allcode.com/api',
        ccai_sms_endpoint: '/clients/{clientId}/campaigns/direct',
        ccai_email_endpoint: 'https://email-campaigns-test-cloudcontactai.allcode.com/api/v1/campaigns'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const settingsList = await AppSettings.list(null, 1);
            if (settingsList.length > 0) {
                const loadedSettings = settingsList[0];
                setSettings(loadedSettings);
                // Pre-fill with saved settings, or fallback to new test defaults
                setFormData({
                    ccai_base_url: loadedSettings.ccai_base_url || 'https://core-test-cloudcontactai.allcode.com/api',
                    ccai_sms_endpoint: loadedSettings.ccai_sms_endpoint || '/clients/{clientId}/campaigns/direct',
                    ccai_email_endpoint: loadedSettings.ccai_email_endpoint || 'https://email-campaigns-test-cloudcontactai.allcode.com/api/v1/campaigns'
                });
            }
        } catch (error) {
            console.error("Error loading app settings:", error);
            toast.error("Failed to load integration settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (settings) {
                await AppSettings.update(settings.id, formData);
            } else {
                const newSettings = await AppSettings.create(formData);
                setSettings(newSettings);
            }
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>CloudContactAI Integration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading settings...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>CloudContactAI Integration</CardTitle>
                <CardDescription>
                    Configure the API endpoints for sending SMS and Emails via CloudContactAI.
                    These settings are now pre-configured with the correct endpoints for the test environment.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="ccai_base_url">SMS API Base URL</Label>
                        <Input
                            id="ccai_base_url"
                            value={formData.ccai_base_url}
                            onChange={handleChange}
                            placeholder="https://core-test-cloudcontactai.allcode.com/api"
                        />
                        <p className="text-xs text-gray-500">Base URL for SMS API</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ccai_sms_endpoint">SMS Endpoint Path</Label>
                        <Input
                            id="ccai_sms_endpoint"
                            value={formData.ccai_sms_endpoint}
                            onChange={handleChange}
                            placeholder="/clients/{clientId}/campaigns/direct"
                        />
                        <p className="text-xs text-gray-500">SMS endpoint path (clientId will be automatically replaced)</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ccai_email_endpoint">Email API Full URL</Label>
                        <Input
                            id="ccai_email_endpoint"
                            value={formData.ccai_email_endpoint}
                            onChange={handleChange}
                            placeholder="https://email-campaigns-test-cloudcontactai.allcode.com/api/v1/campaigns"
                        />
                        <p className="text-xs text-gray-500">Full URL for email campaigns (uses different base URL)</p>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Settings
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
