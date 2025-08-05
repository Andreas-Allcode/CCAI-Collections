import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Template } from '@/api/entities';
import { toast, Toaster } from 'sonner';

export default function NewTemplate() {
    const [formData, setFormData] = useState({
        name: '',
        type: 'email',
        subject: '',
        body: '',
        status: 'active'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const templateId = params.get('id');
    const isEditing = Boolean(templateId);

    useEffect(() => {
        if (isEditing) {
            setIsLoading(true);
            const fetchTemplate = async () => {
                try {
                    const templateData = await Template.get(templateId);
                    setFormData(templateData);
                } catch (error) {
                    console.error("Failed to fetch template:", error);
                    toast.error("Could not load template for editing.");
                    navigate(createPageUrl("Communications"));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTemplate();
        }
    }, [templateId, isEditing, navigate]);


    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.type || !formData.body) {
            toast.error("Template name, type, and body are required.");
            return;
        }
        if (formData.type === 'email' && !formData.subject) {
            toast.error("Subject is required for email templates.");
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                await Template.update(templateId, formData);
                toast.success("Template updated successfully!");
            } else {
                await Template.create(formData);
                toast.success("Template created successfully!");
            }
            navigate(createPageUrl("Communications"));
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error(`Failed to save template: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="p-6 md:p-8 flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <Toaster richColors />
            <div className="flex items-center gap-4">
                <Link to={createPageUrl("Communications")} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Communications
                </Link>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Template' : 'Create New Template'}</h1>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Template Details</CardTitle>
                        <CardDescription>{isEditing ? 'Update the details of your template.' : 'Set up a new reusable communication template.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Template Name *</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g., Initial Contact Email" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Template Type *</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(value) => handleSelectChange('type', value)}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="letter">Letter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.type === 'email' && (
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input 
                                    id="subject" 
                                    placeholder="Regarding your account..." 
                                    value={formData.subject || ''} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="body">Body *</Label>
                            <Textarea 
                                id="body"
                                placeholder="Enter template content. Use placeholders like {{debtor_name}}, {{account_number}}, {{current_balance}}."
                                value={formData.body}
                                onChange={handleInputChange}
                                className="min-h-48"
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Available placeholders: <code>{`{{debtor_name}}`}</code>, <code>{`{{account_number}}`}</code>, <code>{`{{current_balance}}`}</code>
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {isEditing ? 'Update Template' : 'Save Template'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}