
import { Link } from 'react-router-dom'
import "./Footer.css"
import logo from "../../assets/collage.png"
function Footer() {
  return (
    <>
      <footer>
        <div className='main-content-of-footer'>
          <div className='mainbox1'>
            <div>
              <img src={logo} alt="PGRP Logo" />
            </div>
            <div>
              <p>Public Grievance Redressal Portal
                <br />
                Empowering citizens with transparent
                <br />
                and efficient municipal governance
                <br />
                across India
              </p>
              <br />
              <i class="fa-solid fa-envelope"></i>&nbsp;support@pgrp.gov.in
              <br />
              <i class="fa-solid fa-phone"></i>&nbsp;+91 1800-XXX-XXXX
            </div>
          </div>
          <div className="common-box-of-footer">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/NearbyMunicipalities">Municipalities</Link></li>
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>
          <div className="common-box-of-footer">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/guidelines">Guidelines</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
            </ul>
          </div>
          <div className="common-box-of-footer">
            <h3>Legal</h3>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/accessibility">Accessibility</Link></li>
            </ul>
          </div>
          <div className='mainbox1'>
            <h3>Connect With Us</h3>
            <div>
              <i class="fa-brands fa-facebook"></i>&nbsp;
              <i class="fa-brands fa-twitter"></i>&nbsp;
              <i class="fa-brands fa-linkedin"></i>&nbsp;
              <i class="fa-brands fa-instagram"></i>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer