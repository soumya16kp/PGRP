import React from "react";
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
import "./Home.css";

export default function HomePage() {
  const trendingIssues = [
    { topic: "Pothole near Jaydev Vihar", status: "Pending", department: "Roads" },
    { topic: "Water leakage in Unit-9", status: "In Progress", department: "Water" },
    { topic: "Garbage not collected", status: "Resolved", department: "Sanitation" },
  ];

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

  const screenshots = [
    "/images/dashboard.png",
    "/images/map.png",
    "/images/complaint_form.png",
    "/images/analytics.png",
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
        <div className="trending-list">
          {trendingIssues.map((issue, i) => (
            <motion.div
              key={i}
              className="trending-card"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <h4>{issue.topic}</h4>
              <p>
                <b>Department:</b> {issue.department} | <b>Status:</b> {issue.status}
              </p>
            </motion.div>
          ))}
        </div>
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

      {/* 🖼️ PROJECT SCREENSHOTS */}
      <section className="screenshots-section">
        <h2>📸 Project Screenshots</h2>
        <div className="screenshots-grid">
          {screenshots.map((src, i) => (
            <motion.img
              key={i}
              src={src}
              alt={`screenshot-${i}`}
              className="screenshot-img"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.3 }}
            />
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
