import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./SkinCare.css";

const heroImage =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1400&q=80";

// images used across the page
// User-provided images: first two are for hero preview; next two appear in grid below hero
const heroPreviewImages = [
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1552046122-03184de85e08?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const sampleImages = [
  // user-provided images for grid below hero
  "https://plus.unsplash.com/premium_photo-1677283511146-52fa442feb2f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1599847987657-881f11b92a75?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  // additional skin-care supporting images (kept from previous set)
  "https://images.unsplash.com/photo-1533777324565-a040eb52fac2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
];

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

export default function SkinCare() {
  useRevealOnScroll();
  const gridRef = useRef(null);

  return (
    <main className="skin-page">
      <section
        className="skin-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(8,8,15,0.35), rgba(8,8,15,0.35)), url(${heroImage})`,
        }}
      >
        <div className="hero-inner app-container">
          <div className="hero-text reveal">
            <h1 className="title">Skin Care — Glow, Calm, Renew</h1>
            <p className="subtitle">
              Thoughtfully curated cleansers, serums and moisturizers to help
              every skin type feel balanced and radiant.
            </p>
            <div className="hero-ctas">
              <Link
                to="/products?category=Skin%20Care"
                className="btn btn-primary"
              >
                Shop Skin Care
              </Link>
              <Link
                to="/products?category=Moisturizers"
                className="btn btn-ghost"
              >
                Moisturizers
              </Link>
            </div>
          </div>

          <div className="hero-preview reveal">
            <div className="floating-card">
              <img src={heroPreviewImages[0]} alt="serum" />
            </div>
            <div className="floating-card small">
              <img src={heroPreviewImages[1]} alt="cleanser" />
            </div>
          </div>
        </div>
      </section>

      <section className="features app-container">
        <div className="features-grid">
          <article className="feature reveal">
            <div className="icon">🌿</div>
            <h3>Clean Ingredients</h3>
            <p>Botanical actives and minimal fillers—nothing unnecessary.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🔬</div>
            <h3>Clinically Inspired</h3>
            <p>Formulations backed by research and gentle on skin.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">♻️</div>
            <h3>Sustainable</h3>
            <p>
              Refill-friendly packaging and responsibly sourced ingredients.
            </p>
          </article>
        </div>
      </section>

      <section className="product-grid app-container" ref={gridRef}>
        <h2 className="section-title reveal">Top Picks</h2>
        <div className="grid reveal">
          {sampleImages.map((src, i) => (
            <article className="product-card" key={i}>
              <div className="media">
                <img src={src} alt={`product-${i}`} loading="lazy" />
              </div>
              <div className="meta">
                <h4>Hydrating Serum {i + 1}</h4>
                <p className="price">$ {22 + i * 8}</p>
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
        <div className="learn-inner reveal">
          <div className="learn-text">
            <h3>Why skin health matters</h3>
            <p>
              Healthy skin is resilient skin. Build a simple routine—cleanse,
              treat, hydrate—and let the ingredients do the rest.
            </p>
            <Link to="/products?category=Skin%20Care" className="btn btn-ghost">
              Explore routines
            </Link>
          </div>
          <div className="learn-image">
            <img src={sampleImages[4]} alt="routine" />
          </div>
        </div>
      </section>
    </main>
  );
}
