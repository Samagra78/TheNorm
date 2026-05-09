/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#111111",
          active: "#242424",
          disabled: "#e5e7eb",
        },
        ink: "#111111",
        body: "#374151",
        muted: {
          DEFAULT: "#6b7280",
          soft: "#898989",
        },
        hairline: {
          DEFAULT: "#e5e7eb",
          soft: "#f3f4f6",
        },
        canvas: "#ffffff",
        surface: {
          soft: "#f8f9fa",
          card: "#f5f5f5",
          strong: "#e5e7eb",
          dark: "#101010",
          "dark-elevated": "#1a1a1a",
        },
        "on-primary": "#ffffff",
        "on-dark": {
          DEFAULT: "#ffffff",
          soft: "#a1a1aa",
        },
        "brand-accent": "#3b82f6",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        badge: {
          orange: "#fb923c",
          pink: "#ec4899",
          violet: "#8b5cf6",
          emerald: "#34d399",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"], // Fallback for Cal Sans
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      letterSpacing: {
        tightest: "-2px",
        tighter: "-1.5px",
        tight: "-1px",
        snug: "-0.5px",
      },
    },
  },
  plugins: [],
}
