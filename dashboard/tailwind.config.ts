import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b1220",
          card: "#121a2c",
          subtle: "#1a2440",
        },
        ink: {
          DEFAULT: "#e6ecff",
          dim: "#9aa6c7",
          faint: "#5f6b8a",
        },
        accent: {
          DEFAULT: "#7c5cff",
          gold: "#f5c451",
          green: "#3ddc84",
          red: "#ff5d6c",
          blue: "#4cc9f0",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
