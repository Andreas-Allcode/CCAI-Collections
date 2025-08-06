import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Send, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getCCAiTemplates, createCCAiCampaign } from "@/api/functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster, toast } from 'sonner';

// A mock function for segments as it's not in the provided context
const getCCAiSegments = async () => {
  console.warn("getCCAiSegments is a mock function.");
  return { data: [{id: '1', name: 'All Debtors'}, {id: '2', name: 'High Priority Segment'}] };
};

export default function NewCampaign() {
  const [templates, setTemplates] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailTemplateId: '',
    smsTemplateId: '',
    segmentId: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrerequisites = async () => {
      setIsLoading(true);
      try {
        const [templatesRes, segmentsRes] = await Promise.all([
          getCCAiTemplates(),
          getCCAiSegments(),
        ]);
        setTemplates(templatesRes?.data?.templates || []);
        setSegments(segmentsRes?.data || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load campaign prerequisites.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrerequisites();
  }, []);
  
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.segmentId || (!formData.emailTemplateId && !formData.smsTemplateId)) {
      toast.error("Please fill out the campaign name, select a segment, and at least one template.");
      return;
    }
    setIsCreating(true);
    try {
      await createCCAiCampaign(formData);
      toast.success("Campaign created successfully!");
      navigate(createPageUrl("Campaigns"));
    } catch(e) {
      toast.error("Failed to create campaign.");
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const emailTemplates = (templates || []).filter(t => t.type === 'email');
  const smsTemplates = (templates || []).filter(t => t.type === 'sms');

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Toaster richColors />
      <Link to={createPageUrl("Campaigns")} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Set up your new communication campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input id="name" placeholder="e.g., Q3 High Balance Outreach" value={formData.name} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label>Target Segment</Label>
            <Select onValueChange={(value) => handleSelectChange('segmentId', value)}>
              <SelectTrigger><SelectValue placeholder="Select a Segment..." /></SelectTrigger>
              <SelectContent>
                {isLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                  (segments || []).map(segment => (
                    <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Email Template (Optional)</Label>
              <Select onValueChange={(value) => handleSelectChange('emailTemplateId', value)}>
                <SelectTrigger><SelectValue placeholder="Select an Email Template..." /></SelectTrigger>
                <SelectContent>
                  {isLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                    emailTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SMS Template (Optional)</Label>
              <Select onValueChange={(value) => handleSelectChange('smsTemplateId', value)}>
                <SelectTrigger><SelectValue placeholder="Select an SMS Template..." /></SelectTrigger>
                <SelectContent>
                  {isLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                    smsTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}