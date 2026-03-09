import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:        "#0a0e1a",
          panel:     "#0f1629",
          border:    "#1e3a5f",
          muted:     "#1a2540",
          cyan:      "#00d4ff",
          orange:    "#f59e0b",
          green:     "#10b981",
          red:       "#ef4444",
          purple:    "#8b5cf6",
          text:      "#e2e8f0",
          secondary: "#94a3b8",
          dim:       "#475569",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
