# Workers

```ts
import { worker, hub as workerHub, processor } from "@apisr/workers";
import { redis } from "@apisr/redis-workers";

const helloWorld = worker(({ payload }) => {
  
  
}, {
  // options
  payload: z.object({})
});

const hub = workerHub({
  helloWorld
});

hub.run("helloWorld", {
  payload: {}
});

hub.schedule("helloWorld", {});
hub.recurring("helloWorld", {});

// in outer file
```
