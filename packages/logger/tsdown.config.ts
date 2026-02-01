import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/console.ts"],
  dts: true,
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@apiser\/.*/],
});
