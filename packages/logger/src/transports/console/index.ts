import {
	bold,
	cyanBright,
	dim,
	gray,
	greenBright,
	redBright,
	whiteBright,
	yellowBright,
} from "colorette";
import { colorize } from "json-colorizer";
import { createTransport } from "@/transport";

export interface ConsoleTransportOptions {
	format?: () => string;
	mode?: "json" | "pretty";
}

const levelColor: Record<string, (s: string) => string> = {
	trace: (s) => dim(gray(s)),
	debug: (s) => cyanBright(s),
	info: (s) => greenBright(s),
	warn: (s) => yellowBright(s),
	error: (s) => redBright(s),
	fatal: (s) => bold(redBright(s)),
};

export function createConsole(options?: ConsoleTransportOptions) {
	const mode = options?.mode ?? "json";
	const format = options?.format;

	return createTransport({
		log: ({ timestamp, level, data, file, message }) => {
			let line = "";

			if (mode === "json") {
				line = format
					? format()
					: JSON.stringify({
							timestamp,
							level,
							data,
							file,
							message,
						});
			} else {
				const paintLevel = levelColor[level] ?? ((s: string) => s);

				const dataAvailable = data && Object.keys(data).length > 0;
				const dataString =
					data && Object.keys(data).length > 0
						? "\n" +
							(() => {
								const json = colorize(data);
								const lines = json.split("\n");

								return lines
									.map(
										(item, index) =>
											`${gray(lines.length - 1 === index ? "└" : "│")} ${item}`
									)
									.join("\n");
							})()
						: "";

				const header =
					(dataAvailable ? gray("┌") : dim("[")) +
					dim(file.path) +
					dim(":") +
					dim(String(file.codeLine)) +
					dim("]");

				const levelTag = paintLevel(level.toUpperCase().padEnd(5).trim());
				const msg = whiteBright(bold(message));

				line = format ? format() : `${header} ${levelTag} ${msg}${dataString}`;
			}

			console[level](line);
		},

		flush: () => {
			// nothing
		},
	});
}
