import  { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import "./Header.css";
import logo from "../../assets/ChatGPT Image Oct 15, 2025, 12_16_52 AM (1).png";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header>
        <nav>
          <div className="logo">
            <Link to="/">
              <img src={logo} alt="College Logo" />
              <span>PGRP</span>
            </Link>
          </div>
          
          <div className={`nav_content ${isMenuOpen ? 'active' : ''}`}>
            <ul>
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </NavLink>
              </li>
              {/* <li>
                <NavLink 
                  to="/clubs" 
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Clubs
                </NavLink>
              </li> */}
              <li>
                <NavLink 
                  to="/NearbyMunicipalities"
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Nearby Municipalities
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </NavLink>
              </li>
            </ul>
          </div>
          
          <div className="login">
            <NavLink to="/profile">
              <button className="login-btn">Account</button>
            </NavLink>
          </div>
          <div className="login">
            <NavLink to="/login">
              <button className="login-btn">Login</button>
            </NavLink>
          </div>
          
          <div className="hamburger" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>
      </header>
    </>
  );
}

export default Header;