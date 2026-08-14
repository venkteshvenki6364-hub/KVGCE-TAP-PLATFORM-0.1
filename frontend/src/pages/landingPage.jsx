import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import HowItWorks from "../components/HowItWorks";
import Contact from "../components/Contact";

import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <Navbar />

      {/* MAIN LANDING PAGE */}
      <main>

        {/* HERO SECTION */}
        <section id="home">
          <Hero />
        </section>

        {/* ABOUT SECTION */}
        <section id="about">
          <About />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works">
          <HowItWorks />
        </section>

        {/* CONTACT + FOOTER */}
        <section id="contact">
          <Contact />
        </section>

      </main>

    </div>
  );
}

export default LandingPage;