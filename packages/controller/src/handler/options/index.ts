export interface HandlerOptions {
  extend(): HandlerOptions;
}

export function createOptions(): HandlerOptions {
  return {
    extend() {
      return this;
    }
  }
}
