import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import "./Header.css";
import { useUser } from "../../context/UserContext";
import logo from "../../assets/pgrp_logo_modern.png";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/AuthSlice";

function Header() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.status);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useUser();
  if (loading) return null;
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
                  to="/profile"
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Account
                </NavLink>
              </li>
              {user?.is_staff && (
                <li>
                  <NavLink
                    to={user?.official_municipality ? `/admin/${user.official_municipality}` : "/#"}
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    Admin
                  </NavLink>
                </li>
              )}
            </ul>
          </div>

          {!isLoggedIn ? (
            <div className="login">
              <NavLink to="/login">
                <button className="login-btn">Login</button>
              </NavLink>
            </div>
          ) : null}

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