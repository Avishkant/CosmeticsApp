import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./Hair.css";

const images = [
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://plus.unsplash.com/premium_photo-1706800175978-5afc58ae7702?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1669646100849-8c064be27dfd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1712641970787-e178ca70c6c4?q=80&w=1084&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://plus.unsplash.com/premium_photo-1706800175636-c3efbcf75c68?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1717160675489-7779f2c91999?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

function useRevealOnScroll(selector = ".reveal") {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(selector));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
}

export default function Hair() {
  useRevealOnScroll();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,7,20,0.35), rgba(10,7,20,0.35)), url(${images[0]})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 flex items-center">
          <div className="w-full lg:w-1/2 pr-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 reveal">
              Hair Care — Strength & Shine
            </h1>
            <p className="text-lg text-gray-100 mb-6 reveal">
              Nourishing shampoos, reparative masks and styling essentials to
              restore shine without weighing hair down.
            </p>
            <div className="flex gap-3 reveal">
              <Link
                to="/products?category=Hair"
                className="inline-flex items-center px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-lg transition"
              >
                Shop Hair
              </Link>
              <Link
                to="/products?category=Shampoo"
                className="inline-flex items-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition"
              >
                Shampoos
              </Link>
            </div>
          </div>

          <div className="hidden lg:block w-1/2 relative">
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 space-y-6 z-20">
              <div className="floating-card w-48 h-64 rounded-xl overflow-hidden shadow-2xl reveal">
                <img
                  src={images[1]}
                  alt="preview-1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="floating-card w-36 h-48 rounded-xl overflow-hidden shadow-xl reveal">
                <img
                  src={images[2]}
                  alt="preview-2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl shadow reveal">
            <div className="text-3xl">💧</div>
            <h3 className="mt-4 text-xl font-semibold">Hydration</h3>
            <p className="mt-2 text-sm text-gray-600">
              Moisture-first formulas for frizz control and smoothness.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow reveal">
            <div className="text-3xl">💪</div>
            <h3 className="mt-4 text-xl font-semibold">Strengthening</h3>
            <p className="mt-2 text-sm text-gray-600">
              Proteins and peptides to help reduce breakage.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow reveal">
            <div className="text-3xl">✨</div>
            <h3 className="mt-4 text-xl font-semibold">Finish</h3>
            <p className="mt-2 text-sm text-gray-600">
              Lightweight oils and serums for glossy, touchable hair.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 reveal">Best Sellers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.slice(1).map((src, i) => (
            <article
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow transform hover:scale-105 transition reveal"
            >
              <div className="h-56 w-full">
                <img
                  src={src}
                  alt={`hair-${i}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h4 className="font-medium">Repair Mask {i + 1}</h4>
                <p className="text-rose-600 font-semibold mt-2">
                  $ {18 + i * 6}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    to="/product/example"
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    View
                  </Link>
                  <button className="px-3 py-2 bg-rose-600 text-white rounded-md text-sm">
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-rose-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl bg-white p-8 shadow-lg flex flex-col md:flex-row items-center justify-between reveal">
            <div>
              <h3 className="text-lg font-bold">
                Join our haircare newsletter
              </h3>
              <p className="text-sm text-gray-600">
                Get 10% off your first order and pro tips.
              </p>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-auto">
              <form className="flex gap-2">
                <input
                  placeholder="Email address"
                  className="px-4 py-2 border rounded-md w-full md:w-72"
                />
                <button className="px-4 py-2 bg-rose-600 text-white rounded-md">
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
