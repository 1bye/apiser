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
    headers: {},
    
    validate?: "parse" | "safeParse",
      
    schema: z.object({
      data: z.any(),
      success: z.boolean()
    }),
    
    onData: (data) => ({
      data,
      success: true
    }),
  },
  
  errors: {
    unauthorized: {
      handler: ({ meta, input }) => ({
        success: false,
        error: input?.localize ? t[meta.locale]("unauthorized") : "Unauthorized",
      }),
      input: z.object({
        localize: z.boolean().default(true)
      }).optional()
    }
  },
  
  error: {
    headers: {},
    
    // error: "json" | "problem+json",
    
    schema: z.object({
      error: z.string(),
      success: z.boolean()
    }),
    
    onError: ({ error }) => ({
      error: error.message,
      success: false
    })
  }
}); // ResponseHandler<Options>

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
