import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Colors (all mapped to CSS variables from globals.css) ───────────
      colors: {
        bg:               "var(--bg)",
        surface:          "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border:           "var(--border)",
        "border-strong":  "var(--border-strong)",

        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary":  "var(--text-tertiary)",
        "text-disabled":  "var(--text-disabled)",

        accent:           "var(--accent)",
        "accent-hover":   "var(--accent-hover)",
        "accent-bg":      "var(--accent-bg)",

        "severity-high":      "var(--severity-high)",
        "severity-high-bg":   "var(--severity-high-bg)",
        "severity-medium":    "var(--severity-medium)",
        "severity-medium-bg": "var(--severity-medium-bg)",
        "severity-low":       "var(--severity-low)",
        "severity-low-bg":    "var(--severity-low-bg)",

        "score-good":   "var(--score-good)",
        "score-medium": "var(--score-medium)",
        "score-poor":   "var(--score-poor)",
      },

      // ─── Fonts ────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },

      // ─── Type scale (from DESIGN_SYSTEM.md) ──────────────────────────────
      fontSize: {
        display:    ["56px", { lineHeight: "60px",  letterSpacing: "-0.02em",  fontWeight: "600" }],
        h1:         ["32px", { lineHeight: "36px",  letterSpacing: "-0.01em",  fontWeight: "600" }],
        h2:         ["24px", { lineHeight: "28px",  letterSpacing: "-0.005em", fontWeight: "600" }],
        h3:         ["18px", { lineHeight: "24px",  letterSpacing: "0",        fontWeight: "600" }],
        "body-lg":  ["16px", { lineHeight: "24px",  letterSpacing: "0",        fontWeight: "400" }],
        body:       ["14px", { lineHeight: "20px",  letterSpacing: "0",        fontWeight: "400" }],
        "body-sm":  ["13px", { lineHeight: "18px",  letterSpacing: "0",        fontWeight: "400" }],
        caption:    ["12px", { lineHeight: "16px",  letterSpacing: "0.01em",   fontWeight: "500" }],
        mono:       ["14px", { lineHeight: "20px",  letterSpacing: "0",        fontWeight: "500" }],
      },

      // ─── Max widths ───────────────────────────────────────────────────────
      maxWidth: {
        content: "1024px",
        hero:    "768px",
      },

      // ─── Animations ───────────────────────────────────────────────────────
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
      },
      animation: {
        'fade-in': 'fade-in-up 200ms ease-out both',
      },

      // ─── Shadows (only floating/hover elements; static cards use borders) ─
      boxShadow: {
        floating: "0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        hover:    "0 2px 8px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
