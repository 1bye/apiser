import { describe, expect, test } from "bun:test";
import { createLogger } from "@/index";
import { createConsole } from "@/console";

describe("@apiser/logger console transport", () => {
  test("json mode prints JSON containing caller file path and line", () => {
    const logger = createLogger({
      name: "t",
      transports: {
        console: createConsole({ mode: "json" }),
      },
    });

    logger.info("hello-json");
  });

  test("pretty mode includes caller file path and line (ansi stripped)", () => {
    const logger = createLogger({
      name: "t",
      transports: {
        console: createConsole({ mode: "pretty" }),
      },
    });

    logger.info("hello-json");
    logger.warn("hello-json");
    logger.error("hello-json");
    logger.debug("hello-json");
    logger.info("Message with object", {
      number: 123,
      string: "hello world",
      boolean: true,
      object: {
        name: "str"
      },
      date: new Date()
    });
  });
});
