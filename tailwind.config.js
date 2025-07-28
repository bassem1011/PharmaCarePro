/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Cairo",
          "Tajawal",
          "Noto Sans Arabic",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          DEFAULT: "#7c3aed", // violet-600
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        secondary: {
          DEFAULT: "#f472b6", // pink-400
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        accent: {
          DEFAULT: "#22d3ee", // cyan-400
        },
        background: {
          light: "#f9fafb",
          dark: "#18181b",
        },
        border: "#e5e7eb",
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};
