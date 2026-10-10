import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitCrowdReport } from '../services/api';
import { X, Send, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, serviceId, serviceName, onReportSubmitted }) {
  const { t } = useLanguage();
  const [crowdLevel, setCrowdLevel] = useState('moderate');
  const [waitMin, setWaitMin] = useState(45);
  const [includeWait, setIncludeWait] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const tiers = [
    { id: 'low', label: t('tier_low'), desc: '< 30 min wait', color: 'border-emerald-500 hover:bg-emerald-50 text-emerald-800' },
    { id: 'moderate', label: t('tier_moderate'), desc: '30 - 60 min wait', color: 'border-amber-500 hover:bg-amber-50 text-amber-800' },
    { id: 'high', label: t('tier_high'), desc: '1 - 2 hrs wait', color: 'border-orange-500 hover:bg-orange-50 text-orange-800' },
    { id: 'very_high', label: t('tier_very_high'), desc: '> 2 hrs wait', color: 'border-red-500 hover:bg-red-50 text-red-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await submitCrowdReport(serviceId, {
        crowdLevel,
        estimatedWaitMin: includeWait ? parseInt(waitMin, 10) : undefined
      });
      setFeedback(res.data?.impact);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('report_modal_title')}</h3>
            <p className="text-xs text-slate-500">{serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Feedback View */}
        {feedback ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{t('report_success')}</h4>
              <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                {feedback.note}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Updated Wait Estimate:</span>
                <span className="font-bold text-slate-900">{feedback.updated_estimate_min} mins</span>
              </div>
              <div className="flex justify-between">
                <span>Updated Confidence:</span>
                <span className="font-bold text-emerald-700">{feedback.updated_confidence_score}/100</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <p className="text-xs text-slate-600">
              {t('report_modal_desc')}
            </p>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Crowd Level Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('crowd_prompt')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {tiers.map(t => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setCrowdLevel(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      crowdLevel === t.id
                        ? `${t.color} bg-slate-50 ring-2 ring-blue-500 font-semibold shadow-xs`
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Specific Minutes */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  {t('wait_prompt')}
                </label>
                <input
                  type="checkbox"
                  id="includeWait"
                  checked={includeWait}
                  onChange={(e) => setIncludeWait(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {includeWait && (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>15 min</span>
                    <span className="font-bold text-blue-700">{waitMin} minutes</span>
                    <span>180 min</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="5"
                    value={waitMin}
                    onChange={(e) => setWaitMin(e.target.value)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Privacy note */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>No personal data collected. Anonymous device token used solely for rate-limit protection.</span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
              >
                {submitting ? (
                  <span>{t('submitting')}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t('submit_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
