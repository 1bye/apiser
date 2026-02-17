import ky from "ky";
import type { Config } from "./config";
import type { AnyEndpoint } from "./endpoint";

export function aggregate(config: Config) {
	const endpoints = config.endpoints;
	const baseUrl = config.baseUrl;

	const client = ky.create({
		prefixUrl: baseUrl,
	});

	const runEndpoint = (endpoint: AnyEndpoint) => {};
}
