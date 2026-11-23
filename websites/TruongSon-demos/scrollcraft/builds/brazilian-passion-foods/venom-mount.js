// Mounts the Framer "Venom Button" (vendor/venom-button.js, unmodified) on the main CTAs.
// The original <a> stays in the page as the no-JS / no-WebGL fallback and is hidden once mounted.
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import VenomButton from "./vendor/venom-button.js";

const M = 170;                                  // room around the pill for the tendrils
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(hover: none)").matches;

if (!reduce && !touch) {
  document.querySelectorAll("a.cta[data-venom]").forEach((a) => {
    const h = +a.dataset.venomHeight || 54, w = +a.dataset.venomWidth || 236;
    const slot = document.createElement("span");
    slot.className = "venom-slot";
    slot.style.cssText = `width:${w}px;height:${h}px`;
    const wrap = document.createElement("div");
    wrap.className = "venom-wrap";
    wrap.style.cssText = `left:${-M}px;top:${-M}px;width:${w + 2 * M}px;height:${h + 2 * M}px`;
    slot.appendChild(wrap);
    a.after(slot);
    a.classList.add("venom-replaced");
    createRoot(wrap).render(createElement(VenomButton, {
      text: a.textContent.trim(),
      link: a.href, newTab: true,
      font: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: "17px", fontWeight: 600 },
      buttonHeight: h, sidePadding: 26,
      customCursor: false, quality: "balanced",
      style: { position: "absolute", inset: 0, pointerEvents: "none" },
    }));
  });
}
