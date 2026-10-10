import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CalendarClock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SmartPlannerCard({ recommendation }) {
  const { t } = useLanguage();

  if (!recommendation || !recommendation.has_recommendation) {
    return (
      <div className="card-civic bg-slate-50 border-slate-200 text-slate-600 text-sm italic">
        {recommendation?.message || 'Gathering historical traffic patterns for this counter...'}
      </div>
    );
  }

  const { recommended_window, expected_wait_min, explanation } = recommendation;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center space-x-2 mb-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
          {t('planner_title')}
        </h3>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-blue-200/60 pb-3">
        <div>
          <span className="text-xs text-blue-700 font-medium">{t('recommended_time')}</span>
          <div className="text-2xl font-extrabold text-blue-950 tracking-tight">
            {recommended_window}
          </div>
        </div>

        {expected_wait_min && (
          <div className="sm:text-right">
            <span className="text-xs text-blue-700 font-medium">Expected Wait</span>
            <div className="text-lg font-bold text-blue-900">
              ~{expected_wait_min} {t('minutes')}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start space-x-2 text-xs sm:text-sm text-blue-900/90 font-medium">
        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <span>{explanation}</span>
      </div>
    </div>
  );
}
