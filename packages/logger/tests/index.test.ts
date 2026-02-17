import { describe, expect, test } from "bun:test";
import { createLogger, createTransport } from "@/index";

function createSpyTransport() {
	const logCalls: any[] = [];
	const flushCalls: any[] = [];

	const transport = createTransport({
		log: (ctx) => {
			logCalls.push(ctx);
		},
		flush: async ({ store, logs }) => {
			flushCalls.push({ store, logs });
		},
	});

	return { transport, logCalls, flushCalls };
}

describe("@apisr/logger", () => {
	test("to() routes logs only to selected transport", () => {
		const a = createSpyTransport();
		const b = createSpyTransport();

		const logger = createLogger({
			name: "t",
			transports: {
				a: a.transport,
				b: b.transport,
			},
		});

		logger.to("a").info("hello");

		expect(a.logCalls.length).toBe(1);
		expect(b.logCalls.length).toBe(0);
		expect(a.logCalls[0].message).toBe("hello");
		expect(a.logCalls[0].level).toBe("info");
	});

	test("extend() can exclude transports", () => {
		const a = createSpyTransport();
		const b = createSpyTransport();

		const logger = createLogger({
			name: "t",
			transports: {
				a: a.transport,
				b: b.transport,
			},
		});

		const onlyA = logger.extend({ excludeTransport: ["b"] });
		onlyA.info("hello");

		expect(a.logCalls.length).toBe(1);
		expect(b.logCalls.length).toBe(0);
	});

	test("flush() calls transport flush with collected logs and then clears them", async () => {
		const a = createSpyTransport();

		const logger = createLogger({
			name: "t",
			transports: {
				a: a.transport,
			},
		});

		logger.info("one", { a: 1 });
		logger.warn("two");

		await logger.flush();

		expect(a.flushCalls.length).toBe(1);
		expect(a.flushCalls[0].logs.length).toBe(2);
		expect(a.flushCalls[0].logs[0].message).toBe("one");

		await logger.flush();
		expect(a.flushCalls.length).toBe(2);
		expect(a.flushCalls[1].logs.length).toBe(0);
	});

	test("autoFlush interval triggers flush", async () => {
		const a = createSpyTransport();

		const logger = createLogger({
			name: "t",
			transports: {
				a: a.transport,
			},
			autoFlush: {
				intervalMs: 5,
			},
		});

		logger.info("hello");

		await new Promise((r) => setTimeout(r, 30));

		expect(a.flushCalls.length).toBeGreaterThan(0);
	});

	test("autoFlush on beforeExit triggers flush", async () => {
		const a = createSpyTransport();

		const logger = createLogger({
			name: "t",
			transports: {
				a: a.transport,
			},
			autoFlush: {
				on: ["beforeExit"],
			},
		});

		logger.info("hello");

		process.emit("beforeExit", 0);

		await new Promise((r) => setTimeout(r, 0));

		expect(a.flushCalls.length).toBe(1);
		expect(a.flushCalls[0].logs.length).toBe(1);
		expect(a.flushCalls[0].logs[0].message).toBe("hello");
	});
});
