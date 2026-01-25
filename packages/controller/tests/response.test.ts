import { createOptions, bindings, type HandlerBindings } from "@/index";
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
  bindings: {
    userModel: bindings.bind("userModel", (o: boolean) => ({
      payload: z.object({
        name: z.string()
      }),
      resolve: ({ bindingName }) => ({
        [bindingName]: "ddqwd"
      })
    })),

    model: bindings.model(123)
  }
});

type Bindings = HandlerBindings<typeof options>;

// options.responseHandler?.fail("custom")
