import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./contexts/CartContext";

// Sanitize any SVG attributes left as the literal string "auto" which
// some SVG assets or icon providers sometimes inject and which causes
// runtime errors like: "<svg> attribute width: Expected length, "auto".".
function sanitizeSvgAttributes() {
  try {
    if (typeof document === "undefined") return;
    const svgs = document.querySelectorAll("svg");
    svgs.forEach((s) => {
      const w = s.getAttribute("width");
      const h = s.getAttribute("height");
      if (w === "auto") s.removeAttribute("width");
      if (h === "auto") s.removeAttribute("height");
    });
  } catch (e) {
    // non-fatal
    // console.warn("SVG sanitize failed", e);
  }
}

// Run immediately and also after the DOM loads to catch dynamically injected SVGs.
sanitizeSvgAttributes();
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", sanitizeSvgAttributes);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>
);
