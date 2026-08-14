import { useState } from "react";
import "./Contact.css";

const contactItems = [
  {
    label: "Address",
    value: [
      "KVG College of Engineering",
      "Sullia-574327, D.K., Karnataka",
    ],
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.1" />
      </svg>
    ),
  },

  {
    label: "Email",
    value: ["info@kvgce.ac.in"],
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },

  {
    label: "Phone",
    value: ["+91 XXXXX XXXXX"],
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 4.5 9 7c-.7 1.3-.9 2.6-.5 3.7l-1.9 1.9c1.2 2.6 3.2 4.6 5.8 5.8l1.9-1.9c1.1.4 2.4.2 3.7-.5l2.5 2.5-2.2 2.2C11.9 22 2 12.1 3.8 6.7L6.5 4.5Z" />
      </svg>
    ),
  },
];

const footerLinks = {
  quick: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Contact Us", href: "#contact" },
  ],

  platform: [
    { label: "Student", href: "#student" },
    { label: "Faculty", href: "#faculty" },
    { label: "Admin", href: "#admin" },
    { label: "Login", href: "#login" },
  ],
};

function Contact() {
  const [showMessage, setShowMessage] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    alert("Thank you! Your message has been received.");

    setShowMessage(false);
  };

  return (
    <footer className="contact-footer" id="contact">

      {/* ================= TOP FOOTER HEADER & CONTACT INFO CARDS ================= */}
      <section className="footer-hero-section">
        <div className="page-container footer-hero-grid">

          {/* LEFT TITLE BLOCK */}
          <div className="footer-title-block">
            <h2 className="footer-main-title">
              KVG College of Engineering
            </h2>
            <h3 className="footer-sub-title">
              TAP – Activity Tracking &amp; Management System
            </h3>
            <p className="footer-tagline">
              Empowering Students with Real-time Assessment &amp; Skill Development
            </p>
          </div>

          {/* RIGHT 3 CONTACT CARDS WITH SIMPLE SMALL ICONS + TEXT */}
          <div className="footer-contact-row">
            <div className="footer-contact-card">
              <div className="footer-contact-icon phone-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="footer-contact-text">
                <span className="contact-label">Call Us</span>
                <strong>+91 8257 231141</strong>
              </div>
            </div>

            <div className="footer-contact-card">
              <div className="footer-contact-icon location-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="footer-contact-text">
                <span className="contact-label">Location</span>
                <strong>Sullia-574327, D.K., Karnataka</strong>
              </div>
            </div>

            <div className="footer-contact-card">
              <div className="footer-contact-icon email-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="footer-contact-text">
                <span className="contact-label">Email Us</span>
                <strong>info@kvgce.ac.in</strong>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 4 QUICK LINKS COLUMNS ================= */}
      <div className="footer-links-section">
        <div className="page-container footer-four-columns">

          {/* COLUMN 1 */}
          <div className="footer-col brand-col">
            <h4>KVG College of Engineering</h4>
            <p>TAP – Activity Tracking &amp; Management System</p>
            <p className="sub-text">VTU Affiliated &amp; AICTE Approved Institution</p>
          </div>

          {/* COLUMN 2 */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#about">About TAP</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#contact">Contact Us</a>
          </div>

          {/* COLUMN 3 */}
          <div className="footer-col">
            <h4>TAP Modules</h4>
            <a href="#about">Aptitude Testing</a>
            <a href="#about">Coding Practice</a>
            <a href="#about">Technical Quizzes</a>
            <a href="#about">Activity Tracker</a>
          </div>

          {/* COLUMN 4 */}
          <div className="footer-col">
            <h4>User Portals</h4>
            <a href="/login">Student Portal</a>
            <a href="/login">Faculty Verifier</a>
            <a href="/login">Admin Dashboard</a>
            <a href="/login">AI Career Assistant</a>
          </div>

        </div>
      </div>

      {/* ================= COPYRIGHT ================= */}
      <div className="footer-copyright-bar">
        <div className="page-container">
          <p>
            © 2026 KVG College of Engineering. All Rights Reserved. | TAP – Student Skill Assessment &amp; Training Platform
          </p>
        </div>
      </div>

      {/* ================= STATIC FLOATING MESSAGE BUTTON ================= */}
      <button
        type="button"
        className={`message-floating ${showMessage ? "active" : ""}`}
        onClick={() => setShowMessage(!showMessage)}
        aria-label="Open message"
      >
        {showMessage ? "×" : "✉"}
      </button>

      {/* ================= MESSAGE POPUP ================= */}
      {showMessage && (
        <div className="message-popup">
          <div className="popup-header">
            <div>
              <h3>Send a Message</h3>
              <p>We'd love to hear from you.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMessage(false)}
              className="popup-close"
              aria-label="Close message"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
            />
            <textarea
              name="message"
              placeholder="Write your message..."
              rows="4"
              required
            ></textarea>
            <button
              type="submit"
              className="popup-send"
            >
              Send Message
              <span>→</span>
            </button>
          </form>
        </div>
      )}

    </footer>
  );
}

export default Contact;