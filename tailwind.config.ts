import type { Config } from "tailwindcss"

export default {
    content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
    theme: {
      extend: {
        maxWidth: {
          '8xl': '88rem',
          '9xl': '96rem',
        },
      },
    },
  } satisfies Config