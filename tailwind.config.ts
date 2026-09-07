import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#070B14",
        surface: "#0E1424",
        primary: "#58A6FF",
        accent: "#22D3EE",
        card: "rgba(15, 23, 42, 0.74)",
      },
      boxShadow: {
        card: "0 10px 30px rgba(4, 8, 22, 0.45)",
        glow: "0 0 60px rgba(14, 165, 233, 0.22)",
      },
    },
  },
  plugins: [],
} satisfies Config;
