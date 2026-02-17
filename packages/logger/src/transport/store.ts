export interface Store {
	get(name: string): unknown;
	set(name: string, value: unknown): void;
}

export function createStore(): Store {
	const map = new Map<string, unknown>();

	return {
		get(name: string): unknown {
			return map.get(name);
		},

		set(name: string, value: unknown): void {
			map.set(name, value);
		},
	};
}
