import { useUser } from "../context/UserContext";
import AccountForm from "../forms/AccountForm";
import authService from "../services/authService";
import userService from "../services/userService";
import reviewService from "../services/reviewService";
import { useDispatch } from "react-redux";
import { logout } from "../store/AuthSlice";
import { useEffect, useState } from "react";
import { Star, Clock, CheckCircle, AlertCircle, MapPin, Edit2, LogOut, X, Navigation, Shield, ShieldAlert } from "lucide-react";
import "./Account.css";

const AccountPage = () => {
  const { user, loading } = useUser();
  const dispatch = useDispatch();

  // Profile State
  const [photosize, setphotosize] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editUser, setEditUser] = useState(false);

  // Location State
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // Complaint & Review State
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Toggles
  const togglephotosize = () => setphotosize(!photosize);
  const editingToggle = () => setEditing(!editing);
  const editUserToggle = () => {
    setEditUser(!editUser);
    setEditing(false);
  };

  // Fetch User Complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await reviewService.getMyReviews();
        setComplaints(res.data);
      } catch (err) {
        console.error("Failed to load complaints:", err);
      } finally {
        setComplaintsLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const updatedProfile = await userService.updateProfile({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationMessage(
            updatedProfile.municipality_name
              ? `📍 Location set! Municipality: ${updatedProfile.municipality_name}`
              : "Location updated successfully."
          );
        } catch (err) {
          console.error(err);
          setLocationMessage("Failed to update location.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setLocationMessage("Unable to fetch your location.");
        setLocationLoading(false);
      }
    );
  };

  // Review Logic
  const openReviewModal = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setRating(5);
    setFeedback("");
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return alert("Please write some feedback.");

    setSubmittingReview(true);
    try {
      const data = {
        complaint: selectedComplaintId,
        rating,
        feedback
      };

      const res = await reviewService.createReview(data);

      // Update the UI
      setComplaints(prev => prev.map(c =>
        c.id === selectedComplaintId
          ? { ...c, review: res.data }
          : c
      ));

      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review. It might be already reviewed.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculate progress based on status
  const getProgressWidth = (status) => {
    switch (status) {
      case 'Pending': return '33%';
      case 'In Progress': return '66%';
      case 'Resolved': return '100%';
      default: return '0%';
    }
  };

  // Get progress marker position
  const getMarkerPosition = (status) => {
    switch (status) {
      case 'Pending': return '33%';
      case 'In Progress': return '66%';
      case 'Resolved': return '100%';
      default: return '0%';
    }
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (!user) return <p className="no-user">Please log in to view your account.</p>;

  // Filter lists
  const activeComplaints = complaints.filter(c => c.status !== "Resolved");
  const resolvedComplaints = complaints.filter(c => c.status === "Resolved");

  return (
    <>
      <div className="account-page-global">

        {/* EDIT USER MODAL */}

        {editUser && (

          <div className="account-form-popup">
            <div className="account-form glass-card">
              <h3 className="edit-title">Edit Profile</h3>
              <span className="close-btn" onClick={editUserToggle}>&times;</span>
              <AccountForm user={user} onClose={editUserToggle} />
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {showReviewModal && (
          <div className="modal-overlay">
            <div className="review-modal glass-card">
              <h3>Rate Resolution</h3>
              <p>How was the service provided?</p>

              <form onSubmit={submitReview}>
                <div className="star-rating-modal">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`star ${star <= rating ? "filled" : ""}`}
                      onClick={() => setRating(star)}
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  ))}
                </div>

                <textarea
                  placeholder="Share your experience... What went well? What could be improved?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                ></textarea>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submittingReview}>
                    {submittingReview ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="account-container">
          {/* LEFT SECTION: PROFILE CARD */}
          <div className="account-header-card glass-card">
            <div className="edit-menu">
              <svg
                onClick={editingToggle}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
              {editing && (
                <div className="edit-options">
                  <button onClick={editUserToggle}>
                    <Edit2 size={14} /> Edit Profile
                  </button>
                  <button onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>

            <div className="profile-top">
              <div className="profile-img-wrapper">
                <img
                  src={user.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face"}
                  alt="Profile"
                  onClick={togglephotosize}
                />
              </div>
              <div className="profile-details">
                <h2>{user.user.username}</h2>
                <p className="designation">{user.designation || "Citizen"}</p>
                <p className="designation">{user.phone || "Undisclosed"}</p>

                <div className="badge-row">
                  <span className="municipality-badge">
                    <MapPin size={14} /> {user.municipality_name || "No Municipality Assigned"}
                  </span>
                </div>

                {/* INTEGRITY SCORE SECTION */}
                <div className={`integrity-section ${(user.honesty_score ?? 100) < 30 ? "blocked" : (user.honesty_score ?? 100) < 70 ? "warning" : ""}`}>
                  <div className="integrity-header">
                    <div className="integrity-label">
                      <Shield size={18} className="integrity-icon" />
                      <span>Integrity Score</span>
                    </div>
                    <span className={`score-badge ${(user.honesty_score ?? 100) < 30 ? "critical" : (user.honesty_score ?? 100) < 70 ? "warning" : "good"}`}>
                      {user.honesty_score ?? 100}/100
                    </span>
                  </div>

                  <div className="integrity-bar-track">
                    <div
                      className={`integrity-bar-fill ${(user.honesty_score ?? 100) < 30 ? "critical" : (user.honesty_score ?? 100) < 70 ? "warning" : "good"}`}
                      style={{ width: `${user.honesty_score ?? 100}%` }}
                    />
                  </div>
                  <p className="integrity-message">
                    {(user.honesty_score ?? 100) < 30 && <ShieldAlert size={16} />}
                    <span>
                      {(user.honesty_score ?? 100) < 30
                        ? "CRITICAL: Your score is too low. Complaint submission blocked."
                        : "Maintain a high score by reporting genuine issues to help the community."}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="location-actions">
              <button
                className="location-btn"
                onClick={handleSetLocation}
                disabled={locationLoading}
              >
                <Navigation size={18} />
                {locationLoading ? "Locating..." : "Update GPS Location"}
              </button>
              {locationMessage && <p className="success-msg">{locationMessage}</p>}
            </div>
          </div>

          {/* RIGHT SECTION: COMPLAINTS */}
          <div className="complaints-section glass-card">

            {/* ACTIVE COMPLAINTS */}
            <h3 className="section-title">
              <AlertCircle size={20} /> Active Complaints ({activeComplaints.length})
            </h3>
            <div className="complaints-list">
              {complaintsLoading ? (
                <div className="loading-spinner"></div>
              ) : activeComplaints.length === 0 ? (
                <div className="empty-msg">
                  No active complaints. Your reports will appear here.
                </div>
              ) : (
                activeComplaints.map((c) => (
                  <div key={c.id} className="complaint-card active">
                    <div className="card-header">
                      <h4>{c.topic}</h4>
                      <span className={`status-badge ${c.status.toLowerCase().replace(" ", "-")}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="card-date">
                      <Clock size={14} /> Reported on {new Date(c.created_at).toLocaleDateString()}
                    </p>
                    <p className="card-desc">{c.description.substring(0, 100)}...</p>

                    <div className="progress-section">
                      <div className="progress-label">
                        <span>Status Progress</span>
                        <span>{c.status}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: getProgressWidth(c.status) }}
                        />
                        <div
                          className="progress-marker"
                          style={{ left: getMarkerPosition(c.status) }}
                        />
                      </div>
                      {c.lastupdate && (
                        <p className="last-update">
                          <Clock size={12} />
                          Last updated: {new Date(c.lastupdate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RESOLVED COMPLAINTS */}
            <h3 className="section-title mt-4">
              <CheckCircle size={20} /> Resolution History ({resolvedComplaints.length})
            </h3>
            <div className="complaints-list">
              {resolvedComplaints.length === 0 ? (
                <div className="empty-msg">
                  No resolved complaints yet. Completed reports will appear here.
                </div>
              ) : (
                resolvedComplaints.map((c) => (
                  <div key={c.id} className="complaint-card resolved">
                    <div className="card-header">
                      <h4>{c.topic}</h4>
                      <span className="status-badge resolved">
                        <CheckCircle size={12} /> Resolved
                      </span>
                    </div>
                    <p className="card-date">
                      <Clock size={14} /> Resolved on {new Date(c.updated_at || c.lastupdate).toLocaleDateString()}
                    </p>
                    <p className="card-desc">{c.description.substring(0, 80)}...</p>

                    {/* Progress Section for Resolved */}
                    <div className="progress-section">
                      <div className="progress-label">
                        <span>Status Progress</span>
                        <span>Resolved</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '100%' }} />
                        <div className="progress-marker" style={{ left: '100%' }} />
                      </div>
                    </div>

                    {/* Review Display or Button */}
                    {c.review ? (
                      <div className="review-display">
                        <div className="review-header">
                          <div className="stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`star-icon ${star <= c.review.rating ? "" : "empty"}`}
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                              </svg>
                            ))}
                          </div>
                          <h5>Your Review</h5>
                        </div>
                        <p className="feedback-text">"{c.review.feedback}"</p>
                      </div>
                    ) : (
                      <button
                        className="give-feedback-btn"
                        onClick={() => openReviewModal(c.id)}
                      >
                        <Star size={16} /> Rate & Review Resolution
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Full Size Image Popup */}
        {photosize && (
          <div className="logo-big">
            <X
              size={32}
              onClick={togglephotosize}
              style={{ cursor: 'pointer', position: 'absolute', top: '2rem', right: '2rem', color: 'white' }}
            />
            <img
              src={user.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&h=800&fit=crop&crop=face"}
              alt="Profile"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default AccountPage;