import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

export default function FailedVisitWarning({ warning }) {
  const { t } = useLanguage();

  if (!warning || !warning.has_warning) return null;

  const isClosed = warning.type === 'facility_closed';
  const isCritical = warning.severity === 'very_high' || isClosed;

  const bannerStyles = isCritical
    ? 'bg-red-50 border-red-300 text-red-900'
    : 'bg-amber-50 border-amber-300 text-amber-900';

  const iconStyles = isCritical ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={`border rounded-xl p-4 transition-all shadow-xs ${bannerStyles}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {isClosed ? (
            <XCircle className={`w-5 h-5 ${iconStyles}`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${iconStyles}`} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold uppercase tracking-wide">
              {t('warning_title')}
            </h4>
            {warning.close_time && (
              <span className="text-xs bg-white/80 px-2 py-0.5 rounded border border-current font-medium">
                Closes: {warning.close_time}
              </span>
            )}
          </div>
          <p className="text-sm mt-1 leading-snug font-medium">
            {warning.message}
          </p>
        </div>
      </div>
    </div>
  );
}
