import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  orgLogin,
  fetchOrgDashboard,
  fetchDailyTrends,
  fetchPeakHours,
  fetchReportsFeed
} from '../../services/api';
import CrowdBadge from '../../components/CrowdBadge';
import {
  Building2,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle,
  ShieldAlert,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function OrgDashboard() {
  const { t } = useLanguage();

  // Auth State
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('iq_org_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [email, setEmail] = useState('admin@chdhealth.gov.in');
  const [password, setPassword] = useState('admin123');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('srv-dh30-opd');
  const [dailyTrends, setDailyTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [reportsFeed, setReportsFeed] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await orgLogin({ email, password });
      setUser(res.user);
      localStorage.setItem('iq_org_user', JSON.stringify(res.user));
      localStorage.setItem('iq_org_token', res.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('iq_org_user');
    localStorage.removeItem('iq_org_token');
  };

  // Load dashboard data
  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dash, trends, peaks, reports] = await Promise.all([
        fetchOrgDashboard(),
        fetchDailyTrends(selectedServiceId),
        fetchPeakHours(selectedServiceId),
        fetchReportsFeed(selectedServiceId)
      ]);

      setDashboardData(dash);
      setDailyTrends(trends.hourly_trend || []);
      setPeakHours(peaks.peak_periods || []);
      setReportsFeed(reports.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user, selectedServiceId]);

  // Login view if not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="card-civic p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('org_login_title')}</h2>
            <p className="text-xs text-slate-500">{t('org_login_subtitle')}</p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Access Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              {authLoading ? 'Authenticating...' : t('login_btn')}
            </button>
          </form>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Demo Login Pre-filled:</span>
            <br />
            Email: <code className="text-blue-700">admin@chdhealth.gov.in</code>
            <br />
            Password: <code className="text-blue-700">admin123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner with Profile & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {user.role}
            </span>
            <span className="text-xs text-slate-500">Department of Health & Family Welfare</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">{user.display_name}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboard}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Service Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {(dashboardData?.services || []).map(srv => (
          <button
            key={srv.service_id}
            onClick={() => setSelectedServiceId(srv.service_id)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              selectedServiceId === srv.service_id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {srv.service_name} ({srv.location_name.split('(')[0].trim()})
          </button>
        ))}
      </div>

      {/* Operational Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(dashboardData?.services || []).map(srv => (
          <div
            key={srv.service_id}
            onClick={() => setSelectedServiceId(srv.service_id)}
            className={`card-civic cursor-pointer transition-all ${
              selectedServiceId === srv.service_id ? 'ring-2 ring-blue-600 shadow-sm' : 'hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold truncate max-w-[150px]">
                {srv.service_name}
              </span>
              <CrowdBadge level={srv.current_crowd_level} size="sm" />
            </div>

            <div className="mt-3 flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-slate-900">~{srv.estimated_wait_min}</span>
              <span className="text-xs font-medium text-slate-500">{t('minutes')} wait</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>{srv.active_reports_count} live reports</span>
              <span className="font-semibold text-blue-700">{srv.confidence_score}/100 conf.</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Peak Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hourly Trend Bar Chart (2 cols) */}
        <div className="card-civic lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {t('hourly_trend_title')}
              </h3>
            </div>
            <span className="text-xs text-slate-500">Wait Time (Minutes) by Hour</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11 }} />
                <YAxis unit="m" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${val} minutes`, 'Avg Wait']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="avg_wait_min" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Congestion & Staff Action Alerts (1 col) */}
        <div className="card-civic space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('peak_hours_title')}
            </h3>
          </div>

          {peakHours.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-6 text-center">
              No critical peak surges detected for this service today.
            </div>
          ) : (
            <div className="space-y-3">
              {peakHours.map((peak, idx) => (
                <div key={idx} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">{peak.time_slot}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-full">
                      ~{peak.avg_wait_min}m wait
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-snug font-medium pt-1">
                    {peak.recommended_action}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Capacity Guideline:</div>
            <p>Target max wait under 45 mins. When 10 AM rush commences, activate secondary token printer.</p>
          </div>
        </div>

      </div>

      {/* Citizen Reports Audit Feed */}
      <div className="card-civic space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('active_reports_title')}
            </h3>
          </div>
          <span className="text-xs text-slate-500">{reportsFeed.length} reports logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Reported Crowd</th>
                <th className="py-2.5 px-3">Reported Wait</th>
                <th className="py-2.5 px-3">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportsFeed.slice(0, 8).map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600">
                    {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <CrowdBadge level={r.crowd_level} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {r.estimated_wait_min ? `${r.estimated_wait_min} mins` : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    {r.is_flagged ? (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Outlier Filtered
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1 w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Verified Active</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
