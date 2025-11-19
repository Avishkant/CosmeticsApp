import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

// Candidate public paths (fallbacks). Kept at module scope so hooks don't need it as a changing dependency.
const candidates = [
  [
    "/assets/boutiq/heroSlider1.webp",
    "/assets/boutiq/heroSlider1.jpg",
    "/assets/boutiq/slide1.webp",
    "/assets/boutiq/slide1.jpg",
    "/assets/boutiq/1.webp",
    "/assets/boutiq/1.jpg",
    "/assets/boutiq/slider-0.jpg",
  ],
  [
    "/assets/boutiq/heroSlider2.webp",
    "/assets/boutiq/heroSlider2.jpg",
    "/assets/boutiq/slide2.webp",
    "/assets/boutiq/slide2.jpg",
    "/assets/boutiq/2.webp",
    "/assets/boutiq/2.jpg",
    "/assets/boutiq/slider-1.jpg",
  ],
  [
    "/assets/boutiq/heroSlider3.webp",
    "/assets/boutiq/heroSlider3.jpg",
    "/assets/boutiq/slide3.webp",
    "/assets/boutiq/slide3.jpg",
    "/assets/boutiq/3.webp",
    "/assets/boutiq/3.jpg",
    "/assets/boutiq/slider-2.jpg",
  ],
];

export default function Home() {
  // We'll try to detect available images inside `client/public/assets/boutiq/`.
  // Common candidate filenames/extensions are tried so the carousel works
  // whether you placed images as heroSlider1.jpg or 1.jpg etc.

  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [idx, setIdx] = useState(0);
  const next = useCallback(
    () => setIdx((i) => (i + 1) % (slides.length || 1)),
    [slides.length]
  );
  const prev = useCallback(
    () => setIdx((i) => (i - 1 + (slides.length || 1)) % (slides.length || 1)),
    [slides.length]
  );

  // Resolve available slide URLs on mount
  useEffect(() => {
    let mounted = true;
    // First, try to resolve images that were added under `src/assets/beautiq`.
    // Vite can expose these at runtime via `import.meta.glob` as URLs.
    const globAssets = import.meta.glob(
      "/src/assets/beautiq/*.{webp,png,jpg,svg}",
      { eager: true, as: "url" }
    );
    const assetKeys = Object.keys(globAssets || {});
    const checkImage = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ ok: true, url });
        img.onerror = () => resolve({ ok: false, url });
        img.src = url;
      });

    (async () => {
      const resolved = [];
      // Prefer images bundled under `src/assets/beautiq` (if present).
      for (let i = 1; i <= candidates.length; i += 1) {
        // Look for an exact match like '/src/assets/beautiq/heroSlider1.webp'
        const regex = new RegExp(`heroSlider${i}\\.`, "i");
        const matchKey = assetKeys.find((k) => regex.test(k));
        if (matchKey) {
          resolved.push(globAssets[matchKey]);
          continue;
        }

        // Otherwise fall back to probing public candidate paths defined above.
        const group = candidates[i - 1];
        let found = null;
        for (const url of group) {
          const r = await checkImage(url);
          if (r.ok) {
            found = url;
            break;
          }
        }
        if (found) resolved.push(found);
      }
      if (mounted) setSlides(resolved);

      // Build category images: prefer explicit names `shopByCategory1..6` inside src/assets/beautiq
      try {
        const chosen = [];
        for (let i = 1; i <= 6; i += 1) {
          const regex = new RegExp(`shopByCategory${i}\\.`, "i");
          const key = assetKeys.find((k) => regex.test(k));
          if (key) chosen.push(globAssets[key]);
        }

        // If explicit images not found, fall back to a best-effort selection
        if (chosen.length === 0) {
          const fallback = assetKeys
            .filter((k) => !/heroSlider/i.test(k))
            .filter((k) => !/gpay|facebook|coupon|label|logo/i.test(k))
            .slice(0, 6)
            .map((k) => globAssets[k]);
          if (mounted) setCategories(fallback);
        } else {
          if (mounted) setCategories(chosen);
        }
      } catch (e) {
        if (mounted) setCategories([]);
      }
    })();

    const t = setInterval(next, 4000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [next]);

  // Load trending assets placed in src/assets/trending
  const [trending, setTrending] = useState([]);
  useEffect(() => {
    let mounted = true;
    try {
      const imgs = import.meta.glob(
        "/src/assets/trending/*.{webp,png,jpg,jpeg,svg}",
        { eager: true, as: "url" }
      );
      const urls = Object.keys(imgs).map((k) => imgs[k]);
      // keep original ordering by filename
      urls.sort();
      if (mounted) setTrending(urls);
    } catch (e) {
      if (mounted) setTrending([]);
    }
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="hero-wrap" style={{ padding: "0 40px" }}>
        <div
          className="hero-slider"
          style={{
            height: 520,
            position: "relative",
            overflow: "hidden",
            width: "100%",
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {slides.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`slide-${i}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "var(--bg, #fff)",
                transform: `translateX(${(i - idx) * 100}%)`,
                transition: "transform 450ms ease",
              }}
            />
          ))}

          {/* Sticky overlay text that does not move with slides */}
          <div
            style={{
              position: "absolute",
              left: 96,
              bottom: 40,
              zIndex: 3,
              color: "#000",
              maxWidth: 600,
              pointerEvents: "auto",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
              We've Got
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 72,
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              A DEAL
            </h1>
            <p style={{ color: "var(--muted)", marginTop: 12, maxWidth: 520 }}>
              Shop on our website and sign up for notifications to unlock
              tomorrow’s web-exclusive offer. Trust us—you don’t want to miss
              it.
            </p>
            <button
              style={{
                marginTop: 12,
                background: "#000",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              SHOP NOW
            </button>
          </div>

          <button aria-label="Previous" className="prev" onClick={prev}>
            ‹
          </button>

          <button aria-label="Next" className="next" onClick={next}>
            ›
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              gap: 8,
            }}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  border: "none",
                  background: i === idx ? "white" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* <div className="app-container" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/products" className="card hover-card" style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>Shop Now</div>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>
              Explore our curated cosmetics.
            </div>
          </Link>
          <div className="card" style={{ flex: 2 }}>
            <h3 style={{ marginBottom: 8 }}>Welcome to Beautiq</h3>
            <p style={{ color: "var(--muted)" }}>
              Beautiq is a modern cosmetics storefront. This demo landing page
              shows a simple hero carousel; place your images in
              `client/public/assets/boutiq/` with names `slide1.jpg`,
              `slide2.jpg`, `slide3.jpg` to populate the hero.
            </p>
          </div>
        </div>
      </div> */}

      {/* Shop by Category section */}
      <div className="app-container" style={{ marginTop: 64 }}>
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-16 md:mb-20">
          Shop by Category
        </h2>
        <div className="flex justify-center gap-10 mt-12 md:mt-16 flex-nowrap">
          {(categories.length ? categories : ["", "", "", "", "", ""]).map(
            (src, i) => {
              return (
                <Link
                  to="/products"
                  key={i}
                  className="w-40 md:w-48 text-center no-underline category-item flex-shrink-0"
                >
                  <div className="relative flex flex-col items-center">
                    {/* larger image positioned to overlap the circle and extend below it */}
                    {src ? (
                      <img
                        src={src}
                        alt={`category-${i}`}
                        className="w-40 h-40 md:w-48 md:h-48 object-cover -mt-4 md:-mt-5 relative z-10"
                      />
                    ) : (
                      <div className="w-40 h-40 md:w-48 md:h-48 -mt-4 md:-mt-5" />
                    )}
                  </div>
                  {/* Label text exists elsewhere; do not render custom labels here */}
                </Link>
              );
            }
          )}
        </div>
      </div>
      {/* Trending tiles section */}
      <div className="app-container" style={{ marginTop: 96 }}>
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-8">
          Trending
        </h2>
        <div className="trending-grid">
          {(trending.length ? trending : ["", "", "", "", "", ""])
            .slice(0, 6)
            .map((src, i) => (
              <Link
                to="/products"
                key={i}
                className="trend-card"
                aria-label={`trending-${i}`}
              >
                {src ? (
                  // Larger tiles: use a slightly taller aspect ratio and enforce a minHeight
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      minHeight: 260,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={src}
                      alt={`trending-${i}`}
                      className="trend-img"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      minHeight: 260,
                      background: "linear-gradient(180deg,#fff,#f3f4f6)",
                    }}
                  />
                )}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
