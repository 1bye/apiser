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

describe("@apiser/controller Request check", () => {
  test("handler return data", async () => {
    const main = handler(({ payload }) => {
      return payload.name;
    }, {
      payload: z.object({
        name: z.string().from("body")
      }),
    });

    const { data, error } = await main.call({
      request: {
        body: { name: "Hello World" }
      }
    }, {});

    console.log({
      data,
      error
    });

    expect(data).toBe("Hello World");
    expect(error).toBeNull();
  });
})
