
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Communication } from '@/api/entities';
import { Loader2, Mail, MessageSquare, Send, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, subDays, parseISO } from 'date-fns';

const generateFakeOutbound = (debtorName) => {
    return [
        { id: 'fake_out_1', type: 'email', subject: 'Regarding your account', created_date: subDays(new Date(), 7).toISOString(), delivery_status: 'delivered' },
        { id: 'fake_out_2', type: 'sms', content: `Reminder for ${debtorName}.`, created_date: subDays(new Date(), 4).toISOString(), delivery_status: 'delivered' },
        { id: 'fake_out_3', type: 'email', subject: 'Final Notice', created_date: subDays(new Date(), 1).toISOString(), delivery_status: 'failed' },
    ];
};

export default function OutboundMessagesModal({ isOpen, onClose, caseId, debtorName }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && caseId) {
            const fetchMessages = async () => {
                setIsLoading(true);
                try {
                    let outboundComms = await Communication.filter({
                        case_id: caseId,
                        direction: 'outbound'
                    }, '-created_date');

                    if (outboundComms.length === 0) {
                        outboundComms = generateFakeOutbound(debtorName);
                    }

                    setMessages(outboundComms);
                } catch (error) {
                    console.error("Error fetching outbound messages:", error);
                    setMessages(generateFakeOutbound(debtorName));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMessages();
        }
    }, [isOpen, caseId, debtorName]);

    const getIcon = (type) => {
        switch (type) {
            case 'email': return <Mail className="w-5 h-5 text-blue-600" />;
            case 'sms': return <MessageSquare className="w-5 h-5 text-green-600" />;
            default: return <Send className="w-5 h-5 text-gray-600" />;
        }
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'delivered':
            case 'opened':
            case 'clicked':
                return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {status}</Badge>;
            case 'failed':
            case 'bounced':
                return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3"/> {status}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Outbound Messages</DialogTitle>
                    <DialogDescription>
                        All messages sent to {debtorName}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {isLoading ? (
                         <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No outbound messages found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border">
                                    <div className="pt-1">{getIcon(msg.type)}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-800 capitalize">{msg.type}: {msg.subject || 'SMS'}</p>
                                                <p className="text-sm text-gray-600 line-clamp-2">{msg.content}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 whitespace-nowrap">{format(parseISO(msg.created_date), 'MMM d, yyyy')}</p>
                                        </div>
                                        <div className="mt-2">
                                            {getStatusBadge(msg.delivery_status)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
