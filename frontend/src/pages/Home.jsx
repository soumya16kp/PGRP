import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import complaintService from "../services/complaintService"; // import service
import "./Home.css";

export default function HomePage() {
  const [trendingIssues, setTrendingIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Fetch ranked complaints from backend
  const loadTrendingIssues = async () => {
    try {
      setLoading(true);
      const data = await complaintService.getRankedComplaints(page);

      if (data.results.length === 0) {
        setHasMore(false);
      } else {
        setTrendingIssues((prev) => [...prev, ...data.results]);
      }
    } catch (err) {
      console.error("Failed to fetch trending issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrendingIssues();
  }, [page]);

  // Static data for Features and Screenshots (unchanged)
  const features = [
    {
      icon: <MapPin size={32} />,
      title: "Complaint Mapping",
      desc: "View live complaints on an interactive city map for better situational awareness.",
    },
    {
      icon: <BarChart3 size={32} />,
      title: "Smart Analytics",
      desc: "Track trends, departments, and resolution efficiency through insightful dashboards.",
    },
    {
      icon: <BellRing size={32} />,
      title: "Real-Time Alerts",
      desc: "Citizens and authorities receive instant notifications when complaint status changes.",
    },
    {
      icon: <Users size={32} />,
      title: "Citizen First",
      desc: "A clean, mobile-friendly interface built for easy reporting and accountability.",
    },
    {
      icon: <Database size={32} />,
      title: "Data-Driven Governance",
      desc: "Municipalities gain transparency with organized, data-backed performance metrics.",
    },
    {
      icon: <ShieldCheck size={32} />,
      title: "Verified System",
      desc: "Authenticated users ensure reliable and secure submissions across all zones.",
    },
    {
      icon: <MessageCircle size={32} />,
      title: "Interactive Feedback",
      desc: "Citizens can comment, attach photos, and communicate with municipal officers.",
    },
    {
      icon: <Globe2 size={32} />,
      title: "SmartCity Vision",
      desc: "A step towards connected and sustainable cities powered by civic technology.",
    },
  ];

  return (
    <div className="homepage-container">
      {/* 🌆 HERO SECTION */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1>SmartCity Complaint Portal</h1>
          <p>
            Empowering citizens to report, track, and resolve city issues — making urban governance transparent,
            efficient, and citizen-centric.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Report an Issue</button>
            <button className="btn-outline">View Dashboard</button>
          </div>
        </motion.div>
      </section>

      {/* 🔥 TRENDING ISSUES */}
      <section className="trending-section">
        <h2>🔥 Trending Issues</h2>
        <div className="trending-list grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingIssues.map((issue) => (
            <motion.div
              key={issue.id}
              className="trending-card p-4 border rounded-lg shadow-sm hover:shadow-md transition-all"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <h4 className="font-semibold">{issue.topic}</h4>
              <p className="text-sm text-gray-600 mt-1">
                <b>Department:</b> {issue.department} | <b>Status:</b> {issue.status}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ⬆️ Upvotes: {issue.total_upvotes} | 🔥 Score: {issue.score}
              </p>
            </motion.div>
          ))}
        </div>

        {hasMore && !loading && (
          <div className="text-center mt-6">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Load More
            </button>
          </div>
        )}

        {loading && <p className="text-center text-gray-500 mt-4">Loading...</p>}
        {!hasMore && !loading && <p className="text-center text-gray-400 mt-4">No more trending issues.</p>}
      </section>

      {/* 🧭 HOW IT WORKS */}
      <section className="how-it-works">
        <h2>🧭 How It Works</h2>
        <div className="steps">
          <div className="step">
            <span>1️⃣</span>
            <p>Report an issue with photo, details, and live location.</p>
          </div>
          <div className="step">
            <span>2️⃣</span>
            <p>Complaint auto-routed to the relevant municipal department.</p>
          </div>
          <div className="step">
            <span>3️⃣</span>
            <p>Track progress and receive notifications when it's resolved.</p>
          </div>
        </div>
      </section>

      {/* 💡 KEY FEATURES */}
      <section className="features-section">
        <h2>💡 Key Features</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {f.icon}
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ⚙️ FOOTER */}
      <footer className="footer">
        <p>© 2025 SmartCity Portal | Built with ❤️ by Team Innovate</p>
      </footer>
    </div>
  );
}
