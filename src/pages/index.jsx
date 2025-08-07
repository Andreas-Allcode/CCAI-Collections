import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Portfolios from "./Portfolios";

import PortfolioDetails from "./PortfolioDetails";

import PortfolioImport from "./PortfolioImport";

import Communications from "./Communications";

import Payments from "./Payments";

import Reports from "./Reports";

import Settings from "./Settings";

import Pay from "./Pay";

import Campaigns from "./Campaigns";

import NewCampaign from "./NewCampaign";

import TestAPI from "./TestAPI";

import Vendors from "./Vendors";

import VendorImport from "./VendorImport";

import Integrations from "./Integrations";

import Legal from "./Legal";

import Debts from "./Debts";

import NewDebt from "./NewDebt";

import DebtorDetails from "./DebtorDetails";

import PaymentPortal from "./PaymentPortal";

import NewTemplate from "./NewTemplate";

import DebtImport from "./DebtImport";

import TestActivityLog from "./TestActivityLog";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Portfolios: Portfolios,
    
    PortfolioDetails: PortfolioDetails,
    
    PortfolioImport: PortfolioImport,
    
    Communications: Communications,
    
    Payments: Payments,
    
    Reports: Reports,
    
    Settings: Settings,
    
    Pay: Pay,
    
    Campaigns: Campaigns,
    
    NewCampaign: NewCampaign,
    
    TestAPI: TestAPI,
    
    Vendors: Vendors,
    
    VendorImport: VendorImport,
    
    Integrations: Integrations,
    
    Legal: Legal,
    
    Debts: Debts,
    
    NewDebt: NewDebt,
    
    DebtorDetails: DebtorDetails,
    
    PaymentPortal: PaymentPortal,
    
    NewTemplate: NewTemplate,
    
    DebtImport: DebtImport,
    
    TestActivityLog: TestActivityLog,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Portfolios" element={<Portfolios />} />
                
                <Route path="/PortfolioDetails" element={<PortfolioDetails />} />
                
                <Route path="/PortfolioImport" element={<PortfolioImport />} />
                
                <Route path="/Communications" element={<Communications />} />
                
                <Route path="/Payments" element={<Payments />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Pay" element={<Pay />} />
                
                <Route path="/Campaigns" element={<Campaigns />} />
                
                <Route path="/NewCampaign" element={<NewCampaign />} />
                
                <Route path="/TestAPI" element={<TestAPI />} />
                
                <Route path="/Vendors" element={<Vendors />} />
                
                <Route path="/VendorImport" element={<VendorImport />} />
                
                <Route path="/Integrations" element={<Integrations />} />
                
                <Route path="/Legal" element={<Legal />} />
                
                <Route path="/Debts" element={<Debts />} />
                
                <Route path="/NewDebt" element={<NewDebt />} />
                
                <Route path="/DebtorDetails" element={<DebtorDetails />} />
                
                <Route path="/PaymentPortal" element={<PaymentPortal />} />
                
                <Route path="/NewTemplate" element={<NewTemplate />} />
                
                <Route path="/DebtImport" element={<DebtImport />} />
                
                <Route path="/TestActivityLog" element={<TestActivityLog />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}