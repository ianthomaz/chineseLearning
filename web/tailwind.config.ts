import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        bg: "var(--bg)",
        ink: "var(--ink)",
        accent: "var(--accent)",
        "accent-warm": "var(--accent-warm)",
        "accent-2": "var(--accent-2)",
        muted: "var(--muted)",
        border: "var(--border)",
        "on-accent": "var(--on-accent)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        danger: "var(--danger)",
        "danger-bg": "var(--danger-bg)",
        warn: "var(--warn)",
        "warn-bg": "var(--warn-bg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-serif)"],
        hanzi: ['"Noto Sans SC"', "PingFang SC", "Microsoft YaHei", "sans-serif"],
        ruby: [
          '"Hanzi Pinyin"',
          '"Noto Sans SC"',
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
