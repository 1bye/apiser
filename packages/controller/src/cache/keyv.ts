import type { CacheCallbackOptions, CacheStore } from "../cache";

export interface KeyvLike {
	delete?(key: string): Promise<boolean>;
	get<TValue = unknown>(key: string): Promise<TValue | undefined>;
	set<TValue = unknown>(
		key: string,
		value: TValue,
		ttl?: number
	): Promise<unknown>;
}

export class KeyvStore implements CacheStore {
	constructor(private readonly keyv: KeyvLike) {}

	async get<TValue = unknown>(key: string): Promise<TValue | undefined> {
		return await this.keyv.get<TValue>(key);
	}

	async set<TValue = unknown>(
		key: string,
		value: TValue,
		options?: CacheCallbackOptions
	): Promise<void> {
		await this.keyv.set(key, value, options?.ttl);
	}

	async delete(key: string): Promise<boolean> {
		if (!this.keyv.delete) {
			return false;
		}

		return await this.keyv.delete(key);
	}
}
