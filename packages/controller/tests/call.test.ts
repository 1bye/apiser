import { createOptions, createHandler } from "@/index";
import { createResponseHandler } from "@apiser/response";
import { z } from "@apiser/zod";
import { describe, expect, test } from "bun:test";

const responseHandler = createResponseHandler((options) => ({
  json: options.json({
    schema: z.object({
      data: z.any(),
      type: z.string()
    })
  }),
  error: options.error({
    schema: z.object({
      name: z.string(),
      details: z.string(),
    }),

    mapDefaultError(error) {
      return {
        name: error.name,
        details: error.message
      }
    },
  })
}))
  .defineError("custom", {
    details: "Custom error occured",
    name: "custom"
  });

const options = createOptions({
  name: "user-controller",
  responseHandler,
  bindings: (bindings) => ({
  })
});

const handler = createHandler(options);

describe("@apiser/controller call check", () => {
  test("handler return data", async () => {
    const main = handler(() => {
      return 123;
    }, {
      payload: z.object({
        name: z.string()
      }),
    });

    const { data, error } = await main({
      name: "Hello World"
    });

    console.log({
      data,
      error
    });

    expect(data).toBe(123);
    expect(error).toBeNull();
  });

  test("handler return error (custom)", async () => {
    const main = handler(({ fail }) => {
      throw fail("custom")
    }, {
      payload: z.object({
        name: z.string()
      }),
    });

    const { data, error } = await main({
      name: "Hello World"
    });

    console.log({
      data,
      error
    });

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  test("handler return unknown error", async () => {
    const main = handler(({ fail }) => {
      throw new Error("TEST ERROR")
    }, {
      payload: z.object({
        name: z.string()
      }),
    });

    const { data, error } = await main({
      name: "Hello World"
    });

    console.log({
      data,
      error
    });

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  test("handler fail payload validation", async () => {
    const main = handler(({ fail, payload }) => {
      return `My name is ${payload.name} and my age is ${payload.age}`;
    }, {
      payload: z.object({
        name: z.string(),
        age: z.number().max(3)
      }),
    });

    const { data, error } = await main({
      name: "Billy",
      age: 4
    });

    console.log({
      data,
      error
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
})
