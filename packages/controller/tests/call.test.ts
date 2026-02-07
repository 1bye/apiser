import { createOptions, createHandler } from "@/index";
import { createResponseHandler } from "@apiser/response";
import { z } from "@apiser/zod";

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

const main = handler(({ fail, payload }) => {
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
