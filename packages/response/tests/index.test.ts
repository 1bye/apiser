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
  .defineError("unauthorized", ({ input, meta }) => {
    // errpr.

    return {
      name: ""
    }
  }, {
    input: z.object({
      raw2: z.boolean()
    })
  });

response.fail("")
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
