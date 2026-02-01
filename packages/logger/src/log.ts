import type { LogLevels } from "./level";

export interface Log {
  timestamp: number;
  level: LogLevels;
  message: string;
  data: Record<string, unknown>;
}
