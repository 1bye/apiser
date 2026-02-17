import type { PromiseOr } from "./types";

export type CacheKey = string | string[];

export type CacheKeyResolverData<TPayload = unknown> = {
	payload: TPayload;
};

export type CacheKeyResolver<TPayload = unknown> = (
	data: CacheKeyResolverData<TPayload>
) => CacheKey;

export type CacheKeyInput<TPayload = unknown> =
	| CacheKey
	| CacheKeyResolver<TPayload>;

export interface CacheCallbackOptions {
	ttl?: number;
	[key: string]: unknown;
}

export interface CacheStore {
	delete?(key: string): PromiseOr<boolean | void>;
	get<TValue = unknown>(key: string): PromiseOr<TValue | undefined>;
	set<TValue = unknown>(
		key: string,
		value: TValue,
		options?: CacheCallbackOptions
	): PromiseOr<void>;
}

export interface CacheOptions<
	TPayload = unknown,
	TStore extends CacheStore = CacheStore,
> {
	key?: CacheKeyInput<TPayload>;
	store: TStore;
	wrapHandler?: boolean;
}

export type CacheCallback<TValue> = () => PromiseOr<TValue>;

export type CacheFn = <TValue = unknown>(
	key: CacheKey,
	callback: CacheCallback<TValue>,
	options?: CacheCallbackOptions
) => Promise<TValue>;

export type CreateCacheOptions<
	TPayload = unknown,
	TStore extends CacheStore = CacheStore,
> = {
	payload: TPayload;
	handlerCache?: CacheOptions<TPayload, TStore>;
	callCache?: CacheOptions<TPayload, TStore>;
};

const cacheKeySeparator = ":";

const asCacheKeyParts = (key: CacheKey): string[] => {
	if (Array.isArray(key)) {
		return key.map((part) => String(part));
	}

	return [String(key)];
};

const resolveCacheKeyInput = <TPayload>(
	key: CacheKeyInput<TPayload> | undefined,
	payload: TPayload
): CacheKey | undefined => {
	if (!key) {
		return undefined;
	}

	if (typeof key === "function") {
		return key({ payload });
	}

	return key;
};

const toCacheKey = (parts: string[]): string => parts.join(cacheKeySeparator);

export const resolveCacheKey = <TPayload>(input: {
	key: CacheKey;
	payload: TPayload;
	wrapHandler?: boolean;
	baseKey?: CacheKeyInput<TPayload>;
}): string => {
	const callKeyParts = asCacheKeyParts(input.key);
	const baseKey = resolveCacheKeyInput(input.baseKey, input.payload);
	const baseKeyParts = baseKey ? asCacheKeyParts(baseKey) : [];

	if (input.wrapHandler && baseKeyParts.length > 0) {
		return toCacheKey(baseKeyParts);
	}

	return toCacheKey([...baseKeyParts, ...callKeyParts]);
};

export const resolveCacheOptions = <
	TPayload,
	TStore extends CacheStore,
>(input: {
	handlerCache?: CacheOptions<TPayload, TStore>;
	callCache?: CacheOptions<TPayload, TStore>;
}): CacheOptions<TPayload, TStore> | undefined => {
	const merged = {
		...(input.handlerCache ?? {}),
		...(input.callCache ?? {}),
		store: input.callCache?.store ?? input.handlerCache?.store,
	} as CacheOptions<TPayload, TStore>;

	if (!merged.store) {
		return undefined;
	}

	return merged;
};

export const createCache = <TPayload, TStore extends CacheStore>(
	opts: CreateCacheOptions<TPayload, TStore>
): CacheFn => {
	const resolved = resolveCacheOptions({
		handlerCache: opts.handlerCache,
		callCache: opts.callCache,
	});

	return async (key, callback, options) => {
		if (!resolved) {
			return await callback();
		}

		const cacheKey = resolveCacheKey({
			key,
			payload: opts.payload,
			wrapHandler: resolved.wrapHandler,
			baseKey: resolved.key,
		});

		const stored = await resolved.store.get(cacheKey);
		if (typeof stored !== "undefined") {
			return stored as Awaited<ReturnType<typeof callback>>;
		}

		const value = await callback();
		await resolved.store.set(cacheKey, value, options);

		return value;
	};
};
