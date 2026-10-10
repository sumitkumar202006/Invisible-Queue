import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Wrench, Sparkles } from 'lucide-react';

export default function MaintenanceBanner() {
  const { lang, t } = useLanguage();

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b border-amber-600 shadow-xs relative z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 bg-amber-600/30 rounded-md flex-shrink-0">
            <Wrench className="w-4 h-4 text-slate-950 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wide mr-2 bg-amber-600/30 px-2 py-0.5 rounded text-[11px]">
              {lang === 'hi' ? 'रखरखाव सूचना' : 'Under Maintenance'}
            </span>
            <span>
              {lang === 'hi'
                ? 'यह वेबसाइट वर्तमान में रखरखाव और सिस्टम सुधार के अंतर्गत है। हमारी टीम इस पर तत्परता से कार्य कर रही है।'
                : 'This website is currently under active maintenance. Our engineering team is thoroughly working on system enhancements.'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-1.5 text-xs font-bold text-amber-950/80 bg-amber-400/60 px-2.5 py-1 rounded-full border border-amber-600/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Engineering Sprint</span>
        </div>
      </div>
    </div>
  );
}
