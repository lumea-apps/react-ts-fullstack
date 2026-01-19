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
    // Default Vite port for local development
    port: 5173,
    strictPort: false,
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
    port: 5173,
  },
})
