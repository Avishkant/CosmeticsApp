import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <h3>Beautiq</h3>
            <p>
              Discover beauty essentials, curated routines, and exclusive
              offers. Join our community for first access to sales and expert
              tips.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram" className="icon">
                IG
              </a>
              <a href="#" aria-label="Facebook" className="icon">
                FB
              </a>
              <a href="#" aria-label="Pinterest" className="icon">
                PT
              </a>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <h4>Shop</h4>
              <ul>
                <li>
                  <Link to="/products">All Products</Link>
                </li>
                <li>
                  <Link to="/products?category=skincare">Skincare</Link>
                </li>
                <li>
                  <Link to="/products?category=makeup">Makeup</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li>
                  <Link to="/about">About</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                <li>
                  <Link to="/careers">Careers</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Help</h4>
              <ul>
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/shipping">Shipping</Link>
                </li>
                <li>
                  <Link to="/returns">Returns</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* <div className="footer-newsletter">
            <h4>Join our newsletter</h4>
            <div className="newsletter-box">
              <form onSubmit={(e) => e.preventDefault()}>
                <input aria-label="email" placeholder="Your email" />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div> */}
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Beautiq. All rights reserved.</div>
          <div>
            Made with ♥ — <Link to="/">Beautiq</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
