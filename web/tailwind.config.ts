import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        accent: "var(--accent)",
        "accent-warm": "var(--accent-warm)",
        muted: "var(--muted)",
      },
      fontFamily: {
        display: ['"Newsreader"', "Georgia", "serif"],
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
