import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#111111",
        ivory: "#F5F1EA",
        champagne: { DEFAULT: "#C8B89A", dark: "#8A7A5C" },
        muted: "#858585",
        // Text-safe grey on ivory/white (AA contrast); #858585 is reserved for large text & decoration.
        ink: { DEFAULT: "#111111", soft: "#4A4A4A", faint: "#6B6B6B" },
        line: "#E3DED4",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.32em",
        wide2: "0.18em",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      aspectRatio: { product: "3 / 4" },
      transitionTimingFunction: { luxe: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
      keyframes: {
        "slow-zoom": { "0%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "none" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "slow-zoom": "slow-zoom 9s cubic-bezier(0.22, 0.61, 0.36, 1) both",
        "fade-up": "fade-up 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease both",
      },
    },
  },
  plugins: [],
} satisfies Config;
