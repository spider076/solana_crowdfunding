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
        gray: {
          900: "#1a1a1a",
          800: "#2a2a2a",
          700: "#3a3a3a",
          400: "#9a9a9a",
        },
        indigo: {
          600: "#5a67d8",
          700: "#4c51bf",
        },
      },
    },
  },
  plugins: [],
};
export default config;
