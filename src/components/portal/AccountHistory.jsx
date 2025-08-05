import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { DollarSign, Mail, MessageSquare, Phone } from 'lucide-react';

const TimelineItem = ({ icon, title, date, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {icon}
        </div>
        <div className="flex-grow border-b pb-4">
            <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold text-gray-800">{title}</h4>
                <p className="text-xs text-gray-500">{format(date, 'MMM d, yyyy')}</p>
            </div>
            {children}
        </div>
    </div>
);

export default function AccountHistory({ payments, communications, caseData }) {
    const combinedHistory = [
        ...(payments || []).map(p => ({ type: 'payment', ...p, date: p.payment_date })),
        ...(communications || []).map(c => ({ type: 'communication', ...c, date: c.sent_date }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getIcon = (item) => {
        if (item.type === 'payment') return <DollarSign className="w-5 h-5 text-green-600" />;
        if (item.type === 'email') return <Mail className="w-5 h-5 text-blue-600" />;
        if (item.type === 'sms') return <MessageSquare className="w-5 h-5 text-purple-600" />;
        if (item.type === 'call') return <Phone className="w-5 h-5 text-orange-600" />;
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account History</CardTitle>
                <CardDescription>
                    A log of all payments and communications for account #{caseData?.account_number}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-6 pr-4">
                        {combinedHistory.map((item, index) => (
                            <TimelineItem 
                                key={index} 
                                icon={getIcon(item)}
                                title={item.type === 'payment' ? `Payment Received` : `Outbound ${item.type}`}
                                date={new Date(item.date)}
                            >
                                {item.type === 'payment' ? (
                                    <p>Amount: <span className="font-semibold text-green-600">${item.amount.toLocaleString()}</span> via {item.payment_method.replace('_', ' ')}</p>
                                ) : (
                                    <>
                                        {item.subject && <p className="font-semibold">{item.subject}</p>}
                                        <p className="text-sm text-gray-600 truncate">{item.content}</p>
                                    </>
                                )}
                            </TimelineItem>
                        ))}
                        {combinedHistory.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No history to display.</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}