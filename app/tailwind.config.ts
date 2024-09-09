

import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
	content: ['./src/**/*.{astro,html,js,jsx,svelte,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        primary: colors.purple,
        neutral: colors.slate,
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.red,
      },
    },
  },
  plugins: [],
} satisfies Config;
