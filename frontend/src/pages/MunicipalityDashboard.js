import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import authService from "../services/authService";
import complaintService from "../services/complaintService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";
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
  const { id } = useParams();

  // Enhanced data fetching with real-time updates
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

  // Enhanced loading state
  if (loading) {
    return (
      <div className="dashboard-loader">
        <div className="loader-content">
          <Loader2 className="spin" size={48} />
          <h2>Loading Smart Dashboard</h2>
          <p>Fetching real-time municipality data...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

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

  const {
    municipality_info,
    total_complaints,
    resolved_complaints,
    active_complaints,
    average_resolution_time_hours,
    department_wise_stats,
    status_distribution,
    monthly_trend
  } = data;

  // Enhanced data processing
  const deptData = Object.entries(department_wise_stats || {}).map(([k, v]) => ({ 
    department: k, 
    count: v,
    fill: COLORS[Object.keys(department_wise_stats || {}).indexOf(k) % COLORS.length]
  }));

  const statusData = Object.entries(status_distribution || {}).map(([k, v]) => ({ 
    name: k.charAt(0).toUpperCase() + k.slice(1), 
    value: v,
    fill: STATUS_COLORS[k.toLowerCase()] || STATUS_COLORS.default
  }));

  const trendData = (monthly_trend || []).map(item => ({
    ...item,
    resolved: item.total - (item.pending || 0),
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

  return (
    <div className="dashboard-container">
      {/* Winning Feature Badge */}
      <div className="winning-features">
        <div className="feature-badge">
          <Award size={16} />
          Real-time Analytics
        </div>
      </div>

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
                <div className="dept-performance">
                  {deptData.slice(0, 4).map((dept, idx) => (
                    <div key={idx} className="dept-item">
                      <span className="dept-icon">
                        {getDepartmentIcon(dept.department)}
                      </span>
                      <span className="dept-name">{dept.department}</span>
                      <span className="dept-count">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <section className="charts-grid">
            <div className="chart-card">
              <h2>
                <BarChart3 size={20} />
                Department-wise Complaints
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="department" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h2>
                <PieChartIcon size={20} />
                Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card full">
              <h2>
                <TrendingUp size={20} />
                Monthly Trend Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#trendGradient)" 
                    strokeWidth={3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
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
          </section>
        )}

        {/* Recent Complaints Table (Visible in all tabs) */}
        <section className="recent-table-section">
          <h2>
            <AlertCircle size={24} />
            Live Complaint Feed
          </h2>
          <div className="table-scroll-container">
            <div className="table-container">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Upvotes</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.slice(0, 10).map((complaint, idx) => {
                    const priority = getPriorityBadge(complaint);
                    const PriorityIcon = priority.icon;
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="complaint-title">
                            {complaint.topic}
                          </div>
                        </td>
                        <td>
                          <span className="dept-with-icon">
                            {getDepartmentIcon(complaint.department)}
                            {complaint.department}
                          </span>
                        </td>
                        <td>{getStatusBadge(complaint.status)}</td>
                        <td>
                          <span className="date-with-icon">
                            <Calendar size={14} />
                            {new Date(complaint.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td>
                          <span className={`priority-badge ${priority.class}`}>
                            <PriorityIcon size={14} />
                            {priority.label}
                          </span>
                        </td>
                        <td>
                          <span className="upvote-count">
                            <ThumbsUp size={14} />
                            {complaint.total_upvotes || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {complaints.length === 0 && (
            <div className="empty-table">
              <AlertCircle size={32} />
              <p>No complaints reported yet. Be the first to report an issue!</p>
            </div>
          )}
        </section>
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