import { createOptions, createHandler } from "@/index";
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

const userModel = model("user", {})

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

// responseHandler.options.error.schema

const options = createOptions({
  name: "user-controller",
  // responseHandler,
  bindings: (bindings) => ({
    userModel: bindings.model(userModel, {

    }),

    userModel2: bindings.bind((o: boolean) => ({
      payload: z.object({
        name: z.string().from("handler.payload").optional()
      }),
      resolve: async ({ fail }) => {
        return {
          userModel2: "ddqwd",
          test: "123"
        }
      }
    })),

    version: bindings.value(123),

    openapi: bindings.bind((options: {
      summary: string;
      path: string;
    }) => ({
      resolve: async ({ }) => {
        return {};
      }
    }))
  })
});

const handler = createHandler(options);

const main = handler(({ fail, payload, userModel, userModel2, test, }) => {

  return 123;
}, {
  payload: z.object({
    name: z.string().from("body")
  }),
  userModel: true,
  userModel2: true
});

const { data, error } = await main()
