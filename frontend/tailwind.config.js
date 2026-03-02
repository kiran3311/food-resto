/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          900: "#0f172a"
        },
        brand: {
          500: "#f97316",
          600: "#ea580c"
        }
      },
      boxShadow: {
        card: "0 16px 30px -12px rgb(15 23 42 / 0.15)"
      }
    }
  },
  plugins: []
};