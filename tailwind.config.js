/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crash: {
          bg: "#0a0a0c",
          panel: "#111114",
          line: "#1d1d22",
          red: "#ff3b47",
          amber: "#ffb454",
          green: "#3ddc84",
          blue: "#4d9fff",
          dim: "#8b8b93",
        },
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.4" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.6" },
          "97%": { opacity: "1" },
        },
        glitchShift: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(2px, -1px)" },
          "60%": { transform: "translate(-1px, -1px)" },
          "80%": { transform: "translate(1px, 1px)" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(61, 220, 132, 0.25)" },
          "100%": { backgroundColor: "rgba(61, 220, 132, 0)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
        flicker: "flicker 4s infinite",
        glitch: "glitchShift 0.3s steps(2) 3",
        flash: "flash 0.9s ease-out",
      },
    },
  },
  plugins: [],
};
