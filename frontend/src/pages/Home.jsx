import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  BarChart3,
  Users,
  BellRing,
  Database,
  Globe2,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Building,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import complaintService from "../services/complaintService";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Home.css";

export default function HomePage() {
  const [trendingIssues, setTrendingIssues] = useState([]);
  const [marqueeComplaints, setMarqueeComplaints] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const marqueeRef = useRef(null);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const [isManuallyScrolling, setIsManuallyScrolling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();
  const { userData: user, status: isLoggedIn } = useSelector((state) => state.auth);

  const handleDashboardClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    // Redirect to Nearby Municipalities regardless of whether municipality is set
    // The NearbyMunicipalities page handles the "no municipality" case
    navigate("/NearbyMunicipalities");
  };



  const PER_PAGE = 8;
  const MARQUEE_COUNT = 10;
  const loadTrendingIssues = async (pageNumber = 1) => {
    if (loading) return; // prevent double fetch
    try {
      setLoading(true);

      const municipalityId = user?.municipality?.id;
      const data = await complaintService.getRankedComplaints(pageNumber, municipalityId);
      const results = data.results || [];

      // backend-driven hasMore
      const fetchedSoFar = (pageNumber - 1) * PER_PAGE + results.length;
      setHasMore(fetchedSoFar < data.total);

      if (pageNumber === 1) {
        setTrendingIssues(results);
      } else {
        // Just show the new page's data, not accumulated
        setTrendingIssues(results);
      }
    } catch (err) {
      console.error("Failed to fetch trending issues:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (page === 1) {
      setMarqueeComplaints(trendingIssues.slice(0, MARQUEE_COUNT));
    }
  }, [page, trendingIssues]);

  useEffect(() => {
    loadTrendingIssues(page);
  }, [page]);

  const infiniteMarqueeData = [...marqueeComplaints, ...marqueeComplaints];

  useEffect(() => {
    if (!marqueeRef.current || marqueeComplaints.length === 0) return;

    let rafId;
    const speed = 0.8; // Increased for better visibility

    const animate = () => {
      if (!isMarqueePaused && !isManuallyScrolling) {
        marqueeRef.current.scrollLeft += speed;

        if (marqueeRef.current.scrollLeft >= marqueeRef.current.scrollWidth / 2) {
          marqueeRef.current.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [marqueeComplaints, isMarqueePaused, isManuallyScrolling]);

  // Reset scroll when marquee changes
  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.scrollLeft = 0;
    }
  }, [marqueeComplaints]);

  // --------------------------
  // 5️⃣ Refresh feed
  // --------------------------
  const refreshTrendingFeed = () => {
    setPage(1);       // triggers fetch page 1
    setHasMore(true); // allow load more again
  };

  // --------------------------
  // 6️⃣ Derived list (exclude marquee) - Always slice out first MARQUEE_COUNT items
  const listIssues = trendingIssues.slice(MARQUEE_COUNT);

  // Marquee animation controls
  const scrollMarquee = (direction) => {
    if (!marqueeRef.current) return;

    setIsManuallyScrolling(true);

    const scrollAmount = 300;

    marqueeRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });

    // resume auto-scroll after user interaction
    setTimeout(() => {
      setIsManuallyScrolling(false);
    }, 1200);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Static data for Features
  const features = [
    {
      icon: <MapPin size={32} />,
      title: "Complaint Mapping",
      desc: "View live complaints on an interactive city map for better situational awareness.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <BarChart3 size={32} />,
      title: "Smart Analytics",
      desc: "Track trends, departments, and resolution efficiency through insightful dashboards.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <BellRing size={32} />,
      title: "Real-Time Alerts",
      desc: "Citizens and authorities receive instant notifications when complaint status changes.",
      color: "from-lime-500 to-green-600"
    },
    {
      icon: <Users size={32} />,
      title: "Citizen First",
      desc: "A clean, mobile-friendly interface built for easy reporting and accountability.",
      color: "from-teal-500 to-cyan-600"
    },
    {
      icon: <Database size={32} />,
      title: "Data-Driven Governance",
      desc: "Municipalities gain transparency with organized, data-backed performance metrics.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: <ShieldCheck size={32} />,
      title: "Verified System",
      desc: "Authenticated users ensure reliable and secure submissions across all zones.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <MessageCircle size={32} />,
      title: "Interactive Feedback",
      desc: "Citizens can comment, attach photos, and communicate with municipal officers.",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: <Globe2 size={32} />,
      title: "SmartCity Vision",
      desc: "A step towards connected and sustainable cities powered by civic technology.",
      color: "from-purple-500 to-pink-600"
    },
  ];



  return (
    <div className="homepage-container">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <motion.div
          className="hero-content relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="hero-title">
            <span style={{ color: "#34d399" }}> P</span>ublic <span style={{ color: "#34d399" }}> G</span>reivance <span style={{ color: "#34d399" }}> R</span>edressal <span style={{ color: "#34d399" }}> P</span>ortal
          </h1>
          <p className="hero-subtitle">
            Empowering citizens to report, track, and resolve city issues —
            making urban governance transparent, efficient, and citizen-centric.
          </p>
          <div className="hero-buttons">
            <button className="btn-outline" onClick={handleDashboardClick}>
              <TrendingUp size={20} />
              View Dashboard
            </button>
          </div>
        </motion.div>
      </section>

      {/* 🏃 HORIZONTAL MARQUEE SECTION */}
      <section className="marquee-section">
        <div className="section-header">
          <TrendingUp className="text-emerald-500" size={28} />
          <h2>🔥 Trending Now</h2>
          <span className="marquee-badge">{marqueeComplaints.length} Active Issues</span>
        </div>

        <div className="marquee-container">
          <button
            className="marquee-nav-btn left"
            onClick={() => scrollMarquee('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="marquee-track"
            ref={marqueeRef}
            onMouseEnter={() => setIsMarqueePaused(true)}
            onMouseLeave={() => setIsMarqueePaused(false)}
          >
            {infiniteMarqueeData.map((complaint, index) => (
              <motion.div
                key={`${complaint.id}-${index}`}
                className="marquee-card"
                whileHover={{ y: -5 }}
              >
                <div className="marquee-card-header">
                  <div className="marquee-card-badge">
                    <Building size={14} />
                    {complaint.municipality?.name || "General"}
                  </div>
                  <span className={`status-badge status-${complaint.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                    {complaint.status || "Pending"}
                  </span>
                </div>

                <h4 className="marquee-card-title">{complaint.topic}</h4>

                <p className="marquee-card-desc">
                  {complaint.description?.length > 100
                    ? `${complaint.description.substring(0, 100)}...`
                    : complaint.description || "No description provided"}
                </p>

                <div className="marquee-card-details">
                  <div className="detail-item">
                    <Clock size={14} />
                    <span>{formatDate(complaint.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={14} />
                    <a
                      href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-link"
                    >
                      View Location
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="marquee-card-footer">
                  <div className="footer-stat">
                    <span className="stat-label">Department:</span>
                    <span className="stat-value">{complaint.department}</span>
                  </div>
                  <div className="footer-stat">
                    <span className="stat-label">Score:</span>
                    <span className={`score-value ${complaint.score > 0 ? 'positive' : 'negative'}`}>
                      {complaint.score}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            className="marquee-nav-btn right"
            onClick={() => scrollMarquee('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="marquee-indicator">
          <div className="indicator-dots">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`indicator-dot ${i === 0 ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 🔥 TRENDING ISSUES GRID */}
      {/* 🔥 TRENDING ISSUES GRID - ALWAYS VISIBLE BUT CONDITIONALLY CONTENT */}
      <section className="trending-section">
        <div className="section-header">
          <h2>📊 All Trending Issues</h2>
          <p className="section-subtitle">Sorted by community engagement and urgency</p>
        </div>

        {/* STATE 1: NOT LOGGED IN -> LOCKED */}
        {!isLoggedIn ? (
          <div className="trending-locked-container">
            {/* Skeleton Background */}
            <div className="skeleton-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-body"></div>
                  <div className="skeleton-footer"></div>
                </div>
              ))}
            </div>
            <div className="trending-blur-overlay"></div>

            <div className="locked-card">
              <div className="locked-icon-wrapper">
                <Lock size={40} strokeWidth={2.5} />
              </div>
              <h3 className="locked-title">Restricted Access</h3>
              <p className="locked-desc">
                You won't be able to see the trending issues section if you didn't login.
                Join your community to view and track local issues.
              </p>
              <button onClick={() => navigate("/login")} className="auth-btn">
                Login to View
              </button>
            </div>
          </div>
        ) : !user?.municipality ? (
          /* STATE 2: LOGGED IN BUT NO MUNICIPALITY -> WAITING FOR LOCATION PROMPTER */
          <div className="trending-locked-container">
            {/* Skeleton Background */}
            <div className="skeleton-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-body"></div>
                  <div className="skeleton-footer"></div>
                </div>
              ))}
            </div>
            <div className="trending-blur-overlay"></div>

            <div className="locked-card">
              <div className="waiting-icon-wrapper">
                <MapPin size={40} className="animate-bounce" strokeWidth={2.5} />
              </div>
              <h3 className="locked-title">Locating Your Area...</h3>
              <p className="locked-desc">
                We are detecting your location to show you the most relevant issues in your municipality.
                Please allow location access in the prompt above.
              </p>
              <button className="location-wait-btn">
                Waiting for location...
              </button>
            </div>
          </div>
        ) : (
          /* STATE 3: FULL ACCESS -> SHOW GRID */
          <>
            <div className="trending-grid">
              {trendingIssues.map((issue) => {
                const getPriorityConfig = (p) => {
                  if (p >= 0.8) return { label: "High Priority", color: "bg-red-100 text-red-700 border-red-200" };
                  if (p >= 0.5) return { label: "Medium Priority", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
                  return { label: "Low Priority", color: "bg-green-100 text-green-700 border-green-200" };
                };
                const priorityConf = getPriorityConfig(issue.priority);

                return (
                  <motion.div
                    key={issue.id}
                    className="trending-card"
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* 1. Header: Department & Date */}
                    <div className="card-top-row">
                      <span className="dept-tag">{issue.department}</span>
                      <span className="date-text">{formatDate(issue.created_at)}</span>
                    </div>

                    {/* 2. Main Content */}
                    <div className="card-main">
                      <h4 className="card-title" title={issue.topic}>
                        {issue.topic?.length > 50 ? issue.topic.substring(0, 50) + "..." : issue.topic || "Untitled"}
                      </h4>
                      <div className="card-badges">
                        <span className={`status-pill ${priorityConf.color}`}>
                          {priorityConf.label}
                        </span>
                        <span className="muni-pill">
                          <Building size={12} />
                          {issue.municipality?.name || "General"}
                        </span>
                      </div>
                      <p className="card-desc">
                        {issue.description?.length > 80
                          ? issue.description.substring(0, 80) + "..."
                          : issue.description || "No details provided."}
                      </p>
                    </div>

                    {/* 3. Footer: Stats & Action */}
                    <div className="card-actions">
                      <div className="stats-group">
                        <div className="stat-pill upvote">
                          <span className="icon">⬆</span>
                          <span className="val">{issue.total_upvotes}</span>
                        </div>
                        <div className="stat-pill score" title="Engagement Score">
                          <BarChart3 size={14} />
                          <span className="val">{(issue.score || 0).toFixed(1)}</span>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-icon-btn"
                        title="View Location"
                      >
                        <MapPin size={18} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {hasMore && !loading && (
              <div className="load-more-container">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="load-more-btn"
                >
                  Load More Issues
                </button>
              </div>
            )}

            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading more issues...</p>
              </div>
            )}

            {!hasMore && !loading && trendingIssues.length > 0 && (
              <div className="end-message">
                <p>You've reached the end of trending issues</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* 🧭 HOW IT WORKS */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>🧭 How It Works</h2>
          <p className="section-subtitle">Three simple steps to get your issue resolved</p>
        </div>
        <div className="steps-container">
          <div className="step-line"></div>
          <div className="steps">
            <motion.div
              className="step"
              whileHover={{ scale: 1.05 }}
            >
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Report an Issue</h4>
                <p>Submit complaints with photos, details, and live location tagging.</p>
              </div>
            </motion.div>

            <motion.div
              className="step"
              whileHover={{ scale: 1.05 }}
            >
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Smart Routing</h4>
                <p>Complaint is auto-routed to the relevant municipal department.</p>
              </div>
            </motion.div>

            <motion.div
              className="step"
              whileHover={{ scale: 1.05 }}
            >
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Track & Resolve</h4>
                <p>Monitor progress and get notifications when resolved.</p>
              </div>
            </motion.div>
          </div>
        </div>

      </section>
      <div className="Give-padding">

      </div>

      {/* 💡 KEY FEATURES */}
      <section className="features-section">
        <div className="section-header">
          <h2>💡 Key Features</h2>
          <p className="section-subtitle">Everything you need for smart city governance</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className={`feature-card ${f.color}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)"
              }}
            >
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>SmartCity Portal</h3>
            <p>Building better cities through citizen engagement</p>
          </div>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <p className="footer-copyright">
            © 2025 SmartCity Portal | Built with ❤️ by Team Innovate
          </p>
        </div>
      </footer> */}
    </div>
  );
}