import type { LogLevels } from "./level";

export interface Log {
	data: Record<string, unknown>;
	level: LogLevels;
	message: string;
	timestamp: number;
}
