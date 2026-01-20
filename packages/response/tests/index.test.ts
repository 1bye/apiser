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
      name: z.string()
    }),
    // onError: ({ meta }) => {

    // }
  }
})
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

response.fail("internal");
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
