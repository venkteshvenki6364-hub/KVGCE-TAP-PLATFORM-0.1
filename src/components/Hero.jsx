import React, { useEffect, useState } from "react";
import "./Hero.css";

const slides = [
  {
    image: "/kvgce_college_photo.jpg",
    welcome: "Welcome to",
    highlight: "KVG COLLEGE OF ENGINEERING",
    title: "TAP-Activity Tracking and Management System",
    description:
      "A smart platform for students to assess their skills, track their performance, and improve their career readiness.",
  },
  {
    image: "/kvgce_college_photo.jpg",
    welcome: "Empowering Futures at",
    highlight: "KVG COLLEGE OF ENGINEERING",
    title: "Continuous Assessment & Analytics Platform",
    description:
      "A unified portal connecting students, faculty, and administration to accelerate technical and professional growth.",
  },
  {
    image: "/kvgce_college_photo.jpg",
    welcome: "Skill Development with",
    highlight: "KVG COLLEGE OF ENGINEERING",
    title: "AI-Powered Learning & Tracking Engine",
    description:
      "Practice coding, solve aptitude challenges, track certifications, and prepare for top campus placement opportunities.",
  },
  {
    image: "/kvgce_college_photo.jpg",
    welcome: "Academic Excellence at",
    highlight: "KVG COLLEGE OF ENGINEERING",
    title: "Real-time Verification & Performance Insights",
    description:
      "Faculty feedback, institutional leaderboards, and detailed analytics to maximize student placement success.",
  },
];

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = slides[currentSlide];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  return (
    <section className="hero" id="home">

      {/* Background Image */}
      <img
        key={slide.image + currentSlide}
        src={slide.image}
        alt="KVG College of Engineering"
        className="hero-image"
      />

      {/* Dark Overlay */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className="hero-content">

        <h1 key={`title-${currentSlide}`} className="hero-main-title">
          <span className="hero-welcome">{slide.welcome}</span>
          <span className="hero-highlight">{slide.highlight}</span>
          <span className="hero-subtitle-line">{slide.title}</span>
        </h1>

        <p key={`description-${currentSlide}`} className="hero-description">
          {slide.description}
        </p>

        <div className="hero-buttons">

          <a href="#about" className="hero-btn get-started-btn">
            Get Started
          </a>

        </div>

      </div>

      {/* Slide Controls */}
      <button
        type="button"
        className="hero-arrow hero-arrow-left"
        onClick={previousSlide}
        aria-label="Previous slide"
      >
        ‹
      </button>

      <button
        type="button"
        className="hero-arrow hero-arrow-right"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Slide Indicators */}
      <div className="hero-dots">

        {slides.map((_, index) => (
          <button
            type="button"
            key={index}
            className={`hero-dot ${
              index === currentSlide ? "active" : ""
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}

      </div>
    </section>
  );
}

export default Hero;