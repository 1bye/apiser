import { createOptions, bindings, type HandlerBindings, createHandler } from "@/index";
import { createResponseHandler } from "@apiser/response";
import { modelBuilder } from "@apiser/drizzle-model";
import { z } from "@apiser/zod";
import { db } from "./db";
import { relations } from "./relations";
import * as schema from "./schema";

const model = modelBuilder({
  db,
  schema,
  relations,
  dialect: "PostgreSQL"
});

// const userModel = model("")

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
    // userModel: bindings.bind("userModel", (o: boolean) => ({
    //   payload: z.object({
    //     name: z.string()
    //   }),
    //   resolve: ({ bindingName }) => ({
    //     [bindingName]: "ddqwd",
    //     test: "123"
    //   })
    // })),

    // model: bindings.model(123)
  }
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
