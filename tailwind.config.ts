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
          50: "#EDF0E8",
          100: "#F7F8F5",
          200: "#DDE4D8",
          300: "#C4D0BC",
          400: "#C4E0C8",
          500: "#3A7D54",
          600: "#4E9A62",
          700: "#3A5C3E",
          800: "#2E5438",
          900: "#4A6550",
          950: "#1C2B20",
        },
        cta: "#3A7D54",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
