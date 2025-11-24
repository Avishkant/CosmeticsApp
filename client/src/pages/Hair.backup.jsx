import React from "react";
import { Link } from "react-router-dom";
import "./SkinCare.css";

const heroImage =
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1400&q=80";

const sampleImages = [
  "https://images.unsplash.com/photo-1514995669114-0d3ff1d8a0b6?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1519750157634-bbb2f9f9b8e2?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1556228724-4b0b8c9b7d7b?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402f?auto=format&fit=crop&w=800&q=60",
];

export default function Hair() {
  return (
    <main className="skin-page">
      <section
        className="skin-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(8,8,15,0.28), rgba(8,8,15,0.28)), url(${heroImage})`,
        }}
      >
        <div className="hero-inner app-container">
          <div className="hero-text reveal">
            <h1 className="title">Hair Care — Strength & Shine</h1>
            <p className="subtitle">
              Nourishing shampoos, reparative masks and styling essentials to
              restore shine without weighing hair down.
            </p>
            <div className="hero-ctas">
              <Link to="/products?category=Hair" className="btn btn-primary">
                Shop Hair
              </Link>
              <Link to="/products?category=Shampoo" className="btn btn-ghost">
                Shampoos
              </Link>
            </div>
          </div>


          <div className="hero-preview reveal">
            <div className="floating-card">
              <img src={sampleImages[0]} alt="treatment" />
            </div>
            <div className="floating-card small">
              <img src={sampleImages[1]} alt="shampoo" />
            </div>
          </div>
        </div>
      </section>

      <section className="features app-container">
        <div className="features-grid">
          <article className="feature reveal">
            <div className="icon">💧</div>
            <h3>Hydration</h3>
            <p>Moisture-first formulas for frizz control and smoothness.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">💪</div>
            <h3>Strengthening</h3>
            <p>Proteins and peptides to help reduce breakage.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">✨</div>
            <h3>Finish</h3>
            <p>Lightweight oils and serums for glossy, touchable hair.</p>
          </article>
        </div>
      </section>

      <section className="product-grid app-container">
        <h2 className="section-title reveal">Best Sellers</h2>
        <div className="grid reveal">
          {sampleImages.map((src, i) => (
            <article className="product-card" key={i}>
              <div className="media">
                <img src={src} alt={`hair-${i}`} loading="lazy" />
              </div>
              <div className="meta">
                <h4>Repair Mask {i + 1}</h4>
                <p className="price">$ {18 + i * 6}</p>
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
    </main>
  );
}
