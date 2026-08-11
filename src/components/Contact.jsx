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

      {/* ================= CONTACT ================= */}

      <section className="contact-section">

        <div className="page-container contact-layout">

          {/* LEFT */}

          <div className="contact-copy">

            <p className="section-eyebrow">
              GET IN TOUCH
            </p>

            <h2 className="contact-title">
              KVG College of Engineering
            </h2>

            <p className="section-eyebrow">
              TAP – Activity Tracking &amp; Management System
            </p>

            <p className="contact-lead">
              Connect with the KVG TAP team for information,
              support, feedback or assistance related to the
              Student Skill Assessment &amp; Training Platform.
            </p>

            <div className="contact-details">

              {contactItems.map((item) => (
                <div
                  className="contact-item"
                  key={item.label}
                >

                  <div className="contact-icon">
                    {item.icon}
                  </div>

                  <div className="contact-item-content">

                    <h3>{item.label}</h3>

                    {item.value.map((line) => (
                      <p key={line}>
                        {line}
                      </p>
                    ))}

                  </div>

                </div>
              ))}

            </div>

          </div>


        </div>

      </section>


      {/* ================= DIVIDER ================= */}

      <div className="footer-divider"></div>


      {/* ================= FOOTER ================= */}

      <div className="footer-top">

        <div className="page-container footer-grid">

          {/* BRAND */}

          <div className="footer-brand">

            <h3>
              KVG College of Engineering
            </h3>

            <p>
              TAP – Activity Tracking &amp;
              Management System
            </p>

            <span>
              Student Skill Assessment &amp;
              Training Platform
            </span>

          </div>


          {/* QUICK LINKS */}

          <div className="footer-column">

            <h4>
              Quick Links
            </h4>

            {footerLinks.quick.map((link) => (
              <a
                key={link.label}
                href={link.href}
              >
                {link.label}
              </a>
            ))}

          </div>


          {/* PLATFORM */}

          <div className="footer-column">

            <h4>
              TAP Platform
            </h4>

            {footerLinks.platform.map((link) => (
              <a
                key={link.label}
                href={link.href}
              >
                {link.label}
              </a>
            ))}

          </div>


          {/* CONTACT */}

          <div className="footer-column">

            <h4>
              Contact
            </h4>

            <p>
              Sullia, D.K., Karnataka
            </p>

            <p>
              info@kvgce.ac.in
            </p>

            <p>
              +91 XXXXX XXXXX
            </p>

          </div>

        </div>

      </div>


      {/* ================= COPYRIGHT ================= */}

      <div className="footer-bottom">

        <div className="page-container footer-bottom-inner">

          <p>
            © 2026 KVG College of Engineering.
            All Rights Reserved.
          </p>

          <p>
            TAP – Student Skill Assessment &amp;
            Training Platform
          </p>

        </div>

      </div>


      {/* =================================================
          FLOATING MESSAGE BUTTON
      ================================================= */}

      <button
        type="button"
        className={`message-floating ${
          showMessage ? "active" : ""
        }`}
        onClick={() => setShowMessage(!showMessage)}
        aria-label="Open message"
      >

        {showMessage ? (
          "×"
        ) : (
          "✉"
        )}

      </button>


      {/* =================================================
          MESSAGE POPUP
      ================================================= */}

      {showMessage && (

        <div className="message-popup">

          <div className="popup-header">

            <div>

              <h3>
                Send a Message
              </h3>

              <p>
                We'd love to hear from you.
              </p>

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