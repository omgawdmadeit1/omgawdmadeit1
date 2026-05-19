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
      },
      boxShadow: { card: "0 10px 30px rgba(4, 8, 22, 0.45)" },
    },
  },
  plugins: [],
} satisfies Config;
