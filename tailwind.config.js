/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./munkaink/*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F5",   // warm off-white canvas
        cloud: "#FFFFFF",   // cards / lifted surfaces
        ink: {
          DEFAULT: "#1A1816", // near-black, slightly warm
          soft: "#3B3733",
        },
        muted: "#6E665C",    // secondary text
        line: "#E8E1D6",     // hairline borders
        brass: {
          light: "#C9A87C",
          DEFAULT: "#B0895E", // single accent — muted antique brass
          dark: "#8C6E45",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.28em",
      },
      maxWidth: {
        site: "1240px",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
