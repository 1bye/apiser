### 1:
```ts
import { createLogger, type Logger, createTransport } from "@apiser/logger";
import { createConsole } from "@apiser/logger/console";

export const logger: Logger = createLogger({
  name: "base-logger",
  transports: [
    createConsole("console", {
      formatting: "json" | "pretty",
      format: ({ name, path, codeLine, message, relatedData }) => {
        return `[${name}/${path}:${codeLine}] ${message}\n${JSON.stringify(relatedData, null, 2)}`
      }
    }),
    
    createTransport("pg", {
      log: ({ level, message, relatedData, store /* and etc... */ }) => {
        store.set(
          "promise-store",
          // logsModel.insert is Promise, so we store in store of name "promise-store"
          (value) => [
            ...value,
            logsModel.insert({
              level,
              message,
              data: relatedData
            })
          ]
        )
      },
      
      flush: async ({ store }) => {
        const entries: Promise[] = store.get("promise-store");
       
        await Promise.all(entries);
      }
    })
  ]
}) 

// Prints: [base-logger/ideas.md:10] World
logger.info("World");

// Prints: [base-logger/ideas.md:16] World
//                               { 
//                                  someData: true 
//                               }
logger.info("World", {
  someData: true
});

// Cast only to one transport
logger.to("console").info("World")

// Takes the options of Logger and modifies them
const log = logger.extend({
  // exclude transport "console"
  excludeTransport: ["pg"],
  
  mapTransport: ({ transport }) => {
    if (transport.name === "console") {
      return transport.extend({
        format: () => "... custom formatting"
      })
    }
    
    return transport;
  } 
});
```
