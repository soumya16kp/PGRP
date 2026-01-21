import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { Building2, Users, MapPin, Calendar, RefreshCw, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import "./NearbyMunicipalities.css";

const NearbyMunicipalities = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refetchingId, setRefetchingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const response = await authService.apiClient.get("/municipalities/nearby/");
        setMunicipalities(response.data);
      } catch (err) {
        console.error("Error fetching nearby municipalities:", err);
        setError("Failed to fetch nearby municipalities.");
      } finally {
        setLoading(false);
      }
    };
    fetchNearby();
  }, []);

  const handleRefetch = async (e, id) => {
    e.stopPropagation();
    setRefetchingId(id);
    try {
      const res = await authService.apiClient.post(`/municipalities/${id}/refetch/`);
      setMunicipalities(prev => prev.map(m => m.id === id ? res.data.data : m));
    } catch (err) {
      console.error("Refetch failed:", err);
    } finally {
      setRefetchingId(null);
    }
  };

  if (loading) {
    return (
      <div className="nearby-municipalities-scope">
        <div className="nm-page">
          <div className="nm-loading-container bg-glass-panel">
            <div className="nm-spinner-glass">
              <div className="nm-spinner-ring"></div>
              <div className="nm-spinner-ring"></div>
              <div className="nm-spinner-ring"></div>
              <div className="nm-spinner-center"></div>
            </div>
            <p className="nm-loading-text">Finding nearby municipalities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nearby-municipalities-scope">
        <div className="nm-page">
          <div className="nm-error-state">
            <AlertCircle size={48} className="nm-error-icon" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (municipalities.length === 0) {
    return (
      <div className="nearby-municipalities-scope">
        <div className="nm-page">
          <div className="nm-empty-state">
            <MapPin size={48} className="nm-empty-icon" />
            <p>No nearby municipalities found.</p>
            <span>Please verify your location settings.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-municipalities-scope">
      <div className="nm-page">
        <div className="nm-header">
          <div className="nm-header-left">
            <Building2 size={32} className="nm-header-icon" />
            <div>
              <h1 className="nm-title">Nearby Municipalities</h1>
              <p className="nm-subtitle">Explore local governance in your area</p>
            </div>
          </div>
          <span className="nm-badge">{municipalities.length} Found</span>
        </div>

        <div className="nm-grid">
          {municipalities.map((muni) => (
            <div
              key={muni.id}
              className="nm-card"
              onClick={() => navigate(`/municipality/${muni.id}/complaints`)}
            >
              <div className="nm-card-top">
                <div className="nm-card-icon">
                  <Building2 size={22} />
                </div>
                <button
                  className="nm-refetch-btn"
                  onClick={(e) => handleRefetch(e, muni.id)}
                  disabled={refetchingId === muni.id}
                  title="Refresh Data"
                >
                  {refetchingId === muni.id ? (
                    <Loader2 size={16} className="nm-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </button>
              </div>

              <div className="nm-card-body">
                <h3 className="nm-card-title">{muni.name}</h3>
                <p className="nm-card-location">
                  <MapPin size={14} />
                  <span>{muni.district}, {muni.state}</span>
                </p>

                {muni.description && (
                  <p className="nm-card-desc">
                    {muni.description.length > 100
                      ? muni.description.substring(0, 100) + "..."
                      : muni.description}
                  </p>
                )}

                <div className="nm-stats-row">
                  <div className="nm-stat-box">
                    <Calendar size={16} className="nm-stat-icon" />
                    <div className="nm-stat-content">
                      <span className="nm-stat-label">EST.</span>
                      <span className="nm-stat-value">{muni.establishment_year || "—"}</span>
                    </div>
                  </div>
                  <div className="nm-stat-box">
                    <Users size={16} className="nm-stat-icon" />
                    <div className="nm-stat-content">
                      <span className="nm-stat-label">POP.</span>
                      <span className="nm-stat-value">
                        {muni.population ? Number(muni.population).toLocaleString() : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nm-card-footer">
                <span className="nm-view-link">
                  View Dashboard <ChevronRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NearbyMunicipalities;
