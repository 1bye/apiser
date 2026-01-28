import { endpoint } from "@/endpoint";
import { z } from "@apiser/zod";

const main = endpoint({
  path: "/index.php",
  querySchema: z.object({
    resource: z.literal("alertos")
  }),
  probe: {
    200: {
      query: {
        resource: "alertos"
      }
    }
  }
})
