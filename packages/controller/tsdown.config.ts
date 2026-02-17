import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts", "./src/elysia/index.ts", "./src/cache/**.*"],
	dts: true,
	format: "esm",
	outDir: "./dist",
	clean: true,
	unbundle: true,
	noExternal: [/@apisr\/.*/],
	external: ["zod"],
});
