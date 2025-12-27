import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";
import { modelBuilder } from "@/v2/model";

const model = modelBuilder({
  schema,
  db,
  relations,
});

const userModel = model("user", {});

const testRaw = await userModel
  .age(12)
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
  .age(12)
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
  .age(123)
  .findFirst()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.id(123).with({
      comments: true,
    }),
  });

// testRaw2.posts[0]?.comments[0].;

const testRaw3 = await userModel
  .age({
    or: [
      {
        equal: 1,
      },
      2,
    ],
  })
  .findFirst()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.id(123).with({
      comments: commentsModel.id(1).with({
        author: true
      }),
    }),
  });

// testRaw3.posts[0]?.comments[0]?.author

const testRaw4 = await userModel
  .age({
    or: [
      {
        equal: 1,
      },
      2,
    ],
  })
  .findMany()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.id(123).with({
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
  .age({
    or: [
      {
        equal: 1,
      },
      2,
    ],
  })
  .findMany()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.id(123).with({
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
}).return();

// testRaw6.age
