import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tempo } from "tempo-devtools/dist/vite"; // Add Tempo plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tempo()], // Add Tempo plugin
  server: {
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined, // Whatever was the previous value or undefined
  },
});
