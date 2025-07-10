import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import manifest from './manifest';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      {
        name: 'generate-manifest',
        buildStart() {
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: JSON.stringify(manifest, null, 2),
          })
        },
      },
      viteStaticCopy({
        targets: [
          {
            src: '_locales',
            dest: "",
          }
        ]
      })
    ],
    define: {
      __DEV__: !isProduction,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: path.resolve(__dirname, 'src/background/index.ts'),
          content: path.resolve(__dirname, 'src/content/index.ts'),
          'content-ui': path.resolve(__dirname, 'src/content-ui/index.tsx'),
          popup: path.resolve(__dirname, 'src/popup/index.html'),
        },
        output: {
          entryFileNames: chunk => {
            const facadeModuleId = chunk.facadeModuleId;
            if (facadeModuleId?.includes('background')) {
              return 'src/background/index.js';
            }
            if (facadeModuleId?.includes('content.')) {
              return 'src/content/index.js';
            }
            if (facadeModuleId?.includes('content-ui')) {
              return 'src/content-ui/index.js';
            }
            return 'src/[name]/index.js';
          },
          chunkFileNames: 'chunks/[name].[hash].js',
          assetFileNames: assetInfo => {
            const name = assetInfo.name || '';
            if (name.endsWith('.css')) {
              if (name.includes('content')) {
                return 'assets/content.css';
              }
              return 'assets/[name].[ext]';
            }
            return 'assets/[name].[ext]';
          },
        },
      },
      minify: isProduction,
      sourcemap: !isProduction,
      target: 'es2020',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@ytclipper/extension-dev-utils': path.resolve(
          __dirname,
          'packages/dev-utils',
        ),
      },
    },
  };
});
