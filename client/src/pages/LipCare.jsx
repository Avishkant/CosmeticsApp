import React from "react";
import { Link } from "react-router-dom";

import LIPS from "../assets/lipCare/LIPS.3b3a1f44.jpeg";
import TeenSpirit from "../assets/lipCare/TeenSpirit.c5cbd888.png";
import GoldenHoliday from "../assets/lipCare/GoldenHoliday.9f59d6b1.png";
import WarmRomance from "../assets/lipCare/WarmRomance.a7593373.png";

export default function LipCare() {
  const shades = [
    { title: "Teen Spirit", img: TeenSpirit },
    { title: "Golden Holiday", img: GoldenHoliday },
    { title: "Warm Romance", img: WarmRomance },
  ];

  return (
    <div className="pt-10">
      {/* Hero with shades overlayed on the lower area */}
      <section className="hero-wrap lipcare-hero relative overflow-visible">
        <div className="app-container flex gap-8 items-center">
          <div className="w-1/2">
            <h1 className="text-6xl font-serif tracking-wide">LIPS</h1>
            <h2 className="text-6xl font-serif tracking-wide mb-6">LOVE</h2>
            <p className="max-w-lg text-sm text-gray-700">
              Shop our best class selection of lipsticks including matte shades
              from top makeup brands. Elegant textures and long-lasting pigments
              — curated for you.
            </p>
          </div>
          <div className="w-1/2 flex justify-end">
            <div className="shadow-xl rounded overflow-hidden bg-white">
              <img src={LIPS} alt="lips" className="w-96 h-56 object-cover" />
            </div>
          </div>
        </div>

        {/* (Removed larger hero-centered shades; only bottom-border lipsticks remain) */}
        {/* Small lipsticks sitting on the hero bottom border */}
        <div className="hero-bottom-border app-container">
          <div className="border-lips">
            <div className="border-lip-wrap">
              <img src={TeenSpirit} alt="teen" className="border-lip" />
            </div>
            <div className="border-lip-wrap">
              <img src={GoldenHoliday} alt="golden" className="border-lip" />
            </div>
            <div className="border-lip-wrap">
              <img src={WarmRomance} alt="warm" className="border-lip" />
            </div>
          </div>
        </div>
      </section>

      {/* Optional additional content below hero */}
      <section className="app-container py-20">
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Shop the collection</h3>
          <p className="text-sm text-gray-600 max-w-2xl">
            Click a shade to view matching products or use filters to explore
            similar colours.
          </p>
        </div>
      </section>
    </div>
  );
}
