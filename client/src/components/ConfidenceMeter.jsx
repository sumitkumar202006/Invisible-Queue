import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function ConfidenceMeter({ confidence }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  if (!confidence) return null;

  const { score = 50, label = 'medium', factors = {}, explanation = '' } = confidence;

  const colorStyles = score >= 67
    ? { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' }
    : score >= 34
    ? { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' }
    : { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {t('confidence')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorStyles.bg} ${colorStyles.text}`}>
            {t(`conf_${label}`)} ({score}/100)
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1"
            title="Toggle scoring details"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorStyles.bar}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      <p className="text-xs text-slate-600 italic">
        {explanation}
      </p>

      {/* Expandable Breakdown Drawer */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5 animate-fadeIn">
          <div className="font-medium text-slate-800 mb-1">{t('confidence_explanation')}:</div>
          <div className="flex justify-between">
            <span>Recent Report Volume (max 35 pts):</span>
            <span className="font-semibold text-slate-800">{factors.volume_score ?? 0} pts</span>
          </div>
          <div className="flex justify-between">
            <span>Report Freshness Decay (max 25 pts):</span>
            <span className="font-semibold text-slate-800">{factors.recency_score ?? 0} pts</span>
          </div>
          <div className="flex justify-between">
            <span>Observer Consensus (max 20 pts):</span>
            <span className="font-semibold text-slate-800">{factors.agreement_score ?? 0} pts</span>
          </div>
          <div className="flex justify-between">
            <span>Historical Baseline Match (max 15 pts):</span>
            <span className="font-semibold text-slate-800">{factors.history_score ?? 0} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
