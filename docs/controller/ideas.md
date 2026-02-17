### 1:
```ts
const userController = controller({
  name: "user-controller",
  bindings: ({ handler }) => ({
    User: handler.name === "index" 
      ? userModel.extend({
        where: {
          id: esc(handler.props.id)
        }
      })
      : userModel,
  }),
  handlers: (handle) => ({
    index: handle(() => {
      
    }),
    
    name: handle(({ props, User }) => {
      // some operation
      
      const user = await User.where({
        name: esc(name)
      }).findFirst()
      
      return user.email;
    }, {
      inputSchema: z.object({
        name: z.string()
      })
    }) // Handle<Props, Options, Output>
  })
});

userController.index({
  name: "Alex"
});

new Elysia()
  .get("/", () => {
    return 
  })
  .post("/by-name", ({ body }) => {
    return userController.name(body);
  }, {
    body: userController.name.schema()
  })
```

### 2:
```ts
const userController = controller({
  name: "user-controller",
  bindings: {
    User: userModel,
    
    auth: (payload /* rn is just boolean */) => ({
      inputSchema: z.object({
        userId: z.string()
      }),
      
      // `resolve` called when has any value except undefined and null
      resolve({ props /* props from `inputSchema` */, handler /*object of handler, containing props, name and etc... */ }) => {
        const userId = props.userId;
        
        console.log(handler.props);
        
        if (userId !== "test-user") throw new Error("Some error");
        
        // If we want we can return smth like:
        return {
          isAuth: true
        }
      }
    })
  },
  handlers: (handle) => ({
    index: handle(() => {
      
    }, {
      // Boolean in case of binding is `payload`
      auth: true
    }),
    
    name: handle(({ props, User }) => {
      // some operation
      
      const user = await User.where({
        name: esc(name)
      }).findFirst()
      
      return user.email;
    }, {
      inputSchema: z.object({
        name: z.string()
      })
    }) // Handle<Props, Options, Output>
  })
});

userController.index({
  name: "Alex"
});

new Elysia()
  .get("/", () => {
    return 
  }, {
    headers: userController.index.auth.schema() // will merge inputSchema (if exists) and binding schema
  })
  .post("/by-name", ({ body }) => {
    return userController.name(body);
  }, {
    body: userController.name.schema()
  })
```

### 3:
```ts
const userController = controller({
  name: "user-controller",
  bindings: {
    User: userModel,

    auth: (payload: boolean) => ({
      input: {
        headers: z.object({ userId: z.string() }),
      },
      resolve({ input, handler }) {
        const userId = input.headers.userId;
        if (userId !== "test-user") throw new Error("Some error");
        return { 
          User: userModel.extend({
            where: {
              id: esc(userId)
            },
            
            format: ({ secretField, ...props }) => ({
              ...props,
              secretField: !!handler.props?.raw ? secretField : undefined
            })
          })
        };
      }
    })
  },

  handlers: (handle) => ({
    index: handle(async ({ User, query }) => {
      if (query.raw) {
        return User.findFirst().raw();
      }
      
      return User.findFirst();
    }, {
      auth: true,
      // optional handler input too
      input: { 
        query: z.object({
          raw: z.boolean().optional()
        }) 
      }
    }),

    name: handle(async ({ input, User }) => {
      const user = await User.where({ name: esc(input.body.name) }).findFirst();
      return user?.email;
    }, {
      input: { body: z.object({ name: z.string() }) }
    })
  })
});

app.get("/", ...userController.index.elysia());
app.post("/by-name", ...userController.name.elysia());

await userController.index({
  // merged
});

await userController.index.raw({
  body: {},
  query: {},
  params: {},
  headers: {},
});
```

### 4:
```ts
const userController = controller((handle) => ({
  index: handle(async ({ User, query }) => {
    if (query.raw) {
      return User.findFirst().raw();
    }
    
    return User.findFirst();
  }, {
    auth: true,
    // optional handler input too
    input: { 
      query: z.object({
        raw: z.boolean().optional()
      }) 
    }
  }),

  name: handle(async ({ input, User }) => {
    const user = await User.where({ name: esc(input.body.name) }).findFirst();
    return user?.email;
  }, {
    input: { body: z.object({ name: z.string() }) }
  })
}), {
  name: "user-controller",
  
  bindings: {
    User: userModel,

    auth: (payload: boolean) => ({
      input: {
        headers: z.object({ userId: z.string() }),
      },
      resolve({ input, handler }) {
        const userId = input.headers.userId;
        if (userId !== "test-user") throw new Error("Some error");
        return { 
          User: userModel.extend({
            where: {
              id: esc(userId)
            },
            
            format: ({ secretField, ...props }) => ({
              ...props,
              secretField: !!handler.props?.raw ? secretField : undefined
            })
          })
        };
      }
    })
  },
});

app.get("/", ...userController.index.elysia());
app.post("/by-name", ...userController.name.elysia());

await userController.index({
  // merged
});

await userController.index.raw({
  body: {},
  query: {},
  params: {},
  headers: {},
});
```


### 5:
```ts
const options = controller.options({
  name: "user-controller",
  
  bindings: {
    User: userModel,

    auth: (payload: boolean) => ({
      input: {
        headers: z.object({ userId: z.string() }),
      },
      resolve({ input, handler }) {
        const userId = input.headers.userId;
        if (userId !== "test-user") throw new Error("Some error");
        return { 
          User: userModel.extend({
            where: {
              id: esc(userId)
            },
            
            format: ({ secretField, ...props }) => ({
              ...props,
              secretField: !!handler.props?.raw ? secretField : undefined
            })
          })
        };
      }
    })
  },
});

const userController = controller(options, (handle) => ({
  index: handle(async ({ User, query }) => {
    if (query.raw) {
      return User.findFirst().raw();
    }
    
    return User.findFirst();
  }, {
    auth: true,
    // optional handler input too
    input: { 
      query: z.object({
        raw: z.boolean().optional()
      }) 
    }
  }),

  name: handle(async ({ input, User }) => {
    const user = await User.where({ name: esc(input.body.name) }).findFirst();
    return user?.email;
  }, {
    input: { body: z.object({ name: z.string() }) }
  })
});

app.get("/", ...userController.index.elysia());
app.post("/by-name", ...userController.name.elysia());

await userController.index({
  // merged
});

await userController.index.raw({
  body: {},
  query: {},
  params: {},
  headers: {},
});
```

### 6:
```ts
const options = controller.options({
  name: "user-controller",
  
  bindings: (bindings) => ({
    User: userModel,
    
    // path: /api/user/{user}
    // userModel.bind("#id:params:user") 
    userModel: bindings.model(userModel, {
      primaryKey?: "id", // default: id
      from?: "params", // default: params
      // path: /api/user/{userModel}
      fromKey?: "user-model" // default: from model.name
      
      // Object used to expand where clause of model
      where?: {},
      
      // Transform from value
      transform?: () => any,
      
      // Used to return model, eg expand with custom shit
      load?: ({ id, fail }) => Model,
      
      // either or keys from fail or function, default is not_found key
      notFound: ({ id, fail }) => {
        throw fail("user_not_found", { userId: id });
      },
      
    } /*or array of options for multiple primary keys */),

    auth: (enabled: boolean) => ({
      payload: z.object({ 
        userId: z.string().from("headers", { key: "x-user-id" })
      }),
      resolve({ payload, handler }) {
        const userId = payload.userId;
        
        if (userId !== "test-user") throw new Error("Some error");
        
        return { 
          User: userModel.extend({
            where: {
              id: esc(userId)
            },
            
            format: ({ secretField, ...props }) => ({
              ...props,
              // for now handler props is any
              secretField: !!handler.props?.raw ? secretField : undefined
            })
          })
        };
      }
    })
  }),
});

const userController = controller(options, (handle) => ({
  index: handle(async ({ User, payload }) => {
    if (payload.raw) {
      return User.findFirst().raw();
    }
    
    return User.findFirst();
  }, {
    auth: true,
    // optional handler input too
    payload: z.object({
      raw: z.boolean().optional().meta({ from: "query" })
    })
  }),

  name: handle(async ({ payload, User }) => {
    const user = await User
      .where({ name: esc(payload.name) })
      .findFirst();
    
    return user?.email;
  }, {
    // Or import `zod` from `@apisr/zod` for `from` syntax
    payload: z.object({ 
      name: z.string().from("body")
    })
  }),
  
  id: handle(async ({ userModel }) => {
    return userModel.findFirst()
  }, {
    userModel: true
  })
});

app.get("/", ...elysia(userController.index));
app.post("/by-name", ...elysia(userController.name));
app.post("/:user-model", ...elysia(userController.id));

await userController.index({
  // merged
});
```

#### 6.1:
Examples of core principles

```ts
const options = controller.options({
  name: "user-controller",
  
  // @apisr/logger
  logger: CustomLogger
});

const userController = controller(options, (handle) => ({
  index: handle(async ({ this }) => {
    this.hello("World")
  }),
  
  hello: handle(async ({ logger, payload }) => {
    // Prints: [user-controller:419] World
    logger.info(payload);
    
    
    // Prints (Just red): [user-controller:423] World
    log.error(payload);
    
    // Prints: [user-controller:426] World
    //                               { 
    //                                  someData: true 
    //                               }
    log.info(payload, {
      someData: true
    });
    
  }, {
    path: "/hello",
    
    payload: z.string().from("query", {
      key: "text"
    })
  })
});

app.get("/", ...elysia(userController.index));
// OR
app.use(
  // with `hello` only becuase `path` is set
  elysia(userController)
);

await userController.index({
  // merged
});
```

#### 6.2:
Seperated handlers

```ts
import { createHandler, createController } from "@apisr/controller"

// Only `this` is not available.
const handle = createHandler({
  // More options:
  // 
  // @apisr/response
  // responseHandler?: ResponseHandler | ({ handler, payload, request: RawRequest }) => PromiseOr<ResponseHandler>;
  // 
  // I: Takes output from handle and maps into response format for server
})

export const index = handle(() => {
  hello("World");
});

export const hello = handle(async ({ log, payload, fail }) => {
  // Prints if called from controller: [user-controller:488] World
  // Prints: [ideas.md:489] World
  log(payload);
  
  throw fail("custom error");
}, {
  // Takes from request query string key that eq to "text"
  payload: z.string().from("query", {
    key: "text"
  }),
})

export const userController = createController("user-controller", {
  hello,
  index
})

app.get("/hello", ...elysia(userController.hello));

// data: unknwon, error: custom error, meta: {}
const { data, error, meta } = await hello({
  // merged
});

// response is `Response`
const response = await hello.raw({
  body: {},
  query: {},
  params: {},
  headers: {}
});
```


### 6.3
Working with files, via @fastify/busboy and stream

```ts
export const hello = handle(async ({ payload, fail }) => {
  // payload now is stream
  
  // we wait for value.
  const name = await payload.name.get();
  
  payload.image.on("data", () => {
    // ex: push to s3 
  });
  
  payload.image.on("end", () => {
    // ex: end push to s3 OR save in db
  });
}, {
  payload: z.stream({
    image: z.file(),
    name: z.string()
  })
})
```

### 6.4
Cache

```ts
const handle = createHandler({
  // Same settings as in handle, without key callback
  cache: {...}
})

export const main = handle(async ({ cache }) => {
  // cache(
  //   key: string[] | string,
  //   callback: () => any
  //   options: { ttl, ...etc }
  // ): any
  const res = cache("user")
}, {
  cache: {
    wrapHandler?: boolean;
    // Allowed stores
    // - MemoryCache
    // - FileCache
    // - Kv (from @apisr/kv)
    // - maybe some lib specific (not sure yet), ex: keyv
    store: {},
    // Used as prefix for cache, or if wrapHandler is set to true will be used as main key for cached function
    key: string[] | string | ((data: { payload }) => string[] | string)
  }
})
```
