import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MapPin, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../services/authService";
import { login } from "../store/AuthSlice";

const LocationPrompter = () => {
    const { user, status } = useSelector((state) => state.auth);
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
                    const updatedUser = await authService.updateProfile({
                        latitude,
                        longitude
                    });

                    if (updatedUser.municipality) {
                        setSuccess(true);
                        // Update Redux state
                        dispatch(login({ user: updatedUser }));
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-emerald-600 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542601906990-24bd0827f8d1?auto=format&fit=crop&q=80')] bg-cover opacity-20 mix-blend-overlay"></div>
                            <MapPin size={48} className="text-white relative z-10" />
                        </div>

                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Set Your Municipality
                            </h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                To provide you with relevant reports and local updates, we need to know your location. Please allow access to assign your nearest municipality.
                            </p>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center justify-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            {success ? (
                                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} /> Municipality Assigned!
                                </div>
                            ) : (
                                <button
                                    onClick={handleAllowLocation}
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Locating...
                                        </>
                                    ) : (
                                        "Allow Location Access"
                                    )}
                                </button>
                            )}

                            {!loading && !success && (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="mt-4 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                >
                                    Skip for now (Limited Access)
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
