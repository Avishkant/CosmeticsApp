import React from "react";
import { Link } from "react-router-dom";
import "./SkinCare.css";

// reveal-on-scroll hook (mirrors SkinCare.jsx behavior)
import { useEffect } from "react";

function useRevealOnScroll(selector = ".reveal") {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector]);
}

const heroImage =
  "https://images.unsplash.com/photo-1613521076081-2820f9746a2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const sampleImages = [
  // Small preview (will become hero small)
  "https://images.pexels.com/photos/338351/pexels-photo-338351.jpeg",
  // Small preview 2
  "https://plus.unsplash.com/premium_photo-1679106770086-f4355693be1b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  // Large preview (editorial)
  "https://images.unsplash.com/photo-1613521140785-e85e427f8002?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  // Spray action / lifestyle
  "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80",
  // Luxury packaging mood
  "https://images.unsplash.com/photo-1510552776732-03e61cf4b144?auto=format&fit=crop&w=800&q=80",
  // Sample vials / testers
  "https://images.unsplash.com/photo-1504198458649-3128b932f49b?auto=format&fit=crop&w=800&q=80",
];

const scentFamilies = [
  { id: "fresh", label: "Fresh & Citrusy" },
  { id: "floral", label: "Floral" },
  { id: "woody", label: "Woody & Amber" },
  { id: "gourmand", label: "Gourmand" },
];

export default function Fragrance() {
  useRevealOnScroll();
  return (
    <main className="skin-page">
      <section
        className="skin-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(6,6,10,0.28), rgba(6,6,10,0.28)), url(${heroImage})`,
        }}
      >
        <div className="hero-inner app-container">
          <div className="hero-text reveal">
            <h1 className="title">Fragrance — Scents to Remember</h1>
            <p className="subtitle">
              Curated perfumes and colognes with notes that linger — from fresh
              citrus to warm ambers. Discover signature scents personally
              selected by our editors.
            </p>
            <div className="hero-ctas">
              <Link
                to="/products?category=Fragrance"
                className="btn btn-primary"
              >
                Shop Fragrance
              </Link>
              <Link to="/products?category=Perfume" className="btn btn-ghost">
                Explore Perfumes
              </Link>
            </div>
            <div className="chips" style={{ marginTop: 18 }}>
              {scentFamilies.map((s) => (
                <button key={s.id} className="chip">
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-preview reveal">
            <div className="floating-card large">
              <img src={sampleImages[2]} alt="bottle-large" />
            </div>
            <div>
              <div className="floating-card small">
                <img src={sampleImages[0]} alt="bottle-small" />
              </div>
              <div className="floating-card small" style={{ marginTop: 12 }}>
                <img src={sampleImages[1]} alt="bottle-small-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features app-container">
        <div className="features-grid">
          <article className="feature reveal">
            <div className="icon">🧪</div>
            <h3>Curated Notes</h3>
            <p>Each scent is described with top, heart and base notes.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🌍</div>
            <h3>Global Houses</h3>
            <p>Discover small-batch and renowned perfume houses alike.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🎁</div>
            <h3>Gift Ready</h3>
            <p>Elegant packaging and sample sets for gifting moments.</p>
          </article>
        </div>
      </section>

      <section className="product-grid app-container">
        <h2 className="section-title reveal">Featured Fragrances</h2>
        <div className="grid reveal">
          {sampleImages.map((src, i) => (
            <article className="product-card" key={i}>
              <div className="media">
                <img src={src} alt={`frag-${i}`} loading="lazy" />
              </div>
              <div className="meta">
                <h4>
                  {i === 0
                    ? "Citrus Bloom"
                    : i === 1
                    ? "Velvet Rose"
                    : i === 2
                    ? "Ocean Amber"
                    : `Signature ${i + 1}`}
                </h4>
                <p className="muted">
                  Top: Bergamot — Heart: Jasmine — Base: Amber
                </p>
                <p className="price">$ {45 + i * 12}</p>
                <div className="card-ctas">
                  <Link
                    to="/product/example"
                    className="btn btn-sm btn-outline"
                  >
                    View
                  </Link>
                  <button className="btn btn-sm btn-primary">Add</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="learn-more app-container">
        <div className="learn-inner">
          <div className="learn-copy">
            <h3>How to choose a scent</h3>
            <p>
              Start with the notes you like — citrus for brightness, florals for
              softness, woods for warmth. Try a sample set before committing.
            </p>
            <Link to="/products?category=Fragrance" className="btn btn-primary">
              Browse Samples
            </Link>
          </div>
          <div className="learn-image">
            <img src={sampleImages[3]} alt="scent-guide" />
          </div>
        </div>
      </section>

      <section className="app-container" style={{ padding: "3rem 0" }}>
        <div
          className="newsletter reveal"
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(90deg, rgba(127,90,240,0.06), rgba(255,196,0,0.02))",
            padding: 20,
            borderRadius: 12,
          }}
        >
          <div>
            <h3>Get 10% off your first fragrance</h3>
            <p className="muted">
              Join our newsletter for exclusive launches and samples.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              className="search-input"
              placeholder="Enter your email"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(10,12,20,0.06)",
              }}
            />
            <button className="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </section>
    </main>
  );
}
