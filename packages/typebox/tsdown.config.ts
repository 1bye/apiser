import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/compile.ts"],
  dts: true,
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@apiser\/.*/],
});
