import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cleanupDebtorNames } from "@/api/functions";
import { deleteInvalidPayments } from "@/api/functions";
import usePermissions from '@/components/hooks/usePermissions';

export default function DataMaintenanceSettings() {
    const [isCleaning, setIsCleaning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { isAdmin } = usePermissions();

    const handleCleanup = async () => {
        if (!window.confirm("Are you sure you want to assign placeholder names to all debts without one? This action cannot be undone.")) {
            return;
        }

        setIsCleaning(true);
        toast.info("Starting data cleanup process...");
        try {
            const { data, error } = await cleanupDebtorNames();
            if (error || !data.success) {
                throw new Error(data.error || "An unknown error occurred.");
            }
            toast.success(data.message);
        } catch (err) {
            toast.error(`Cleanup failed: ${err.message}`);
            console.error(err);
        } finally {
            setIsCleaning(false);
        }
    };

    const handleDeleteInvalidPayments = async () => {
        if (!window.confirm("Are you sure you want to delete all payments linked to Unknown Cases or Unknown Debtors? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        toast.info("Scanning and deleting invalid payments...");
        try {
            const { data, error } = await deleteInvalidPayments();
            if (error || !data.success) {
                throw new Error(data.error || "An unknown error occurred.");
            }
            toast.success(data.message);
        } catch (err) {
            toast.error(`Deletion failed: ${err.message}`);
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Maintenance</CardTitle>
                <CardDescription>Perform administrative data cleanup tasks. Use with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                    <div>
                        <h4 className="font-semibold">Assign Names to Debtors</h4>
                        <p className="text-sm text-gray-500">
                            Scans all debt records and assigns a unique placeholder name to any record missing a debtor name.
                        </p>
                    </div>
                    <Button onClick={handleCleanup} disabled={isCleaning} variant="destructive">
                        {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Run Cleanup
                    </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50">
                    <div>
                        <h4 className="font-semibold">Delete Invalid Payments</h4>
                        <p className="text-sm text-gray-500">
                            Removes payments linked to Unknown Cases or Unknown Debtors from the system.
                        </p>
                    </div>
                    <Button onClick={handleDeleteInvalidPayments} disabled={isDeleting} variant="destructive">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Invalid
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}