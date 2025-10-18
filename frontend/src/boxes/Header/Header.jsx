import React from "react";
import logo from "../../assets/collage.png"
import "./Header.css"
import {Link,NavLink} from 'react-router-dom';
function Header(){
    return(
        <>
                        <header>
                <nav>
                    <div className="logo">
                         <img src={logo} alt="Logo" />
                    </div>
                    <div className="nav_content">
                        <ul>
                            <li>
                                <NavLink to="/" onClick={() => Active("Home")}>Home</NavLink>
                            </li>
                            <li>
                                <NavLink to="/clubs" onClick={() => Active("Clubs")}>Clubs</NavLink>
                            </li>
                            <li>
                                <NavLink to="/NearbyMunicipalities" onClick={() => Active("Nearby Municipalities")}>NearbyMunicipalities</NavLink>
                            </li>
                            <li>
                                <NavLink to="/about" onClick={() => Active("About")}>About</NavLink>
                            </li>
                            <li>
                                <NavLink to="/contact" onClick={() => Active("Contact")}>Contact</NavLink>
                            </li>
                        </ul>
                    </div>
                    <div className="login">
                        <NavLink to="/login">
                            <button>Login</button>
                        </NavLink>
                    </div>
                </nav>
            </header>
        </>
    )
}
export default Header