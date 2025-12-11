import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  dts: { build: true },
  minify: true,
  exports: true,
  format: "esm",
  target: "esnext",
  shims: true,
  platform: "node"
});
