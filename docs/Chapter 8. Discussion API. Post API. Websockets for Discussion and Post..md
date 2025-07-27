In Chapter 8, you will start with the codebase in the [8-begin folder](https://github.com/async-labs/saas/tree/master/book/8-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [8-end folder](https://github.com/async-labs/saas/tree/master/book/8-end).

We will cover the following topics in this chapter:

-   Discussion API  
    
    -   Model and static methods - Discussion
    -   Express routes - Discussion
    -   API methods - Discussion
    -   Data store - Discussion
    -   Updating Team data store - Discussion
    -   Discussion page
    -   Discussion-specific components
    -   Common components for Discussion API
    -   Testing Discussion API without Post API
-   Post API  
    
    -   Model and static methods - Post
    -   Express routes - Post
    -   API methods - Post
    -   Data store and store methods - Post
    -   Updating DiscussionPageComp page and CreateDiscussionForm
    -   Post-specific components
    -   Testing Post API
-   Websockets for Discussion and Post  
    
    -   API server
    -   API server - setupSockets method
    -   API server - server-side websocket methods
    -   APP client
    -   Testing websockets

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

## Discussion API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#discussion-api)

In Chapter 7, we wrote code that redirects an end user to the `YourSettings` page after accepting an invitation to join a team. We mentioned that later on we will change the redirect destination, since it makes little sense. As we keep working on our SaaS boilerplate, the question remains - what do end users do with our application? You, as a software developer and business owner, should answer this question early. What problem does your SaaS product solve? Who will pay for your product to solve this problem?

Since our SaaS boilerplate is a "boilerplate" after all, we will build a simple feature: Discussions. End users will discuss anything they want by creating a Discussion. A Discussion has participants and consists of Posts. Any member of a team (Team Leader or Team Member) will be able to create a new Discussion, name that Discussion, select participants from the team's members, and create a very first Post inside this new Discussion.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Discussion+and+Post.png)

At the end of this section, we will redirect an end user who accepted a team invitation to the `Discussion` page instead of the `YourSettings` page. The `Discussion` page that we build in this chapter, after we are done with Post-related components, will look like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-03+17-31-59.png)

Note that the page's route contains `/team/:teamSlug/discussions/:discussionSlug`, similar to the `TeamSettings` page. Recall how we wrote our Express route for the `TeamSettings` page:

```
server.get('/team/:teamSlug/team-settings', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/team-settings', { teamSlug });
});
```

We write a similar Express route for the `Discussion` page. We need to remember to add this route to our `APP` server:

```
server.get('/team/:teamSlug/discussions/:discussionSlug', (req, res) => {
  const { teamSlug, discussionSlug } = req.params;
  app.render(req, res, '/discussion', { teamSlug, discussionSlug });
});
```

Here is a highlight of most (but not all) components we will build for our Discussion API:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-03+17-35-17.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-03+17-31-60.png)

No changes to the API infrastructure - it's the same as the previous internal API infrastructures (for example, Team):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Discussion+API.png)

___

#### Model and static methods - Discussion [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#model-and-static-methods-discussion)

We start building Discussion API with our `API` project (server-only code). Previously, we built Team API starting with our `API` server and Invitation API starting with our `APP` server/client. It's really up to you where to start when building internal API infrastructures. We, as a small team that released and continuously develops our SaaS product, [Async](https://async-await.com/), typically start building internal APIs from server-only code (`API` project).

In this subsection, we will define a new data model called `Discussion`. This task should be easy to complete by this point in the book, since we alreay defined four other data models:

-   User
-   EmailTemplate
-   Team
-   Invitation

As with as any other data model in this book, we follow these steps when defining a new model using Mongoose:

-   defining Schema
-   defining interface for Document
-   defining interface for Model
-   defining static methods for class that extends Model
-   exporting Document
-   define and export Model using Schema with static methods and the above interfaces
-   adding required imports, settings

Let's go through the above blueprint to define a new data model called `Discussion`.

-   Schema has a `createdUserId` property - a user id of the Discussion's creator. It also has `memberIds` - an array of user ids who are participants of the Discussion. The Discussion's creator selects users from all team members to become that Discussion's participants. Only participants can see the Discussion and create new Posts within it. Schema also has a `teamId` property, because users create Discussions within a specific Team. In other words, members of one Team cannot see Discussions of another Team. An end user will access the `Discussion` page using a URL that contains `/team/:teamSlug/discussions/:discussionSlug`. There could be two Discussions with the same `discussionSlug`, but they have to be in two different Teams. When an end user loads the `Discussion` page, we will show list of all Discussions within the Team using the `teamId` property. Below, we will define a static method, `getList`, that retrieves and returns a list of all Discussions for a given Team.
    
    In addition to the above properties, there are common properties such as `name`, `slug`, and `createdAt`:
    
    ```
      const mongoSchema = new mongoose.Schema({
        createdUserId: {
          type: String,
          required: true,
        },
        teamId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        slug: {
          type: String,
          required: true,
        },
        memberIds: [
          {
            type: String,
          },
        ],
        createdAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      });
    ```
    
-   interface Document is for defining data types for properties we specified in Schema:
    
    ```
      interface DiscussionDocument extends mongoose.Document {
        createdUserId: string;
        teamId: string;
        name: string;
        slug: string;
        memberIds: string[];
        createdAt: Date;
      }
    ```
    
-   interface Model is for defining data types for methods' arguments and return values. We will have five static methods: `getList`, `add`, `edit`, `delete`, and `checkPermissionAndGetTeam`:
    
    ```
      interface DiscussionModel extends mongoose.Model<DiscussionDocument> {
        getList({
          userId,
          teamId,
        }: {
          userId: string;
          teamId: string;
        }): Promise<{ discussions: DiscussionDocument[] }>;
    
        add({
          name,
          userId,
          teamId,
          memberIds,
        }: {
          name: string;
          userId: string;
          teamId: string;
          memberIds: string[];
        }): Promise<DiscussionDocument>;
    
        edit({
          userId,
          id,
          name,
          memberIds,
        }: {
          userId: string;
          id: string;
          name: string;
          memberIds: string[];
        }): Promise<DiscussionDocument>;
    
        delete({ userId, id }: { userId: string; id: string }): Promise<{ teamId: string }>;
    
        checkPermissionAndGetTeam({
          userId,
          teamId,
          memberIds,
        }: {
          userId: string;
          teamId: string;
          memberIds: string[];
        }): Promise<TeamDocument>;
      }
    ```
    
-   Static method `getList` uses the Mongoose API method `find` to find and return an array of Discussion objects that have a matching `teamId` property:
    
    ```
      public static async getList({ userId, teamId }) {
        await this.checkPermissionAndGetTeam({ userId, teamId });
    
        const filter: any = { teamId, memberIds: userId };
    
        const discussions: any[] = await this.find(filter).setOptions({ lean: true });
    
        return { discussions };
      }
    ```
    
    Before calling `find`, we call `checkPermissionAndGetTeam` to check all necessary permissions. `Discussion.checkPermissionAndGetTeam` is very similar to `User.checkPermissionAndGetTeam`. Both are private methods - they are only accessible and used inside a corresponding Model. `User.checkPermissionAndGetTeam` finds a Team document and checks if a user is indeed part of that Team, then returns the found Team object. `Discussion.checkPermissionAndGetTeam` does the same things as `User.checkPermissionAndGetTeam` but also checks if a user is a participant of a Discussion:
    
    ```
      private static async checkPermissionAndGetTeam({ userId, teamId, memberIds = [] }) {
        if (!userId || !teamId) {
          throw new Error('Bad data');
        }
    
        const team = await Team.findById(teamId)
          .select('memberIds teamLeaderId')
          .setOptions({ lean: true });
    
        if (!team || team.memberIds.indexOf(userId) === -1) {
          throw new Error('Team not found');
        }
    
        for (const id of memberIds) {
          if (team.memberIds.indexOf(id) === -1) {
            throw new Error('Permission denied');
          }
        }
    
        return team;
      }
    ```
    
    The static method `add` uses Mongoose API method `create` to create a new MongoDB document with all necessary fields. `add` also calls the `checkPermissionAndGetTeam` method to verify permissions:
    
    ```
      public static async add({ name, userId, teamId, memberIds = [] }) {
        if (!name) {
          throw new Error('Bad data');
        }
    
        await this.checkPermissionAndGetTeam({ userId, teamId, memberIds });
    
        const slug = await generateNumberSlug(this, { teamId });
    
        return this.create({
          createdUserId: userId,
          teamId,
          name,
          slug,
          memberIds: uniq([userId, ...memberIds]),
          createdAt: new Date(),
        });
      }
    ```
    
    The static method `edit` uses the Mongoose API method `findById` to find an existing Discussion document by id. Then it checks permissions using `checkPermissionAndGetTeam`. Then it checks if a user who intends to edit a Discussion is indeed the creator of the Discussion using the property `createdUserId`. Then it uses the Mongoose API method `findOneAndUpdate` to update the existing Discussion document and return a corresponding object:
    
    ```
      public static async edit({ userId, id, name, memberIds = [] }) {
        if (!id) {
          throw new Error('Bad data');
        }
    
        const discussion = await this.findById(id)
          .select('teamId createdUserId')
          .setOptions({ lean: true });
    
        const team = await this.checkPermissionAndGetTeam({
          userId,
          teamId: discussion.teamId,
          memberIds,
        });
    
        if (discussion.createdUserId !== userId && team.teamLeaderId !== userId) {
          throw new Error('Permission denied. Only author or team leader can edit Discussion.');
        }
    
        const updatedObj = await this.findOneAndUpdate(
          { _id: id },
          {
            name,
            memberIds: uniq([userId, ...memberIds]),
          },
          { runValidators: true, new: true },
        );
    
        return updatedObj;
      }
    ```
    
    The static method `delete` does the same as `edit` at the beginning - it uses the Mongoose API method `findById` to find an existing Discussion, and it checks permissions by calling the `checkPermissionAndGetTeam` method. However, after that, `delete` calls `Post.deleteMany`. `deleteMany` is a Mongoose API method that deletes multiple documents that meet a certain condition:
    
    [https://mongoosejs.com/docs/api/model.html#model\_Model.deleteMany](https://mongoosejs.com/docs/api/model.html#model_Model.deleteMany)
    
    In our case, the condition is matching the `discussionId` field on a Post document.
    
    Then, the `delete` static method deletes an existing Discussion document using the Mongoose API method `deleteOne`. And it returns `teamId`, which we don't plan to send to the client.
    
    ```
      public static async delete({ userId, id }) {
        if (!id) {
          throw new Error('Bad data');
        }
    
        const discussion = await this.findById(id).select('teamId').setOptions({ lean: true });
    
        await this.checkPermissionAndGetTeam({ userId, teamId: discussion.teamId });
    
        await Post.deleteMany({ discussionId: id });
    
        await this.deleteOne({ _id: id });
    
        return { teamId: discussion.teamId };
      }
    ```
    
    We also need to call a `loadClass` method to create an ES6 class from which Schema will be created. Schema will inherit all methods we just defined:
    
    [https://mongoosejs.com/docs/advanced\_schemas.html](https://mongoosejs.com/docs/advanced_schemas.html)
    
    ```
      mongoSchema.loadClass(DiscussionClass);
    ```
    
-   Let's add `export` in front of `interface DiscussionDocument`.
    
-   Let's define Model using Schema with methods and interfaces:
    
    ```
      const Discussion = mongoose.model<DiscussionDocument, DiscussionModel>('Discussion', mongoSchema);
    ```
    
    Export `Discussion` Model:
    
    ```
      export default Discussion;
    ```
    
-   Required imports and settings that suppress warnings:
    
    ```
      import { uniq } from 'lodash';
      import * as mongoose from 'mongoose';
    
      import { generateNumberSlug } from '../utils/slugify';
      import Post, { deletePostFiles } from './Post';
      import Team, { TeamDocument } from './Team';
    ```
    

Put it all together into a newly created file, `book/8-begin/api/server/models/Discussion.ts`:

```
import { uniq } from 'lodash';
import * as mongoose from 'mongoose';

import { generateNumberSlug } from '../utils/slugify';
import Team, { TeamDocument } from './Team';
import Post from './Post';

const mongoSchema = new mongoose.Schema({
  createdUserId: {
    type: String,
    required: true,
  },
  teamId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  memberIds: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

export interface DiscussionDocument extends mongoose.Document {
  createdUserId: string;
  teamId: string;
  name: string;
  slug: string;
  memberIds: string[];
  createdAt: Date;
}

interface DiscussionModel extends mongoose.Model<DiscussionDocument> {
  getList({
    userId,
    teamId,
  }: {
    userId: string;
    teamId: string;
  }): Promise<{ discussions: DiscussionDocument[] }>;

  add({
    name,
    userId,
    teamId,
    memberIds,
  }: {
    name: string;
    userId: string;
    teamId: string;
    memberIds: string[];
  }): Promise<DiscussionDocument>;

  edit({
    userId,
    id,
    name,
    memberIds,
  }: {
    userId: string;
    id: string;
    name: string;
    memberIds: string[];
  }): Promise<DiscussionDocument>;

  delete({ userId, id }: { userId: string; id: string }): Promise<{ teamId: string }>;

  checkPermissionAndGetTeam({
    userId,
    teamId,
    memberIds,
  }: {
    userId: string;
    teamId: string;
    memberIds: string[];
  }): Promise<TeamDocument>;
}

class DiscussionClass extends mongoose.Model {
  public static async getList({ userId, teamId }) {
    await this.checkPermissionAndGetTeam({ userId, teamId });

    const filter: any = { teamId, memberIds: userId };

    const discussions: any[] = await this.find(filter).setOptions({ lean: true });

    return { discussions };
  }

  public static async add({ name, userId, teamId, memberIds = [] }) {
    if (!name) {
      throw new Error('Bad data');
    }

    await this.checkPermissionAndGetTeam({ userId, teamId, memberIds });

    const slug = await generateNumberSlug(this, { teamId });

    return this.create({
      createdUserId: userId,
      teamId,
      name,
      slug,
      memberIds: uniq([userId, ...memberIds]),
      createdAt: new Date(),
    });
  }

  public static async edit({ userId, id, name, memberIds = [] }) {
    if (!id) {
      throw new Error('Bad data');
    }

    const discussion = await this.findById(id)
      .select('teamId createdUserId')
      .setOptions({ lean: true });

    const team = await this.checkPermissionAndGetTeam({
      userId,
      teamId: discussion.teamId,
      memberIds,
    });

    if (discussion.createdUserId !== userId && team.teamLeaderId !== userId) {
      throw new Error('Permission denied. Only author or team leader can edit Discussion.');
    }

    const updatedObj = await this.findOneAndUpdate(
      { _id: id },
      {
        name,
        memberIds: uniq([userId, ...memberIds]),
      },
      { runValidators: true, new: true },
    );

    return updatedObj;
  }

  public static async delete({ userId, id }) {
    if (!id) {
      throw new Error('Bad data');
    }

    const discussion = await this.findById(id).select('teamId').setOptions({ lean: true });

    await this.checkPermissionAndGetTeam({ userId, teamId: discussion.teamId });

    await Post.deleteMany({ discussionId: id });

    await this.deleteOne({ _id: id });

    return { teamId: discussion.teamId };
  }

  private static async checkPermissionAndGetTeam({ userId, teamId, memberIds = [] }) {
    if (!userId || !teamId) {
      throw new Error('Bad data');
    }

    const team = await Team.findById(teamId)
      .select('memberIds teamLeaderId')
      .setOptions({ lean: true });

    if (!team || team.memberIds.indexOf(userId) === -1) {
      throw new Error('Team not found');
    }

    for (const id of memberIds) {
      if (team.memberIds.indexOf(id) === -1) {
        throw new Error('Permission denied');
      }
    }

    return team;
  }
}

mongoSchema.loadClass(DiscussionClass);

const Discussion = mongoose.model<DiscussionDocument, DiscussionModel>('Discussion', mongoSchema);

export default Discussion;
```

#### Express routes - Discussion [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-discussion)

In the previous subsection, we defined five static methods for our `Discussion` Model. We use the static method `checkPermissionAndGetTeam` internally. In other words, we don't use it anywhere outside of our `Discussion` Model. For each of the four remaining static methods, we have a corresponding Express route:

-   Express route `/discussions/list` calls `Discussion.getList` static method
-   Express route `/discussions/add` calls `Discussion.add` static method
-   Express route `/discussions/edit` calls `Discussion.edit` static method
-   Express route `/discussions/delete` calls `Discussion.delete` static method

Where should we, as software developers, place the above Express routes? To answer this question, we should ask another question - "Who creates discussions in our application?" First of all, the creator of a discussion is logged in to our application, meaning we cannot put Express routes into `public.ts`. Is only the Team Leader allowed to create a discussion in our application? The answer is no, meaning we cannot put Express routes into `team-leader.ts`. Since both Team Member and Team Leader can create discussions, we should place these Express routes into `team-member.ts`.

Navigate to We will discuss session in this book MongoDB database subsection cookie AWS dashboard this chapter API infrastructure list of posts Click on the button Put it all together. Mount middleware S3 bucket on the client redirect to checkout Team Leader send this response You already learned server-side rendering send this response discussion production-ready open this file this chapter. Response on server only page component API infrastructure request was sent show notification We will discuss new Express route this chapter production-ready list of posts in this book subsection. MongoDB database withAuth HOC on server only We will discuss request was sent Navigate to Navigate to HTTP HTTP production-ready. API method calls corresponding store method Material-UI You already learned data model S3 bucket Click on the button in production session on server only Next.js web application in this book cookie triggers method it works as expected. Click on the button Click on the button cookie this chapter Remember to add import list of posts on server only list of posts subsection HTTP triggers method in production decorate method with action. On the client Put it all together request was sent on server only on server only Team Leader At AWS dashboard. API infrastructure withAuth HOC API method calls corresponding store method Click on the button At AWS dashboard Remember to add import this chapter server-side rendering on the client Team Leader on server only. Response in this book You already learned compiles this chapter discussion triggers method it works as expected Google OAuth API show notification We will discuss on the client At AWS dashboard Click on the button. List of posts You already learned Click on the button Google OAuth API Material-UI add environmental variable redirect to checkout discussion S3 bucket static method calls Navigate to add environmental variable open this file in this book.

In addition to the above four Express routes, we have to update the `loadTeamData` method so it **also** returns `initialDiscussions` like this:

```
const data: any = { initialMembers, initialInvitations, initialDiscussions };
```

-   Express route `/discussions/list` accepts a request with the method `GET`. Here we will get `teamId` from the query portion of our API endpoint, then use it to retrieve an array of all discussion objects with matching `teamId` property. We discussed query for Next.js and Express.js in depth in Chapter 7. The Express route will send this array of discussions with response:
    
    ```
      router.get('/discussions/list', async (req: any, res, next) => {
        try {
          const { discussions } = await Discussion.getList({
            userId: req.user.id,
            teamId: req.query.teamId as string,
          });
    
          res.json({ discussions });
        } catch (err) {
          next(err);
        }
      });
    ```
    
-   Express route `/discussions/add` accepts a request with the method `POST`. Then, it retrieves `name` (discussion's name), `teamId`, and `memberIds` (array of participant's ids) values from the request's body. As mentioned earlier in the book, we access query for `GET` requests and access a request's body for `POST` requests. The Express route calls `Discussion.add`, receives an object that corresponds to a newly created discussion document, and returns it with response:
    
    ```
      router.post('/discussions/add', async (req: any, res, next) => {
        try {
          const { name, teamId, memberIds = [] } = req.body;
    
          const discussion = await Discussion.add({
            userId: req.user.id,
            name,
            teamId,
            memberIds,
          });
    
          res.json({ discussion });
        } catch (err) {
          next(err);
        }
      });
    ```
    
-   Express route `/discussions/edit` accepts a request with method `POST`. Then, it retrieves `name`, `id` (discussion's id), and `memberIds` values from the request's body. The Express route then calls `Discussion.edit`, receives an object that corresponds to an **updated** discussion document and returns an object `{ done: 1 }` with a response. You can return pretty much anything with a response, since we don't plan to use an updated discussion object when calling the corresponding `editDiscussionApiMethod` API method:
    
    ```
      router.post('/discussions/edit', async (req: any, res, next) => {
        try {
          const { name, id, memberIds = [] } = req.body;
    
          const updatedDiscussion = await Discussion.edit({
            userId: req.user.id,
            name,
            id,
            memberIds,
          });
    
          res.json({ done: 1 });
        } catch (err) {
          next(err);
        }
      });
    ```
    
-   Express route `/discussions/delete` accepts a request with method `POST`. It retrieves the value of `id` (discussion's id) from a request's body, then it calls `Discussion.delete` and returns `{ done: 1 }` with a response. Again, we have no use for a deleted discussion object or `teamId` when we call the corresponding `deleteDiscussionApiMethod` API method, thus we return `{ done: 1 }`, since the Express route has to return something with response:
    
    ```
      router.post('/discussions/delete', async (req: any, res, next) => {
        try {
          const { id } = req.body;
    
          const { teamId } = await Discussion.delete({ userId: req.user.id, id });
    
          res.json({ done: 1 });
        } catch (err) {
          next(err);
        }
      });
    ```
    

Open `book/8-begin/api/server/api/team-member.ts` and add the above four new Express routes at the end of the file.

In the same file, find `loadTeamData`. We need to update it so that the Express route `/get-initial-data` returns `initialDiscussions` in addition to `initialMembers` and `initialInvitations`.

Find the definition for `loadTeamData`:

```
async function loadTeamData(team, userId) {
  const initialMembers = await User.getMembersForTeam({
    userId,
    teamId: team._id,
  });

  let initialInvitations = [];
  if (userId === team.teamLeaderId) {
    initialInvitations = await Invitation.getTeamInvitations({
      userId,
      teamId: team._id,
    });
  }

  const data: any = { initialMembers, initialInvitations };

  return data;
}
```

We need to call `Discussion.getList` and `Post.getList` inside `loadTeamData`. Let's do so but indirectly - by defining a new function called `loadDiscussionData`:

```
async function loadTeamData(team, userId, body) {
  const initialMembers = await User.getMembersForTeam({
    userId,
    teamId: team._id,
  });

  let initialInvitations = [];
  if (userId === team.teamLeaderId) {
    initialInvitations = await Invitation.getTeamInvitations({
      userId,
      teamId: team._id,
    });
  }

  const initialDiscussions = await loadDiscussionsData(team, userId, body);

  const data: any = { initialMembers, initialInvitations, initialDiscussions };

  return data;
}
```

Then, let's define `loadDiscussionsData`, which calls `Discussion.getList`. For each discussion member in the array, it calls `Post.getList`:

```
async function loadDiscussionsData(team, userId, body) {
  const { discussionSlug } = body;

  if (!discussionSlug) {
    return [];
  }

  const { discussions } = await Discussion.getList({
    userId,
    teamId: team._id,
  });

  for (const discussion of discussions) {
    if (discussion.slug === discussionSlug) {
      Object.assign(discussion, {
        initialPosts: await Post.getList({
          userId,
          discussionId: discussion._id,
        }),
      });

      break;
    }
  }

  return discussions;
}
```

Note that we haven't defined our `Post` Model or `Post.getList` or associated static methods yet. We do so later in this chapter.

Note that we passed an extra argument to `loadTeamData`: `body`. We did this because we want to extract the `discussionSlug` value from an incoming request's body. Since we haven't passed `body` to `loadTeam` inside of the Express route `/get-initial-data`, let's do so now.

Find line:

```
Object.assign(team, await loadTeamData(team, req.user.id));
```

Update it to become:

```
Object.assign(team, await loadTeamData(team, req.user.id, req.body));
```

`req.body` contains `discussionSlug`, because we passed it inside `App.getInitialProps` at our `APP` project:

```
initialData = await getInitialDataApiMethod({
  request: ctx.req,
  data: { teamSlug, discussionSlug },
});
```

Remember to save all changes to `book/8-begin/api/server/api/team-member.ts`.

___

#### API methods - Discussion [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-methods-discussion)

We are done with our server-only code (`API` project). Starting from this subsection, we will work on code inside our `APP` project.

As we always do when building internal API infrastructures, for every Express route that accepts a request, we have to define an API method that sends the request. Exceptions to this rule include the first API endpoint of our Google OAuth API, where the API endpoint is the button's URL, and some external (third-party) API infrastructures, where we sometimes have to send a request or receive a response from an external server.

In this case, Discussion API is indeed an internal API infrastructure. Thus, for four newly added Express routes, let's define four API methods. As we discussed in the previous subsection, we have one `GET` and three `POST` Express routes. In the first Express route, we pass data as the query part of an API endpoint. In the last three, we pass data using the request's body.

Open `book/8-begin/app/lib/api/team-member.ts` and add four new API methods at the end of it:

```
export const getDiscussionListApiMethod = (params): Promise<{ discussions: any[] }> =>
  sendRequestAndGetResponse(`${BASE_PATH}/discussions/list`, {
    method: 'GET',
    qs: params,
  });

export const addDiscussionApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/discussions/add`, {
    body: JSON.stringify(data),
  });

export const editDiscussionApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/discussions/edit`, {
    body: JSON.stringify(data),
  });

export const deleteDiscussionApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/discussions/delete`, {
    body: JSON.stringify(data),
  });
```

___

#### Data store - Discussion [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#data-store-discussion)

In previous chapter, Chapter 7, we created a blueprint for building pages in our SaaS application. Before building the `CreateTeam` page, we summarized the page's structure like this:

```
// imports

// type Props = ...

// type State = ...

class TypicalPage extends React.Component<Props, State> {
  // public static async getInitialProps

  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      <Layout {...this.props}>
        <Head>
          <title>Title for page (used for SEO)</title>
          <meta name="description" content="Description for page (used for SEO)" />
        </Head>
        // interface code for page
      </Layout>
    );
  }

  // page's public methods

  // page's private methods
}

export default SomeHOCs(TypicalPage);
```

The above blueprint helped us understand and build three pages: `CreateTeam`, `TeamSettings`, and `Invitation`.

Since we've already built three data stores (main store, `User`, and `Team`), we can come up with a blueprint that will help us build data stores for `Discussion` and `Post`.

The structure of three data stores we defined so far can be summarized as follows:

```
// imports

class DataStore {
  // data type definition for properties

  constructor(params) {
    // assigning initial value to properties
  }

  // class's public methods
}

decorate(DataStore, {
  // observables, actions, computed
});

export { DataStore };
```

Since `mobx` does not allow us to decorate a method as `action` if it is private, and we want to decorate all methods as actions - we define all class's methods as public.

So for the `Discussion` data store, we will follow a simple blueprint:

```
// imports

class Discussion {
  // data type definition for properties

  constructor(params) {
    // assigning initial value to properties
  }

  // class's public methods
}

decorate(Discussion, {
  // observables, actions, computed
});

export { Discussion };
```

Let's go through every step:

-   **imports**. Typically you would build up the imports section gradually, but for the sake of brevity, here is the entire imports section:
    
    ```
      import { action, decorate, IObservableArray, observable, runInAction } from 'mobx';
    
      import { editDiscussionApiMethod } from '../api/team-member';
      import { Store } from './index';
      import { Team } from './team';
    ```
    
-   **data type definition for properties**. Properties mirror field of the `Discussion` MongoDB document with the exception of `store` and `team` properties. And data types are the same with the exception of `_id` (for MongoDB document, the type is `ObjectId` and not `string`):
    
    ```
      public _id: string;
      public createdUserId: string;
      public store: Store;
      public team: Team;
    
      public name: string;
      public slug: string;
      public memberIds: IObservableArray<string> = observable([]);
    ```
    
    Every discussion document, as you know from building the `Discussion` Model, has a unique `teamId`. In other words, we designed our application such that a team has a list of discussions and for every discussion, there is a unique team to which this discussion belongs. Saving a discussion's team to the `Discussion` data store may save us from potential problems in the future. For example, when a Team Leader creates multiple teams and switches between teams, the `store.currentTeam` object will change but the `discussion.team` object won't for any given discussion. Thus the `team` object is a property of the `Discussion` data store.
    
-   **assigning initial value to properties**. Here we pretty much do the same as with all other data stores - populating properties of the data store with initial values from the `params` object. You, as a developer, design the shape of `params`. In this book, we add properties of an object to the params of `initialState`. So in the case of the `Discussion` data store, `params` will have all of a discussion object's properties because of how we created the `Discussion` data store. Later, when we define the `setInitialDiscussions` method inside the `Team` data store, we will use the spread operator `...d`. The spread operator, as you know from earlier in the book, adds properties of a discussion object to the `Discussion` data store:
    
    ```
      new Discussion({ team: this, store: this.store, ...d })
    ```
    
    Thus initialization for `Discussion` data store will look like this:
    
    ```
      this._id = params._id;
      this.createdUserId = params.createdUserId;
      this.store = params.store;
      this.team = params.team;
    
      this.name = params.name;
      this.slug = params.slug;
      this.memberIds.replace(params.memberIds || []);
    ```
    
-   **class's public methods**.
    
    Here let's define the store method `editDiscussion`, which we will later call inside the `EditDiscussionForm` component. Inside `editDiscussion`, we will call the `editDiscussionApiMethod` API method and then call `changeLocalCache` in order to update local data. Local data is data inside the `Discussion` data store. In our case, data that we allow a discussion's creator to edit is the discussion's name and `memberIds` array. Thus, we want to update these two properties:
    
    ```
      public async editDiscussion(data) {
        try {
          await editDiscussionApiMethod({
            id: this._id,
            ...data,
          });
    
          runInAction(() => {
            this.changeLocalCache(data);
          });
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
    
      public changeLocalCache(data) {
        this.name = data.name;
        this.memberIds.replace(data.memberIds || []);
      }
    ```
    
    Since we will use `discussion.members.map` in the next subsection, we also need to define a `computed` property called `members` inside the `Discussion` page. Later in this section, we will discuss in detail on why and how to use a `computed` property when we define the `computed` property `orderedDiscussions`. When defining a `computed` property, you have to use `get` syntax - we discuss this later as well. For now, we only discuss what's inside the `computed` property `members`:
    
    ```
      get members() {
        return this.memberIds.map((id) => this.team.members.get(id)).filter((u) => !!u);
      }
    ```
    
    For every user id inside `memberIds`, we find a matching member inside the members of a team to which a discussion belongs, in the `this.team.members` array. `map` returns a new array and the `filter` method removes non-matching members. In other words, say a discussion's participants are two users and team members are three users - the `computed` property `discussion.members` will return an array of two user objects.
    

-   **observables, actions, computed**. Here we use the `decorate` utility to specify which properties should be `observable` and which methods should be `action` or `computed`:
    
    ```
      name: observable,
      slug: observable,
      memberIds: observable,
    
      editDiscussion: action,
      changeLocalCache: action,
    
      members: computed,
    ```
    
    You are very familiar with `observable` and `action` decorators. `computed` is another one of those decorators. As the name suggests, a `computed` method will compute and return a result using other data store properties. It will not re-compute unless underlying data changes:
    
    [https://mobx.js.org/refguide/computed-decorator.html](https://mobx.js.org/refguide/computed-decorator.html)
    

Put all the above parts into a new file, `book/8-begin/app/lib/store/discussion.ts`:

```
import { action, decorate, IObservableArray, observable, runInAction } from 'mobx';

import { editDiscussionApiMethod } from '../api/team-member';
import { Store } from './index';
import { Team } from './team';

class Discussion {
  public _id: string;
  public createdUserId: string;
  public store: Store;
  public team: Team;

  public name: string;
  public slug: string;
  public memberIds: IObservableArray<string> = observable([]);

  constructor(params) {
    this._id = params._id;
    this.createdUserId = params.createdUserId;
    this.store = params.store;
    this.team = params.team;

    this.name = params.name;
    this.slug = params.slug;
    this.memberIds.replace(params.memberIds || []);
  }

  public async editDiscussion(data) {
    try {
      await editDiscussionApiMethod({
        id: this._id,
        ...data,
      });

      runInAction(() => {
        this.changeLocalCache(data);
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public changeLocalCache(data) {
    this.name = data.name;
    this.memberIds.replace(data.memberIds || []);
  }

  public members() {
    return this.memberIds.map((id) => this.team.members.get(id)).filter((u) => !!u);
  }
}

decorate(Discussion, {
  name: observable,
  slug: observable,
  memberIds: observable,

  editDiscussion: action,
  changeLocalCache: action,

  members: computed,
});

export { Discussion };
```

Why do we place the `editDiscussion` store method to the `Discussion` data store but plan to place `addDiscussion` and `deleteDiscussion` store methods to the `Team` data store? It has to do with the list of discussions, `team.discussions`. When the `Discussion` data store edits itself, there is no change to `team.discussions`. But when we call `addDiscussion` and `deleteDiscussion` store methods, we do have to update the `team.discussions` array with JavaScript's array methods `push` and `remove`, respectively. Thus we place these two store methods to the `Team` data store. We want to modify the `discussions` property of the `Team` data store.

___

#### Updating Team data store - Discussion [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-team-data-store-discussion)

In this subsection, we will add missing properties and store methods to the `Team` data store. Since the `Team` data store will have a main new property, `discussions`, that needs to be modified when a new discussion is added to it or an existing discussion is removed from it.

In the `CreateDiscussionForm` component, we will call the `this.props.store.currentTeam.addDiscussion` store method, so you can see we have to define it inside the `Team` data store. Store method `addDiscussion`, similarly to `editDiscussion` from the previous subsection, will first call `addDiscussionApiMethod` API method to send all necessary data to `API` server to create a new discussion document in database. Then gets newly created discussion object from server and passes it to `addDiscussionToLocalCache` to update `discussions` array using JavaScript's array method `push`:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/push](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push)

`addDiscussion` store method:

```
public async addDiscussion(data): Promise<Discussion> {
  const { discussion } = await addDiscussionApiMethod({
    teamId: this._id,
    ...data,
  });

  return new Promise<Discussion>((resolve) => {
    runInAction(() => {
      const obj = this.addDiscussionToLocalCache(discussion);
      resolve(obj);
    });
  });
}

public addDiscussionToLocalCache(data): Discussion {
  const obj = new Discussion({ team: this, store: this.store, ...data });

  if (obj.memberIds.includes(this.store.currentUser._id)) {
    this.discussions.push(obj);
  }

  return obj;
}
```

As you can see, we make sure that a user that adds a discussion is indeed a participant of the discussion, `obj.memberIds.includes(this.store.currentUser._id`.

We will call `this.props.store.currentTeam.deleteDiscussion` inside the `DiscussionActionMenu` component, so let's define `deleteDiscussion` for the `Team` data store. Similar to `addDiscussion` and `editDiscussion` store methods, `deleteDiscussion` first calls API method `deleteDiscussionApiMethod` and then deletes a discussion object from the local data `discussions` array using Mobx's array method `remove`:

[https://mobx.js.org/refguide/array.html](https://mobx.js.org/refguide/array.html)

In a browser check if value is truthy subsection decorate method with action Google OAuth API new Express route server-side rendering Remember to add import API method new Express route if truthy then show notification send this response in production add environmental variable. Server-side rendering send this response cookie Click on the button open this file store method calls in a browser page component. Server-side rendering data model team members API method Material-UI. Session in production Next.js web application HTTP email and name server-side rendering team members send this response server-side rendering email and name add environmental variable check if value is truthy in a browser. Session check if value is truthy store method calls session Material-UI. You already learned static method calls page component email and name show notification in production compiles. Server-side rendering mount middleware Next.js web application API method calls corresponding store method redirect to checkout HTTP email and name withAuth HOC response request was sent. If truthy then page component open this file HTTP subsection AWS dashboard check if value is truthy server-side rendering withAuth HOC API method API method calls corresponding store method. Send this response server-side rendering email and name end user session mount middleware on server only MongoDB database store method calls static method calls it works as expected We will discuss. Redirect to checkout show notification session AWS dashboard page component Remember to add import Navigate to AWS dashboard Remember to add import session send this response data model open this file MongoDB database.

`deleteDiscussion` store method:

```
public async deleteDiscussion(id: string) {
  await deleteDiscussionApiMethod({
    id,
  });

  runInAction(() => {
    this.deleteDiscussionFromLocalCache(id);

    const discussion = this.discussions.find((d) => d._id === id);

    if (this.currentDiscussion === discussion) {
      this.currentDiscussion = null;
      this.currentDiscussionSlug = null;

      if (this.discussions.length > 0) {
        const d = this.discussions[0];

        Router.push(
          `/discussion?teamSlug=${this.slug}&discussionSlug=${d.slug}`,
          `/team/${this.slug}/discussions/${d.slug}`,
        );
      } else {
        Router.push(`/discussion?teamSlug=${this.slug}`, `/team/${this.slug}/discussions`);
      }
    }
  });
}

public deleteDiscussionFromLocalCache(discussionId: string) {
  const discussion = this.discussions.find((item) => item._id === discussionId);
  this.discussions.remove(discussion);
}
```

Why do we need the following logic inside the `deleteDiscussion` store method?

```
if (this.currentDiscussion === discussion) {
  this.currentDiscussion = null;
  this.currentDiscussionSlug = null;

  if (this.discussions.length > 0) {
    const d = this.discussions[0];

    Router.push(
      `/discussion?teamSlug=${this.slug}&discussionSlug=${d.slug}`,
      `/team/${this.slug}/discussions/${d.slug}`,
    );
  } else {
    Router.push(`/discussion?teamSlug=${this.slug}`, `/team/${this.slug}/discussions`);
  }
}
```

That's because when an end user deletes a discussion, our application, instead of showing the deleted discussion to the end user, will redirect the end user to the first discussion of the `this.discussions` array or to the `/team/:teamSlug/discussions` route. We will define the associated Express route at the end of the Discussion API section when we test.

There are two more store methods that we do not use externally but use internally to populate the `discussions` array property of the `Team` data store. These store methods of the `Team` data store are `setInitialDiscussions` and `loadDiscussions`. We call them inside `Team.constructor` like this:

```
if (params.initialDiscussions) {
  this.setInitialDiscussions(params.initialDiscussions);
} else {
  this.loadDiscussions();
}
```

For the `Team` data store, the `params` shape has a `params.initialDiscussions` property because of how we create initial store (`book/8-begin/app/lib/store/index.ts`):

```
new Store({ initialState, isServer, socket })
```

`initialState` has properties of `initialData` and thus has the property `initialDiscussions` - see code inside the `App.getInitialProps` method (`book/8-begin/app/pages/_app.tsx`) and code inside the `loadTeamData` method (`book/8-begin/api/server/api/team-member.ts`).

`setInitialDiscussions` takes `initialDiscussions` as an argument and creates an array of objects, where each object is an instance of the `Discussion` class. Then, using MobX's `replace` method:

[https://mobx.js.org/refguide/array.html](https://mobx.js.org/refguide/array.html)

`setInitialDiscussions` replaces members of the current `this.discussions` array:

```
public setInitialDiscussions(discussions) {
  const discussionObjs = discussions.map(
    (d) => new Discussion({ team: this, store: this.store, ...d }),
  );

  this.discussions.replace(discussionObjs);

  if (!this.currentDiscussionSlug && this.discussions.length > 0) {
    this.currentDiscussionSlug = this.orderedDiscussions[0].slug;
  }
}
```

This logic deals with the case when an array of discussions has one or more discussion objects but for whatever reason, the property `currentDiscussionSlug` is `null`, `undefined`, or an empty string. In that case, the property `currentDiscussionSlug` gets its value from the `slug` property of the first member of the array returned by `orderedDiscussions`. We define this method later in this subsection.

The store method `loadDiscussions` has to run only for client-side rendered pages, because for server-side rendered pages, `params.initialDiscussions` exists and `setInitialDiscussions` will run instead of `loadDiscussions`:

```
if (params.initialDiscussions) {
  this.setInitialDiscussions(params.initialDiscussions);
} else {
  this.loadDiscussions();
}
```

Because of this, inside the `loadDiscussions` method, we should check for `this.store.isServer`.

The store method `loadDiscussions` calls the `getDiscussionListApiMethod` API method to get an array of discussion objects. Then, `loadDiscussions` creates a new array that is populated with `Discussion` data store objects by using JavaScript's array method `forEach`:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)

Also, members of the current `this.discussions` array get replaced with Mobx's array method `replace`:

[https://mobx.js.org/refguide/array.html](https://mobx.js.org/refguide/array.html)

There is also a new boolean property, `isLoadingDiscussions`, that prevents `loadDiscussions` from running if it is `true`.

`loadDiscussions` method:

```
public async loadDiscussions() {
  if (this.store.isServer || this.isLoadingDiscussions) {
    return;
  }

  this.isLoadingDiscussions = true;

  try {
    const { discussions = [] } = await getDiscussionListApiMethod({
      teamId: this._id,
    });
    const newList: Discussion[] = [];

    runInAction(() => {
      discussions.forEach((d) => {
        const disObj = this.discussions.find((obj) => obj._id === d._id);
        if (disObj) {
          disObj.changeLocalCache(d);
          newList.push(disObj);
        } else {
          newList.push(new Discussion({ team: this, store: this.store, ...d }));
        }
      });

      this.discussions.replace(newList);
    });
  } finally {
    runInAction(() => {
      this.isLoadingDiscussions = false;
    });
  }
}

public changeLocalCache(data) {
  this.name = data.name;
  this.memberIds.replace(data.memberIds || []);
}
```

And finally, there will be two more store methods for us to define. This is because we will call on the `Discussion` page:

-   `this.props.store.currentTeam.getDiscussionBySlug`
-   `this.props.store.currentTeam.orderedDiscussions`

The store method `getDiscussionBySlug` is straightforward to understand:

```
public getDiscussionBySlug(slug): Discussion {
  return this.discussions.find((d) => d.slug === slug);
}
```

As well as what's inside `orderedDiscussions`:

```
get orderedDiscussions() {
  return this.discussions.slice().sort();
}
```

`orderedDiscussions` will get a `computed` decorator.

While working with `mobx`, we also have a choice of defining `orderedDiscussions` like so:

```
public orderedDiscussions() {
  return this.discussions.slice().sort();
}
```

Then we can use `observable` to decorate `orderedDiscussions` in the decorate section. Also, anywhere inside page or non-page components, we can access the result as `this.props.store.currentTeam.orderedDiscussions()`.

Alternatively, `mobx` offers us to decorate `orderedDiscussions` with `computed` instead of `observable`. And `computed`, unlike `observable`, has to be used with `get` syntax:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)

As you can see from the above link, in this case we would access the result as `this.props.store.currentTeam.orderedDiscussions`, not as `this.props.store.currentTeam.orderedDiscussions()`. Note the absence of parentheses at the end for a `computed` property.

A `computed` property is derived from other properties, in our case `this.discussions`, and "Conceptually, they are very similar to formulas in spreadsheets":

[https://mobx.js.org/refguide/computed-decorator.html](https://mobx.js.org/refguide/computed-decorator.html)

So why use a `computed` property instead of `observable`? According to the `mobx` author, there are fewer calculations, since the value for a `computed` property will be cached. The value for a `computed` property will be only re-evaluated when properties from which this value is derived change (for us, these properties are `this.discussions`):

[https://github.com/mobxjs/mobx/issues/101#issuecomment-220891704](https://github.com/mobxjs/mobx/issues/101#issuecomment-220891704)

A combination of `slice` and `sort` keeps the original array `this.discussions` unmodified but creates a new array of discussion objects:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

The `sort` method can accept the compare function, `compareFunction(a, b)`. For this SaaS boilerplate, we don't supply any argument to the `sort` method, but in your real SaaS application, you may want to provide some logic here and define `compareFunction`.

Add all of the above modifications to your `book/8-begin/app/lib/store/team.ts` file.

Please remember to specify data types or initial values for new properties.

Add before `constructor`:

```
public discussions: IObservableArray<Discussion> = observable([]);
public currentDiscussion?: Discussion;
public currentDiscussionSlug?: string;
public isLoadingDiscussions = false;
```

Add inside `constructor`:

```
this.currentDiscussionSlug = params.currentDiscussionSlug || null;
```

Update current `decorate` section:

```
decorate(Team, {
  name: observable,
  slug: observable,
  avatarUrl: observable,
  memberIds: observable,
  members: observable,
  invitations: observable,

  setInitialMembersAndInvitations: action,
  updateTheme: action,
  inviteMember: action,
  removeMember: action,
});
```

To reflect changes:

```
decorate(Team, {
  name: observable,
  slug: observable,
  avatarUrl: observable,
  memberIds: observable,
  members: observable,
  invitations: observable,
  currentDiscussion: observable,
  currentDiscussionSlug: observable,
  isLoadingDiscussions: observable,
  discussion: observable,
  discussions: observable,

  setInitialMembersAndInvitations: action,
  updateTheme: action,
  inviteMember: action,
  removeMember: action,
  setCurrentDiscussion: action,
  setInitialDiscussions: action,
  loadDiscussions: action,
  addDiscussion: action,
  addDiscussionToLocalCache: action,
  deleteDiscussion: action,
  deleteDiscussionFromLocalCache: action,
  getDiscussionBySlug: action,

  orderedDiscussions: computed,
});
```

___

#### Discussion page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#discussion-page)

At this point in our implementation of Discussion API, we are done with:

-   Model and its methods
-   Express routes
-   API methods
-   Data stores and store methods

The next step is to create a user interface. We will start with the `Discussion` page and then implement all necessary components.

On server only Remember to add import data model page component it works as expected server-side rendering Team Leader this chapter. You already learned in production HTTP Next.js web application API infrastructure response. End user API method calls corresponding store method At AWS dashboard decorate method with action triggers method AWS dashboard response email and name Material-UI Next.js web application. Next.js web application send this response send this response if truthy then request was sent team members list of posts check if value is truthy in this book in production mount middleware API infrastructure Remember to add import. Store method calls triggers method decorate method with action HTTP add environmental variable Put it all together redirect to checkout mount middleware show notification Team Leader. Request in production AWS dashboard withAuth HOC cookie server-side rendering open this file subsection redirect to checkout Click on the button store method calls session team members production-ready. This chapter request was sent email and name in a browser We will discuss decorate method with action. On the client Next.js web application conditional operator cookie withAuth HOC store method calls if truthy then You already learned data model if truthy then We will discuss triggers method. In this book new Express route MongoDB database show notification response response You already learned if truthy then You already learned subsection triggers method check if value is truthy compiles list of posts We will discuss. Cookie data model add environmental variable in a browser in production.

We used our "page blueprint" many times in this book to create a new page. This time is no exception. For our `Discussion` page, the blueprint looks like:

```
// imports

// type Props = ...

// type State = ...

class DiscussionPageComp extends React.Component<Props, State> {
  // public static async getInitialProps

  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      <Layout {...this.props}>
        <Head>
          <title>Title for page (used for SEO)</title>
          <meta name="description" content="Description for page (used for SEO)" />
        </Head>
        // interface code for page
      </Layout>
    );
  }

  // page's public methods

  // page's private methods
}

export default SomeHOCs(DiscussionPageComp);
```

Why do we use the name `DiscussionPageComp` instead of `Discussion` for our page component? That's because we plan on importing and using the `Discussion` data store on this page:

```
import { Discussion } from '../lib/store/discussion';
```

And if we name the page component `Discussion`, then TypeScript will show us a warning via VS code editor:

```
Import declaration conflicts with local declaration of 'Discussion'.ts(2440)
```

Thus the name `DiscussionPageComp`.

-   **imports**. Typically this section gets filled up as you progress, but for brevity, we provide a list of all imports right away:
    
    ```
      import Avatar from '@material-ui/core/Avatar';
      import Tooltip from '@material-ui/core/Tooltip';
      import Head from 'next/head';
      import Router from 'next/router';
      import * as React from 'react';
    
      import { observer } from 'mobx-react';
    
      import Layout from '../components/layout';
      import { Store } from '../lib/store';
      import { Discussion } from '../lib/store/discussion';
      import withAuth from '../lib/withAuth';
    ```
    
-   **type Props = ...**. We need `store` to access `this.props.store.currentTeam` and `this.props.store.currentTeam.discussions`. We need `teamSlug` to generate URLs for redirects. We need `discussionSlug` as an argument for the `this.props.store.currentTeam.getDiscussionBySlug` store method and to generate URLs for redirects. We need `isServer` to check if we need to call the `this.props.store.currentTeam.loadDiscussions` store method, which we only need to run for client-side rendered pages. Finally, we need `isMobile` to add conditional styles that look good on both desktop and mobile browsers.
    
    ```
      type Props = {
        store: Store;
        teamSlug: string;
        discussionSlug: string;
        isServer: boolean;
        isMobile: boolean;
        teamRequired: boolean;
      };
    ```
    
    The `withAuth` HOC passes the `isServer` prop to all pages it wraps. The `App` HOC passes `store`/`teamSlug`/`isMobile` props to all pages. When we test our Discussion API, let's remember to get the value for `discussionSlug` and pass it to our pages's props inside the `App.getInitialProps` method.
    
-   **type State = ...** and **public state =**. No `state` for the page component `DiscussionPageComp` for now. When we add a list of posts to `DiscussionPageComp`, we will have the type definition `State` and set initial values for `state`.
    
-   **access some values from props or state**. **Before** rendering `DiscussionPageComp`, we need to check for `currentTeam`. If `currentTeam` is `null` or `undefined`, or if `currentTeam.slug` does match with the `teamSlug` populated by our `App` HOC - we want to show an error on the user interface.
    
    ```
      const { store, isMobile, discussionSlug } = this.props;
      const { currentTeam } = store;
    
      if (!currentTeam || currentTeam.slug !== this.props.teamSlug) {
        return (
          <Layout {...this.props}>
            <Head>
              <title>No Team is found.</title>
            </Head>
            <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>No Team is found.</div>
          </Layout>
        );
      }
    ```
    
    Then we want to check if `discussion` is `null` or `undefined` by calling the page component's method `getDiscussion`, which we define later in this subsection. `getDiscussion` calls `this.props.store.currentTeam.getDiscussionBySlug` to get `discussion`. If `discussion` is indeed `null` or `undefined` but `currentTeam.isLoadingDiscussions` is `true`, then we want to show some interface that assures the end user that loading is indeed happening. Otherwise, we show the end user an interface informing that the discussion is not found.
    
    ```
      const discussion = this.getDiscussion(discussionSlug);
    
      if (!discussion) {
        if (currentTeam.isLoadingDiscussions) {
          return (
            <Layout {...this.props}>
              <Head>
                <title>Loading...</title>
              </Head>
              <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
                <p>Loading Discussions...</p>
              </div>
            </Layout>
          );
        } else {
          return (
            <Layout {...this.props}>
              <Head>
                <title>No Discussion is found.</title>
              </Head>
              <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
                <p>No Discussion is found.</p>
              </div>
            </Layout>
          );
        }
      }
    ```
    
    Finally, we want to change a page's title to **Discussions** if `discussion` is `null` or `undefined`. This is good UX for when an end user deletes a current discussion. Showing the discussion's name in the title for a deleted or non-existing discussion is poor UX. In the case of a deleted discussion, we will confuse the end user. In the case of a non-existing discussion, the browser will throw an error.
    
    ```
      const title = discussion ? `${discussion.name} · Discussion` : 'Discussions';
    ```
    
-   **interface code for page**. Here what we want to achieve for the `DiscussionPageComp` page after we are done implementing Discussion and Post APIs:  
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-09+13-45-46.png)
    
    From the above screenshot, you can see a single post on the list of all posts within one discussion. Since we implement Post API and all related user interface code in this section, here we will simply leave a placeholder in our code:
    
    ```
      <p>List of Posts</p>
    ```
    
    In addition to list of posts, we want to display a discussion's name and participants (see red arrows in the above screenshot):
    
    ```
      <div style={{ padding: isMobile ? '0px' : '0px 30px', height: '100vh' }}>
        <h4>
          <span style={{ fontWeight: 300 }}>Discussion : </span>
          {(discussion && discussion.name) || 'No Discussion is found.'}
        </h4>{' '}
        Visible to :{' '}
        {discussion
          ? discussion.members.map((m) => (
              <Tooltip
                title={m.displayName}
                placement="right"
                disableFocusListener
                disableTouchListener
                key={m._id}
              >
                <Avatar
                  role="presentation"
                  src={m.avatarUrl}
                  alt={m.avatarUrl}
                  key={m._id}
                  style={{
                    margin: '0px 5px',
                    display: 'inline-flex',
                    width: '30px',
                    height: '30px',
                    verticalAlign: 'middle',
                  }}
                />
              </Tooltip>
            ))
          : null}
        <p />
        <p>List of Posts</p>
        <p />
        <br />
      </div>
    ```
    
    The `Tooltip` component from Material-UI's library will display user's `displayName` when any end user hovers over a user avatar:
    
    [https://material-ui.com/components/tooltips/#tooltip](https://material-ui.com/components/tooltips/#tooltip)
    

-   **page's public methods**. `DiscussionPageComp` will have many page component methods eventually. For now, we have to define only one method, `getDiscussion`. This method accepts `discussionSlug` as an argument:
    
    ```
      const discussion = this.getDiscussion(discussionSlug);
    ```
    
    As we mentioned earlier in this subsection, inside `getDiscussion` we ultimately call store the method `this.props.store.currentTeam.getDiscussionBySlug` of the `Team` data store. And as always, we check if relevant variables are not `null` or `undefined`. In this case, we check `currentTeam` and `slug`:
    
    ```
      public getDiscussion(slug: string): Discussion {
        const { store, teamSlug } = this.props;
        const { currentTeam } = store;
    
        if (!currentTeam) {
          return;
        }
    
        if (!slug && currentTeam.discussions.length > 0) {
          Router.replace(
            `/discussion?teamSlug=${teamSlug}&discussionSlug=${currentTeam.orderedDiscussions[0].slug}`,
            `/team/${teamSlug}/discussions/${currentTeam.orderedDiscussions[0].slug}`,
          );
          return;
        }
    
        if (slug && store.currentTeam) {
          return store.currentTeam.getDiscussionBySlug(slug);
        }
    
        return null;
      }
    ```
    
    Now you can see where we used the `computed` property, `this.props.store.currentTeam.orderedDiscussions`, of the `Team` data store. If an end user tries to access the `DiscussionPageComp` page for a non-existing discussion, then `!slug` is `true`. And if the list of discussions is not empty, our application will redirect an end user to the first discussion on the list returned by `orderedDiscussions`.
    

Create a new file, `book/8-begin/app/pages/discussion.tsx`. Add all of the discussed parts from above. Remember to export the page component:

```
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import Head from 'next/head';
import Router from 'next/router';
import * as React from 'react';

import { observer } from 'mobx-react';

import Loading from '../components/common/Loading';
import Layout from '../components/layout';
import notify from '../lib/notify';
import { Store } from '../lib/store';
import { Discussion } from '../lib/store/discussion';
import withAuth from '../lib/withAuth';

type Props = {
  store: Store;
  teamSlug: string;
  discussionSlug: string;
  isServer: boolean;
  isMobile: boolean;
  teamRequired: boolean;
};

type State = {
  selectedPost: Post;
  showMarkdownClicked: boolean;
};

class DiscussionPageComp extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      selectedPost: null,
      showMarkdownClicked: false,
    };
  }

  public render() {
    const { store, discussionSlug, isMobile } = this.props;
    const { currentTeam } = store;

    if (!currentTeam || currentTeam.slug !== this.props.teamSlug) {
      return (
        <Layout {...this.props}>
          <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>No Team is found.</div>
        </Layout>
      );
    }

    const discussion = this.getDiscussion(discussionSlug);

    if (!discussion) {
      if (currentTeam.isLoadingDiscussions) {
        return (
          <Layout {...this.props}>
            <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
              <Loading text="loading Discussions ..." />
            </div>
          </Layout>
        );
      } else {
        return (
          <Layout {...this.props}>
            <Head>
              <title>No discussion is found.</title>
            </Head>
            <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
              <p>No discussion is found.</p>
            </div>
          </Layout>
        );
      }
    }

    const title = discussion ? `${discussion.name} · Discussion` : 'Discussions';

    return (
      <Layout {...this.props}>
        <Head>
          <title>{title}</title>
          <meta
            name="description"
            content={
              discussion
                ? `Discussion ${discussion.name} by Team ${currentTeam.name}`
                : 'Discussions'
            }
          />
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px', height: '100vh' }}>
          <h4>
            <span style={{ fontWeight: 300 }}>Discussion : </span>
            {(discussion && discussion.name) || 'No Discussion is found.'}
          </h4>{' '}
          Visible to :{' '}
          {discussion
            ? discussion.members.map((m) => (
                <Tooltip
                  title={m.displayName}
                  placement="right"
                  disableFocusListener
                  disableTouchListener
                  key={m._id}
                >
                  <Avatar
                    role="presentation"
                    src={m.avatarUrl}
                    alt={m.avatarUrl}
                    key={m._id}
                    style={{
                      margin: '0px 5px',
                      display: 'inline-flex',
                      width: '30px',
                      height: '30px',
                      verticalAlign: 'middle',
                    }}
                  />
                </Tooltip>
              ))
            : null}
          <p />
          <p>List of Posts</p>
          <p />
          <br />
        </div>
      </Layout>
    );
  }

  public getDiscussion(slug: string): Discussion {
    const { store, teamSlug } = this.props;
    const { currentTeam } = store;

    if (!currentTeam) {
      return;
    }

    if (!slug && currentTeam.discussions.length > 0) {
      Router.replace(
        `/discussion?teamSlug=${teamSlug}&discussionSlug=${currentTeam.orderedDiscussions[0].slug}`,
        `/team/${teamSlug}/discussions/${currentTeam.orderedDiscussions[0].slug}`,
      );
      return;
    }

    if (slug && store.currentTeam) {
      return store.currentTeam.getDiscussionBySlug(slug);
    }

    return null;
  }
}

export default withAuth(observer(DiscussionPageComp));
```

___

#### Discussion-specific components [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#discussion-specific-components)

Since we have discussion documents in our database and since we don't have any way to create a new discussion, we should build Discussion-related components before we test the `DiscussionPageComp` page and entire Discussion API.

In this and the next few subsections, we build two groups of components. The first group of components will be exclusively used for our Discussion API, and we will add these components to `book/8-begin/app/components/discussions`. The second group of components will be used for our Discussion API but can also be used anywhere else in our application. We will save this second group to `book/8-begin/app/components/common` with all other so-called common components.

First group of components:

-   `CreateDiscussionForm`. We will show this component when an end user clicks the plus icon, a component that allows creating a new discussion.
-   `EditDiscussionForm`. We will show this form, which is very similar to `CreateDiscussionForm`, when an end user clicks the "Edit" option on the `DiscussionActionMenu` menu.
-   `DiscussionActionMenu`. We will show this component when an end user clicks the three-dots icon. This component is a menu with three options: "Copy URL", "Edit", "Delete".
-   `DiscussionList`. We will use this component to display a list of discussions inside the first grid. We display `DiscussionPageComp` inside the second grid.
-   `DiscussionListItem`. We will use this component to render a single item on `DiscussionList`.

Second group:

-   `MenuWithMenuItems`. We will use this common component to construct `DiscussionActionMenu`.
-   `MemberChooser`. We will use this component inside both `CreateDiscussionForm` and `EditDiscussionForm` components to allow an end user to select a discussion's participants among all team members.

In this subsection, we will build all components in the first group. In the next subsection, we will build all components in the second group.

There's an important difference to note between page and non-page components. Page components get props from higher-order components that wrap them. For non-page components, you have to pass props explicitly from page component to non-page component. For example, see how `isMobile` and `store` props are passed down to `DiscussionList`:

```
<CreateDiscussionForm
  isMobile={this.props.isMobile}
  store={this.props.store}
  open={this.state.discussionFormOpen}
  onClose={this.handleDiscussionFormClose}
/>
```

-   `CreateDiscussionForm`. When an end user clicks on the plus icon inside `DiscussionList`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+11-28-24.png)
    
    Our application shows this end user the `CreateDiscussionForm` component that allows the end user to create a new discussion:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-24-29.png)
    
    Here's the blueprint we used to build new page components for non-page components but with a few important changes:
    
    ```
      // imports
    
      // type Props = ...
    
      // type State = ...
    
      class CreateDiscussionForm extends React.Component<Props, State> {
        // constructor(props)
    
        public render() {
          // access some values from props or state
    
          return (
            // interface code for component
          );
        }
    
        // component's public methods
    
        // component's private methods
      }
    
      export default SomeHOCs(CreateDiscussionForm);
    ```
    
    There is no `getInitialProps` method for non-page components. There is also no `Layout` HOC, since non-page components are used inside page components, and `Layout` HOC wraps page components.
    
    -   **imports**:
        
        ```
          import Button from '@material-ui/core/Button';
          import Dialog from '@material-ui/core/Dialog';
          import DialogContent from '@material-ui/core/DialogContent';
          import DialogTitle from '@material-ui/core/DialogTitle';
          import TextField from '@material-ui/core/TextField';
          import { observer } from 'mobx-react';
          import Head from 'next/head';
          import Router from 'next/router';
          import NProgress from 'nprogress';
          import React from 'react';
        
          import notify from '../../lib/notify';
          import { Store } from '../../lib/store';
          import MemberChooser from '../common/MemberChooser';
        ```
        
    -   **type Props = ...**:
        
        ```
          type Props = {
            isMobile: boolean;
            store: Store;
            open: boolean;
            onClose: () => void;
          };
        ```
        
    -   **type State = ...**:
        
        ```
          type State = {
            name: string;
            memberIds: string[];
            disabled: boolean;
          };
        ```
        
    -   **constructor(props)**:
        
        ```
          constructor(props) {
            super(props);
        
            this.state = {
              name: '',
              memberIds: [],
              disabled: false,
            };
          }
        ```
        
    -   **access some values from props or state**:
        
        ```
          const { open, isMobile, store } = this.props;
          const { currentUser } = store;
        
          const members = Array.from(store.currentTeam.members.values()).filter(
            (user) => user._id !== currentUser._id,
          );
        ```
        
        The `members` array does not contain a user object that corresponds to the creator of a discussion.
        
    -   **interface code for component**. We will use the `Drawer` component from Material-UI's library. `Drawer` looks like sliding sheet with supplementary content: [https://material-ui.com/components/drawers/#drawer](https://material-ui.com/components/drawers/#drawer)
        
        In our case, `Drawer` will show an end user a form to create a new discussion. After we are done with Post API, the `CreateDiscussionForm` component will also contain a `PostEditor` component. In other words, an end user will use the `CreateDiscussionForm` component to create both a new discussion and very first post within this discussion. For now, we will simply put a placeholder instead of the `PostEditor` component:
        
        ```
          <p>PostEditor component goes here</p>
        ```
        
        This is how we want the UI for `CreatDiscussionForm` to look:
        
        ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-26-24.png)
        
        `CreateDiscussionForm` is based on the `Dialog` component. We've already used `Dialog` components twice in this book - for building `Confirmer` and `InviteMember` components. UI code for `CreateDiscussionForm`:
        
        ```
          <React.Fragment>
            {open ? (
              <Head>
                <title>New Discussion</title>
                <meta name="description" content="Create new discussion" />
              </Head>
            ) : null}
            <Dialog 
              onClose={this.handleClose}
              aria-labelledby="simple-dialog-title"
              open={open}
              fullScreen={true}
            >
            <DialogTitle id="simple-dialog-title">Create new Discussion</DialogTitle>
            <DialogContent>
              <br />
              <form style={{ width: '100%', height: '60%' }} onSubmit={this.onSubmit}>
                <p />
                <br />
                <TextField
                  autoFocus
                  label="Type name of Discussion"
                  helperText="Give a short and informative name to new Discussion"
                  value={this.state.name}
                  onChange={(event) => {
                    this.setState({ name: event.target.value });
                  }}
                />
                <p />
                <br />
                <div>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={this.state.disabled}
                  >
                    Create Discussion
                  </Button>
                  {isMobile ? <p /> : null}
                  <Button
                    variant="outlined"
                    onClick={this.handleClose}
                    disabled={this.state.disabled}
                    style={{ marginLeft: isMobile ? '0px' : '20px' }}
                  >
                    Cancel
                  </Button>{' '}
                </div>
                <p>PostEditor component goes here</p>
                <p />
                <div>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={this.state.disabled}
                  >
                    Create Discussion
                  </Button>
                  {isMobile ? <p /> : null}
                  <Button
                    variant="outlined"
                    onClick={this.handleClose}
                    disabled={this.state.disabled}
                    style={{ marginLeft: isMobile ? '0px' : '20px' }}
                  >
                    Cancel
                  </Button>{' '}
                  <p />
                  <br />
                  <br />
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </React.Fragment>
        ```
        
        We are not going into the details of using `React.Fragment`, `form`, `TextField`, or `Button` elements and components, since we used them multiple times before in this book. We specified values for props of `Drawer` so that it appears from the right.
        
        The `open` state controls whether `Drawer` is shown or not. When an end user clicks the `Cancel` button, our application runs the `handleClose` component's method:
        
        ```
          public handleClose = () => {
            this.setState({ name: '', memberIds: [], disabled: false });
            this.props.onClose();
          };
        ```
        
        Executing `handleClose` executes the `onClose` function. Executing `onCLose` executes `handleDiscussionFormClose`. This is how we will use the `CreateDiscussionForm` component inside the `DiscussionList` component:
        
        ```
          <CreateDiscussionForm
            isMobile={this.props.isMobile}
            store={this.props.store}
            open={this.state.discussionFormOpen}
            onClose={this.handleDiscussionFormClose}
          />
        ```
        
        This is how we define `handleDiscussionFormClose` inside `DiscussionList`:
        
        ```
          public handleDiscussionFormClose = () => {
            this.setState({ discussionFormOpen: false });
          };
        ```
        
        That means `open: false` and `Drawer` is not shown. Now you understand the series of events that happens when an end user clicks the `Cancel` button on the `CreateDiscussionForm` component.
        
        When an end user clicks the plus icon on the `DiscussionList` component, our application will run the `addDiscussion` component method:
        
        ```
          public addDiscussion = (event) => {
            event.preventDefault();
            this.setState({ discussionFormOpen: true });
          };
        ```
        
        `discussionFormOpen: true` on `DiscussionList` means `open: true` on `CreateDiscussionForm` and `Drawer` is shown. We will discuss and build the `DiscussionList` component after `EditDiscussionForm`.
        
    -   **component's public methods**. `handleMemberChange` updates the value of `this.state.memberIds`. We've discussed `handleClose` already.
        
        ```
          public handleMemberChange = (memberIds) => {
            this.setState({ memberIds });
          };
        
          public handleClose = () => {
            this.setState({ name: '', memberIds: [], disabled: false });
            this.props.onClose();
          };
        ```
        
    -   **component's private methods**. There is only one method, `onSubmit`, that runs when a form is submitted. Since we built multiple `onSubmit` methods already in this book, we are not going into a detailed explanation here. Only a few things are worth noting - `onSubmit` calls the store method `addDiscussion` of the `Team` data store, and at the end, `Drawer` gets closed because we call `this.props.onClose` inside the `finally` section of our `try/catch/finally` syntax:
        
        ```
          private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
        
            const { store } = this.props;
            const { currentTeam } = store;
        
            if (!currentTeam) {
              notify('Team have not selected');
              return;
            }
        
            const { name, memberIds } = this.state;
        
            if (!name) {
              notify('Name is required');
              return;
            }
        
            if (!memberIds || memberIds.length < 1) {
              notify('Please assign at least one person to this Discussion.');
              return;
            }
        
            this.setState({ disabled: true });
            NProgress.start();
        
            try {
              const discussion = await currentTeam.addDiscussion({
                name,
                memberIds,
              });
        
              this.setState({ name: '', memberIds: [] });
        
              notify('You successfully added new Discussion.');
        
              Router.push(
                `/discussion?teamSlug=${currentTeam.slug}&discussionSlug=${discussion.slug}`,
                `/team/${currentTeam.slug}/discussions/${discussion.slug}`,
              );
            } catch (error) {
              console.log(error);
              notify(error);
            } finally {
              this.setState({ disabled: false });
              NProgress.done();
              this.props.onClose();
            }
          };
        ```
        
        If you decide to not have this logic:
        
        ```
          if (!memberIds || memberIds.length < 1) {
            notify('Please assign at least one person to this Discussion.');
            return;
          }
        ```
        
        then your discussion's creator can create a new discussion with just one team member on the team.
        
        Plug the code snippets in the original blueprint we used for non-page component:
        
        ```
          import Button from '@material-ui/core/Button';
          import Dialog from '@material-ui/core/Dialog';
          import DialogContent from '@material-ui/core/DialogContent';
          import DialogTitle from '@material-ui/core/DialogTitle';
          import FormControl from '@material-ui/core/FormControl';
          import FormHelperText from '@material-ui/core/FormHelperText';
          import InputLabel from '@material-ui/core/InputLabel';
          import Select from '@material-ui/core/Select';
          import MenuItem from '@material-ui/core/MenuItem';
          import TextField from '@material-ui/core/TextField';
          import { observer } from 'mobx-react';
          import Head from 'next/head';
          import Router from 'next/router';
          import NProgress from 'nprogress';
          import React from 'react';
        
          import notify from '../../lib/notify';
          import { Store } from '../../lib/store';
          import MemberChooser from '../common/MemberChooser';
          import PostEditor from '../posts/PostEditor';
        
          type Props = {
            isMobile: boolean;
            store: Store;
            open: boolean;
            onClose: () => void;
          };
        
          type State = {
            name: string;
            memberIds: string[];
            disabled: boolean;
          };
        
          class CreateDiscussionForm extends React.Component<Props, State> {
            constructor(props) {
              super(props);
        
              this.state = {
                name: '',
                memberIds: [],
                disabled: false,
              };
            }
        
            public render() {
              const { open, isMobile, store } = this.props;
              const { currentTeam, currentUser } = store;
        
              const membersMinusCreator = Array.from(currentTeam.members.values()).filter(
                (user) => user._id !== currentUser._id,
              );
        
              return (
                <React.Fragment>
                  {open ? (
                    <Head>
                      <title>New Discussion</title>
                      <meta name="description" content="Create new discussion" />
                    </Head>
                  ) : null}
                  <Dialog
                    onClose={this.handleClose}
                    aria-labelledby="simple-dialog-title"
                    open={open}
                    fullScreen={true}
                  >
                    <DialogTitle id="simple-dialog-title">Create new Discussion</DialogTitle>
                    <DialogContent>
                      <br />
                      <form style={{ width: '100%', height: '60%' }} onSubmit={this.onSubmit}>
                        <p />
                        <br />
                        <TextField
                          autoFocus
                          label="Type name of Discussion"
                          helperText="Give a short and informative name to new Discussion"
                          value={this.state.name}
                          onChange={(event) => {
                            this.setState({ name: event.target.value });
                          }}
                        />
                        <br />
                        <p />
                        <MemberChooser
                          helperText="These members will see all posts and be notified about unread posts in this discussion."
                          onChange={this.handleMembersChange}
                          members={membersMinusCreator}
                          selectedMemberIds={this.state.memberIds}
                        />
                        <p />
                        <br />
                        <FormControl>
                          <InputLabel>Notification type</InputLabel>
                          <Select
                            value={this.state.notificationType}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                              this.setState({ notificationType: event.target.value });
                            }}
                            required
                          >
                            <MenuItem value="default">Default: without email notification.</MenuItem>
                            <MenuItem value="email">Email: with email notification.</MenuItem>
                          </Select>
                          <FormHelperText>
                            Choose how to notify members about new Posts inside Discussion.
                          </FormHelperText>
                        </FormControl>
                        <p />
                        <br />
                        <div>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={this.state.disabled}
                          >
                            Create Discussion
                          </Button>
                          {isMobile ? <p /> : null}
                          <Button
                            variant="outlined"
                            onClick={this.handleClose}
                            disabled={this.state.disabled}
                            style={{ marginLeft: isMobile ? '0px' : '20px' }}
                          >
                            Cancel
                          </Button>{' '}
                        </div>
                        <p />
                        <PostEditor
                          content={this.state.content}
                          onChanged={this.onContentChanged}
                          members={Array.from(store.currentTeam.members.values())}
                          store={store}
                          parentComponent="CDF"
                        />
                        <p />
                        <div>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={this.state.disabled}
                          >
                            Create Discussion
                          </Button>
                          {isMobile ? <p /> : null}
                          <Button
                            variant="outlined"
                            onClick={this.handleClose}
                            disabled={this.state.disabled}
                            style={{ marginLeft: isMobile ? '0px' : '20px' }}
                          >
                            Cancel
                          </Button>{' '}
                          <p />
                          <br />
                          <br />
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </React.Fragment>
              );
            }
        
            public handleMembersChange = (memberIds) => {
              this.setState({ memberIds });
            };
        
            public handleClose = () => {
              this.setState({ name: '', memberIds: [], disabled: false, content: '' });
              this.props.onClose();
            };
        
            private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
        
              const { store } = this.props;
              const { currentTeam } = store;
        
              if (!currentTeam) {
                notify('Team have not selected');
                return;
              }
        
              const { name, memberIds, content, notificationType } = this.state;
        
              if (!name) {
                notify('Name is required');
                return;
              }
        
              if (!content) {
                notify('Content is required');
                return;
              }
        
              if (!memberIds || memberIds.length < 1) {
                notify('Please assign at least one person to this Discussion.');
                return;
              }
        
              if (!notificationType) {
                notify('Please select notification type.');
                return;
              }
        
              this.setState({ disabled: true });
              NProgress.start();
        
              try {
                const discussion = await currentTeam.addDiscussion({
                  name,
                  memberIds,
                  notificationType,
                });
        
                const post = await discussion.addPost(content);
        
                if (discussion.notificationType === 'email') {
                  const userIdsForLambda = discussion.memberIds.filter((m) => m !== discussion.createdUserId);
        
                  await discussion.sendDataToLambda({
                    discussionName: discussion.name,
                    discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
                    postContent: post.content,
                    authorName: post.user.displayName,
                    userIds: userIdsForLambda,
                  });
                }
        
                this.setState({ name: '', memberIds: [], content: '' });
        
                notify('You successfully added new Discussion.');
        
                Router.push(
                  `/discussion?teamSlug=${currentTeam.slug}&discussionSlug=${discussion.slug}`,
                  `/team/${currentTeam.slug}/discussions/${discussion.slug}`,
                );
              } catch (error) {
                console.log(error);
                notify(error);
              } finally {
                this.setState({ disabled: false });
                NProgress.done();
                this.props.onClose();
              }
            };
          }
        
          export default observer(CreateDiscussionForm);
        ```
        
        Create a new folder, `book/8-begin/app/components/discussions,` and new file, `book/8-begin/app/components/discussions/CreateDiscussionForm.tsx`. Paste the above content in this new file.
        
        Keep in mind that when you test creation of new discussion later in this chapter, you have to have at least one Team Member invited to your Team. Since you cannot create a new discussion with only yourself as participant because of how we defined `membersMinusCreator`.
        
-   `EditDiscussionForm` is very similar to `CreateDiscussionForm`. There are two main differences. One is that `EditDiscussionForm` will never contain the `PostEditor` component, so there is no placeholder for it. Second, we used `getDerivedStateFromProps` to decide whether we need to update the `state` object or not, depending on whether the value for `this.props.discussion` changed or not:
    
    [https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops](https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops)
    
    From official docs - "It should return an object to update the state, or null to update nothing".
    
    We use it like this - we compare `discussionId` from `state` to `discussion._id` from `props`. If these two values are the same, then we return `null` to update nothing. If not, we return a `state` object new values for `name`, `memberIds`, and `discussionId` properties.
    
    ```
      public static getDerivedStateFromProps(props: Props, state: State) {
        const { discussion } = props;
    
        if (state.discussionId === discussion._id) {
          return null;
        }
    
        return {
          name: (discussion && discussion.name) || '',
          memberIds: (discussion && discussion.memberIds) || [],
          discussionId: discussion._id,
        };
      }
    ```
    
    Why do we have `getDerivedStateFromProps`? It runs on both initial mount and subsequent updates. When an end user clicks the `Edit` menu item from `DiscussionActionMenu`, our application shows `EditDiscussionForm`. This end user may close the `EditDiscussionForm` modal and then click the `Edit` menu item from `DiscussionActionMenu` on a **different** discussion item from the discussion list. That's where this `getDerivedStateFromProps` method will return a `state` object with new data instead of `null` to update nothing.
    
    An end user clicks the three-dots icon on `DiscussionListItem` inside `DiscussionList`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+11-56-27.png)
    
    If end user clicks on the `Edit` menu item:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+11-57-15.png)
    
    Then our application shows the `EditDiscussionForm` component that is based on modal:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+11-57-53.png)
    
    Since `CreateDiscussionForm` will contain the `PostEditor` component with a post's content, we made `CreateDiscussionForm` based on the `Dialog` component with `fullScreen={true}`. Unlike `CreateDiscussionForm`, `EditDiscussionForm` has no `PostEditor`; thus we will the `Dialog` component **without** `fullScreen={true}`.
    
    The code for `EditDiscussionForm` component:
    
    ```
      import Button from '@material-ui/core/Button';
      import Dialog from '@material-ui/core/Dialog';
      import DialogActions from '@material-ui/core/DialogActions';
      import DialogContent from '@material-ui/core/DialogContent';
      import DialogContentText from '@material-ui/core/DialogContentText';
      import DialogTitle from '@material-ui/core/DialogTitle';
      import TextField from '@material-ui/core/TextField';
      import { observer } from 'mobx-react';
      import NProgress from 'nprogress';
      import React from 'react';
    
      import notify from '../../lib/notify';
      import { Store } from '../../lib/store';
      import { Discussion } from '../../lib/store/discussion';
      import MemberChooser from '../common/MemberChooser';
    
      type Props = {
        store: Store;
        onClose: () => void;
        open: boolean;
        discussion: Discussion;
        isMobile: boolean;
      };
    
      type State = {
        name: string;
        memberIds: string[];
        disabled: boolean;
        discussionId: string;
      };
    
      class EditDiscussionForm extends React.Component<Props, State> {
        constructor(props) {
          super(props);
    
          this.state = {
            name: '',
            memberIds: [],
            disabled: false,
            discussionId: '',
          };
        }
    
        public static getDerivedStateFromProps(props: Props, state: State) {
          const { discussion } = props;
    
          if (state.discussionId === discussion._id) {
            return null;
          }
    
          return {
            name: (discussion && discussion.name) || '',
            memberIds: (discussion && discussion.memberIds) || [],
            discussionId: discussion._id,
          };
        }
    
        public render() {
          const { open, store } = this.props;
          const { currentUser } = store;
    
          const members = Array.from(store.currentTeam.members.values()).filter(
            (user) => user._id !== currentUser._id,
          );
    
          return (
            <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={open}>
              <DialogTitle id="simple-dialog-title">Edit Discussion</DialogTitle>
              <DialogContent>
                <DialogContentText>Edit discussion</DialogContentText>
                <br />
                <form onSubmit={this.onSubmit}>
                  <TextField
                    label="Type name of Discussion"
                    helperText="Give a short and informative name to Discussion"
                    value={this.state.name}
                    onChange={(event) => {
                      this.setState({ name: event.target.value });
                    }}
                  />
                  <br />
                  <p />
                  <MemberChooser
                    helperText="These members will see all posts and be notified about unread posts in this discussion."
                    onChange={this.handleMembersChange}
                    members={members}
                    selectedMemberIds={this.state.memberIds}
                  />
                  <p />
                  <br />
                  <DialogActions>
                    <Button
                      color="primary"
                      variant="outlined"
                      onClick={this.handleClose}
                      disabled={this.state.disabled}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={this.state.disabled}
                    >
                      Update Discussion
                    </Button>
                  </DialogActions>
                </form>
              </DialogContent>
            </Dialog>
          );
        }
    
        public handleMembersChange = (memberIds) => {
          this.setState({ memberIds });
        };
    
        public handleClose = () => {
          this.setState({ name: '', memberIds: [], disabled: false });
          this.props.onClose();
        };
    
        private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
    
          const { discussion, store } = this.props;
          const { currentTeam } = store;
    
          if (!currentTeam) {
            notify('Team have not selected');
            return;
          }
    
          const { name, memberIds } = this.state;
    
          if (!name) {
            notify('Please name this Discussion.');
            return;
          }
    
          if (memberIds && !memberIds.includes(discussion.store.currentUser._id)) {
            memberIds.push(discussion.store.currentUser._id);
          }
    
          if (!memberIds || memberIds.length < 1) {
            notify('Please assign at least one person to this Discussion.');
            return;
          }
    
          NProgress.start();
          try {
            await discussion.editDiscussion({ name, memberIds });
    
            this.setState({ name: '', memberIds: [], disabled: false });
            notify('You successfully edited Discussion.');
          } catch (error) {
            console.log(error);
            notify(error);
          } finally {
            this.setState({ disabled: false });
            NProgress.done();
    
            this.props.onClose();
          }
        };
      }
    
      export default observer(EditDiscussionForm);
    ```
    
    Create a new file, `book/8-begin/app/components/discussions/EditDiscussionForm.tsx`, with the above content in it.
    

-   `DiscussionList` does not require any click action from an end user. Our application loads and displays a list of discussions automatically inside the first grid column when an end user loads the `DiscussionPageComp` page:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+12-37-52.png)
    
    `DiscussionList` component is relatively easy to implement. Besides, we already discussed `DiscussionList.addDiscussion` and `DiscussionList.handleDiscussionFormClose` methods earlier in this subsection when discussing `CreateDiscussionForm`. `DiscussionList` component contains `CreateDiscussionForm` component:
    
    ```
      import Tooltip from '@material-ui/core/Tooltip';
      import { observer } from 'mobx-react';
      import React from 'react';
    
      import { Store } from '../../lib/store';
      import { Team } from '../../lib/store/team';
    
      import CreateDiscussionForm from './CreateDiscussionForm';
      import DiscussionListItem from './DiscussionListItem';
    
      import notify from '../../lib/notify';
    
      type Props = { store: Store; team: Team; isMobile: boolean };
    
      type State = { discussionFormOpen: boolean };
    
      class DiscussionList extends React.Component<Props, State> {
        constructor(props) {
          super(props);
    
          this.state = {
            discussionFormOpen: false,
          };
        }
    
        public componentDidMount() {
          this.props.team.loadDiscussions().catch((err) => notify(err));
        }
    
        public componentDidUpdate(prevProps: Props) {
          if (this.props.team._id !== prevProps.team._id) {
            this.props.team.loadDiscussions().catch((err) => notify(err));
          }
        }
    
        public render() {
          const { store, team } = this.props;
    
          const isThemeDark = store && store.currentUser && store.currentUser.darkTheme === true;
    
          return (
            <div>
              Discussions
              <Tooltip title="Add Discussion" placement="right" disableFocusListener disableTouchListener>
                <a onClick={this.addDiscussion} style={{ float: 'right', padding: '0px 10px' }}>
                  <i
                    className="material-icons"
                    color="action"
                    style={{ fontSize: 14, opacity: 0.7, color: isThemeDark ? '#fff' : '#000' }}
                  >
                    add_circle_outline
                  </i>{' '}
                </a>
              </Tooltip>
              <p />
              <ul style={{ listStyle: 'none', padding: '0px' }}>
                {team &&
                  team.orderedDiscussions.map((d) => {
                    return (
                      <DiscussionListItem
                        key={d._id}
                        discussion={d}
                        team={team}
                        isMobile={this.props.isMobile}
                        store={this.props.store}
                      />
                    );
                  })}
              </ul>
    
              <CreateDiscussionForm
                isMobile={this.props.isMobile}
                store={this.props.store}
                open={this.state.discussionFormOpen}
                onClose={this.handleDiscussionFormClose}
              />
            </div>
          );
        }
    
        public addDiscussion = (event) => {
          event.preventDefault();
          this.setState({ discussionFormOpen: true });
        };
    
        public handleDiscussionFormClose = () => {
          this.setState({ discussionFormOpen: false });
        };
      }
    
      export default observer(DiscussionList);
    ```
    
    Create a new file, `book/8-begin/app/components/discussions/DiscussionList.tsx`, with the above content in it.
    
    We should remember to add the `DiscussionList` component to our `Layout` HOC. Open `book/8-begin/app/components/layout/index.tsx`, then import and add `DiscussionList` like so:
    
    ```
      // some code
        <MenuWithLinks options={menuOnTheRight({ currentTeam })}>
          <Avatar
            src={
              !currentTeam
                ? 'https://storage.googleapis.com/async-await/default-user.png'
                : currentUser.avatarUrl
            }
            alt={`Logo of ${currentUser.displayName}`}
            style={{
              margin: '20px auto',
              cursor: 'pointer',
              display: 'inline-flex',
              width: '40px',
              height: '40px',
            }}
          />
    
          <i className="material-icons" color="action" style={{ verticalAlign: 'super' }}>
            arrow_drop_down
          </i>
        </MenuWithLinks>
      </div>
      <hr />
      <p />
      <p />
      <DiscussionList store={store} team={currentTeam} isMobile={isMobile} />
      // some code
    ```
    

-   `DiscussionListItem`. We just used `DiscussionListItem` inside `DiscussionList`, so let's define it. You can see from the above screenshot that `DiscussionListItem` represents one discussion on the list of discussions, `DiscussionList`.
    
    Similar to `DiscussionList`, `DiscussionListItem` is straightforward to build. We use the `Paper` component from Material-UI's library. `Paper` somewhat resembles a physical piece of paper:
    
    [https://material-ui.com/components/paper/#paper](https://material-ui.com/components/paper/#paper)
    
    We chose it so each discussion stands out on the list of discussions like this:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-22+11-57-04.png)
    
    `DiscussionListItem`:
    
    ```
      import Paper from '@material-ui/core/Paper';
      import { observer } from 'mobx-react';
      import Link from 'next/link';
      import React from 'react';
    
      import { Store } from '../../lib/store';
      import { Discussion } from '../../lib/store/discussion';
      import { Team } from '../../lib/store/team';
    
      import DiscussionActionMenu from './DiscussionActionMenu';
    
      type Props = {
        store: Store;
        discussion: Discussion;
        team: Team;
        isMobile: boolean;
      };
    
      class DiscussionListItem extends React.Component<Props> {
        public render() {
          const { store, discussion, team, isMobile } = this.props;
          const trimmingLength = 16;
    
          const selectedDiscussion =
            store.currentUrl === `/team/${team.slug}/discussions/${discussion.slug}`;
    
          const isThemeDark = store && store.currentUser && store.currentUser.darkTheme === true;
    
          const selectedItemBorder = isThemeDark
            ? '1px rgba(255, 255, 255, 0.75) solid'
            : '1px rgba(0, 0, 0, 0.75) solid';
    
          return (
            <Paper
              key={discussion._id}
              style={{
                margin: '10px 10px 5px 0px',
                padding: '8px',
                border: selectedDiscussion ? selectedItemBorder : 'none',
              }}
              elevation={selectedDiscussion ? 24 : 1}
            >
              <li key={discussion._id} style={{ whiteSpace: 'nowrap', paddingRight: '10px' }}>
                <Link
                  scroll={false}
                  href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
                  as={`/team/${team.slug}/discussions/${discussion.slug}`}
                  style={{ fontWeight: 300, color: isThemeDark ? '#fff' : '#000' }}
                  key={discussion._id}
                >
                  {discussion.name.length > trimmingLength
                    ? `${discussion.name.substring(0, trimmingLength)}...`
                    : discussion.name}
                </Link>
                <div
                  style={{
                    float: 'right',
                    marginRight: '-12px',
                  }}
                >
                  <DiscussionActionMenu discussion={discussion} isMobile={isMobile} store={store} />
                </div>
              </li>
            </Paper>
          );
        }
      }
    
      export default observer(DiscussionListItem);
    ```
    
    Create a new file, `book/8-begin/app/components/discussions/DiscussionListItem.tsx`, with the above content in it.
    

-   `DiscussionActionMenu`. Inside the `DiscussionListItem` component, we used the `DiscussionActionMenu` component. Our application shows `DiscussionActionMenu` when an end user clicks on the three-dots icon on `DiscussionListItem` inside `DiscussionList`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+11-56-27.png)
    
    `DiscussionActionMenu` looks similar to the dropdown menu we built before, `MenuWithLinks`. `DiscussionActionMenu` has three menu items:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-10+12-16-01.png)
    
    `DiscussionActionMenu` is based on `MenuWithMenuItems`, which is very similar to `MenuWithLinks` in appearance and code. We discussed and built `MenuWithLinks` in Chapter 2. We will discuss `MenuWithMenuItems` in the next subsection, since we classified it to be a common component and not exclusive to Discussion API.
    
    In addition to `MenuWithMenuItems`, `DiscussionActionMenu` also contains the `EditDiscussionForm` component.
    
    Let's look at the bluerprint for our `DiscussionActionMenu` component:
    
    ```
      // imports
    
      // type Props = ...
    
      // type State = ...
    
      class DiscussionActionMenu extends React.Component<Props, State> {
        // constructor(props)
    
        public render() {
          // access some values from props or state
    
          return (
            // interface code for component
          );
        }
    
        // component's public methods
    
        // component's private methods
      }
    
      export default SomeHOCs(DiscussionActionMenu);
    ```
    
    -   **imports**:
        
        ```
          import { observer } from 'mobx-react';
          import NProgress from 'nprogress';
          import React from 'react';
        
          import confirm from '../../lib/confirm';
          import notify from '../../lib/notify';
          import { Store } from '../../lib/store';
          import { Discussion } from '../../lib/store/discussion';
        
          import MenuWithMenuItems from '../common/MenuWithMenuItems';
          import EditDiscussionForm from './EditDiscussionForm';
        ```
        
    -   **type Props = ...**:
        
        ```
          type Props = {
            discussion: Discussion;
            store: Store;
            isMobile: boolean;
          };
        ```
        
    -   **type State = ...**:
        
        ```
          type State = {
            discussionFormOpen: boolean;
            selectedDiscussion: Discussion;
          };
        ```
        
    -   **public state =**:
        
        ```
          constructor(props) {
            super(props);
        
            this.state = {
              discussionFormOpen: false,
              selectedDiscussion: null,
            };
          }
        ```
        
        It is false, because we want `EditDiscussionForm` to be hidden until an end user clicks the `Edit` menu item.
        
    -   **access some values from props or state**:
        
        ```
          const { discussion, store } = this.props;
          const { currentUser } = store;
        
          const isCreator = currentUser._id === discussion.createdUserId ? true : false;
        ```
        
    -   **interface code for component** is as simple as having `MenuWithMenuItems` and `EditDiscussionForm`:
        
        ```
          <React.Fragment>
            <MenuWithMenuItems
              menuOptions={getMenuOptions(discussion)}
              itemOptions={
                isCreator
                  ? getMenuItemOptionsForCreator(discussion, this)
                  : getMenuItemOptions(discussion, this)
              }
            />
        
            {this.state.discussionFormOpen ? (
              <EditDiscussionForm
                open={true}
                onClose={this.handleDiscussionFormClose}
                discussion={discussion}
                isMobile={this.props.isMobile}
                store={store}
              />
            ) : null}
          </React.Fragment>
        ```
        
        As you can see, we use helper functions that are completely optional to create and use: `getMenuOptions`, `getMenuItemOptionsForCreator`, and `getMenuItemOptions`. `getMenuOptions` returns discussion-specific data that we use to create a link between the three-dots icon and menu opening inside `MenuWithMenuItems`:
        
        ```
          const getMenuOptions = (discussion) => ({
            dataId: discussion._id,
            id: `discussion-menu-${discussion._id}`,
          });
        ```
        
        `getMenuItemOptionsForCreator` returns menu items that our application shows to the creator of a discussion:
        
        ```
          const getMenuItemOptionsForCreator = (discussion, component) => [
            {
              text: 'Copy URL',
              dataId: discussion._id,
              onClick: component.handleCopyUrl,
            },
            {
              text: 'Edit',
              dataId: discussion._id,
              onClick: component.editDiscussion,
            },
            {
              text: 'Delete',
              dataId: discussion._id,
              onClick: component.deleteDiscussion,
            },
          ];
        ```
        
        `getMenuItemOptions` returns menu items that our application shows to a participant but not creator of a discussion:
        
        ```
          const getMenuItemOptions = (discussion, component) => [
            {
              text: 'Copy URL',
              dataId: discussion._id,
              onClick: component.handleCopyUrl,
            },
          ];
        ```
        
    -   **component's public methods**. As you can see from the definition of `getMenuItemOptionsForCreator`, we have to define the component's methods `handleCopyUrl`, `editDiscussion`, and `deleteDiscussion`. Please do not confuse these methods with store or other types of methods - these are component methods.
        
        `handleCopyUrl` allows an end user to copy a discussion's URL from the browser's address bar:
        
        ```
        public handleCopyUrl = async (event) => {
        const { store } = this.props;
        const { currentTeam } = store;
        
        const id = event.currentTarget.dataset.id;
        if (!id) {
          return;
        }
        
        const selectedDiscussion = currentTeam.discussions.find((d) => d._id === id);
        const discussionUrl = `${process.env.NEXT_PUBLIC_URL_APP}/team/${currentTeam.slug}/discussions/${selectedDiscussion.slug}`;
        
        try {
          if (window.navigator) {
            await window.navigator.clipboard.writeText(discussionUrl);
            notify('You successfully copied URL.');
          }
        } catch (err) {
          notify(err);
        } finally {
          this.setState({ discussionFormOpen: false, selectedDiscussion: null });
        }
        };
        ```
        
        From the above code, you can see that technically we are not reading the browser's address bar. Instead, we constructed a URL string and saved it to an end user's system clipboard using the `Clipboard.writeText()` method:
        
        [https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
        
        `editDiscussion` shows the `EditDiscussionForm` component using the `this.state.discussionFormOpen` boolean property. `EditDiscussionForm` is hidden by default:
        
        ```
        public editDiscussion = (event) => {
        const { currentTeam } = this.props.store;
        if (!currentTeam) {
          notify('You have not selected Team.');
          return;
        }
        
        const id = event.currentTarget.dataset.id;
        if (!id) {
          return;
        }
        
        const selectedDiscussion = currentTeam.discussions.find((d) => d._id === id);
        
        this.setState({ discussionFormOpen: true, selectedDiscussion });
        };
        ```
        
        The `deleteDiscussion` component method passes a discussion's id and calls the store method `currentTeam.deleteDiscussion`:
        
        ```
        public deleteDiscussion = async (event) => {
        const { currentTeam } = this.props.store;
        if (!currentTeam) {
          notify('You have not selected Team.');
          return;
        }
        
        const id = event.currentTarget.dataset.id;
        
        confirm({
          title: 'Are you sure?',
          message: '',
          onAnswer: async (answer) => {
            if (!answer) {
              return;
            }
        
            NProgress.start();
        
            try {
              await currentTeam.deleteDiscussion(id);
        
              notify('You successfully deleted Discussion.');
            } catch (error) {
              console.error(error);
              notify(error);
            } finally {
              NProgress.done();
            }
          },
        });
        };
        ```
        
        Create a new file, `book/8-begin/app/components/discussions/DiscussionActionMenu.tsx`, with the following content in it:
        
        ```
        import { observer } from 'mobx-react';
        import NProgress from 'nprogress';
        import React from 'react';
        
        import confirm from '../../lib/confirm';
        import notify from '../../lib/notify';
        import { Store } from '../../lib/store';
        import { Discussion } from '../../lib/store/discussion';
        
        import MenuWithMenuItems from '../common/MenuWithMenuItems';
        import EditDiscussionForm from './EditDiscussionForm';
        
        const getMenuOptions = (discussion) => ({
        dataId: discussion._id,
        id: `discussion-menu-${discussion._id}`,
        });
        
        const getMenuItemOptionsForCreator = (discussion, component) => [
        {
          text: 'Copy URL',
          dataId: discussion._id,
          onClick: component.handleCopyUrl,
        },
        {
          text: 'Edit',
          dataId: discussion._id,
          onClick: component.editDiscussion,
        },
        {
          text: 'Delete',
          dataId: discussion._id,
          onClick: component.deleteDiscussion,
        },
        ];
        
        const getMenuItemOptions = (discussion, component) => [
        {
          text: 'Copy URL',
          dataId: discussion._id,
          onClick: component.handleCopyUrl,
        },
        ];
        
        type Props = {
        discussion: Discussion;
        store: Store;
        isMobile: boolean;
        };
        
        type State = {
        discussionFormOpen: boolean;
        selectedDiscussion: Discussion;
        };
        
        class DiscussionActionMenu extends React.Component<Props, State> {
        constructor(props) {
          super(props);
        
          this.state = {
            discussionFormOpen: false,
            selectedDiscussion: null,
          };
        }
        
        public render() {
          const { discussion, store } = this.props;
          const { currentUser } = store;
        
          const isCreator = currentUser._id === discussion.createdUserId ? true : false;
        
          return (
            <React.Fragment>
              <MenuWithMenuItems
                menuOptions={getMenuOptions(discussion)}
                itemOptions={
                  isCreator
                    ? getMenuItemOptionsForCreator(discussion, this)
                    : getMenuItemOptions(discussion, this)
                }
              />
        
              {this.state.discussionFormOpen ? (
                <EditDiscussionForm
                  open={true}
                  onClose={this.handleDiscussionFormClose}
                  discussion={discussion}
                  isMobile={this.props.isMobile}
                  store={store}
                />
              ) : null}
            </React.Fragment>
          );
        }
        
        public handleCopyUrl = async (event) => {
          const { store } = this.props;
          const { currentTeam } = store;
        
          const id = event.currentTarget.dataset.id;
          if (!id) {
            return;
          }
        
          const selectedDiscussion = currentTeam.discussions.find((d) => d._id === id);
          const discussionUrl = `${process.env.NEXT_PUBLIC_URL_APP}/team/${currentTeam.slug}/discussions/${selectedDiscussion.slug}`;
        
          try {
            if (window.navigator) {
              await window.navigator.clipboard.writeText(discussionUrl);
              notify('You successfully copied URL.');
            }
          } catch (err) {
            notify(err);
          } finally {
            this.setState({ discussionFormOpen: false, selectedDiscussion: null });
          }
        };
        
        public editDiscussion = (event) => {
          const { currentTeam } = this.props.store;
          if (!currentTeam) {
            notify('You have not selected Team.');
            return;
          }
        
          const id = event.currentTarget.dataset.id;
          if (!id) {
            return;
          }
        
          const selectedDiscussion = currentTeam.discussions.find((d) => d._id === id);
        
          this.setState({ discussionFormOpen: true, selectedDiscussion });
        };
        
        public deleteDiscussion = async (event) => {
          const { currentTeam } = this.props.store;
          if (!currentTeam) {
            notify('You have not selected Team.');
            return;
          }
        
          const id = event.currentTarget.dataset.id;
        
          confirm({
            title: 'Are you sure?',
            message: '',
            onAnswer: async (answer) => {
              if (!answer) {
                return;
              }
        
              NProgress.start();
        
              try {
                await currentTeam.deleteDiscussion(id);
        
                notify('You successfully deleted Discussion.');
              } catch (error) {
                console.error(error);
                notify(error);
              } finally {
                NProgress.done();
              }
            },
          });
        };
        
        public handleDiscussionFormClose = () => {
          this.setState({ discussionFormOpen: false, selectedDiscussion: null });
        };
        }
        
        export default observer(DiscussionActionMenu);
        ```
        
        Note that we also define a `handleDiscussionFormClose` method that sets values for properties of the `state` object back to default values after the `EditDiscussionForm` modal gets hidden.
        

Important note: you may have noticed that for all discussion-specific components (`CreateDiscussionForm`, `EditDiscussionForm`, `DiscussionList`, `DiscussionListItem`, and `DiscussionActionMenu`), we did not use the `inject('store')` HOC. This is because it is unnecessary for a component to which we pass the `store` prop manually. Look at how we use all of these components - to all of them, we pass `store`, for example:

```
<EditDiscussionForm
  open={true}
  onClose={this.handleDiscussionFormClose}
  discussion={discussion}
  isMobile={this.props.isMobile}
  store={store}
/>
```

___

#### Common components for Discussion API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#common-components-for-discussion-api)

You already learned Remember to add import Click on the button session Put it all together discussion S3 bucket withAuth HOC add environmental variable At AWS dashboard MongoDB database API method. Compiles request was sent mount middleware production-ready mount middleware store method calls Remember to add import show notification You already learned Put it all together. Server-side rendering You already learned store method calls page component cookie in this book it works as expected it works as expected send this response Navigate to withAuth HOC page component show notification. Google OAuth API in production it works as expected in a browser withAuth HOC production-ready in production if truthy then production-ready production-ready. In production end user decorate method with action withAuth HOC Navigate to session At AWS dashboard API infrastructure triggers method HTTP S3 bucket. On the client production-ready team members open this file static method calls Google OAuth API end user Team Leader store method calls server-side rendering Google OAuth API. Redirect to checkout server-side rendering list of posts conditional operator page component team members MongoDB database production-ready in this book open this file this chapter team members request in a browser. Request API method calls corresponding store method new Express route cookie discussion end user. Add environmental variable API infrastructure in a browser Remember to add import page component static method calls discussion cookie page component Put it all together. Redirect to checkout Click on the button You already learned in production API method.

In the previous subsection, we discussed all components that are specific to Discussion API. In this subsection, we will discuss two components that we use for Discussion API but can be easily used elsewhere in our application. For example, in our SaaS product, Async, we re-use `MemberChooser` for Discussion API, Note API, Task API, and Chat API.

The two common components we will discuss and build in this subsection are:

-   `MenuWithMenuItems`. We already used this common component to build `DiscussionActionMenu`. It is very similar to `MenuWithLinks` in appearance and code.
-   `MemberChooser`. We already used this component inside both `CreateDiscussionForm` and `EditDiscussionForm` components to allow an end user to select a discussion's participants among all team members. We will use Material-UI's `AutoComplete` component to build the `MemberChooser` component.

-   `MenuWithMenuItems`. Here is how `MenuWithLinks`, a component that we already built in this book, looks:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-14+11-13-09.png)
    
    Here is how we want `MenuWithItems` to look:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-14+11-13-20.png)
    
    Here is the code for `MenuWithLinks`:
    
    ```
      import Menu from '@material-ui/core/Menu';
      import MenuItem from '@material-ui/core/MenuItem';
      import Link from 'next/link';
      import { NextRouter, withRouter } from 'next/router';
      import React from 'react';
    
      type Props = {
        options: {
          href: string;
          as: string;
          highlighterSlug: string;
          text: string;
          separator: boolean;
        }[];
        router: NextRouter;
      };
    
      type State = {
        anchorEl: Element | ((element: Element) => Element);
      };
    
      class MenuWithLinks extends React.PureComponent<Props, State> {
        constructor(props) {
          super(props);
    
          this.state = {
            anchorEl: null,
          };
        }
    
        public render() {
          const { options, children, router } = this.props;
          const { anchorEl } = this.state;
    
          return (
            <div style={{ textAlign: 'center' }}>
              <div
                aria-controls={anchorEl ? 'simple-menu' : null}
                aria-haspopup="true"
                onClick={this.handleClick}
                onKeyPress={this.handleClick}
              >
                {children}
              </div>
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={this.handleClose}
                keepMounted
              >
                {options.map((option, i) =>
                  option.separator ? (
                    <hr style={{ width: '85%', margin: '10px auto' }} key={`separated-${i}`} />
                  ) : (
                    <Link key={option.href} href={option.href} as={option.as} passHref>
                      <MenuItem
                        key={option.href}
                        style={{
                          fontWeight: router.asPath.includes(option.highlighterSlug) ? 600 : 300,
                          fontSize: '14px',
                        }}
                      >
                        {option.text}
                      </MenuItem>
                    </Link>
                  ),
                )}
              </Menu>
            </div>
          );
        }
    
        public handleClick = (event) => {
          this.setState({ anchorEl: event.currentTarget });
        };
    
        public handleClose = () => {
          this.setState({ anchorEl: null });
        };
      }
    
      export default withRouter(MenuWithLinks);
    ```
    
    Note how we used `Menu` and `MenuItem` components from the Material-UI library. Also note how we wrap `Menu` with `div` that has `aria-controls` and `aria-haspopup` attributes. In `MenuWithMenuItems`, we will have the exact same structure. Create a new file, `book/8-begin/app/components/common/MenuWithMenuItems.tsx`, with the following content:
    
    ```
      import Menu from '@material-ui/core/Menu';
      import MenuItem from '@material-ui/core/MenuItem';
      import React from 'react';
    
      type Props = {
        menuOptions: any;
        itemOptions: any[];
      };
    
      type State = {
        menuElem: Element | ((element: Element) => Element);
      };
    
      class MenuWithMenuItems extends React.PureComponent<Props, State> {
        constructor(props) {
          super(props);
    
          this.state = {
            menuElem: null,
          };
        }
    
        public render() {
          const { menuOptions, itemOptions } = this.props;
          const { menuElm } = this.state;
    
          return (
            <div style={{ verticalAlign: 'middle' }}>
              <i
                aria-controls={menuElm ? menuOptions.id : null}
                data-id={menuOptions.dataId}
                aria-haspopup="true"
                style={{ fontSize: '14px', opacity: 0.7, cursor: 'pointer' }}
                className="material-icons"
                onClick={(e) => this.handleClick(e)}
              >
                more_vert
              </i>
    
              <Menu
                id={menuOptions.id}
                anchorEl={menuElm}
                open={Boolean(menuElm)}
                onClose={this.handleClose}
              >
                {itemOptions.map((option, i) => (
                  <MenuItem
                    key={option.dataId + i}
                    data-id={option.dataId}
                    data-more-id={option.dataMoreId}
                    onClick={(e) => {
                      this.setState({ menuElm: null });
                      option.onClick(e);
                    }}
                  >
                    {option.text}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          );
        }
    
        public handleClick = (event) => {
          event.preventDefault();
          this.setState({ menuElm: event.currentTarget });
        };
    
        public handleClose = () => {
          this.setState({ menuElm: null });
        };
      }
    
      export default MenuWithMenuItems;
    ```
    
    As you can see from the above code, the only difference between `MenuWithLinks` and `MenuWithMenuItems` is what happens when a user clicks on the link or menu item. In the case of `MenuWithLinks`, our application calls Next.js's `Router.push` method to navigate the user to either a new page or to log out. In the case of `MenuWithMenuItems`, our application executes the corresponding `onClick` methods from `book/8-begin/app/components/discussions/DiscussionActionMenu.tsx`. These methods are `handleCopyUrl`, `editDiscussion`, and `deleteDiscussion`:
    
    ```
      const getMenuItemOptionsForCreator = (discussion, component) => [
        {
          text: 'Copy URL',
          dataId: discussion._id,
          onClick: component.handleCopyUrl,
        },
        {
          text: 'Edit',
          dataId: discussion._id,
          onClick: component.editDiscussion,
        },
        {
          text: 'Delete',
          dataId: discussion._id,
          onClick: component.deleteDiscussion,
        },
      ];
    ```
    
    We could have created a hybrid component that has some boolean prop that either calls `Router.push` or the corresponding method, but we preferred two have two components, `MenuWithLinks` and `MenuWithMenuItems`, for better code readability.
    

-   We use `MemberChooser` in both `CreateDiscussionForm` and `EditDiscussionForm`. `MemberChooser` allows a user to select a discussion's participants from the team members.
    
    The nice UX we want here - when a user puts their mouse cursor into the input element, our application shows this user a list of all team members minus the discussion's creator. This way, the user can select a discussion's participants instead of typing team members' names or email addresses. The screenshot below shows an end user at the `CreateDiscussion` form. After adding their mouse cursor to the `Autocomplete` component, the user sees a **dropdown list**, in this case with one member, of all team members other than the user him/herself (since he/she is the discussion's creator):
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-15-05.png)
    
    The discussion's creator sees that Bob Ross was selected to be the discussion's participant after clicking on **Team Member Async** from the dropdown list:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-15-54.png)
    
    `MemberChooser` is relatively easy to define, since it is primarily based on the `AutoComplete` component from the `@material-ui/lab` library:
    
    [https://material-ui.com/components/autocomplete/#autocomplete](https://material-ui.com/components/autocomplete/#autocomplete)
    
    We will closely follow the very first example in the "Multiple values" section:
    
    [https://material-ui.com/components/autocomplete/#multiple-values](https://material-ui.com/components/autocomplete/#multiple-values)
    
    Code from example:
    
    ```
      <Autocomplete
        multiple
        id="tags-standard"
        options={top100Films}
        getOptionLabel={(option) => option.title}
        defaultValue={[top100Films[13]]}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Multiple values"
            placeholder="Favorites"
          />
        )}
      />
    ```
    
    UI for the above code:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-14+12-50-57.png)
    
    `@material-ui/lab` is not `@material-ui/core`, and it contains components that are candidates for merging into `@material-ui/core`.
    
    In our case, the above example will become:
    
    ```
      <Autocomplete
        multiple
        id="tags-standard"
        options={suggestions}
        getOptionLabel={(option) => option.label}
        getOptionSelected={(option, value) => option.id === value.id}
        value={this.state.selectedItems}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Find team member by name"
            placeholder="Select participants"
          />
        )}
        onChange={this.handleChange}
        filterSelectedOptions={true}
        noOptionsText="No team members to select from"
      />
    ```
    
    The `options` prop is an array of all team members minus the discussion's creator. `value` is the selected participants. `filterSelectedOptions` is set to `true` to ensure that the selected participants are not displayed as options. For `getOptionSelected`, we use the user's `_id` instead of the user's `displayName`, since the former is unique and the latter is not unique. `onChange` takes three arguments: `event`, `value` and `reason`. We chose to use only first two. Check up the official docs about `Autocomplete`'s props:
    
    [https://material-ui.com/api/autocomplete/](https://material-ui.com/api/autocomplete/)
    
    There is a `suggestions` variable that is an array of objects corresponding to all team members minus the discussion's creator:
    
    ```
      const suggestions = this.props.members.map((user) => ({
        label: user.displayName || user.email,
        id: user._id,
      }));
    ```
    
    Look at the code we wrote for `CreateDiscussionForm` or for `EditDiscussionForm` - that's where we removed the discussion's creator:
    
    ```
      const members = Array.from(store.currentTeam.members.values()).filter(
        (user) => user._id !== currentUser._id,
      );
    ```
    
    There is also a `selectedItems` variable, which is again an array made of the `suggestions` array but made with objects that pass the test:
    
    ```
      this.props.selectedMemberIds.indexOf(s.value) !== -1
    ```
    
    Which means `selectedItems` is an array with objects that have a property `id` with a value that is present inside the `selectedMemberIds` array.
    
    Since we've already used JavaScript's array methods `map`, `filter`, and `indexOf` in previous chapters, we are not going into the details of how they work here.
    
    `handleChange` component's method:
    
    ```
      public handleChange = (event, value) => {
        event.preventDefault();
    
        const selectedItems = value;
    
        this.setState({ selectedItems });
    
        this.props.onChange(selectedItems.map((i) => i.id));
      };
    ```
    
    Inside `handleChange`, we take `value`, which is a new/updated value of the `Autocomplete` component. Then we update `this.state.selectedItems` using the `this.setState` method and call `this.props.onChange` with the argument `selectedItems.map((i) => i.id)`. This argument is an array of strings. Each string corresponds to a user's id. When we call `this.props.onChange` inside `MemberChooser`, we call `handleMembersChange` in either `CreateDiscussionForm` or `EditDiscussionForm`:
    
    ```
      public handleMembersChange = (memberIds) => {
        this.setState({ memberIds });
      };
    ```
    
    Then inside `onSubmit` of either `CreateDiscussionForm` or `EditDiscussionForm`, we use `this.state.memberIds` as an argument and call either `currentTeam.addDiscussion` or `discussion.editDiscussion`.
    
    Each object inside the `suggestions` array has two properties: `label` and `id`. The value of `suggestions` gets passed to the `AutoComplete` component as the `options` prop and the value of `selectedItems` gets passed as the `value` prop:
    
    ```
      import React from 'react';
    
      import Autocomplete from '@material-ui/lab/Autocomplete';
      import TextField from '@material-ui/core/TextField';
    
      import { User } from '../../lib/store/user';
    
      type Props = {
        onChange: (item) => void;
        selectedMemberIds?: string[];
        members: User[];
        label?: string;
        helperText?: string;
      };
    
      type State = {
        selectedItems: { label: string; id: string }[];
      };
    
      class MemberChooser extends React.Component<Props, State> {
        constructor(props) {
          super(props);
    
          const suggestions = this.props.members.map((user) => ({
            label: user.displayName || user.email,
            id: user._id,
          }));
    
          const selectedItems = suggestions.filter(
            (s) => this.props.selectedMemberIds.indexOf(s.id) !== -1,
          );
    
          this.state = {
            selectedItems: selectedItems || [],
          };
        }
    
        public render() {
          const suggestions = this.props.members.map((user) => ({
            label: user.displayName || user.email,
            id: user._id,
          }));
    
          return (
            <Autocomplete
              multiple
              id="tags-standard"
              options={suggestions}
              getOptionLabel={(option) => option.label}
              getOptionSelected={(option, value) => option.id === value.id}
              value={this.state.selectedItems}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Find team member by name"
                  placeholder="Select participants"
                />
              )}
              onChange={this.handleChange}
              filterSelectedOptions={true}
              noOptionsText="No team members to select from"
            />
          );
        }
    
        public handleChange = (event, value) => {
          event.preventDefault();
    
          const selectedItems = value;
    
          this.setState({ selectedItems });
    
          this.props.onChange(selectedItems.map((i) => i.id));
        };
      }
    
      export default MemberChooser;
    ```
    
    Create a new file, `book/8-begin/app/components/common/MemberChooser.tsx`, with the above content.
    

___

#### Testing Discussion API without Post API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-discussion-api-without-post-api)

We are almost done implementing all parts of our Discussion API infrastructure. There are just a few missing parts before we can render the `DiscussionPageComp` page and test out adding, editing, and deleting discussions in our application.

Similar to how we created an Express route for the `TeamSettings` page:

```
server.get('/team/:teamSlug/team-settings', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/team-settings', { teamSlug });
});
```

We need to create a similar Express route that makes `teamSlug` and `discussionSlug` available at the `DiscussionPageComp` page as props. Open `book/8-begin/app/server/server.ts` and under the above Express route, add a new Express route, `/team/:teamSlug/discussions/:discussionSlug`:

```
server.get('/team/:teamSlug/discussions/:discussionSlug', (req, res) => {
  const { teamSlug, discussionSlug } = req.params;
  app.render(req, res, '/discussion', { teamSlug, discussionSlug });
});
```

Now when a end user requests the server-side rendered `DiscussionPageComp` page, this page on the server will have two props, `teamSlug` and `discussionSlug`, with values from the API endpoint `/team/:teamSlug/discussions/:discussionSlug`.

In Chapter 7, when we talked about the `teamSlug` query, we explained why we need such Express route. It's because our application can render pages **on both** server and client.

For server-side rendered pages, we need to tell Next.js to render a page with the file's name, `discussion.tsx`, when a user accesses the route `/team/:teamSlug/discussions/:discussionSlug`. We also need to make sure that `ctx.query.teamSlug` and `ctx.query.discussionSlug` exist and have proper values. We do so by calling:

```
app.render(req, res, '/discussion', { teamSlug, discussionSlug });
```

After that, `App.getInitialProps` can run on the server and use `ctx.query.teamSlug` and `ctx.query.discussionSlug` to populate a page's props.

For client-side rendered pages, the chain of events is different. Since an Express route only runs on the server, we need some other way to populate `ctx.query` with proper properties. We achieve this by constructing a route in the format `?teamSlug=someValue1&discussionSlug=someValue2` and passing to the `href` prop of the `Link` component. Open `book/8-begin/app/components/discussions/DiscussionListItem.tsx` and find this line:

```
href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
```

Inside:

```
<Link
  scroll={false}
  href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
  as={`/team/${team.slug}/discussions/${discussion.slug}`}
>
  <a
    style={{ fontWeight: 300, color: isThemeDark ? '#fff' : '#000' }}
    key={discussion._id}
  >
    {discussion.name.length > trimmingLength
      ? `${discussion.name.substring(0, trimmingLength)}...`
      : discussion.name}
  </a>
</Link>
```

Then `App.getInitialProps` runs on the client and has access to both `ctx.query.teamSlug` and `ctx.query.discussionSlug` and properly populate's props of the client-rendered page.

Speaking of `ctx.query.discussionSlug` - we haven't made all necessary changes to our `App` HOC. If we don't make the below changes, then switching between discussions on the list of discussions will not work, since each switching event involves client-side rendering of the `DiscussionPageComp` page. Open `book/8-begin/app/pages/_app.tsx` and find this block:

```
const { teamSlug } = ctx.query;

const pageProps = { 
  isMobile: isMobile({ req: ctx.req }), 
  firstGridItem, 
  teamRequired, 
  teamSlug,
};
```

Replace it with:

```
const { teamSlug, discussionSlug } = ctx.query;

const pageProps = { 
  isMobile: isMobile({ req: ctx.req }), 
  firstGridItem, 
  teamRequired, 
  teamSlug,
  discussionSlug,
};
```

Find:

```
initialData = await getInitialDataApiMethod({
  request: ctx.req,
  data: { teamSlug },
});
```

Replace it with:

```
initialData = await getInitialDataApiMethod({
  request: ctx.req,
  data: { teamSlug, discussionSlug },
});
```

We are almost ready to test. If you start testing right now, you may find that some properties inside the `Team` data store are `undefined` and some are defined. For example, you will be able to print `this.props.store.currentTeam.memberIds` inside `DiscussionList` but not inside `CreateDiscussionForm`. A bunch of other properties inside `Team` and other data stores will be `undefined`. Why is that?

That's because Next.js uses `babel` to compile code internally. Since babel version 7 and higher, some properties will be undecoratable when using the `decorate` syntax of `mobx`:

[https://github.com/mobxjs/mobx/issues/1471](https://github.com/mobxjs/mobx/issues/1471)

To make sure that all properties of our data stores are decoratable with `decorate`, create a new file, `book/8-begin/app/.babelrc`, with the following content:

```
{
  "presets": [
    [
      "next/babel",
      {
        "class-properties": { "loose": true }
      }
    ]
  ]
}
```

All right, we are ready to test.

Check your `test` database at MongoDB Atlas. Note that there is no `test.discussions` collection yet.

Start both `app` and `api` projects with `yarn dev`.

Next.js web application send this response session static method calls this chapter response page component. Add environmental variable new Express route Remember to add import response response server-side rendering Navigate to show notification check if value is truthy cookie. Triggers method production-ready API infrastructure request triggers method check if value is truthy new Express route end user data model Remember to add import withAuth HOC. Check if value is truthy Material-UI redirect to checkout if truthy then redirect to checkout Put it all together At AWS dashboard if truthy then Material-UI. On the client show notification withAuth HOC end user open this file You already learned if truthy then email and name subsection server-side rendering API method Next.js web application if truthy then show notification cookie. Session redirect to checkout conditional operator on the client store method calls server-side rendering session HTTP triggers method this chapter. Remember to add import AWS dashboard request subsection session response At AWS dashboard AWS dashboard end user. Request session this chapter API infrastructure mount middleware on the client email and name MongoDB database Remember to add import AWS dashboard team members S3 bucket page component API infrastructure if truthy then. In a browser data model send this response redirect to checkout email and name withAuth HOC Put it all together cookie withAuth HOC At AWS dashboard in a browser Remember to add import You already learned store method calls. Team members Next.js web application Next.js web application in a browser open this file MongoDB database redirect to checkout check if value is truthy S3 bucket decorate method with action team members.

Since we have not created a discussion yet, we do not have the value for `discussionSlug`, and we cannot load this route:

```
/team/:teamSlug/discussions/:discussionSlug
```

However, we did write the following logic inside `DiscussionPageComp` at `book/8-begin/app/pages/discussion.tsx`:

```
if (!discussion) {
  if (currentTeam.isLoadingDiscussions) {
    return (
      <Layout {...this.props}>
        <Head>
          <title>Loading...</title>
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>Loading Discussions...</p>
        </div>
      </Layout>
    );
  } else {
    return (
      <Layout {...this.props}>
        <Head>
          <title>No Discussion is found.</title>
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>No Discussion is found.</p>
        </div>
      </Layout>
    );
  }
}
```

And we do want to show the above interface to a end user when this user deletes a discussion and the list of discussions is empty.

To display the above interface, let's create a new Express route and add it to `book/8-begin/app/server/server.ts`:

```
server.get('/team/:teamSlug/discussions', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/discussion', { teamSlug });
});
```

Add the above new Express route under:

```
server.get('/team/:teamSlug/discussions/:discussionSlug', (req, res) => {
  const { teamSlug, discussionSlug } = req.params;
  app.render(req, res, '/discussion', { teamSlug, discussionSlug });
});
```

In your browser, while both `APP` and `API` are running, paste:

```
http://localhost:3000/team/1/discussions
```

The above route assumes your team's slug has value `1`.

You will a get an expected UI from `DiscussionPageComp`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-17+14-04-29.png)

Next, let's create a new discussion. Click the plus icon inside `DiscussionList`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-17+14-46-16.png)

Note how the browser tab's title changed. Tthe modal takes the entire screen, since we set the `fullScreen` prop to `true` for the `Dialog` component inside `CreateDiscussionForm`.

Click the `Cancel` button and note that the title has changed:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-17+14-46-58.png)

This is how we designed the title to change when an end user opens `CreateDiscussionForm`.

Open `CreateDiscussionForm` again. Provide a name, select one participant (this can be the user you invited to your team in Chapter 7) and click the `Create discussion` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-36-44.png)

You will see that `first discussion` appears on the `DiscussionList` without page reload. The component re-rendered reactively because we use `mobx`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-44-26.png)

"List of Posts" is currently a placeholder for a list of posts that we will add later in this chapter when we work on Post API.

The `Nprogress` progress bar has a dark color that will be impossible to see on dark theme. We need a way to change the color of the progress bar depending on the value of theuser's `darkTheme` property. Open `book/8-begin/app/pages/_app.tsx` and find:

```
<link
  rel="stylesheet"
  href="https://storage.googleapis.com/async-await/nprogress-dark.min.css?v=1"
/>
```

Replace it with:

```
<link
  rel="stylesheet"
  href={
    isThemeDark
      ? 'https://storage.googleapis.com/async-await/nprogress-light.min.css?v=1'
      : 'https://storage.googleapis.com/async-await/nprogress-dark.min.css?v=1'
  }
/>
```

Now, find `link` element in `_document.tsx`:

```
<link rel="stylesheet" href="https://storage.googleapis.com/async-await/vs2015.min.css" />
```

Replace it with conditional `link` element that fetches different resource depending on value of `isThemeDark`:

```
<link
  rel="stylesheet"
  href={
    isThemeDark
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/a11y-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/a11y-light.min.css'
  }
/>
```

Right above the `return` statement of the `MyDocument.render` method, add:

```
const isThemeDark = this.props.__NEXT_DATA__.props.initialState.user
  ? this.props.__NEXT_DATA__.props.initialState.user.darkTheme
  : true;
```

Done. Now when you have a `darkTheme` value of `false`, meaning you are using light theme, your progress bar will get styles from `https://storage.googleapis.com/async-await/nprogress-dark.min.css` and will look dark.

Go to your MongoDB Atlas dashboard and navigate to the `test.discussions` collection. There, you should see a newly created MongoDB document that has two strings inside the `memberIds` array field: one for the discussion's creator and one for the selected participant.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+18-23-15.png)

Let's add another discussion with the name `second discussion`. Add the same participant and then test deleting it. Delete it by clicking on the three-dots icon to trigger `DiscussionActionMenu` and then select the `Delete` menu item:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+17-56-14.png)

Click `Ok` on the modal that asks `Are you sure?`. Note a few things:

-   How `Nprogress` progress bar has a dark color:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+18-47-42.png)
    

-   How `second discussion` gets removed from `DiscussionList` reactively
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-18+18-47-46.png)
    

-   How you get redirected to `first discussion`. See above screenshot. This redirect is because of this logic inside the `deleteDiscussion` store method of the `Team` data store (`book/8-begin/app/lib/store/team.ts`):
    
    ```
      if (this.currentDiscussion === discussion) {
        this.currentDiscussion = null;
        this.currentDiscussionSlug = null;
    
        if (this.discussions.length > 0) {
          const d = this.discussions[0];
    
          Router.push(
            `/discussion?teamSlug=${this.slug}&discussionSlug=${d.slug}`,
            `/team/${this.slug}/discussions/${d.slug}`,
          );
        } else {
          Router.push(`/discussion?teamSlug=${this.slug}`, `/team/${this.slug}/discussions`);
        }
      }
    ```
    

We tested creating a new discussion and deleting a discussion. Next, let's test editing a discussion and switching between discussions on `DiscussionList`.

Create a new discussion with the name `second discussion` and then click on the three-dots icon next to it. Then click the `Edit` menu item, like so:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+11-56-07.png)

Then rename the discussion to `2d discussion` and remove the selected participant, in our case the team member with a `displayName` value of `Team Member Async`. Click the `Update Discussion` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+11-58-42.png)

You will see that both the name and list of participants are successfully updated. Now the discussion's creator is the only participant:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+11-58-58.png)

Navigate to your `test.discussions` collection at MongoDB Atlas and confirm that our server-side code indeed worked as we designed:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+12-02-44.png)

Alright, the last test is whether we can switch between discussions on `DiscussionList`.

Load `http://localhost:3000/team/1/discussions/1` in a new tab, and you will see that our application indeed highlights `first discussion` because of the code we wrote in `DiscussionListItem`:

```
const selectedDiscussion =
  store.currentUrl === `/team/${team.slug}/discussions/${discussion.slug}`;
```

We assigned a style that highlights a discussion if `selectedDiscussion` is `true`.

Now click on `2d discussion`. You will see that `DiscussionPageComp` indeed rendered with new content, but `2d discussion`'s `DiscussionListItem` does not get a highlight. Instead, our application still highlights `first discussion`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+12-12-30.png)

Let's print `store.currentUrl` to check if the value does get updated. Add `console.log(store.currentUrl);` to `book/8-begin/app/components/discussions/DiscussionListItem.tsx` under this block:

```
const selectedDiscussion =
  store.currentUrl === `/team/${team.slug}/discussions/${discussion.slug}`;
```

Repeat our test again - load the route `http://localhost:3000/team/1/discussions/1` and then click on `2d discussion`. Watch the browser's console inside `Chrome Dev Tools`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+12-20-56.png)

You can see that the `store.currentUrl` value is `/team/1/discussions/1`. It was printed twice since we have two `DiscussionListItem` components - thus `DiscussionListItem.render` fires twice. But it never changes to `/team/1/discussions/2` when we click on `2d discussion` on the list of discussions.

Why is that?

Because although we defined the store method to update `store.currentUrl`, we never actually called it anywhere in our application! Find the store method `changeCurrentUrl` inside `book/8-begin/app/lib/store/index.ts`

```
public changeCurrentUrl(url: string) {
  this.currentUrl = url;
}
```

We can call `changeCurrentUrl` inside one of Next.js's `Router` events:

[https://nextjs.org/docs/api-reference/next/router#routerevents](https://nextjs.org/docs/api-reference/next/router#routerevents)

The event `routeChangeComplete` executes when our application completes a route change.

Find this event inside `book/8-begin/app/lib/withAuth.tsx`:

```
Router.events.on('routeChangeComplete', () => {
  NProgress.done();
});
```

Change it to become:

```
Router.events.on('routeChangeComplete', (url) => {
  const store = getStore();
  if (store) {
    store.changeCurrentUrl(url);
  }

  NProgress.done();
});
```

Remember to add the `getStore` method to import statements in the same file:

```
import { Store, getStore } from './store';
```

Repeat our test again - load the route `http://localhost:3000/team/1/discussions/1` and then click on `2d discussion`. Watch the browser's console inside `Chrome Dev Tools`

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+12-35-54.png)

`store.currentUrl` gets a new value after we click on `2d discussion` - it becomes `/team/1/discussions/2`! As a result of this, highlighting works as expected.

We are done with our Discussion API! In the next section, we will add a list of posts to `DiscussionPageComp` and work on our Post API infrastructure.

___

## Post API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#post-api)

As we mentioned in the previous section, `DiscussionPageComp` contains a list of posts. End users who are participants of a discussion create posts within that discussion. Each post on this list is a `PostDetail` component, and at the end of this list, we want to display a form for creating a new post, the `PostForm` component.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+17-39-28.png)

Also, `CreateDiscussionForm` will allow an end user to create a very first post using the `PostEditor` component:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-19+17-43-00.png)

We also use `PostEditor` to define `PostForm`, and as we just mentioned, we use `PostForm` at the `DiscussionPageComp` page after the list of posts.

And we use `PostContent` to define both `PostDetail` and `PostEditor`.

Here is a diagram to help you understand the structural hierarchy:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Post-specific+components.png)

So for interface, we need to define four new components:

-   `PostDetail`
-   `PostForm`
-   `PostEditor`
-   `PostContent`

Besides non-page components, we need to update the `DiscussionPageComp` page and build the entire Post API infrastructure that includes:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Post+API.png)

As we did in the previous section, we will start with our `API` project and finish with our `APP` project.

___

#### Model and static methods - Post [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#model-and-static-methods-post)

The Discussion-Post relationship will be very similar to the Team-Discussion relationship. There is a list of discussions within one team and every `Discussion` MongoDB document has a `teamId` field, so our application can fetch a list of discussions per team. Similarly, every discussion has a list of posts and every `Post` MongoDB document will have `discussionId` field, so our application can fetch a list of posts per discussion.

Similar to Discussion, we need to define CRUD (stands for "create, read, update and delete") static methods for a class that extends the Model. These static methods are `getList`, `add`, `edit`, and `delete`. In addition to these four static methods for CRUD, similar to how we have `checkPermissionAndGetTeam` for our `User` and `Discussion` data models, we will have `checkPermissionAndGetTeamAndDiscussion` that does all necessary permission checks and either returns `{ team, discussion }` or throws an error.

Earlier in this chapter, we wrote a blueprint for creating a new data model. We used it to create our `Discussion` data model:

-   defining Schema
-   defining interface for Document
-   defining interface for Model
-   defining static methods for class that extends Model
-   exporting Document
-   defining and exporting Model using Schema with static methods and the above interfaces
-   adding required imports, settings

Let the blueprint guide us through each step:

-   Schema has a `createdUserId` property, which is the user id of the post's creator. It could be the discussion creator as well, or it could be a discussion participant who is not the creator. It also has `content` and `htmlContent`\- both are of `string` type and are required. `content` is the content of the post. It contains raw content that has Markdown syntax and is displayed to the end user when editing. `htmlContent` is html code that the `marked` Markdown compiler outputs after compiling `content`, like so:
    
    ```
      const htmlContent = marked(he.decode(content));
    ```
    
    We display `content` to the end user during editing, and we use `htmlContent` to quickly render a post's content for both server- and client-side rendered pages.
    
    There are two more related properties, `isEdited` and `lastUpdatedAt`. As you may guess from their names, `isEdited` is `true` if the post was edited at least once. If so, on the user interface within `PostDetail`, we plan to diplay the following information:
    
    ```
      {post.isEdited ? (
        <React.Fragment>
          <span style={styleLineSeparator}>|</span>
          Last edited: {lastUpdatedDate}
        </React.Fragment>
      ) : null}
    ```
    
    The value of `post.isEdited` is the same as the value of the `isEdited` field of the corresponding MongoDB document. The value of `lastUpdatedDate` is `moment(post.lastUpdatedAt).fromNow()`, where the value of `post.lastUpdatedAt` is the same as the value of the `lastUpdatedAt` field of the corresponding MongoDB document.
    
    In addition to the above properties, there is one more typical property, `createdAt`.
    
    ```
      const mongoSchema = new mongoose.Schema({
        createdUserId: {
          type: String,
          required: true,
        },
        discussionId: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        htmlContent: {
          type: String,
          required: true,
        },
        isEdited: {
          type: Boolean,
          default: false,
        },
        lastUpdatedAt: Date,
        createdAt: {
          type: Date,
          required: true,
        },
      });
    ```
    
    When an end user loads the `DiscussionPageComp` page, we will show a list of all posts on this page using the `discussionId` property. Below, we will define the static method `getList`, which retrieves and returns a list of all posts for a given discussion.
    
-   interface Document is for defining data types for the properties we specified in Schema:
    
    ```
      interface PostDocument extends mongoose.Document {
        createdUserId: string;
        discussionId: string;
        content: string;
        isEdited: boolean;
        lastUpdatedAt: Date;
        createdAt: Date;
      }
    ```
    
-   interface Model is for defining data types for methods' arguments and return values. We will have five static methods - `getList`, `add`, `edit`, `delete`, and `checkPermissionAndGetTeamAndDiscussion`:
    
    ```
      interface PostModel extends mongoose.Model<PostDocument> {
        getList({
          userId,
          discussionId,
        }: {
          userId: string;
          discussionId: string;
        }): Promise<PostDocument[]>;
    
        add({
          content,
          userId,
          discussionId,
        }: {
          content: string;
          userId: string;
          discussionId: string;
        }): Promise<PostDocument>;
    
        edit({
          content,
          userId,
          id,
        }: {
          content: string;
          userId: string;
          id: string;
        }): Promise<PostDocument>;
    
        delete({ userId, id }: { userId: string; id: string }): Promise<void>;
    
        checkPermissionAndGetTeamAndDiscussion({
          userId,
          discussionId,
          post,
        }: {
          userId: string;
          discussionId: string;
          post: PostDocument;
        }): Promise<{ TeamDocument; DiscussionDocument }>;
      }
    ```
    
    As with previous models, we defined data types for arguments and return values. For return values, the type is `Promise<PostDocument[]>` when a method returns an array of objects, the type is `Promise<PostDocument>` when a method returns one object, and the type is `Promise<void>` when a method has no return statement.
    
-   The static method `getList` uses the Mongoose API method `find` to find and return an array of post objects that have a matching `discussionId` property, sorted by `createdAt`. We also ask the MongoDB server to return JS objects instead of MongoDB documents, which contain metadata and methods that we don't need:
    
    ```
      public static async getList({ userId, discussionId }) {
        await this.checkPermissionAndGetTeamAndDiscussion({ userId, discussionId });
    
        const filter: any = { discussionId };
    
        const posts: any[] = await this.find(filter).sort({ createdAt: 1 }).setOptions({ lean: true });
    
        return posts;
      }
    ```
    
    Before calling `find`, we call `checkPermissionAndGetTeamAndDiscussion` to check all necessary permissions. `Post.checkPermissionAndGetTeamAndDiscussion` is very similar to `Discussion.checkPermissionAndGetTeam`. Both are private methods - they are only accessible and used inside the corresponding Model. `Discussion.checkPermissionAndGetTeam` finds a team document. If the team exists, this method checks if a user is indeed part of the team, then returns the found team object.
    
    In addition, `Post.checkPermissionAndGetTeamAndDiscussion` finds a discussion document. If a discussion exists, this method checks if a user is indeed a participant of the discussion. Plus, the method checks if a user is the creator of a post. If everything checks out, we return an object that contains the found team and discussion objects, `{ team, discussion }`. Thus, the type is `Promise<{ TeamDocument; DiscussionDocument }>`.
    
    `checkPermissionAndGetTeamAndDiscussion` method:
    
    ```
      private static async checkPermissionAndGetTeamAndDiscussion({
        userId,
        discussionId,
        post = null,
      }) {
        if (!userId || !discussionId) {
          throw new Error('Bad data');
        }
    
        if (post && post.createdUserId !== userId) {
          throw new Error('Permission denied');
        }
    
        const discussion = await Discussion.findById(discussionId)
          .select('teamId memberIds slug')
          .setOptions({ lean: true });
    
        if (!discussion) {
          throw new Error('Discussion not found');
        }
    
        if (discussion.memberIds.indexOf(userId) === -1) {
          throw new Error('Permission denied');
        }
    
        const team = await Team.findById(discussion.teamId)
          .select('memberIds slug')
          .setOptions({ lean: true });
    
        if (!team || team.memberIds.indexOf(userId) === -1) {
          throw new Error('Team not found');
        }
    
        return { team, discussion };
      }
    ```
    
-   The static method `add` uses the Mongoose API method `create` to create a new MongoDB document with all necessary fields. `add` also checks if `content` is provided by an end user and calls the `checkPermissionAndGetTeamAndDiscussion` method to check all permissions that we just discussed in the above bullet point. Finally, `add` calls the `markdownToHtml` method to convert `content` to `htmlContent` and uses the output as a value for the `htmlContent` field. If no error is thrown, `add` returns a newly created post document:
    
    ```
      public static async add({ content, userId, discussionId }) {
        if (!content) {
          throw new Error('Bad data');
        }
    
        await this.checkPermissionAndGetTeamAndDiscussion({ userId, discussionId });
    
        const htmlContent = markdownToHtml(content);
    
        const post = await this.create({
          createdUserId: userId,
          discussionId,
          content,
          htmlContent,
          createdAt: new Date(),
        });
    
        return post;
      }
    ```
    
-   The static method `edit` uses the Mongoose API method `findById` to find an existing post document by id. Then it checks all permissions using `checkPermissionAndGetTeamAndDiscussion`. Then it gets the value for `htmlContent`. Then it uses the Mongoose API method `findOneAndUpdate` to update `content` and `htmlContent` fields of the existing post document, sets the `isEdited` field to `true`, and sets a new date for the `lastUpdatedAt` field. If no error is thrown, it returns an updated post document:
    
    ```
      public static async edit({ content, userId, id }) {
        if (!content || !id) {
          throw new Error('Bad data');
        }
    
        const post = await this.findById(id)
          .select('createdUserId discussionId')
          .setOptions({ lean: true });
    
        await this.checkPermissionAndGetTeamAndDiscussion({
          userId,
          discussionId: post.discussionId,
          post,
        });
    
        const htmlContent = markdownToHtml(content);
    
        const updatedObj = await this.findOneAndUpdate(
          { _id: id },
          { content, htmlContent, isEdited: true, lastUpdatedAt: new Date() },
          { runValidators: true, new: true },
        );
    
        return updatedObj;
      }
    ```
    
-   The static method `delete` does the same as `edit` at the beginning - it uses the Mongoose API method `findById` to find an existing discussion and checks permissions by calling the `checkPermissionAndGetTeamAndDiscussion` method. If no error is thrown, it deletes a post document using Mongoose's API method `deleteOne`:
    
    ```
    public static async delete({ userId, id }) {
      if (!id) {
        throw new Error('Bad data');
      }
    
      const post = await this.findById(id)
        .select('createdUserId discussionId content')
        .setOptions({ lean: true });
    
      await this.checkPermissionAndGetTeamAndDiscussion({
        userId,
        discussionId: post.discussionId,
        post,
      });
    
      await this.deleteOne({ _id: id });
    }
    ```
    
-   We also need to call the `loadClass` method to create an ES6 class from which Schema will be created. Schema will inherit all of the above methods:
    
    [https://mongoosejs.com/docs/advanced\_schemas.html](https://mongoosejs.com/docs/advanced_schemas.html)
    
    ```
      mongoSchema.loadClass(PostClass);
    ```
    
-   Let's add `export` in front of `interface PostDocument`.
    
-   Let's define Model using Schema with methods and interfaces:
    
    ```
      const Post = mongoose.model<PostDocument, PostModel>('Post', mongoSchema);
    ```
    
    Export `Post` Model:
    
    ```
      export default Post;
    ```
    
-   Required imports and setting that suppresses warning:
    
    ```
      import * as mongoose from 'mongoose';
    
      import * as he from 'he';
      import * as hljs from 'highlight.js';
      import { marked } from 'marked';
    
      import Discussion from './Discussion';
      import Team from './Team';
    ```
    

We used `const htmlContent = markdownToHtml(content);` in both `add` and `edit` static methods. We mentioned earlier that we do need both `content` and `htmlContent`. Our application uses the former to show an end user when he/she edits a post. The latter is rendered HTML that we use on `DiscussionPageComp`. Typically, `content` contains Markdown syntax, and `htmlContent` contains corresponding HTML code.

The official docs provide us with an example of how to use `marked`:

[https://marked.js.org/#/USING\_ADVANCED.md](https://marked.js.org/#/USING_ADVANCED.md)

```
// Create reference instance
const marked = require('marked');
const hljs = require('highlight.js');

const renderer = new marked.Renderer();

renderer.code = (code, infostring: string) => {
  const [lang] = infostring.split(' | ');

  const language = hljs.getLanguage(lang) ? lang : 'plaintext';

  return `<pre><code class="hljs language-${lang}">${
    hljs.highlight(code, { language }).value
  }</code></pre>`;
};

// Set options
marked.setOptions({
  renderer,
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// Compile
console.log(marked(markdownString));
```

We pretty much follow the above example with two exceptions:

```
function markdownToHtml(content) {
  const renderer = new marked.Renderer();

  renderer.link = (href, title, text) => {
    const t = title ? ` title="${title}"` : '';

    if (text.startsWith('<code>@#')) {
      return `${text.replace('<code>@#', '<code>@')} `;
    }

    return `
      <a target="_blank" href="${href}" rel="noopener noreferrer"${t}>
        ${text}
      </a>
    `;
  };

  renderer.code = (code, infostring: string) => {
    const [lang] = infostring.split(' | ');

    const language = hljs.getLanguage(lang) ? lang : 'plaintext';

    return `<pre><code class="hljs language-${lang}">${
      hljs.highlight(code, { language }).value
    }</code></pre>`;
  };

  marked.setOptions({
    renderer,
    breaks: true,
  });

  return marked(he.decode(content));
}
```

First, we customize how `marked` deals with links. We want to add some styles and an icon at the end of the link. Thus, we make changes to `renderer.link`:

[https://marked.js.org/#/USING\_PRO.md#renderer](https://marked.js.org/#/USING_PRO.md#renderer)

For the following `content`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-21+13-17-09.png)

We want to get the following `htmlContent`. Note the icon at the end of the link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-21+13-17-21.png)

Second, we call the `he.decode` method to convert any HTML entities (for example, and `&`) into their corresponding characters (non-breaking space for and ampersand for `&`).

[https://github.com/mathiasbynens/he#hedecodehtml-options](https://github.com/mathiasbynens/he#hedecodehtml-options)

[https://developer.mozilla.org/en-US/docs/Glossary/Entity](https://developer.mozilla.org/en-US/docs/Glossary/Entity)

Similar to the `marked` example, we use `highlight.js` to highlight code within a post's `htmlContent`. To add styles for highlighting, open `book/8-begin/app/pages/_document.tsx` and add this block:

```
<link
  rel="stylesheet"
  href={
    isThemeDark
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/a11y-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/a11y-light.min.css'
  }
/>
```

Unlike `nprogress` that runs on browser only, we do want proper styles to be added to code content on server-side rendered pages. Thus, let's keep the above `link` element inside `MyDocument` HOC extension and not move it to `MyApp` HOC extension.

We generally prefer hosting css files on AWS or Google, but here we used CDN from Cloudflare.

You can find all available styles here:

[https://github.com/highlightjs/highlight.js/tree/master/src/styles](https://github.com/highlightjs/highlight.js/tree/master/src/styles)

And preview them here:

[https://highlightjs.org/static/demo/](https://highlightjs.org/static/demo/)

You may have asked yourself - why did we choose to run `marked` on the server and not on the browser? In fact, we do use `marked` inside `PostEditor` to show an end user `htmlContent` quickly on the browser when an end user switches between `Markdown` and `HTML` modes for content. We also use `marked` on the browser inside `PostForm` to update the local `htmlContent` property. However, we do not send `htmlContent` to the server with any of the API methods we defined for Post API. We chose to run `marked` on the server, because although `marked` converts Markdown to HTML securely, we, as developers, should not trust `htmlContent` coming from the browser, since it can be tampered with on the browser.

We are ready to put all the above code together. Create a new file, `book/8-begin/api/server/models/Post.ts`, with the following content:

```
import * as mongoose from 'mongoose';

import * as he from 'he';
import hljs from 'highlight.js';
import { marked } from 'marked';

import Discussion from './Discussion';
import Team from './Team';

const mongoSchema = new mongoose.Schema({
  createdUserId: {
    type: String,
    required: true,
  },
  discussionId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  lastUpdatedAt: Date,
  createdAt: {
    type: Date,
    required: true,
  },
});

function markdownToHtml(content) {
  const renderer = new marked.Renderer();

  renderer.link = (href, title, text) => {
    const t = title ? ` title="${title}"` : '';

    if (text.startsWith('<code>@#')) {
      return `${text.replace('<code>@#', '<code>@')} `;
    }

    return `
      <a target="_blank" href="${href}" rel="noopener noreferrer"${t}>
        ${text}
      </a>
    `;
  };

  renderer.code = (code, infostring: string) => {
    const [lang] = infostring.split(' | ');

    const language = hljs.getLanguage(lang) ? lang : 'plaintext';

    return `<pre><code class="hljs language-${lang}">${
      hljs.highlight(code, { language }).value
    }</code></pre>`;
  };

  marked.setOptions({
    renderer,
    breaks: true,
  });

  return marked(he.decode(content));
}

export interface PostDocument extends mongoose.Document {
  createdUserId: string;
  discussionId: string;
  content: string;
  isEdited: boolean;
  lastUpdatedAt: Date;
  createdAt: Date;
}

interface PostModel extends mongoose.Model<PostDocument> {
  getList({
    userId,
    discussionId,
  }: {
    userId: string;
    discussionId: string;
  }): Promise<PostDocument[]>;

  add({
    content,
    userId,
    discussionId,
  }: {
    content: string;
    userId: string;
    discussionId: string;
  }): Promise<PostDocument>;

  edit({
    content,
    userId,
    id,
  }: {
    content: string;
    userId: string;
    id: string;
  }): Promise<PostDocument>;

  delete({ userId, id }: { userId: string; id: string }): Promise<void>;

  checkPermissionAndGetTeamAndDiscussion({
    userId,
    discussionId,
    post,
  }: {
    userId: string;
    discussionId: string;
    post: PostDocument;
  }): Promise<{ TeamDocument; DiscussionDocument }>;
}

class PostClass extends mongoose.Model {
  public static async getList({ userId, discussionId }) {
    await this.checkPermissionAndGetTeamAndDiscussion({ userId, discussionId });

    const filter: any = { discussionId };

    const posts: any[] = await this.find(filter).sort({ createdAt: 1 }).setOptions({ lean: true });

    return posts;
  }

  public static async add({ content, userId, discussionId }) {
    if (!content) {
      throw new Error('Bad data');
    }

    await this.checkPermissionAndGetTeamAndDiscussion({ userId, discussionId });

    const htmlContent = markdownToHtml(content);

    const post = await this.create({
      createdUserId: userId,
      discussionId,
      content,
      htmlContent,
      createdAt: new Date(),
    });

    return post;
  }

  public static async edit({ content, userId, id }) {
    if (!content || !id) {
      throw new Error('Bad data');
    }

    const post = await this.findById(id)
      .select('createdUserId discussionId')
      .setOptions({ lean: true });

    await this.checkPermissionAndGetTeamAndDiscussion({
      userId,
      discussionId: post.discussionId,
      post,
    });

    const htmlContent = markdownToHtml(content);

    const updatedObj = await this.findOneAndUpdate(
      { _id: id },
      { content, htmlContent, isEdited: true, lastUpdatedAt: new Date() },
      { runValidators: true, new: true },
    );

    return updatedObj;
  }

  public static async delete({ userId, id }) {
    if (!id) {
      throw new Error('Bad data');
    }

    const post = await this.findById(id)
      .select('createdUserId discussionId content')
      .setOptions({ lean: true });

    await this.checkPermissionAndGetTeamAndDiscussion({
      userId,
      discussionId: post.discussionId,
      post,
    });

    await this.deleteOne({ _id: id });
  }

  private static async checkPermissionAndGetTeamAndDiscussion({
    userId,
    discussionId,
    post = null,
  }) {
    if (!userId || !discussionId) {
      throw new Error('Bad data');
    }

    if (post && post.createdUserId !== userId) {
      throw new Error('Permission denied');
    }

    const discussion = await Discussion.findById(discussionId)
      .select('teamId memberIds slug')
      .setOptions({ lean: true });

    if (!discussion) {
      throw new Error('Discussion not found');
    }

    if (discussion.memberIds.indexOf(userId) === -1) {
      throw new Error('Permission denied');
    }

    const team = await Team.findById(discussion.teamId)
      .select('memberIds slug')
      .setOptions({ lean: true });

    if (!team || team.memberIds.indexOf(userId) === -1) {
      throw new Error('Team not found');
    }

    return { team, discussion };
  }
}

mongoSchema.loadClass(PostClass);

const Post = mongoose.model<PostDocument, PostModel>('Post', mongoSchema);

export default Post;
```

#### Express routes - Post [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-post)

Since any team member who is a discussion's participant can CRUD posts, we will add new Express routes to our `book/8-begin/api/server/api/team-member.ts` file. These Express routes are not public and not exclusive to a Team Leader.

On the client request Next.js web application Navigate to add environmental variable. Navigate to this chapter At AWS dashboard request Google OAuth API new Express route At AWS dashboard new Express route store method calls this chapter if truthy then Material-UI show notification in a browser. Material-UI subsection it works as expected API method calls corresponding store method request was sent if truthy then At AWS dashboard mount middleware email and name response Google OAuth API Material-UI You already learned send this response show notification. Click on the button redirect to checkout Navigate to API method withAuth HOC send this response if truthy then response. New Express route check if value is truthy We will discuss production-ready compiles triggers method subsection response Team Leader if truthy then team members Click on the button Navigate to Team Leader Put it all together. Request email and name on the client You already learned page component end user. At AWS dashboard on the client send this response Material-UI on server only server-side rendering HTTP Navigate to subsection conditional operator subsection new Express route Click on the button page component. Discussion add environmental variable production-ready Remember to add import withAuth HOC team members add environmental variable HTTP request. Add environmental variable in this book You already learned request was sent in this book static method calls server-side rendering data model. HTTP server-side rendering AWS dashboard static method calls We will discuss request in a browser request was sent.

The Express route `/posts/list` will accept a request with `GET`, the rest of the Express routes will accept with `POST`.

The Express route `/posts/list` gets data from `req.query`, calls the static method `getList` of our `Post` model, and sends an array of posts with its response.

The Express route `/posts/add` gets data from `req.body`, calls `Post.add`, and sends an object that corresponds to a newly created post document.

The Express route `/posts/edit` gets data from `req.body`, calls `Post.edit`, and sends `{ done: 1}`, since we don't need an updated post object inside the response.

The Express route `/posts/delete` gets data from `req.body`, calls `Post.delete`, and sends `{ done: 1}`, since we don't need a deleted post object inside the response.

Open `book/8-begin/api/server/api/team-member.ts` and add four new Express routes:

```
router.get('/posts/list', async (req: any, res, next) => {
  try {
    const posts = await Post.getList({
      userId: req.user.id,
      discussionId: req.query.discussionId as string,
    });

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/add', async (req: any, res, next) => {
  try {
    const { content, discussionId } = req.body;

    const post = await Post.add({ userId: req.user.id, content, discussionId });

    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/edit', async (req: any, res, next) => {
  try {
    const { content, id } = req.body;

    await Post.edit({ userId: req.user.id, content, id });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/delete', async (req: any, res, next) => {
  try {
    const { id, discussionId } = req.body;

    await Post.delete({ userId: req.user.id, id });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});
```

In the same file, find and check the `loadDiscussionsData` method:

```
async function loadDiscussionsData(team, userId, body) {
  const { discussionSlug } = body;

  if (!discussionSlug) {
    return [];
  }

  const { discussions } = await Discussion.getList({
    userId,
    teamId: team._id,
  });

  for (const discussion of discussions) {
    if (discussion.slug === discussionSlug) {
      Object.assign(discussion, {
        initialPosts: await Post.getList({
          userId,
          discussionId: discussion._id,
        }),
      });

      break;
    }
  }

  return discussions;
}
```

That means we already added `initialPosts` to data returned by the Express route `/get-initial-data`. Since we have defined `Post.getList`, we can use the value of `initialPosts` as an argument in the store method `setInitialPosts`, in order to populate the `discussion.posts` property of the `Discussion` data store.

#### API methods - Post [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-methods-post)

We are done with our `API` project for now. Let's work on our `APP` project.

Adding four new API methods is straightforward. We know one of them sends a request with the method `GET`, and the rest send a request with the method `POST`. The request with `GET` sends data with a query that is part of an API endpoint, and the rest of the API methods send data with a request's body.

Open `book/8-begin/app/lib/api/team-member.ts` and add four new API methods:

```
export const getPostListApiMethod = (discussionId: string) =>
  sendRequestAndGetResponse(`${BASE_PATH}/posts/list`, {
    method: 'GET',
    qs: { discussionId },
  });

export const addPostApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/posts/add`, {
    body: JSON.stringify(data),
  });

export const editPostApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/posts/edit`, {
    body: JSON.stringify(data),
  });

export const deletePostApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/posts/delete`, {
    body: JSON.stringify(data),
  });
```

We will use the above four API methods when we define store methods for both `Post` and `Discussion` data stores.

___

#### Data store and store methods - Post [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#data-store-and-store-methods-post)

As we mentioned at the beginning of this section, there are multiple API infrastructure similarities between Team-Discussion and Discussion-Post relationships. We used some of these similarities when we defined our `Post` data model and its static methods. In this subsection, we will define our `Post` data store and update our `Discussion` data store. We defined the `editDiscussion` store method inside the `Discussion` data store, and we defined `addDiscussion`, `deleteDiscussion`, and `loadDiscussions` inside the `Team` data store. We chose this placement because `editDiscussion` does not require us to update the array of discussions within a team, but `addDiscussion`, `deleteDiscussion`, and `loadDiscussions` do. Thus, we put the latter group into the `Team` data store, since this is where we defined the property `team.discussions`. For the same reasons, we will define `editPost` inside the `Post` data store and `addPost`, `deletePost`, and `loadPosts` inside the `Discussion` data store.

Here a blueprint for defining a new data store. We came up with this blueprint when working on the `Discussion` data store:

```
// imports

class Post {
  // data type definition for properties

  constructor(params) {
    // assigning initial value to properties
  }

  // class's public methods
}

decorate(Post, {
  // observables, actions, computed
});

export { Post };
```

-   **imports**. Here we import the `editPostApiMethod` API method, all required data stores, and mobx-related utilities:
    
    ```
      import { action, computed, decorate, observable, runInAction } from 'mobx';
    
      import { editPostApiMethod } from '../api/team-member';
    
      import { Store } from './index';
      import { User } from './user';
      import { Discussion } from './discussion';
    ```
    
-   **data type definition for properties** are pretty much the same as Schema properties, plus main store and `Discussion` data store
    
    ```
      public _id: string;
      public createdUserId: string;
      public createdAt: Date;
      public discussionId: string;
    
      public discussion: Discussion;
      public store: Store;
    
      public content: string;
      public htmlContent: string;
    
      public isEdited: boolean;
      public lastUpdatedAt: Date;
    ```
    
-   **assigning initial value to properties** follows the same pattern as all other data stores. We take property from initial data and assign it to an instance of class, which is the `Post` data store object:
    
    ```
      this._id = params._id;
      this.createdUserId = params.createdUserId;
      this.createdAt = params.createdAt;
      this.discussionId = params.discussionId;
    
      this.content = params.content;
      this.htmlContent = params.htmlContent;
    
      this.discussion = params.discussion;
      this.store = params.store;
    
      this.isEdited = params.isEdited;
      this.lastUpdatedAt = params.lastUpdatedAt;
    ```
    
-   **class's public methods**. Here we define `editPost`, the utility method `changeLocalCache` (which `editPost` calls to update local data), and the `computed` property `user`. We will use `post.user` later in thos section when we define the `PostDetail` component. We can simply define the store method `editPost` if we look at the `editDiscussion` store method of the `Discussion` data store at `book/8-begin/app/lib/store/discussion.ts`:
    
    ```
      public async editDiscussion(data) {
        try {
          await editDiscussionApiMethod({
            id: this._id,
            ...data,
          });
    
          runInAction(() => {
            this.changeLocalCache(data);
          });
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
    ```
    
    `editPost` calls `editPostApiMethod` instead of `editDiscussionApiMethod`, but the rest of the definition is practically the same:
    
    ```
      public async editPost(data) {
        try {
          await editPostApiMethod({
            id: this._id,
            content: data.content,
          });
    
          runInAction(() => {
            this.changeLocalCache(data);
          });
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
    ```
    
    Inside `changeLocalCache`, we update four properties:
    
    ```
      public changeLocalCache(data) {
        this.content = data.content;
        this.htmlContent = data.htmlContent;
        this.isEdited = true;
        this.lastUpdatedAt = data.lastUpdatedAt;
      }
    ```
    
    The `computed` property `user` returns a user object that corresponds to a post's creator:
    
    ```
      get user(): User {
        return this.discussion.team.members.get(this.createdUserId) || null;
      }
    ```
    
-   **observables, actions, computed**. This section is straightforward. You already know the difference between `observable`, `computed`, and `action` from building previous data stores:
    
    ```
      content: observable,
      htmlContent: observable,
      isEdited: observable,
      lastUpdatedAt: observable,
    
      editPost: action,
      changeLocalCache: action,
    
      user: computed,
    ```
    

Put it all together in a new file, `book/8-begin/app/lib/store/post.ts`:

```
import { action, computed, decorate, observable, runInAction } from 'mobx';

import { editPostApiMethod } from '../api/team-member';

import { Store } from './index';
import { User } from './user';
import { Discussion } from './discussion';

export class Post {
  public _id: string;
  public createdUserId: string;
  public createdAt: Date;
  public discussionId: string;

  public discussion: Discussion;
  public store: Store;

  public content: string;
  public htmlContent: string;

  public isEdited: boolean;
  public lastUpdatedAt: Date;

  constructor(params) {
    this._id = params._id;
    this.createdUserId = params.createdUserId;
    this.createdAt = params.createdAt;
    this.discussionId = params.discussionId;


    this.content = params.content;
    this.htmlContent = params.htmlContent;

    this.discussion = params.discussion;
    this.store = params.store;

    this.isEdited = params.isEdited;
    this.lastUpdatedAt = params.lastUpdatedAt;
  }

  public async editPost(data) {
    try {
      await editPostApiMethod({
        id: this._id,
        content: data.content,
      });

      runInAction(() => {
        this.changeLocalCache(data);
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public changeLocalCache(data) {
    this.content = data.content;
    this.htmlContent = data.htmlContent;
    this.isEdited = true;
    this.lastUpdatedAt = data.lastUpdatedAt;
  }

  get user(): User {
    return this.discussion.team.members.get(this.createdUserId) || null;
  }
}

decorate(Post, {
  content: observable,
  htmlContent: observable,
  isEdited: observable,
  lastUpdatedAt: observable,

  editPost: action,
  changeLocalCache: action,

  user: computed,
});
```

The next step is to update the `Discussion` data store and add new store methods to it. The Discussion-Post relationship mirrors the Team-Discussion relationship when it comes to defining store properties and methods.

-   Inside the `Team` data store (`book/8-begin/app/lib/store/team.ts`), we set this logic for populating `team.discussions`:
    
    ```
      if (params.initialDiscussions) {
        this.setInitialDiscussions(params.initialDiscussions);
      } else {
        this.loadDiscussions();
      }
    ```
    
    Let's add similar logic to the `Discussion` data store (`book/8-begin/app/lib/store/discussion.ts`). Add it at the end of the `Discussion.constructor` method:
    
    ```
      if (params.initialPosts) {
        this.setInitialPosts(params.initialPosts);
      } else {
        this.loadPosts();
      }
    ```
    
-   We defined `setInitialDiscussions` and `loadDiscussions` inside the `Team` data store. Let's define `setInitialPosts` and `loadPosts` inside the `Discussion` data store.
    
    Here is what we wrote inside `setInitialDiscussions`:
    
    ```
      public setInitialDiscussions(discussions) {
        const discussionObjs = discussions.map(
          (d) => new Discussion({ team: this, store: this.store, ...d }),
        );
    
        this.discussions.replace(discussionObjs);
    
        if (!this.currentDiscussionSlug && this.discussions.length > 0) {
          this.currentDiscussionSlug = this.orderedDiscussions[0].slug;
        }
      }
    
      public async loadDiscussions() {
        if (this.store.isServer || this.isLoadingDiscussions) {
          return;
        }
    
        this.isLoadingDiscussions = true;
    
        try {
          const { discussions = [] } = await getDiscussionListApiMethod({
            teamId: this._id,
          });
          const newList: Discussion[] = [];
    
          runInAction(() => {
            discussions.forEach((d) => {
              const disObj = this.discussions.find((obj) => obj._id === d._id);
              if (disObj) {
                disObj.changeLocalCache(d);
                newList.push(disObj);
              } else {
                newList.push(new Discussion({ team: this, store: this.store, ...d }));
              }
            });
    
            this.discussions.replace(newList);
          });
        } finally {
          runInAction(() => {
            this.isLoadingDiscussions = false;
          });
        }
      }
    
      public changeLocalCache(data) {
        this.name = data.name;
        this.memberIds.replace(data.memberIds || []);
      }
    ```
    
    `setInitialPosts` is simpler than `setInitialDiscussions`, since posts are oredered by creation date and ordering is done on the server. `loadPosts` is very similar to `loadDiscussions`, only a few changes to note. `loadPosts` calls the `getPostListApiMethod` instead of `getDiscussionListApiMethod`. Also, we have `discussion` and `store` properties inside the `Post` data store instead of `team` and `store`:
    
    ```
      public setInitialPosts(posts) {
        const postObjs = posts.map((t) => new Post({ discussion: this, store: this.store, ...t }));
        this.posts.replace(postObjs);
      }
    
      public async loadPosts() {
        if (this.store.isServer || this.isLoadingPosts) {
          return;
        }
    
        this.isLoadingPosts = true;
    
        try {
          const { posts = [] } = await getPostListApiMethod(this._id);
    
          runInAction(() => {
            const postObjs = posts.map((t) => new Post({ discussion: this, store: this.store, ...t }));
            this.posts.replace(postObjs);
          });
        } finally {
          runInAction(() => {
            this.isLoadingPosts = false;
          });
        }
      }
    ```
    
-   Similar to how we added `addDiscussion`, `addDiscussionToLocalCache`, and `deleteDiscussion` to the `Team` data store, we will add `addPost`, `addPostToLocalCache`, and `deletePost` to the `Discussion` data store.
    
    `addPost` calls `addPostApiMethod`. If successful, it then calls `addPostToLocalCache` to update local data:
    
    ```
      public async addPost(content: string): Promise<Post> {
        const { post } = await addPostApiMethod({
          discussionId: this._id,
          content,
        });
    
        return new Promise<Post>((resolve) => {
          runInAction(() => {
            const obj = this.addPostToLocalCache(post);
            resolve(obj);
          });
        });
      }
    ```
    
    `addPostToLocalCache`, similar to `addDiscussionToLocalCache`, creates an instance of class, which is the `Post` data store object. It uses JavaScript's array method `push`:
    
    ```
      public addPostToLocalCache(data) {
        const postObj = new Post({ discussion: this, store: this.store, ...data });
    
        this.posts.push(postObj);
    
        return postObj;
      }
    ```
    
    `deletePost`, similar to `deleteDiscussion`, calls the corresponding API method and then uses `mobx`'s method `remove` to replace one item within an array of items:
    
    [https://mobx.js.org/refguide/array.html](https://mobx.js.org/refguide/array.html)
    
    ```
      public async deletePost(post: Post) {
        await deletePostApiMethod({
          id: post._id,
          discussionId: this._id,
        });
    
        runInAction(() => {
          this.posts.remove(post);
        });
      }
    ```
    

-   Let's update the imports section, so it contains what we used but did not import:
    
    ```
      import { action, decorate, IObservableArray, observable, runInAction, computed } from 'mobx';
      import NProgress from 'nprogress';
    
      import {
        addPostApiMethod,
        deletePostApiMethod,
        editDiscussionApiMethod,
        getPostListApiMethod,
      } from '../api/team-member';
      import { Store } from './index';
      import { Team } from './team';
      import { Post } from './post';
    ```
    

-   Let's update the `decorate` section, so it reflects observables and actions that we just added:
    
    ```
      decorate(Discussion, {
        name: observable,
        slug: observable,
        memberIds: observable,
        posts: observable,
        isLoadingPosts: observable,
    
        editDiscussion: action,
        changeLocalCache: action,
    
        setInitialPosts: action,
        loadPosts: action,
        addPost: action,
        addPostToLocalCache: action,
        deletePost: action,
    
        members: computed,
      });
    ```
    

Add all of the above changes `book/8-begin/app/lib/store/discussion.ts` and save it.

___

#### Updating DiscussionPageComp page and CreateDiscussionForm [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-discussionpagecomp-page-and-creatediscussionform)

When working on our Discussion API, we created the `DiscussionPageComp` page and the `CreateDiscussionForm` component. Inside them, we left placeholders:

-   in `DiscussionPageComp`, we left `<p>List of Posts</p>`
-   in `CreateDiscussionForm`, we left `<p>PostEditor component goes here</p>`

It makes more sense to add actual Post-specific components to `DiscussionPageComp` and `CreateDiscussionForm` before we define these Post-specific components. This is because we want to understand which props we pass down to these new components and what logic is used to show/hide the components. Once we know, building Post-specific components will be much easier.

Here is an overview of the placement of Post-specific components:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Post-specific+components.png)

Let's start with our `DiscussionPageComp` page component. Open `book/8-begin/app/pages/discussion.tsx` and find:

```
<p>List of Posts</p>
```

Replace it with:

```
{this.renderPosts()}
{discussion && !discussion.isLoadingPosts ? (
  <React.Fragment>
    {selectedPost ? null : (
      <PostForm
        post={null}
        discussion={discussion}
        members={discussion.members}
        isMobile={this.props.isMobile}
        store={store}
      />
    )}
  </React.Fragment>
) : null}
```

The above `PostForm` that is under the list of posts:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+10-25-54.png)

When we go into the details of constructiong `PostForm`, you will learn that the same `PostForm` component will be used for three different experiences - adding a new post, editing a selected post, and displaying Markdown of a selected post.

Note that if `discussion` is `null` or `undefined`, then we don't show this `PostForm`. Also note that if `this.state.selectedPost` is not `null` or `undefined`, then our application hides this `PostForm`, which is used for adding a new post. This is because inside the `renderPosts` method, we will add another `PostForm` component that is used for editing a selected post or showing Markdown of a selected post - this additional `PostForm` will be revealed if `this.state.selectedPost` is not `null` or `undefined`.

Please remember to add `state` to `DiscussionPageComp`. Since we've built multiple pages and blueprints at this point, we trust that you will addt the following snippets of code in right locations:

```
type State = {
  selectedPost: Post;
  showMarkdownClicked: boolean;
};
```

```
constructor(props) {
  super(props);

  this.state = {
    selectedPost: null,
    showMarkdownClicked: false,
  };
}
```

```
const { selectedPost } = this.state;
```

`renderPosts` returns either `PostForm` or `PostDetail`, depending on whether `selectedPost` is truthy or falsy (`null`/`undefined` or not). So if `selectedPost` has a value of `null`, then our application shows `PostDetail` to an end user:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+10-43-47.png)

But if we click on the post's menu and select `Edit`, we set the `selectedPost` value with a `post` object and our application shows `PostForm`. In this case, `PostForm` is for editing a selected post. The outcome will depend on the value of the boolean parameter `showMarkdownClicked`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+10-44-49.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+10-48-02.png)

`renderPosts` based on the above description:

```
public renderPosts() {
  const { isServer, store, isMobile } = this.props;
  const { selectedPost, showMarkdownClicked } = this.state;
  const discussion = this.getDiscussion(this.props.discussionSlug);

  if (!discussion.isLoadingPosts && discussion.posts.length === 0) {
    return <p>Empty Discussion.</p>;
  }

  let loading = 'loading Posts ...';
  if (discussion.posts.length > 0) {
    loading = 'checking for newer Posts ...';
  }

  return (
    <React.Fragment>
      {discussion
        ? discussion.posts.map((p) =>
            selectedPost && selectedPost._id === p._id ? (
              <PostForm
                store={store}
                isMobile={isMobile}
                key={p._id}
                post={p}
                showMarkdownToNonCreator={showMarkdownClicked}
                discussion={discussion}
                members={discussion.members}
                onFinished={() => {
                  this.setState({
                    selectedPost: null,
                    showMarkdownClicked: false,
                  });
                }}
              />
            ) : (
              <PostDetail
                key={p._id}
                post={p}
                onEditClick={this.onEditClickCallback}
                onShowMarkdownClick={this.onSnowMarkdownClickCallback}
                isMobile={this.props.isMobile}
                store={store}
              />
            ),
          )
        : null}

      {discussion && discussion.isLoadingPosts && !isServer ? <p>${loading}</p> : null}
    </React.Fragment>
  );
}
```

Inside the `PostDetail` component `onEditClickCallback`, when an end user clicks the `Edit` menu item for a post, we will call:

```
this.props.onEditClick(post)
```

`onEditClick={this.onEditClickCallback}` will trigger `onEditClickCallback` and set `selectedPost: post` inside the `state` object of the `DiscussionPageComp` page. This will re-render the UI to display `PostForm` for editing a selected post, hide `PostDetail`, and hide `PostForm` for adding a new post.

```
public onEditClickCallback = (post) => {
  this.setState({ selectedPost: post, showMarkdownClicked: false });
};
```

In a browser withAuth HOC new Express route discussion show notification team members on server only decorate method with action session send this response Navigate to end user redirect to checkout end user. Put it all together API method calls corresponding store method on server only Google OAuth API store method calls API infrastructure in production API method. In production You already learned on server only conditional operator withAuth HOC add environmental variable compiles on the client API method calls corresponding store method HTTP in a browser. API method Put it all together team members AWS dashboard MongoDB database API method calls corresponding store method subsection discussion send this response in this book new Express route if truthy then on server only session. Subsection email and name request was sent AWS dashboard in production compiles subsection request. Remember to add import API method session conditional operator subsection At AWS dashboard. In a browser Team Leader data model Google OAuth API redirect to checkout this chapter send this response API method calls corresponding store method. Data model send this response decorate method with action AWS dashboard in production session Remember to add import check if value is truthy You already learned. Add environmental variable in a browser data model Navigate to server-side rendering API method calls corresponding store method new Express route API method calls corresponding store method decorate method with action. Open this file We will discuss mount middleware on server only Navigate to in production We will discuss.

The method `onSnowMarkdownClickCallback` is pretty much the same as `onEditClickCallback` - when an end user clicks the `Show Markdown` menu item for a post, our application calls:

```
if (onShowMarkdownClick) {
  onShowMarkdownClick(post);
}
```

Because of `onShowMarkdownClick={this.onSnowMarkdownClickCallback}`, `onSnowMarkdownClickCallback` gets executed:

```
public onSnowMarkdownClickCallback = (post) => {
  this.setState({ selectedPost: post, showMarkdownClicked: true });
};
```

In this case of editing a selected post, since `showMarkdownClicked` is now `true` instead of `false`, the UI re-renders and displays `PostForm` for showing Markdown, hides `PostDetail`, and hides `PostForm` for adding a new post. The value of `showMarkdownClicked` is passed down from the page to `PostForm` as a `showMarkdownToNonCreator` prop and will be used there to display the proper UI.

Add the three new methods above (`renderPosts`, `onEditClickCallback`,`onSnowMarkdownClickCallback`) under the component's `getDiscussion` method.

Remember to import missing components:

```
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import Head from 'next/head';
import Router from 'next/router';
import * as React from 'react';

import { observer } from 'mobx-react';

import Layout from '../components/layout';
import PostDetail from '../components/posts/PostDetail';
import PostForm from '../components/posts/PostForm';
import { Store } from '../lib/store';
import { Discussion } from '../lib/store/discussion';
import withAuth from '../lib/withAuth';
import { Post } from 'lib/store/post';
```

Since we didn't define `PostDetail` and `PostForm` yet, you can ignore warnings from your code editor.

Next, let's modify the `CreateDiscussionForm`. Open `book/8-begin/app/components/discussions/CreateDiscussionForm.tsx` and find:

```
<p>PostEditor component goes here</p>
```

Replace it with:

```
<PostEditor
    content={this.state.content}
    onChanged={this.onContentChanged}
    members={Array.from(store.currentTeam.members.values())}
    store={store}
    parentComponent="CDF"
/>
```

Remember to add `content` to the `state` object:

```
type State = {
  name: string;
  memberIds: string[];
  disabled: boolean;
  content: string;
};
```

```
constructor(props) {
  super(props);

  this.state = {
    name: '',
    memberIds: [],
    disabled: false,
    content: '',
  };
}
```

Remember to import `PostEditor`:

```
import PostEditor from '../posts/PostEditor';
```

We haven't defined `PostEditor` yet, so ignore warnings for now.

When an end user creates a new discussion, the form to create this new discussion will contain `PostEditor`. That way, the user creates a new discussion and its first post at the same time.

#### Post-specific components [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#post-specific-components)

We are almost done with implementing Post API. There are few tasks remaining:

-   Define `PostDetail`, `PostForm`, `PostEditor`, `PostContent`
-   Update `DiscussionPageComp` and `CreateDiscussionForm`
-   Test Post API

As we showed earlier in this section, here is the relationship between all four Post-specific components and where we use them inside our application:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Post-specific+components.png)

As you see from the above diagram, our application uses the `PostDetail` component to display a post on the `DiscussionPageComp`. For each post, there is one `PostDetail` and one `PostForm` to edit the post, plus there is one more `PostForm` to add a new post. We'll discuss updates to `DiscussionPageComp` in more detail later in this section.

When we worked on `CreateDiscussionForm` in the previous section, Discussion API, we came up with a blueprint for non-page component in our application. For `PostDetail`, the blueprint will look like this:

```
// imports

// type Props = ...

// type State = ...

class PostDetail extends React.Component<Props, State> {
  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      // interface code for component
    );
  }

  // component's public methods

  // component's private methods
}

export default SomeHOCs(PostDetail);
```

Implementing `PostDetail` is straightforward, since you already know about all elements and components that `PostDetail` contains:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-22+11-59-21.png)

You probably noticed the `Paper` component that we used when building `DiscussionListItem`, as well as the `Avatar` component that we used inside the `Layout` HOC. You may even recognize the three-dots icon from `MenuWithMenuItems` that we used inside `DiscussionActionMenu`.

-   **imports**. In a real life situation, you would build this section gradually. Here, we provide the entire section, so we can focus on tasks that are more challenging:
    
    ```
      import Avatar from '@material-ui/core/Avatar';
      import Paper from '@material-ui/core/Paper';
      import Tooltip from '@material-ui/core/Tooltip';
      import { observer } from 'mobx-react';
      import moment from 'moment';
      import React from 'react';
    
      import confirm from '../../lib/confirm';
      import notify from '../../lib/notify';
      import { Store } from '../../lib/store';
      import { Post } from '../../lib/store/post';
      import { User } from '../../lib/store/user';
    
      import MenuWithMenuItems from '../common/MenuWithMenuItems';
    
      import PostContent from './PostContent';
    ```
    
-   **type Props = ...**. From `DiscussionPageComp`, we need to pass the `post` prop, so we can display all post-associated information inside `PostDetail`. We also need to pass `store`, so we can access `store.currentUser`, which we will use to show different menus to a post's creator and a discussion's participant. We also show mobile browser specific styles using `isMobile`. We will discuss `onEditClick` and `onShowMarkdownClick` props later in this subsection.
    
    ```
      type Props = {
        post: Post;
        store: Store;
        isMobile: boolean;
        onEditClick: (post) => void;
        onShowMarkdownClick: (post) => void;
      };
    ```
    
-   We don't define `state` and don't modify the page's title in `PostDetail`
    
-   **access some values from props or state**:
    
    ```
      const { post, isMobile } = this.props;
    ```
    
-   **interface code for component**:
    
    ```
      <Paper style={stylePaper}>{this.renderPostDetail(post, isMobile)}</Paper>
    ```
    
    The `renderPostDetail` method returns user interface that directly contains `Avatar`, `span`, and `PostContent` and indirectly contains `MenuWithMenuItems` via the `renderMenu` method:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-22+11-59-21.png)
    
    ```
      public renderPostDetail(post: Post, isMobile) {
        const createdDate = moment(post.createdAt)
          .local()
          .format('MMM Do YYYY');
        const lastUpdatedDate = moment(post.lastUpdatedAt).fromNow();
    
        return (
          <React.Fragment>
            <div
              style={{
                float: 'left',
                margin: '-12px 10px 0px -15px',
                zIndex: 1000,
              }}
            >
              {this.renderMenu()}
            </div>
            <div id={`post-${post._id}`}>
              {post.user && (
                <Tooltip
                  title={post.user.displayName}
                  placement="top"
                  disableFocusListener
                  disableTouchListener
                >
                  <Avatar
                    src={post.user.avatarUrl}
                    alt={post.user.displayName}
                    style={{
                      width: '40px',
                      height: '40px',
                      margin: '0px 10px 0px 5px',
                      cursor: 'pointer',
                      float: 'left',
                    }}
                  />
                </Tooltip>
              )}
              <div
                style={{
                  margin: isMobile ? '0px' : '0px 20px 0px 70px',
                  fontWeight: 300,
                  lineHeight: '1em',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 400 }}>
                  {`By: ${post.user && post.user.displayName}` || 'User'}
                  <span style={styleLineSeparator}>|</span>
                  {`Created: ${post.createdAt && createdDate}` || ''}
    
                  {post.isEdited ? (
                    <React.Fragment>
                      <span style={styleLineSeparator}>|</span>
                      Last edited: {lastUpdatedDate}
                    </React.Fragment>
                  ) : null}
                </span>
    
                <PostContent html={post.htmlContent} />
              </div>
            </div>
          </React.Fragment>
        );
      }
    ```
    
    `PostContent` gets the value of `post.htmlContent` via the `html` prop.
    
    We are yet to define `stylePaper` for the `Paper` component and `styleLineSeparator` for the `span` element.
    
    Since we used `renderMenu`, let's define it next. `renderMenu` uses `MenuWithMenuItems` that you already used inside `DiscussionActionMenu`:
    
    ```
      public renderMenu() {
        const { post, store } = this.props;
        const { currentUser } = store;
    
        if (!post.user || !currentUser) {
          return null;
        }
    
        return (
          <MenuWithMenuItems
            menuOptions={getMenuOptions(post)}
            itemOptions={getMenuItemOptions(post, store.currentUser, this)}
          />
        );
      }
    ```
    
    Inside `DiscussionActionMenu`, we defined `menuOptions` and `itemOptions` like this:
    
    ```
      const getMenuOptions = (discussion) => ({
        dataId: discussion._id,
        id: `discussion-menu-${discussion._id}`,
      });
    
      const getMenuItemOptionsForCreator = (discussion, component) => [
        {
          text: 'Copy URL',
          dataId: discussion._id,
          onClick: component.handleCopyUrl,
        },
        {
          text: 'Edit',
          dataId: discussion._id,
          onClick: component.editDiscussion,
        },
        {
          text: 'Delete',
          dataId: discussion._id,
          onClick: component.deleteDiscussion,
        },
      ];
    
      const getMenuItemOptions = (discussion, component) => [
        {
          text: 'Copy URL',
          dataId: discussion._id,
          onClick: component.handleCopyUrl,
        },
      ];
    ```
    
    In `renderMenu`, we want to show two menu items - `Edit` and `Delete` - if the end user who accessed the menu is the post's creator. If the end user is not the post's creator, we only show one menu item - `Show Markdown`. That way, the post's creator can manage the post, and a discussion participant who is not the post's creator can see/borrow the `content` (Markdown), for example, to cite a post's creator.
    
    `getMenuOptions` and `getMenuItemOptions` for `MenuWithMenuItems` inside `renderMenu`:
    
    ```
      const getMenuOptions = (post) => ({
        dataId: post._id,
        id: `post-menu-${post._id}`,
      });
    
      const getMenuItemOptions = (post: Post, currentUser: User, component) => {
        const items = [];
    
        if (post.createdUserId !== currentUser._id) {
          items.push({
            text: 'Show Markdown',
            dataId: post._id,
            onClick: component.showMarkdown,
          });
        }
    
        if (post.createdUserId === currentUser._id) {
          const isFirstPost = post.discussion.posts.indexOf(post) === 0;
    
          items.push({
            text: 'Edit',
            dataId: post._id,
            onClick: component.editPost,
          });
    
          if (!isFirstPost) {
            items.push({
              text: 'Delete',
              dataId: post._id,
              onClick: component.deletePost,
            });
          }
        }
    
        return items;
      };
    ```
    
    Note that we don't allow deleting the first post inside a discussion, since we decided that showing an empty `DiscussionPageComp` is poor UX. After we are done with Post API, a discussion's creator will also be the first post's creator - so to delete the first post, this end user can simply delete the entire discussion.
    
    We used but have not yet defined the methods `showMarkdown`, `editPost`, and `deletePost`:
    
    ```
      public showMarkdown = () => {
        const { post, onShowMarkdownClick } = this.props;
        if (onShowMarkdownClick) {
          onShowMarkdownClick(post);
        }
      };
    
      public editPost = () => {
        const { post, onEditClick } = this.props;
        if (onEditClick) {
          onEditClick(post);
        }
        console.log(`PostDetail: ${post._id}`);
      };
    
      public deletePost = () => {
        confirm({
          title: 'Are you sure?',
          message: '',
          onAnswer: async (answer) => {
            if (answer) {
              const { post } = this.props;
              await post.discussion.deletePost(post);
              notify('You successfully deleted Post.');
            }
          },
        });
      };
    ```
    
    It's easy to understand what `deletePost` is doing, because `deletePost` is our typical component method that calls a store method, though indirectly via the `Confirmer` component that you are already familiar with. In this case, we call the `this.props.post.discussion.deletePost` store method that we defined earlier in this section, when we updated the `Discussion` data store.
    
    `showMarkdown` and `editPost` component methods require more explanation. Let's focus on `editPost` for discussion's sake (`showMarkdown` works similarly). When an end user clicks the `Edit` menu item to edit a post, our application calls the `this.props.onEditClick(post)` method. This is how we are going to use `PostDetail` inside `DiscussionPageComp`:
    
    ```
      <PostDetail
        key={p._id}
        post={p}
        onEditClick={this.onEditClickCallback}
        onShowMarkdownClick={this.onSnowMarkdownClickCallback}
        isMobile={this.props.isMobile}
        store={store}
      />
    ```
    
    That means that calling `this.props.onEditClick(post)` triggers `onEditClickCallback` that we define like this inside `DiscussionPageComp`:
    
    ```
      public onEditClickCallback = (post) => {
        this.setState({ selectedPost: post, showMarkdownClicked: false });
      };
    ```
    
    So we assign a `post` value to `this.state.selectedPost`. Updating `state` triggers a re-render event so that our application will show an end user `PostForm` instead of `PostDetail`, so the end user can edit the selected post. Inside `DiscussionPageComp`, we added the following UI logic:
    
    ```
      // some code
    
      const { selectedPost, showMarkdownClicked } = this.state;
    
      // some code
    
      selectedPost && selectedPost._id === p._id ? (
        <PostForm
          store={store}
          key={p._id}
          post={p}
          readOnly={showMarkdownClicked}
          discussion={discussion}
          members={discussion.members}
          onFinished={() => {
            setTimeout(() => {
              this.setState({
                selectedPost: null,
                showMarkdownClicked: false,
              });
            }, 0);
          }}
        />
      ) : (
        <PostDetail
          key={p._id}
          post={p}
          onEditClick={this.onEditClickCallback}
          onShowMarkdownClick={this.onSnowMarkdownClickCallback}
          isMobile={this.props.isMobile}
          store={store}
        />
      ),
    ```
    
    So updating `this.state.selectedPost` with a `post` value will render `PostForm` that allows an end user to edit a post; otherwise, `selectedPost` has a value of `null` and `PostDetail` is rendered instead.
    

Put all parts together in a new file, `book/8-begin/app/components/posts/PostDetail.tsx`:

```
import Avatar from '@material-ui/core/Avatar';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';

import confirm from '../../lib/confirm';
import notify from '../../lib/notify';
import { Store } from '../../lib/store';
import { Post } from '../../lib/store/post';
import { User } from '../../lib/store/user';

import MenuWithMenuItems from '../common/MenuWithMenuItems';

import PostContent from './PostContent';

const stylePaper = {
  margin: '10px 0px',
  padding: '20px',
};

const styleLineSeparator = {
  verticalAlign: 'text-bottom',
  fontWeight: 300,
  fontSize: '16px',
  margin: '0px 5px',
  opacity: 0.75,
};

const getMenuOptions = (post) => ({
  dataId: post._id,
  id: `post-menu-${post._id}`,
});

const getMenuItemOptions = (post: Post, currentUser: User, component) => {
  const items = [];

  if (post.createdUserId !== currentUser._id) {
    items.push({
      text: 'Show Markdown',
      dataId: post._id,
      onClick: component.showMarkdown,
    });
  }

  if (post.createdUserId === currentUser._id) {
    const isFirstPost = post.discussion.posts.indexOf(post) === 0;

    items.push({
      text: 'Edit',
      dataId: post._id,
      onClick: component.editPost,
    });

    if (!isFirstPost) {
      items.push({
        text: 'Delete',
        dataId: post._id,
        onClick: component.deletePost,
      });
    }
  }

  return items;
};

type Props = {
  post: Post;
  store: Store;
  onEditClick: (post) => void;
  onShowMarkdownClick: (post) => void;
  isMobile: boolean;
};

class PostDetail extends React.Component<Props> {
  public render() {
    const { post, isMobile } = this.props;

    return <Paper style={stylePaper}>{this.renderPostDetail(post, isMobile)}</Paper>;
  }

  public renderPostDetail(post: Post, isMobile) {
    const createdDate = moment(post.createdAt)
      .local()
      .format('MMM Do YYYY');
    const lastUpdatedDate = moment(post.lastUpdatedAt).fromNow();

    return (
      <React.Fragment>
        <div
          style={{
            float: 'left',
            margin: '-12px 10px 0px -15px',
            zIndex: 1000,
          }}
        >
          {this.renderMenu()}
        </div>
        <div id={`post-${post._id}`}>
          {post.user && (
            <Tooltip
              title={post.user.displayName}
              placement="top"
              disableFocusListener
              disableTouchListener
            >
              <Avatar
                src={post.user.avatarUrl}
                alt={post.user.displayName}
                style={{
                  width: '40px',
                  height: '40px',
                  margin: '0px 10px 0px 5px',
                  cursor: 'pointer',
                  float: 'left',
                }}
              />
            </Tooltip>
          )}
          <div
            style={{
              margin: isMobile ? '0px' : '0px 20px 0px 70px',
              fontWeight: 300,
              lineHeight: '1em',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 400 }}>
              {`By: ${post.user && post.user.displayName}` || 'User'}
              <span style={styleLineSeparator}>|</span>
              {`Created: ${post.createdAt && createdDate}` || ''}

              {post.isEdited ? (
                <React.Fragment>
                  <span style={styleLineSeparator}>|</span>
                  Last edited: {lastUpdatedDate}
                </React.Fragment>
              ) : null}
            </span>

            <PostContent html={post.htmlContent} />
          </div>
        </div>
      </React.Fragment>
    );
  }

  public renderMenu() {
    const { post, store } = this.props;
    const { currentUser } = store;

    if (!post.user || !currentUser || currentUser._id !== post.user._id) {
      return null;
    }

    return (
      <MenuWithMenuItems
        menuOptions={getMenuOptions(post)}
        itemOptions={getMenuItemOptions(post, store.currentUser, this)}
      />
    );
  }

  public editPost = () => {
    const { post, onEditClick } = this.props;
    if (onEditClick) {
      onEditClick(post);
    }
    console.log(`PostDetail: ${post._id}`);
  };

  public deletePost = () => {
    confirm({
      title: 'Are you sure?',
      message: '',
      onAnswer: async (answer) => {
        if (answer) {
          const { post } = this.props;
          await post.discussion.deletePost(post);
          notify('You successfully deleted Post');
        }
      },
    });
  };

  public showMarkdown = () => {
    const { post, onShowMarkdownClick } = this.props;
    if (onShowMarkdownClick) {
      onShowMarkdownClick(post);
    }
  };

}

export default observer(PostDetail);
```

We are done with the `PostDetail` component. Let's work on `PostForm` next.

We will use the `PostForm` component on the `DiscussionPageComp` page to achieve three different experiences:

-   show post's creator a form to edit a post
-   show any discussion's participant a form to add a new post
-   show any discussion's participant, who is not the post's creator, the Markdown content of a selected post

As you may guess, we have to employ a pair of boolean parameters - `isEditingPost` and `showMarkdownToNonCreator` - to achieve the above outcomes:

-   `isEditingPost: true` and `showMarkdownToNonCreator: false`. `PostForm` will show the post's creator a form to edit the post.
-   `isEditingPost: true` and `showMarkdownToNonCreator: true`. `PostForm` will show a discussion's participant, who is not the post's creator, the Markdown content of a selected post.
-   `isEditingPost: false` and `showMarkdownToNonCreator: false`. `PostForm` will show any discussion's participant a form to add a new post to a discussion.

Since our application uses the same `PostForm` to display a form for editing any post, you may guess correctly that we will be defining a `PostForm.getDerivedStateFromProps` method. We will do so for the exact same reason that we defined a `EditDiscussionForm.getDerivedStateFromProps` method - to check if `props` changed. If so, update `state` that is derived from `props`. This allows re-using the same `PostForm` component for editing any number of posts on the list of posts at the `DiscussionPageComp` page.

Blueprint for creating `PostForm`:

```
// imports

// type Props = ...

// type State = ...

class PostForm extends React.Component<Props, State> {
  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      // interface code for component
    );
  }

  // component's public methods

  // component's private methods
}

export default SomeHOCs(PostForm);
```

-   **imports**:
    
    ```
      import Button from '@material-ui/core/Button';
      import he from 'he';
      import marked from 'marked';
      import { observer } from 'mobx-react';
      import NProgress from 'nprogress';
      import React from 'react';
    
      import notify from '../../lib/notify';
      import { Store } from '../../lib/store';
      import { Discussion } from '../../lib/store/discussion';
      import { Post } from '../../lib/store/post';
      import { User } from '../../lib/store/user';
    
      import PostEditor from './PostEditor';
    ```
    
-   **type Props = ...**. We need to pass the following props from `DiscussionPageComp` to the `PostForm` component:
    
    -   (1) `store` to access `currentTeam` and pass it down to `PostEditor`
    -   (2) `isMobile` for mobile browser styles
    -   (3) `members` to pass it down to `PostEditor`, to be later used to create a so-called `Mentions` UX that allows an end user to quickly address a discussion's participant within a post
    -   (4) `post` to figure out the value for `isEditingPost`, access `post.content` that get passed to `PostEditor`, and figure out if `state` needs to be changed when `isEditingPost` has a value of `true`
    -   `discussion` to add the access store method `discussion.addPost`
    -   `showMarkdownToNonCreator` to decide whether to render interface that shows a discussion's participant, who is not post's creator, the Markdown content of a selected post
    -   `onFinished` to set values inside `DiscussionPageComp` page's `state` back to default values.
        
        ```
        type Props = {
          store: Store;
          isMobile: boolean;
          members: User[];
          post: Post;
          discussion: Discussion;
          showMarkdownToNonCreator?: boolean;
          onFinished?: () => void;
        };
        ```
        
-   **type State = ...**. We put `postId` and `content` into `state`, because `postId` and `content` change when an end user selects a different post. `content` also changes when an end user changes `content` of a selected post by modifying it directly. We put `disabled` into `state` as well. This is to disable buttons after they are clicked to prevent double clicking:
    
    ```
      type State = {
        postId: string;
        content: string;
        disabled: boolean;
      };
    ```
    
-   **constructor(props)**. Assigning default values does not require much explanation:
    
    ```
      constructor(props) {
        super(props);
    
        this.state = {
          postId: null,
          content: '',
          disabled: false,
        };
      }
    ```
    
    Next, let's define `PostForm.getDerivedStateFromProps`. This is how we defined `EditDiscussionForm.getDerivedStateFromProps`:
    
    ```
      public static getDerivedStateFromProps(props: Props, state: State) {
        const { discussion } = props;
    
        if (state.discussionId === discussion._id) {
          return null;
        }
    
        return {
          name: (discussion && discussion.name) || '',
          memberIds: (discussion && discussion.memberIds) || [],
          discussionId: discussion._id,
        };
      }
    ```
    
    We returned `null` to update nothing and returned the `state` object if the value of the discussion's id changed in `props` and did not match the value inside `state`. Here we do the same thing for a post's id. We also check whether a post is `null` or `undefined`, because `post` could be one of these values for `PostForm`, for example when `PostForm` is used to create a new post:
    
    ```
      public static getDerivedStateFromProps(props: Props, state) {
        const { post } = props;
    
        if (!post && !state.postId) {
          return null;
        }
    
        if (post && post._id === state.postId) {
          return null;
        }
    
        return {
          postId: (post && post._id) || null,
          content: (post && post.content) || '',
        };
      }
    ```
    
-   **access some values from props or state**. This is where we access the value of the boolean parameter `showMarkdownToNonCreator` and assign this value to the boolean parameter `isEditingPost`. We already used `!!` syntax before. If `post` is not `null` or `undefined`, then `isEditingPost` is `true`. Note how we render different text for three different cases (adding new post, showing Markdown for selected post, editing selected post):
    
    ```
      const { store, members, post, isMobile, showMarkdownToNonCreator } = this.props;
      const isEditingPost = !!post;
    
      let title = 'Add Post';
      if (showMarkdownToNonCreator) {
        title = 'Showing Markdown';
      } else if (isEditingPost) {
        title = 'Edit Post';
      }
    ```
    
-   **interface code for component**. Say there is a discussion with two participants: Team Leader Potato and Team Member Async:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+08-57-10.png)
    
    If you are logged-in as Team Leader Potato, here are three cases for unique UI of the `PostForm` component:
    
    -   editing your own post:
        
        ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+09-33-19.png)
        
        ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+09-33-07.png)
        
    -   adding a new post:
        
        ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+09-32-31.png)
        
    -   seeing the Markdown content of someone else's post:
        
        -   ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+09-32-50.png)
            
        -   ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-23+09-32-56.png)
            
        
        We achieve this variety of UIs by showing the `form` element where text and showing/hiding of buttons are controlled by the boolean parameters `showMarkdownToNonCreator` and `isEditingPost`:
        
        ```
        <div style={{ height: '100%', margin: '0px 20px' }}>
        <p />
        <br />
        <h3>{title}</h3>
        <form style={{ width: '100%', height: '100%' }} onSubmit={this.onSubmit} autoComplete="off">
          <p />
          <br />
          <div>
            {showMarkdownToNonCreator ? null : (
              <React.Fragment>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={this.state.disabled}
                >
                  {isEditing ? 'Save changes' : 'Publish Post'}
                </Button>
                {isMobile ? <p /> : null}
              </React.Fragment>
            )}
            {isEditingPost ? (
              <Button
                variant="outlined"
                onClick={this.closeForm}
                disabled={this.state.disabled}
                style={{ marginLeft: '10px' }}
              >
                {showMarkdownToNonCreator ? 'Go back' : 'Cancel'}
              </Button>
            ) : null}
          </div>
          <p />
          <br />
          <PostEditor
            content={this.state.content}
            onChanged={this.onContentChanged}
            members={members}
            store={store}
            textareaHeight="100%"
            parentComponent="PF"
          />
          <p />
          <div style={{ margin: '20px 0px' }}>
            {isEditingPost ? (
              <Button
                variant="outlined"
                onClick={this.closeForm}
                disabled={this.state.disabled}
                style={{ marginLeft: '10px' }}
              >
                {showMarkdownToNonCreator ? 'Go back' : 'Cancel'}
              </Button>
            ) : null}
          </div>
          <p />
          <br />
        </form>
        </div>
        ```
        
-   **component's private methods**. For the above `form`, we will define an `onSubmit` method that **either** calls the store method `post.editPost` or store method `discussion.addPost`, depending on the value of the boolean parameter `isEditingPost`. If `isEditingPost` is `true`, then we will call the store method `post.editPost`. If `isEditingPost` is `false`, then we will call the store method `discussion.addPost`:
    
    ```
      private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    
        const { content } = this.state;
        const htmlContent = marked(he.decode(content));
        const { post, onFinished, store, discussion } = this.props;
        const isEditingPost = !!post;
    
        if (!content) {
          notify('Add content to your Post');
          return;
        }
    
        if (isEditingPost) {
          this.setState({ disabled: true });
          NProgress.start();
          try {
            await post.editPost({ content, htmlContent });
            notify('You successfully edited Post');
          } catch (error) {
            console.log(error);
            notify(error);
          } finally {
            this.setState({ disabled: false });
            NProgress.done();
          }
    
          if (onFinished) {
            onFinished();
          }
    
          return;
        }
    
        const { currentTeam } = store;
        if (!currentTeam) {
          notify('Team is not selected or does not exist.');
          return;
        }
    
        NProgress.start();
        this.setState({ disabled: true });
    
        try {
          await discussion.addPost(content);
    
          this.setState({ content: '' });
          notify('You successfully published new Post.');
        } catch (error) {
          console.log(error);
          notify(error);
        } finally {
          this.setState({ disabled: false });
          NProgress.done();
        }
    
        if (onFinished) {
          onFinished();
        }
      };
    ```
    
    We also need to define `closeForm`, which assigns default values to `state` and calls `this.props.onFinished` and the `onContentChanged` method that updates the value of `this.state.content` when an end user changes `content` either by selecting a new post or modifying content manually:
    
    ```
      private onContentChanged = (content: string) => {
        this.setState({ content });
      };
    
      private closeForm = () => {
        this.setState({ postId: null, content: '' });
    
        const { onFinished } = this.props;
        if (onFinished) {
          onFinished();
        }
      };
    ```
    
    This is how we used `PostForm` inside the `DiscussionPageComp` page for editing a post or showing Markdown:
    
    ```
      <PostForm
        store={store}
        isMobile={isMobile}
        key={p._id}
        post={p}
        showMarkdownToNonCreator={showMarkdownClicked}
        discussion={discussion}
        members={discussion.members}
        onFinished={() => {
          this.setState({
            selectedPost: null,
            showMarkdownClicked: false,
          });
        }}
      />
    ```
    
    As you can see, calling `this.props.onFinished` inside `PostForm` results in `this.state.selectedPost` to be `null`, thus hiding `PostForm` because of how the `selectedPost` value is used in the following logic inside the `DiscussionPageComp` page:
    
    ```
      selectedPost && selectedPost._id === p._id ? (
        <PostForm
          store={store}
          isMobile={isMobile}
          key={p._id}
          post={p}
          showMarkdownToNonCreator={showMarkdownClicked}
          discussion={discussion}
          members={discussion.members}
          onFinished={() => {
            this.setState({
              selectedPost: null,
              showMarkdownClicked: false,
            });
          }}
        />
      ) : (
        <PostDetail
          key={p._id}
          post={p}
          onEditClick={this.onEditClickCallback}
          onShowMarkdownClick={this.onSnowMarkdownClickCallback}
          isMobile={this.props.isMobile}
          store={store}
        />
      ),
    ```
    

You are ready to put it all together. Create a new file, `book/8-begin/app/components/posts/PostForm.tsx`, and add the above parts into it, like this:

```
import Button from '@material-ui/core/Button';
import he from 'he';
import marked from 'marked';
import { observer } from 'mobx-react';
import NProgress from 'nprogress';
import React from 'react';

import notify from '../../lib/notify';
import { Store } from '../../lib/store';
import { Discussion } from '../../lib/store/discussion';
import { Post } from '../../lib/store/post';
import { User } from '../../lib/store/user';

import PostEditor from './PostEditor';

type Props = {
  store: Store;
  isMobile: boolean;
  members: User[];
  post: Post;
  discussion: Discussion;
  showMarkdownToNonCreator?: boolean;
  onFinished?: () => void;
};

type State = {
  postId: string;
  content: string;
  disabled: boolean;
};

class PostForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      postId: null,
      content: '',
      disabled: false,
    };
  }

  public static getDerivedStateFromProps(props: Props, state) {
    const { post } = props;

    if (!post && !state.postId) {
      return null;
    }

    if (post && post._id === state.postId) {
      return null;
    }

    return {
      content: (post && post.content) || '',
      postId: (post && post._id) || null,
    };
  }

  public render() {
    const { store, members, post, isMobile, showMarkdownToNonCreator } = this.props;
    const isEditing = !!post;

    let title = 'Add Post';
    if (showMarkdownToNonCreator) {
      title = 'Showing Markdown';
    } else if (isEditing) {
      title = 'Edit Post';
    }

    return (
      <div style={{ height: '100%', margin: '0px 20px' }}>
        <p />
        <br />
        <h3>{title} </h3>
        <form style={{ width: '100%', height: '100%' }} onSubmit={this.onSubmit} autoComplete="off">
          <p />
          <br />
          <div>
            {showMarkdownToNonCreator ? null : (
              <React.Fragment>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={this.state.disabled}
                >
                  {isEditing ? 'Save changes' : 'Publish Post'}
                </Button>
                {isMobile ? <p /> : null}
              </React.Fragment>
            )}
            {isEditingPost ? (
              <Button
                variant="outlined"
                onClick={this.closeForm}
                disabled={this.state.disabled}
                style={{ marginLeft: '10px' }}
              >
                {showMarkdownToNonCreator ? 'Go back' : 'Cancel'}
              </Button>
            ) : null}
          </div>
          <p />
          <br />
          <PostEditor
            content={this.state.content}
            onChanged={this.onContentChanged}
            members={members}
            store={store}
            textareaHeight="100%"
            parentComponent="PF"
          />
          <p />
          <div style={{ margin: '20px 0px' }}>
            {isEditingPost ? (
              <Button
                variant="outlined"
                onClick={this.closeForm}
                disabled={this.state.disabled}
                style={{ marginLeft: '10px' }}
              >
                {showMarkdownToNonCreator ? 'Go back' : 'Cancel'}
              </Button>
            ) : null}
          </div>
          <p />
          <br />
        </form>
      </div>
    );
  }

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { content } = this.state;
    const htmlContent = marked(he.decode(content));
    const { post, onFinished, store, discussion } = this.props;
    const isEditing = !!post;

    if (!content) {
      notify('Add content to your Post');
      return;
    }

    if (isEditing) {
      this.setState({ disabled: true });
      NProgress.start();
      try {
        await post.editPost({ content, htmlContent });
        notify('You successfully edited Post');
      } catch (error) {
        console.log(error);
        notify(error);
      } finally {
        this.setState({ disabled: false });
        NProgress.done();
      }

      if (onFinished) {
        onFinished();
      }

      return;
    }

    const { currentTeam } = store;
    if (!currentTeam) {
      notify('Team is not selected or does not exist.');
      return;
    }

    NProgress.start();
    this.setState({ disabled: true });

    try {
      await discussion.addPost(content);

      this.setState({ content: '' });
      notify('You successfully published new Post.');
    } catch (error) {
      console.log(error);
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }

    if (onFinished) {
      onFinished();
    }
  };

  private onContentChanged = (content: string) => {
    this.setState({ content });
  };

  private closeForm = () => {
    this.setState({ content: '', postId: null });

    const { onFinished } = this.props;
    if (onFinished) {
      onFinished();
    }
  };
}

export default observer(PostForm);
```

We built `PostDetail` and `PostForm` components. Two more components to go: `PostEditor` and `PostContent`.

Let's refresh our memory by looking at the diagram we introduced at the beginning of this section:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Post-specific+components.png)

`PostForm` contains `PostEditor`, and `PostEditor` contains `PostContent`.

This how `PostForm` and `PostEditor` look on the UI:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/PostForm+-+PostEditor.png)

Our application shows `PostContent` only when an end user clicks on the `HTML` tab at `PostEditor`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/PostContent.png)

Here are the features that we want to implement for `PostEditor`

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/PostEditor.png)

Data model server-side rendering data model request was sent Team Leader in production HTTP decorate method with action API method. If truthy then compiles AWS dashboard this chapter response Remember to add import MongoDB database cookie send this response request on server only add environmental variable decorate method with action. Add environmental variable We will discuss discussion show notification triggers method response on the client it works as expected. Cookie this chapter page component Material-UI mount middleware conditional operator decorate method with action triggers method add environmental variable request Remember to add import conditional operator Click on the button. S3 bucket mount middleware We will discuss Google OAuth API session MongoDB database check if value is truthy cookie Google OAuth API conditional operator request At AWS dashboard. Navigate to HTTP check if value is truthy on server only request was sent if truthy then session request discussion if truthy then static method calls on the client static method calls. In a browser subsection triggers method discussion subsection decorate method with action this chapter list of posts. Team Leader API method Next.js web application Navigate to Remember to add import. This chapter this chapter AWS dashboard email and name list of posts HTTP it works as expected. Mount middleware conditional operator production-ready if truthy then Navigate to send this response new Express route store method calls decorate method with action Click on the button team members response We will discuss server-side rendering request was sent.

Let's make a list:

-   when an end user clicks on an image icon, our application offers to upload an image file. If any of an image's dimensions is higher than 1024 px, our application resizes the image before uploading it to AWS S3 and displaying the file inside the post's content.
-   by default, our application displays Markdown `content` to an end user. When the `Markdown` tab is selected, `PostContent` is hidden
-   when an end user clicks on the `HTML` tab, we display `htmlContent` inside `PostContent`
-   when an end user types `@` inside the Markdown `content`, our application displays a dropdown list the discussion's participants, minus the post's creator. When an end user clicks an item on the list, our application adds the clicked `@displayName` to the `content`. This feature allows a post's creator to quickly reference/address other discussion participants within a post's content.

Here is a blueprint of the `PostEditor` component. Let's discuss every part of it below:

```
// imports

// type Props = ...

// type State = ...

class PostEditor extends React.Component<Props, State> {
  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      // interface code for component
    );
  }

  // component's public methods

  // component's private methods
}

export default SomeHOCs(PostEditor);
```

-   **imports**. This section includes `PostContent` and API methods for uploading a file. You are familiar with these methods from Chapter 4. We also import `marked`, so we can show both `content` and `htmlContent` quickly to an end user when this user switches between `Markdown` and `HTML` tabs. And we imported `Mention` and `MentionsInput` to display a list a discussion's participants, minus the post's creator:
    
    ```
      import Avatar from '@material-ui/core/Avatar';
      import Button from '@material-ui/core/Button';
      import he from 'he';
      import marked from 'marked';
      import { observer } from 'mobx-react';
      import NProgress from 'nprogress';
      import React from 'react';
      import { Mention, MentionsInput } from 'react-mentions';
    
      import {
      getSignedRequestForUploadApiMethod,
      uploadFileUsingSignedPutRequestApiMethod,
      } from '../../lib/api/team-member';
      import notify from '../../lib/notify';
      import { resizeImage } from '../../lib/resizeImage';
      import { Store } from '../../lib/store';
      import { User } from '../../lib/store/user';
    
      import PostContent from './PostContent';
    ```
    
-   **type Props = ...**. We need to pass `store` to `PostEditor` from `PostForm` or `CreateDiscussionForm`, so we can access `currentUser` and `currentTeam`. We need to pass `onChanged`, `content`, and `members` props as well. `content` is to display `content` and `htmlContent`. `members` is to generate a dropdown list with all discussion participants, minus the post's creator. `onChanged` is to successfully add `@displayName` to the `content` or add HTML code of an uploaded file to the `content`. `placeholder` is an optional prop. Here, we chose not to pass it from `PostForm` or `CreateDiscussionForm`, but you can use it in your own application.
    
    ```
      type Props = {
        store: Store;
        onChanged: (content) => void;
        content: string;
        members: User[];
        placeholder?: string;
        parentComponent: string;
      };
    ```
    
-   **type State = ...**. The only dynamic property will be `htmlContent`, and we will use it to decide whether to show or hide the `PostContent` component.
    
    ```
      type State = { htmlContent: string };
    ```
    
-   **constructor(props)**. Since the default selected tab is `Markdown`, we can set the default value of `htmlContent` to be an empty string.
    
    ```
      constructor(props) {
        super(props);
    
        this.state = {
          htmlContent: '',
        };
      }
    ```
    
-   **access some values from props or state**. Nothing you don't already know in this section. One thing that is worth mentioning - `currentUser` that has access to `PostEditor` is indeed the post's creator, so `membersMinusCurrentUser` is an array of a discussion's participants, minus the post's creator:
    
    ```
      const { htmlContent } = this.state;
      const { content, members, store, parentComponent } = this.props;
      const { currentUser } = store;
    
      const membersMinusCurrentUser = members.filter((member) => member._id !== currentUser._id);
    
      const isThemeDark = store && store.currentUser && store.currentUser.darkTheme === true;
      const textareaBackgroundColor = isThemeDark ? '#0d1117' : '#fff';
    ```
    
-   **interface code for component**. You already coded many `Button` elements. Here, we use it three times - for uploading a file, showing Markdown (`content`), and showing HTML (`htmlContent`). We also coded an upload file element in the same way we did inside the `YourSettings` and `TeamSettings` pages. For example, open `book/8-begin/app/pages/your-settings.tsx`. Find the `label` and `input` elements for uploading a file:
    
    ```
      <label htmlFor="upload-file-user-avatar">
        <Button
          variant="contained"
          color="primary"
          component="span"
          disabled={this.state.disabled}
        >
          Update avatar
        </Button>
      </label>
      <input
        accept="image/*"
        name="upload-file-user-avatar"
        id="upload-file-user-avatar"
        type="file"
        style={{ display: 'none' }}
        onChange={this.uploadFile}
      />
    ```
    
    Three buttons plus `label`/`input` for uploading a file:
    
    ```
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'inline-flex' }}>
          <Button
            color="primary"
            onClick={this.showMarkdownContent}
            variant="text"
            style={{ fontWeight: htmlContent ? 300 : 600, color: '#58a6ff' }}
          >
            Markdown
          </Button>{' '}
          <Button
            color="primary"
            onClick={this.showHtmlContent}
            variant="text"
            style={{ fontWeight: htmlContent ? 600 : 300, color: '#58a6ff' }}
          >
            HTML
          </Button>
        </div>
    
        <div style={{ display: 'inline', float: 'left' }}>
          <label htmlFor={'upload-file-post-editor-' + parentComponent}>
            <Button color="primary" component="span">
              <i className="material-icons" style={{ fontSize: '22px', color: '#58a6ff' }}>
                insert_photo
              </i>
            </Button>
          </label>
          <input
            accept="image/*"
            name={'upload-file-post-editor-' + parentComponent}
            id={'upload-file-post-editor-' + parentComponent}
            type="file"
            style={{ display: 'none' }}
            onChange={async (event) => {
              const file = event.target.files[0];
              await this.uploadFile(file);
              event.target.value = '';
            }}
          />
        </div>
        <br />
        <p>Content goes here</p>
      </div>
    ```
    
    As you can see from the above code, each button triggers its own component's method, so we need to define `showMarkdownContent`, `showMarkdownContent`, and `uploadFile` methods.
    
    We left a placeholder, `<p>Content goes here</p>`, where our application should show either `content` or `htmlContent`. When `htmlContent` is truthy (not `null`, not an empty string), our application should show `htmlContent` inside `PostContent`. Otherwise, we should show `content`. We should show content using `MentionsInput` from the `react-mentions` package:
    
    ```
      <div
        style={{
          width: '100%',
          height: '100vh',
          padding: '10px 15px',
          border: isThemeDark
            ? '1px solid rgba(255, 255, 255, 0.5)'
            : '1px solid rgba(0, 0, 0, 0.5)',
        }}
      >
        {htmlContent ? (
          <PostContent html={htmlContent} />
        ) : (
          <MentionsInput
            value={content}
          >
            <Mention />
          </MentionsInput>
        )}
      </div>
    ```
    
    `react-mentions` allows you to render textarea, trigger a list of mentionable items, and add a selected mentionable item to textarea:
    
    [https://www.npmjs.com/package/react-mentions](https://www.npmjs.com/package/react-mentions)
    
    Simple example from the above link:
    
    ```
      <MentionsInput value={this.state.value} onChange={this.handleChange}>
        <Mention
          trigger="@"
          data={this.props.users}
          renderSuggestion={this.renderUserSuggestion}
        />
        <Mention
          trigger="#"
          data={this.requestTag}
          renderSuggestion={this.renderTagSuggestion}
        />
      </MentionsInput> 
    ```
    
    All possible props for `MentionsInput` and `Mention`:
    
    [https://www.npmjs.com/package/react-mentions#configuration](https://www.npmjs.com/package/react-mentions#configuration)
    
    Here are the props we chose to pass for our use case:
    
    ```
      <MentionsInput
        autoFocus
        value={content}
        placeholder={this.props.placeholder ? this.props.placeholder : 'Compose new post'}
        onChange={(event) => {
          this.props.onChanged(event.target.value);
        }}
        style={{
          input: {
            border: 'none',
            outline: 'none',
            font: '16px Roboto',
            color: isThemeDark ? '#fff' : '#000',
            fontWeight: 300,
            height: '100vh',
            lineHeight: '1.5em',
            backgroundColor: content ? textareaBackgroundColor : 'transparent',
          },
          suggestions: {
            list: {
              backgroundColor: '#222',
              color: '#fff',
            },
    
            item: {
              padding: '5px 15px',
              borderBottom: '1px solid rgba(0,0,0,0.15)',
    
              '&focused': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
        }}
      >
        <Mention
          trigger="@"
          data={membersMinusCurrentUser.map((u) => ({
            id: u.avatarUrl,
            display: u.displayName,
          }))}
          markup={'`@${__display__}`'}
          displayTransform={(_, display) => {
            return `@${display}`;
          }}
          renderSuggestion={(suggestion) => (
            <React.Fragment>
              <Avatar
                role="presentation"
                src={suggestion.id}
                alt={suggestion.display}
                style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '10px',
                  display: 'inline-flex',
                  verticalAlign: 'middle',
                }}
              />
              <span style={{ marginRight: '5px' }}>{suggestion.display}</span>
            </React.Fragment>
          )}
        />
      </MentionsInput>
    ```
    
    For `MentionsInput`, which renders into `textarea` and has similar `props`/attributes - we use `value`, `onChange`, `autoFocus`, `placeholder`, and `styles`. For `Mention` - we use `trigger`, `data`, `markup`, `displayTransform`, and `renderSuggestions`.
    
    `trigger` and `renderSuggestions` control what an end user types to trigger a list of mentionable items and how each mentionable item looks, respectively:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-25+12-39-17.png)
    
    `data` creates an array of objects that correspond to members of the `membersMinusCurrentUser` array.
    
    `displayTransform` controls how mentionable items look inside `content` after it was selected. This will be shown instead of actual Markdown content for a mentionable item inside textarea:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-25+12-48-13.png)
    
    `markup` controls how mentionable item looks in `htmlContent` by controlling actual Markdown content for mentionable item inside textarea:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-25+13-01-24.png)
    
-   **component's public methods**. `showMarkdownContent` sets `htmlContent` to an empty string that results in hiding of `PostContent` with `htmlContent` and showing of `MentionsInput` with `content`:
    
    ```
      public showMarkdownContent = () => {
        this.setState({ htmlContent: '' });
      };
    ```
    
    `showHtmlContent` uses `marked` and `he.decode` methods in the same manner as the `markdownToHtml` method inside `book/8-begin/api/server/models/Post.ts`. At the end, it calls `this.setState({ htmlContent });` to update `htmlContent` inside the `state` object:
    
    ```
      public showHtmlContent = async () => {
        const { content } = this.props;
    
        function markdownToHtml(postContent) {
          const renderer = new marked.Renderer();
    
          renderer.link = (href, title, text) => {
            const t = title ? ` title="${title}"` : '';
    
            if (text.startsWith('<code>@#')) {
              return `${text.replace('<code>@#', '<code>@')} `;
            }
    
            return `
              <a target="_blank" href="${href}" rel="noopener noreferrer"${t}>
                ${text}
              </a>
            `;
          };
    
          marked.setOptions({
            renderer,
            breaks: true,
          });
    
          return marked(he.decode(postContent));
        }
    
        const htmlContent = content ? markdownToHtml(content) : '<span>Nothing to preview.</span>';
        this.setState({ htmlContent });
      };
    ```
    
-   **component's private methods**. We already defined `uploadFile` multiple times in our book, so this will be an easy one. The only difference is that we need to amend `content` with an image's Markdown content, `fileHtmlOrMarkdown`. If the file's type is image, `fileHtmlOrMarkdown` can be the image's HTML code:
    
    ```
      fileHtmlOrMarkdown = `
        <div>
          <img style="max-width: ${finalWidth}; width:100%" src="${fileUrl}" alt="Async" class="s3-image" />
        </div>`;
    ```
    
    If the file's type is not image, we can use Markdown's `[title](https://example.com)`:
    
    ```
      fileHtmlOrMarkdown = `[${file.name}](${fileUrl})`;
    ```
    
    A non-image file, for example a PDF file, will look like this in `htmlContent`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-25+12-08-05.png)
    
    Finally, we need to amend `content` with `fileHtmlOrMarkdown` and call `this.props.onChanged(props)`, so the component gets re-rendered and an end user sees updated `content` inside `PostForm`:
    
    ```
      private onContentChanged = (content: string) => {
        this.setState({ content });
      };
    ```
    
    And `onChanged={this.onContentChanged}`.
    
    As mentioned before, we also use `currentTeam` that we access via `store` for the destination inside an S3 bucket. We discussed the rest of the `uploadFile` method earlier when building the `YourSettings` and `TeamSettings` pages.
    
    `PostEditor.uploadFile`:
    
    ```
      private uploadFile = async (file: File) => {
        if (!file) {
          notify('No file selected.');
          return;
        }
    
        if (!file.type || (!file.type.startsWith('image/') && file.type !== 'application/pdf')) {
          notify('Wrong file.');
          return;
        }
    
        const { store } = this.props;
        const { currentTeam } = store;
    
        NProgress.start();
    
        const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_POSTS;
        const prefix = `${currentTeam.slug}`;
        const fileName = file.name;
        const fileType = file.type;
    
        try {
          const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
            fileName,
            fileType,
            prefix,
            bucket,
          });
    
          let fileHtmlOrMarkdown;
          let fileUrl;
    
          if (file.type.startsWith('image/')) {
            const { width } = await getImageDimension(file);
            const resizedFile = await resizeImage(file, 1024, 1024);
    
            await uploadFileUsingSignedPutRequestApiMethod(
              resizedFile,
              responseFromApiServerForUpload.signedRequest,
            );
    
            fileUrl = responseFromApiServerForUpload.url;
    
            console.log(fileUrl);
    
            const finalWidth = width > 768 ? '100%' : `${width}px`;
    
            fileHtmlOrMarkdown = `
              <div>
                <img style="max-width: ${finalWidth}; width:100%" src="${fileUrl}" alt="Async" class="s3-image" />
              </div>`;
          } else {
            await uploadFileUsingSignedPutRequestApiMethod(file, responseFromApiServerForUpload.signedRequest);
    
            fileUrl = responseFromApiServerForUpload.url;
            fileHtmlOrMarkdown = `[${file.name}](${fileUrl})`;
          }
    
          const content = `${this.props.content}\n${fileHtmlOrMarkdown.replace(/\s+/g, ' ')}`;
    
          this.props.onChanged(content);
    
          notify('You successfully uploaded file.');
        } catch (error) {
          console.log(error);
          notify(error);
        } finally {
          NProgress.done();
        }
      };
    ```
    

Put the above parts together according to the blueprint for `PostEditor`. Create a new file, `book/8-begin/app/components/posts/PostEditor.tsx`, and add this content to it:

```
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import he from 'he';
import marked from 'marked';
import { observer } from 'mobx-react';
import NProgress from 'nprogress';
import React from 'react';
import { Mention, MentionsInput } from 'react-mentions';

import {
  getSignedRequestForUploadApiMethod,
  uploadFileUsingSignedPutRequestApiMethod,
} from '../../lib/api/team-member';
import notify from '../../lib/notify';
import { resizeImage } from '../../lib/resizeImage';
import { Store } from '../../lib/store';
import { User } from '../../lib/store/user';

import PostContent from './PostContent';

function getImageDimension(file): Promise<{ width: number; height: number }> {
  const reader = new FileReader();
  const img = new Image();

  return new Promise((resolve) => {
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.src = e.target.result.toString();
    };
  });
}

type Props = {
  store: Store;
  onChanged: (content) => void;
  content: string;
  members: User[];
  textareaHeight?: string;
  placeholder?: string;
  parentComponent: string;
};

type State = { htmlContent: string };

class PostEditor extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      htmlContent: '',
    };
  }

  public render() {
    const { htmlContent } = this.state;
    const { content, members, store, parentComponent } = this.props;
    const { currentUser } = store;

    const membersMinusCurrentUser = members.filter((member) => member._id !== currentUser._id);

    const isThemeDark = store && store.currentUser && store.currentUser.darkTheme === true;
    const textareaBackgroundColor = isThemeDark ? '#0d1117' : '#fff';

    return (
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'inline-flex' }}>
          <Button
            color="primary"
            onClick={this.showMarkdownContent}
            variant="text"
            style={{ fontWeight: htmlContent ? 300 : 600, color: '#58a6ff' }}
          >
            Markdown
          </Button>{' '}
          <Button
            color="primary"
            onClick={this.showHtmlContent}
            variant="text"
            style={{ fontWeight: htmlContent ? 600 : 300, color: '#58a6ff' }}
          >
            HTML
          </Button>
        </div>

        <div style={{ display: 'inline', float: 'left' }}>
          <input
            accept="image/*"
            name="upload-file-post-editor"
            id="upload-file-post-editor"
            type="file"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files[0];
              event.target.value = '';
              this.uploadFile(file);
            }}
          />
          <label htmlFor="upload-file-post-editor">
            <Button color="primary" component="span">
              <i className="material-icons" style={{ fontSize: '22px', color: '#58a6ff' }}>
                insert_photo
              </i>
            </Button>
          </label>
        </div>
        <br />
        <div
          style={{
            width: '100%',
            height: '100vh',
            padding: '10px 15px',
            border: isThemeDark
              ? '1px solid rgba(255, 255, 255, 0.5)'
              : '1px solid rgba(0, 0, 0, 0.5)',
          }}
        >
          {htmlContent ? (
            <PostContent html={htmlContent} />
          ) : (
            <MentionsInput
              style={{
                input: {
                  border: 'none',
                  outline: 'none',
                  color: isThemeDark ? '#fff' : '#000',
                  fontWeight: 300,
                  height: '100vh',
                  lineHeight: '1.5em',
                  backgroundColor: content ? textareaBackgroundColor : 'transparent',
                },
                suggestions: {
                  list: {
                    backgroundColor: '#222',
                    color: '#fff',
                  },

                  item: {
                    padding: '5px 15px',
                    borderBottom: '1px solid rgba(0,0,0,0.15)',

                    '&focused': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
              }}
              autoFocus
              value={content}
              placeholder={this.props.placeholder ? this.props.placeholder : 'Compose new post'}
              onChange={(event) => {
                this.props.onChanged(event.target.value);
              }}
            >
              <Mention
                trigger="@"
                data={membersMinusCurrentUser.map((u) => ({
                  id: u.avatarUrl,
                  display: u.displayName,
                }))}
                markup={'`@${__display__}`'}
                displayTransform={(_, display) => {
                  return `@${display}`;
                }}
                renderSuggestion={(suggestion) => (
                  <React.Fragment>
                    <Avatar
                      role="presentation"
                      src={suggestion.id}
                      alt={suggestion.display}
                      style={{
                        width: '24px',
                        height: '24px',
                        marginRight: '10px',
                        display: 'inline-flex',
                        verticalAlign: 'middle',
                      }}
                    />
                    <span style={{ marginRight: '5px' }}>{suggestion.display}</span>
                  </React.Fragment>
                )}
              />
            </MentionsInput>
          )}
        </div>
      </div>
    );
  }

  public showMarkdownContent = () => {
    this.setState({ htmlContent: '' });
  };

  public showHtmlContent = async () => {
    const { content } = this.props;

    function markdownToHtml(postContent) {
      const renderer = new marked.Renderer();

      renderer.link = (href, title, text) => {
        const t = title ? ` title="${title}"` : '';

        if (text.startsWith('<code>@#')) {
          return `${text.replace('<code>@#', '<code>@')} `;
        }

        return `
          <a target="_blank" href="${href}" rel="noopener noreferrer"${t}>
            ${text}
          </a>
        `;
      };

      marked.setOptions({
        renderer,
        breaks: true,
      });

      return marked(he.decode(postContent));
    }

    const htmlContent = content ? markdownToHtml(content) : '<span>Nothing to preview.</span>';
    this.setState({ htmlContent });
  };

  private uploadFile = async (file: File) => {
    if (!file) {
      notify('No file selected.');
      return;
    }

    if (!file.type || (!file.type.startsWith('image/') && file.type !== 'application/pdf')) {
      notify('Wrong file.');
      return;
    }

    const { store } = this.props;
    const { currentTeam } = store;

    NProgress.start();

    const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_POSTS;
    const prefix = `${currentTeam.slug}`;
    const fileName = file.name;
    const fileType = file.type;

    try {
      const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
        fileName,
        fileType,
        prefix,
        bucket,
      });

      let fileHtmlOrMarkdown;
      let fileUrl;

      if (file.type.startsWith('image/')) {
        const { width } = await getImageDimension(file);
        const resizedFile = await resizeImage(file, 1024, 1024);

        await uploadFileUsingSignedPutRequestApiMethod(
          resizedFile,
          responseFromApiServerForUpload.signedRequest,
        );

        fileUrl = responseFromApiServerForUpload.url;

        console.log(fileUrl);

        const finalWidth = width > 768 ? '100%' : `${width}px`;

        fileHtmlOrMarkdown = `
          <div>
            <img style="max-width: ${finalWidth}; width:100%" src="${fileUrl}" alt="Async" class="s3-image" />
          </div>`;
      } else {
        await uploadFileUsingSignedPutRequestApiMethod(file, responseFromApiServerForUpload.signedRequest);

        fileUrl = responseFromApiServerForUpload.url;
        fileHtmlOrMarkdown = `[${file.name}](${fileUrl})`;
      }

      const content = `${this.props.content}\n${fileHtmlOrMarkdown.replace(/\s+/g, ' ')}`;

      this.props.onChanged(content);

      notify('You successfully uploaded file.');
    } catch (error) {
      console.log(error);
      notify(error);
    } finally {
      NProgress.done();
    }
  };
}

export default observer(PostEditor);
```

You already successfully created two AWS S3 buckets in this book - one for user avatars (env var `NEXT_PUBLIC_BUCKET_FOR_AVATARS`) and one for team logos (env var `NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS`). We leave it to you to create a third AWS S3 bucket. Remember to set all permissions like the other buckets, especially CORS permissions.

___

There is no practical reason to use a blueprint for constructing the `PostContent` component, since it is simply a `div` with React's `dangerouslySetInnerHTML`:

[https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

Create a new file, `book/8-begin/app/components/posts/PostContent.tsx`, with the following content:

```
import React from 'react';

type Props = { html: string };

class PostContent extends React.Component<Props> {
  public render() {
    const { html } = this.props;

    return (
      <div
        style={{ fontSize: '15px', lineHeight: '2em', fontWeight: 300, wordBreak: 'break-all' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
}

export default PostContent;
```

___

#### Testing Post API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-post-api)

Alrighty - we are ready to test the entire Post API infrastructure.

Check your MongoDB Atlas dashboard. In your `test` database, confirm that there is no `test.posts` collection.

Delete all discussions that have no posts either using the `Delete` option on `DiscussionActionMenu` or by deleting MongoDB documents in the `test.discussions` collection.

After deleting all discussions, start both `APP` and `API`. Go to the `/team/1/team-settings` page or `/team/1/discussions` page.

Click the plus icon on `DiscussionList` and create a discussion with the name `first discussion with posts` and the first post's content `first post in first discussion`. Add `Team Member Async` as the discussion's participant as well:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-25+16-17-32.png)

After clicking the `Create Discussion` button, you will be redirected to the new discussion:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-17-17.png)

Go to your MongoDB Atlas dashboard. Look into the newly created `test.posts` collection

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-23-00.png)

Note the values for `isEdited`, `discussionId` and the absence of the `lastUpdatedAt` field.

```
{
"_id":{"$oid":"5f1dc8aafee522265ede9319"},
"isEdited":false,
"createdUserId":"5eb31fdd2ea04220e52aba66",
"discussionId":"5f1dc8a3fee522265ede9318",
"content":"first post in first discussion",
"htmlContent":"<p>first post in first discussion</p>\n",
"createdAt":{"$date":{"$numberLong":"1595787434715"}},
"__v":{"$numberInt":"0"}
}
```

Go to your `test.discussions` collection. Find the MongoDB document with the value that matches the post's `discussionId`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-30-22.png)

Alright, creating the first post inside a new discussion works as expected.

Google OAuth API Next.js web application open this file conditional operator team members list of posts decorate method with action API infrastructure send this response send this response. Click on the button Team Leader on the client Next.js web application Team Leader in this book. Data model You already learned in a browser response withAuth HOC subsection API method calls corresponding store method end user in production. Email and name end user it works as expected end user You already learned. Team members Put it all together request was sent discussion decorate method with action mount middleware on the client Put it all together Google OAuth API HTTP static method calls store method calls. Redirect to checkout At AWS dashboard Put it all together At AWS dashboard redirect to checkout. Next.js web application conditional operator in production redirect to checkout end user API infrastructure show notification Team Leader new Express route Put it all together send this response. We will discuss request subsection withAuth HOC in a browser page component subsection Remember to add import. Conditional operator this chapter request server-side rendering add environmental variable API infrastructure Google OAuth API. API method AWS dashboard We will discuss add environmental variable new Express route mount middleware compiles on the client mount middleware withAuth HOC new Express route store method calls server-side rendering.

Next, let's test editing a post. Click on the three-dots icon that should trigger the post menu, which has only one item - `Edit`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-37-36.png)

Click on the `Edit` menu item, and you will see the `PostForm` component for editing a post (`isEditingPost` is `true` and `showMarkdownToNonCreator` is `false`):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-38-49.png)

Change `content` to `first post` instead of `first post in first discussion`. Click `Save Changes`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-49-53.png)

Note the new data, `Last edited`, on the `PostDetail`.

Go to the `test.posts` collection and check how data changed:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+11-54-07.png)

After we edited our post, `isEdited` is `true` and the document has a `lastUpdatedAt` field that is used to calculate the value for `Last edited` inside `PostDetail`.

Next, let's test Markdown. Click the `Edit` menu item and add the following `content` to the post:

```
first post

`abc`

[async-await.com](https://async-await.com)
```

let title = 'Add Post';  
if (showMarkdownToNonCreator) {  
title = 'Showing Markdown';  
} else if (isEditingPost) {  
title = 'Edit Post';  
}

```

> some quote

---

- bullet 1
- bullet 2
- bullet 3
```

Like so:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+12-00-11.png)

Then click on the `HTML` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+12-02-15.png)

You can see that our application successfully converts Markdwon to HTML using `marked`.

Note that the code block with elements `<pre><code>...</pre></code>` has no highlighting. Click the `Save Changes` button and reload the page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+12-05-57.png)

Interestingly, you can see highlighting of code this time. That's because we add class names to HTML elements on the server only. Open `book/8-begin/api/server/models/Post.ts` and find how we used `hljs`. We use only `marked` - not `hljs` - inside `PostEditor` at `book/8-begin/app/components/posts/PostEditor.tsx`.

We need to run a few more tests before we can conclude that our Post API works properly.

Log out from the `Team Leader Potato` account (your Team Leader's account) and log in with `Team Member Async` (your Team Member account). Create a new post with the following `content` inside `first discussion with posts`:

```
second post

`123`

[builderbook.org](https://builderbook.org)
```

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+14-31-59.png)

Next, log out from `Team Member Async` (your Team Member account) and log in with `Team Leader Potato` (your Team Leader's account). Find the second post inside `first discussion with posts` and click on the post's menu:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+14-44-10.png)

You will see only one item on the menu, `Show Markdown`. This is an expected behavior. Click on this menu item to see other participants' post `content` and `htmlContent`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+14-50-24.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+14-50-33.png)

To exit, click the `Go back` button.

Finally, let's test switching between two discussions when both discussions have posts. Create a second discussion with the name `second discussion` and first post content `first post in second discussion`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-26+14-55-36.png)

Refresh the tab to load the discussion page as server-side rendered, switch between two discussions on the list of discussions, and note that posts load as expected. Our application populates a list of posts on the server-side rendered `DiscussionPageComp` page (reloading tab) by calling the store method `setInitialPosts`. But when an end user switches between discussions on the browser, our application renders the `DiscussionPageComp` page on the browser and calls the store method `loadPosts` to populate a list of posts.

We leave it to you to test deleting a single post and deleting posts by deleting the discussion to which they belong.

In the next and final section of Chapter 8, we will learn about web sockets and implement a new powerful UX feature that allows an end user to see some changes that team members make in real time.

___

## Websockets for Discussion and Post [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#websockets-for-discussion-and-post)

In this last section of Chapter 8, we will work on adding a real time communication feature that your web application may need. In the context of our SaaS boilerplate, we as the application's developers, want our end users to be able to see some updates on the browser in real time. For example, when one end user adds a new discussion, we want all of the discussion's participants to see this new discussion on `DiscussionList` in real time. How do we build such feature? How can other participants' browsers know when to send a request to the `API` server and get new data?

In Chapter 3, where we talked about HTTP protocol, we learned that the client (browser) has to send a request and the server has to send a response - this is how the client gets updates from the server.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/HTTP.png)

Let's say a discussion has two participants, Team Leader Potato and Team Member Async. Team Leader Potato creates a new post. This post appears on Team Leader Potato's browser in real time due to reactivity implemented with the help of `mobx` and `mobx-react`. But this new post is not displayed on Team Member Async's browser in real time. In fact, Team Member Async has to manually reload the browser's tab to see a new post.

You can confirm the above UX by logging in to our application with Team Leader Async (your Team Leader user may have different name). Open incognito mode on Chrome and log in to our application with Team Member Async (your Team Member user may have different name). After you are logged in with both accounts, create a new post inside a discussion where both users are participants. Say, create a new post with Team Leader Potato and then look at the incognito browser tab to see what Team Member Async sees. You will find out that Team Leader Potato sees a new post in real time, but Team Member Async does not. Team Member Async has to reload the tab to see the new post. In other words, the browser of Team Member Async has to "poll" the `API` server for new data.

How do we display this new post on Team Member Async's browser? There is no way for the browser of Team Member Async to know when new data is available on the `API` server. Nowadays, we can implement such feature in multiple ways.

We could write code that sends a request from browser to server every 5 seconds or so and checks for new data. If there is new data, our application will re-render all necessary UI. However, this approach is wasteful, especially with single-threaded Node-based server. Imagine 5 users sending a request to the `API` server, on average, every second. This approach, regular polling, may work for very low traffic web applications.

Yet another polling approach is long polling, where the browser sends a request to the server, and the server, instead of responding, keeps a connection open until it gets new data. After the server finally responds with new data, there is code on the browser that sends a request to open a new connection. Since opening a connection consumes a lot of resources, long polling may not be a good solution if your application opens connections very often.

In our SaaS boilerplate, the concept of a discussion is asynchronous communication, not chat. A discussion is designed for slower paced, more thoughtful conversation. Thus, long polling might have worked for us. However, websocket technology will work for both cases - rare updates and frequent updates. Thus, we decided to implement this feature using websockets:

[https://developer.mozilla.org/en-US/docs/Web/API/WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Websockets.png)

As you can see from the above diagram, once a connection is established, many updates (packets) can be exchanged without re-openning the connection each time (long polling).

For creating a new post within a discussion that has two participants, the `API` server can create a discussion room with two connections, like so:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Websockets+(post).png)

Before we move on to actual implementation, it's important to understand that real time updates on the browser are located on the browser. Meaning that inside the `APP` project, when we add all relevant methods to the `DiscussionPageComp` page, we will add them to the life cycle methods, such as `componentDidMount`, that run on the browser. In other words, websocket-related methods that we will define and call will only run on the browser and not on the server - server-side rendering will not execute any of these methods. Certain actions by an end user **on the browser**, such as adding a new post or editing a discussion, will execute these websocket-related methods.

To add real time communication via websockets, we need to implement the following infrastructure:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Websockets+infrastructure+(setup).png)

After an end user takes one of these six actions, the following happens:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Websockets+infrastructure+(in+action).png)

The six actions that we want to have real time updating:

-   add discussion
-   edit discussion
-   delete discussion
-   add post
-   edit post
-   delete post

___

#### API server [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-server)

Since Websockets infrastructure is not typical internal API or external API infrastructure, it is really up to you how to implement it. In this book, we chose to implement the server-side part of the infrastructure first. But your brain may work differently, and you may prefer to start with client-side infrastructure.

A few important notes before we proceed.

Since we have two projects, `APP` that runs on both server and browser and `API` that runs on server only, we will use separate packages for each project.

We will be using the popular `socket.io` package for our `API` project:

[https://www.npmjs.com/package/socket.io](https://www.npmjs.com/package/socket.io)

For our `APP` project, we will use another package from the same authors:

[https://www.npmjs.com/package/socket.io-client](https://www.npmjs.com/package/socket.io-client)

When we set up websockets (also called sockets in this book or client-server websocket connections) on the server, `API` project, we will set `serverClient` option to `false`, since there is no code that runs on the client in our `API` project:

[https://socket.io/docs/client-installation/](https://socket.io/docs/client-installation/)

In `APP` project, we can either get code for `socket.io-client` from CDN or install it using `socket.io-client` package. We chose the latter approach. If you ran `yarn` at the start of this chapter, `APP` project does have `socket.io-client` and `@types/socket.io-client` libraries. And `API` project does have `socket.io` and `@types/socket.io` libraries.

In this subsection, we will work on settings websocket server in our `API` project. Here is what we need to achieve:

-   Define websocket server and configure `cors` and `cookie` options.
-   Add session middlware `sessionMiddleware`, that we defined in Chapter 5, to websocket server
-   On websocket server's `connection` event, run all necessary checks (for example, check if user is logged-in) and group websockets ( browser-server connections) into rooms.
-   Wrap of all of the above into `setupSockets` method, export it, import it and mount it on our Express server.
-   Define so called server-side websocket methods. These methods will be called from inside corresponding Express routes (add/edit/delete discussion or post). Each of these methods, once called, emits message from `API` server to all relevant browsers - to all websockets in the corresponding room minus websocket of the user who initiated change (add/edit/delete discussion or post).

So let's mentally separate the above tasks into two bigger tasks of **server-side** infrastructure for websockets:

-   Define `setupSockets` method (includes server, middleware, `connection` event).
-   Define server-side websocket methods (emit message from server to browser for websockets inside room). Add these methods to the corresponding Express routes (add/edit/delete discussion or post).

___

#### API server - setupSockets method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-server-setupsockets-method)

Setup. Let's check up the official docs on how to initialize websocket server, add middleware to it and mount it on Express server.

Initializing websocket server:

[https://socket.io/docs/v3/server-initialization/index.html](https://socket.io/docs/v3/server-initialization/index.html)

Scroll down to `With Express` example:

```
const app = require('express')();
const server = require('http').createServer(app);
const options = { /* ... */ };
const io = require('socket.io')(server, options);

io.on('connection', socket => { /* ... */ });

server.listen(3000);
```

You could also find initialization that use `new http.Server(app)` instead of `http.createServer(app)`, both approaches result in initialization of http server:

[https://stackoverflow.com/questions/13857747/node-js-http-server-and-http-createserver-whats-the-difference](https://stackoverflow.com/questions/13857747/node-js-http-server-and-http-createserver-whats-the-difference)

Let's adopt the above example. Inside `server/server.ts`, we will have:

```
import * as httpModule from 'http';

// other imports

import { setupSockets } from './sockets';

// some code

const httpServer = httpModule.createServer(server);
setupSockets({ httpServer, origin: process.env.URL_APP, sessionMiddleware });

// some code

httpServer.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

Create a new file `server/sockets.ts` and add an unfinished version of `setupSockets` method to it:

```
import { Server } from 'socket.io';

let io: Server = null;

function setupSockets({ httpServer, origin, sessionMiddleware }) {
  if (io === null) {
    io = new Server(httpServer, {
      cors: {
        // cors options
      },
      cookie: {
        // cookie options
      },
      serveClient: false,
      transports: ['polling', 'websocket'],
    });

    // add session middleware

    // connection event
  }
}

export { setupSockets };
```

`setupSockets` takes `httpServer` server as an argument and mounts websocket server on our Express server. `setupSockets` does it in the same way `setupGoogle` and `setupPasswordless` do it. `setupGoogle` and `setupPasswordless`, each, take `server` server as an argument and mount corresponding middleware and routes on our Express server.

Note that we replaced:

```
server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

With:

```
http.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

Here is an example of how to configure `cors` option for websocket server:

[https://socket.io/docs/v3/handling-cors/](https://socket.io/docs/v3/handling-cors/)

From the above link, scroll to `Example with cookies`:

```
// server-side
const io = require("socket.io")(httpServer, {
  cors: {
    name: 'io',
    origin: "https://example.com",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});
```

`cors` configuration is similar to how we configured `cors` middleware in Chapter 4:

```
server.use(
  cors({
    origin: process.env.URL_APP,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }),
);
```

Let's configure `cors` for websocket server in the same way:

```
io = new Server(httpServer, {
  cors: {
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  },
  cookie: {
    // cookie options
  },
  serveClient: false,
  transports: ['polling', 'websocket'],
});
```

Next, let's find example of how to configure `cookie`:

[https://socket.io/docs/v3/migrating-from-2-x-to-3-0/#No-more-cookie-by-default](https://socket.io/docs/v3/migrating-from-2-x-to-3-0/#No-more-cookie-by-default)

From the above link, scroll to `After`:

```
const io = require("socket.io")(httpServer, {
  cookie: {
    name: "test",
    httpOnly: false,
    path: "/custom"
  }
});
```

We already configured `cookie` for `sessionOptions` in Chapter 5:

```
cookie: {
  httpOnly: true,
  maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
  secure: false,
},
```

Let's configure `cookie` in the same way for websocket server:

```
io = new Server(httpServer, {
  cors: {
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  },
  cookie: {
    name: 'io',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    domain: 'localhost',
    secure: false,
  },
  serveClient: false,
  transports: ['polling', 'websocket'],
});
```

Check up all possible options for `cookie` in `socket.io` library:

[https://github.com/jshttp/cookie/#options](https://github.com/jshttp/cookie/#options)

Next, let's see how official `socket.io` docs prescribe adding of Express middleware to websocket server:

[https://socket.io/docs/v3/middlewares/#Compatibility-with-Express-middleware](https://socket.io/docs/v3/middlewares/#Compatibility-with-Express-middleware)

Scroll to `Compatibility with Express middleware`:

```
const session = require("express-session");

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(session({ secret: "cats" })));

io.on("connection", (socket) => {
  const session = socket.request.session;
});
```

In our case, we pretty much follow the above example, but with two differences:

-   We pass `sessionMiddleware` from our Express server to `setupSockets` method as an argument.
-   We specify type for `res` to be `Response` (since we are using TypeScript).

Like so:

```
const wrap = (middleware) => (socket, next) => middleware(socket.request, {} as Response, next);

io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
  // do checks

  // add websockets into rooms
});
```

Put all knowns together into `server/sockets.ts` file, you should get:

```
import { Response } from 'express';
import { Server } from 'socket.io';

let io: Server = null;

function setupSockets({ httpServer, origin, sessionMiddleware }) {
  if (io === null) {
    io = new Server(httpServer, {
      cors: {
        origin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
      },
      cookie: {
        name: 'io',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
        domain: 'localhost',
        secure: false,
      },
      serveClient: false,
      transports: ['polling', 'websocket'],
    });

    const wrap = (middleware) => (socket, next) => middleware(socket.request, {} as Response, next);

    io.use(wrap(sessionMiddleware));

    io.on('connection', (socket) => {
      // do checks

      // add websockets into rooms
    });
  }
}

export { setupSockets };
```

`io.use` registers (mounts) a middleware, a function that executes for every websocket:

[https://socket.io/docs/v3/server-api/index.html#namespace-use-fn](https://socket.io/docs/v3/server-api/index.html#namespace-use-fn)

An example of usage from the above link:

```
io.use((socket, next) => {
  const err = new Error("not authorized");
  err.data = { content: "Please retry later" }; // additional details
  next(err);
});
```

We used it like this:

```
io.use(wrap(sessionMiddleware));
```

Event `connect` fires upon client (browser) connection to server - creation of websocket:

[https://socket.io/docs/v3/server-api/index.html#Event-%E2%80%98connect%E2%80%99](https://socket.io/docs/v3/server-api/index.html#Event-%E2%80%98connect%E2%80%99)

An example of usage from official docs:

```
io.on('connection', (socket) => {
  // ...
});
```

We used like this but haven't finished defining what happens upon connection:

```
io.on('connection', (socket) => {
  // do checks

  // add websockets into rooms
});
```

Once a client-server connection (websocket) is established (`io.on`), we want to do a few things. We want to check if an end user of our application is logged in with either Google OAuth API (`socket.request.session.passport.user` is truthy) or Passwordless API (`socket.request.session.passwordless` is truthy) methods. If not, we will disconnect the websocket connection using `socket.disconnect` method ([https://socket.io/docs/v3/server-api/index.html#socket-disconnect-close](https://socket.io/docs/v3/server-api/index.html#socket-disconnect-close)) :

```
if (
  !socket.request.session ||
  ((!socket.request.session.passport || !socket.request.session.passport.user) &&
    !socket.request.session.passwordless)
) {
  socket.disconnect(true);
  return;
}
```

Second thing to do inside `connection` event. We would like our server to listen for emitted events from connected browsers and group these connections (websockets) into groups (rooms):

[https://socket.io/docs/rooms/](https://socket.io/docs/rooms/)

To understand rooms better, imagine that a team in our application has 3 team members. For every end user on the browser, when `DiscussionPageComp` loads, our application will emit an event that contains a unique `teamId`. Our server detects this emitted event and takes these 3 websockets (client-server socket connections) and puts them into a unique room. The room's name contains `teamId`, thus making the room unique and making sure only sockets with the user who has all permissions are grouped in the room:

![Builder Book](https://user-images.githubusercontent.com/10218864/103551691-91359680-4e5f-11eb-9c2a-ea987c5b59b5.png)

Then, say, a discussion's creator edits the discussion's name - the discussion's creator sees a real time update (because of `mobx` and `mobx-react`) and the other 2 team members will see a real time update because their websockets are in the same room as the discussion creator's websockets. This is how rooms work in `socket.io`.

![Builder Book](https://user-images.githubusercontent.com/10218864/103551762-b0ccbf00-4e5f-11eb-84eb-1750eb6ab5cd.png)

So how do we actually group websockets into room? We create a unique event, for example, `joinTeamRoom`. When each team member loads browser, each browser will emit this event to server. Then on server we detect these emitted messages using:

```
socket.on(eventName, callback)
```

Official docs:

[https://socket.io/docs/v3/server-api/index.html#socket-on-eventName-callback](https://socket.io/docs/v3/server-api/index.html#socket-on-eventName-callback)

And call `socket.join` method ([https://socket.io/docs/v3/server-api/index.html#socket-join-room](https://socket.io/docs/v3/server-api/index.html#socket-join-room)) to group websockets into room with name `teamRoom-${teamId}`:

```
socket.on('joinTeamRoom', (teamId) => {
  console.log(`    joinTeamRoom ${teamId}`);
  socket.join(`teamRoom-${teamId}`);
});
```

Removing websockets from a room can be done by calling `socket.leave` method ([https://socket.io/docs/v3/server-api/index.html#socket-leave-room](https://socket.io/docs/v3/server-api/index.html#socket-leave-room)):

```
socket.on('leaveTeamRoom', (teamId) => {
  console.log(`** leaveTeamRoom ${teamId}`);
  socket.leave(`teamRoom-${teamId}`);
});
```

Based on the above example, let's define another room, `discussionRoom-${discussionId}`:

```
socket.on('joinDiscussionRoom', (discussionId) => {
  console.log(`    joinDiscussionRoom ${discussionId}`);
  socket.join(`discussionRoom-${discussionId}`);
});

socket.on('leaveDiscussionRoom', (discussionId) => {
  console.log(`** leaveDiscussionRoom ${discussionId}`);
  socket.leave(`discussionRoom-${discussionId}`);
});
```

Note that for add/edit/delete of a discussion changes, the room has a name `teamRoom-${teamId}`. For add/edit/delete of a post changes, the room has a name `discussionRoom-${discussionId}`.

At this point, we are ready to put the `setupSockets` method together:

```
function setupSockets({ httpServer, origin, sessionMiddleware }) {
  if (io === null) {
    io = new Server(httpServer, {
      cors: {
        origin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
      },
      cookie: {
        name: 'io',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
        domain: 'localhost',
        secure: false,
      },
      serveClient: false,
      transports: ['polling', 'websocket'],
    });

    const wrap = (middleware) => (socket, next) => middleware(socket.request, {} as Response, next);

    io.use(wrap(sessionMiddleware));

    io.on('connection', (socket: any) => {
      if (
        !socket.request.session ||
        ((!socket.request.session.passport || !socket.request.session.passport.user) &&
          !socket.request.session.passwordless)
      ) {
        socket.disconnect();
        return;
      }

      socket.on('joinTeamRoom', (teamId) => {
        console.log(`    joinTeamRoom ${teamId}`);
        socket.join(`teamRoom-${teamId}`);
      });

      socket.on('leaveTeamRoom', (teamId) => {
        console.log(`** leaveTeamRoom ${teamId}`);
        socket.leave(`teamRoom-${teamId}`);
      });

      socket.on('joinDiscussionRoom', (discussionId) => {
        console.log(`    joinDiscussionRoom ${discussionId}`);
        socket.join(`discussionRoom-${discussionId}`);
      });

      socket.on('leaveDiscussionRoom', (discussionId) => {
        console.log(`** leaveDiscussionRoom ${discussionId}`);
        socket.leave(`discussionRoom-${discussionId}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`disconnected`, `reason: ` + reason);
      });
    });
  }
}
```

We printed disconnection using `disconnect` event that executes upon websocket disconnection:

[https://socket.io/docs/v3/server-api/index.html#Event-%E2%80%98disconnect%E2%80%99](https://socket.io/docs/v3/server-api/index.html#Event-%E2%80%98disconnect%E2%80%99)

Used like so:

```
io.on('connection', (socket) => {
  socket.on('disconnect', (reason) => {
    // ...
  });
});
```

___

#### API server - server-side websocket methods [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-server-server-side-websocket-methods)

In the previous subsection, we discussed how our `API` server adds websockets to a room. Each team member's browser emits message to `API` server, server recognizes event by its name and creates a corresponding room. But we have **not** discussed how change created by Team Member 1 on browser 1 propagates to the browsers of Team Member 2 and Team Member 3. Creating room does not mean that change from one connected browser will propagate to the rest of connected browsers. In other words, we have not discussed how the rest of websockets inside the room get the change initialized by one of room's websockets.

![Builder Book](https://user-images.githubusercontent.com/10218864/103551762-b0ccbf00-4e5f-11eb-84eb-1750eb6ab5cd.png)

Real time changes on Team Member 1's browser is due to `mobx` and `mobx-react` packages. Changes to the rest of connected browsers is because of so called server-side websocket methods. For each of 6 possible changes, add/edit/delete of a discussion and add/edit/delete of a post, we will define a corresponding server-side websocket method:

-   `discussionAdded`
-   `discussionEdited`
-   `discussionDeleted`
-   `postAdded`
-   `postEdited`
-   `postDeleted`

Then, when Team Member 1 initializes change, for example, edits a discussion, inside corresponding Express route `/discussions/edit`, we will call server-side websocket method `discussionEdited`, like so:

```
router.post('/discussions/edit', async (req: any, res, next) => {
  try {
    const { name, id, memberIds = [], socketId } = req.body;

    const updatedDiscussion = await Discussion.edit({
      userId: req.user.id,
      name,
      id,
      memberIds,
    });

    discussionEdited({ socketId, discussion: updatedDiscussion });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});
```

In other words, browser of the user who is initiator of the change, will send `socketId` to our `API` server and then call `discussionEdited` method via corresponding Express route (one of 6).

So what do we want to achieve by calling server-side websocket method `discussionEdited`? The following:

```
function discussionEdited({
  socketId,
  discussion,
}: {
  socketId?: string;
  discussion: DiscussionDocument;
}) {
  const roomName = `teamRoom-${discussion.teamId}`;
  const socket = getSocket(socketId);

  if (socket) {
    socket.to(roomName).emit('discussionEvent', {
      action: 'edited',
      discussion,
    });
  }
}
```

We used `to` and `emit` to broadcast change to particular room by emitting a particular event:

[https://socket.io/docs/v3/server-api/index.html#socket-to-room](https://socket.io/docs/v3/server-api/index.html#socket-to-room)

Usage example:

```
socket.to('others').emit('an event', { some: 'data' });
```

How do we ensure that event is not emitted back to the browser of the user who initiated a change? We don't want to include this user since real time update is implemented with `mobx` and `mobx-react` already. `socket.io` library provides us with `broadcast` flag that selects all websockets excepts for the sender:

[https://socket.io/docs/v3/broadcasting-events/#To-all-connected-clients-except-the-sender](https://socket.io/docs/v3/broadcasting-events/#To-all-connected-clients-except-the-sender)

Usage example:

```
socket.broadcast.emit('an event', { some: 'data' }); // everyone gets it but the sender
```

As you see from the definition of `discussionEdited` method, we get `socket` by calling `getSocket` method. This is where we use `broadcast` flag to remove initiating browser:

```
function getSocket(socketId?: string) {
  if (!io) {
    return null;
  }

  if (socketId && io.sockets.sockets.get(socketId)) {
    return io.sockets.sockets.get(socketId).broadcast;
  } else {
    return io;
  }
}
```

`io.sockets.sockets.get(socketId).broadcast` returns all connected websockets minus initiator's websocket.

`io` returns all connected websockets.

So later, inside `discussionEdited`, when we call:

```
socket.to(roomName).emit(...)
```

We emit event to either all connected websockets in the room minus initiator's websocket or all connected websockets in the room.

`socketId` might be falsy if it did not get passed from initiator's browser to our server for some reason, for example, websocket is disconnected.

We defined 1 out of 6 server-side websocket methods, based on the example of `discussionEdited`, define five more method:

```
function discussionAdded({
  socketId,
  discussion,
}: {
  socketId?: string;
  discussion: DiscussionDocument;
}) {
  const roomName = `teamRoom-${discussion.teamId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('discussionEvent', { action: 'added', discussion });
  }
}

function discussionEdited({
  socketId,
  discussion,
}: {
  socketId?: string;
  discussion: DiscussionDocument;
}) {
  const roomName = `teamRoom-${discussion.teamId}`;
  const socket = getSocket(socketId);

  if (socket) {
    socket.to(roomName).emit('discussionEvent', {
      action: 'edited',
      discussion,
    });
  }
}

function discussionDeleted({
  socketId,
  teamId,
  id,
}: {
  socketId?: string;
  teamId: string;
  id: string;
}) {
  const roomName = `teamRoom-${teamId}`;
  const socket = getSocket(socketId);

  if (socket) {
    socket.to(roomName).emit('discussionEvent', { action: 'deleted', id });
  }
}

function postAdded({ socketId, post }: { socketId?: string; post: PostDocument }) {
  const roomName = `discussionRoom-${post.discussionId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('postEvent', { action: 'added', post });
  }
}

function postEdited({ socketId, post }: { socketId?: string; post: PostDocument }) {
  const roomName = `discussionRoom-${post.discussionId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('postEvent', { action: 'edited', post });
  }
}

function postDeleted({
  socketId,
  id,
  discussionId,
}: {
  socketId?: string;
  id: string;
  discussionId: string;
}) {
  const roomName = `discussionRoom-${discussionId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('postEvent', { action: 'deleted', id });
  }
}
```

Add the above 6 methods plus `getSocket` method to the `api/server/sockets.ts` file:

```
import { Response } from 'express';
import { Server } from 'socket.io';

import { DiscussionDocument } from './models/Discussion';
import { PostDocument } from './models/Post';

let io: Server = null;
// const dev = process.env.NODE_ENV !== 'production';

function setupSockets({ httpServer, origin, sessionMiddleware }) {
  if (io === null) {
    io = new Server(httpServer, {
      cors: {
        origin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
      },
      cookie: {
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
        domain: 'localhost',
        secure: false,
      },
      serveClient: false,
      transports: ['polling', 'websocket'],
    });

    const wrap = (middleware) => (socket, next) => middleware(socket.request, {} as Response, next);

    io.use(wrap(sessionMiddleware));

    io.on('connection', (socket) => {
      if (
        !socket.request.session ||
        ((!socket.request.session.passport || !socket.request.session.passport.user) &&
          !socket.request.session.passwordless)
      ) {
        socket.disconnect();
        return;
      }

      socket.on('joinTeamRoom', (teamId) => {
        console.log(`    joinTeamRoom ${teamId}`);
        socket.join(`teamRoom-${teamId}`);
      });

      socket.on('leaveTeamRoom', (teamId) => {
        console.log(`** leaveTeamRoom ${teamId}`);
        socket.leave(`teamRoom-${teamId}`);
      });

      socket.on('joinDiscussionRoom', (discussionId) => {
        console.log(`    joinDiscussionRoom ${discussionId}`);
        socket.join(`discussionRoom-${discussionId}`);
      });

      socket.on('leaveDiscussionRoom', (discussionId) => {
        console.log(`** leaveDiscussionRoom ${discussionId}`);
        socket.leave(`discussionRoom-${discussionId}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`disconnected`, `reason: ` + reason);
      });
    });
  }
}

function getSocket(socketId?: string) {
  if (!io) {
    return null;
  }

  if (socketId && io.sockets.sockets.get(socketId)) {
    return io.sockets.sockets.get(socketId).broadcast;
  } else {
    return io;
  }
}

function discussionAdded({
  socketId,
  discussion,
}: {
  socketId?: string;
  discussion: DiscussionDocument;
}) {
  const roomName = `teamRoom-${discussion.teamId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('discussionEvent', { actionType: 'added', discussion });
  }
}

function discussionEdited({
  socketId,
  discussion,
}: {
  socketId?: string;
  discussion: DiscussionDocument;
}) {
  const roomName = `teamRoom-${discussion.teamId}`;
  const socket = getSocket(socketId);

  if (socket) {
    socket.to(roomName).emit('discussionEvent', {
      actionType: 'edited',
      discussion,
    });
  }
}

function discussionDeleted({
  socketId,
  teamId,
  id,
}: {
  socketId?: string;
  teamId: string;
  id: string;
}) {
  const roomName = `teamRoom-${teamId}`;
  const socket = getSocket(socketId);

  if (socket) {
    socket.to(roomName).emit('discussionEvent', { actionType: 'deleted', id });
  }
}

function postAdded({ socketId, post }: { socketId?: string; post: PostDocument }) {
  const roomName = `discussionRoom-${post.discussionId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('postEvent', { actionType: 'added', post });
  }
}

function postEdited({ socketId, post }: { socketId?: string; post: PostDocument }) {
  const roomName = `discussionRoom-${post.discussionId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('postEvent', { actionType: 'edited', post });
  }
}

function postDeleted({
  socketId,
  id,
  discussionId,
}: {
  socketId?: string;
  id: string;
  discussionId: string;
}) {
  const roomName = `discussionRoom-${discussionId}`;

  const socket = getSocket(socketId);
  if (socket) {
    socket.to(roomName).emit('postEvent', { actionType: 'deleted', id });
  }
}

export {
  setupSockets,
  postAdded,
  postEdited,
  postDeleted,
  discussionAdded,
  discussionEdited,
  discussionDeleted,
};
```

Please do remember to update 6 corresponding Express routes so that we get the `socketId` value from the request's body and call corresponding websocket method. Open `api/server/api/team-member.ts` and make the following changes:

```
router.post('/discussions/add', async (req: any, res, next) => {
  try {
    const { name, teamId, memberIds = [], socketId } = req.body;

    const discussion = await Discussion.add({
      userId: req.user.id,
      name,
      teamId,
      memberIds,
    });

    discussionAdded({ socketId, discussion });

    res.json({ discussion });
  } catch (err) {
    next(err);
  }
});

router.post('/discussions/edit', async (req: any, res, next) => {
  try {
    const { name, id, memberIds = [], socketId } = req.body;

    const updatedDiscussion = await Discussion.edit({
      userId: req.user.id,
      name,
      id,
      memberIds,
    });

    discussionEdited({ socketId, discussion: updatedDiscussion });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/discussions/delete', async (req: any, res, next) => {
  try {
    const { id, socketId } = req.body;

    const { teamId } = await Discussion.delete({ userId: req.user.id, id });

    discussionDeleted({ socketId, teamId, id });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

// some code

router.post('/posts/add', async (req: any, res, next) => {
  try {
    const { content, discussionId, socketId } = req.body;

    const post = await Post.add({ userId: req.user.id, content, discussionId });

    postAdded({ socketId, post });

    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/edit', async (req: any, res, next) => {
  try {
    const { content, id, socketId } = req.body;

    const updatedPost = await Post.edit({ userId: req.user.id, content, id });

    postEdited({ socketId, post: updatedPost });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/delete', async (req: any, res, next) => {
  try {
    const { id, discussionId, socketId } = req.body;

    await Post.delete({ userId: req.user.id, id });

    postDeleted({ socketId, id, discussionId });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});
```

As always, remember to add missing import statements:

```
import {
  discussionAdded,
  discussionDeleted,
  discussionEdited,
  postAdded,
  postDeleted,
  postEdited,
} from '../sockets';
```

___

#### APP client [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#app-client)

In this subsection, we will make additions to our `APP` project. In the `API` project, we set up rooms after receiving corresponding room events from connected browsers and code that emit events with initiated change to all connected browsers minus initiator's browser inside room.

In our `APP` project, on one hand, we need to write code that emits room events from browser to server, so that the `API` server can set up all rooms. This code needs to run after `DiscussionPageComp` page loads on the browsers of all team members. On the other hand, we need to define methods that listen for emitted events from the server once the server knows that a change has been initiated. Once the browser detects such change, it will run store methods to re-render UI and display the corresponding change on all connected browser minus initiator's browser. In addition to these two big tasks, we need to make sure 6 store methods do pass the `socketId` parameter inside the request's body so that the Express routes we discussed in the previous subsection can access it.

So to summarize:

1.  Once `DiscussionPageComp` page loads, emit room events so our server can add relevant websockets to rooms.
2.  Define so called listeners on the browser that listen to events from our server after change is initiated, for example, `discussionEvent` event. We use `socket.on(eventName, callback)` from `socket.io` Client API: [https://socket.io/docs/v3/client-api/#socket-on-eventName-callback](https://socket.io/docs/v3/client-api/#socket-on-eventName-callback)
3.  Define `socket` inside `store`. Update 6 store methods to make sure that `socketId` value gets send from initiator's browser to `API` server.

Let's start with the third task. Open `book/8-begin/app/lib/api/team-member.ts`, look at the API methods that correspond to add/edit/delete of a discussion and post. For example, `addPostApiMethod`:

```
export const addPostApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/posts/add`, {
    body: JSON.stringify(data),
  });
```

`socketId` can be included into the `data` object argument, so there is no need to make any change to the API methods. But we do need to update the 6 corresponding store methods.

Open `book/8-begin/app/lib/store/team.ts` and update two store methods by adding the `socketId` property to the `data` object like this:

```
public async addDiscussion(data): Promise<Discussion> {
  const { discussion } = await addDiscussionApiMethod({
    teamId: this._id,
    socketId: (this.store.socket && this.store.socket.id) || null,
    ...data,
  });

  return new Promise<Discussion>((resolve) => {
    runInAction(() => {
      const obj = this.addDiscussionToLocalCache(discussion);
      resolve(obj);
    });
  });
}

// some code

public async deleteDiscussion(id: string) {
  await deleteDiscussionApiMethod({
    id,
    socketId: (this.store.socket && this.store.socket.id) || null,
  });

  runInAction(() => {
    this.deleteDiscussionFromLocalCache(id);

    const discussion = this.discussions.find((d) => d._id === id);

    if (this.currentDiscussion === discussion) {
      this.currentDiscussion = null;
      this.currentDiscussionSlug = null;

      if (this.discussions.length > 0) {
        const d = this.discussions[0];

        Router.push(
          `/discussion?teamSlug=${this.slug}&discussionSlug=${d.slug}`,
          `/team/${this.slug}/discussions/${d.slug}`,
        );
      } else {
        Router.push(`/discussion?teamSlug=${this.slug}`, `/team/${this.slug}/discussions`);
      }
    }
  });
}
```

Open `book/8-begin/app/lib/store/discussion.ts` and update three store methods like this:

```
public async editDiscussion(data) {
  try {
    await editDiscussionApiMethod({
      id: this._id,
      ...data,
      socketId: (this.store.socket && this.store.socket.id) || null,
    });

    runInAction(() => {
      this.changeLocalCache(data);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// some code

public async addPost(content: string): Promise<Post> {
  const { post } = await addPostApiMethod({
    discussionId: this._id,
    content,
    socketId: (this.store.socket && this.store.socket.id) || null,
  });

  return new Promise<Post>((resolve) => {
    runInAction(() => {
      const obj = this.addPostToLocalCache(post);
      resolve(obj);
    });
  });
}

// some code

public async deletePost(post: Post) {
  await deletePostApiMethod({
    id: post._id,
    discussionId: this._id,
    socketId: (this.store.socket && this.store.socket.id) || null,
  });

  runInAction(() => {
    this.posts.remove(post);
  });
}
```

Finally, open `book/8-begin/app/lib/store/post.ts` and update it:

```
public async editPost(data) {
  try {
    await editPostApiMethod({
      id: this._id,
      content: data.content,
      socketId: (this.store.socket && this.store.socket.id) || null,
    });

    runInAction(() => {
      this.changeLocalCache(data);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

Since we used `this.store.socket`, we need to define `socket` inside main store, thus making `this.store.socket.id` accessible. Main store is located in our `book/8-begin/app/lib/store/index.ts` file. Open this file and make the following changes:

-   Add import statement:
    
    ```
      // @ts-expect-error no exported member io socket.io-client
      import { io } from 'socket.io-client';
    ```
    
-   Add property `socket` to main store:
    
    ```
      public socket: SocketIOClient.Socket;
    ```
    
-   Add initial value for `store.socket` by adding following to `Store.constructor` method:
    
    ```
      this.socket = socket;
    
      if (socket) {
        socket.on('disconnect', () => {
          console.log('socket: ## disconnected');
        });
    
        socket.on('reconnect', (attemptNumber) => {
          console.log('socket: $$ reconnected', attemptNumber);
        });
      }
    ```
    
-   Define `store` inside the `initializeStore` method:
    
    ```
      const socket = isServer
        ? null
        : io(process.env.NEXT_PUBLIC_URL_API, {
            reconnection: true,
            autoConnect: true,
            transports: ['polling', 'websocket'],
            withCredentials: true,
          });
    ```
    
    Note that the option `reconnection: true` is by default. We passed values to `reconnection`, `autoConnect` and `transports` to demonstrate that such option exists:
    
    [https://socket.io/docs/v3/client-api/#new-Manager-url-options](https://socket.io/docs/v3/client-api/#new-Manager-url-options)
    
    It's important to set `withCredentials: true` since in v3 of `socket.io` library `cookie` does not get created by default.
    
-   Pass `socket` when creating main store within the `initializeStore` method. Add it lije this, before:
    
    ```
      const _store = (store !== null && store !== undefined) ? store : new Store({ initialState, isServer });
    ```
    
    After:
    
    ```
      const _store = (store !== null && store !== undefined) ? store : new Store({ initialState, isServer, socket });
    ```
    

Let's also call `setInitialTeamsStoreMethod` method inside `Store.constructor` method:

```
if (initialState.teams && initialState.teams.length > 0) {
  this.setInitialTeamsStoreMethod(initialState.teams);
}
```

And define it:

```
private setInitialTeamsStoreMethod(teams: any[]) {
  // console.log(initialTeams);

  const teamObjs = teams.map((t) => new Team({ store: this, ...t }));

  this.teams.replace(teamObjs);
}
```

In Chapter 7 we passed initial teams from the `api` server to `app` (via '/get-initial-data' Express route) but so far we haven't done anything with initial teams. Here, we populate `store.teams` with initial teams for logged-in user. After all changes, your file should have following content:

```
import * as mobx from 'mobx';
import { action, decorate, IObservableArray, observable } from 'mobx';
import { useStaticRendering } from 'mobx-react';
// @ts-expect-error no exported member io socket.io-client
import { io } from 'socket.io-client';

import { addTeamApiMethod, getTeamInvitationsApiMethod } from '../api/team-leader';
import { getTeamListApiMethod, getTeamMembersApiMethod } from '../api/team-member';

import { User } from './user';
import { Team } from './team';

useStaticRendering(typeof window === 'undefined');

mobx.configure({ enforceActions: 'observed' });

class Store {
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  public currentTeam?: Team;

  public teams: IObservableArray<Team> = observable([]);

  public socket: SocketIOClient.Socket;

  constructor({
    initialState = {},
    isServer,
    socket = null,
  }: {
    initialState?: any;
    isServer: boolean;
    socket?: SocketIOClient.Socket;
  }) {
    this.isServer = !!isServer;

    this.setCurrentUser(initialState.user);

    this.currentUrl = initialState.currentUrl || '';

    // console.log(initialState.user);

    if (initialState.teamSlug || (initialState.user && initialState.user.defaultTeamSlug)) {
      this.setCurrentTeam(
        initialState.teamSlug || initialState.user.defaultTeamSlug,
        initialState.teams,
      );
    }

    if (initialState.teams && initialState.teams.length > 0) {
      this.setInitialTeamsStoreMethod(initialState.teams);
    }

    this.socket = socket;

    if (socket) {
      socket.on('disconnect', () => {
        console.log('socket: ## disconnected');
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('socket: $$ reconnected', attemptNumber);
      });
    }
  }

  public changeCurrentUrl(url: string) {
    this.currentUrl = url;
  }

  public async setCurrentUser(user) {
    if (user) {
      this.currentUser = new User({ store: this, ...user });
    } else {
      this.currentUser = null;
    }
  }

  public async addTeam({ name, avatarUrl }: { name: string; avatarUrl: string }): Promise<Team> {
    const data = await addTeamApiMethod({ name, avatarUrl });
    const team = new Team({ store: this, ...data });

    return team;
  }

  public async setCurrentTeam(slug: string, initialTeams: any[]) {
    if (this.currentTeam) {
      if (this.currentTeam.slug === slug) {
        return;
      }
    }

    let found = false;

    const teams = initialTeams || (await getTeamListApiMethod()).teams;

    for (const team of teams) {
      if (team.slug === slug) {
        found = true;
        this.currentTeam = new Team({ ...team, store: this });

        const users =
          team.initialMembers || (await getTeamMembersApiMethod(this.currentTeam._id)).users;

        const invitations =
          team.initialInvitations ||
          (await getTeamInvitationsApiMethod(this.currentTeam._id)).invitations;

        this.currentTeam.setInitialMembersAndInvitations(users, invitations);

        break;
      }
    }

    if (!found) {
      this.currentTeam = null;
    }
  }

  private setInitialTeamsStoreMethod(teams: any[]) {
    // console.log(initialTeams);

    const teamObjs = teams.map((t) => new Team({ store: this, ...t }));

    this.teams.replace(teamObjs);
  }
}

decorate(Store, {
  currentUser: observable,
  currentUrl: observable,
  currentTeam: observable,

  changeCurrentUrl: action,
  setCurrentUser: action,
  setCurrentTeam: action,
});

let store: Store = null;

function initializeStore(initialState = {}) {
  const isServer = typeof window === 'undefined';

  const socket = isServer
    ? null
    : io(process.env.NEXT_PUBLIC_URL_API, {
        reconnection: true,
        autoConnect: true,
        transports: ['polling', 'websocket'],
        withCredentials: true,
      });

  const _store =
    store !== null && store !== undefined ? store : new Store({ initialState, isServer, socket });

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') {
    return _store;
  }
  // Create the store once in the client
  if (!store) {
    store = _store;
  }

  // console.log(_store);

  return _store;
}

function getStore() {
  return store;
}

export { Store, initializeStore, getStore };
```

Done! This will ensure that the `socketId` value travels from the browser of the user who initiated change (say, edited discussion) to our `API` server, where it will be used to exclude the initiator of an update from the room's connected browsers before change is broadcasted. Keep in mind that in this book, we wrote a lot of code to exclude the initiator of an update from the server's broadcast. You may choose not to do it in your web application.

We are done with the easiest of three tasks. The two other tasks are:

1.  Once `DiscussionPageComp` page loads, emit room events so our server can add relevant websockets to rooms.
2.  Define so called listeners on the browser that listen to events from our server after change is initiated, for example, `discussionEvent` event. We use `socket.on(eventName, callback)` from `socket.io` Client API: [https://socket.io/docs/v3/client-api/#socket-on-eventName-callback](https://socket.io/docs/v3/client-api/#socket-on-eventName-callback)

Below, we implement these two functionalities.

1.  Since real time updates are for client-side rendering and not for server-side rendering, we must place code that emits events into appropriate lifecycle hooks instead of `getInitialProps`. You've already used `componentDidMount` in this book on multiple occasions. It makes sense to put code that emits events to the server to group sockets into rooms inside `componentDidMount` hook, since it fires after a component mounts on the browser:
    
    [https://reactjs.org/docs/react-component.html#componentdidmount](https://reactjs.org/docs/react-component.html#componentdidmount)
    
    Inside the `componentDidMount` life cycle method, our web application calls the store method `joinSocketRooms` of the `Discussion` data store. This store method, which we define below, emits so called room events that our `API` server registers and groups relevant websockets into corresponding rooms. In other words, every time an end user loads `DiscussionPageComp` on the browser, the browser will add this connection (websocket) to the appropriate rooms. In this book, we created two rooms, room `teamRoom-${teamId}` for changes related to add/edit/delete of a discussion and room `discussionRoom-${discussionId}` for changes related to add/edit/delete of a post.
    
    ```
     public componentDidMount() {
       const { discussionSlug } = this.props;
    
       const discussion = this.getDiscussion(discussionSlug);
    
       if (discussion) {
         discussion.joinSocketRooms();
       }
     }
    ```
    
    The `componentWillUnmount` life cycle method fires right before the component unmounts from the browser:
    
    [https://reactjs.org/docs/react-component.html#componentwillunmount](https://reactjs.org/docs/react-component.html#componentwillunmount)
    
    Say an end user moves to the `TeamSettings` page from the `DiscussionPageComp` page - `DiscussionPageComp.componentWillUnmount` will fire just before `DiscussionPageComp` is unmounted and deleted. The `componentWillUnmount` life cycle method calls the store method `leaveSocketRoom` of the `Discussion` data store. `leaveSocketRoom` emits events that are registered by the server and trigger ungrouping of sockets from rooms:
    
    ```
     public componentWillUnmount() {
       const { discussionSlug } = this.props;
    
       const discussion = this.getDiscussion(discussionSlug);
    
       if (discussion) {
         discussion.leaveSocketRoom();
       }
     }
    ```
    
    We will define `joinSocketRooms` and `leaveSocketRoom` methods in a bit.
    
    The `componentDidUpdate` life cycle method fires immediately after a component updates but not on the initial render event:
    
    [https://reactjs.org/docs/react-component.html#componentdidupdate](https://reactjs.org/docs/react-component.html#componentdidupdate)
    
    This method fires every time an end user switches between discussions on the list of discussions. Same component, different props:
    
    ```
     public componentDidUpdate(prevProps: Props) {
       const { discussionSlug, isServer } = this.props;
    
       if (prevProps.discussionSlug !== discussionSlug) {
         if (prevProps.discussionSlug) {
           const prevDiscussion = this.getDiscussion(prevProps.discussionSlug);
           if (prevDiscussion) {
             prevDiscussion.leaveSocketRoom();
           }
         }
    
       const discussion = this.getDiscussion(discussionSlug);
    
       if (!isServer && discussion) {
         discussion.loadPosts().catch((err) => notify(err));
       }
    
         if (discussion) {
           discussion.joinSocketRooms();
         }
       }
     }
    ```
    
    For the previous discussion, we want to ungroup websockets from old rooms (remember, our rooms' names are made of a unique team id and discussion id). For the new discussion, we want to group websockets into new rooms.
    
    The next step is define the `joinSocketRooms` and `leaveSocketRoom` store methods. Open `book/8-begin/app/lib/store/discussion.ts` and under the store method `deletePost`, add two new store methods:
    
    ```
     public joinSocketRooms() {
       if (this.store.socket) {
         console.log('joining socket discussion room', this.name);
         this.store.socket.emit('joinTeamRoom', this.team._id);
         this.store.socket.emit('joinDiscussionRoom', this._id);
       }
     }
    
     public leaveSocketRoom() {
       if (this.store.socket) {
         console.log('leaving socket discussion room', this.name);
         this.store.socket.emit('leaveTeamRoom', this.team._id);
         this.store.socket.emit('leaveDiscussionRoom', this._id);
       }
     }
    ```
    
    So now you can see that for every browser that loads the `DiscussionPageComp` page, the browser emits two room events that get registered by the `API` server. The `API` server adds websockets one by one to two rooms, one with the name `teamRoom-${teamId}`and another with the name `discussionRoom-${discussionId}`. The `API` server registers events and adds websockets to rooms because of the code we wrote in the previous subsection (`api/server/sockets.ts`). Note that event names match between the browser and the server:
    
    ```
     socket.on('joinTeamRoom', (teamId) => {
       console.log(`    joinTeamRoom ${teamId}`);
       socket.join(`teamRoom-${teamId}`);
     });
    
     socket.on('leaveTeamRoom', (teamId) => {
       console.log(`** leaveTeamRoom ${teamId}`);
       socket.leave(`teamRoom-${teamId}`);
     });
    
     socket.on('joinDiscussionRoom', (discussionId) => {
       console.log(`    joinDiscussionRoom ${discussionId}`);
       socket.join(`discussionRoom-${discussionId}`);
     });
    
     socket.on('leaveDiscussionRoom', (discussionId) => {
       console.log(`** leaveDiscussionRoom ${discussionId}`);
       socket.leave(`discussionRoom-${discussionId}`);
     });
    ```
    
    Every time an end user switches between discussions or navigates away, websockets get ungrouped and grouped
    
    For two team members, we should see:
    
    ```
     console.log(`joinTeamRoom ${teamId}`);
    ```
    
    printed twice on the logs of the `API` server, if both end users load the same discussion page (same component and props).
    
    For a discussion with five participants, we should see:
    
    ```
     console.log(`joinDiscussionRoom ${discussionId}`);
    ```
    
    printed five times if every user loads the same discussion page.
    
    We are done with first task!
    
2.  Here we need to add browser code that registers events emitted by the server. In other words, we need to define so called listeners. So instead of `socket.emit` like we did on the server, we will be using `socket.on` to listen to emitted messages:
    
    [https://socket.io/docs/v3/client-api/#socket-on-eventName-callback](https://socket.io/docs/v3/client-api/#socket-on-eventName-callback)
    
    Usage example:
    
    ```
     socket.on('news', (data) => {
       console.log(data);
     });
    ```
    
    So syntax is `socket.on(eventName, callback)`.
    
    We add listeners (register listeners) like so
    
    ```
     public componentDidMount() {
       const { discussionSlug, store } = this.props;
    
       const discussion = this.getDiscussion(discussionSlug);
    
       if (discussion) {
         discussion.joinSocketRooms();
       }
    
       store.socket.on('discussionEvent', this.handleDiscussionEvent);
       store.socket.on('postEvent', this.handlePostEvent);
       store.socket.on('reconnect', this.handleSocketReconnect);
     }
    
     public componentWillUnmount() {
       const { discussionSlug, store } = this.props;
    
       const discussion = this.getDiscussion(discussionSlug);
    
       if (discussion) {
         discussion.leaveSocketRoom();
       }
    
       store.socket.off('discussionEvent', this.handleDiscussionEvent);
       store.socket.off('postEvent', this.handlePostEvent);
       store.socket.off('reconnect', this.handleSocketReconnect);
     }
    
     public componentDidUpdate(prevProps: Props) {
       const { discussionSlug, isServer, store } = this.props;
    
       if (prevProps.discussionSlug !== discussionSlug) {
         if (prevProps.discussionSlug) {
           const prevDiscussion = this.getDiscussion(prevProps.discussionSlug);
           if (prevDiscussion) {
             prevDiscussion.leaveSocketRoom();
           }
         }
    
       const discussion = this.getDiscussion(discussionSlug);
    
       if (!isServer && discussion) {
         discussion.loadPosts().catch((err) => notify(err));
       }
    
         if (discussion) {
           discussion.joinSocketRooms();
         }
       }
     }
    ```
    
    We will define following three methods below:
    
    -   `handleDiscussionEvent`
        
    -   `handlePostEvent`
        
    -   `handleSocketReconnect`
        
        Note that an arrow function that takes `data` as an argument in the above example:
        
        ```
        socket.on('news', (data) => {
        console.log(data);
        });
        ```
        
        This `data` object is contructed on the `API` server. When our `API` server emits an event, it sends a `data` object with properties `actionType` and `discussion` or `post`. Why? Because this is how we designed it. Open `book/8-begin/api/server/sockets.ts` and find the websocket method `discussionAdded`. You will find:
        
        ```
        socket.to(roomName).emit('discussionEvent', { actionType: 'added', discussion });
        ```
        
        Thus, `handleDiscussionEvent` (also `handlePostRealtimeEvent` and `handleSocketReconnect`) must have the format:
        
        ```
        public handleDiscussionEvent = (data) => {
        console.log('discussion realtime event', data);
        
        // change local observable data with data.actionType and data.discussion or data.post
        };
        ```
        
        There is not much to the definition of these three component methods, because they simply pass `data` as an argument to their corresponding store methods of the `Discussion` data store:
        
        ```
        private handleDiscussionEvent = (data) => {
        console.log('discussion realtime event', data);
        
        const discussion = this.getDiscussion(this.props.discussionSlug);
        if (discussion) {
          discussion.handleDiscussionRealtimeEvent(data);
        }
        };
        
        private handlePostEvent = (data) => {
        console.log('post realtime event', data);
        
        const discussion = this.getDiscussion(this.props.discussionSlug);
        if (discussion) {
          discussion.handlePostRealtimeEvent(data);
        }
        };
        
        private handleSocketReconnect = () => {
        console.log('pages/discussion.tsx: socket re-connected');
        
        const discussion = this.getDiscussion(this.props.discussionSlug);
        if (discussion) {
          discussion.loadPosts().catch((err) => notify(err));
          discussion.joinSocketRooms();
        }
        };
        ```
        
        Add the above three methods under the section with public methods inside the `DiscussionPageComp` code.
        
        We already defined the store methods `loadPosts` and `joinSocketRooms`. We need to define the store methods `handleDiscussionRealtimeEvent` and `handlePostRealtimeEvent`. Open `book/8-begin/app/lib/store/discussion.ts` and under the store method `leaveSocketRoom`, add the definition for `handleDiscussionRealtimeEvent` and helper methods:
        
        ```
        public handleDiscussionRealtimeEvent = (data) => {
        console.log('discussion realtime event', data);
        const { actionType  } = data;
        
        if (actionType === 'added') {
          this.addDiscussionToLocalCache(data.discussion);
        } else if (actionType === 'edited') {
          this.editDiscussionFromLocalCache(data.discussion);
        } else if (actionType === 'deleted') {
          this.deleteDiscussionFromLocalCache(data.id);
        }
        };
        
        public addDiscussionToLocalCache(data): Discussion {
        const obj = new Discussion({ team: this.team, store: this.store, ...data });
        
        if (obj.memberIds.includes(this.store.currentUser._id)) {
          this.team.discussions.push(obj);
        }
        
        return obj;
        }
        
        public editDiscussionFromLocalCache(data) {
        const discussion = this.team.discussions.find((item) => item._id === data._id);
        if (discussion) {
          if (data.memberIds && data.memberIds.includes(this.store.currentUser._id)) {
            discussion.changeLocalCache(data);
          } else {
            this.deleteDiscussionFromLocalCache(data._id);
          }
        } else if (data.memberIds && data.memberIds.includes(this.store.currentUser._id)) {
          this.addDiscussionToLocalCache(data);
        }
        }
        
        public deleteDiscussionFromLocalCache(discussionId: string) {
        const discussion = this.team.discussions.find((item) => item._id === discussionId);
        this.team.discussions.remove(discussion);
        }
        ```
        
        In the same file, under `deleteDiscussionFromLocalCache`, add:
        
        ```
        public handlePostRealtimeEvent(data) {
        const { actionType } = data;
        
        if (actionType === 'added') {
          this.addPostToLocalCache(data.post);
        } else if (actionType === 'edited') {
          this.editPostFromLocalCache(data.post);
        } else if (actionType === 'deleted') {
          this.deletePostFromLocalCache(data.id);
        }
        }
        
        public addPostToLocalCache(data) {
        const postObj = new Post({ discussion: this, store: this.store, ...data });
        
        this.posts.push(postObj);
        
        return postObj;
        }
        
        public editPostFromLocalCache(data) {
        const post = this.posts.find((t) => t._id === data._id);
        if (post) {
          post.changeLocalCache(data);
        }
        }
        
        public deletePostFromLocalCache(postId) {
        const post = this.posts.find((t) => t._id === postId);
        this.posts.remove(post);
        }
        ```
        
        Remember to decorate five new methods that modify observable data as actions:
        
        ```
        decorate(Discussion, {
        name: observable,
        slug: observable,
        memberIds: observable,
        posts: observable,
        isLoadingPosts: observable,
        
        editDiscussion: action,
        changeLocalCache: action,
        
        setInitialPosts: action,
        loadPosts: action,
        addPost: action,
        addPostToLocalCache: action,
        deletePost: action,
        
        addDiscussionToLocalCache: action,
        editDiscussionFromLocalCache: action,
        deleteDiscussionFromLocalCache: action,
        editPostFromLocalCache: action,
        deletePostFromLocalCache: action,
        
        members: computed,
        });
        ```
        
        Since you are already familiar with `push` from JavaScript and `find`, `remove`, `replace` (used inside `changeLocalCache`) from `mobx` - we are not discussing how they work here.
        
        Important note - observable properties such as `team.discussions`, `discussion.posts`, and the observable properties of `Discussion` and `Post` data stores inside `changeLocalCache` change, thus triggering a UI re-render that makes connected browsers display an update in real time to either team members or discussion participants.
        

___

#### Testing websockets [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-websockets)

We are ready to test Websocket infrastructure in our application. We worked on both `API` and `APP` projects and built both setup and action parts of the infrastructure.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Websockets+infrastructure+(setup).png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Websockets+infrastructure+(in+action).png)

When we tested Discussion API and Post API earlier in this chapter, we only needed to be logged in with one user account. We observed real time updating of UI, because observable data was changing and our store infrastructure (built with `mobx` and `mobx-react`) was re-rendering UI once it detected changes in observable data.

Testing Websocket infrastructure requires two user accounts logged in to our application at the same time. Team Leader Potato will create a new discussion or add a new post to an existing discussion. Team Member Async should see a real time update of UI - a new discussion or new post. Team Member Async does not need to reload the tab to see the new discussion or post.

Before we test, let's add one more `console.log` statement. Open `book/8-begin/app/pages/discussion.tsx` and find `componentDidMount`. Let's print the `socket` object on the browser's console:

```
public componentDidMount() {
  const { discussionSlug, store, isServer } = this.props;

  if (store.currentTeam && (!isServer || !discussionSlug)) {
    store.currentTeam.loadDiscussions().catch((err) => notify(err));
  }

  const discussion = this.getDiscussion(discussionSlug);

  if (discussion) {
    discussion.joinSocketRooms();
  }

  console.log(store.socket);

  store.socket.on('discussionEvent', this.handleDiscussionEvent);
  store.socket.on('postEvent', this.handlePostEvent);
  store.socket.on('reconnect', this.handleSocketReconnect);
}
```

Start `APP` and `API` projects with `yarn dev`.

On your browser, log in as Team Leader Potato (your user account who is a Team Leader) and navigate to the `first discussion with posts` discussion (`discussionSlug` has value`1`). Make sure that Team Member Async is indeed a participant of the discussion. Then open a second browser window in incognito mode, and log in with Team Member Async (your second user account who is a Team Member).

Team Leader Potato:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-30+21-17-00.png)

Team Member Async:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-30+21-17-12.png)

To confirm the webscoket connection, open your browser's console (`Ctrl + Shift + J`, then click `Console` tab) and click on the `Socket` object:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-31+12-33-52.png)

```
Socket
  acks: {}
  connected: true
  disconnected: false
  flags: {}
  id: "vDXw8HvxoxIKUhQFAAAS"
  ids: 0
  io: Manager {nsps: {…}, subs: Array(6), opts: {…}, _reconnection: true, _reconnectionAttempts: Infinity, …}
  json: Socket {io: Manager, nsp: "/", json: Socket, ids: 0, acks: {…}, …}
  nsp: "/"
  receiveBuffer: []
  sendBuffer: []
  subs: (3) [{…}, {…}, {…}]
  _callbacks: {$connecting: Array(1), $connect: Array(1), $disconnect: Array(1), $reconnect: Array(2), $discussionEvent: Array(1), …}
  __proto__: Object
```

You can see that `Socket.connected` has value `true` and `Socket.disconnected` has value `false`.

Also, on the same browser console, you can see this output:

```
joining socket discussion room first discussion with posts
```

Meaning that this code ran:

```
public joinSocketRoom() {
  if (this.store.socket) {
    console.log('joining socket discussion room', this.name);
    this.store.socket.emit('joinDiscussion', this._id);
    this.store.socket.emit('joinTeam', this.team._id);
  }
}
```

Thus, the browsers emit events that trigger grouping of sockets into rooms on the `API` server.

And indeed, you can see outputs on the `API` server's logs confirming that two sockets joined two rooms:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-31+12-43-26.png)

```
joinTeamRoom 5eea6c745e2fb337a45e8152
joinTeamRoom 5eea6c745e2fb337a45e8152
joinDiscussionRoom 5f1dc8a3fee522265ede9318
joinDiscussionRoom 5f1dc8a3fee522265ede9318
```

This means our setup code runs as expected.

Create a new post with content `abc` inside the `first discussion with posts` discussion using Team Leader Potato's account:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-31+12-16-19.png)

Moments later, you will see a new post on Team Member Async's browser without needing to reload your browser tab:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-31+12-16-10.png)

This means our action code runs as expected as well.

Rename `second discussion` to `seconddd discussion` using Team Leader Potato's account:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-31+12-51-05.png)

Moments later, you will see this new update in real time on Team Member Async's browser:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-8/Screenshot+from+2020-07-31+12-50-56.png)

This means both team and discussion rooms work as expected.

You are welcome to test the remaining four actions on your own.

Good job implementing real time communication in your application!

___

This is the end of Chapter 8.

In the next chapter, Chapter 9, we will learn about AWS Lambda and Amazon API Gateway. We will build a feature to send an email to all participants of a discussion for every new post, if the discussion's creator selected this notification option. We will also add subscription payments to our application using Stripe API.

If you followed the instructions in this chapter closely, your codebase should match the codebase located at `book/8-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___