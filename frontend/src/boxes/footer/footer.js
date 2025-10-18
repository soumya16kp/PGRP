
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
            <img src={logo} alt="Logo" />
          </div>
          <div>
            <p>DkBose College of Engineering & Technology
              <br />
              NH-44, Near Green Valley,
              <br />
              Sector-12, Indira Nagar,
              <br />
              Lucknow, Uttar Pradesh – 226016,
              <br />
              India</p>
              <br />
              <i class="fa-solid fa-envelope"></i>&nbsp;info@dkbose.ac.in
              <br />
              <i class="fa-solid fa-phone"></i>&nbsp;+91 98765 43210
          </div>
        </div>
        <div className="common-box-of-footer">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>
        <div className="common-box-of-footer">
          <h3>More To Explore</h3>
          <ul>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
          <div className="common-box-of-footer">
            <h3>Legal</h3>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        <div className='mainbox1'>
          <h3>Follow us on</h3>
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