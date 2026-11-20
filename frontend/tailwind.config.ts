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
          deep: "#087F62",
          dark: "#075B49",
        },
        charcoal: {
          DEFAULT: "#0B1722",
          light: "#112433",
          lighter: "#173244",
        },
        gold: {
          DEFAULT: "#4B9BD5",
          light: "#8BC8EF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      backgroundImage: {
        "geo-pattern":
          "radial-gradient(circle at 1px 1px, rgba(24,167,127,0.16) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
