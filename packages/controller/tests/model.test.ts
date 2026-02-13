import { createOptions, createHandler } from "@/index";
import { modelBuilder } from "@apiser/drizzle-model";
import { z } from "@apiser/zod";
import { db } from "./__internal/db";
import { relations } from "./__internal/relations";
import * as schema from "./__internal/schema";
import { describe, test } from "bun:test";

const model = modelBuilder({
  db,
  schema,
  relations,
  dialect: "PostgreSQL"
});

const userModel = model("user", {})

const options = createOptions({
  name: "user-controller",
  // responseHandler,
  bindings: (bindings) => ({
    userModel: bindings.model(userModel, {

    })
  })
});

const handler = createHandler(options);

describe("@apiser/controller", () => {
  test("simple", async () => {
    const main = handler(({ fail, payload, userModel }) => {

      return userModel.findMany();
    }, {
      payload: z.object({
        name: z.string().from("body")
      }),
      userModel: true,
    });

    const { data, error } = await main({ name: "HELLO" });

    console.log(data);
  })
})
