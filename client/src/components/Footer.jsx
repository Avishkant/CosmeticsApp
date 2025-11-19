import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-12 bg-gradient-to-r from-purple-700 via-pink-600 to-orange-400 text-white footer-anim">
      <div className="app-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h3 className="text-2xl font-extrabold">Beautiq</h3>
            <p className="text-sm text-white/90">
              Discover beauty essentials, curated routines, and exclusive
              offers. Join our community for first access to sales and expert
              tips.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                className="p-2 rounded-md hover:bg-white/10 transition"
                href="#"
                aria-label="Instagram"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 11.37A4 4 0 1 1 12.63 8"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.5 6.5h.01"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                className="p-2 rounded-md hover:bg-white/10 transition"
                href="#"
                aria-label="Facebook"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 12.07C22 6.48 17.52 2 12 2S2 6.48 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H8.9v-2.9h1.54V9.5c0-1.52.9-2.36 2.28-2.36.66 0 1.35.12 1.35.12v1.49h-.76c-.75 0-.98.46-.98.93v1.12h1.67l-.27 2.9h-1.4V22c4.78-.8 8.44-4.94 8.44-9.93z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a
                className="p-2 rounded-md hover:bg-white/10 transition"
                href="#"
                aria-label="Pinterest"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12c0 3.04 1.55 5.74 3.88 7.33-.05-.62-.09-1.58.02-2.26.1-.62.64-3.97.64-3.97s-.17-.35-.17-.87c0-.81.47-1.41 1.06-1.41.5 0 .74.38.74.84 0 .51-.33 1.28-.5 1.99-.14.6.3 1.09.88 1.09 1.06 0 1.88-1.12 1.88-2.73 0-1.43-1.03-2.43-2.5-2.43-1.7 0-2.71 1.28-2.71 2.6 0 .51.2 1.06.45 1.36.05.06.06.12.05.18-.06.2-.2.64-.23.73-.04.12-.14.15-.27.09-1-.47-1.63-1.92-1.63-3.09 0-2.51 1.83-4.82 5.28-4.82 2.74 0 4.87 1.95 4.87 4.56 0 2.73-1.72 4.93-4.11 4.93-0.8 0-1.56-.42-1.82-.92l-.5 1.9c-.18.68-.67 1.53-.99 2.05.74.23 1.52.35 2.33.35 5.52 0 10-4.48 10-10S17.52 2 12 2z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-3">Shop</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li>
                  <Link to="/products" className="hover:underline">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products?category=skincare"
                    className="hover:underline"
                  >
                    Skincare
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products?category=makeup"
                    className="hover:underline"
                  >
                    Makeup
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li>
                  <Link to="/about" className="hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:underline">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:underline">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Help</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li>
                  <Link to="/faq" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:underline">
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:underline">
                    Returns
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-white/80">
          <div>© {new Date().getFullYear()} Beautiq. All rights reserved.</div>
          <div className="mt-4 md:mt-0">
            Made with ♥ —{" "}
            <Link to="/" className="hover:underline">
              Beautiq
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
