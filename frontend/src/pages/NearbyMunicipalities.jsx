import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./NearbyMunicipalities.css";

const NearbyMunicipalities = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading nearby municipalities...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (municipalities.length === 0) {
    return (
      <div className="no-results">
        No nearby municipalities found. Please verify your location.
      </div>
    );
  }

  return (
    <div className="municipality-page">
      <h1 className="page-title">🏙️ Nearby Municipalities</h1>
      <div className="municipality-grid">
        {municipalities.map((muni) => (
          <div
            key={muni.id}
            className="municipality-card"
            onClick={() => navigate(`/municipality/${muni.id}/complaints`)}
          >
            <h3>{muni.name}</h3>
            <p>{muni.district}</p>
            <p className="state">{muni.state}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyMunicipalities;
