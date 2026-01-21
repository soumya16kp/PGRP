import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import authService from "../services/authService";
import complaintService from "../services/complaintService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Building,
  BarChart3,
  PieChart as PieChartIcon,
  Map,
  Activity,
  Target,
  Flame,
  Gauge,
  Award,
  RefreshCw,
  ThumbsUp,
  Calendar,
  AlertTriangle,
  Settings,
  Wrench,
  Home,
  Trash2,
  Droplets,
  HardHat,
  Ban
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./MunicipalityDashboard.css";

// Custom colors for charts
const COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6", "#8b5cf6", "#06b6d4"];
const STATUS_COLORS = {
  'resolved': '#22c55e',
  'in progress': '#3b82f6',
  'pending': '#eab308',
  'default': '#6b7280'
};

// Department icons mapping
const DEPARTMENT_ICONS = {
  'Water': Droplets,
  'Electricity': Zap,
  'Sanitation': Settings,
  'Roads': Wrench,
  'Illegal Drainage': Ban,
  'Dumping': Trash2,
  'Illegal Construction': HardHat,
  'Public Toilets': Home,
  'Garbage Collection': Trash2,
  'Others': AlertCircle
};

// Fix default marker icons for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export default function MunicipalityDashboard() {
  const [data, setData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDepartment, setSelectedDepartment] = useState('Water'); // Default department
  const { id } = useParams();

  // Enhanced data fetching with real-time updates
  // Enhanced data fetching with real-time updates
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Generate last 6 months dynamically to avoid showing future months
  const MONTHS = React.useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toLocaleString('en-US', { month: 'short' }));
    }
    return months;
  }, []);

  // Filter logic for analytics
  const filteredTrendData = selectedMonth === 'All'
    ? (data?.monthly_trend || [])
    : (data?.monthly_trend || []).filter(item => item.month === selectedMonth);

  // Calculate stats based on selection
  const currentStats = React.useMemo(() => {
    if (!data) return {};
    if (selectedMonth === 'All') {
      return {
        avgTime: (data.average_resolution_time_hours || 0).toFixed(1),
        totalIssues: data.total_complaints || 0,
        satisfaction: data.citizen_satisfaction || 0
      };
    }
    return {
      avgTime: (data.average_resolution_time_hours || 0).toFixed(1),
      totalIssues: filteredTrendData.reduce((acc, curr) => acc + curr.total, 0),
      satisfaction: data.citizen_satisfaction || 0
    };
  }, [data, selectedMonth, filteredTrendData]);

  // Calculate Trends (vs previous period)
  const trends = React.useMemo(() => {
    if (!data || !data.monthly_trend) return { avgTime: 0, total: 0, satisfaction: 0 };

    // Helper to get index
    const currentMonthIndex = MONTHS.indexOf(selectedMonth);

    let prevTotal = 0;
    let currTotal = currentStats.totalIssues;

    // Logic: compare with previous month in the list
    if (selectedMonth !== 'All' && currentMonthIndex > 0) {
      const prevMonthName = MONTHS[currentMonthIndex - 1];
      const prevData = data.monthly_trend.find(m => m.month === prevMonthName);
      prevTotal = prevData ? prevData.total : 0;
    } else if (selectedMonth === 'All') {
      // Mock trend for 'All' (e.g. compare to 0 or fixed baseline since we don't have last year data)
      prevTotal = currTotal * 0.9; // Assume 10% growth for demo
    }

    const totalTrend = prevTotal === 0 ? 100 : Math.round(((currTotal - prevTotal) / prevTotal) * 100);

    return {
      total: totalTrend,
      avgTime: -12, // Mocked for now 
      satisfaction: 5.4 // Mocked
    };
  }, [currentStats, selectedMonth, data]);

  useEffect(() => {
    const fetchDashboardAndComplaints = async () => {
      try {
        console.log('🔄 Fetching dashboard data...');


        // Fetch dashboard data
        const [dashboardRes, complaintsData] = await Promise.all([
          authService.apiClient.get(`/municipalities/${id}/dashboard/`),
          complaintService.getComplaints(id)
        ]);

        setData(dashboardRes.data);
        console.log(dashboardRes.data);
        setComplaints(complaintsData);


        console.log('✅ Data fetched successfully');
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAndComplaints();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardAndComplaints, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);





  const {
    municipality_info = {},
    total_complaints = 0,
    resolved_complaints = 0,
    active_complaints = 0,
    average_resolution_time_hours = 0,
    department_wise_stats = {},
    status_distribution = {},
    monthly_trend = []
  } = data || {};

  // Enhanced data processing
  // Filter complaints by month
  const filteredComplaints = React.useMemo(() => {
    if (!complaints || !Array.isArray(complaints)) {
      console.warn("Complaints is not an array:", complaints);
      return [];
    }
    if (selectedMonth === 'All') return complaints;

    const filtered = complaints.filter(c => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      if (isNaN(d.getTime())) return false;
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      // console.log(`Date: ${c.created_at}, Month: ${monthName}, Selected: ${selectedMonth}`);
      return monthName === selectedMonth;
    });
    console.log(`Filtered ${complaints.length} -> ${filtered.length} complaints for ${selectedMonth}`);
    return filtered;
  }, [complaints, selectedMonth]);

  // Dynamic Dept Data
  const deptData = React.useMemo(() => {
    const stats = {};
    const source = selectedMonth === 'All' ? complaints : filteredComplaints;

    // If we have no complaints for the month, show empty stats/placeholder logic or just 0s
    if (source.length === 0) return [];

    source.forEach(c => {
      stats[c.department] = (stats[c.department] || 0) + 1;
    });

    return Object.entries(stats).map(([k, v], index) => ({
      department: k,
      count: v,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.count - a.count); // sort by count descending
  }, [complaints, filteredComplaints, selectedMonth]);

  // Dynamic Status Data
  const statusData = React.useMemo(() => {
    const stats = {};
    const source = selectedMonth === 'All' ? complaints : filteredComplaints;

    if (source.length === 0) return [];

    source.forEach(c => {
      // Normalize status
      const s = c.status || 'Unknown';
      stats[s] = (stats[s] || 0) + 1;
    });

    return Object.entries(stats).map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
      fill: STATUS_COLORS[k.toLowerCase()] || STATUS_COLORS.default
    }));
  }, [complaints, filteredComplaints, selectedMonth]);

  // Get current selected dept stats (this remains from global stats for now as it's card specific)
  // Or we can make this dynamic too? The user asked for "Volume by Dept" (Chart) specifically.
  // The "Department Performance" card at the top (lines 506-561) uses this. Let's start with charts.

  const currentDeptStats = department_wise_stats?.[selectedDepartment] || {
    total: 0,
    resolved: 0,
    pending: 0,
    resolution_rate: 0,
    avg_response_time: 0
  };

  const trendData = (monthly_trend || []).map(item => ({
    ...item,
    resolved: item.resolved || 0,
    fill: 'url(#trendGradient)'
  }));

  // Map configuration
  const validComplaints = complaints.filter(c => c.latitude && c.longitude);
  const mapCenter = validComplaints.length > 0
    ? [validComplaints[0].latitude, validComplaints[0].longitude]
    : [20.2961, 85.8245]; // Default center

  // Enhanced statistics
  const resolutionRate = total_complaints > 0
    ? Math.round((resolved_complaints / total_complaints) * 100)
    : 0;

  const avgResponseTime = average_resolution_time_hours || 0;
  const citizenSatisfaction = Math.min(100, Math.max(70, resolutionRate + 20)); // Simulated metric

  // Map statistics
  const mapStats = [
    {
      label: 'Complaints Mapped',
      value: validComplaints.length,
      icon: MapPin
    },
    {
      label: 'Hotspot Zones',
      value: Math.max(1, Math.floor(validComplaints.length / 3)),
      icon: Flame
    },
    {
      label: 'Avg Response',
      value: `${avgResponseTime}h`,
      icon: Gauge
    },
    {
      label: 'Coverage',
      value: '15km radius',
      icon: Target
    }
  ];

  // Get status badge with enhanced styling
  const getStatusBadge = (status) => {
    const statusKey = status?.toLowerCase().replace(' ', '-');
    const statusConfig = {
      'resolved': { icon: CheckCircle, class: 'resolved' },
      'in-progress': { icon: Activity, class: 'in-progress' },
      'pending': { icon: Clock, class: 'pending' }
    };

    const config = statusConfig[statusKey] || { icon: AlertCircle, class: 'default' };
    const IconComponent = config.icon;

    return (
      <span className={`status-badge status-${config.class}`}>
        <IconComponent size={14} />
        {status}
      </span>
    );
  };


  const getPriorityBadge = (complaint) => {
    const upvotes = complaint.total_upvotes || 0;
    const daysOld = Math.floor((new Date() - new Date(complaint.created_at)) / (1000 * 60 * 60 * 24));

    const upvoteScore = Math.min(upvotes / 20, 1); // 20 upvotes = max
    const ageScore = Math.min(daysOld / 10, 1);    // 10 days = max
    const priority = complaint.priority// average score


    let label = 'Normal';
    let icon = CheckCircle;
    let className = 'normal';

    if (priority > 0.7) {
      label = 'High-Priority';
      icon = AlertTriangle;
      className = 'high';
    } else if (priority > 0.4) {
      label = 'Medium-Priority';
      icon = AlertCircle;
      className = 'medium';
    }

    return { priority, label, icon, class: className };
  };


  // Get department icon component
  const getDepartmentIcon = (dept) => {
    const IconComponent = DEPARTMENT_ICONS[dept] || AlertCircle;
    return <IconComponent size={16} />;
  };

  if (loading) return (
    <div className="loading-container">
      <FontAwesomeIcon icon={faSpinner} spin size="3x" />
      <p>Loading complaints...</p>
    </div>
  );

  if (!data) {
    return (
      <div className="no-data">
        <AlertCircle size={64} />
        <h2>No Data Available</h2>
        <p>Unable to load dashboard data. Please try again later.</p>
        <button
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Winning Feature Badge */}


      {/* Enhanced Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>
            <Building size={32} />
            {municipality_info.name || "Smart City"}
          </h1>
          <div className="header-stats">
            <span className="header-stat">
              <Shield size={16} />
              Live Monitoring Active
            </span>
            <span className="header-stat">
              <Users size={16} />
              {total_complaints || 0} Total Issues
            </span>
            <span className="header-stat">
              <Zap size={16} />
              {resolutionRate}% Resolution Rate
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <PieChartIcon size={18} />
          Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <Map size={18} />
          Live Map
        </button>
      </nav>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <>
            {/* Enhanced Stats Cards */}
            <section className="cards-grid">
              <div className="dashboard-card blue">
                <h3>
                  <TrendingUp size={18} />
                  Total Complaints
                </h3>
                <p>{total_complaints || 0}</p>
                <div className="card-trend">
                  <TrendingUp size={14} />
                  12% from last month
                </div>
              </div>

              <div className="dashboard-card green">
                <h3>
                  <CheckCircle size={18} />
                  Resolved
                </h3>
                <p>{resolved_complaints || 0}</p>
                <div className="card-trend">
                  <CheckCircle size={14} />
                  {resolutionRate}% success rate
                </div>
              </div>

              <div className="dashboard-card yellow">
                <h3>
                  <AlertCircle size={18} />
                  Active
                </h3>
                <p>{active_complaints || 0}</p>
                <div className="card-trend">
                  <Zap size={14} />
                  {avgResponseTime}h avg response
                </div>
              </div>

              <div className="dashboard-card purple">
                <h3>
                  <Users size={18} />
                  Satisfaction
                </h3>
                <p>{citizenSatisfaction}%</p>
                <div className="card-trend">
                  <CheckCircle size={14} />
                  Based on resolution quality
                </div>
              </div>
            </section>

            {/* Quick Insights */}
            <section className="insights-grid">
              <div className="insight-card">
                <h3>
                  <Activity size={20} />
                  Performance Metrics
                </h3>
                <div className="insight-content">
                  <div className="metric">
                    <span className="metric-label">Resolution Rate</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${resolutionRate}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{resolutionRate}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Response Time</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill time"
                        style={{ width: `${Math.max(10, 100 - (avgResponseTime * 5))}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{avgResponseTime}h</span>
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <h3>
                  <Building size={20} />
                  Department Performance
                </h3>

                <div className="dept-selector-container">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="dept-select"
                  >
                    {Object.keys(department_wise_stats || {}).map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="dept-detailed-stats">
                  <div className="stat-row">
                    <div className="d-stat">
                      <span className="d-stat-label">Resolution Rate</span>
                      <div className="d-stat-value good">
                        {currentDeptStats.resolution_rate}%
                      </div>
                    </div>
                    <div className="d-stat">
                      <span className="d-stat-label">Response Time</span>
                      <div className="d-stat-value avg">
                        {currentDeptStats.avg_response_time}h
                      </div>
                    </div>
                  </div>

                  <div className="stat-detailed-list">
                    <div className="list-item">
                      <span className="list-item-label">
                        <AlertCircle size={14} /> Filed
                      </span>
                      <span className="list-item-value">{currentDeptStats.total}</span>
                    </div>
                    <div className="list-item">
                      <span className="list-item-label">
                        <CheckCircle size={14} color="#22c55e" /> Resolved
                      </span>
                      <span className="list-item-value">{currentDeptStats.resolved}</span>
                    </div>
                    <div className="list-item">
                      <span className="list-item-label">
                        <Clock size={14} color="#eab308" /> Pending
                      </span>
                      <span className="list-item-value">{currentDeptStats.pending}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Analytics Tab */}
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            className="analytics-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Analytics Header with Advanced Filter */}
            <div className="section-header premium-header">
              <div className="header-title">
                <div className="icon-box-premium">
                  <Activity size={24} color="#6366f1" />
                </div>
                <div>
                  <h2>Analytics Overview</h2>
                  <p className="subtitle">Real-time performance metrics</p>
                </div>
              </div>

              <div className="premium-filter-container">
                <span className="filter-label">Filter by Month:</span>
                <div className="month-selector">
                  <button
                    className={`month-btn ${selectedMonth === 'All' ? 'active' : ''}`}
                    onClick={() => setSelectedMonth('All')}
                  >
                    All
                  </button>
                  {MONTHS.map(month => (
                    <button
                      key={month}
                      className={`month-btn ${selectedMonth === month ? 'active' : ''}`}
                      onClick={() => setSelectedMonth(month)}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analytics Key Metrics with Framer Motion */}
            <div className="analytics-summary">
              <motion.div
                className="summary-card-premium"
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="card-icon-bg red">
                  <Clock size={24} color="#ef4444" />
                </div>
                <div className="card-content">
                  <span className="card-label">Avg Resolution Time</span>
                  <div className="card-value-row">
                    <span className="card-value">{currentStats.avgTime}h</span>
                    {/* Backend doesn't support historic resolution avg yet, keeping mock trend */}
                    <span className="trend-badge negative">
                      <TrendingUp size={12} /> +12%
                    </span>
                  </div>
                  <span className="card-comparison">vs. previous period</span>
                </div>
              </motion.div>

              <motion.div
                className="summary-card-premium"
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="card-icon-bg blue">
                  <Building size={24} color="#3b82f6" />
                </div>
                <div className="card-content">
                  <span className="card-label">Total Issues Reported</span>
                  <div className="card-value-row">
                    <span className="card-value">{currentStats.totalIssues}</span>
                    <span className={`trend-badge ${trends.total >= 0 ? 'negative' : 'positive'}`}>
                      <TrendingUp size={12} style={{ transform: trends.total < 0 ? 'scaleY(-1)' : 'none' }} />
                      {trends.total > 0 ? '+' : ''}{trends.total}%
                    </span>
                  </div>
                  <span className="card-comparison">vs. previous period</span>
                </div>
              </motion.div>

              <motion.div
                className="summary-card-premium"
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="card-icon-bg green">
                  <ThumbsUp size={24} color="#22c55e" />
                </div>
                <div className="card-content">
                  <span className="card-label">Citizen Satisfaction</span>
                  <div className="card-value-row">
                    <span className="card-value">{currentStats.satisfaction}%</span>
                    <span className="trend-badge positive">
                      <TrendingUp size={12} /> +8.5%
                    </span>
                  </div>
                  <span className="card-comparison">Based on resolution feedback</span>
                </div>
              </motion.div>
            </div>

            <section className="charts-grid-analytics">
              {/* Main Trend Chart */}
              <motion.div
                className="chart-card full-width glass-panel-premium"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="chart-header">
                  <h3>
                    <Activity size={20} className="text-blue-500" />
                    Complaint Trends • <span className="text-secondary">{selectedMonth === 'All' ? 'Yearly Overview' : selectedMonth}</span>
                  </h3>
                  <button className="icon-btn-ghost"><Settings size={16} /></button>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart
                      key={selectedMonth}
                      data={selectedMonth === 'All' ? trendData : filteredTrendData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '16px',
                          border: 'none',
                          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                          padding: '12px 20px'
                        }}
                        itemStyle={{ padding: '4px 0' }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Filed"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorResolved)"
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Department Distribution */}
              <motion.div
                className="chart-card glass-panel-premium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="chart-header">
                  <h3>
                    <Building size={20} className="text-secondary" />
                    Volume by Dept
                  </h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart key={selectedMonth} data={deptData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="department"
                        width={120}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748b', fontWeight: 500 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc', radius: 4 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24} name="Complaints">
                        {deptData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Status Donut Chart */}
              <motion.div
                className="chart-card glass-panel-premium"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="chart-header">
                  <h3>
                    <PieChartIcon size={20} className="text-secondary" />
                    Status Mix
                  </h3>
                </div>
                <div className="chart-body" style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart key={selectedMonth}>
                      <Pie
                        data={statusData}
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={6}
                        dataKey="value"
                        cornerRadius={8}
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text Overlay */}
                  <div className="donut-center-text">
                    <div className="donut-number">
                      {selectedMonth === 'All' ? currentStats.totalIssues : filteredComplaints.length}
                    </div>
                    <div className="donut-label">Issues</div>
                  </div>
                </div>
              </motion.div>
            </section>
          </motion.div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <section className="map-section">
            <h2>
              <Map size={24} />
              Live Complaints Heatmap
            </h2>

            <div className="map-stats">
              {mapStats.map((stat, idx) => {
                const IconComponent = stat.icon;
                return (
                  <div key={idx} className="map-stat">
                    <span className="stat-icon">
                      <IconComponent size={18} />
                    </span>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="map-container">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "500px", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {validComplaints.map((complaint, idx) => {
                  const status = complaint.status?.toLowerCase();
                  const iconColor = STATUS_COLORS[status] || STATUS_COLORS.default;

                  return (
                    <Marker
                      key={idx}
                      position={[complaint.latitude, complaint.longitude]}
                      icon={createCustomIcon(iconColor)}
                    >
                      <Popup>
                        <div className="popup-content">
                          <h4>{complaint.topic}</h4>
                          <p><strong>Department:</strong> {complaint.department}</p>
                          <p><strong>Status:</strong> {getStatusBadge(complaint.status)}</p>
                          <p><strong>Upvotes:</strong>
                            <ThumbsUp size={14} style={{ marginLeft: '4px', display: 'inline' }} />
                            {complaint.total_upvotes || 0}
                          </p>
                          <p><strong>Reported:</strong>
                            <Calendar size={14} style={{ marginLeft: '4px', display: 'inline' }} />
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </p>
                          {complaint.description && (
                            <p><strong>Description:</strong> {complaint.description.substring(0, 100)}...</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-color resolved"></div>
                <CheckCircle size={14} />
                <span>Resolved</span>
              </div>
              <div className="legend-item">
                <div className="legend-color in-progress"></div>
                <Activity size={14} />
                <span>In Progress</span>
              </div>
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <Clock size={14} />
                <span>Pending</span>
              </div>
            </div>

            {/* Administrative Details Card */}
            <motion.div
              className="admin-details-card glass-panel-premium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card-header-admin">
                <h3>
                  <Building size={24} className="text-blue-500" />
                  Administrative Overview
                </h3>
                <span className="est-year">
                  Est. {municipality_info.establishment_year || 'N/A'}
                </span>
              </div>

              {municipality_info.description && (
                <p className="admin-description">
                  {municipality_info.description}
                </p>
              )}

              <div className="admin-grid">
                <div className="admin-item">
                  <span className="admin-label">City Mayor</span>
                  <strong className="admin-value">{municipality_info.mayor_name || 'Not Available'}</strong>
                </div>
                <div className="admin-item">
                  <span className="admin-label">Commissioner</span>
                  <strong className="admin-value">{municipality_info.commissioner_name || 'Not Available'}</strong>
                </div>
                <div className="admin-item">
                  <span className="admin-label">Wards</span>
                  <strong className="admin-value">
                    {municipality_info.wards_count ? `${municipality_info.wards_count} Wards` : 'N/A'}
                  </strong>
                </div>
                <div className="admin-item">
                  <span className="admin-label">Area</span>
                  <strong className="admin-value">
                    {municipality_info.area_sq_km ? `${municipality_info.area_sq_km} sq km` : 'N/A'}
                  </strong>
                </div>
                <div className="admin-item">
                  <span className="admin-label">Population</span>
                  <strong className="admin-value">
                    {municipality_info.population ? isNaN(municipality_info.population) ? municipality_info.population : Number(municipality_info.population).toLocaleString() : 'N/A'}
                  </strong>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Recent Complaints Table (Visible in all tabs) */}

      </div>

      {/* Footer with last updated time */}
      <footer className="dashboard-footer">
        <p>
          <Clock size={16} />
          Last updated: {new Date().toLocaleTimeString()} |
          <RefreshCw size={16} />
          Auto-refresh every 30 seconds |
          <Award size={16} />
          Smart City Analytics v2.0
        </p>
      </footer>
    </div>
  );
}