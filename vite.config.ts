import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Optimize for memory efficiency
    chunkSizeWarningLimit: 2000,
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets < 4KB
    // Reduce bundle size
    reportCompressedSize: false, // Faster builds
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Aggressive code splitting to reduce memory usage
          if (id.includes('node_modules')) {
            // Split large libraries into separate chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@trpc') || id.includes('@tanstack')) {
              return 'trpc-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('mermaid') || id.includes('cytoscape') || id.includes('highlight.js')) {
              return 'heavy-libs';
            }
            // All other node_modules go into vendor chunk
            return 'vendor';
          }
        },
      },
    },
    // Reduce memory usage during minification
    minify: 'esbuild',
    target: 'es2020',
    // Optimize source maps for production
    sourcemap: false,
    // Increase chunk size limit to prevent warnings
    cssCodeSplit: true,
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: 'no-external',
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
    // Additional memory optimizations
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Limit parallel processing to reduce memory
    modulePreload: {
      polyfill: false,
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
