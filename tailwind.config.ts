import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14171f",
        fog: "#f6f7f9",
        line: "#d9dde6",
        steel: "#536173",
        signal: "#506cf7",
        caution: "#b45309",
        danger: "#b42318"
      }
    }
  },
  plugins: []
};

export default config;
