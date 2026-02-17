import { describe, expect, test } from "bun:test";
import { KeyvStore } from "@apisr/controller/cache/keyv";
import { z } from "@apisr/zod";
import Keyv from "keyv";
import type { CacheCallbackOptions, CacheStore } from "@/cache";
import { createHandler, createOptions } from "@/index";

class MemoryStore implements CacheStore {
	private readonly map = new Map<string, unknown>();
	public lastSetOptions: CacheCallbackOptions | undefined;

	async get<TValue = unknown>(key: string): Promise<TValue | undefined> {
		return this.map.get(key) as TValue | undefined;
	}

	async set<TValue = unknown>(
		key: string,
		value: TValue,
		options?: CacheCallbackOptions
	): Promise<void> {
		this.lastSetOptions = options;
		this.map.set(key, value);
	}
}

describe("@apisr/controller", () => {
	describe("cache", () => {
		test("wrapHandler caches full handler callback result", async () => {
			const store = new MemoryStore();
			let calls = 0;

			const options = createOptions({
				name: "cache-wrap-controller",
				cache: {
					store,
					wrapHandler: true,
					key: ({ payload }) => [
						"wrap",
						String((payload as { id: number }).id),
					],
				},
			});

			const handler = createHandler(options);
			const main = handler(
				async ({ payload }) => {
					calls += 1;

					return {
						id: (payload as { id: number }).id,
						nonce: Math.random(),
					};
				},
				{
					payload: z.object({
						id: z.number(),
					}),
				}
			);

			const first = await main({ id: 1 });
			const second = await main({ id: 1 });
			const third = await main({ id: 2 });

			expect(first.error).toBeNull();
			expect(second.error).toBeNull();
			expect(third.error).toBeNull();
			expect(first.data).toEqual(second.data);
			expect(first.data).not.toEqual(third.data);
			expect(calls).toBe(2);
		});

		test("cache() returns cached value on subsequent calls", async () => {
			const store = new MemoryStore();
			let calls = 0;

			const options = createOptions({
				name: "cache-controller",
				cache: {
					store,
				},
			});

			const handler = createHandler(options);

			const main = handler(
				async ({ cache, payload }) => {
					const payloadName = (payload as { name: string }).name;

					return await cache(
						"user",
						async () => {
							calls += 1;

							return {
								value: payloadName,
								nonce: Math.random(),
							};
						},
						{
							ttl: 123,
						}
					);
				},
				{
					payload: z.object({
						name: z.string(),
					}),
					cache: {
						key: ({ payload }) => ["users", (payload as { name: string }).name],
						store,
					},
				}
			);

			const first = await main({ name: "alice" });
			const second = await main({ name: "alice" });

			expect(first.error).toBeNull();
			expect(second.error).toBeNull();
			expect(calls).toBe(1);
			expect(first.data).toEqual(second.data);
			expect(store.lastSetOptions?.ttl).toBe(123);
		});

		test("KeyvStore adapts a Keyv instance", async () => {
			const keyv = new Keyv();
			const store = new KeyvStore(keyv);

			await store.set("cache:key", 123, { ttl: 1000 });
			const value = await store.get<number>("cache:key");

			expect(value).toBe(123);
		});
	});
});
