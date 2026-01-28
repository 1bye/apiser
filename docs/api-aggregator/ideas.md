```ts
import { defineConfig } from "@apiser/api-aggregator";
import { z } from "@apiser/zod";

export default defineConfig({
  baseUrl: "https://freguesiadealcantarilha.pt",
  endpoints: [{
    method: "GET", // default: "GET"
    operationId: "listAlerts",
    summary: "List alerts", // default: path 
    path: "/admin/api/index.php", // required
    // Used for initial params for query.
    querySchema: z.object({
      resource: z.literal("alertas").default("alertas")
    }),
    
    probe: {
      query: { resource: "alertas" },
      // or
      query: ({ defaults, faker }) => ({
        resource: defaults.resource
      })
    }
  }, {
    method: "POST",
    operationId: "contactWith",
    summary: "Contact with",
    path: "/admin/api/index.php",
    bodySchema: z.object({
      name: z.string().max(32).optional(),
      title: z.string().max(60).min(2),
      content: z.string().max(240).min(4)
    }),
    
    probe: {
      body: {
        name: "TEST",
        title: "Test",
        content: "1231313123213123"
      }
    }
  }],
  outDir: "./.openapi",
  // For now only json
  // jsonc | json | yaml
  format: "json",
  
  // ai used to form some OpenAPI fields. Provile llm from vercel ai sdk
  // ai: openai("gpt-5.2")
})
```

```bash
# Run aggregator
bunx @apiser/api-aggregator

# Run aggregator without cache
bunx @apiser/api-aggregator --clean-cache

# Fetching 0/1 endpoints
# Done, fetched 1 endpoint successfully.
# OpenAPI saved in ./.openapi/openapi.json
```

or run directly without CLI via code:
```ts
import { aggregate } from "@apiser/api-aggregator";

const result = await aggregate({
  // ...options
  // If no `outDir` present and it's runned from function `aggregate` then will just return openapi in `result` object.
});
```
