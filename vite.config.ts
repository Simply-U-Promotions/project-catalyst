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
    // Extreme memory optimization
    chunkSizeWarningLimit: 1000,
    // Optimize asset handling
    assetsInlineLimit: 2048, // Inline only very small assets
    // Reduce bundle size
    reportCompressedSize: false, // Faster builds
    // Limit concurrent builds
    maxParallelFileOps: 2,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Ultra-aggressive code splitting for memory efficiency
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            // React ecosystem
            if (id.includes('react-') && !id.includes('react-dom')) {
              return 'react-libs';
            }
            // tRPC stack
            if (id.includes('@trpc')) {
              return 'trpc';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            // UI components - split by package
            if (id.includes('@radix-ui')) {
              const match = id.match(/@radix-ui\/react-([^/]+)/);
              if (match) {
                return `radix-${match[1]}`;
              }
              return 'radix-ui';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // AWS SDK
            if (id.includes('@aws-sdk')) {
              return 'aws-sdk';
            }
            // Heavy visualization libraries
            if (id.includes('mermaid') || id.includes('cytoscape')) {
              return 'viz-libs';
            }
            // Markdown and syntax highlighting
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'markdown';
            }
            if (id.includes('highlight.js') || id.includes('prism')) {
              return 'syntax';
            }
            // Animation
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            // All other node_modules
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
    // Aggressive tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
      preset: 'smallest',
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
