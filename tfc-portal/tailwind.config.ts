import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: "#E02020", light: "#FF3B3B" },
        bg: "var(--color-bg)",
        surface: { DEFAULT: "var(--color-surface)", 2: "var(--color-surface-2)", 3: "var(--color-surface-3)" },
        border: { DEFAULT: "var(--color-border)", 2: "var(--color-border-2)" },
        text: { DEFAULT: "var(--color-text)", 2: "var(--color-text-2)", 3: "var(--color-text-3)" },
      },
      fontFamily: {
        heading: ["var(--font-syne)", "Syne", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
export default config;
