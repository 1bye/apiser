import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgDir = path.resolve(__dirname, "..");
const srcDts = path.join(pkgDir, "src", "zod.d.ts");
const distDir = path.join(pkgDir, "dist");
const distDts = path.join(distDir, "zod.d.ts");
const indexDts = path.join(distDir, "index.d.mts");

const referenceLine = '/// <reference path="./zod.d.ts" />\n';

async function fileExists(p) {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	await fs.mkdir(distDir, { recursive: true });

	if (!(await fileExists(srcDts))) {
		throw new Error(`Missing source declaration file: ${srcDts}`);
	}

	await fs.copyFile(srcDts, distDts);

	if (!(await fileExists(indexDts))) {
		throw new Error(
			`Missing generated declaration file: ${indexDts}. Did the build step generate declarations?`
		);
	}

	const current = await fs.readFile(indexDts, "utf8");

	if (!current.startsWith(referenceLine)) {
		const next = referenceLine + current;
		await fs.writeFile(indexDts, next, "utf8");
	}
}

await main();
