import React from "react";
import "./MunicipalityCard.css";

const MunicipalityCard = ({ muni }) => {
  return (
    <div className="municipality-card">
      <div className="municipality-header">
        <h2>{muni.name}</h2>
      </div>
      <div className="municipality-body">
        <p><strong>District:</strong> {muni.district}</p>
        <p><strong>State:</strong> {muni.state}</p>
        <p><strong>Latitude:</strong> {muni.latitude}</p>
        <p><strong>Longitude:</strong> {muni.longitude}</p>
        <p><strong>Distance:</strong> {muni.distance_km} km away</p>
      </div>
    </div>
  );
};

export default MunicipalityCard;
