import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Leaf, User, Building, ArrowRight, Loader2, Lock, Mail, Phone, ShieldCheck } from "lucide-react";

import { useUser } from "../context/UserContext"; // Import useUser

import { login as authLogin } from "../store/AuthSlice";
import authService from "../services/authService";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { fetchProfile } = useUser(); // Get fetchProfile

  const { register, handleSubmit, reset } = useForm();

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMunicipality, setIsMunicipality] = useState(false);

  // Municipality State
  const [otpSent, setOtpSent] = useState(false);
  const [mEmail, setMEmail] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mPassword, setMPassword] = useState("");
  const [mOtp, setMOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setIsMunicipality(!isMunicipality);
    reset();
    setMEmail("");
    setMPhone("");
    setMPassword("");
    setMOtp("");
    setOtpSent(false);
    setError("");
    setSuccessMsg("");
  };

  const handleUserLogin = async (data) => {
    setError("");
    setLoading(true);
    try {
      const response = await authService.login(data.email, data.password);
      if (response && response.user) {
        dispatch(authLogin({ userData: response.user }));
        const profile = await fetchProfile(); // Update context and wait for result
        if (profile) {
          navigate("/");
        } else {
          // Fallback if profile fetch fails despite login success (rare)
          setError("Login successful but failed to load profile. Please refresh.");
          navigate("/");
        }
      } else {
        setError(response.error || "Login failed.");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!mEmail || !mPhone || !mPassword) {
      setError("Email, Phone, and Password are required.");
      return;
    }

    setLoading(true);
    try {
      await authService.sendMunicipalityOtp(mEmail, mPhone, mPassword);
      setSuccessMsg("OTP sent to your phone number.");
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!mOtp) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyMunicipalityOtp(mPhone, mOtp);
      if (response?.token && response?.user) {
        dispatch(authLogin({ userData: response.user }));

        const profile = await fetchProfile(); // Update context

        if (profile) {
          navigate(`/admin/${response.municipality_id}`);
        } else {
          navigate(`/admin/${response.municipality_id}`);
        }
      } else {
        setError("Invalid OTP response.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">

        {/* LEFT PANEL - Decorative */}
        <motion.div
          className="login-decoration"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="decoration-content">
            <div className="logo-area">
              <Leaf size={48} className="text-white mb-4" />
              <h1>EcoCity Connect</h1>
            </div>
            <p className="decoration-text">
              Empowering communities with smart governance and sustainable solutions.
            </p>
            <div className="feature-badges">
              <span className="badge"><ShieldCheck size={14} /> Secure</span>
              <span className="badge"><Building size={14} /> Municipal</span>
              <span className="badge"><User size={14} /> Citizen</span>
            </div>
          </div>
          <div className="decoration-overlay"></div>
        </motion.div>

        {/* RIGHT PANEL - Form */}
        <motion.div
          className="login-form-container"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="form-header">
            <h2>{isMunicipality ? "Municipality Portal" : "Welcome Back"}</h2>
            <p className="sub-text">
              {isMunicipality
                ? "Official access for municipal administration"
                : "Login to report issues and track progress"}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="role-toggle">
            <button
              className={`toggle-btn ${!isMunicipality ? "active" : ""}`}
              onClick={() => isMunicipality && handleToggle()}
            >
              <User size={16} /> Citizen
            </button>
            <button
              className={`toggle-btn ${isMunicipality ? "active" : ""}`}
              onClick={() => !isMunicipality && handleToggle()}
            >
              <Building size={16} /> Official
            </button>
          </div>

          {error && (
            <motion.div
              className="alert error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              className="alert success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {successMsg}
            </motion.div>
          )}

          {!isMunicipality ? (
            /* USER LOGIN FORM */
            <form onSubmit={handleSubmit(handleUserLogin)} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    {...register("email", { required: true })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password", { required: true })}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Sign In"} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* MUNICIPALITY LOGIN FORM */
            <div className="auth-form">
              {!otpSent ? (
                <form onSubmit={handleGenerateOtp}>
                  <div className="form-group">
                    <label>Official Email</label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input
                        type="email"
                        placeholder="admin@municipality.gov"
                        value={mEmail}
                        onChange={(e) => setMEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Registered Phone</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={mPhone}
                        onChange={(e) => setMPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={mPassword}
                        onChange={(e) => setMPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Generate OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label>Enter OTP</label>
                    <div className="input-with-icon">
                      <ShieldCheck size={18} />
                      <input
                        type="text"
                        placeholder="6-digit OTP"
                        maxLength="6"
                        value={mOtp}
                        onChange={(e) => setMOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                  </button>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => { setOtpSent(false); setSuccessMsg(""); setError(""); }}
                  >
                    Back to credentials
                  </button>
                </form>
              )}
            </div>
          )}

          {!isMunicipality && (
            <p className="footer-text">
              Don't have an account? <Link to="/signup">Create one now</Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Login;