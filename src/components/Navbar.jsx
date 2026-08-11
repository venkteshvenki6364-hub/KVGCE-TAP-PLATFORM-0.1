import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const navLinks = [
  {
    id: "home",
    label: "Home",
    href: "#home",
  },
  {
    id: "about",
    label: "About",
    href: "#about",
  },
  {
    id: "how-it-works",
    label: "How It Works",
    href: "#how-it-works",
  },
  {
    id: "contact",
    label: "Contact Us",
    href: "#contact",
  },
];

function Navbar({ activeSection = "home" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* =========================
            COLLEGE BRAND
        ========================== */}
        <a
          href="#home"
          className="college-brand"
          onClick={closeMenu}
        >
          <img
            src="/KVGCE_logo.png"
            alt="KVG College of Engineering Logo"
            className="college-logo"
          />

          <div className="college-info">
            <h1>KVG College of Engineering</h1>

            <p className="college-tagline">
              Academy of Liberal Education(R)
            </p>

            <p className="college-subtext">
              VTU Affiliated &amp; AICTE Recognized • Sullia-574327
            </p>
          </div>
        </a>

        {/* =========================
            MOBILE MENU BUTTON
        ========================== */}
        <button
          type="button"
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* =========================
            NAVIGATION
        ========================== */}
        <nav
          id="primary-navigation"
          className={`nav-menu ${menuOpen ? "is-open" : ""}`}
        >
          {/* NAV LINKS */}
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                className={`nav-link ${
                  isActive ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            );
          })}

          {/* =========================
              LOGIN BUTTON
          ========================== */}
          <Link
            to="/login"
            className="login-btn"
            onClick={closeMenu}
          >
            <svg
              className="login-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.69-8 6v1h16v-1c0-3.31-3.58-6-8-6Z" />
            </svg>

            <span>Login</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;