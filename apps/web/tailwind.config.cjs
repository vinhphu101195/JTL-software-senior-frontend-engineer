/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@jtl/shared/tailwind-preset.cjs")],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/*/src/**/*.{ts,tsx}",
  ],
};
