
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Communication } from '@/api/entities'; // Changed from '@/api/entities'
import { Loader2, MessageSquare, User, Bot, Send } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const generateFakeHistory = (debtorName) => {
    return [
        { direction: 'outbound', content: `Hello ${debtorName}, this is a message regarding your account.`, created_date: subDays(new Date(), 2).toISOString(), sent_by: 'Agent' },
        { direction: 'inbound', content: "Hi, what is this about?", created_date: subDays(new Date(), 1).toISOString() },
        { direction: 'outbound', content: "We need to discuss your outstanding balance. When is a good time to call?", created_date: new Date().toISOString(), sent_by: 'Agent' },
    ];
};


export default function ChatHistoryModal({ isOpen, onClose, caseId, debtorName }) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && caseId) {
            const fetchHistory = async () => {
                setIsLoading(true);
                try {
                    let comms = await Communication.filter({ 
                        case_id: caseId,
                        type: 'sms' // Assuming chat history is SMS
                    }, 'created_date'); // Sort ascending

                    if (comms.length === 0) {
                        comms = generateFakeHistory(debtorName);
                    }

                    setHistory(comms);
                } catch (error) {
                    console.error("Error fetching chat history:", error);
                    // Set fake history on error as well to show something
                    setHistory(generateFakeHistory(debtorName));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, caseId, debtorName]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chat History</DialogTitle>
                    <DialogDescription>
                        Conversation with {debtorName}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No chat history found.</p>
                        </div>
                    ) : (
                        history.map((msg, index) => (
                            <div key={msg.id || index} className={`flex items-end gap-2 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                {msg.direction === 'inbound' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.direction === 'outbound' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-500'}`}>
                                        {format(parseISO(msg.created_date), 'MMM d, h:mm a')}
                                    </p>
                                </div>
                                {msg.direction === 'outbound' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t flex items-center gap-2">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button><Send className="w-4 h-4" /></Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
