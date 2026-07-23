import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12161C",
        paper: "#F6F7F9",
        panel: "#FFFFFF",
        line: "#E4E7EC",
        muted: "#6B7280",
        primary: "#3B4FD9",
        primaryDark: "#2E3EB0",
        ok: "#16A34A",
        okBg: "#EAF7EE",
        warn: "#D97706",
        warnBg: "#FDF3E4",
        crit: "#DC2626",
        critBg: "#FCEAEA",
        idle: "#6B7280",
        idleBg: "#EEF0F3",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
