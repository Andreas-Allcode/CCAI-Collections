import React, { useState } from 'react';
import { Debtor } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function DebtorForm({ debtor, onSuccess, onCancel }) {
    const [formData, setFormData] = useState(debtor || {
        name: '',
        email: '',
        phone: '',
        address: '',
        ssn_last4: '',
        dob: '',
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("Debtor name is required.");
            return;
        }

        setIsSaving(true);
        try {
            let savedDebtor;
            if (debtor?.id) {
                savedDebtor = await Debtor.update(debtor.id, formData);
                toast.success("Debtor updated successfully!");
            } else {
                savedDebtor = await Debtor.create(formData);
                toast.success("Debtor created successfully!");
            }
            if(onSuccess) onSuccess(savedDebtor);
        } catch (error) {
            console.error("Error saving debtor:", error);
            toast.error("Failed to save debtor.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{debtor ? 'Edit Debtor' : 'Create New Debtor'}</CardTitle>
                <CardDescription>
                    {debtor ? 'Update the details for this debtor.' : 'Add a new debtor to the system. You can add debts to them later.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={formData.address} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="ssn_last4">SSN (Last 4)</Label>
                            <Input id="ssn_last4" value={formData.ssn_last4} onChange={handleChange} maxLength="4" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" type="date" value={formData.dob} onChange={handleChange} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={formData.notes} onChange={handleChange} placeholder="Add any relevant notes about the debtor..."/>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {debtor ? 'Save Changes' : 'Create Debtor'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}