import React from 'react';
import ProfileSettings from '@/components/settings/ProfileSettings';
import CompanySettings from '@/components/settings/CompanySettings';
import UserSettings from '@/components/settings/UserSettings';
import IntegrationsSettings from '@/components/settings/IntegrationsSettings';
import DataMaintenanceSettings from '@/components/settings/DataMaintenanceSettings';
import { Toaster } from "@/components/ui/sonner";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage your account, company, and integration settings.</p>
                    </header>

                    <div className="space-y-8">
                        <ProfileSettings />
                        <CompanySettings />
                        <UserSettings />
                        <IntegrationsSettings />
                        <DataMaintenanceSettings />
                    </div>
                </div>
            </main>
            <Toaster richColors />
        </div>
    );
}