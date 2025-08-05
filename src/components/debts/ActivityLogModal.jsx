
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Communication } from '@/api/entities';
import { Payment } from '@/api/entities';
import { 
  Loader2, 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  DollarSign, 
  UserCheck, 
  Search,
  Filter,
  Calendar,
  Send,
  ArrowUpDown
} from 'lucide-react';
import { format, parseISO, subDays } from "date-fns";

const generateFakeCommunications = (caseId, debtorName) => {
    const commTypes = ['sms', 'email', 'call'];
    const directions = ['inbound', 'outbound'];
    const messages = [
        "Hello, I'm calling about my account.",
        "This is a reminder about your outstanding balance.",
        "Please provide an update on your payment status.",
        `Hi ${debtorName}, we need to discuss account ${caseId ? caseId.slice(0, 8) : 'N/A'}.`
    ];
    let fakeComms = [];
    for (let i = 1; i <= 3; i++) {
        const type = commTypes[i % 3];
        const direction = directions[i % 2];
        fakeComms.push({
            id: `fake_comm_${i}`,
            case_id: caseId,
            type: type,
            direction: direction,
            content: messages[i % 4],
            subject: type === 'email' ? 'Regarding your account' : null,
            created_date: subDays(new Date(), i * 3).toISOString(),
            delivery_status: 'delivered'
        });
    }
    return fakeComms;
};

const generateFakePayments = (caseId) => ([
    {
        id: 'fake_payment_1',
        case_id: caseId,
        amount: Math.floor(Math.random() * 200) + 50,
        payment_method: 'credit_card',
        payment_date: subDays(new Date(), 10).toISOString(),
        status: 'completed'
    }
]);

export default function ActivityLogModal({ isOpen, onClose, caseId, debtorName }) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  useEffect(() => {
    if (isOpen && caseId) {
      fetchActivityLog();
    }
  }, [isOpen, caseId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [activities, searchTerm, eventTypeFilter, sortOrder]);

  const fetchActivityLog = async () => {
    setIsLoading(true);
    try {
      let [communications, payments] = await Promise.all([
        Communication.filter({ case_id: caseId }, '-created_date'),
        Payment.filter({ case_id: caseId }, '-payment_date')
      ]);

      // Generate fake data if real data is empty
      if (communications.length === 0) {
        communications = generateFakeCommunications(caseId, debtorName);
      }
      if (payments.length === 0) {
        payments = generateFakePayments(caseId);
      }

      // Combine all activities with unified structure
      const allActivities = [
        ...communications.map(comm => ({
          id: `comm_${comm.id}`,
          type: 'communication',
          subType: comm.type,
          direction: comm.direction,
          timestamp: comm.created_date || comm.sent_date,
          title: getCommTitle(comm),
          description: comm.content || comm.subject,
          details: {
            subject: comm.subject,
            deliveryStatus: comm.delivery_status,
            sentBy: comm.sent_by,
            templateUsed: comm.template_used
          },
          icon: getIconForCommType(comm.type),
          color: comm.direction === 'outbound' ? 'blue' : 'green'
        })),
        ...payments.map(payment => ({
          id: `payment_${payment.id}`,
          type: 'payment',
          subType: payment.payment_method,
          timestamp: payment.payment_date,
          title: `Payment Received - $${payment.amount?.toLocaleString()}`,
          description: `${payment.payment_method?.replace('_', ' ')} payment`,
          details: {
            amount: payment.amount,
            method: payment.payment_method,
            status: payment.status,
            transactionId: payment.transaction_id,
            processedBy: payment.processed_by
          },
          icon: DollarSign,
          color: 'green'
        }))
      ];

      // Add mock status change events (in a real app, these would come from an audit log)
      const statusChanges = [
        {
          id: 'status_1',
          type: 'status_change',
          timestamp: subDays(new Date(), 5).toISOString(),
          title: 'Status Updated',
          description: 'Status changed to In Collection',
          details: {
            fromStatus: 'new',
            toStatus: 'in_collection',
            changedBy: 'system'
          },
          icon: UserCheck,
          color: 'purple'
        }
      ];

      allActivities.push(...statusChanges);
      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === eventTypeFilter);
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredActivities(filtered);
  };

  const getCommTitle = (comm) => {
    const typeMap = {
      sms: 'SMS Message',
      email: 'Email',
      call: 'Phone Call',
      letter: 'Letter'
    };
    const direction = comm.direction === 'outbound' ? 'Sent' : 'Received';
    return `${direction} ${typeMap[comm.type] || 'Communication'}`;
  };

  const getIconForCommType = (type) => {
    switch(type) {
      case 'sms': return MessageSquare;
      case 'email': return Mail;
      case 'call': return Phone;
      default: return FileText;
    }
  };

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity Log for {debtorName}</DialogTitle>
          <DialogDescription>
            Complete timeline of all events and interactions for this debt.
          </DialogDescription>
        </DialogHeader>
        
        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="communication">Communications</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="status_change">Status Changes</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity recorded for this debt.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-8">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[activity.color]} border-4 border-gray-50`}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {format(parseISO(activity.timestamp), 'MMM d, yyyy, h:mm a')}
                        </div>
                      </div>
                       <Badge variant="secondary" className="mt-2 capitalize">{activity.type.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
