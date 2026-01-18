import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Use port 3000 to match Lumea runner expectations (same as Next.js)
    port: 3000,
    strictPort: true,
    // HMR configuration for Daytona proxy compatibility
    hmr: {
      // Use the same port for HMR websocket (works through Daytona proxy)
      clientPort: 443,
      protocol: 'wss',
    },
    // Allow connections from Daytona proxy
    host: true,
  },
  preview: {
    port: 3000,
  },
})
