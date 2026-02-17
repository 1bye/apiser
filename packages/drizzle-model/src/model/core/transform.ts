type AnyObj = Record<string, any>;

export function applySelect(value: any, select: AnyObj): any {
	if (value == null) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((v) => applySelect(v, select));
	}
	if (typeof value !== "object") {
		return value;
	}

	const out: AnyObj = {};
	for (const [key, sel] of Object.entries(select)) {
		if (sel === true) {
			out[key] = (value as any)[key];
			continue;
		}
		if (sel && typeof sel === "object") {
			out[key] = applySelect((value as any)[key], sel as AnyObj);
		}
	}
	return out;
}

export function applyExclude(value: any, exclude: AnyObj): any {
	if (value == null) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((v) => applyExclude(v, exclude));
	}
	if (typeof value !== "object") {
		return value;
	}

	const out: AnyObj = { ...(value as AnyObj) };
	for (const [key, ex] of Object.entries(exclude)) {
		if (ex === true) {
			delete out[key];
			continue;
		}
		if (ex && typeof ex === "object" && key in out) {
			out[key] = applyExclude(out[key], ex as AnyObj);
		}
	}
	return out;
}

export function applyFormat(value: any, format: any): any {
	if (!format) {
		return value;
	}
	if (value == null) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((v) => applyFormat(v, format));
	}
	if (typeof value !== "object") {
		return value;
	}
	return format(value);
}
