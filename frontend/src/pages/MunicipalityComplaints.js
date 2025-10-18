import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import complaintService from "../services/complaintService";
import authService from "../services/authService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import {
  faCity,
  faEdit,
  faTimes,
  faSearch,
  faFilter,
  faSort,
  faTint,
  faBolt,
  faBroom,
  faRoad,
  faBan,
  faTrash,
  faHardHat,
  faRestroom,
  faTrashAlt,
  faClipboard,
  faFolder,
  faFire,
  faCheckCircle,
  faClock,
  faHourglass,
  faThumbsUp,
  faComment,
  faMapMarkerAlt,
  faPaperclip,
  faExclamationTriangle,
  faChartBar,
  faCheck,
  faSpinner,
  faEnvelope
} from "@fortawesome/free-solid-svg-icons";
import "./MunicipalityComplaints.css";

const MunicipalityComplaints = () => {
  const { id } = useParams();
  const [municipality, setMunicipality] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("upvotes");
  const navigate = useNavigate();
  const [newComplaint, setNewComplaint] = useState({
    department: "",
    topic: "",
    description: "",
    file: null,
  });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [userLocation, setUserLocation] = useState(null);

  const DEPARTMENTS = [
    { id: "water", name: "Water", icon: faTint, color: "#3498db" },
    { id: "electricity", name: "Electricity", icon: faBolt, color: "#f39c12" },
    { id: "sanitation", name: "Sanitation", icon: faBroom, color: "#27ae60" },
    { id: "roads", name: "Roads", icon: faRoad, color: "#7f8c8d" },
    { id: "illegal-drainage", name: "Illegal Drainage", icon: faBan, color: "#8e44ad" },
    { id: "dumping", name: "Dumping", icon: faTrash, color: "#e74c3c" },
    { id: "illegal-construction", name: "Illegal Construction", icon: faHardHat, color: "#d35400" },
    { id: "public-toilets", name: "Public Toilets", icon: faRestroom, color: "#16a085" },
    { id: "garbage-collection", name: "Garbage Collection", icon: faTrashAlt, color: "#2c3e50" },
    { id: "others", name: "Others", icon: faClipboard, color: "#95a5a6" },
  ];

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Location access denied:", err);
        }
      );
    }
  }, []);

  // Fetch municipality & complaints
  useEffect(() => {
    const fetchData = async () => {
      try {
        const muniRes = await authService.apiClient.get(`/municipalities/${id}/`);
        setMunicipality(muniRes.data);

        const compRes = await complaintService.getComplaints(id);
        console.log(compRes);
        setComplaints(compRes);
        setFilteredComplaints(compRes);
      } catch (err) {
        console.error("Error loading municipality complaints:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Filter and sort complaints
  useEffect(() => {
    let filtered = [...complaints];

    // Filter by department
    if (selectedDepartment !== "All") {
      filtered = filtered.filter(complaint => 
        complaint.department.toLowerCase() === selectedDepartment.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(complaint =>
        complaint.topic.toLowerCase().includes(term) ||
        complaint.description.toLowerCase().includes(term)
      );
    }

    // Sort complaints
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "upvotes":
        return b.total_upvotes - a.total_upvotes;

      case "priority":
        // Convert priority (string) → number before comparing
        return parseFloat(b.priority) - parseFloat(a.priority);

      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);

      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);

      default:
        return 0;
    }
  });


    setFilteredComplaints(filtered);
  }, [complaints, selectedDepartment, searchTerm, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userLocation) {
      alert("Please enable location services to submit a complaint.");
      return;
    }

    const complaintData = {
      department: newComplaint.department,
      topic: newComplaint.topic,
      description: newComplaint.description,
      location: `Lat: ${userLocation.latitude}, Lng: ${userLocation.longitude}`,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      municipality_id: id,
      media: newComplaint.file,
    };

    try {
      await complaintService.createComplaint(complaintData);
      const updated = await complaintService.getComplaints(id);
      setComplaints(updated);
      setNewComplaint({ department: "", topic: "", description: "", file: null });
      setShowComplaintForm(false);
    } catch (err) {
      console.error("Failed to submit complaint:", err);
    }
  };

  const canUpvote = (complaint) => {
    if (!complaint.latitude || !complaint.longitude || !userLocation) return false;
    const R = 6371; // km
    const dLat = (complaint.latitude - userLocation.latitude) * (Math.PI / 180);
    const dLon = (complaint.longitude - userLocation.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(userLocation.latitude * (Math.PI / 180)) *
        Math.cos(complaint.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= 1; // 1 km radius
  };

  const handleUpvote = async (id) => {
    try {
      await authService.apiClient.post(`/complaints/${id}/upvote/`);
      const updated = await complaintService.getComplaints(municipality.id);
      setComplaints(updated);
    } catch (e) {
      console.error("Upvote failed", e);
    }
  };

  const toggleComments = (id) => {
    setComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCommentSubmit = async (id) => {
    const text = newComment[id];
    if (!text) return;
    try {
      await authService.apiClient.post(`/complaints/${id}/add_comment/`, { content: text });
      const updated = await complaintService.getComplaints(municipality.id);
      setComplaints(updated);
      setNewComment((prev) => ({ ...prev, [id]: "" }));
    } catch (e) {
      console.error("Comment failed", e);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved": return faCheckCircle;
      case "in progress": return faSpinner;
      case "pending": return faHourglass;
      default: return faClock;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "#27ae60";
      case "in progress": return "#f39c12";
      case "pending": return "#e74c3c";
      default: return "#95a5a6";
    }
  };

  const handleViewDashboard = () => {
    navigate(`/municipality/${id}/dashboard`);
  };

  if (loading) return (
    <div className="loading-container">
      <FontAwesomeIcon icon={faSpinner} spin size="3x" />
      <p>Loading complaints...</p>
    </div>
  );

  return (
    <div className="municipality-complaints">
      {/* Header Section */}
      <div className="complaints-header">
        <div className="header-content">
          <h1>
            <FontAwesomeIcon icon={faCity} /> {municipality?.name}
          </h1>
          <p>Report and track civic issues in your area</p>
        </div>
        <button 
          className="add-complaint-btn"
          onClick={() => setShowComplaintForm(!showComplaintForm)}
        >
          <FontAwesomeIcon icon={faEdit} /> 
          {showComplaintForm ? "Cancel" : "Report Issue"}
        </button>
        <button onClick={handleViewDashboard} className="view-dashboard-btn">
         View Dashboard
        </button>
      </div>

      {/* Complaint Form Overlay */}
      {showComplaintForm && (
        <div className="complaint-form-overlay">
          <div className="complaint-form-container">
            <div className="form-header">
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} /> Report New Issue
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowComplaintForm(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>


            </div>
            <form onSubmit={handleSubmit} className="complaint-form">
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faFolder} /> Department *
                </label>
                <select
                  value={newComplaint.department}
                  onChange={(e) => setNewComplaint({ ...newComplaint, department: e.target.value })}
                  required
                >
                  <option value="" disabled>Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faEdit} /> Topic *
                </label>
                <input
                  type="text"
                  placeholder="Brief title of your issue"
                  value={newComplaint.topic}
                  onChange={(e) => setNewComplaint({ ...newComplaint, topic: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faClipboard} /> Description *
                </label>
                <textarea
                  placeholder="Detailed description of the issue..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faPaperclip} /> Attachment (Optional)
                </label>
                <input 
                  type="file" 
                  onChange={(e) => setNewComplaint({ ...newComplaint, file: e.target.files[0] })} 
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowComplaintForm(false)}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <FontAwesomeIcon icon={faFire} /> Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="complaints-layout">
        {/* Sidebar with Department Filters */}
        <div className="sidebar">
          <h3>
            <FontAwesomeIcon icon={faFilter} /> Filters
          </h3>
          
          {/* Search */}
          <div className="filter-group">
            <label>
              <FontAwesomeIcon icon={faSearch} /> Search Complaints
            </label>
            <input
              type="text"
              placeholder="Search by topic or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>
              <FontAwesomeIcon icon={faSort} /> Sort By
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="priority">Urgent Concern</option>
              <option value="upvotes">Most Upvotes</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Departments */}
          <div className="filter-group">
            <label>
              <FontAwesomeIcon icon={faCity} /> Departments
            </label>
            <div className="department-cards">
              <div 
                className={`department-card ${selectedDepartment === "All" ? "active" : ""}`}
                onClick={() => setSelectedDepartment("All")}
              >
                <span className="dept-icon">
                  <FontAwesomeIcon icon={faFolder} />
                </span>
                <span className="dept-name">All Issues</span>
              </div>
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  className={`department-card ${selectedDepartment === dept.name ? "active" : ""}`}
                  onClick={() => setSelectedDepartment(dept.name)}
                  style={{ '--dept-color': dept.color }}
                >
                  <span className="dept-icon">
                    <FontAwesomeIcon icon={dept.icon} />
                  </span>
                  <span className="dept-name">{dept.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{filteredComplaints.length}</span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faClipboard} /> Total Issues
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {filteredComplaints.filter(c => c.status?.toLowerCase() === "resolved").length}
              </span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faCheckCircle} /> Resolved
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {filteredComplaints.filter(c => c.status?.toLowerCase() === "in progress").length}
              </span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faSpinner} /> In Progress
              </span>
            </div>
          </div>

          {/* Complaints List */}
          <div className="complaint-list">
            {filteredComplaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <h3>No complaints found</h3>
                <p>
                  {searchTerm || selectedDepartment !== "All" 
                    ? "Try adjusting your filters or search term" 
                    : "Be the first to report an issue in your area!"
                  }
                </p>
                <button 
                  className="report-first-btn"
                  onClick={() => setShowComplaintForm(true)}
                >
                  <FontAwesomeIcon icon={faEdit} /> Report First Issue
                </button>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="complaint-card">
                  <div className="complaint-header">
                    <div className="complaint-meta">
                      <span 
                        className="department-badge"
                        style={{ 
                          backgroundColor: DEPARTMENTS.find(d => 
                            d.name.toLowerCase() === complaint.department?.toLowerCase()
                          )?.color || '#95a5a6'
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={DEPARTMENTS.find(d => 
                            d.name.toLowerCase() === complaint.department?.toLowerCase()
                          )?.icon || faClipboard} 
                        /> 
                        {complaint.department}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(complaint.status) }}
                      >
                        <FontAwesomeIcon icon={getStatusIcon(complaint.status)} /> 
                        {complaint.status || 'Pending'}
                      </span>
                    </div>
                    <span className="complaint-time">
                      <FontAwesomeIcon icon={faClock} /> 
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="complaint-title">{complaint.topic}</h3>
                  <p className="complaint-description">{complaint.description}</p>

                  {complaint.media && (
                    <div className="complaint-media">
                      <a href={complaint.media} target="_blank" rel="noreferrer" className="media-link">
                        <FontAwesomeIcon icon={faPaperclip} /> View Attachment
                      </a>
                    </div>
                  )}

                  <div className="complaint-actions">
                    <button
                      className={`upvote-btn ${canUpvote(complaint) ? '' : 'disabled'}`}
                      onClick={() => handleUpvote(complaint.id)}
                      disabled={!canUpvote(complaint)}
                      title={canUpvote(complaint) ? "Upvote this issue" : "Must be within 1km to upvote"}
                    >
                      <FontAwesomeIcon icon={faThumbsUp} /> 
                      {complaint.total_upvotes || 0}
                    </button>
                    
                    <button 
                      className="comment-btn"
                      onClick={() => toggleComments(complaint.id)}
                    >
                      <FontAwesomeIcon icon={faComment} /> 
                      {complaint.comments?.length || 0}
                    </button>

                    <span className="location-indicator">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> 
                      {canUpvote(complaint) ? "Within 1km" : "Outside 1km"}
                    </span>
                  </div>

                  {comments[complaint.id] && (
                    <div className="comment-section">
                      <h4>
                        <FontAwesomeIcon icon={faComment} /> 
                        Comments ({complaint.comments?.length || 0})
                      </h4>
                      {complaint.comments?.length > 0 ? (
                        complaint.comments.map((comment) => (
                          <div key={comment.id} className="comment">
                            <div className="comment-header">
                              <strong>{comment.user}</strong>
                              <span className="comment-time">
                                <FontAwesomeIcon icon={faClock} />
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="comment-content">{comment.content}</div>
                          </div>
                        ))
                      ) : (
                        <p className="no-comments">No comments yet. Be the first to comment!</p>
                      )}
                      <div className="comment-input">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment[complaint.id] || ""}
                          onChange={(e) => setNewComment({ ...newComment, [complaint.id]: e.target.value })}
                        />
                        <button onClick={() => handleCommentSubmit(complaint.id)}>
                          <FontAwesomeIcon icon={faEdit} /> Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MunicipalityComplaints;