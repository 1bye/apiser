import { createResponseHandler } from "@/handler";
import { z } from "zod";

const response = createResponseHandler({
  meta: {
    schema: z.object({
      raw: z.boolean()
    })
  },

  error: {
    schema: z.object({
      name: z.string(),
      details: z.string().optional()
    }),
    // onError: ({ meta }) => {

    // }
  }
})
  .defineError("custom error", ({
    name: "123",
    details: "Some details"
  }), {})
  .defineError("123", ({ input, meta }) => {
    // errpr.

    return {
      name: ""
    }
  }, {
    input: z.object({
      raw2: z.boolean()
    })
  })
  .defineError("456", () => ({
    name: ""
  }), {
    input: z.object({
      raw3: z.boolean()
    })
  });

response.json();

const error = response.fail("123", {
  raw2: true
});
const error2 = response.fail("custom error");

//   .withErrors({
//   unauth: {
//     handler: ({ meta, input }) => {

//     },
// input: z.object({
//   raw: z.boolean()
// })
//   }
// });

// response.options.errors;
