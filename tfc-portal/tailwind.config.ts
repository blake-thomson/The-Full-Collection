import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: "#E02020", light: "#FF3B3B" },
        bg: "#0A0A0A",
        surface: { DEFAULT: "#111111", 2: "#181818", 3: "#202020" },
        border: { DEFAULT: "#252525", 2: "#2E2E2E" },
        text: { DEFAULT: "#F0EDE6", 2: "#A8A49C", 3: "#5A5652" },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
