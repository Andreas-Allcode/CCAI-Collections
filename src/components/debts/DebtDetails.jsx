import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Scale, // Used for legal/bankruptcy
  UserX, // Used for deceased
  MessageCircle,
  Send,
  Clock,
  ChevronDown,
  Link as LinkIcon,
  Copy,
  Loader2,
  Briefcase
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import ChatHistoryModal from "./ChatHistoryModal";
import OutboundMessagesModal from "./OutboundMessagesModal";
import ActivityLogModal from "./ActivityLogModal";
import usePermissions from '@/components/hooks/usePermissions';
import { generateDocument } from '@/api/functions';
import { Template } from '@/api/entities';
import { DebtorPortalSession } from '@/api/entities';
import { Case } from '@/api/entities';
import { toast } from 'sonner';

// Helper function to create page URLs. In a real app, this would likely be
// imported from a routing utility or context.
const createPageUrl = (path) => {
  return `/${path}`;
};

const caseStatuses = ["new", "in_collection", "payment_plan", "paid", "settled", "legal_action", "credit_reporting", "uncollectible", "disputed", "deceased", "bankruptcy", "military", "buyback"];

export default function DebtDetails({ selectedCase, portfolios, debtor, lawFirms = [], getStatusColor, onStatusUpdate }) {
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showOutboundMessages, setShowOutboundMessages] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [portalLink, setPortalLink] = useState(null);
  const { canEdit, isAdmin } = usePermissions();

  React.useEffect(() => {
    const fetchTemplates = async () => {
        try {
            const allTemplates = await Template.list();
            setLetterTemplates(allTemplates.filter(t => t.type === 'letter'));
        } catch (error) {
            console.error("Failed to fetch letter templates", error);
        }
    };
    fetchTemplates();
  }, []);

  React.useEffect(() => {
    // Reset portal link when selected case changes
    setPortalLink(null);
  }, [selectedCase]);

  if (!selectedCase) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a debt to view details</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleGenerateDocument = async (templateId) => {
    setIsGeneratingDoc(true);
    try {
        const { data, headers } = await generateDocument({ templateId: templateId, caseId: selectedCase.id });
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const contentDisposition = headers['content-disposition'];
        let filename = 'document.pdf';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch.length > 1) {
                filename = filenameMatch[1];
            }
        }
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("Document generated successfully!");
    } catch (error) {
        console.error("Error generating document:", error);
        const serverError = error.response?.data?.error;
        let displayError = "Failed to generate document.";
        if (serverError && typeof serverError === 'string' && serverError.toLowerCase().includes('rate limit')) {
            displayError = "Rate limit exceeded. Please wait a moment before trying again.";
        } else if (serverError) {
            displayError = `Error: ${serverError}`;
        }
        toast.error(displayError);
    } finally {
        setTimeout(() => setIsGeneratingDoc(false), 200); // Add a small delay for UI
    }
  };

  const handleGeneratePortalLink = async () => {
    setPortalLink({ loading: true, url: null });
    try {
      const accessToken = `tok_${selectedCase.id}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await DebtorPortalSession.create({
        case_id: selectedCase.id,
        access_token: accessToken,
        expires_at: expiresAt.toISOString(),
        is_active: true
      });
      
      const url = `${window.location.origin}${createPageUrl(`PaymentPortal?token=${accessToken}`)}`;
      setPortalLink({ loading: false, url: url });
      toast.success("Portal link generated successfully!");
    } catch (error) {
      console.error("Error generating portal link", error);
      toast.error("Failed to generate portal link.");
      setPortalLink(null);
    }
  };

  const handlePortfolioChange = async (newPortfolioId) => {
    if (!isAdmin) {
      toast.error("Only administrators can change portfolios.");
      return;
    }
    try {
      await Case.update(selectedCase.id, { portfolio_id: newPortfolioId });
      toast.success("Portfolio reassigned successfully! Refreshing data...");
      // A full status update will be triggered from the parent, which will reload case details.
      onStatusUpdate(selectedCase.id, selectedCase.status);
    } catch (error) {
      console.error("Error reassigning portfolio:", error);
      toast.error("Failed to reassign portfolio.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info("Link copied to clipboard!");
  };

  const debtorName = debtor?.name || selectedCase.debtor_name;
  const debtorEmail = debtor?.email || selectedCase.debtor_email;
  const debtorPhone = debtor?.phone || selectedCase.debtor_phone;
  const debtorAddress = debtor?.address || selectedCase.debtor_address;

  const getPortfolioName = (portfolioId) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    return portfolio?.name || 'Unknown Portfolio';
  };

  const getBankruptcyStatus = () => {
    if (selectedCase.status !== 'bankruptcy' || !selectedCase.bankruptcy_details) {
      return null;
    }
    const { status, close_date } = selectedCase.bankruptcy_details;
    if (status === 'filed' && close_date && isPast(new Date(close_date))) {
      return 'Discharged';
    }
    return status;
  };

  const getCaseAge = () => {
    if (!selectedCase.charge_off_date) return null;

    const chargeOffDate = new Date(selectedCase.charge_off_date);
    const today = new Date();
    const daysOld = differenceInDays(today, chargeOffDate);

    return daysOld;
  };

  const getAgeColor = (days) => {
    if (days <= 60) return "bg-green-100 text-green-800 border-green-200";
    if (days <= 90) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (days <= 120) return "bg-orange-100 text-orange-800 border-orange-200";
    if (days <= 150) return "bg-red-100 text-red-800 border-red-200";
    return "bg-red-200 text-red-900 border-red-300";
  };

  const getAssignedAttorneyName = () => {
    if (!selectedCase.legal_details?.assigned_counsel_id || !lawFirms) return "Not Assigned";
    const attorney = lawFirms.find(firm => firm.id === selectedCase.legal_details.assigned_counsel_id);
    return attorney?.name || "Unknown Law Firm";
  }

  const caseAge = getCaseAge();

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-blue-600" />
            Debt Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-start"> {/* Modified section header */}
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">{debtorName}</h3>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Debtor Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Name</p>
                      <p className="text-gray-900">{debtorName}</p>
                    </div>
                    {debtorEmail && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-gray-900">{debtorEmail}</p>
                      </div>
                    )}
                    {debtorPhone && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-gray-900">{debtorPhone}</p>
                      </div>
                    )}
                    {debtorAddress && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-gray-900">{debtorAddress}</p>
                      </div>
                    )}
                    {debtor?.created_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Created</p>
                        <p className="text-gray-900">{format(new Date(debtor.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-sm text-gray-500">Account: {selectedCase.account_number}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`h-auto py-0.5 px-2 text-sm border ${getStatusColor(selectedCase.status)} hover:opacity-90`} disabled={!canEdit}>
                  <span className="capitalize">{selectedCase.status?.replace(/_/g, ' ')}</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {caseStatuses.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onSelect={() => onStatusUpdate(selectedCase.id, status)}
                    disabled={selectedCase.status === status}
                    className="capitalize"
                  >
                    {status.replace(/_/g, ' ')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">
              {selectedCase.priority} priority
            </Badge>
            {caseAge !== null && (
              <Badge className={`border ${getAgeColor(caseAge)} flex items-center gap-1`}>
                <Clock className="w-3 h-3" />
                {caseAge} days old
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            {debtorEmail && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{debtorEmail}</span>
              </div>
            )}
            {debtorPhone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{debtorPhone}</span>
              </div>
            )}
            {debtorAddress && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{debtorAddress}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Financial Details</h4>
            {selectedCase.original_creditor && (
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Original Creditor</p>
                    <p className="font-medium text-gray-800">{selectedCase.original_creditor}</p>
                    {selectedCase.original_creditor_address && (
                        <p className="text-gray-600">{selectedCase.original_creditor_address}</p>
                    )}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Current Balance</p>
                <p className="text-lg font-semibold text-red-600">
                  ${selectedCase.current_balance?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Original Balance</p>
                <p className="text-sm font-medium text-gray-900">
                  ${selectedCase.original_balance?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            {selectedCase.settlement_offer && (
              <div>
                <p className="text-xs text-gray-500">Settlement Offer</p>
                <p className="text-sm font-medium text-green-600">
                  ${selectedCase.settlement_offer.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {caseAge !== null && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Debt Timeline</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Days Since Charge Off</p>
                    <p className="text-xs text-gray-500">
                      {selectedCase.charge_off_date && format(new Date(selectedCase.charge_off_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge className={`border ${getAgeColor(caseAge)} text-lg px-3 py-1`}>
                    {caseAge} days
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Fresh (0-60)</span>
                    <span>Aging (61-90)</span>
                    <span>Stale (91-120)</span>
                    <span>Critical (121-150)</span>
                    <span>Urgent (150+)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500"></div>
                  </div>
                  <div className="mt-1 text-center">
                    <div
                      className="w-3 h-3 bg-gray-800 rounded-full mx-auto transform -translate-y-1"
                      style={{
                        marginLeft: `${Math.min((caseAge / 180) * 100, 100)}%`,
                        transform: 'translateX(-50%) translateY(-4px)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCase.status === 'legal_action' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-red-700"/>
                  Legal Information
              </h4>
              <Card className="bg-red-50 border-red-200 p-4">
                <CardContent className="space-y-3 p-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-800">Assigned Attorney</p>
                    <p className="text-sm font-medium text-red-900">{getAssignedAttorneyName()}</p>
                  </div>
                   {selectedCase.legal_details?.legal_status && (
                     <div className="flex items-center justify-between">
                       <p className="text-sm text-red-800">Legal Status</p>
                       <Badge variant="secondary" className="bg-red-200 text-red-800 capitalize">
                         {selectedCase.legal_details.legal_status.replace('_', ' ')}
                       </Badge>
                     </div>
                   )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedCase.status === 'bankruptcy' && selectedCase.bankruptcy_details && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-pink-700"/>
                  Bankruptcy Information
              </h4>
              <Card className="bg-pink-50 border-pink-200 p-4">
                <CardContent className="space-y-3 p-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-pink-800">Chapter</p>
                    <Badge variant="secondary" className="bg-pink-200 text-pink-800">{selectedCase.bankruptcy_details.chapter}</Badge>
                  </div>
                  {selectedCase.bankruptcy_details.filing_date &&
                      <div className="flex items-center justify-between">
                          <p className="text-sm text-pink-800">Filing Date</p>
                          <p className="text-sm font-medium text-pink-900">{format(new Date(selectedCase.bankruptcy_details.filing_date), 'MMM d, yyyy')}</p>
                      </div>
                  }
                  {selectedCase.bankruptcy_details.close_date &&
                      <div className="flex items-center justify-between">
                          <p className="text-sm text-pink-800">Close Date</p>
                          <p className="text-sm font-medium text-pink-900">{format(new Date(selectedCase.bankruptcy_details.close_date), 'MMM d, yyyy')}</p>
                      </div>
                  }
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-pink-800">Case Number</p>
                    <p className="text-sm font-medium text-pink-900">{selectedCase.bankruptcy_details.case_number}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-pink-800">Court</p>
                    <p className="text-sm font-medium text-pink-900">{selectedCase.bankruptcy_details.court}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-pink-800">Status</p>
                    <p className="text-sm font-medium text-pink-900 capitalize">{getBankruptcyStatus()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedCase.status === 'deceased' && selectedCase.deceased_details && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-slate-700"/>
                  Deceased Information
              </h4>
              <Card className="bg-slate-50 border-slate-200 p-4">
                <CardContent className="space-y-3 p-0">
                  {selectedCase.deceased_details.date_of_death &&
                      <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-800">Date of Death</p>
                          <p className="text-sm font-medium text-slate-900">{format(new Date(selectedCase.deceased_details.date_of_death), 'MMM d, yyyy')}</p>
                      </div>
                  }
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-800">Source</p>
                    <p className="text-sm font-medium text-slate-900">{selectedCase.deceased_details.source}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-800">Verified</p>
                    <Badge variant="secondary" className={selectedCase.deceased_details.verified ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}>
                      {selectedCase.deceased_details.verified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Portfolio</h4>
            {isAdmin ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>{getPortfolioName(selectedCase.portfolio_id)}</span>
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {portfolios.map(p => (
                            <DropdownMenuItem 
                                key={p.id}
                                onSelect={() => handlePortfolioChange(p.id)}
                                disabled={p.id === selectedCase.portfolio_id}
                            >
                                {p.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{getPortfolioName(selectedCase.portfolio_id)}</p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Important Dates</h4>
            {selectedCase.charge_off_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Charge Off</p>
                  <p className="text-sm">{format(new Date(selectedCase.charge_off_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {selectedCase.last_payment_date && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Last Payment</p>
                  <p className="text-sm">{format(new Date(selectedCase.last_payment_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {selectedCase.notes && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {selectedCase.notes}
              </p>
            </div>
          )}

          {/* New combined section for communication and document generation */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-gray-900">Communication & Tools</h4> {/* Updated heading */}
            <div className="flex gap-2"> {/* New flex container for these two buttons */}
              <Button variant="outline" size="sm" onClick={() => setShowActivityLog(true)} className="flex-1">
                <Clock className="w-4 h-4 mr-2" /> Activity Log
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleGeneratePortalLink} disabled={portalLink?.loading} className="flex-1">
                  {portalLink?.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                  Generate Portal Link
                </Button>
              )}
            </div>

            {portalLink && !portalLink.loading && portalLink.url && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800">Secure Debtor Portal Link:</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Input value={portalLink.url} readOnly className="text-xs h-8"/>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(portalLink.url)}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Preserved Chat History & Outbound Messages */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                onClick={() => setShowChatHistory(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat History
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                onClick={() => setShowOutboundMessages(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Outbound Messages
              </Button>
            </div>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full" disabled={isGeneratingDoc}>
                    {isGeneratingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    Generate Document
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]"> {/* Corrected width syntax */}
                  {letterTemplates.map(template => (
                      <DropdownMenuItem
                          key={template.id}
                          onSelect={() => handleGenerateDocument(template.id)}
                          disabled={isGeneratingDoc}
                      >
                          {template.name}
                      </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {canEdit && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Actions</h4>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Phone className="w-4 h-4 mr-2" />
                Contact Debtor
              </Button>
              <Button 
                variant="outline" 
                className="w-full hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                onClick={() => {
                  const note = prompt('Enter a note for this case:');
                  if (note) {
                    toast.success('Note added successfully!');
                    console.log('Note added:', note);
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityLogModal
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        caseId={selectedCase.id}
        debtorName={debtorName}
      />

      <ChatHistoryModal
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        caseId={selectedCase.id}
        debtorName={debtorName}
      />

      <OutboundMessagesModal
        isOpen={showOutboundMessages}
        onClose={() => setShowOutboundMessages(false)}
        caseId={selectedCase.id}
        debtorName={debtorName}
      />
    </>
  );
}