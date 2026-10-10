import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CrowdBadge({ level, size = 'md' }) {
  const { t } = useLanguage();

  const configs = {
    low: {
      label: t('tier_low'),
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    moderate: {
      label: t('tier_moderate'),
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500'
    },
    high: {
      label: t('tier_high'),
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      dot: 'bg-orange-500'
    },
    very_high: {
      label: t('tier_very_high'),
      bg: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-600'
    }
  };

  const current = configs[level?.toLowerCase()] || configs.moderate;
  const sizeClasses = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-full font-semibold border ${current.bg} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot} animate-pulse`} />
      <span>{current.label}</span>
    </span>
  );
}
