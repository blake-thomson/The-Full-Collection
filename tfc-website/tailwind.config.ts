import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: "#E02020", light: "#FF3B3B", dark: "#C01818" },
        cream: "#FAF9F7",
        warm: {
          50: "#FDFCFB",
          100: "#FAF9F7",
          200: "#F2F0EC",
          300: "#E6E3DE",
          400: "#DDD9D3",
          500: "#CFCBC4",
          600: "#9E9892",
          700: "#6B6660",
          800: "#3D3935",
          900: "#1A1917",
        },
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
