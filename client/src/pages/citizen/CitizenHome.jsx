import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  fetchLocations,
  fetchServiceStatus,
  fetchServiceRecommendation
} from '../../services/api';
import CrowdBadge from '../../components/CrowdBadge';
import ConfidenceMeter from '../../components/ConfidenceMeter';
import FailedVisitWarning from '../../components/FailedVisitWarning';
import SmartPlannerCard from '../../components/SmartPlannerCard';
import ReportModal from '../../components/ReportModal';
import {
  Building2,
  Clock,
  RefreshCw,
  Users,
  Database,
  MapPin,
  CalendarCheck2,
  AlertCircle
} from 'lucide-react';

export default function CitizenHome() {
  const { t } = useLanguage();

  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [statusData, setStatusData] = useState(null);
  const [recommendationData, setRecommendationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Initial load: fetch locations
  useEffect(() => {
    async function loadLocations() {
      try {
        setLoading(true);
        const locs = await fetchLocations();
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLocationId(locs[0].id);
          if (locs[0].services?.length > 0) {
            setSelectedServiceId(locs[0].services[0].id);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, []);

  // When selected location changes, select its first service
  const handleLocationChange = (locId) => {
    setSelectedLocationId(locId);
    const loc = locations.find(l => l.id === locId);
    if (loc?.services?.length > 0) {
      setSelectedServiceId(loc.services[0].id);
    }
  };

  // Fetch status and recommendation whenever selectedServiceId changes
  const loadServiceDetails = async (isManual = false) => {
    if (!selectedServiceId) return;
    if (isManual) setRefreshing(true);

    try {
      const [statusRes, recRes] = await Promise.all([
        fetchServiceStatus(selectedServiceId),
        fetchServiceRecommendation(selectedServiceId)
      ]);
      setStatusData(statusRes);
      setRecommendationData(recRes.recommendation);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServiceDetails();

    // Auto-poll every 60 seconds
    const interval = setInterval(() => {
      loadServiceDetails();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedServiceId]);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const servicesList = selectedLocation?.services || [];
  const selectedService = servicesList.find(s => s.id === selectedServiceId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Intro Header */}
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('app_title')}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl font-normal">
          {t('tagline')}
        </p>
      </div>

      {/* Facility & Service Pickers */}
      <div className="card-civic space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{t('select_location')}</span>
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} — {loc.address}
              </option>
            ))}
          </select>
        </div>

        {/* Service buttons */}
        {servicesList.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <CalendarCheck2 className="w-4 h-4 text-blue-600" />
              <span>{t('select_service')}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {servicesList.map(srv => (
                <button
                  key={srv.id}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    selectedServiceId === srv.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {srv.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-sm text-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadServiceDetails(true)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Failed-Visit Warning Alert */}
      {statusData?.warning && (
        <FailedVisitWarning warning={statusData.warning} />
      )}

      {/* Main Waiting-Time & Crowd Card */}
      {statusData && (
        <div className="card-civic space-y-6">
          
          {/* Top Bar: Service Title + Freshness + Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {statusData.service?.location?.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {statusData.service?.name}
              </h2>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                {statusData.status?.freshness}
              </span>
              <button
                onClick={() => loadServiceDetails(true)}
                disabled={refreshing}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                title="Refresh Status"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metric Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Wait time and range */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('estimated_wait')}
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                    ~{statusData.status?.estimated_wait_min}
                  </span>
                  <span className="text-lg font-semibold text-slate-600">
                    {t('minutes')}
                  </span>
                </div>
              </div>

              {/* Range badge */}
              <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
                <span className="font-semibold text-slate-500">{t('expected_range')}:</span>
                <span className="font-bold text-slate-900">
                  {statusData.status?.wait_range?.low_min} – {statusData.status?.wait_range?.high_min} {t('minutes')}
                </span>
              </div>
            </div>

            {/* Right: Crowd level tier */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('current_crowd')}
                </span>
                <div className="mt-2">
                  <CrowdBadge level={statusData.status?.crowd_level} size="lg" />
                </div>
              </div>

              {/* Data Attribution Badge */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-blue-50/80 border border-blue-100 px-3 py-1.5 rounded-lg w-fit">
                <Database className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="font-medium">
                  {statusData.status?.data_sources?.data_category}
                  {statusData.status?.data_sources?.recent_reports_count > 0 && (
                    ` (${statusData.status.data_sources.recent_reports_count} reports)`
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* Confidence Score Bar */}
          <ConfidenceMeter confidence={statusData.status?.confidence} />

          {/* Citizen Reporting CTA Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              <Users className="w-5 h-5 text-blue-400" />
              <span>{t('submit_report_cta')}</span>
            </button>
          </div>

        </div>
      )}

      {/* Smart Visit Planner Card */}
      {recommendationData && (
        <SmartPlannerCard recommendation={recommendationData} />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        serviceId={selectedServiceId}
        serviceName={selectedService?.name || 'Service'}
        onReportSubmitted={() => loadServiceDetails(true)}
      />

    </div>
  );
}
