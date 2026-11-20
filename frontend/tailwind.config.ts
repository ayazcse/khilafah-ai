import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          deep: "#0B6E4F",
          dark: "#064E3B",
        },
        charcoal: {
          DEFAULT: "#1A1D1F",
          light: "#24282B",
          lighter: "#2E3336",
        },
        gold: {
          DEFAULT: "#C9A24B",
          light: "#DEC180",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      backgroundImage: {
        "geo-pattern":
          "radial-gradient(circle at 1px 1px, rgba(201,162,75,0.15) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
