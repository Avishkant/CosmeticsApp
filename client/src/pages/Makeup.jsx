// Temporary minimal replacement to ensure file is writable and unique.
export default function Makeup() {
  return null;
}
import React from "react";
import { Link } from "react-router-dom";
import "./SkinCare.css";

const heroImage = "https://images.unsplash.com/photo-1517745463040-7ffb6c19f0b3?auto=format&fit=crop&w=1400&q=80";

const sampleImages = [
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1536305030018-3d857a7e9d6f?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1507433361629-0bb3b7b0f4f6?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1514790193030-c89d266d5a9d?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1522336572468-9a46f4d7a862?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1543163521-1bf539c55b3d?auto=format&fit=crop&w=800&q=60",
];

export default function Makeup() {
  return (
    <main className="skin-page">
      <section
        className="skin-hero"
        style={{ backgroundImage: `linear-gradient(rgba(8,8,15,0.28), rgba(8,8,15,0.28)), url(${heroImage})` }}
      >
        <div className="hero-inner app-container">
          <div className="hero-text reveal">
            <h1 className="title">Makeup — Bold & Subtle</h1>
            <p className="subtitle">
              From everyday essentials to statement-making pigments, discover
              makeup that complements your style.
            </p>
            <div className="hero-ctas">
              <Link to="/products?category=Makeup" className="btn btn-primary">
                Shop Makeup
              </Link>
              <Link to="/products?category=Foundations" className="btn btn-ghost">
                Foundations
              </Link>
            </div>
          </div>

          <div className="hero-preview reveal">
            <div className="floating-card">
              <img src={sampleImages[0]} alt="palette" />
            </div>
            <div className="floating-card small">
              <img src={sampleImages[1]} alt="brushes" />
            </div>
          </div>
        </div>
      </section>

      <section className="features app-container">
        <div className="features-grid">
          <article className="feature reveal">
            <div className="icon">💄</div>
            <h3>Quality Pigments</h3>
            <p>Rich, blendable color with lasting finish.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🖌️</div>
            <h3>Tools</h3>
            <p>Pro-grade brushes and tools for precise application.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🌈</div>
            <h3>Inclusive Shades</h3>
            <p>Extensive shade ranges to suit every skin tone.</p>
          </article>
        </div>
      </section>

      <section className="product-grid app-container">
        <h2 className="section-title reveal">Featured</h2>
        <div className="grid reveal">
          {sampleImages.map((src, i) => (
            <article className="product-card" key={i}>
              <div className="media">
                <img src={src} alt={`makeup-${i}`} loading="lazy" />
              </div>
              <div className="meta">
                <h4>Velvet Lip {i + 1}</h4>
                <p className="price">$ {12 + i * 7}</p>
                <div className="card-ctas">
                  <Link to="/product/example" className="btn btn-sm btn-outline">
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
import React from "react";
import { Link } from "react-router-dom";
import "./SkinCare.css";

const heroImage =
  "https://images.unsplash.com/photo-1517745463040-7ffb6c19f0b3?auto=format&fit=crop&w=1400&q=80";

const sampleImages = [
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1536305030018-3d857a7e9d6f?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1507433361629-0bb3b7b0f4f6?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1514790193030-c89d266d5a9d?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1522336572468-9a46f4d7a862?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1543163521-1bf539c55b3d?auto=format&fit=crop&w=800&q=60",
];

export default function Makeup() {
  return (
    <main className="skin-page">
      <section
        className="skin-hero"
        style={{ backgroundImage: `linear-gradient(rgba(8,8,15,0.28), rgba(8,8,15,0.28)), url(${heroImage})` }}
      >
        <div className="hero-inner app-container">
          <div className="hero-text reveal">
            <h1 className="title">Makeup — Bold & Subtle</h1>
            <p className="subtitle">
              From everyday essentials to statement-making pigments, discover
              makeup that complements your style.
            </p>
            <div className="hero-ctas">
              <Link to="/products?category=Makeup" className="btn btn-primary">
                Shop Makeup
              </Link>
              <Link to="/products?category=Foundations" className="btn btn-ghost">
                Foundations
              </Link>
            </div>
          </div>

          <div className="hero-preview reveal">
            <div className="floating-card">
              <img src={sampleImages[0]} alt="palette" />
            </div>
            <div className="floating-card small">
              <img src={sampleImages[1]} alt="brushes" />
            </div>
          </div>
        </div>
      </section>

      <section className="features app-container">
        <div className="features-grid">
          <article className="feature reveal">
            <div className="icon">💄</div>
            <h3>Quality Pigments</h3>
            <p>Rich, blendable color with lasting finish.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🖌️</div>
            <h3>Tools</h3>
            <p>Pro-grade brushes and tools for precise application.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🌈</div>
            <h3>Inclusive Shades</h3>
            <p>Extensive shade ranges to suit every skin tone.</p>
          </article>
        </div>
      </section>

      <section className="product-grid app-container">
        <h2 className="section-title reveal">Featured</h2>
        <div className="grid reveal">
          {sampleImages.map((src, i) => (
            <article className="product-card" key={i}>
              <div className="media">
                <img src={src} alt={`makeup-${i}`} loading="lazy" />
              </div>
              <div className="meta">
                <h4>Velvet Lip {i + 1}</h4>
                <p className="price">$ {12 + i * 7}</p>
                <div className="card-ctas">
                  <Link to="/product/example" className="btn btn-sm btn-outline">
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
import React from "react";
import { Link } from "react-router-dom";
import "./SkinCare.css";

const heroImage =
  "https://images.unsplash.com/photo-1517745463040-7ffb6c19f0b3?auto=format&fit=crop&w=1400&q=80";

const sampleImages = [
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1536305030018-3d857a7e9d6f?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1507433361629-0bb3b7b0f4f6?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1514790193030-c89d266d5a9d?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1522336572468-9a46f4d7a862?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1543163521-1bf539c55b3d?auto=format&fit=crop&w=800&q=60",
];

export default function Makeup() {
  return (
    <main className="skin-page">
      <section
        className="skin-hero"
        style={{ backgroundImage: `linear-gradient(rgba(8,8,15,0.28), rgba(8,8,15,0.28)), url(${heroImage})` }}
      >
        <div className="hero-inner app-container">
          <div className="hero-text reveal">
            <h1 className="title">Makeup — Bold & Subtle</h1>
            <p className="subtitle">
              From everyday essentials to statement-making pigments, discover
              makeup that complements your style.
            </p>
            <div className="hero-ctas">
              <Link to="/products?category=Makeup" className="btn btn-primary">
                Shop Makeup
              </Link>
              <Link to="/products?category=Foundations" className="btn btn-ghost">
                Foundations
              </Link>
            </div>
          </div>

          <div className="hero-preview reveal">
            <div className="floating-card">
              <img src={sampleImages[0]} alt="palette" />
            </div>
            <div className="floating-card small">
              <img src={sampleImages[1]} alt="brushes" />
            </div>
          </div>
        </div>
      </section>

      <section className="features app-container">
        <div className="features-grid">
          <article className="feature reveal">
            <div className="icon">💄</div>
            <h3>Quality Pigments</h3>
            <p>Rich, blendable color with lasting finish.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🖌️</div>
            <h3>Tools</h3>
            <p>Pro-grade brushes and tools for precise application.</p>
          </article>
          <article className="feature reveal">
            <div className="icon">🌈</div>
            <h3>Inclusive Shades</h3>
            <p>Extensive shade ranges to suit every skin tone.</p>
          </article>
        </div>
      </section>

      <section className="product-grid app-container">
        <h2 className="section-title reveal">Featured</h2>
        <div className="grid reveal">
          {sampleImages.map((src, i) => (
            <article className="product-card" key={i}>
              <div className="media">
                <img src={src} alt={`makeup-${i}`} loading="lazy" />
              </div>
              <div className="meta">
                <h4>Velvet Lip {i + 1}</h4>
                <p className="price">$ {12 + i * 7}</p>
                <div className="card-ctas">
                  <Link to="/product/example" className="btn btn-sm btn-outline">
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
