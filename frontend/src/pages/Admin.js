import React, { useEffect, useState, useMemo } from 'react';
import './Admin.css';
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import {
  CheckCircle, Clock, AlertTriangle, Activity,
  MapPin, Calendar, Filter, Download, RefreshCw,
  Users, TrendingUp, Shield, Eye, Search,
  BarChart3, PieChart as PieChartIcon, TrendingDown,
  ChevronDown, MoreVertical, MessageSquare,
  FileText, ArrowUpRight, ArrowDownRight,
  Building2, Target, Zap
} from 'lucide-react';
import authService from '../services/authService';
import complaintService from '../services/complaintService';

// Modern color palette
const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];
const STATUS_COLORS = {
  'Resolved': 'rgba(16, 185, 129, 0.9)',
  'Pending': 'rgba(245, 158, 11, 0.9)',
  'In Progress': 'rgba(59, 130, 246, 0.9)',
  'Rejected': 'rgba(239, 68, 68, 0.9)',
  'New': 'rgba(139, 92, 246, 0.9)',
  'Escalated': 'rgba(236, 72, 153, 0.9)'
};

const PRIORITY_COLORS = {
  'High': 'rgba(239, 68, 68, 0.9)',
  'Medium': 'rgba(245, 158, 11, 0.9)',
  'Low': 'rgba(16, 185, 129, 0.9)'
};

const Admin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Last 7 days');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState(null);

  // Redirect non-staff users
  useEffect(() => {
    if (!userLoading && (!user || !(user.is_staff || user.user?.is_staff))) {
      navigate('/');
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await authService.apiClient.get(
          `/municipalities/${id}/dashboard/`
        );
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, refreshKey]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [complaintId]: true }));

      await complaintService.updateStatus(complaintId, newStatus);

      setRefreshKey(prev => prev + 1);

      // Show success notification
      showNotification(`Status updated to ${newStatus}`, 'success');

    } catch (err) {
      console.error('Failed to update status:', err);
      showNotification('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const handleExportData = () => {
    // Export functionality - create CSV
    if (!data) return;

    const csvContent = [
      ['Municipality Dashboard Export'],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Summary'],
      ['Total Complaints', data.total_complaints],
      ['Resolved', data.resolved_complaints],
      ['Active', data.active_complaints],
      ['Avg Resolution Time (hours)', data.average_resolution_time_hours],
      [],
      ['Department Stats'],
      ...Object.entries(data.department_wise_stats || {}).map(([dept, stats]) => [
        dept,
        typeof stats === 'object' ? stats.total : stats
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Data exported successfully', 'success');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    showNotification('Dashboard refreshed', 'info');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setDateFilter('Last 7 days');
    setSearchTerm('');
  };

  // Filter complaints
  const filteredComplaints = (data?.recent_complaints || []).filter(complaint => {
    const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || complaint.priority === priorityFilter;
    const matchesSearch = searchTerm === '' ||
      complaint.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.department?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Transform data for charts
  const departmentData = Object.entries(data?.department_wise_stats || {}).map(([name, stats]) => ({
    name,
    value: typeof stats === 'object' ? stats.total : stats
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const statusData = Object.entries(data?.status_distribution || {}).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#94A3B8'
  }));

  const monthlyTrend = data?.monthly_trend || [];

  // Calculate real metrics
  const calculatedMetrics = useMemo(() => {
    if (!data) return {};

    const total = data.total_complaints || 0;
    const resolved = data.resolved_complaints || 0;
    const active = data.active_complaints || 0;

    // Satisfaction rate from backend
    const satisfactionRate = data.citizen_satisfaction || 0;

    // Calculate today's complaints from recent_complaints
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysComplaints = (data.recent_complaints || []).filter(c => {
      const created = new Date(c.created_at);
      return created >= today;
    }).length;

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Calculate trend percentages based on monthly data
    const trend = data.monthly_trend || [];
    let totalTrend = 0;
    let resolvedTrend = 0;

    if (trend.length >= 2) {
      const lastMonth = trend[trend.length - 1];
      const prevMonth = trend[trend.length - 2];

      if (prevMonth.total > 0) {
        totalTrend = Math.round(((lastMonth.total - prevMonth.total) / prevMonth.total) * 100);
      }
      if (prevMonth.resolved > 0) {
        resolvedTrend = Math.round(((lastMonth.resolved - prevMonth.resolved) / prevMonth.resolved) * 100);
      }
    }

    return {
      satisfactionRate,
      todaysComplaints,
      resolutionRate,
      totalTrend,
      resolvedTrend,
      avgResolutionTime: data.average_resolution_time_hours || 0
    };
  }, [data]);

  if (loading) return (
    <div className="admin-dashboard-page">
      <div className="glass-loading-container">
        <div className="glass-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-center"></div>
        </div>
        <p>Loading Dashboard Data</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="admin-dashboard-page">
      <div className="glass-error-container">
        <div className="error-icon">
          <AlertTriangle size={48} />
        </div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className="glass-btn glass-btn-primary">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  // Calculate displayed complaints based on pagination
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentComplaints = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="admin-dashboard-page">
      <div className="glass-dashboard">
        {/* Background elements for visual interest */}
        <div className="bg-blur-circle-1"></div>
        <div className="bg-blur-circle-2"></div>
        <div className="bg-blur-circle-3"></div>

        {/* Toast Notification */}
        {notification && (
          <div className={`toast-notification toast-${notification.type}`}>
            {notification.type === 'success' && <CheckCircle size={18} />}
            {notification.type === 'error' && <AlertTriangle size={18} />}
            {notification.type === 'info' && <Activity size={18} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="glass-main">
          {/* Top Header Bar */}
          <header className="glass-header">
            <div className="header-left">
              <div className="header-logo">
                <Building2 size={32} className="logo-icon" />
                <div>
                  <h1>Municipality Admin Dashboard</h1>
                  <p className="header-subtitle">
                    <MapPin size={14} /> {data.municipality_info?.name}, {data.municipality_info?.district}
                  </p>
                </div>
              </div>
            </div>

            <div className="header-actions">
              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button className="glass-btn glass-btn-secondary" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} /> Filters
              </button>

              <button className="glass-btn glass-btn-secondary" onClick={handleExportData}>
                <Download size={16} /> Export
              </button>

              <button className="glass-btn glass-btn-primary" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>

              <div className="admin-badge">
                <Shield size={16} />
                <span>Admin</span>
              </div>
            </div>
          </header>

          {/* Dashboard Overview Section - Improved Spacing */}
          <div className="dashboard-overview">
            {/* KPI Cards Grid */}
            <div className="kpi-grid">
              <KpiCard
                title="Total Complaints"
                value={data.total_complaints || 0}
                change={`${calculatedMetrics.totalTrend >= 0 ? '+' : ''}${calculatedMetrics.totalTrend}%`}
                trend={calculatedMetrics.totalTrend >= 0 ? "up" : "down"}
                icon={<Activity />}
                color="primary"
                delay="0s"
              />

              <KpiCard
                title="Resolved"
                value={data.resolved_complaints || 0}
                change={`${calculatedMetrics.resolvedTrend >= 0 ? '+' : ''}${calculatedMetrics.resolvedTrend}%`}
                trend={calculatedMetrics.resolvedTrend >= 0 ? "up" : "down"}
                icon={<CheckCircle />}
                color="success"
                delay="0.1s"
              />

              <KpiCard
                title="Active/Pending"
                value={data.active_complaints || 0}
                change={`${calculatedMetrics.resolutionRate}% resolved`}
                trend="neutral"
                icon={<AlertTriangle />}
                color="warning"
                delay="0.2s"
              />

              <KpiCard
                title="Avg. Resolution"
                value={`${calculatedMetrics.avgResolutionTime.toFixed(1)}h`}
                change="avg time"
                trend="neutral"
                icon={<Clock />}
                color="info"
                delay="0.3s"
              />

              <KpiCard
                title="Satisfaction Rate"
                value={`${calculatedMetrics.satisfactionRate}%`}
                change="citizen feedback"
                trend={calculatedMetrics.satisfactionRate >= 70 ? "up" : "down"}
                icon={<Target />}
                color="accent"
                delay="0.4s"
              />

              <KpiCard
                title="Today's Complaints"
                value={calculatedMetrics.todaysComplaints}
                change="new today"
                trend="neutral"
                icon={<Zap />}
                color="highlight"
                delay="0.5s"
              />
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="glass-filter-panel">
                <div className="filter-header">
                  <h3>Filter Complaints</h3>
                  <button className="clear-filters" onClick={clearFilters}>
                    Clear All
                  </button>
                </div>

                <div className="filter-grid">
                  <div className="filter-group">
                    <label>Status</label>
                    <div className="filter-chips">
                      {['All', 'New', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map(status => (
                        <button
                          key={status}
                          className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                          onClick={() => setStatusFilter(status)}
                          style={{
                            '--chip-color': STATUS_COLORS[status] || 'var(--primary)'
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Priority</label>
                    <div className="filter-chips">
                      {['All', 'High', 'Medium', 'Low'].map(priority => (
                        <button
                          key={priority}
                          className={`filter-chip ${priorityFilter === priority ? 'active' : ''}`}
                          onClick={() => setPriorityFilter(priority)}
                          style={{
                            '--chip-color': PRIORITY_COLORS[priority] || 'var(--primary)'
                          }}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Time Range</label>
                    <select
                      className="glass-select"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last quarter</option>
                      <option>Last year</option>
                      <option>All time</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="charts-section">
              {/* Trend Chart */}
              <div className="glass-card chart-container">
                <div className="chart-header">
                  <div className="chart-title">
                    <TrendingUp size={20} />
                    <h3>Monthly Complaint Trends</h3>
                  </div>
                  <select className="chart-select">
                    <option>Last 6 months</option>
                    <option>Last year</option>
                  </select>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis
                        dataKey="month"
                        stroke="rgba(255, 255, 255, 0.5)"
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <YAxis
                        stroke="rgba(255, 255, 255, 0.5)"
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#10B981"
                        strokeWidth={3}
                        fill="url(#trendGradient)"
                        name="Total"
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="transparent"
                        name="Resolved"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="glass-card chart-container status-chart">
                <div className="chart-header">
                  <div className="chart-title">
                    <PieChartIcon size={20} />
                    <h3>Status Distribution</h3>
                  </div>
                </div>
                <div className="chart-wrapper pie-chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  {statusData.map((entry, index) => (
                    <div key={index} className="admin-legend-item">
                      <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                      <span>{entry.name}</span>
                      <span className="legend-value">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Department Performance & Recent Complaints */}
            <div className="content-section">
              {/* Department Performance */}
              <div className="glass-card performance-card">
                <div className="card-header">
                  <div className="card-title">
                    <BarChart3 size={20} />
                    <h3>Top Departments</h3>
                  </div>
                  <button className="view-all">
                    View All <FileText size={14} />
                  </button>
                </div>
                <div className="performance-list">
                  {departmentData.length > 0 ? departmentData.map((dept, index) => (
                    <div key={index} className="performance-item">
                      <div className="dept-info">
                        <div className="dept-rank">#{index + 1}</div>
                        <div className="dept-name">{dept.name}</div>
                      </div>
                      <div className="dept-stats">
                        <div className="dept-value">{dept.value} complaints</div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(dept.value / Math.max(...departmentData.map(d => d.value), 1)) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <p>No department data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Complaints Table */}
              <div className="glass-card complaints-card">
                <div className="card-header">
                  <div className="card-title">
                    <FileText size={20} />
                    <h3>Recent Complaints</h3>
                    <span className="count-badge">{filteredComplaints.length}</span>
                  </div>
                  <div className="card-actions">
                    <button className="glass-btn glass-btn-secondary">
                      <MessageSquare size={16} /> Bulk Action
                    </button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Topic</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentComplaints.map((complaint) => (
                        <tr key={complaint.id} className="table-row">
                          <td className="complaint-id">
                            <span className="id-badge">#{complaint.id?.toString().padStart(4, '0')}</span>
                          </td>
                          <td className="complaint-topic">
                            <div className="topic-content">
                              <span className="topic-text">{complaint.topic}</span>
                              {complaint.description && (
                                <span className="topic-desc">{complaint.description.substring(0, 30)}...</span>
                              )}
                            </div>
                          </td>
                          <td className="complaint-dept">
                            <span className="dept-badge">{complaint.department}</span>
                          </td>
                          <td className="complaint-priority">
                            <span
                              className="priority-badge"
                              style={{
                                backgroundColor: `${PRIORITY_COLORS[complaint.priority] || PRIORITY_COLORS['Medium']}20`,
                                color: PRIORITY_COLORS[complaint.priority] || PRIORITY_COLORS['Medium']
                              }}
                            >
                              {complaint.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="complaint-date">
                            {new Date(complaint.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="complaint-status">
                            <div className="status-dropdown">
                              <select
                                value={complaint.status}
                                onChange={(e) => handleStatusUpdate(complaint.id, e.target.value)}
                                disabled={updatingStatus[complaint.id]}
                                className="status-select"
                                style={{
                                  '--status-color': STATUS_COLORS[complaint.status] || '#94A3B8'
                                }}
                              >
                                {Object.keys(STATUS_COLORS).map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              {updatingStatus[complaint.id] && (
                                <div className="updating-spinner"></div>
                              )}
                            </div>
                          </td>
                          <td className="complaint-actions">
                            <button className="action-btn view-btn">
                              <Eye size={16} />
                            </button>
                            <button className="action-btn more-btn">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredComplaints.length === 0 && (
                    <div className="empty-state">
                      <FileText size={48} />
                      <p>No complaints match your filters</p>
                      <button className="glass-btn glass-btn-secondary" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="table-footer">
                  <div className="footer-info">
                    Showing {Math.min((currentPage - 1) * 8 + 1, filteredComplaints.length)} - {Math.min(currentPage * 8, filteredComplaints.length)} of {filteredComplaints.length} complaints
                  </div>
                  <div className="footer-pagination">
                    <button
                      className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>

                    {[...Array(Math.ceil(filteredComplaints.length / 8))].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      className={`pagination-btn ${currentPage === Math.ceil(filteredComplaints.length / 8) ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredComplaints.length / 8)))}
                      disabled={currentPage === Math.ceil(filteredComplaints.length / 8)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <footer className="glass-footer">
            <div className="footer-stats">
              <div className="footer-stat">
                <span className="stat-label">Avg. Response Time</span>
                <span className="stat-value">{calculatedMetrics.avgResolutionTime.toFixed(1)}h</span>
              </div>
              <div className="footer-stat">
                <span className="stat-label">Satisfaction Rate</span>
                <span className="stat-value">{calculatedMetrics.satisfactionRate}%</span>
              </div>
              <div className="footer-stat">
                <span className="stat-label">Resolution Rate</span>
                <span className="stat-value">{calculatedMetrics.resolutionRate}%</span>
              </div>
              <div className="footer-stat">
                <span className="stat-label">Today's New</span>
                <span className="stat-value">{calculatedMetrics.todaysComplaints}</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

// KPI Card Component
const KpiCard = ({ title, value, change, trend, icon, color, delay }) => (
  <div
    className={`glass-card kpi-card kpi-${color}`}
    style={{ animationDelay: delay }}
  >
    <div className="kpi-content">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className={`kpi-change ${trend}`}>
          {trend === 'up' && <ArrowUpRight size={14} />}
          {trend === 'down' && <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-trend">
        <div className="trend-line">
          <div className="trend-fill"></div>
        </div>
      </div>
    </div>
    <div className="kpi-icon">
      {icon}
    </div>
  </div>
);

export default Admin;