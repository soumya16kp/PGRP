import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MapPin, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../services/authService";
import userService from "../services/userService";
import { login } from "../store/AuthSlice";

import "./LocationPrompter.css";

const LocationPrompter = () => {
    const { userData: user, status } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Show prompt if user is logged in but has no municipality
        if (status && user && !user.municipality) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [user, status]);

    const handleAllowLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Update profile with coordinates
                    const updatedUser = await userService.updateProfile({
                        latitude,
                        longitude
                    });

                    if (updatedUser.municipality) {
                        setSuccess(true);
                        // Update Redux state
                        dispatch(login({ userData: updatedUser }));
                        setTimeout(() => setIsOpen(false), 2000);
                    } else {
                        setError("We couldn't find a supported municipality at your location.");
                    }

                } catch (err) {
                    console.error("Failed to update location:", err);
                    setError("Failed to update your location. Please try again.");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Geolocation denied:", err);
                setError("Location access denied. Please enable permission to continue.");
                setLoading(false);
            }
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="prompter-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="prompter-card"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="prompter-content">
                            <div className="icon-container">
                                <MapPin size={36} className="icon-map" />
                            </div>

                            <h3 className="prompter-title">
                                Locate Your City
                            </h3>
                            <p className="prompter-desc">
                                To show you relevant issues and updates, we need to identify your municipality.
                            </p>

                            {error && (
                                <div className="error-box">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="success-box"
                                >
                                    <CheckCircle2 size={18} />
                                    Municipality Assigned!
                                </motion.div>
                            ) : (
                                <button
                                    onClick={handleAllowLocation}
                                    disabled={loading}
                                    className="allow-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" /> Detecting...
                                        </>
                                    ) : (
                                        "Allow Access"
                                    )}
                                </button>
                            )}

                            {!loading && !success && (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="skip-btn"
                                >
                                    Skip for now
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LocationPrompter;
