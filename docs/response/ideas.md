# Responses
```ts
import { createResponseHandler } from "@apisr/response"

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
    
    onFailedSchemaValidation?: ({ data }) => {
      
    }
  },
  
  // maps data and error into response
  mapResponse({ data, error, headers, status, statusText, response }) {
    // response <- already mapped response
    // data <- is Json nor binary nor text
    
    return response;
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
