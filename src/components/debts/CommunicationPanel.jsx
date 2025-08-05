import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea }
from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Loader2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Template } from "@/api/entities";
import { sendSMS } from "@/api/functions";
import { sendEmail } from "@/api/functions";
import { getCCAiTemplates } from "@/api/functions";

export default function CommunicationPanel({ caseData, debtor, onClose }) {
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState({ local: [], ccai: [] });
  const [smsData, setSmsData] = useState({ message: '' });
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  
  const debtorName = debtor?.name || caseData?.debtor_name;
  const debtorPhone = debtor?.phone || caseData?.debtor_phone;
  const debtorEmail = debtor?.email || caseData?.debtor_email;

  useEffect(() => {
    if (caseData) {
      setSmsData({ message: `Hello ${debtorName}, this is regarding your account ${caseData.account_number}. Please contact us.` });
      setEmailData({
        subject: `Regarding Account ${caseData.account_number}`,
        message: `Dear ${debtorName},\n\nThis message is in reference to your account ${caseData.account_number} with a balance of $${caseData.current_balance?.toLocaleString()}.\n\nPlease contact our office to discuss this matter.\n\nSincerely,\nCollection Department`
      });
    }

    const fetchTemplates = async () => {
      try {
        const [localTemplates, ccaiRes] = await Promise.all([
          Template.list(),
          getCCAiTemplates()
        ]);
        const ccaiTemplates = ccaiRes.data || [];
        setTemplates({ local: localTemplates || [], ccai: ccaiTemplates || [] });
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Could not load communication templates.");
      }
    };
    fetchTemplates();
  }, [caseData, debtor]);

  const handleTemplateSelect = (templateId) => {
    const allTemplates = [
      ...templates.local.map(t => ({ ...t, id: `local-${t.id}` })),
      ...templates.ccai.map(t => ({ ...t, id: `ccai-${t.id}` }))
    ];

    const selected = allTemplates.find(t => t.id === templateId);

    if (!selected) return;

    const replacePlaceholders = (text) => {
      if (!text || !caseData) return '';
      return text
        .replace(/{{debtor_name}}/g, debtorName || '')
        .replace(/{{account_number}}/g, caseData.account_number || '')
        .replace(/{{current_balance}}/g, caseData.current_balance?.toLocaleString() || '');
    };

    if (selected.type === 'sms') {
      setSmsData({ message: replacePlaceholders(selected.body) });
    } else if (selected.type === 'email') {
      setEmailData({
        subject: replacePlaceholders(selected.subject),
        message: replacePlaceholders(selected.body)
      });
    }
  };

  const handleSendSMS = async () => {
    if (!debtorPhone || !smsData.message) {
      toast.error("Phone number and message are required");
      return;
    }

    setIsSending(true);
    try {
      const { data } = await sendSMS({
        caseId: caseData.id,
        phoneNumber: debtorPhone,
        message: smsData.message
      });

      if (data.success) {
        toast.success(`SMS sent to ${data.phone_used || debtorPhone}! Check delivery status in logs.`);
        setSmsData({ message: '' });
      } else {
        let errorMessage = "Failed to send SMS.";
        if (data.error) {
          try {
            const jsonStringMatch = data.error.match(/({.*})/);
            if (jsonStringMatch && jsonStringMatch[1]) {
              const errorDetails = JSON.parse(jsonStringMatch[1]);
              errorMessage = `API Error (${errorDetails.status || 'unknown'}): ${errorDetails.message || data.error}`;
            } else {
              errorMessage = data.error;
            }
          } catch (e) {
            errorMessage = data.error;
          }
        }
        toast.error(errorMessage);
        console.error('SMS Error Details:', data);
      }
    } catch (error) {
      console.error('SMS error:', error);
      toast.error(`Error sending SMS: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!debtorEmail || !emailData.subject || !emailData.message) {
      toast.error("Email, subject, and message are required");
      return;
    }

    setIsSending(true);
    try {
      const { data } = await sendEmail({
        caseId: caseData.id,
        email: debtorEmail,
        subject: emailData.subject,
        message: emailData.message
      });

      if (data.success) {
        toast.success("Email sent successfully!");
        setEmailData({ subject: '', message: '' });
      } else {
        toast.error(`Failed to send email: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Email error:', error);
      const errorMessage = error.response?.data?.error || "An unexpected error occurred while sending the email.";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!caseData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a debt to send communications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Send Communication
        </CardTitle>
        <p className="text-sm text-gray-600">{debtorName}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sms" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <div className="space-y-2">
            <Label>Use Template</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.local.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Local Templates</SelectLabel>
                    {templates.local.map(t => (
                      <SelectItem key={`local-${t.id}`} value={`local-${t.id}`}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {templates.ccai.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>CloudContactAI Templates</SelectLabel>
                    {templates.ccai.map(t => (
                      <SelectItem key={`ccai-${t.id}`} value={`ccai-${t.id}`}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {templates.local.length === 0 && templates.ccai.length === 0 && (
                  <div className="py-2 px-3 text-sm text-gray-500">No templates available</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={debtorPhone || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={smsData.message}
                  onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                  className="min-h-24"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {smsData.message.length}/160 characters
                </p>
              </div>
              <Button
                onClick={handleSendSMS}
                disabled={isSending || !debtorPhone || !smsData.message}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send SMS
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Email Address</Label>
                <Input
                  value={debtorEmail || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  className="min-h-32"
                />
              </div>
              <Button
                onClick={handleSendEmail}
                disabled={isSending || !debtorEmail || !emailData.subject || !emailData.message}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Email
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full mt-4">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}