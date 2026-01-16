export function resolveErrorStack(stack: unknown) {
  if (!stack) return undefined;

  if (typeof stack === "string") {
    return stack.split("\n");
  }
  if (Array.isArray(stack)) {
    return stack;
  }
  return stack;
}
