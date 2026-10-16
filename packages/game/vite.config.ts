import { defineConfig } from "vite";

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier subcarpeta (GitHub Pages, itch.io, un zip abierto desde un servidor).
  base: "./",
  server: { port: 5170 },
});
