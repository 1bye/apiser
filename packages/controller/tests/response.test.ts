import { createOptions, type HandlerBindings, createHandler } from "@/index";
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
})).defineError("custom", {
  details: "Custom error occured",
  name: "custom"
})

const options = createOptions({
  name: "user-controller",
  responseHandler,
  bindings: () => ({})
});

type Bindings = HandlerBindings<typeof options>;

const handler = createHandler(options);

// options.responseHandler?.fail("custom")

const main = handler(({ fail, payload, userModel }) => {
  return 123;
}, {
  payload: z.object({
    name: z.string()
  }),
  userModel: true
});

const { data, error } = main()
