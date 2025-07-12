// vite.config.ts
import path from "path";
import { fileURLToPath } from "url";
import react from "file:///home/shubham/developer/ytclipper/node_modules/.pnpm/@vitejs+plugin-react@4.6.0_vite@5.4.19_@types+node@20.19.2_lightningcss@1.30.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///home/shubham/developer/ytclipper/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.2_lightningcss@1.30.1/node_modules/vite/dist/node/index.js";
import { viteStaticCopy } from "file:///home/shubham/developer/ytclipper/node_modules/.pnpm/vite-plugin-static-copy@3.1.0_vite@5.4.19_@types+node@20.19.2_lightningcss@1.30.1_/node_modules/vite-plugin-static-copy/dist/index.js";

// manifest.ts
var manifest = {
  manifest_version: 3,
  name: "__MSG_extensionName__",
  version: "1.0.0",
  description: "__MSG_extensionDescription__",
  default_locale: "en",
  permissions: ["activeTab", "storage", "scripting", "tabs", "storage"],
  host_permissions: [
    "https://www.youtube.com/*",
    "https://youtube.com/*",
    "https://app.ytclipper.com/*",
    "https://ytclipper.com/*",
    "http://localhost:5173/*"
  ],
  background: {
    service_worker: "src/background/index.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "https://www.youtube.com/*",
        "https://youtube.com/*",
        "http://localhost:5173/*",
        "https://app.ytclipper.com/*"
      ],
      js: ["src/content/index.js"],
      css: ["assets/content.css"],
      run_at: "document_end"
    }
  ],
  action: {
    default_popup: "src/popup/index.html",
    default_title: "YTClipper",
    default_icon: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
      128: "icon-128.png"
    }
  },
  icons: {
    16: "icon-16.png",
    32: "icon-32.png",
    48: "icon-48.png",
    128: "icon-128.png"
  },
  web_accessible_resources: [
    {
      resources: ["src/content-ui/index.js"],
      matches: ["https://www.youtube.com/*", "https://youtube.com/*"]
    }
  ]
};
var manifest_default = manifest;

// vite.config.ts
var __vite_injected_original_import_meta_url = "file:///home/shubham/developer/ytclipper/apps/extension/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  return {
    plugins: [
      react(),
      {
        name: "generate-manifest",
        buildStart() {
          this.emitFile({
            type: "asset",
            fileName: "manifest.json",
            source: JSON.stringify(manifest_default, null, 2)
          });
        }
      },
      viteStaticCopy({
        targets: [
          {
            src: "_locales",
            dest: ""
          }
        ]
      })
    ],
    define: {
      __DEV__: !isProduction
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: path.resolve(__dirname, "src/background/index.ts"),
          content: path.resolve(__dirname, "src/content/index.ts"),
          "content-ui": path.resolve(__dirname, "src/content-ui/index.tsx"),
          popup: path.resolve(__dirname, "src/popup/index.html")
        },
        output: {
          entryFileNames: (chunk) => {
            const facadeModuleId = chunk.facadeModuleId;
            if (facadeModuleId?.includes("background")) {
              return "src/background/index.js";
            }
            if (facadeModuleId?.includes("content.")) {
              return "src/content/index.js";
            }
            if (facadeModuleId?.includes("content-ui")) {
              return "src/content-ui/index.js";
            }
            return "src/[name]/index.js";
          },
          chunkFileNames: "chunks/[name].[hash].js",
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || "";
            if (name.endsWith(".css")) {
              if (name.includes("content")) {
                return "assets/content.css";
              }
              return "assets/[name].[ext]";
            }
            return "assets/[name].[ext]";
          }
        }
      },
      minify: isProduction,
      sourcemap: !isProduction,
      target: "es2020"
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@ytclipper/extension-dev-utils": path.resolve(
          __dirname,
          "packages/dev-utils"
        )
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9zaHViaGFtL2RldmVsb3Blci95dGNsaXBwZXIvYXBwcy9leHRlbnNpb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3NodWJoYW0vZGV2ZWxvcGVyL3l0Y2xpcHBlci9hcHBzL2V4dGVuc2lvbi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9zaHViaGFtL2RldmVsb3Blci95dGNsaXBwZXIvYXBwcy9leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcblxuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QnO1xuXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBpc1Byb2R1Y3Rpb24gPSBtb2RlID09PSAncHJvZHVjdGlvbic7XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAge1xuICAgICAgICBuYW1lOiAnZ2VuZXJhdGUtbWFuaWZlc3QnLFxuICAgICAgICBidWlsZFN0YXJ0KCkge1xuICAgICAgICAgIHRoaXMuZW1pdEZpbGUoe1xuICAgICAgICAgICAgdHlwZTogJ2Fzc2V0JyxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAnbWFuaWZlc3QuanNvbicsXG4gICAgICAgICAgICBzb3VyY2U6IEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKSxcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgICAgdGFyZ2V0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ19sb2NhbGVzJyxcbiAgICAgICAgICAgIGRlc3Q6IFwiXCIsXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KVxuICAgIF0sXG4gICAgZGVmaW5lOiB7XG4gICAgICBfX0RFVl9fOiAhaXNQcm9kdWN0aW9uLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9iYWNrZ3JvdW5kL2luZGV4LnRzJyksXG4gICAgICAgICAgY29udGVudDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9jb250ZW50L2luZGV4LnRzJyksXG4gICAgICAgICAgJ2NvbnRlbnQtdWknOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2NvbnRlbnQtdWkvaW5kZXgudHN4JyksXG4gICAgICAgICAgcG9wdXA6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvcG9wdXAvaW5kZXguaHRtbCcpLFxuICAgICAgICB9LFxuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogY2h1bmsgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmFjYWRlTW9kdWxlSWQgPSBjaHVuay5mYWNhZGVNb2R1bGVJZDtcblxuICAgICAgICAgICAgaWYgKGZhY2FkZU1vZHVsZUlkPy5pbmNsdWRlcygnYmFja2dyb3VuZCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnc3JjL2JhY2tncm91bmQvaW5kZXguanMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZhY2FkZU1vZHVsZUlkPy5pbmNsdWRlcygnY29udGVudC4nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3NyYy9jb250ZW50L2luZGV4LmpzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmYWNhZGVNb2R1bGVJZD8uaW5jbHVkZXMoJ2NvbnRlbnQtdWknKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3NyYy9jb250ZW50LXVpL2luZGV4LmpzJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICdzcmMvW25hbWVdL2luZGV4LmpzJztcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnY2h1bmtzL1tuYW1lXS5baGFzaF0uanMnLFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiBhc3NldEluZm8gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGFzc2V0SW5mby5uYW1lIHx8ICcnO1xuXG4gICAgICAgICAgICBpZiAobmFtZS5lbmRzV2l0aCgnLmNzcycpKSB7XG4gICAgICAgICAgICAgIGlmIChuYW1lLmluY2x1ZGVzKCdjb250ZW50JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9jb250ZW50LmNzcyc7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9bbmFtZV0uW2V4dF0nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9bbmFtZV0uW2V4dF0nO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbWluaWZ5OiBpc1Byb2R1Y3Rpb24sXG4gICAgICBzb3VyY2VtYXA6ICFpc1Byb2R1Y3Rpb24sXG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG4gICAgICAgICdAeXRjbGlwcGVyL2V4dGVuc2lvbi1kZXYtdXRpbHMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAgICdwYWNrYWdlcy9kZXYtdXRpbHMnLFxuICAgICAgICApLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3NodWJoYW0vZGV2ZWxvcGVyL3l0Y2xpcHBlci9hcHBzL2V4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvc2h1YmhhbS9kZXZlbG9wZXIveXRjbGlwcGVyL2FwcHMvZXh0ZW5zaW9uL21hbmlmZXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3NodWJoYW0vZGV2ZWxvcGVyL3l0Y2xpcHBlci9hcHBzL2V4dGVuc2lvbi9tYW5pZmVzdC50c1wiO2ltcG9ydCB0eXBlIHsgTWFuaWZlc3QgfSBmcm9tICcuL3BhY2thZ2VzL2Rldi11dGlscyc7XG5cbmNvbnN0IG1hbmlmZXN0OiBNYW5pZmVzdCA9IHtcbiAgbWFuaWZlc3RfdmVyc2lvbjogMyxcbiAgbmFtZTogJ19fTVNHX2V4dGVuc2lvbk5hbWVfXycsXG4gIHZlcnNpb246ICcxLjAuMCcsXG4gIGRlc2NyaXB0aW9uOiAnX19NU0dfZXh0ZW5zaW9uRGVzY3JpcHRpb25fXycsXG4gIGRlZmF1bHRfbG9jYWxlOiAnZW4nLFxuXG4gIHBlcm1pc3Npb25zOiBbJ2FjdGl2ZVRhYicsICdzdG9yYWdlJywgJ3NjcmlwdGluZycsICd0YWJzJywgJ3N0b3JhZ2UnXSxcblxuICBob3N0X3Blcm1pc3Npb25zOiBbXG4gICAgJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tLyonLFxuICAgICdodHRwczovL3lvdXR1YmUuY29tLyonLFxuICAgICdodHRwczovL2FwcC55dGNsaXBwZXIuY29tLyonLFxuICAgICdodHRwczovL3l0Y2xpcHBlci5jb20vKicsXG4gICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6NTE3My8qJyxcbiAgXSxcblxuICBiYWNrZ3JvdW5kOiB7XG4gICAgc2VydmljZV93b3JrZXI6ICdzcmMvYmFja2dyb3VuZC9pbmRleC5qcycsXG4gICAgdHlwZTogJ21vZHVsZScsXG4gIH0sXG5cbiAgY29udGVudF9zY3JpcHRzOiBbXG4gICAge1xuICAgICAgbWF0Y2hlczogW1xuICAgICAgICAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vKicsXG4gICAgICAgICdodHRwczovL3lvdXR1YmUuY29tLyonLFxuICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDo1MTczLyonLFxuICAgICAgICAnaHR0cHM6Ly9hcHAueXRjbGlwcGVyLmNvbS8qJyxcbiAgICAgIF0sXG4gICAgICBqczogWydzcmMvY29udGVudC9pbmRleC5qcyddLFxuICAgICAgY3NzOiBbJ2Fzc2V0cy9jb250ZW50LmNzcyddLFxuICAgICAgcnVuX2F0OiAnZG9jdW1lbnRfZW5kJyxcbiAgICB9LFxuICBdLFxuXG4gIGFjdGlvbjoge1xuICAgIGRlZmF1bHRfcG9wdXA6ICdzcmMvcG9wdXAvaW5kZXguaHRtbCcsXG4gICAgZGVmYXVsdF90aXRsZTogJ1lUQ2xpcHBlcicsXG4gICAgZGVmYXVsdF9pY29uOiB7XG4gICAgICAxNjogJ2ljb24tMTYucG5nJyxcbiAgICAgIDMyOiAnaWNvbi0zMi5wbmcnLFxuICAgICAgNDg6ICdpY29uLTQ4LnBuZycsXG4gICAgICAxMjg6ICdpY29uLTEyOC5wbmcnLFxuICAgIH0sXG4gIH0sXG5cbiAgaWNvbnM6IHtcbiAgICAxNjogJ2ljb24tMTYucG5nJyxcbiAgICAzMjogJ2ljb24tMzIucG5nJyxcbiAgICA0ODogJ2ljb24tNDgucG5nJyxcbiAgICAxMjg6ICdpY29uLTEyOC5wbmcnLFxuICB9LFxuXG4gIHdlYl9hY2Nlc3NpYmxlX3Jlc291cmNlczogW1xuICAgIHtcbiAgICAgIHJlc291cmNlczogWydzcmMvY29udGVudC11aS9pbmRleC5qcyddLFxuICAgICAgbWF0Y2hlczogWydodHRwczovL3d3dy55b3V0dWJlLmNvbS8qJywgJ2h0dHBzOi8veW91dHViZS5jb20vKiddLFxuICAgIH0sXG4gIF0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBtYW5pZmVzdDtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1UsT0FBTyxVQUFVO0FBQ25WLFNBQVMscUJBQXFCO0FBRTlCLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHNCQUFzQjs7O0FDSC9CLElBQU0sV0FBcUI7QUFBQSxFQUN6QixrQkFBa0I7QUFBQSxFQUNsQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsRUFDVCxhQUFhO0FBQUEsRUFDYixnQkFBZ0I7QUFBQSxFQUVoQixhQUFhLENBQUMsYUFBYSxXQUFXLGFBQWEsUUFBUSxTQUFTO0FBQUEsRUFFcEUsa0JBQWtCO0FBQUEsSUFDaEI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBRUEsWUFBWTtBQUFBLElBQ1YsZ0JBQWdCO0FBQUEsSUFDaEIsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUVBLGlCQUFpQjtBQUFBLElBQ2Y7QUFBQSxNQUNFLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsSUFBSSxDQUFDLHNCQUFzQjtBQUFBLE1BQzNCLEtBQUssQ0FBQyxvQkFBb0I7QUFBQSxNQUMx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
