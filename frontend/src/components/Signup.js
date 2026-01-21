import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Leaf, User, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Building } from "lucide-react";

import { login as authLogin } from "../store/AuthSlice";
import authService from "../services/authService";
import "./Signup.css"; // We'll reuse similar styles or create new ones

function Signup() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [serverError, setServerError] = useState("");

    const createAccount = async (data) => {
        setServerError("");
        try {
            const userData = await authService.signup(data.username, data.email, data.password);

            if (userData) {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                    dispatch(authLogin({ userData: currentUser })); // Fixed payload structure
                    navigate("/");
                }
            }
        } catch (error) {
            if (error.response) {
                const errorData = error.response.data;
                // Format Django errors
                const errorMessages = Object.keys(errorData).map(key =>
                    `${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key]}`
                ).join(' ');
                setServerError(errorMessages);
            } else {
                setServerError("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-wrapper">

                {/* LEFT PANEL - Decorative */}
                <motion.div
                    className="signup-decoration"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="decoration-content">
                        <div className="logo-area">
                            <Leaf size={48} className="text-white mb-4" />
                            <h1>Join EcoCity</h1>
                        </div>
                        <p className="decoration-text">
                            Be part of the change. Report issues, track progress, and improve your city together.
                        </p>
                        <div className="feature-badges">
                            <span className="badge"><ShieldCheck size={14} /> Verified</span>
                            <span className="badge"><User size={14} /> Active Community</span>
                        </div>
                    </div>
                    <div className="decoration-overlay"></div>
                </motion.div>

                {/* RIGHT PANEL - Form */}
                <motion.div
                    className="signup-form-container"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="form-header">
                        <h2>Create Account</h2>
                        <p className="sub-text">Start your journey towards a better city</p>
                    </div>

                    {serverError && (
                        <motion.div
                            className="alert error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {serverError}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(createAccount)} className="auth-form">

                        <div className="form-group">
                            <label>Username</label>
                            <div className="input-with-icon">
                                <User size={18} />
                                <input
                                    placeholder="Choose a username"
                                    {...register("username", { required: "Username is required" })}
                                />
                            </div>
                            {errors.username && <p className="field-error">{errors.username.message}</p>}
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-with-icon">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                                            message: "Invalid email format",
                                        },
                                    })}
                                />
                            </div>
                            {errors.email && <p className="field-error">{errors.email.message}</p>}
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} />
                                <input
                                    type="password"
                                    placeholder="Create a strong password"
                                    {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
                                />
                            </div>
                            {errors.password && <p className="field-error">{errors.password.message}</p>}
                        </div>

                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Account"} <ArrowRight size={18} />
                        </button>
                    </form>

                    <p className="footer-text">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default Signup;