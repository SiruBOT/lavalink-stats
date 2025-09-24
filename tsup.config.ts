import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  dts: false,
  target: 'node18',
  splitting: false,
  shims: false,
  keepNames: true,
  minify: false,
});
