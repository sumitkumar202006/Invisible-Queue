import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Users, Building2, Languages, Clock } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('citizen')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Invisible Queue</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                  {lang === 'hi' ? 'अदृश्य कतार' : 'Civic Alpha'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Predictive crowd intelligence for public services</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* View Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
              <button
                onClick={() => setActiveTab('citizen')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'citizen'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('citizen_portal')}</span>
              </button>

              <button
                onClick={() => setActiveTab('org')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'org'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{t('org_portal')}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium"
              title="Toggle English / Hindi"
            >
              <Languages className="w-4 h-4 text-blue-600" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
