import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1E5B",
          800: "#102A7A",
          950: "#050F33",
        },
        biru: {
          DEFAULT: "#2F4BC4",
          terang: "#4A66DD",
        },
        cyan: {
          DEFAULT: "#22D3EE",
        },
        ungu: {
          DEFAULT: "#6C5CE7",
        },
        ink: {
          DEFAULT: "#010308",
          soft: "#050B1F",
        },
        abu: {
          DEFAULT: "#F3F5FA",
        },
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 20px 50px -12px rgba(11, 30, 91, 0.22)",
        "card-lg": "0 30px 70px -15px rgba(11, 30, 91, 0.3)",
        glow: "0 10px 30px -5px rgba(47, 75, 196, 0.65)",
        glass: "0 8px 32px rgba(5, 15, 51, 0.35)",
      },
      keyframes: {
        // Teks berjalan: isi digandakan, jadi geser tepat setengah lebar lalu ulang tanpa lompatan
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #050F33 0%, #0B1E5B 45%, #16278A 100%)",
      },
    },
  },
  plugins: [],
};

export default config;