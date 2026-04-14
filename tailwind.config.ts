import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          50: "#f4faf4",
          100: "#e3f2e4",
          200: "#c6e4c9",
          300: "#9acf9f",
          400: "#65b06d",
          500: "#3f9150",
          600: "#2f7540",
          700: "#275d35",
          800: "#224b2d",
          900: "#1d3f27",
          950: "#0f2216",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
