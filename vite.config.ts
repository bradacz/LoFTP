import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 1420,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "safari14",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@tauri-apps")) return "tauri";
          if (id.includes("node_modules/@radix-ui")) return "radix";
          if (
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/@iconify") ||
            id.includes("node_modules/@remixicon")
          ) {
            return "icons";
          }
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
