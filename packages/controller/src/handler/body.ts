/**
 * Normalize a request body into a plain object.
 *
 * - If `body` is a `FormData`, it is converted into an object where:
 *   - duplicate keys are accumulated into arrays
 *   - values are stored as-is (e.g. `string` / `File`)
 * - If `body` is a `string`, it is parsed as JSON.
 * - If `body` is already an `object`, it is returned as-is.
 *
 * @param body Request body.
 * @returns Plain object representation of the input body.
 * @throws If `body` is a string and is not valid JSON.
 */
export function transformBodyIntoObject(body: FormData | object | string): Record<string, unknown> {
  if (body instanceof FormData) {
    const result: Record<string, unknown> = {};

    body.forEach((value, key) => {
      if (key in result) {
        const existing = result[key];
        result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  if (typeof body === "string") {
    return JSON.parse(body) as Record<string, unknown>;
  }

  return body as Record<string, unknown>;
}
