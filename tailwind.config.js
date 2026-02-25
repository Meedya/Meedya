/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0b",
        chalk: "#f7f7f8",
        steel: "#8a8f98",
        aura: "#d7d9de"
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "ui-sans-serif", "system-ui"],
        sans: ["\"Manrope\"", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0,0,0,0.18)",
        glass: "0 16px 40px rgba(0,0,0,0.35)"
      },
      borderRadius: {
        xl: "20px",
        "2xl": "28px",
        "3xl": "36px"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseLine: {
          "0%": { opacity: "0.2" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "0.2" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        rise: "rise 0.8s ease-out both",
        pulseLine: "pulseLine 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
