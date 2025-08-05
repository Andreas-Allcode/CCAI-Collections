
import React, { useState, useEffect } from 'react';
import { Case, Vendor } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Scale } from 'lucide-react';
import DebtTable from '../components/debts/DebtTable'; // Changed from CaseTable
import LegalDetailsPanel from '../components/legal/LegalDetailsPanel';

export default function Legal() {
  const [legalCases, setLegalCases] = useState([]);
  const [lawFirms, setLawFirms] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLegalData();
  }, []);

  const loadLegalData = async () => {
    setIsLoading(true);
    try {
      const [casesRes, vendorsRes] = await Promise.all([
        Case.filter({ status: 'legal_action' }),
        Vendor.filter({ type: 'law_firm' }),
      ]);
      const cases = casesRes || [];
      const vendors = vendorsRes || [];
      setLegalCases(cases);
      setLawFirms(vendors);
      if (cases.length > 0) {
        setSelectedCase(cases[0]);
      }
    } catch (error) {
      console.error("Error loading legal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseUpdate = (updatedCase) => {
    setLegalCases(prev => prev.map(c => (c.id === updatedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
  };
  
  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-50 text-blue-700 border-blue-200",
      in_collection: "bg-yellow-50 text-yellow-700 border-yellow-200",
      payment_plan: "bg-purple-50 text-purple-700 border-purple-200",
      paid: "bg-green-50 text-green-700 border-green-200",
      settled: "bg-indigo-50 text-indigo-700 border-indigo-200",
      legal_action: "bg-red-50 text-red-700 border-red-200",
      credit_reporting: "bg-orange-50 text-orange-700 border-orange-200",
      uncollectible: "bg-gray-50 text-gray-700 border-gray-200",
      disputed: "bg-orange-50 text-orange-700 border-orange-200",
      deceased: "bg-slate-50 text-slate-700 border-slate-200",
      bankruptcy: "bg-pink-50 text-pink-700 border-pink-200",
      military: "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
    return colors[status] || colors.new;
  };

  return (
    <div className="flex h-full bg-gray-50/50">
      <div className={`transition-all duration-300 ${selectedCase ? 'w-2/3' : 'w-full'} overflow-y-auto`}>
        <div className="p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Legal Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage debts assigned for legal action.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 mr-4">
                            <Scale className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Legal Debts</p>
                            <p className="text-2xl font-bold text-gray-900">{legalCases.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 mr-4">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Partner Law Firms</p>
                            <p className="text-2xl font-bold text-gray-900">{lawFirms.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Legal Debt Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <DebtTable
                cases={legalCases}
                portfolios={[]}
                isLoading={isLoading}
                onCaseSelect={setSelectedCase}
                selectedCaseId={selectedCase?.id}
                getStatusColor={getStatusColor}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedCase && (
        <div className="w-1/3 p-6 border-l overflow-y-auto bg-white">
          <LegalDetailsPanel
            caseData={selectedCase}
            lawFirms={lawFirms}
            onUpdate={handleCaseUpdate}
            onClose={() => setSelectedCase(null)}
          />
        </div>
      )}
    </div>
  );
}
