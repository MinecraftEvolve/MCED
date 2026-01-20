import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          'recipe-editors': [
            './src/renderer/components/KubeJS/RecipeEditor/CraftingShapedEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CraftingShapelessEditor',
            './src/renderer/components/KubeJS/RecipeEditor/SmeltingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/BlastingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/SmokingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CampfireCookingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/StonecuttingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/SmithingEditor',
          ],
          'create-editors': [
            './src/renderer/components/KubeJS/RecipeEditor/CreateCrushingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateMixingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreatePressingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateCuttingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateMillingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateDeployingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateFillingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateEmptyingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateCompactingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateMechanicalCraftingEditor',
            './src/renderer/components/KubeJS/RecipeEditor/CreateSequencedAssemblyEditor',
          ],
          'vendor': ['react', 'react-dom', 'react-window', 'zustand', 'framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});
