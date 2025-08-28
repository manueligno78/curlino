import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      {
        name: 'copy-preload',
        writeBundle() {
          try {
            copyFileSync('preload-simple.js', 'out/main/preload-simple.js')

            console.log('✓ Copied preload-simple.js to out/main/')
          } catch (e) {
            console.warn('⚠ Failed to copy preload-simple.js:', e.message)
          }
        }
      }
    ],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron.js')
      }
    }
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'preload.cjs'),
        formats: ['cjs']
      },
      rollupOptions: {
        external: ['electron']
      },
      outDir: 'out/preload'
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
    publicDir: resolve(__dirname, 'public/images'),
    server: {
      port: 5173
    }
  }
})