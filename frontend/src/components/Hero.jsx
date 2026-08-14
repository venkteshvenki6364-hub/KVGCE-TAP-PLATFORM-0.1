import React, { useEffect, useState } from "react";
import "./Hero.css";

const slides = [
  {
    image: "/kvgce_college_photo.jpg",
    eyebrow: "WELCOME TO",
    title: "KVG COLLEGE OF ENGINEERING",
    subtitle: "Student Skill Assessment & Training Platform",
    description:
      "A smart platform to assess student skills, track learning activities, analyze performance, and build career readiness.",
  },
  {
    image: "/kvgce_college_photo.jpg",
    eyebrow: "KVGCE • TAP",
    title: "LEARN • ASSESS • IMPROVE",
    subtitle: "Everything You Need in One Platform",
    description:
      "TAP connects students, faculty, and administrators through one centralized platform for continuous skill development.",
  },
  {
    image: "/kvgce_college_photo.jpg",
    eyebrow: "SMART STUDENT DEVELOPMENT",
    title: "BUILD YOUR FUTURE",
    subtitle: "Track Your Skills. Measure Your Growth.",
    description:
      "Take assessments, track your activities, understand your performance, and prepare yourself for a successful career.",
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

        <div className="hero-eyebrow">
          {slide.eyebrow}
        </div>

        <h1 key={`title-${currentSlide}`}>
          {slide.title}
        </h1>

        <h2 key={`subtitle-${currentSlide}`}>
          {slide.subtitle}
        </h2>

        <p key={`description-${currentSlide}`}>
          {slide.description}
        </p>

        <div className="hero-buttons">

          <a href="#about" className="hero-btn primary-btn">
            Explore TAP
            <span>→</span>
          </a>

          <a href="#how-it-works" className="hero-btn secondary-btn">
            Learn More
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