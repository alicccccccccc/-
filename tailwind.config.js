export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3" },
        space: { 900: "#0B0F19", 800: "#111827", 700: "#1A1F2E", 600: "#1F2937" },
      },
      borderRadius: { "2xl": "16px" },
    },
  },
  plugins: [],
};
