import { createOptions, createHandler } from "@/index";
import { createResponseHandler } from "@apiser/response";
import { z } from "@apiser/zod";

const responseHandler = createResponseHandler((options) => ({
  json: options.json({
    outputSchema: z.object({
      data: z.any(),
      type: z.string()
    })
  }),
  error: {
    schema: z.object({
      name: z.string(),
      details: z.string(),
    }),
  }
}))
  .defineError("custom", {
    details: "Custom error occured",
    name: "custom"
  })
  .defineError("test", {
    details: "123",
    name: "09876756"
  })
  .defineError("INPUT", ({ input }) => ({
    details: input.name,
    name: "09890-"
  }), {
    input: z.object({
      name: z.string()
    })
  })

const options = createOptions({
  name: "user-controller",
  responseHandler,
  bindings: (bindings) => ({
  })
});

const handler = createHandler(options);

const main = handler(({ fail, payload }) => {
  throw fail("custom");

  return 123;
}, {
  payload: z.object({
    name: z.string()
  }),
});

const { data, error } = await main({
  name: "Hello World"
})

console.log({
  data,
  error
})
