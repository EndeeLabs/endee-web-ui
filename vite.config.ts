import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    nodePolyfills({
      // Enable polyfills for Buffer and other Node.js globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable polyfills for Node.js built-in modules used by endee package
      include: ['buffer', 'zlib', 'crypto', 'stream', 'util'],
    }),
  ],
})
