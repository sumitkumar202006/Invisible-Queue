import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import MaintenanceBanner from './components/MaintenanceBanner';
import CitizenHome from './pages/citizen/CitizenHome';
import OrgDashboard from './pages/org/OrgDashboard';
import { Info, ShieldCheck } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('citizen');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <MaintenanceBanner />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {activeTab === 'citizen' ? (
          <CitizenHome />
        ) : (
          <OrgDashboard />
        )}
      </main>

      {/* Trust & Transparency Civic Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>Invisible Queue (अदृश्य कतार)</strong> — Civic Decision-Support Platform
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-center sm:text-right">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Real-time predictions calculated via Weighted Multi-Source Baseline (WMSB v1). No fabricated data.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
