import { createTransport } from "@/transport";
import {
  bold,
  cyanBright,
  greenBright,
  yellowBright,
  redBright,
  magentaBright,
  whiteBright,
  gray,
  dim,
} from "colorette";
import { colorize } from "json-colorizer";

export interface ConsoleTransportOptions {
  mode?: "json" | "pretty";
  format?: () => string;
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

        const header =
          dim("[") +
          // cyanBright(name) +
          // dim("/") +
          gray(file.path) +
          dim(":") +
          magentaBright(String(file.codeLine)) +
          dim("]");

        const levelTag = paintLevel(level.toUpperCase().padEnd(5));
        const msg = whiteBright(bold(message));

        const dataString =
          data && Object.keys(data).length > 0
            ? "\n" + dim("↳ data:\n") + colorize(data)
            : "";

        line = format ? format() : `${header} ${levelTag} ${msg}${dataString}`;
      }

      console[level](line);
    },

    flush: () => {
      // nothing
    },
  });
}
