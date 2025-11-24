import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./BathBody.css";

const images = [
  "https://plus.unsplash.com/premium_photo-1678478005748-c247d9c3c5c7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1658684860796-b52128d5bdd6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1629380107895-bb31e18bdc64?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://plus.unsplash.com/premium_photo-1678478534983-ed1b7fbd1ab1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1731336478619-aaeb3ce74f25?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

function useReveal(selector = ".reveal") {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(selector));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("is-visible")
        ),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
}

export default function BathBody() {
  useReveal();

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(7,6,10,0.36), rgba(7,6,10,0.36)), url(${images[0]})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-28 lg:py-36 flex items-center">
          <div className="w-full lg:w-1/2 text-white">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 reveal">
              Bath & Body — Rituals for Self Care
            </h1>
            <p className="text-lg text-gray-100 mb-6 reveal">
              Soothing salts, fragrant oils and nourishing butters crafted for
              calm and glow.
            </p>
            <div className="flex gap-3 reveal">
              <Link
                to="/products?category=Bath%20%26%20Body"
                className="inline-flex items-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow"
              >
                Shop Bath &amp; Body
              </Link>
              <Link
                to="/products?category=Self%20Care"
                className="inline-flex items-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md"
              >
                Self Care
              </Link>
            </div>
          </div>

          <div className="hidden lg:block w-1/2 relative">
            <div className="absolute -right-10 top-6 space-y-6">
              <div className="bb-card w-56 h-64 rounded-2xl overflow-hidden shadow-2xl reveal">
                <img
                  src={images[1]}
                  alt="bath-salts"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bb-card w-44 h-52 rounded-2xl overflow-hidden shadow-xl reveal">
                <img
                  src={images[2]}
                  alt="oils"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-emerald-50 rounded-2xl shadow reveal">
            <div className="text-3xl">🛁</div>
            <h3 className="mt-4 text-xl font-semibold">Soak</h3>
            <p className="mt-2 text-sm text-gray-700">
              Relaxing bath salts and bubbles to melt stress away.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow reveal">
            <div className="text-3xl">🌿</div>
            <h3 className="mt-4 text-xl font-semibold">Nourish</h3>
            <p className="mt-2 text-sm text-gray-700">
              Rich body butters and lotions for long-lasting hydration.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow reveal">
            <div className="text-3xl">✨</div>
            <h3 className="mt-4 text-xl font-semibold">Scent</h3>
            <p className="mt-2 text-sm text-gray-700">
              Perfumed oils and mists for a sensual, calming ritual.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 reveal">Curated Picks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((src, i) => (
            <article
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow transform hover:scale-102 transition reveal"
            >
              <div className="h-56 w-full">
                <img
                  src={src}
                  alt={`bb-${i}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h4 className="font-medium">Ritual Set {i + 1}</h4>
                <p className="text-emerald-600 font-semibold mt-2">
                  $ {24 + i * 8}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    to="/product/example"
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    View
                  </Link>
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm">
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-emerald-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl bg-white p-8 shadow-lg flex flex-col md:flex-row items-center justify-between reveal">
            <div>
              <h3 className="text-lg font-bold">Subscribe for calm</h3>
              <p className="text-sm text-gray-600">
                Receive exclusive offers and home-spa tips.
              </p>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-auto">
              <form className="flex gap-2">
                <input
                  placeholder="Email address"
                  className="px-4 py-2 border rounded-md w-full md:w-72"
                />
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-md">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
