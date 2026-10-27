import { Link } from 'react-router-dom';
import { Mail, Shield, Heart } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="footer-brand">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoIcon} alt="FeedbackHub Logo" className="footer-brand-logo" />
              <span>FeedbackHub</span>
            </h4>
            <p>
              The all-in-one customer feedback platform designed to help businesses of all sizes gather actionable insights, improve customer retention, and build better experiences.
            </p>
          </div>

          {/* Product links */}
          <div className="footer-column">
            <h5>Product</h5>
            <ul>
              <li><Link to="/#how-it-works">How It Works</Link></li>
              <li><Link to="/#about">About FeedbackHub</Link></li>
              <li><Link to="/register">Sign Up Free</Link></li>
              <li><Link to="/login">Sign In</Link></li>
            </ul>
          </div>

          {/* Solutions links */}
          <div className="footer-column">
            <h5>Use Cases</h5>
            <ul>
              <li><a href="#features">Customer Satisfaction (CSAT)</a></li>
              <li><a href="#features">Net Promoter Score (NPS)</a></li>
              <li><a href="#features">Product Feedback</a></li>
              <li><a href="#features">In-Store QR Feedback</a></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="footer-column">
            <h5>Contact & Trust</h5>
            <ul>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} />
                <span>support@feedbackhub.local</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={15} />
                <span>Secure Data Storage</span>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {currentYear} FeedbackHub. All rights reserved. Common Customer Feedback System.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Built for better customer experiences</span>
            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
          </p>
        </div>
      </div>
    </footer>
  );
}
