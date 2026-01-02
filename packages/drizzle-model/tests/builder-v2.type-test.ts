import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";
import { modelBuilder } from "@/v2/model";
import { gte, sql } from "drizzle-orm";

const model = modelBuilder({
  schema,
  db,
  relations,
  dialect: "PostgreSQL"
});

const userModel = model("user", {
  methods: {
    whereActive() {
      return {
        id: 123
      } as const;
    },
  }
});
const userIdeasModel = model("userIdeas", {});

// userModel.whereActive
// userModel.

// userModel.

const testRaw = await userModel
  .where({
    id: {
      or: [1, 2]
    }
  })
  .findFirst()
  .with({
    posts: {
      comments: true,
    },
  })
  .select({
    age: true,
    posts: {
      title: true,
      comments: {
        content: true,
      },
    },
  });

// testRaw.posts[0]?.comments[0]?.content;
const testRaw1 = await userModel
  .where({
    age: 12
  })
  .findFirst()
  .with({
    posts: {
      comments: true,
    },
  })
  .exclude({
    age: true,
    posts: {
      id: true,
      comments: {
        content: true,
      },
    },
  });

// testRaw1.posts[0]?.comments[0].;

const postsModel = model("userPosts", {});
const commentsModel = model("postComments", {});

const testRaw2 = await userModel
  .where({
    age: 12
  })
  .findFirst()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.where({
      id: 12
    }).include({
      comments: true,
    }),
  });

// testRaw2.posts[0]?.comments;

const testRaw3 = await userModel
  .where({
    id: {
      or: [
        {
          equal: 1,
        },
        2,
      ],
    }
  })
  .findFirst()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel
      .where({
        id: 12
      })
      .include({
        comments: commentsModel.where({ id: 12 }).include({
          author: true
        }),
      }),
  });

// testRaw3.posts[0]?.comments[0]?.author

const testRaw4 = await userModel
  .where({
    age: {
      or: [
        {
          equal: 1,
        },
        2,
      ],
    }
  })
  .findMany()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel
      .where({
        id: 12
      })
      .include({
        comments: true,
      }),
  })
  .select({
    posts: {
      description: true,
      comments: true,
    },
  });

// testRaw4[0]?.posts[0].

const testRaw5 = await userModel
  .where({
    age: {
      or: [
        {
          equal: 1,
        },
        2,
      ]
    },
  })
  .findMany()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel
      .where({
        id: 123
      })
      .include({
        comments: true,
      }),
  })
  .exclude({
    posts: {
      description: true,
      comments: true,
    },
  });

const testRaw6 = await userModel.insert({
  email: "email@email",
  name: "Nameie",
  age: 123,
}).return({
  age: true
});

// testRaw6

// testRaw6.

const testRaw7 = await userModel.where({ id: 1 }).update({
  age: 12
}).return();

// testRaw7[0].

const testRaw8 = await userModel.where({ id: 1 }).delete().return();

// testRaw8[0].

// postsModel.

const testRaw9 = await postsModel
  .where({
    user: {
      id: 1
    },
  })
  .update({
    description: ""
  })
  .return();

const testRaw10 = await postsModel.where(
  userModel.where({ id: 123 }).include({
    posts: {
      user: true
    }
  })
).update({
  description: ""
}).return();

const testRaw11 = await postsModel.where(
  sql``
).update({
  description: ""
}).return();

const testRaw12 = await postsModel.where(
  gte(schema.postComments.id, 123)
).update({
  description: ""
}).return();

db.transaction(async tx => {
  const result = await postsModel
    .db(tx)
    .where(
      gte(schema.postComments.id, 123)
    )
    .update({
      description: ""
    })
    .return({
      id: true
    });
});
