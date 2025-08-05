
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Case } from '@/api/entities';
import { toast } from "sonner";
import { Scale, Building2, CheckSquare, Square, Save, Loader2, X } from 'lucide-react';
import usePermissions from '@/components/hooks/usePermissions';

const defaultTasks = [
    { title: "Review for legal merit", completed: false },
    { title: "Send Letter of Intent", completed: false },
    { title: "Prepare legal filing documents", completed: false },
    { title: "File lawsuit with court", completed: false },
    { title: "Serve debtor", completed: false },
    { title: "Monitor for credit reporting opportunities", completed: false },
];

export default function LegalDetailsPanel({ caseData, lawFirms, onUpdate, onClose }) {
  const [details, setDetails] = useState(caseData.legal_details || {});
  const [isSaving, setIsSaving] = useState(false);
  const { canEdit } = usePermissions();
  
  const handleDetailChange = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskToggle = (index) => {
    const updatedTasks = [...(details.tasks || defaultTasks)];
    updatedTasks[index].completed = !updatedTasks[index].completed;
    setDetails(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalTasks = details.tasks || defaultTasks;
      const updatedCase = await Case.update(caseData.id, { 
        legal_details: { ...details, tasks: finalTasks } 
      });
      toast.success("Legal details updated successfully!");
      onUpdate(updatedCase);
    } catch (error) {
      console.error("Error updating legal details:", error);
      toast.error("Failed to update legal details.");
    } finally {
      setIsSaving(false);
    }
  };

  const tasks = details.tasks || defaultTasks;
  const canSave = canEdit && !isSaving;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Legal Debt Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4"/></Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>{caseData.debtor_name}</CardTitle>
                <CardDescription>Account: {caseData.account_number}</CardDescription>
            </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5"/>Legal Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="legal_status">Status</Label>
                    <Select value={details.legal_status || 'pending_review'} onValueChange={(value) => handleDetailChange('legal_status', value)} disabled={!canSave}>
                        <SelectTrigger id="legal_status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending_review">Pending Review</SelectItem>
                            <SelectItem value="pre_litigation">Pre-Litigation</SelectItem>
                            <SelectItem value="filed">Filed</SelectItem>
                            <SelectItem value="judgment_awarded">Judgment Awarded</SelectItem>
                            <SelectItem value="settled_in_court">Settled in Court</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="assigned_counsel_id">Assigned Counsel</Label>
                    <Select value={details.assigned_counsel_id || ''} onValueChange={(value) => handleDetailChange('assigned_counsel_id', value)} disabled={!canSave}>
                        <SelectTrigger id="assigned_counsel_id"><SelectValue placeholder="Assign to a law firm..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>None</SelectItem>
                            {lawFirms.map(firm => (
                                <SelectItem key={firm.id} value={firm.id}>{firm.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="w-5 h-5"/>Legal Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                        <Checkbox
                            id={`task-${index}`}
                            checked={task.completed}
                            onCheckedChange={() => handleTaskToggle(index)}
                            disabled={!canSave}
                        />
                        <Label htmlFor={`task-${index}`} className={`flex-1 ${canSave ? 'cursor-pointer' : 'cursor-default'} ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                        </Label>
                    </div>
                ))}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Legal Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea 
                    placeholder="Add notes specific to the legal process..."
                    value={details.legal_notes || ''}
                    onChange={(e) => handleDetailChange('legal_notes', e.target.value)}
                    rows={5}
                    disabled={!canSave}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!canSave}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Save Legal Details
            </Button>
        </div>
    </div>
  );
}
