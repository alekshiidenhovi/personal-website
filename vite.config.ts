import { cloudflare } from '@cloudflare/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { Features } from 'lightningcss';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue(), cloudflare()],
  css: {
    // Lightning CSS, for the shared breakpoints in styles/media.css (`@custom-media`)
    transformer: 'lightningcss',
    lightningcss: {
      drafts: { customMedia: true },
      /*
       * Colors stay as written. Lowered, oklch would reach scripts as lab(),
       * which the canvas color conversion (lib/color.ts) doesn't read.
       */
      exclude: Features.Colors,
    },
  },
  build: { cssMinify: 'lightningcss' },
});
