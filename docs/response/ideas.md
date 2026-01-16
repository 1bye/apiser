# Responses
```ts
const response = createResponse({
  json: {
    schema: z.object({
      data: z.any(),
      success: z.boolean()
    })
  } 
});

response.json({
  
}, 200)

response.text()

response.error(new Error())

response.file(new File())
response.blob(new Blob())
response.image(new File() or new Blob() or etc...)
```
