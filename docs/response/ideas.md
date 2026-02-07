# Responses
```ts
import { createResponseHandler } from "@apiser/response"

const response = createResponseHandler({
  headers: {},
  
  meta: {
    schema: z.object({
      locale: z.string().default("en")
    }),
    
    default: () => ({
      locale: "en"
    }),
    
    validate?: "parse" | "safeParse"
  },
  
  json: {
    headers?: {},
    validate?: "parse" | "safeParse",
    
    schema: z.any(),
  },
  
  error: {
    headers?: {},
    
    schema: z.object({
      message: z.string(),
      details: z.string(),
    }),
  },
  
  // maps data and error into response
  mapResponse({ data, error }) {
    return {
      
    }
  }
}).defineError("custom", {
  message: "custom",
  details: "custom details"
}, {
  status: 400
})

response.withMeta({
  locale: "pt"
}) // ResponseHandler<Options>

response.ok({})
response.json({
  
}, {
  status?: number,
  statusText?: string
})

response.text("ok")

response.fail("unauthorized", {
  localized: false
})
response.binary(new File())
```
