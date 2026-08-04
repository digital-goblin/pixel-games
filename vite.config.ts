import { defineConfig } from "vite";

// Base is relative so the built app works both on the web and inside a
// Capacitor native shell (which loads from a file:// / capacitor:// origin).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2020",
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
