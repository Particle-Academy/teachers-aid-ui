import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: { entry: ["src/index.ts"] },
  external: ["react", "react-dom", "@particle-academy/react-fancy", "axios"],
  treeshake: true,
  clean: true,
  sourcemap: true,
});
