import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const manifestSections = [
	"dependencies",
	"devDependencies",
	"peerDependencies",
	"optionalDependencies",
];

const workspacePrefix = "workspace:";

const isVersionPublished = (packageName, version) => {
	const lookupResult = spawnSync(
		"npm",
		["view", `${packageName}@${version}`, "version", "--json"],
		{
			cwd: rootDir,
			stdio: "pipe",
			encoding: "utf8",
			env: process.env,
		}
	);

	if (lookupResult.status !== 0) {
		return false;
	}

	const output = lookupResult.stdout?.trim();

	if (!output) {
		return false;
	}

	try {
		const parsed = JSON.parse(output);

		if (typeof parsed === "string") {
			return parsed === version;
		}

		if (Array.isArray(parsed)) {
			return parsed.includes(version);
		}
	} catch {
		return output === version;
	}

	return false;
};

const rootDir = path.resolve(import.meta.dirname, "..");
const packagesDir = path.join(rootDir, "packages");

const args = process.argv.slice(2);
const packageNames = args.filter((arg) => !arg.startsWith("--"));
const isDryRun = args.includes("--dry-run");
const isPublic = !args.includes("--no-access-public");

if (packageNames.length !== 1) {
	console.error(
		"Usage: bun run publish:workspace -- <package-name> [--dry-run]"
	);
	process.exit(1);
}

const readJson = (filePath) => {
	const content = readFileSync(filePath, "utf8");

	return JSON.parse(content);
};

const resolveWorkspaceVersion = (range, version) => {
	const suffix = range.slice(workspacePrefix.length);

	if (suffix === "" || suffix === "*") {
		return `^${version}`;
	}

	if (suffix === "^") {
		return `^${version}`;
	}

	if (suffix === "~") {
		return `~${version}`;
	}

	return suffix;
};

const getWorkspacePackages = () => {
	const directories = readdirSync(packagesDir, {
		withFileTypes: true,
	}).filter((entry) => entry.isDirectory());

	const packages = new Map();

	for (const directory of directories) {
		const packageDir = path.join(packagesDir, directory.name);
		const packageJsonPath = path.join(packageDir, "package.json");

		try {
			const manifest = readJson(packageJsonPath);

			if (typeof manifest.name === "string") {
				packages.set(manifest.name, {
					dir: packageDir,
					manifest,
					packageJsonPath,
				});
			}
		} catch {
			// Ignore folders without valid package.json.
		}
	}

	return packages;
};

const workspacePackages = getWorkspacePackages();
const targetName = packageNames[0];
const target = workspacePackages.get(targetName);

if (!target) {
	console.error(`Workspace package not found: ${targetName}`);
	process.exit(1);
}

if (target.manifest.private) {
	console.error(`Cannot publish private package: ${targetName}`);
	process.exit(1);
}

const getWorkspaceRuntimeDependencies = (manifest) => {
	const runtimeDependencies = {
		...(manifest.dependencies ?? {}),
		...(manifest.optionalDependencies ?? {}),
	};

	const packageNames = [];

	for (const [dependencyName, dependencyRange] of Object.entries(
		runtimeDependencies
	)) {
		if (typeof dependencyRange !== "string") {
			continue;
		}

		if (!dependencyRange.startsWith(workspacePrefix)) {
			continue;
		}

		if (!workspacePackages.has(dependencyName)) {
			continue;
		}

		packageNames.push(dependencyName);
	}

	return packageNames;
};

const publishOrder = [];
const visited = new Set();
const visiting = new Set();

const visit = (packageName) => {
	if (visited.has(packageName)) {
		return;
	}

	if (visiting.has(packageName)) {
		throw new Error(
			`Detected cyclic workspace dependency involving: ${packageName}`
		);
	}

	const currentPackage = workspacePackages.get(packageName);

	if (!currentPackage) {
		throw new Error(`Unknown package in dependency graph: ${packageName}`);
	}

	visiting.add(packageName);

	const dependencies = getWorkspaceRuntimeDependencies(currentPackage.manifest);

	for (const dependencyName of dependencies) {
		const dependency = workspacePackages.get(dependencyName);

		if (!dependency || dependency.manifest.private) {
			throw new Error(
				`Package ${packageName} depends on non-publishable workspace package ${dependencyName}`
			);
		}

		visit(dependencyName);
	}

	visiting.delete(packageName);
	visited.add(packageName);
	publishOrder.push(packageName);
};

visit(targetName);

const rewriteManifest = (manifest) => {
	const rewritten = structuredClone(manifest);

	for (const section of manifestSections) {
		const sectionValue = rewritten[section];

		if (!sectionValue || typeof sectionValue !== "object") {
			continue;
		}

		for (const [dependencyName, dependencyRange] of Object.entries(
			sectionValue
		)) {
			if (typeof dependencyRange !== "string") {
				continue;
			}

			if (!dependencyRange.startsWith(workspacePrefix)) {
				continue;
			}

			const workspaceDependency = workspacePackages.get(dependencyName);

			if (!workspaceDependency) {
				throw new Error(
					`Dependency ${dependencyName} uses workspace protocol but no local package exists.`
				);
			}

			if (workspaceDependency.manifest.private) {
				throw new Error(
					`Dependency ${dependencyName} is private and cannot be published as dependency.`
				);
			}

			sectionValue[dependencyName] = resolveWorkspaceVersion(
				dependencyRange,
				workspaceDependency.manifest.version
			);
		}
	}

	return rewritten;
};

const publishWorkspacePackage = (workspacePackageName) => {
	const workspacePackage = workspacePackages.get(workspacePackageName);

	if (!workspacePackage) {
		throw new Error(
			`Package not found during publish: ${workspacePackageName}`
		);
	}

	const originalManifest = readFileSync(
		workspacePackage.packageJsonPath,
		"utf8"
	);

	if (
		!isDryRun &&
		isVersionPublished(
			workspacePackage.manifest.name,
			workspacePackage.manifest.version
		)
	) {
		console.warn(
			`Skipping ${workspacePackageName}: version ${workspacePackage.manifest.version} is already published.`
		);
		return;
	}

	const rewrittenManifest = rewriteManifest(workspacePackage.manifest);

	try {
		writeFileSync(
			workspacePackage.packageJsonPath,
			`${JSON.stringify(rewrittenManifest, null, 2)}\n`,
			"utf8"
		);

		const publishArguments = ["publish"];

		if (isPublic) {
			publishArguments.push("--access", "public");
		}

		if (isDryRun) {
			publishArguments.push("--dry-run");
		}

		const publishResult = spawnSync("bun", publishArguments, {
			cwd: workspacePackage.dir,
			stdio: "inherit",
			env: process.env,
		});

		if (publishResult.status !== 0) {
			throw new Error(`Failed publishing ${workspacePackageName}`);
		}
	} finally {
		writeFileSync(workspacePackage.packageJsonPath, originalManifest, "utf8");
	}
};

for (const workspacePackageName of publishOrder) {
	console.log(
		`\nPublishing ${workspacePackageName}${isDryRun ? " (dry-run)" : ""}...`
	);
	publishWorkspacePackage(workspacePackageName);
}

console.log(
	`\nDone. Published ${publishOrder.length} package(s) in dependency order.`
);
