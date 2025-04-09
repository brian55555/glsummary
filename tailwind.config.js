/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "qb-blue": "#2CA01C", // QuickBooks green color
        "qb-green-dark": "#0D8390",
        "glow-primary": "#3B82F6", // Primary blue for glow effect
        "glow-secondary": "#8B5CF6", // Secondary purple for glow effect
        "glow-accent": "#10B981", // Accent green for glow effect
        "glow-dark": "#1E293B", // Dark background
        "glow-light": "#F8FAFC", // Light background
        "glow-text": "#334155", // Main text color
        "glow-text-light": "#94A3B8", // Light text color
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      screens: {
        print: { raw: "print" },
      },
      borderWidth: {
        3: "3px",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(59, 130, 246, 0.3)",
        glow: "0 0 25px -5px rgba(59, 130, 246, 0.4)",
        "glow-lg": "0 0 35px -5px rgba(59, 130, 246, 0.5)",
        "glow-xl": "0 0 50px -12px rgba(59, 130, 246, 0.6)",
        "glow-accent": "0 0 20px -5px rgba(16, 185, 129, 0.5)",
        "glow-purple": "0 0 20px -5px rgba(139, 92, 246, 0.5)",
      },
      backgroundImage: {
        "glow-gradient": "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
        "glow-gradient-light":
          "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
      },
    },
  },
  plugins: [],
  // Ensure print classes are not purged
  safelist: [
    "print:hidden",
    "print:block",
    "print:text-sm",
    "print:text-2xl",
    "bg-glow-gradient",
    "bg-glow-gradient-light",
    "shadow-glow",
    "shadow-glow-sm",
    "shadow-glow-lg",
    "shadow-glow-xl",
    "shadow-glow-accent",
    "shadow-glow-purple",
  ],
};
