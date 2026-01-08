import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";
import { modelBuilder } from "@/v2/model";
import { gte, sql, eq, or } from "drizzle-orm";
import { esc } from "@/v2/model/operations";

const model = modelBuilder({
  schema,
  db,
  relations,
  dialect: "PostgreSQL"
});

const userModel = model("user", {
  methods: {
    whereName(name: string) {
      return userModel.where({
        name: esc(eq, name)
      });
    },
    findByName(name: string) {
      return userModel
        .where({
          name: esc(name)
        })
        .findFirst()
        .select({
          id: true,
          name: true
        });
    }
  },
  format: ({ secretField, ...rest }) => ({
    ...rest,
    customField: "123"
  })
});
const userIdeasModel = model("userIdeas", {});

// userModel.
// userModel.

// userModel.

const testRaw = await userModel
  .where({
    id: {
      or: [
        esc(1),
        esc(2),
      ]
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
    age: esc(12)
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
    age: esc(12)
  })
  .findFirst()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.where({
      id: esc(12)
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
        esc(12),
      ],
    }
  })
  .findFirst()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel
      .where({
        id: esc(12)
      })
      .include({
        comments: commentsModel.where({ id: esc(12) }).include({
          author: true
        }),
      }),
  });

// testRaw3.posts[0]?.comments[0]?.author;

const testRaw4 = await userModel
  .where({
    age: {
      or: [
        {
          equal: 1,
        },
        esc(2),
      ],
    }
  })
  .findMany()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel
      .where({
        id: esc(12)
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
        esc(12),
      ]
    },
  })
  .findMany()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel
      .where({
        id: esc(12)
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

const testRaw6 = await userModel
  .insert({
    email: "email@email",
    name: "Nameie",
    age: 123,
  })
  .return({
    age: true
  });

// testRaw6

// testRaw6.

const testRaw7 = await userModel
  .where({ id: esc(12) })
  .update({
    age: 12
  })
  .return();

// testRaw7[0].

const testRaw8 = await userModel
  .where({ id: esc(12) })
  .delete()
  .return();

// testRaw8[0].

// postsModel.

const testRaw9 = await postsModel
  .where({
    user: {
      id: esc(12)
    },
  })
  .update({
    description: ""
  })
  .return();

const testRaw10 = await postsModel
  .where(
    userModel.where({ id: esc(12) })
  )
  .update({
    description: ""
  })
  .return();

const testRaw11 = await postsModel
  .where(
    sql``
  )
  .update({
    description: ""
  })
  .return();

const testRaw12 = await postsModel
  .where(
    gte(schema.postComments.id, 123)
  )
  .update({
    description: ""
  })
  .return();

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

const testRaw13 = await userModel.whereName("Alex").findFirst();
const testRaw14 = await userModel.findByName("Alex");
// testRaw13.
// testRaw14.

// userModel.$form.methods.

// userModel.w

const testRaw15 = await userModel
  .where({
    name: esc("Alex")
  })
  .findFirst()
  .raw();

const userModel2 = userModel.extend({
  methods: {
    whereName(name: string) {
      return userModel2.where({
        name: esc(name)
      });
    }
  },
  format: (output) => {
    return {
      ...output,
      isJoke: true
    };
  }
});


// testRaw16.

// userModel2.
