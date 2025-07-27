In Chapter 10, you will start with the codebase in the [10-begin folder](https://github.com/async-labs/saas/tree/master/book/10-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [10-end folder](https://github.com/async-labs/saas/tree/master/book/10-end). We will cover the following topics in this chapter:

We will cover the following topics in this chapter:

-   Environmental variables, production/development  
    

-   Logger  
    

-   APP server  
    

-   API server  
    

-   SEO - robots.txt, sitemap.xml  
    

-   Server-side caching  
    

-   Google Analytics  
    

-   Heroku  
    

-   Testing application in production  
    

-   AWS Elastic Beanstalk  
    

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

In this last chapter of the book we work on preparing code to be deployed into production. In addition to preparing code to be deployed, we also add a few features along the way. You may or may not find these features useful for your particular product. For example, we will discuss and build server-side caching and add Google Analytics to your SaaS boilerplate among other features. As your SaaS business matures you may need more sophisticated caching and analytics but server-side caching and Google Analytics are good starting points.

## Environmental variables, production/development [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#environmental-variables-production-development)

In this section we are working on preparing our application for deployment. So far we only ran both `APP` and `API` projects locally. Locally, value of `dev` is `true`:

```
const dev = process.env.NODE_ENV !== 'production';
```

In production, after we deploy both projects to either Heroku or AWS Elastic Beanstalk, value of `dev` is `false`. This allows to have **two sets** of environmental variables, one set for development and one set for production. We recommend having development and production versions for each environmental variable for your real world SaaS application.

One of the most important is to set separate MongoDB for production. Currently, our `API` server connects to database with URL with value `MONGO_URL`. In Chapter 4, we created a free database inside free cluster `M0 Sandbox (Shared RAM, 512 MB Storage)` using MongoDB Atlas service. Go ahead and create a new database using instructions from Chapter 4. This time select a tier that you think fits your needs the best. How much load do you expect your production application to have? Remember that you can always upgrade tier after creating cluster and overpaying for database might be costly over long period of time. Once you create a new MongoDB for production, assign its value to `MONGO_URL` environmental variable. Take the old value of `MONGO_URL` and assign it to new environmental variable `MONGO_URL_TEST`.

Make sure that you have both env (environmental) variables with corresponding values inside `book/10-begin/api/.env` file. Next step is to edit code to reflect that we want to use different env variables for development and production:

Open file`book/10-begin/api/server/server.ts`, replace line:

```
mongoose.connect(process.env.MONGO_URL_TEST);
```

With block:

```
mongoose.connect(dev ? process.env.MONGO_URL_TEST : process.env.MONGO_URL);
```

Remember to define `dev` under import section as `const dev = process.env.NODE_ENV !== 'production';`.

If you have some tasks you would like to run when server connects to db and you want to know that they have finished running - you can use following construct:

```
(async () => {
  try {
    await mongoose.connect(dev ? process.env.MONGO_URL_TEST : process.env.MONGO_URL);
    logger.info('connected to db');

    // run some tasks, for ex, inserting email templates to db
    // logger.info('finished async tasks');
  } catch (err) {
    console.log('error: ' + err);
  }
})();
```

You may guessed it right by now - we will make a heavy use of conditional operator `condition ? exprIfTrue : exprIfFalse` for passing development and production versions of env variable.

Next, open file `book/10-begin/lambda/handler.ts`, replace block:

```
await mongoose.connect(process.env.MONGO_URL_TEST);
```

With:

```
await mongoose.connect(dev ? process.env.MONGO_URL_TEST : process.env.MONGO_URL);
```

Remember to define `dev` under import section as `const dev = process.env.NODE_ENV !== 'production';`.

Open file `book/10-begin/lambda/api/test/server/utils/slugify.test.ts`. Here you need to decide whether you plan to test `slugify` method in production or locally. It's unlikely, in our experience, that you will need to run testing suit in both environments. You are free to add conditional operator or simply use value for development:

```
await mongoose.connect(process.env.MONGO_URL_TEST);
```

We are done with databases' URLs. In Chapter 9, we already created two versions (live/test, production/development) of env variables for Stripe API. Next task is to update projects' URLs. Currently we access `APP` at `http://localhost:3000` and `API` at `http://localhost:8000`. Once deployed, `APP` will be accessible at `https://saas-app.async-await.com` and `API` at `https://saas-api.builderbook.org`. Here you need to decide and use **your** domain and URLs.

We already have `URL_APP` and `URL_API` env variables. Add two new env variables, `PRODUCTION_URL_APP` and `PRODUCTION_URL_API` to both files:

-   `book/10-begin/api/.env`
-   `book/10-begin/app/.env`

Make sure to prepend these two env variables with "NEXT\_PUBLIC\_" in the `.env` file of your `app` project to make them universally available.

Open file `book/10-begin/api/server/server.ts` again and make following updates.

Replace:

```
server.use(cors({ origin: process.env.URL_APP, credentials: true }));
```

With:

```
server.use(
  cors({ origin: dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP, credentials: true }),
);
```

Replace:

```
setupSockets({ httpServer, origin: process.env.URL_APP, sessionMiddleware });
```

With:

```
setupSockets({
  httpServer,
  origin: dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP,
  sessionMiddleware,
});
```

Replace:

```
http.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

With:

```
http.listen(process.env.PORT_API, () => {
  logger.info(`> Ready on ${dev ? process.env.URL_API : process.env.PRODUCTION_URL_API}`);
});
```

___

Open file `book/10-begin/api/server/google-auth.ts` and make following updates.

Replace:

```
passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_CLIENTSECRET,
      callbackURL: `${process.env.URL_API}/oauth2callback`,
      passReqToCallback: true,
    },
    verify,
  ),
);
```

With:

```
passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_CLIENTSECRET,
      callbackURL: `${dev ? process.env.URL_API : process.env.PRODUCTION_URL_API}/oauth2callback`,
      passReqToCallback: true,
    },
    verify,
  ),
);
```

Please remember to define `dev` under import section:

```
const dev = process.env.NODE_ENV !== 'production';
```

In Chapter 5 you added two values to `Authorized JavaScript origins` at Google Cloud Platform dashboard. Make sure that you added **your** actual value for production URL of `API` server.

Replace

```
res.redirect(`${process.env.URL_APP}${redirectUrlAfterLogin}`);
```

With:

```
res.redirect(
  `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_API}${redirectUrlAfterLogin}`,
);
```

___

Open file `book/10-begin/api/server/passwordless-auth.ts` and make following updates.

Replace:

```
loginURL: `${
  process.env.URL_API
}/auth/logged_in?token=${tokenToSend}&uid=${encodeURIComponent(uidToSend)}`,
```

With:

```
loginURL: `${
  dev ? process.env.URL_API : process.env.PRODUCTION_URL_API
}/auth/logged_in?token=${tokenToSend}&uid=${encodeURIComponent(uidToSend)}`,
```

Replace:

```
res.redirect(`${process.env.URL_APP}${redirectUrlAfterLogin}`);
```

With:

```
res.redirect(
  `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}${redirectUrlAfterLogin}`,
);
```

Replace:

```
res.redirect(`${process.env.URL_APP}/login`);
```

With:

```
res.redirect(`${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/login`);
```

Define `dev` in this location, so it has enough scope to be available in the above three locations:

```
const mongoStore = new PasswordlessMongoStore();

const dev = process.env.NODE_ENV !== 'production';
```

___

Open file `book/10-begin/api/server/stripe.ts` and make following updates:

Replace:

```
success_url: `${process.env.URL_API}/stripe/checkout-completed/{CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.URL_APP}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled`,
```

With:

```
success_url: `${
  dev ? process.env.URL_API : process.env.PRODUCTION_URL_API
}/stripe/checkout-completed/{CHECKOUT_SESSION_ID}`,
cancel_url: `${
  dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP
}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled`,
```

Replace:

```
res.redirect(`${process.env.URL_APP}/team/${team.slug}/billing`);
```

With:

```
res.redirect(
  `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/team/${team.slug}/billing`,
);
```

Replace:

```
res.redirect(
  `${process.env.URL_APP}/team/${team.slug}/billing?redirectMessage=${err.message ||
    err.toString()}`,
);
```

With:

```
res.redirect(
  `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/team/${
    team.slug
  }/billing?redirectMessage=${err.message || err.toString()}`,
);
```

In Chapter 9 we already defined `dev` here:

```
const dev = process.env.NODE_ENV !== 'production';

const stripeInstance = new Stripe(
  dev ? process.env.STRIPE_TEST_SECRETKEY : process.env.STRIPE_LIVE_SECRETKEY,
  { apiVersion: '2020-03-02' },
);
```

Open file `book/10-begin/api/server/models/Invitation.ts` and replace:

```
const emailTemplate = await getEmailTemplate('invitation', {
  teamName: team.name,
  invitationURL: `${process.env.URL_APP}/invitation?token=${token}`,
});
```

With:

```
const dev = process.env.NODE_ENV !== 'production';

const emailTemplate = await getEmailTemplate('invitation', {
  teamName: team.name,
  invitationURL: `${
    dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP
  }/invitation?token=${token}`,
});
```

___

Open file `book/10-begin/app/components/discussions/CreateDiscussionForm.tsx` and replace:

```
discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
```

With:

```
discussionLink: `${dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP}/team/${
  discussion.team.slug
}/discussions/${discussion.slug}`,
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` right under import section.

Open file `book/10-begin/app/components/discussions/DiscussionActionMenu.tsx` and replace:

```
const discussionUrl = `${process.env.NEXT_PUBLIC_URL_APP}/team/${currentTeam.slug}/discussions/${selectedDiscussion.slug}`;
```

With:

```
const dev = process.env.NODE_ENV !== 'production';
const discussionUrl = `${
  dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP
}/teams/${currentTeam.slug}/discussions/${selectedDiscussion.slug}`;
```

Open file `book/10-begin/app/components/posts/PostForm.tsx` and replace

```
discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
```

With:

```
discussionLink: `${
  dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP
}/teams/${discussion.team.slug}/discussions/${discussion.slug}`,
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` right under import section.

Click on the button in a browser conditional operator server-side rendering in a browser. Server-side rendering send this response discussion new Express route Material-UI it works as expected At AWS dashboard. AWS dashboard conditional operator withAuth HOC API infrastructure conditional operator conditional operator if truthy then new Express route. Subsection team members in production HTTP Remember to add import it works as expected compiles triggers method. This chapter send this response Navigate to Click on the button Google OAuth API compiles show notification decorate method with action Material-UI static method calls response. Open this file discussion compiles team members session in a browser in a browser redirect to checkout Team Leader check if value is truthy store method calls it works as expected At AWS dashboard. Material-UI AWS dashboard At AWS dashboard API method withAuth HOC. If truthy then subsection triggers method add environmental variable Google OAuth API production-ready request was sent end user API method calls corresponding store method team members. AWS dashboard list of posts it works as expected show notification static method calls API infrastructure if truthy then Navigate to conditional operator show notification cookie on server only in a browser show notification response. In production end user request was sent end user list of posts S3 bucket decorate method with action Material-UI Click on the button API method email and name withAuth HOC We will discuss You already learned.

Open `book/10-begin/app/server/server.ts` file and replace:

```
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEV = NODE_ENV !== 'production';
```

With:

```
const dev = process.env.NODE_ENV !== 'production';
```

Replace:

```
const app = next({ dev: IS_DEV });
```

With:

```
const app = next({ dev });
```

Also replace:

```
console.log(`> Ready on ${process.env.NEXT_PUBLIC_URL_APP}`);
```

With:

```
console.log(`> Ready on ${dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP}`);
```

Open file `book/10-begin/app/components/common/LoginButton.tsx`, replace with

```
let url = `${process.env.NEXT_PUBLIC_URL_API}/auth/google`;
```

With:

```
let url = `${dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API}/auth/google`;
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` right under import section.

Open `book/10-begin/app/components/layout/index.tsx` and replace:

```
href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
```

With:

```
href: `${dev ? process.env.NEXT_PUBLIC_URL_API : process.env.PRODUCTION_NEXT_PUBLIC_URL_API}/logout`,
as: `${dev ? process.env.NEXT_PUBLIC_URL_API : process.env.PRODUCTION_NEXT_PUBLIC_URL_API}/logout`,
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` right under import section.

Open `book/10-begin/app/lib/api/sendRequestAndGetResponse.ts` and replace:

```
const response = await fetch(
  opts.externalServer ? `${path}${qs}` : `${process.env.NEXT_PUBLIC_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);
```

With:

```
const response = await fetch(
  opts.externalServer
    ? `${path}${qs}`
    : `${dev ? process.env.URL_API : process.env.PRODUCTION_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` right under import section.

Open `book/10-begin/app/lib/store/index.ts` and replace

```
const socket = isServer ? null : io(process.env.NEXT_PUBLIC_URL_API);
```

With:

```
const socket = isServer ? null : io(dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API);
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` right under import section.

Open `book/10-begin/api/server/sockets.ts` and add following block at this location:

```
io = socketio(http, { origins: origin, serveClient: false });

if (dev) {
  io.origins(origin);
} else {
  io.origins(`${origin}:443`);
}
```

Remember to define `dev` as `const dev = process.env.NODE_ENV !== 'production';` under `let io: socketio.Server = null;` line.

Open file `book/10-begin/lambda/handler.ts`, replace

```
"Access-Control-Allow-Origin": "http://localhost:3000",
```

With:

```
"Access-Control-Allow-Origin": dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP,
```

Add `MONGO_URL_TEST`, `URL_APP` and `PRODUCTION_URL_APP` to both files:

-   `book/10-begin/lambda/serverless.yml`
-   `book/10-begin/lambda/.env`

___

Two more places to add and define `dev` at. Both places are code related to Invitation API.

First place is `book/10-begin/app/pages/invitation.tsx`, update `Router.push` to become:

```
Router.push(
  `${
    dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API
  }/logout?invitationToken=${token}`,
  `${
    dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API
  }/logout`,
);
```

Remember to add `dev` definition to the `book/10-begin/app/pages/invitation.tsx` file.

Second place is `book/10-begin/api/server/passwordless-auth.ts`, update Express route `/logout` so it becomes:

```
server.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
    }

    if (req.query && req.query.invitationToken) {
      res.redirect(
        `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/invitation?token=${
          req.query.invitationToken
        }`,
      );
    } else {
      res.redirect(`${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/login`);
    }
  });
});
```

Definition of `dev` should be already in the `book/10-begin/api/server/passwordless-auth.ts` file.

___

Definition of `dev` should be already in the `book/10-begin/lambda/handler.ts` file. Open this file, find line:

```
'Access-Control-Allow-Origin': 'http://localhost:3000',
```

Replace it with line:

```
'Access-Control-Allow-Origin': dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP,
```

Please do remember to add values of `URL_APP` and `PRODUCTION_URL_APP` to `book/10-begin/lambda/.env` file. If you already deployed Lambda function to AWS then make sure that you have added all necessary env variables to deployed Lambda function:

![Builder Book](https://user-images.githubusercontent.com/10218864/146270656-b46f04d7-c704-4250-9b37-270edd398ff5.png)

___

We leave it to you if you would like to create development and production versions for the rest of env variables, for example, `NEXT_PUBLIC_API_GATEWAY_ENDPOINT`, `NEXT_PUBLIC_BUCKET_FOR_AVATARS`, `AWS_ACCESSKEYID` and other env vars. We as a team have one value for both development and production for env variables `EMAIL_SUPPORT_FROM_ADDRESS` and all S3 bucket-related env variables.

___

For each project, `APP` and `API`, we willl save compiled (built) code into `production-server` folder at the project's root. Then we will start JavaScript code, that was compiled from TypeScript code, using `node` command.

New Express route end user request You already learned AWS dashboard compiles discussion. Server-side rendering API method calls corresponding store method in this book team members production-ready if truthy then redirect to checkout API method in production API method this chapter. API method calls corresponding store method new Express route add environmental variable in a browser data model decorate method with action. Mount middleware send this response Put it all together request was sent new Express route We will discuss check if value is truthy. New Express route withAuth HOC Next.js web application We will discuss discussion HTTP. Click on the button Put it all together server-side rendering store method calls withAuth HOC. Open this file Google OAuth API compiles server-side rendering session check if value is truthy API method production-ready decorate method with action request was sent compiles Material-UI discussion request. Team Leader compiles store method calls in this book mount middleware. Production-ready check if value is truthy decorate method with action compiles new Express route conditional operator add environmental variable We will discuss session. Navigate to We will discuss Next.js web application if truthy then list of posts send this response Team Leader new Express route discussion.

Open `book/10-begin/api/package.json` and add three new script commands:

```
"postinstall": "rm -rf production-server/",
"build": "tsc --project tsconfig.server.json",
"start": "node production-server/server/server.js",
```

Open `book/10-begin/app/package.json` and add three new script commands:

```
"postinstall": "next build && rm -rf production-server/",
"build": "next build && tsc --project tsconfig.server.json",
"start": "node production-server/server.js",
```

Note that after our hosting service (Heroku or AWS Elastic Beanstalk) are done with installing packages, hosting service runs `postinstall` command. In our case we use `postinstall` to remove `production-server` from previous deployment (if such folder and deployment exist).

We will do testing later in this chapter, after we deploy the project to Heroku.

___

## Logger [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#logger)

We used `console.log` syntax whenever we wanted to output value for variable or function. Typically, we used it to show that value is truthy or some method indeed ran. We already got three dozen of `console.log` instance on `API` server in our relatively simple SaaS boilerplate. This count does not include similar amount of `console.log` statements that we added during debugging process but later removed.

Since logging is synchronous and blocks single thread on our Node.js server, we want to keep it to the minimum. We don't want to delete all `console.log` statements and then re-add them. We need a way to print only a fraction of log outputs in production. We can use a popular `winston` logger that allows you to create so called `transports`:

[https://github.com/winstonjs/winston/blob/master/docs/transports.md#built-in-to-winston](https://github.com/winstonjs/winston/blob/master/docs/transports.md#built-in-to-winston)

`Transports` allow you to transport your logs to different destinations. You can display logs in the console (`winston.transports.Console()`), you can save logs to file (`winston.transports.File()`), you can send them to HTTP endpoint (`winston.transports.Http()`) and more.

In our book, we simply want to display logs in the console (`winston.transports.Console()`) but we want to print results of `logger.debug` and `logger.info` statements in development but only `logger.info` in production. To create such behavior we have to assign `level` to `winston` logger based on value of `dev`. It's important to note that `winston` has following hiearchy of levels:

[https://github.com/winstonjs/winston#logging](https://github.com/winstonjs/winston#logging)

```
const levels = { 
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};
```

So if level is `debug`, `winston` logger will print all logger statements in the console that have `error`, `warn`, `info`, `http`, `verbose` and `debug`.

If level is `info`, `winston` logger will print all logger statements in the console that have `error`, `warn`, `info`.

So now you can see how we can print less logs in production. Put it in code:

```
level: dev ? 'debug' : 'info',
```

Defining `winston` logger in easy. Create a new file `book/9-begin/server/logger.js` and call `createLogger` with following parameters:

```
import * as winston from 'winston';

const dev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  format: winston.format.simple(),
  level: dev ? 'debug' : 'info',
  transports: [new winston.transports.Console()],
});

export default logger;
```

The hard part is to replace numerous instance of `console.log` in our application. Here is an example, open file `book/10-begin/api/server/server.ts`, at the end of import section add:

```
import logger from './logger';
```

Then replace `console.log` statement with `logger.info` like so:

```
http.listen(process.env.PORT_API, () => {
  logger.info(`> Ready on ${dev ? process.env.URL_API : process.env.PRODUCTION_URL_API}`);
});
```

Open `book/10-begin/api/server/stripe.ts` file and replace six instances `console.log` with `logger.debug`. Here is one instance:

```
function updateCustomer(customerId, params: Stripe.CustomerUpdateParams) {
  logger.debug('updating customer', customerId);
  return stripeInstance.customers.update(customerId, params);
}
```

So in production, you will see `>Ready on https://saas-api.builderbook.org` but you will not see `updating customer, cus_HmY1Xt813hLuNd`.

We leave it to you to replace the rest of `console.log` statements.

We will see production logs later in this chapter, after we deploy both `APP` and `API` to Heroku.

___

## APP server [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#app-server)

Later in this section we will mount multiple Express routes related to SEO and server-side caching features. In this section, we want to make a small but nice improvement to how our application behaves in browser. If you as developer land on `http://localhost:3000/` route or end user lands on `https://saas-app.async-await.com/` route - both of you will see an `404` error page since we removed `Index` page while ago in this book.

It would be a nice user experience to redirect user to `/login` route if user by accident tried to load `/` route. All we need to do is to create Express route for route `/`, check if `req.user` is truthy and if not - redirect user to `/login` route. If `req.user` is truthy then we redirect either to `/create-team` route or `/team/${req.user.defaultTeamSlug}/discussions` route:

```
server.get('/', async (req: any, res) => {
  let redirectUrl = 'login';

  if (req.user) {
    if (!req.user.defaultTeamSlug) {
      redirectUrl = 'create-team';
    } else {
      redirectUrl = `team/${req.user.defaultTeamSlug}/discussions`;
    }
  }

  res.redirect(`${dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP}/${redirectUrl}`);
});
```

Open `book/10-begin/app/server/server.ts` file and add the above new Express route at this location:

```
server.use(express.json());

if (!dev) {
  server.set('trust proxy', 1); // sets req.hostname, req.ip
}

server.get('/', async (req: any, res) => {
  let redirectUrl = 'login';

  if (req.user) {
    if (!req.user.defaultTeamSlug) {
      redirectUrl = 'create-team';
    } else {
      redirectUrl = `team/${req.user.defaultTeamSlug}/discussions`;
    }
  }

  res.redirect(`${dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP}/${redirectUrl}`);
});
```

We will discuss `server.set('trust proxy', 1);` line in the next section.

Production-ready subsection in production it works as expected check if value is truthy. Static method calls decorate method with action open this file conditional operator mount middleware in a browser withAuth HOC HTTP Click on the button redirect to checkout At AWS dashboard request was sent Put it all together in this book. Team members discussion on the client cookie HTTP. Cookie request Navigate to send this response response open this file API method calls corresponding store method add environmental variable cookie HTTP API method static method calls. API infrastructure subsection list of posts open this file API method calls corresponding store method show notification withAuth HOC on server only store method calls on the client on server only. Show notification API method calls corresponding store method on server only Google OAuth API At AWS dashboard decorate method with action Put it all together Google OAuth API. Cookie API infrastructure Team Leader in this book Team Leader email and name Team Leader redirect to checkout data model server-side rendering it works as expected triggers method HTTP. Add environmental variable this chapter API method calls corresponding store method triggers method Click on the button in production compiles request Put it all together production-ready. Decorate method with action API infrastructure At AWS dashboard triggers method Team Leader We will discuss page component Next.js web application request was sent open this file response list of posts HTTP. MongoDB database this chapter send this response mount middleware in a browser Google OAuth API HTTP Click on the button end user cookie.

We will test this redirect after we deploy `APP` to Heroku hosting platform.

___

## API server [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-server)

In this section we will make three improvements to Express.js `API` server. These improvements are optional but makes server more secure in production:

-   Enabling `helmet` middleware sets a group of headers for response:
    
    [https://expressjs.com/en/advanced/best-practice-security.html#use-helmet](https://expressjs.com/en/advanced/best-practice-security.html#use-helmet)
    
    From docs, list of headers:
    
    ```
      - csp sets the Content-Security-Policy header to help prevent cross-site scripting attacks and other cross-site injections.
      - hidePoweredBy removes the X-Powered-By header.
      - hsts sets Strict-Transport-Security header that enforces secure (HTTP over SSL/TLS) connections to the server.
      - ieNoOpen sets X-Download-Options for IE8+.
      - noCache sets Cache-Control and Pragma headers to disable client-side caching.
      - noSniff sets X-Content-Type-Options to prevent browsers from MIME-sniffing a response away from the declared content-type.
      - frameguard sets the X-Frame-Options header to provide clickjacking protection.
      - xssFilter sets X-XSS-Protection to enable the Cross-site scripting (XSS) filter in most recent web browsers.
    ```
    
-   Enabling `compression` middleware with default values to compress response's body for all requests that go through middleware:
    
    [http://expressjs.com/en/resources/middleware/compression.html](http://expressjs.com/en/resources/middleware/compression.html)
    
    Since network speed is limited, compressing response's body, generally, is a good idea. Generally, it takes less time to encypt on server and decrypt on browser then to send response with uncompressed body. The compression infrastructure is already built-in browser, we simply need to configure Express server and add `compression` middleware. Since we plan to server our application via [HTTPS](https://developer.mozilla.org/en-US/docs/Glossary/https) (secure protocol that ensure secure data exchange between client and server) - compressing response's body is even better idea since encryption/decryption is faster for smaller, compressed, data.
    
-   Make sure that our application sets cookie only over HTTPS. And ensure that Express server trusts first proxy (when we deploy our `API` server to hosting service (Heroku or AWS Elasstic Beanstalk), it will likely to have proxy in front of it, for example load balancer server). If our Express server does not trust proxy, it will, for example, think that proxy's IP address is client's IP address:
    
    [https://github.com/expressjs/session#cookiesecure](https://github.com/expressjs/session#cookiesecure)
    
    [https://expressjs.com/en/guide/behind-proxies.html](https://expressjs.com/en/guide/behind-proxies.html)
    

Open `book/10-begin/api/server/server.ts` and make the following changes:

```
server.use(
  cors({ origin: dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP, credentials: true }),
);

server.use(helmet());
server.use(compression());

stripeWebhookAndCheckoutCallback({ server });
```

```
if (!dev) {
  server.set('trust proxy', 1); // sets req.hostname, req.ip, req.protocol
  sessionOptions.cookie.secure = true; // sets cookie over HTTPS only
}

const sessionMiddleware = session(sessionOptions);
server.use(sessionMiddleware);
```

Remember to add imports at the end of import section:

```
import * as compression from 'compression';
import * as helmet from 'helmet';
```

One more thing to modify for production is `cookie`. In the same file, find:

```
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    secure: false,
  },
```

Update it so it becomes:

```
cookie: {
  httpOnly: true,
  maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
  domain: dev ? 'localhost' : process.env.COOKIE_DOMAIN,
} as any,
```

We removed `secure: false`, value of `cookie.secure` now depends on value of `dev`. Also we add `cookie.domain` that depends on the value of `dev` as well. Let's remember to add env variable `COOKIE_DOMAIN` to Heroku and AWS Elastic Beanstalk when we deploy `API` server.

We will log into our application after we deploy the project to Heroku to prove that `browser -> cookie -> session -> req.user` series of events works as expected in production.

___

## SEO - robots.txt, sitemap.xml [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#seo-robots-txt-sitemap-xml)

You may noticed that most of pages in `APP` project are for logged-in end users only. The only two pages for logged-out end users are `Login` and `Invitation` pages. `Billing`, `TeamSettings`, `YourSettings`, `DiscussionPageComp` pages are for logged-in end users, these pages have titles to display on browser's tabs but do not require `meta` tag with name `description` to improve SEO:

[https://developer.mozilla.org/en-US/docs/Glossary/SEO](https://developer.mozilla.org/en-US/docs/Glossary/SEO)

The way we designed SaaS boilerlplate, it requires another project, we can call it `HOMEPAGE` project that contains landing page, description for features, pricing page, blog and most importantly link to `Login` page of `APP` project. Thus, you can deduce, we don't need to worry about SEO optimization for most page in `APP` project, perhaps only for `Login` page (we don't want to SEO optimize `Invitation` page). Having said that, in this section we will show you how to generate and serve `sitemap.xml` file and `robots.txt` file from `API` server. `sitemap.xml` tells crawl bots (scripts that crawl your application's pages and add them to search engine results) which URLs to crawl and their frequency plus priority. Second file tells crawl bots which routes are allowed and disallowed for crawling.

We have an option of composing both `sitemap.xml` and `robots.txt` files manually. The latter is easy to maintain and we will indeed create `robots.txt` file manually. Create a new file `book/10-begin/app/server/robots.txt` with following content:

```
User-agent: *
Disallow: /
Allow: /login
Allow: /signup
Disallow: /*
```

You can see that we, as application's developers, allow crawl bots to crawl two routes only and disallow main route and nested routes.

Since in our SaaS application end users use `Login` page for both login and signup, you can a new Express route to `APP` server at `book/10-begin/app/server/server.ts` at this location:

```
server.get('/team/:teamSlug/billing', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/billing', { teamSlug, ...(req.query || {}) });
});

server.get('/signup', (req, res) => {
  app.render(req, res, '/login');
});
```

Open `book/10-begin/app/pages/login.tsx` and update text:

```
<Head>
  <title>Log in or Sign up to SaaS boilerplate</title>
  <meta
    name="description"
    content="Login and signup page for SaaS boilerplate demo by Async"
  />
</Head>
<br />
<p style={{ margin: '45px auto', fontSize: '44px', fontWeight: 400 }}>
  Log in or Sign up
</p>
```

So how do we serve `robots.txt` file? How to we serve (and construct) `sitemap.xml`? In the same we serve anything in Express server, by defining corresponding Express route. You may already learned a common pattern of mounting Express routes on `API` server - defining method that takes `server` as argument, for example:

-   `setupGoogle({ server })` or
-   `setupPasswordless({ server })` and others

Here we undertake the same approach, we will define `setupSitemapAndRobots` and then call it on `APP` Express server like this:

```
setupSitemapAndRobots({ server });
```

to mount two new Express route. Express route `/sitemap.xml` and Express route `/robots.txt` to serve crawl bots files they need.

Composing `sitemap.xml` is time-consuming and since its content typically changes over time we opt to using `sitemap` package to dynamically sitemap for our web application. This package is especially useful for when you have many pages of the same type, for example, if we had a goal of adding all discussion pages to sitemap, we would have add many objects of type to sitemap:

```
{
  url: '/team/:teamSlug/discussions/:discussionSlug',
  changefreq: 'daily',
  priority: 1,
}
```

Imagine going through all teams' slugs and all discussions' slugs and manually adding the above objects to `sitemap.xml`.

In our case we could have composed `sitemap.xml` manually but we decided to show you a more automated approach in case you needed, for example, for articles of your business's blog.

Next.js web application API infrastructure API infrastructure discussion in a browser add environmental variable on server only mount middleware this chapter open this file Put it all together cookie Google OAuth API. Response list of posts team members store method calls Team Leader HTTP redirect to checkout end user. Navigate to in production this chapter on server only open this file new Express route page component on server only Team Leader request API infrastructure in a browser AWS dashboard We will discuss Team Leader. HTTP Click on the button Put it all together it works as expected mount middleware open this file static method calls store method calls add environmental variable page component API method open this file compiles. WithAuth HOC Put it all together in production server-side rendering redirect to checkout Remember to add import redirect to checkout HTTP mount middleware conditional operator API method calls corresponding store method send this response conditional operator static method calls. We will discuss API method calls corresponding store method if truthy then Next.js web application Material-UI Material-UI AWS dashboard Next.js web application page component. On server only open this file compiles if truthy then API infrastructure You already learned session. Put it all together API infrastructure static method calls Team Leader You already learned Google OAuth API session redirect to checkout decorate method with action discussion. Response this chapter conditional operator new Express route Put it all together Navigate to show notification add environmental variable request was sent production-ready. Cookie static method calls show notification Click on the button triggers method You already learned add environmental variable.

Let's define a carcass of `setupSitemapAndRobots` method, create a new file `book/10-begin/app/server/setupSitemapAndRobots.ts` with following content:

```
import { SitemapStream, streamToPromise } from 'sitemap';
import path from 'path';
import { createGzip } from 'zlib';

const dev = process.env.NODE_ENV !== 'production';

export default function setupSitemapAndRobots({ server }) {
  let sitemap;

  server.get('/sitemap.xml', async (_, res) => {
    // some logic to construct content of file

    // send response
  });

  server.get('/robots.txt', (_, res) => {
    res.sendFile(path.join(__dirname, './', 'robots.txt'));
  });
}
```

Let's discuss the above content - `res.sendFile(path)` serves file from the given `path`. This `path` is absolute path:

[https://expressjs.com/en/api.html#res.sendFile](https://expressjs.com/en/api.html#res.sendFile)

That's why we construct it out of three pieces to produce absolute path:

```
path.join(__dirname, './', 'robots.txt')
```

Open `book/10-begin/app/package.json` file and update script command `build` to become:

```
"build": "next build && rm -rf production-server/ && tsc --project tsconfig.server.json && cp server/robots.txt production-server",
```

Adding `cp server/robots.txt production-server` at the end of script command adds `robots.txt` file from non-compiled directory to compiled directory.

If we chose to manually create `sitemap.xml` file, we could have used the above `res.sendFile` approach for `sitemap.xml`. Instead we chose to construct `sitemap.xml` programmatically using `sitemap` package. Let's example on how to do it from official docs:

[https://www.npmjs.com/package/sitemap#serve-a-sitemap-from-a-server-and-periodically-update-it](https://www.npmjs.com/package/sitemap#serve-a-sitemap-from-a-server-and-periodically-update-it)

Example's code from the above link:

```
const express = require('express')
const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')

const app = express()
let sitemap

app.get('/sitemap.xml', function(req, res) {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');
  // if we have a cached entry send it
  if (sitemap) {
    res.send(sitemap)
    return
  }

  try {
    const smStream = new SitemapStream({ hostname: 'https://example.com/' })
    const pipeline = smStream.pipe(createGzip())

    // pipe your entries or directly write them.
    smStream.write({ url: '/page-1/',  changefreq: 'daily', priority: 0.3 })
    smStream.write({ url: '/page-2/',  changefreq: 'monthly',  priority: 0.7 })
    smStream.write({ url: '/page-3/'})    // changefreq: 'weekly',  priority: 0.5
    smStream.write({ url: '/page-4/',   img: "http://urlTest.com" })

    // cache the response
    streamToPromise(pipeline).then(sm => sitemap = sm)
    // make sure to attach a write stream such as streamToPromise before ending
    smStream.end()
    // stream write the response
    pipeline.pipe(res).on('error', (e) => {throw e})
  } catch (e) {
    console.error(e)
    res.status(500).end()
  }
})

app.listen(3000, () => {
  console.log('listening')
});
```

To understand above code, we need to make an introduction to `streams` in Node.js. Streams are data-handling in Node.js that allow us, developers, to read/write/transform data from/to files **without** waiting for entire file to be loaded into memory. In other words, streams are memory-efficient methods for handling data in chunks. For example, you can read data from source file and **at the same time** transform, and write data to destination file. Here is a simple example from Node docs that illustrates it:

[https://node.readthedocs.io/en/latest/api/zlib/#examples](https://node.readthedocs.io/en/latest/api/zlib/#examples)

```
var gzip = zlib.createGzip();
var fs = require('fs');
var inp = fs.createReadStream('input.txt');
var out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out);
```

What happens here? We created `inp` stream, so called readable stream, a stream from which data can be read. We created `out` stream, so called writable stream, stream to which data can be written. We used `pipe` method that attaches writable stream to readable stream:

[https://nodejs.org/api/stream.html#stream\_readable\_pipe\_destination\_options](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options)

And we also compressed and decompressed data from file `input.txt` by piping data from `input.txt` file into `zlib` stream.

`sitemap` is heavily based on Node.js streams. Method `SitemapStream` creates a stream:

[https://github.com/ekalinin/sitemap.js/blob/master/api.md#sitemapstream](https://github.com/ekalinin/sitemap.js/blob/master/api.md#sitemapstream)

In our case:

```
const smStream = new SitemapStream({
  hostname: dev
    ? process.env.NEXT_PUBLIC_URL_APP
    : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP,
});
```

We write data to this stream using `write` method:

[https://nodejs.org/api/stream.html#stream\_writable\_write\_chunk\_encoding\_callback](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback)

In our case:

```
smStream.write({
  url: '/login',
  changefreq: 'daily',
  priority: 1,
});
```

Then we call package's method `streamToPromise` (based on Node.js's `finish` event: [https://nodejs.org/api/stream.html#stream\_event\_finish](https://nodejs.org/api/stream.html#stream_event_finish)) to return Promise that resolves if stream is successfully flushed (all data successfully written to destination):

[https://github.com/ekalinin/sitemap.js/blob/master/api.md#streamtopromise](https://github.com/ekalinin/sitemap.js/blob/master/api.md#streamtopromise)

We call it like this:

```
streamToPromise(smStream.pipe(gzip)).then((sm) => (sitemap = sm));
```

We should remember to check if `sitemap` truthy (in other words, `sitemap` exists because it is cached in server's memory), if so - no need to create it from streams, we can send response containing `sitemap`:

```
if (sitemap) {
  res.send(sitemap);
  return;
}
```

We indicate that no more data will be written to the stream using `end` method:

[https://nodejs.org/api/stream.html#stream\_writable\_end\_chunk\_encoding\_callback](https://nodejs.org/api/stream.html#stream_writable_end_chunk_encoding_callback)

In our case:

```
smStream.end();
```

Finally we take writable stream and pipe it, using `pipe` method, to response and use `error` to throw error if there is any error:

[https://nodejs.org/api/stream.html#stream\_readable\_pipe\_destination\_options](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options)

[https://nodejs.org/api/stream.html#stream\_event\_error\_1](https://nodejs.org/api/stream.html#stream_event_error_1)

We achieve it with:

```
smStream
  .pipe(gzip)
  .pipe(res)
  .on('error', (err) => {
    throw err;
  });
```

Put it all together into new file `book/10-begin/app/server/setupSitemapAndRobots.ts`:

```
import { SitemapStream, streamToPromise } from 'sitemap';
import path from 'path';
import zlib from 'zlib';

const dev = process.env.NODE_ENV !== 'production';

export default function setupSitemapAndRobots({ server }) {
  let sitemap;

  server.get('/sitemap.xml', async (_, res) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');

    if (sitemap) {
      res.send(sitemap);
      return;
    }

    try {
      const smStream = new SitemapStream({
        hostname: dev
          ? process.env.NEXT_PUBLIC_URL_APP
          : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP,
      });
      const gzip = zlib.createGzip();

      smStream.write({
        url: '/login',
        changefreq: 'daily',
        priority: 1,
      });

      streamToPromise(smStream.pipe(gzip)).then((sm) => (sitemap = sm));

      smStream.end();

      smStream
        .pipe(gzip)
        .pipe(res)
        .on('error', (err) => {
          throw err;
        });
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  });

  server.get('/robots.txt', (_, res) => {
    res.sendFile(path.join(__dirname, './', 'robots.txt'));
  });
}
```

Open `book/10-begin/app/server/server.ts` file, add new import:

```
import setupSitemapAndRobots from './setupSitemapAndRobots';
```

Mount two new Express routes at this location:

```
server.get('/signup', (req, res) => {
  app.render(req, res, '/login');
});

setupSitemapAndRobots({ server });
```

We will do testing of these two Express routes later in this chapter, after we deploy the project to Heroku.

You already learned You already learned Remember to add import Navigate to check if value is truthy open this file add environmental variable. Redirect to checkout At AWS dashboard this chapter in production list of posts decorate method with action store method calls withAuth HOC withAuth HOC MongoDB database decorate method with action We will discuss subsection S3 bucket. Remember to add import request Material-UI API method calls corresponding store method request. Navigate to At AWS dashboard production-ready triggers method MongoDB database Remember to add import conditional operator API method calls corresponding store method We will discuss it works as expected conditional operator if truthy then add environmental variable store method calls. Discussion in a browser You already learned response You already learned mount middleware open this file on server only AWS dashboard Navigate to in a browser it works as expected redirect to checkout. Request was sent We will discuss Put it all together if truthy then compiles compiles. This chapter add environmental variable add environmental variable it works as expected Team Leader store method calls MongoDB database server-side rendering Google OAuth API API method calls corresponding store method You already learned. Send this response Click on the button decorate method with action At AWS dashboard store method calls We will discuss API infrastructure API method calls corresponding store method. Open this file open this file S3 bucket email and name store method calls add environmental variable in a browser discussion in this book API infrastructure. Show notification request S3 bucket list of posts API infrastructure We will discuss API infrastructure.

___

## Server-side caching [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#server-side-caching)

Similarly to how only `Login` page needs SEO optimization, server-side caching may be only practical for `Login` page as well. In your particular situation, you may want to cache more page on server side. If page has static content, say homepage or pricing page, it is fairly safe to cache it on server. But beware of pages with dynamic content - you may accidentaly cache data even if end user updates the data. Say, if you cache `Billing` page with card info and end user updates card info, end user will see old cached page that contains old card info. That will look like a bug to user.

Here we will use `lru-cache` package to cache just one route, `/login-cached` route, on `APP` server:

[https://www.npmjs.com/package/lru-cache](https://www.npmjs.com/package/lru-cache)

We will create a new file `book/10-begin/app/server/routesWithCache.ts` and inside it we will define `routesWithCache` method that takes two arguments `server` (our Express.js server) and `app` (Next.js server). This method will also mount two Express routes \`/l

```
import { LRUCache } from 'lru-cache';

export default function routesWithCache({ server, app }) {
    // define ssrCache by calling LRUCache

    // define getCacheKey method

    // define renderAndCache method
  }

  server.get('/login-cached', (req, res) => {
    renderAndCache(req, res, '/login', {});
  });
}
```

Copy `book/10-begin/app/pages/login.tsx` file, paste it into `book/10-begin/app/pages/*` folder and rename it to be `login-cached.tsx`.

Here is an example from docs on how to define `LRUCache` instance:

[https://github.com/isaacs/node-lru-cache#usage](https://github.com/isaacs/node-lru-cache#usage)

We will pass two options `max` and `maxAge`:

```
const ssrCache = new LRUCache({
  max: 100, // 100 items
  maxAge: 1000 * 60 * 60, // 1 hour
});
```

You can read about passed parameters here:

[https://github.com/isaacs/node-lru-cache#options](https://github.com/isaacs/node-lru-cache#options)

We want to have no more than 100 cached items since having many more than that may reduce amount of memory available to server's main thread. We also chose to cache page for no more than one hour, if you expect your pages to stay unchanged for a long time you can increase this value.

Each cached item needs to have a unique key, for example, we can generate key using request's `url` property:

```
function getCacheKey(req) {
  if (req.user) {
    return `${req.url}${req.user.id}`;
  }
  return `${req.url}`;
}
```

Why to include `req.user.id` into the `key`? This is simply a precaution for situation when the same page looks differently for logged-out and logged-in end user. Say, `key` has the same value as `req.url` and does not include `req.user.id`. What happens if our application displays different UI for the same page to logged-out and logged-in end user? The page, if cached, will look the same to logged-out and logged-in user. That would be an unintentional UX bug on our part. If we do include `req.user.id` into `key` - there be two cached versions of the page, one for logged-out state and one for logged-in state. Ultimately, you are in control of how you construct `key`, it will depend on your caching goals.

Ok, so far we have:

```
import { LRUCache } from 'lru-cache';

export default function routesWithCache({ server, app }) {
  const ssrCache = new LRUCache({
    max: 100, // 100 items
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  function getCacheKey(req) {
    if (req.user) {
      return `${req.url}${req.user.id}`;
    }
    return `${req.url}`;
  }

  async function renderAndCache(req, res, pagePath, queryParams) {
    // some code
  }

  server.get('/login-cached', (req, res) => {
    renderAndCache(req, res, '/login', {});
  });
}
```

We can define `renderAndCache` method, inside it we basically need to consider two cases:

-   The cached page already exists on server's memory, if so - serve it
-   The cached page does not exist, render page on server, cache it on server. If there is an error, display on the page.

The cached page already exists, we return it to browser with `res.send(ssrCache.get(key))`:

```
const key = getCacheKey(req);

if (ssrCache.has(key)) {
  res.setHeader('x-cache', 'HIT');
  res.send(ssrCache.get(key));
  return;
}
```

Note we also set value of response's header`x-cache` to `HIT`, we did it so we know when we get cached page,

When cached page does not exist, we do a few things. First, we render page on the server using Next.js's method `renderToHTML` of Next.js server `app`:

```
const renderedPage = await app.renderToHTML(req, res, pagePath, queryParams);
```

We cache rendered page with:

```
ssrCache.set(key, renderedPage);
```

Finally we send rendered page with response:

```
res.send(renderedPage);
```

In case of error, we want to call Next.js's `renderError` method to return error page:

```
app.renderError(err, req, res, pagePath, queryParams);
```

We used three API methods of `lru-cache` package - `has` to check if cached page exists, `get` to access cached page and `set` to cache page:

[https://github.com/isaacs/node-lru-cache#api](https://github.com/isaacs/node-lru-cache#api)

Add above code to `book/10-begin/app/server/routesWithCache.ts` file:

```
import { LRUCache } from 'lru-cache';

export default function routesWithCache({ server, app }) {
  const ssrCache = new LRUCache({
    max: 100, // 100 items
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  function getCacheKey(req) {
    if (req.user) {
      return `${req.url}${req.user.id}`;
    }
    return `${req.url}`;
  }

  async function renderAndCache(req, res, pagePath, queryParams) {
    const key = getCacheKey(req);

    if (ssrCache.has(key)) {
      res.setHeader('x-cache', 'HIT');
      res.send(ssrCache.get(key));
      return;
    }

    try {
      const renderedPage = await app.renderToHTML(req, res, pagePath, queryParams);

      ssrCache.set(key, renderedPage);

      res.send(renderedPage);
    } catch (err) {
      app.renderError(err, req, res, pagePath, queryParams);
    }
  }

  server.get('/login-cached', (req, res) => {
    renderAndCache(req, res, '/login-cached', {});
  });
}
```

Remember to mount these new Express routes! Open `book/10-begin/app/server/server.ts`, add new import at the end of the import section:

```
import routesWithCache from './routesWithCache';
```

Mount new Express routes in this location:

```
setupSitemapAndRobots({ server });

routesWithCache({ server, app });

server.all('*', (req, res) => {
  handle(req, res);
});
```

We will test caching later in this chapter, after we deploy the project to Heroku.

___

## Google Analytics [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#google-analytics)

Your SaaS application will need analytics early on. You could check database or Mailchimp for new signups but in order to see on which page end users land and where they come from you would need more involved analytics. You can start with Google Analytics but if you want to keep your data private you should consider building a custom solution.

API method it works as expected S3 bucket store method calls team members add environmental variable. Page component page component request was sent mount middleware triggers method API method cookie team members AWS dashboard withAuth HOC it works as expected. Session open this file on the client team members Put it all together production-ready if truthy then. Response show notification send this response API infrastructure show notification static method calls team members Put it all together add environmental variable server-side rendering team members. Show notification static method calls team members request email and name store method calls Remember to add import request API infrastructure if truthy then in production server-side rendering Put it all together. End user Navigate to on the client show notification request was sent API method Google OAuth API add environmental variable static method calls MongoDB database triggers method in a browser in production on the client session. Team members show notification We will discuss add environmental variable withAuth HOC on server only Material-UI subsection check if value is truthy email and name compiles it works as expected. Production-ready response open this file You already learned static method calls triggers method Remember to add import API method send this response. In this book At AWS dashboard on the client We will discuss withAuth HOC session Remember to add import compiles data model subsection triggers method. Triggers method Google OAuth API API method Next.js web application check if value is truthy API method calls corresponding store method production-ready API method calls corresponding store method production-ready end user Click on the button data model.

Our application has both pages rendered on server and pages rendered on browser depending on how end user requested a page. We need to make sure that Google Analytics works properly with both types of rendering.

To detect loading of server-side rendered page, we can add global site tag to `MyDocument` HOC:

[https://developers.google.com/analytics/devguides/collection/gtagjs](https://developers.google.com/analytics/devguides/collection/gtagjs)

```
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Let's use this above example to update `MyDocument` HOC, open file `book/10-begin/app/pages/_document.tsx` and add two `script` tags at the end of `Head` element like so:

```
<Head>
    // other code
    </style>
    <script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
    />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `,
      }}
    />
</Head>
```

Now, when end user loads page into browser tab (server-side rendering), Google Analytics will report page view.

But browser-side transitions (client-side rendering) are still not detectable by Google Analytics. We need to find appropriate browser-side event in which we can call `gtag('config', ..., ...)`. We can call it inside `routeChangeComplete` event (event fired when route changes on browser):

[https://nextjs.org/docs/api-reference/next/router#routerevents](https://nextjs.org/docs/api-reference/next/router#routerevents)

Open `book/10-begin/app/lib/withAuth.tsx` file and update block:

```
Router.events.on('routeChangeComplete', (url) => {
  const store = getStore();
  if (store) {
    store.changeCurrentUrl(url);
  }

  NProgress.done();
});
```

To become:

```
Router.events.on('routeChangeComplete', (url) => {
  const store = getStore();
  if (store) {
    store.changeCurrentUrl(url);
  }

  if (window && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }

  NProgress.done();
});
```

Now browser-side route changes will be reported as page views at your Google Analytics dashboard.

Only task that remains is to create property at Google Analytics dashboard. This property's ID is value for environmental variable `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Navigate to `https://analytics.google.com/analytics/web` with your Google account and click on `Admin` icon at the left-bottom:

![Builder Book](https://user-images.githubusercontent.com/10218864/90330044-b122f700-df5e-11ea-8918-a8569cda1c75.png)

Then click on `+ Create Property` button and follow instructions on your screen. After successfully creating property, take its ID and add it to `book/10-begin/app/.env` file.

We will do testing of Google Analytics later in this chapter, after we deploy the project to Heroku.

___

## Self-hosted fonts [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#self-hosted-fonts)

So far in our `APP` web application we used `Roboto` font for all of our text. `Roboto` is a sans-serif family ([https://en.wikipedia.org/wiki/Sans-serif](https://en.wikipedia.org/wiki/Sans-serif)) font, it has good readibility and popular on the web. However, if your business application requires another font or a combination of two or more fonts, you will have to modify `theme.ts` file and `link` element that points to the new font.

In this section, we will show you how to serve self-hosted fonts `IBM Plex Mono` and`Roboto`. Here is what we want to achive:

-   serve `IBM Plex Mono` and `Roboto` fonts that are **hosted on our server** for server-side rendered pages
-   serve `IBM Plex Mono` and `Roboto` fonts that are **hosted on our AWS Cloudfront distribution** for client-side rendered page
-   use `IBM Plex Mono` font for all text in our `APP` web application except for user-generated content inside `PostEditor` and `PostContent` components
-   use `Roboto` font for user-generated content inside `PostEditor` and `PostContent` components

In this section we will use our Cloudfront distribution that we already set up in our AWS account. In the next section, we will show how to host your own resources on your own AWS Cloudfront distribution.

-   To serve fonts from our server, we need to search internet and find `woff2` and `woff` files for each font family and variation.Let's `regular` variation of `IBM Plex Mono` and `regular` variation of `Roboto`. You can go to Google Fonts website and find both fonts:
    
    [https://fonts.google.com/specimen/IBM+Plex+Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
    
    [https://fonts.google.com/specimen/Roboto](https://fonts.google.com/specimen/Roboto)
    
    In the top-right coner, click `Download family` button for each font:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/120345780-a3511f00-c2af-11eb-996d-bca67040e7f6.png)
    
    Extract downloaded folder and find following files: `IBMPlexMono-Regular.ttf` and `Roboto-Regular.ttf`.
    
    Go to [https://cloudconvert.com](https://cloudconvert.com/) and convert each `ttf` file to `woff2` and `woff` files. So you have to have following files after conversion: `IBMPlexMono-Regular.woff2`, `IBMPlexMono-Regular.woff`, `Roboto-Regular.woff2`, `Roboto-Regular.woff`.
    
    We already did this work for you and you can find this files hosted in here:
    
    [https://github.com/async-labs/saas/tree/master/saas/app/public/fonts](https://github.com/async-labs/saas/tree/master/saas/app/public/fonts)
    
    Now open `public` folder of `APP` project, create `fonts` folder in it. Then create two new folders inside `fonts` folder: `IBM-Plex-Mono` folder with two files `IBMPlexMono-Regular.woff2` and `IBMPlexMono-Regular.woff`, and `Roboto` folder with two files `Roboto-Regular.woff2` and `Roboto-Regular.woff`.
    
    Next, let's create a new file directly inside `fonts` folder. We name this file `server.css`, here this file's content:
    
    ```
      @font-face {
        font-family: 'IBM Plex Mono';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: url(./IBM-Plex-Mono/IBMPlexMono-Regular.woff2) format('woff2'), url(./IBM-Plex-Mono/IBMPlexMono-Regular.woff) format('woff');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: url(./Roboto/Roboto-Regular.woff2) format('woff2'), url(./Roboto/Roboto-Regular.woff) format('woff');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    ```
    
    `@font-face` allows us to define font family and load font either from our server or fromCDN server (AWS Cloudfront in our case):
    
    [https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
    
    If create `link` element that points to `server.css` file then font inside `server.css` will become globally available in our application. Our initial goal in this section was to load fonts from our server for server-side rendered pages. We could add following link to `MyDocument` HOC extension:
    
    ```
      <link rel="stylesheet" href="/fonts/server.css" />
    ```
    
    However, to make more concise and easier to read, let's add conditional `link` element to `MyApp` HOC extension instead:
    
    ```
      <link rel="stylesheet" href={isServer ? '/fonts/server.css' : '/fonts/cdn.css'} />
    ```
    
    Open `pages/_app.tsx` file and add above `link` with conditional logic right under line:
    
    ```
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ```
    
    Below following line, define `isServer`:
    
    ```
      const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;
    ```
    
    Define it like this:
    
    ```
      const isServer = typeof window === 'undefined';
    ```
    
    Let's understand what we just did. We told our `APP` project to make fonts from `server.css` file to be globally available for server-side rendered pages. And to make fonts from `cdn.css` file to be globally available for client-side rendered pages. We haven't define `cdn.css` file, we do in the next bullet point.
    
-   To serve font resources from AWS Cloudfront distrubution for client-side rendered pages, all we have to do is to define new `cdn.css` file inside `fonts` folder. Create this file with following content:
    
    ```
      @font-face {
        font-family: 'IBM Plex Mono';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: url(https://d2c24pn6pcl4ug.cloudfront.net/fonts/IBM-Plex-Mono/IBMPlexMono-Regular.woff2) format('woff2'), url(https://d2c24pn6pcl4ug.cloudfront.net/fonts/IBM-Plex-Mono/IBMPlexMono-Regular.woff) format('woff');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: url(https://d2c24pn6pcl4ug.cloudfront.net/fonts/Roboto/Roboto-Regular.woff2) format('woff2'), url(https://d2c24pn6pcl4ug.cloudfront.net/fonts/Roboto/Roboto-Regular.woff) format('woff');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    ```
    
    The content of this file is practically identical to the content of `server.css` file, only difference is value for `src` property. In `server.css` file, we load fonts from **our server**. In `cdn.css` file, we load fonts from **CDN server**.
    
    It's important to mention `font-display` property:
    
    [https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
    
    Setting value of `font-display` to `swap` will create a very brief flash of style for text. If you don't like short flash, you can set value to `block`. A browser will show fallback font for a brief moment and then, once our font is finished loading, will show our font. If internet speed is fast then our users will likely never experience flash of style for text. You can also provide fallback fonts that are very similar to `IBM Plex Mono` and `Roboto`. If fallback fonts are very similar to fonts we are trying to load then flash of style for text is hardly noticeable. For `IBM Plex Mono`, most similar fallback font is `monospace`. For `Roboto`, most similar fallback font is `sans-serif`.
    
    If for some reason a possibility of brief flash of style of text is not acceptable, you can use `block` value instead of `swap`. In `block` case, browser will not show page until our fonts finished loading.
    
-   Let's tell our themes to use `IBM Plex Mono` by default. When we don't specify value for `typography.fontFamily` property, Material-UI library automatically uses `Roboto` for all text. Our goal is, however, to use `IBM Plex Mono` for all text with few exceptions. Open `lib/theme.ts` file, find `typography.fontFamily` property. Update value to `IBM Plex Mono` and its fallback font `monospace`:
    
    ```
      fontFamily: ['IBM Plex Mono', 'monospace'].join(','),
    ```
    
    Please remember to do it for both `themeDark` and `themeLight` themes.
    
-   We want `Roboto` font in user-generated content. To do so, open file with `PostEditor` component, find `MentionsInput` component, replace `fontWeight: 300` style with `fontFamily: 'Roboto, sans-serif'`. Next, open file with `PostContent` component, find the only `div` element, , replace `fontWeight: 300` style with `fontFamily: 'Roboto, sans-serif'`.
    

Start both `APP` and `API` projects. Log in and load any discussion, access this discussion either by reloading tab (server-side rendering) or by clicking on the `Link` iniside `DiscussionList` (client-side rendering). You will see two distinct fonts and no flash of style (since fonts fetched on server locally match fonts fetched on browser from Cloudfront):

![Builder Book](https://user-images.githubusercontent.com/10218864/120352541-b666ed80-c2b5-11eb-9c6a-57149134639e.png)

If you have slow internet (say low cellular signal), you may see a brief flash of style for text when font switches from fallback font to loaded font.

___

## AWS Cloudfront [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#aws-cloudfront)

In the previous section we served page on browser with fonts from domain that ends with `cloudfront.net`. AWS Cloudfront is CDN service ([https://en.wikipedia.org/wiki/Content\_delivery\_network](https://en.wikipedia.org/wiki/Content_delivery_network)) that allows us to geographically distribute our resources so that our resources are hosted closer to our users.

There are many CDN services out there, in this book we show how to create AWS Cloudfront distribution for resources hosted in AWS S3 bucket. You are already familiar with S3 service since we used it to implement file upload and hosting of user avatars and team logos. Go to AWS S3 dashboard and create bucket with informative name. Your bucket should not have public access:

![Builder Book](https://user-images.githubusercontent.com/10218864/120087560-d15f1500-c09d-11eb-8723-8da85ffcdb95.png)

Add folder and files to your bucket. Add any resource that you want to deliver to your web users via CDN. Bucket's content should be similar to content of `public` folder of your Next.js web application (`APP` project):

![Builder Book](https://user-images.githubusercontent.com/10218864/120087620-4fbbb700-c09e-11eb-9381-122c12e04260.png)

On the same page, add CORS configuration to your bucket:

```
[
    {
        "AllowedHeaders": [
            "x-amz-meta-*",
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://saas-app.async-await.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ]
    }
]
```

Please make sure to add your actuall values to `AllowedOrigins`. You have to add your development and production origins.

We are done with AWS S3 dashboard for now.

Go to AWS Cloudfront dashboard and click `Create Distribution` button, then click `Get Started`:

![Builder Book](https://user-images.githubusercontent.com/10218864/120087711-22bbd400-c09f-11eb-9eb1-10701839ce08.png)

![Builder Book](https://user-images.githubusercontent.com/10218864/120353897-dd71ef00-c2b6-11eb-9335-c461cec71651.png)

Select highlighted options as shown on the above screenshots. Leave the rest of default options without change. If you don't have `Cache Policy` and `Origin Request Policy`. You can click `Create a new policy` for each setting. Then provide informative name for each policy and also select following options.

For `Cache Policy`:

![Builder Book](https://user-images.githubusercontent.com/10218864/120355454-2aa29080-c2b8-11eb-8081-f0c07b1a6d71.png)

For `Origin Request Policy`:

![Builder Book](https://user-images.githubusercontent.com/10218864/120355492-31310800-c2b8-11eb-8d52-a23be089be1e.png)

Click `Create Distribution`.

Your S3 bucket's policy will automatically change from empty to something like this:

![Builder Book](https://user-images.githubusercontent.com/10218864/120088013-919a2c80-c0a1-11eb-9544-be50d9fd5722.png)

After 10-20 min, your new distribution will be deployed. `Status` and `State` will have values of `Deployed` and `Enabled`, respectively:

![Builder Book](https://user-images.githubusercontent.com/10218864/120087921-ca85d180-c0a0-11eb-9b25-a7df9cf4ceb5.png)

After your distribution is ready to server resources, simply append `https://xxxxxxxxxxx.cloudfront.net` to relative path of any file in your original S3 bucket. For example:

```
https://d2c24pn6pcl4ug.cloudfront.net/images/builderbook-logo.svg
```

Use these new paths in your deployed production-ready web application for any resources (images, fonts, etc).

___

## Material icons [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#material-icons)

Earlier in this book we added this `link` to `MyDocument` HOC extension of `APP` project:

```
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
```

Doing so allows to add Material icons anywhere inside our pages and non-page components. For example, we added `arrow_drop_down` icon to our `Layout`:

```
<i className="material-icons" color="action" style={{ verticalAlign: 'super' }}>
  arrow_drop_down
</i>
```

We had to follow two requirements. One is to use `i` HTML element with class name with value `material-icons`. And second one is to use existing icon name. All available icons are listed here:

[https://fonts.google.com/icons](https://fonts.google.com/icons)

In this section, we change the source of icons, as a result we change the way we add icons as well. Since we heavily relied on `@material-ui` library for building our `APP` project, let's get our icons from this library as well.

Open terminal, navigate to `APP` project on your terminal and run following command to install new package:

```
yarn add @material-ui/icons@^4.11.2
```

Remove line this line from `MyDocument` HOC extension:

```
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
```

Next, we need to find all Material icons in our codebase and replace them with corresponding Material-UI icons. The list of all Material-UI icons can be found here:

[https://material-ui.com/components/material-icons/](https://material-ui.com/components/material-icons/)

Open file with `Layout` HOC and find:

```
<i className="material-icons" color="action" style={{ verticalAlign: 'super' }}>
  arrow_drop_down
</i>
```

Replace it with:

```
<ArrowDropDownIcon color="action" style={{ verticalAlign: 'super' }} />
```

Please do remember to import `ArrowDropDownIcon`:

```
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
```

We let you to replace the rest of the icons in `APP` codebase. You will have to edit following components:

-   one more icon in `Layout`
-   `MenuWithMenuItems`
-   `DiscussionList`
-   `PostEditor`
-   `Billing`
-   `TeamSettings`
-   `YourSettings`

When in doubt, check up final codebase located at `saas/book/10-end/app`. You can search within this codebase using VS code editor using search term `@material-ui/icons`. Remember to exclude `node_modules`, `yarn.lock`, `package.json` and `.next`.

___

## mobx v6 [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#mobx-v6)

In this section, we upgrade `mobx` and `mobx-react` packages to version 6. We discuss and deal with breaking change.

You can learn about improvements made in version 6 of `mobx` library:

[https://michel.codes/blogs/mobx6](https://michel.codes/blogs/mobx6)

The main consequence of migrating to version 6 for us, web developers who maintain our codebases, is breaking change - the retirement of decorators and `decorate` utility.

On your terminal, navigate to `APP` project and run:

```
yarn remove mobx mobx-react
```

Then run:

```
yarn add mobx@^6.3.1 mobx-react@^6.3.1
```

Since we already did not use decorators individually (`@observable`, `@action`, `@computed`), our migration process will not be too hard. We used `decorate` utility instead of individual decorators, so we need to retire `decorate` utility. After we retire `decorate` utility, we still need to tell `mobx` library that we want to create observable state for some data in our `APP` project. Instead of `decorate` utility, we do so with `makeObservable`:

[https://mobx.js.org/observable-state.html](https://mobx.js.org/observable-state.html)

Which, according to docs, we call inside class's constructor (where class with observable properties is what we called data store in our book).

Example of usage from docs:

```
import { makeObservable, observable, computed, action, flow } from "mobx"

class Doubler {
    value

    constructor(value) {
        makeObservable(this, {
            value: observable,
            double: computed,
            increment: action,
            fetch: flow
        })
        this.value = value
    }

    get double() {
        return this.value * 2
    }

    increment() {
        this.value++
    }

    *fetch() {
        const response = yield fetch("/api/value")
        this.value = response.json()
    }
}
```

Let's migrate `User` data store together and then you can do `Team`, `Post` and `Discussion` on your own.

Open `lib/store/user.ts` file:

-   Import `makeObservable` instead of `decorate`:
    
    ```
      import { action, observable, runInAction, makeObservable } from 'mobx';
    ```
    
-   Inside `User.constructor`, call `makeObservable` like this:
    
    ```
      makeObservable(this, {
        slug: observable,
        email: observable,
        displayName: observable,
        avatarUrl: observable,
        // darkTheme: observable,
        defaultTeamSlug: observable,
        stripeCard: observable,
        stripeListOfInvoices: observable,
    
        updateProfile: action,
        toggleTheme: action,
        getListOfInvoices: action,
      });
    ```
    
-   Delete `decorate` block completely:
    
    ```
      decorate(User, {
        slug: observable,
        email: observable,
        displayName: observable,
        avatarUrl: observable,
        // darkTheme: observable,
        defaultTeamSlug: observable,
        stripeCard: observable,
        stripeListOfInvoices: observable,
    
        updateProfile: action,
        toggleTheme: action,
        getListOfInvoices: action,
      });
    ```
    

Go ahead and do exact same migration for `Team`, `Post`, `Discussion`, main data stores in `lib/store/team.ts`, `lib/store/post.ts`, `lib/store/discussion.ts`, `lib/store/index.ts` files respectively.

In `lib/store/index.ts` file, replace line:

```
mobx.configure({ enforceActions: 'observed' });
```

With line:

```
configure({ enforceActions: 'observed' });
```

So your import from `mobx` utlimately becomes:

```
import { action, configure, IObservableArray, observable, makeObservable } from 'mobx';
```

We are done with migration!

Before we conclude this section let's make few improvements to our `APP` code. These improvements are completely optional and we doing to increase consistency of our code.

**First improvement** is simply replacing route `/team/:teamSlug` with `/teams/:teamSlug` since it is more consistent with routing on the web and routing in our own application (we already used `/discussions/:discussionSlug`). Here are places in our codebase where you need to make updates:

-   All Express routes that contain `/team/:teamSlug` inside `server/server.ts`
-   One instance `Router.replace` in `DiscussionPageComp` page inside `pages/discussion.tsx`
-   Two instances of `Router.push` in `CreateTeam` page inside `pages/create-team.tsx`
-   Two instances of `Router.push` in `Team` data store inside `lib/store/team.ts`
-   Multiple instances in `Layout`, `PostEditor`, `DiscussionActionMenu`, `CreateDiscussionForm` components

**Second improvement**. Let's add `/teams/:teamSlug` to the route of `YourSettings` page for route consistency. Open `server/server.ts` file and add new Express route:

```
server.get('/teams/:teamSlug/your-settings', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/your-settings', { teamSlug });
});
```

Open `lib/withAuth.tsx` file, find block of code:

```
if (user) {
  if (!user.defaultTeamSlug) {
    redirectUrl = '/create-team';
    asUrl = '/create-team';
  } else {
    redirectUrl = `/your-settings`;
    asUrl = `/your-settings`;
  }
}
```

And replace it with:

```
if (user) {
  if (!user.defaultTeamSlug) {
    redirectUrl = '/create-team';
    asUrl = '/create-team';
  } else {
    redirectUrl = `/your-settings?teamSlug=${user.defaultTeamSlug}`;
    asUrl = `/teams/${user.defaultTeamSlug}/your-settings`;
  }
}
```

Open `components/layout/index.tsx` and replace:

```
{
  text: 'Team Settings',
  href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
  as: `/teams/${store.currentTeam.slug}/team-settings`,
  simple: true,
},
{
  text: 'Billing',
  href: `/billing?teamSlug=${store.currentTeam.slug}`,
  as: `/teams/${store.currentTeam.slug}/billing`,
  simple: true,
},
{
  text: 'Your Settings',
  href: '/your-settings',
  highlighterSlug: '/your-settings',
},
```

With:

```
{
  text: 'Your Settings',
  href: `/your-settings?teamSlug=${store.currentTeam.slug}`,
  as: `/teams/${store.currentTeam.slug}/your-settings`,
  highlighterSlug: '/your-settings',
},
{
  text: 'Team Settings',
  href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
  as: `/teams/${store.currentTeam.slug}/team-settings`,
  highlighterSlug: '/team-settings',
},
{
  text: 'Billing',
  href: `/billing?teamSlug=${store.currentTeam.slug}`,
  as: `/teams/${store.currentTeam.slug}/billing`,
  highlighterSlug: '/billing',
},
```

Open `pages/_app.tsx` file, inside `MyApp` HOC extension, find this block:

```
if (
  ctx.pathname.includes('/team-settings') ||
  ctx.pathname.includes('/discussion') ||
  ctx.pathname.includes('/billing')
) {
  teamRequired = true;
}
```

Replace it with:

```
if (
  ctx.pathname.includes('/your-settings') ||
  ctx.pathname.includes('/team-settings') ||
  ctx.pathname.includes('/discussion') ||
  ctx.pathname.includes('/billing')
) {
  teamRequired = true;
}
```

**Third improvement**. Let's call `this.setCurrentTeam` in the same way we call `this.setCurrentUser` inside `Store.constructor` (contructor method of main store). Open `lib/store/index.ts`, find block:

```
if (initialState.teamSlug || (initialState.user && initialState.user.defaultTeamSlug)) {
  this.setCurrentTeam(
    initialState.teamSlug || initialState.user.defaultTeamSlug,
    initialState.teams,
  );
}
```

Replace it with simpler:

```
this.setCurrentTeam(initialState.team);
```

The above simplification forces us:

-   To make changes to the definition of `setCurrentTeam`
-   To define `initialState.team`. We haven't defined `initialState.team` before, only `initialState.teams`.
-   Retire `getTeamListApiMethod` API method and corresponding Express route

Inside `lib/store/index.ts`, find definition of `setCurrentTeam`:

```
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
```

Replace it with updated definition:

```
public async setCurrentTeam(team) {
  if (this.currentTeam) {
    if (this.currentTeam.slug === team.slug) {
      return;
    }
  }

  if (team) {
    this.currentTeam = new Team({ ...team, store: this });

    const users =
      team.initialMembers || (await getTeamMembersApiMethod(this.currentTeam._id)).users;

    const invitations =
      team.initialInvitations ||
      (await getTeamInvitationsApiMethod(this.currentTeam._id)).invitations;

    this.currentTeam.setInitialMembersAndInvitations(users, invitations);
  } else {
    this.currentTeam = null;
  }
}
```

We defined `initialState` inside `MyApp.getInitialProps`. Open `pages/_app.tsx` file and find return block for `MyApp.getInitialProps`:

```
return {
  ...appProps,
  initialState: { user: userObj, currentUrl: ctx.asPath, teamSlug, ...initialData },
};
```

So you see how we defined, for example, `initialState.user`.

We need to define `team` and add it to `initialState` inside return block. Let's do so by adding following definition of `team` just above return block of `MyApp.getInitialProps`:

```
let selectedTeamSlug = '';

if (teamSlug) {
  selectedTeamSlug = teamSlug;
} else {
  selectedTeamSlug = userObj && userObj.defaultTeamSlug;
}

const team =
  initialData &&
  initialData.teams &&
  initialData.teams.find((t) => t.slug === selectedTeamSlug);
```

As you can see from the above `team` definition, we don't have to change shape of `initialData`, data returned from `API` server. It's good not to mess with data returned from server since it may require additional changes in both `API` and `APP` codebases.

Let's retire `getTeamListApiMethod` API method. Inside `lib/store/index.ts`, update import line to become:

```
import { getTeamMembersApiMethod } from '../api/team-member';
```

Open `lib/api/team-member.ts` file and remove:

```
export const getTeamListApiMethod = () =>
  sendRequestAndGetResponse(`${BASE_PATH}/teams`, {
    method: 'GET',
  });
```

Go to `API` codebase, open `server/api/team-member.ts`, remove Express route:

```
router.get('/teams', async (req, res, next) => {
  try {
    const teams = await Team.getAllTeamsForUser(req.user.id);

    console.log(teams);

    res.json({ teams });
  } catch (err) {
    next(err);
  }
});
```

We are done with our third improvement!

Finally let's small UI improvement, let's show logged-in user name of the current team. Open `components/layout/index.tsx` inside `app` project, find `LensIcon` component, add following `h4` element under it like so:

```
<LensIcon
  style={{
    float: 'left',
    margin: '15px 0px 10px 25px',
    opacity: 0.8,
    fontSize: '18px',
    cursor: 'pointer',
    verticalAlign: 'top',
  }}
  onClick={async () => {
    await store.currentUser.toggleTheme(!store.currentUser.darkTheme);
  }}
/>
<h4
  style={{
    margin: '15px 0px 10px 30px',
    fontWeight: 300,
  }}
>
  Current team: <b>{store.currentTeam.name}</b>
</h4>
```

Done with improvements.

___

## Define missing data types in API project [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#define-missing-data-types-in-api-project)

We added many server-only methods to our `API` server throught this book. We haven't always defined data types for arguments of such methods. It's a good practice and good place to add data types to these method before we deploy `API` server.

We were pretty with defining data types for Model's static methods but not for some external API infrastructures. In this section, we will add data types to following files `aws-s3.ts`, `stripe.ts` and `mailchimp.ts`.

Open `aws-s3.ts` file, find `signRequestForUpload` method, add data types to its argument like so:

```
async function signRequestForUpload({
  fileName,
  fileType,
  prefix,
  bucket,
}: {
  fileName: string;
  fileType: string;
  prefix: string;
  bucket: string;
})
```

Open `stripe.ts` file, find `createSession` method, add data types to its argument like so:

```
function createSession({
  userId,
  teamId,
  teamSlug,
  customerId,
  subscriptionId,
  userEmail,
  mode,
}: {
  userId: string;
  teamId: string;
  teamSlug: string;
  customerId: string;
  subscriptionId: string;
  userEmail: string;
  mode: Stripe.Checkout.SessionCreateParams.Mode;
})
```

We leave it to you to add data types to `cancelSubscription`, `getListOfInvoices` and `stripeWebhookAndCheckoutCallback`. Type for Express server can be defined as `express.Application`. Please remember to add any missing imports.

Open `mailchimp.ts` file, find `callAPI` method, add data types to its argument like so:

```
function callAPI({
  path,
  method,
  data,
}: {
  path: string;
  method: string;
  data: {
    email_address: string;
    status: string;
  };
}): Promise<Response>
```

In the same file, find `addToMailchimp` and add data types:

```
addToMailchimp({ email, listName }: { email: string; listName: string })
```

Feels good, right? Because adding types is one time task and it pays over time when you manage and extend your codebase.

___

## Next.js v13, Material-UI v5, other packages [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#next-js-v13-material-ui-v5-other-packages)

In this section we will upgrade multiple packages. After upgrading Material-UI library to version 5.x.x our codebase has to modified since a lot of introduced changes are breaking changes.

Instead of upgrading each package individually, we recommend doing following steps inside your working directory (root of your project):

-   Delete `node_modules` folder inside `book/10-begin/app`, `book/10-begin/api`, and `book/10-begin/lambda`
    
-   Delete `yarn.lock` folder inside `book/10-begin/app`, `book/10-begin/api`, and `book/10-begin/lambda`
    
-   Open `book/10-begin/app/package.json` file and modify it. Current content of the `package.json` file:
    
    ```
      {
        "name": "10-begin-app",
        "version": "1",
        "license": "MIT",
        "scripts": {
          "dev": "nodemon server/server.ts",
          "build": "next build",
          "lint": "eslint . --ext .ts,.tsx"
        },
        "dependencies": {
          "@material-ui/core": "^4.11.4",
          "@material-ui/lab": "^4.0.0-alpha.56",
          "@material-ui/styles": "^4.11.4",
          "@stripe/stripe-js": "^2.2.0",
          "dotenv": "^16.3.1",
          "express": "^4.18.2",
          "he": "^1.2.0",
          "isomorphic-unfetch": "^4.0.2",
          "keycode": "^2.2.0",
          "marked": "^11.0.0",
          "mobx": "5.15.7",
          "mobx-react": "6.3.1",
          "moment": "^2.29.4",
          "next": "^14.0.3",
          "nprogress": "^0.2.0",
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-mentions": "^4.4.10",
          "socket.io-client": "^4.7.2",
          "typescript": "^5.3.2"
        },
        "devDependencies": {
          "@types/express": "^4.17.21",
          "@types/he": "^1.2.3",
          "@types/marked": "^6.0.0",
          "@types/node": "^20.10.3",
          "@types/react": "^18.2.42",
          "@types/react-dom": "^18.2.17",
          "@types/socket.io-client": "^3.0.0",
          "@typescript-eslint/eslint-plugin": "^6.13.2",
          "@typescript-eslint/parser": "^6.13.2",
          "eslint": "^8.55.0",
          "eslint-config-prettier": "^9.1.0",
          "eslint-plugin-prettier": "^5.0.1",
          "eslint-plugin-react": "^7.33.2",
          "nodemon": "^3.0.2",
          "prettier": "^3.1.0",
          "ts-node": "^10.9.1"
        }
      }
    ```
    
    Update this `book/10-begin/app/package.json` file so its content becomes:
    
    ```
      {
        "name": "app-same-as-10-end-app",
        "version": "1.0.0",
        "license": "MIT",
        "engines": {
          "node": "18.17.0",
          "yarn": "1.22.19"
        },
        "scripts": {
          "dev": "nodemon server/server.ts",
          "lint": "eslint . --ext .ts,.tsx",
          "postinstall": "rm -rf production-server/",
          "build": "next build && tsc --project tsconfig.server.json && cp server/robots.txt production-server",
          "start": "node production-server/server.js"
        },
        "dependencies": {
          "@emotion/cache": "^11.11.0",
          "@emotion/react": "^11.11.1",
          "@emotion/server": "^11.11.0",
          "@emotion/styled": "^11.11.0",
          "@mui/icons-material": "^5.14.19",
          "@mui/material": "^5.14.20",
          "@stripe/stripe-js": "^2.2.0",
          "express": "^4.18.2",
          "he": "^1.2.0",
          "isomorphic-unfetch": "^4.0.1",
          "keycode": "^2.2.0",
          "lru-cache": "^10.1.0",
          "marked": "^11.0.0",
          "mobx": "^6.12.0",
          "mobx-react": "^9.1.0",
          "moment": "^2.29.4",
          "next": "^14.0.3",
          "nprogress": "0.2.0",
          "next-transpile-modules": "^10.0.1",
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-mentions": "^4.4.10",
          "sitemap": "^7.1.1",
          "socket.io-client": "^4.7.2",
          "typescript": "^5.3.2"
        },
        "devDependencies": {
          "@babel/core": "^7.23.5",
          "@babel/plugin-proposal-private-methods": "^7.18.6",
          "@babel/plugin-proposal-private-property-in-object": "^7.21.11",
          "@types/express": "^4.17.21",
          "@types/he": "^1.2.3",
          "@types/node": "^20.10.3",
          "@types/react": "^18.2.42",
          "@types/react-dom": "^18.2.17",
          "@typescript-eslint/eslint-plugin": "^6.13.2",
          "@typescript-eslint/parser": "^6.13.2",
          "babel-eslint": "^10.1.0",
          "eslint": "^8.55.0",
          "eslint-config-prettier": "^9.1.0",
          "eslint-plugin-prettier": "^5.0.1",
          "eslint-plugin-react": "^7.33.2",
          "nodemon": "^3.0.2",
          "prettier": "^3.1.0",
          "ts-node": "^10.9.1"
        }
      }
    ```
    
-   Open `book/10-begin/api/package.json` file and modify it. Current content of the `package.json` file:
    
    ```
      {
        "name": "10-begin-api",
        "version": "1",
        "license": "MIT",
        "scripts": {
          "dev": "nodemon server/server.ts",
          "lint": "eslint . --ext .ts,.tsx",
          "test": "jest"
        },
        "jest": {
          "preset": "ts-jest",
          "testPathIgnorePatterns": [
            "production-server"
          ],
          "testEnvironment": "node"
        },
        "dependencies": {
          "aws-sdk": "^2.1512.0",
          "bcrypt": "^5.1.1",
          "connect-mongo": "^5.1.0",
          "cors": "^2.8.5",
          "dotenv": "^16.3.1",
          "express": "^4.18.2",
          "express-session": "^1.17.1",
          "he": "^1.2.0",
          "highlight.js": "^11.9.0",
          "lodash": "^4.17.20",
          "marked": "^11.0.0",
          "mongoose": "^8.0.2",
          "node-fetch": "2.6.1",
          "passport": "^0.7.0",
          "passport-google-oauth": "^2.0.0",
          "passwordless": "^1.1.3",
          "passwordless-tokenstore": "^0.0.10",
          "socket.io": "^4.7.2",
          "stripe": "^14.7.0",
          "typescript": "^5.3.2"
        },
        "devDependencies": {
          "@types/connect-mongo": "^3.1.3",
          "@types/dotenv": "^8.2.0",
          "@types/express": "^4.17.21",
          "@types/express-session": "^1.17.10",
          "@types/jest": "^29.5.11",
          "@types/lodash": "^4.14.202",
          "@types/mongoose": "^5.5.43",
          "@types/node": "^20.10.3",
          "@types/node-fetch": "^2.6.9",
          "@types/passport": "^1.0.16",
          "@types/socket.io": "^3.0.2",
          "@typescript-eslint/eslint-plugin": "^6.13.2",
          "@typescript-eslint/parser": "^6.13.2",
          "eslint": "^8.55.0",
          "eslint-config-prettier": "^9.1.0",
          "eslint-plugin-prettier": "^5.0.1",
          "jest": "^29.7.0",
          "nodemon": "^3.0.2",
          "prettier": "^3.1.0",
          "ts-jest": "^29.1.1",
          "ts-node": "^10.9.1"
        }
      }
    ```
    
    Update this `book/10-begin/api/package.json` file so its content becomes:
    
    ```
      {
        "name": "api-same-as-10-end-api",
        "version": "1.0.0",
        "license": "MIT",
        "engines": {
          "node": "18.17.0",
          "yarn": "1.22.19"
        },
        "scripts": {
          "dev": "nodemon server/server.ts",
          "lint": "eslint . --ext .ts,.tsx",
          "test": "jest",
          "postinstall": "rm -rf production-server/",
          "build": "tsc --project tsconfig.json",
          "start": "node production-server/server.js"
        },
        "jest": {
          "preset": "ts-jest",
          "testPathIgnorePatterns": [
            "production-server"
          ],
          "testEnvironment": "node"
        },
        "dependencies": {
          "aws-sdk": "^2.1512.0",
          "bcryptjs": "^2.4.3",
          "compression": "^1.7.4",
          "connect-mongo": "^5.1.0",
          "cors": "^2.8.5",
          "dotenv": "^16.3.1",
          "express": "^4.18.2",
          "express-session": "^1.17.3",
          "he": "^1.2.0",
          "helmet": "7.1.0",
          "highlight.js": "^11.9.0",
          "lodash": "^4.17.21",
          "marked": "^11.0.0",
          "mongoose": "^8.0.2",
          "node-fetch": "2.6.1",
          "passport": "^0.7.0",
          "passport-google-oauth": "^2.0.0",
          "passwordless": "^1.1.3",
          "passwordless-tokenstore": "^0.0.10",
          "socket.io": "^4.7.2",
          "stripe": "^14.7.0",
          "typescript": "^5.3.2",
          "winston": "^3.11.0"
        },
        "devDependencies": {
          "@types/connect-mongo": "^3.1.3",
          "@types/dotenv": "^8.2.0",
          "@types/express": "^4.17.21",
          "@types/express-session": "^1.17.10",
          "@types/jest": "^29.5.11",
          "@types/lodash": "^4.14.202",
          "@types/mongoose": "^5.11.97",
          "@types/node": "^20.10.3",
          "@types/node-fetch": "^2.6.9",
          "@types/passport": "^1.0.16",
          "@types/socket.io": "^3.0.2",
          "@typescript-eslint/eslint-plugin": "^6.13.2",
          "@typescript-eslint/parser": "^6.13.2",
          "eslint": "^8.55.0",
          "eslint-config-prettier": "^9.1.0",
          "eslint-plugin-prettier": "^5.0.1",
          "jest": "^29.7.0",
          "nodemon": "^3.0.2",
          "prettier": "^3.1.0",
          "ts-jest": "^29.1.1",
          "ts-node": "^10.9.1"
        }
      }
    ```
    

-   Open `book/10-begin/lambda/package.json` file and modify it. Current content of the `package.json` file:
    
    ```
      {
        "name": "lambda",
        "version": "1",
        "license": "MIT",
        "scripts": {
          "lint": "eslint . --ext .ts,.tsx",
          "trigger": "ts-node handler.ts"
        },
        "dependencies": {
          "aws-sdk": "^2.1512.0",
          "bcrypt": "^5.1.1",
          "connect-mongo": "^5.1.0",
          "cors": "^2.8.5",
          "dotenv": "^16.3.1",
          "express": "^4.18.2",
          "express-session": "^1.17.3",
          "he": "^1.2.0",
          "highlight.js": "^11.9.0",
          "lodash": "^4.17.21",
          "marked": "^11.0.0",
          "mongoose": "^8.0.2",
          "node-fetch": "2.6.1",
          "passport": "^0.7.0",
          "passport-google-oauth": "^2.0.0",
          "passwordless": "^1.1.3",
          "passwordless-tokenstore": "^0.0.10",
          "socket.io": "^4.7.2",
          "stripe": "^14.7.0",
          "typescript": "^5.3.2"
        },
        "devDependencies": {
          "@types/connect-mongo": "^3.1.3",
          "@types/dotenv": "^8.2.0",
          "@types/express": "^4.17.21",
          "@types/express-session": "^1.17.10",
          "@types/jest": "^29.5.11",
          "@types/lodash": "^4.14.202",
          "@types/mongoose": "^5.11.97",
          "@types/node": "^20.10.3",
          "@types/node-fetch": "^2.6.9",
          "@types/passport": "^1.0.16",
          "@types/socket.io": "^3.0.2",
          "@typescript-eslint/eslint-plugin": "^6.13.2",
          "@typescript-eslint/parser": "^6.13.2",
          "eslint": "^8.55.0",
          "eslint-config-prettier": "^9.1.0",
          "eslint-plugin-prettier": "^5.0.1",
          "jest": "^29.7.0",
          "prettier": "^3.1.0",
          "serverless-dotenv-plugin": "^6.0.0",
          "serverless-plugin-typescript": "^2.1.5",
          "ts-jest": "^29.1.1",
          "ts-node-dev": "^2.0.0"
        }
      }
    ```
    
    Update this `book/10-begin/lambda/package.json` file so its content becomes:
    
    ```
      {
        "name": "lambda",
        "version": "1.0.0",
        "license": "MIT",
        "scripts": {
          "lint": "eslint . --ext .ts,.tsx"
        },
        "dependencies": {
          "aws-sdk": "^2.1286.0",
          "bcrypt": "^5.1.0",
          "connect-mongo": "^4.6.0",
          "cors": "^2.8.5",
          "dotenv": "^16.0.3",
          "express": "^4.18.2",
          "express-session": "^1.17.3",
          "he": "^1.2.0",
          "highlight.js": "^11.7.0",
          "lodash": "^4.17.21",
          "marked": "^4.2.5",
          "mongoose": "^6.8.2",
          "node-fetch": "^3.3.0",
          "passport": "^0.6.0",
          "passport-google-oauth": "^2.0.0",
          "passwordless": "^1.1.3",
          "passwordless-tokenstore": "^0.0.10",
          "socket.io": "^4.5.4",
          "stripe": "^11.5.0",
          "typescript": "^4.9.4",
          "winston": "^3.8.2"
        },
        "devDependencies": {
          "@types/connect-mongo": "^3.1.3",
          "@types/dotenv": "^8.2.0",
          "@types/express": "^4.17.15",
          "@types/express-session": "^1.17.5",
          "@types/jest": "^29.2.5",
          "@types/lodash": "^4.14.191",
          "@types/mongoose": "^5.11.97",
          "@types/node": "^18.11.18",
          "@types/node-fetch": "^2.6.2",
          "@types/passport": "^1.0.11",
          "@types/socket.io": "^3.0.2",
          "@typescript-eslint/eslint-plugin": "^5.47.1",
          "@typescript-eslint/parser": "^5.47.1",
          "eslint": "^8.31.0",
          "eslint-config-prettier": "^8.5.0",
          "eslint-plugin-prettier": "^4.2.1",
          "jest": "^29.3.1",
          "prettier": "^2.8.1",
          "serverless-dotenv-plugin": "^4.0.2",
          "serverless-plugin-typescript": "^2.1.4",
          "ts-jest": "^29.0.3",
          "ts-node-dev": "^2.0.0"
        }
      }
    ```
    
-   Update `book/10-begin/app/.babelrc` so its content becomes:
    
    ```
      {
        "presets": [
          [
            "next/babel",
            {
              "class-properties": { "loose": true }
            }
          ]
        ],
        "plugins": [["@babel/plugin-proposal-private-property-in-object", { "loose": true }], ["@babel/plugin-proposal-private-methods", { "loose": true }]]
      }
    ```
    
-   Update `book/10-end/lambda/serverless.yml` so its content becomes:
    
    ```
      service: saas-boilerplate 
    
      useDotenv: true
      provider:
        name: aws
        runtime: nodejs16.x
        stage: production
        region: us-east-1
        memorySize: 2048 # optional, in MB, default is 1024
        timeout: 30 # optional, in seconds, default is 6
        # profile: saas
    
      plugins:
        - serverless-plugin-typescript
        - serverless-dotenv-plugin
    
      custom:
        dotenv:
          include:
            - NODE_ENV
            - MONGO_URL_TEST
            - MONGO_URL
            - AWS_ACCESSKEYID
            - AWS_SECRETACCESSKEY
            - EMAIL_SUPPORT_FROM_ADDRESS
            - URL_APP
            - PRODUCTION_URL_APP
    
      functions:
        sendEmailForNewPost:
          handler: handler.sendEmailForNewPost
    ```
    
-   At `app` project's root (`book/10-begin/app`), run `yarn` to install packages. Make sure `node_modules` folder and `yarn.lock` file get successfully generated at project's root.
    
-   At `api` project's root (`book/10-begin/api`), run `yarn` to install packages. Make sure `node_modules` folder and `yarn.lock` file get successfully generated at project's root.
    
-   At `lambda` project's root (`book/10-begin/lambda`), run `yarn` to install packages. Make sure `node_modules` folder and `yarn.lock` file get successfully generated at project's root.
    

Let's discuss what we need to change in our codebase to avoid breaking changes from upgrading Next.js to version 13.x.x inside `app` project (`book/10-begin/app`). Note that we added `@babel/core` to `devDependencies`, this is done because in some conditions installing `next` does not result in installation of `@babel/core`. After installing all packages from your updated `package.json` file, navigate to `node_modules/@babel` folder. If you don't find folder `node_modules/@babel/core`, then you can run this command in your terminal to install it:

```
yarn add @babel/core@^7.16.0 --dev
```

We also need to update `app/next.config.js`. The current content is:

```
module.exports = {
  poweredByHeader: false,
  webpack5: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

Update the content of `app/next.config.js` to be:

```
const withTM = require('next-transpile-modules')([ // eslint-disable-line
  '@mui/material',
  '@mui/icons-material',
]);

module.exports = withTM({
  typescript: {
    ignoreBuildErrors: 'true',
  },
  poweredByHeader: false,
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  },
  modularizeImports: {
    '@mui/material/?(((\\w*)?/?)*)': {
      transform: '@mui/material/{{ matches.[1] }}/{{member}}',
    },
    '@mui/icons-material/?(((\\w*)?/?)*)': {
      transform: '@mui/icons-material/{{ matches.[1] }}/{{member}}',
    },
  },
});
```

Alright, we are done with code changes required after `next` upgrade. Let's work on code changes required for upgrading Material-UI to version 5.x.x. Here are all packages related to Material-UI and its integration with Next.js:

```
"@emotion/cache": "^11.10.5",
"@emotion/react": "^11.10.5",
"@emotion/server": "^11.10.0",
"@emotion/styled": "^11.10.5",
"@mui/icons-material": "^5.11.0",
"@mui/material": "^5.11.2",
```

Here is our plan on how to update `app` codebase (`book/10-begin/app`) to avoid breaking changes after upgrading Material-UI to 5.x.x:

-   Replace old import statements with new import statements inside all relevant file (`pages` and `components` folders). To do so automatically, you can use code provided by Material-UI's maintainers. While you are at the root of your `app` project (`book/10-begin/app`), run two commands sequentially.
    
    First run:
    
    ```
      npx @mui/codemod v5.0.0/preset-safe pages
    ```
    
    Then run:
    
    ```
      npx @mui/codemod v5.0.0/preset-safe components
    ```
    
    You should see that all imports statements changes. For example, open `components/common/LoginButton.tsx`, line `import Button from '@material-ui/core/Button';` got replaced with line `import Button from '@mui/material/Button';`.
    
-   Open `lib/theme.ts` file, find import statement:
    
    ```
      import { createMuiTheme } from '@material-ui/core/styles';
    ```
    
    Replace it with:
    
    ```
      import { createTheme } from '@mui/material/styles';
    ```
    
    Replace all instances of `createMuiTheme` with `createTheme`. Replace `type` property with `mode`. If you follow instructions correctly, you should have the following content in your `lib/theme.ts` file:
    
    ```
      import { createTheme } from '@mui/material/styles';
    
      const themeDark = createTheme({
        palette: {
          primary: { main: '#238636' },
          secondary: { main: '#b62324' },
          mode: 'dark',
          background: { default: '#0d1117' },
          text: {
            primary: '#c9d1d9',
          },
        },
        typography: {
          fontFamily: ['IBM Plex Mono', 'monospace'].join(','),
          button: {
            textTransform: 'none',
          },
        },
      });
    
      const themeLight = createTheme({
        palette: {
          primary: { main: '#238636' },
          secondary: { main: '#b62324' },
          mode: 'light',
          background: { default: '#fff' },
          text: {
            primary: '#222',
          },
        },
        typography: {
          fontFamily: ['IBM Plex Mono', 'monospace'].join(','),
          button: {
            textTransform: 'none',
          },
        },
      });
    
      export { themeDark, themeLight };
    ```
    
-   Let's update our HOC extension `pages/_app.tsx` so Material-UI integrates properly with Next.js. We will follow the official example from the `material-ui` repo at [https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/\_app.js](https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/_app.js)
    
    We need to wrap the result returned by `MyApp` component with `CacheProvider`. We also should delete unnecessary `MyApp.componentDidMount` lifecycle method. After doing these two tasks, you should get:
    
    ```
      import createCache from '@emotion/cache';
      import { CacheProvider } from '@emotion/react';
      import CssBaseline from '@mui/material/CssBaseline';
      import { ThemeProvider } from '@mui/material/styles';
      import { Provider } from 'mobx-react';
      import App from 'next/app';
      import Head from 'next/head';
      import React from 'react';
    
      import { themeDark, themeLight } from '../lib/theme';
      import { getUserApiMethod } from '../lib/api/public';
      import { getInitialDataApiMethod } from '../lib/api/team-member';
      import { isMobile } from '../lib/isMobile';
      import { getStore, initializeStore, Store } from '../lib/store';
    
      class MyApp extends App {
        public static async getInitialProps({ Component, ctx }) {
          console.log('MyApp.getInitialProps');
    
          let firstGridItem = true;
          let teamRequired = false;
    
          if (
            ctx.pathname.includes('/login') ||
            ctx.pathname.includes('/create-team') ||
            ctx.pathname.includes('/invitation')
          ) {
            firstGridItem = false;
          }
    
          if (
            ctx.pathname.includes('/your-settings') ||
            ctx.pathname.includes('/team-settings') ||
            ctx.pathname.includes('/discussion') ||
            ctx.pathname.includes('/billing')
          ) {
            teamRequired = true;
          }
    
          const { teamSlug, discussionSlug, redirectMessage } = ctx.query;
    
          const pageProps = {
            isMobile: isMobile({ req: ctx.req }),
            firstGridItem,
            teamRequired,
            teamSlug,
            discussionSlug,
            redirectMessage,
          };
    
          if (Component.getInitialProps) {
            Object.assign(pageProps, await Component.getInitialProps(ctx));
          }
    
          const appProps = { pageProps };
    
          console.log('before getStore');
    
          const store = getStore();
          if (store) {
            return appProps;
          }
    
          let userObj = null;
          try {
            const { user } = await getUserApiMethod(ctx.req);
            userObj = user;
          } catch (error) {
            console.log(error);
          }
    
          let initialData;
    
          if (userObj) {
            try {
              initialData = await getInitialDataApiMethod({
                request: ctx.req,
                data: { teamSlug, discussionSlug },
              });
            } catch (error) {
              console.error(error);
            }
          }
    
          // console.log(initialData);
    
          let selectedTeamSlug = '';
    
          if (teamSlug) {
            selectedTeamSlug = teamSlug;
          } else {
            selectedTeamSlug = userObj && userObj.defaultTeamSlug;
          }
    
          const team =
            initialData &&
            initialData.teams &&
            initialData.teams.find((t) => t.slug === selectedTeamSlug);
    
          // console.log(initialData.teams, team);
    
          return {
            ...appProps,
            initialState: { user: userObj, currentUrl: ctx.asPath, team, teamSlug, ...initialData },
          };
        }
    
        private store: Store;
    
        constructor(props) {
          super(props);
    
          console.log('MyApp.constructor');
    
          this.store = initializeStore(props.initialState);
        }
    
        public render() {
          const { Component, pageProps } = this.props;
          const store = this.store;
    
          const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;
    
          const isServer = typeof window === 'undefined';
    
          return (
            <CacheProvider value={createCache({ key: 'css', prepend: true })}>
              <ThemeProvider theme={isThemeDark ? themeDark : themeLight}>
                <Head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <link rel="stylesheet" href={isServer ? '/fonts/server.css' : '/fonts/cdn.css'} />
                  <link
                    rel="stylesheet"
                    href={
                      isThemeDark
                        ? 'https://storage.googleapis.com/async-await/nprogress-light-spinner.css'
                        : 'https://storage.googleapis.com/async-await/nprogress-dark-spinner.css'
                    }
                  />
                </Head>
                <CssBaseline />
                <Provider store={store}>
                  <Component {...pageProps} store={store} />
                </Provider>
              </ThemeProvider>
            </CacheProvider>
          );
        }
      }
    
      export default MyApp;
    ```
    
    Note that we removed `MyApp.componentDidMount` as we don't need to remove styles. And we added a new statement `console.log('MyApp.getInitialProps');`, we will discuss it in the next section.
    
-   We need to update HOC extension `pages/_document.tsx`. Again, we follow the official example closely [https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/\_document.js](https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/_document.js)
    
    Here we only need to update definition of `MyDocument.getInitialProps` method, after changes you should get:
    
    ```
      import Document, { Head, Html, Main, NextScript } from 'next/document';
      import React from 'react';
    
      import createEmotionServer from '@emotion/server/create-instance';
      import createCache from '@emotion/cache';
    
      class MyDocument extends Document {
        public static getInitialProps = async (ctx) => {
          // Render app and page and get the context of the page with collected side effects.
          const originalRenderPage = ctx.renderPage;
    
          // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
          // However, be aware that it can have global side effects.
          const cache = createCache({ key: 'css' });
          const { extractCriticalToChunks } = createEmotionServer(cache);
    
          ctx.renderPage = () =>
            originalRenderPage({
              // eslint-disable-next-line react/display-name
              enhanceApp: (App) => (props) => <App emotionCache={cache} {...props} />,
            });
    
          const initialProps = await Document.getInitialProps(ctx);
          // This is important. It prevents emotion to render invalid HTML.
          // See https://github.com/mui-org/material-ui/issues/26561#issuecomment-855286153
          const emotionStyles = extractCriticalToChunks(initialProps.html);
          const emotionStyleTags = emotionStyles.styles.map((style) => (
            <style
              data-emotion={`${style.key} ${style.ids.join(' ')}`}
              key={style.key}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: style.css }}
            />
          ));
    
          return {
            ...initialProps,
            // Styles fragment is rendered after the app and page rendering finish.
            styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags],
          };
        };
    
        public render() {
          // console.log('MyDocument.render');
    
          const isThemeDark = this.props.__NEXT_DATA__.props.initialState.user
            ? this.props.__NEXT_DATA__.props.initialState.user.darkTheme
            : true;
    
          return (
            <Html lang="en">
              <Head>
                <meta charSet="utf-8" />
                <meta name="google" content="notranslate" />
                <meta name="theme-color" content="#303030" />
    
                <link
                  rel="shortcut icon"
                  href="https://storage.googleapis.com/async-await/async-favicon32.png"
                />
    
                <link
                  rel="stylesheet"
                  href={
                    isThemeDark
                      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/a11y-dark.min.css'
                      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/a11y-light.min.css'
                  }
                />
    
                <style>
                  {`
                    #__next {
                      width: 100%;
                      height: 100%;
                    }
                    a {
                      font-weight: 400;
                      color: #58a6ff;
                      text-decoration: none;
                      outline: none;
                    }
                    hr {
                      border: 0.5px #707070 solid;
                      color: #000;
                    }
                    blockquote {
                      padding: 0 0.5em;
                      margin: 20px 1em;
                      border-left: 0.25em solid #dfe2e5;
                      color: #000;
                    }
                    pre {
                      display: block;
                      overflow-x: auto;
                      padding: 0.5em;
                      background: #d0d0d0;
                      border: 1px solid #ddd;
                      font-size: 14px;
                      color: #000;
                    }
                    pre code {
                      font-size: 13px;
                      background: #d0d0d0;
                      padding: 0px;
                      color: #000;
                    }
                    code {
                      font-size: 13px;
                      background: #d0d0d0;
                      padding: 3px 5px;
                      color: #000;
                    }
                    mark {
                      background-color: #ffff0060;
                    }
                    summary:focus {
                      outline: none;
                    }
                    table {
                      border-collapse: collapse;
                      margin: 15px 0px;
                    }
                    table, th, td {
                      border: 1px solid #a1a1a1;
                    }
                    th, td {
                      line-height: 1.5em;
                      padding: 10px;
                    }
                  `}
                </style>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                      page_path: window.location.pathname,
                    });
                  `,
                  }}
                />
              </Head>
              <body>
                <Main />
                <NextScript />
              </body>
            </Html>
          );
        }
      }
    
      export default MyDocument;
    ```
    
    Note that we added statement `console.log('MyDocument.render');`, we will discuss it in the next section.
    
-   Let's make a few small improvements to style of `PostEditor` and `PostForm`. Open `components/posts/PostEditor.tsx`, find block:
    
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
    ```
    
    Update this block to become:
    
    ```
      <div
        style={{
          padding: '10px 15px',
          border: isThemeDark
            ? '1px solid rgba(255, 255, 255, 0.5)'
            : '1px solid rgba(0, 0, 0, 0.5)',
        }}
      >
    ```
    
    In the same file, find block:
    
    ```
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
    ```
    
    Update the above block to become:
    
    ```
      <MentionsInput
        style={{
          input: {
            border: 'none',
            outline: 'none',
            color: isThemeDark ? '#fff' : '#000',
            fontFamily: 'Roboto, sans-serif',
            lineHeight: '1.5em',
            backgroundColor: content ? textareaBackgroundColor : 'transparent',
          },
    
          '&multiLine': {
            control: {
              fontFamily: 'Roboto, sans-serif',
              minHeight: 100,
            },
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
    ```
    

We also need to update 2 components: `MenuWithLinks.tsx` and `DiscussionListItem.tsx`

-   Go to `app/components/common/MenuWithLinks` and find this block of code:
    
    ```
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
    ```
    
    Replace it with:
    
    ```
    <MenuItem
    key={option.href}
    style={{
      fontWeight: router.asPath.includes(option.highlighterSlug) ? 600 : 300,
      fontSize: '14px',
    }}
    onClick={() => Router.push(option.href, option.as)}
    >
    {option.text}
    </MenuItem>
    ```
    
    You can then remove the import for `Link` at the top of the file. Remember to add the import for `Router` with this line:
    
    ```
    import Router, { NextRouter, withRouter } from 'next/router';
    ```
    
-   Go to `app/components/discussions/DiscussionListItem.tsx` and find this block of code:
    
    ```
    <Link
    scroll={false}
    href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
    as={`/teams/${team.slug}/discussions/${discussion.slug}`}
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
    
    Replace it with:
    
    ```
    <Link
    scroll={false}
    href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
    as={`/teams/${team.slug}/discussions/${discussion.slug}`}
    style={{ fontWeight: 300, color: isThemeDark ? '#fff' : '#000' }}
    key={discussion._id}
    >
    {discussion.name.length > trimmingLength
      ? `${discussion.name.substring(0, trimmingLength)}...`
      : discussion.name}
    </Link>
    ```
    

A final fix is in our `app` codebase is in `app/server/routesWithCache.ts`. Go to the file and find this line:

```
maxAge: 1000 * 60 * 60, // 1 hour
```

Replace it with:

```
ttl: 1000 * 60 * 60, // in ms, 1hr
```

We are done fixing our `app` codebase to avoid breaking changes. Now we need to make changes to the `api` codebase.

First we will update our `tsconfig.json` file. The current code is:

```
{
  "compileOnSave": false,
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "alwaysStrict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "removeComments": false,
    "preserveConstEnums": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "experimentalDecorators": true,
    "typeRoots": ["./node_modules/@types"],
    "lib": ["es2015", "es2016"]
  },
  "exclude": ["production-server", "node_modules"]
}
```

Update `tsconfig.json` to be:

```
{
  "compileOnSave": false,
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "alwaysStrict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "removeComments": false,
    "preserveConstEnums": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "experimentalDecorators": true,
    "typeRoots": ["./node_modules/@types"],
    "target": "es2020",
    "lib": ["es2020"],
    "module": "commonjs",
    "outDir": "production-server/",
    "downlevelIteration": true,
  },
  "include": ["./server/**/*.ts"]
}
```

Because of these updates to `tsconfig.json`, we no longer need `tsconfig.server.json`. You can delete `tsconfig.server.json`.

And now that we no longer have `tsconfig.server.json`, we can update our `nodemon.json` file from:

```
{
  "watch": ["server"],
  "exec": "ts-node --project tsconfig.server.json",
  "ext": "ts"
}
```

To:

```
{
  "watch": ["server"],
  "exec": "ts-node --project tsconfig.json",
  "ext": "ts"
}
```

Finally, let's update our `api/server/server.ts` file. Your code for `api/server/server.ts` should be:

```
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo');

import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import * as httpModule from 'http';
import * as mongoose from 'mongoose';

import api from './api';
import { setupGoogle } from './google-auth';
import { setupPasswordless } from './passwordless-auth';
import { setupSockets } from './sockets';
import { stripeWebhookAndCheckoutCallback } from './stripe';

import logger from './logger';

import * as compression from 'compression';
import helmet from 'helmet';

// eslint-disable-next-line
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 8000;
const MONGO_URL = dev ? process.env.MONGO_URL_TEST : process.env.MONGO_URL;

// check connection
(async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGO_URL);
    logger.info('connected to db');

    // async tasks, for ex, inserting email templates to db
    // logger.info('finished async tasks');
  } catch (err) {
    console.log('error: ' + err);
  }
})();

const server = express();

server.use(
  cors({
    origin: dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }),
);

server.use(helmet());
server.use(compression());

stripeWebhookAndCheckoutCallback({ server });

server.use(express.json());

const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
    ttl: 14 * 24 * 60 * 60, // save session 14 days
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    domain: dev ? 'localhost' : process.env.COOKIE_DOMAIN,
  } as any,
};

if (!dev) {
  server.set('trust proxy', 1); // sets req.hostname, req.ip
  sessionOptions.cookie.secure = true; // sets cookie over HTTPS only
}

const sessionMiddleware = session(sessionOptions);
server.use(sessionMiddleware);

setupGoogle({ server });
setupPasswordless({ server });

api(server);

const httpServer = httpModule.createServer(server);
setupSockets({
  httpServer,
  origin: dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP,
  sessionMiddleware,
});

server.get('*', (_, res) => {
  res.sendStatus(403);
});

httpServer.listen(port, () => {
  logger.debug('debug right before info');
  logger.info(`> Ready on ${dev ? process.env.URL_API : process.env.PRODUCTION_URL_API}`);
});
```

Now that we have completed changes for both `app` and `api` to accommodate all of our package upgrades at the beginning of this section, we are ready to run our application. Delete `.next` folder, then rebuild the project by running `yarn build`. Start `app` and `api` projects with `yarn dev`:

![Builder Book](https://user-images.githubusercontent.com/10218864/144173312-da7284ea-fa73-49b3-963d-10a27b1aa5c0.png)

You can log in, log out, use web app to make sure there are no breaking changes:

![Builder Book](https://user-images.githubusercontent.com/10218864/144173172-f110af2d-faeb-415e-9a59-8fc64def4c32.png)

In our June 2022 update, we added table of teams so that logged-in user can easily navigate between teams;

[https://github.com/async-labs/saas/commit/f17b0af0661dee6ee524f3f54fe4ecde0b3414fa#diff-eb7d1e8ad36d30882fbb34e39e30f04cdfc12278a84c8aa49b6a1ae2cfc69c39](https://github.com/async-labs/saas/commit/f17b0af0661dee6ee524f3f54fe4ecde0b3414fa#diff-eb7d1e8ad36d30882fbb34e39e30f04cdfc12278a84c8aa49b6a1ae2cfc69c39)

Though we don't explain implementation of this code in this book you are welcome to read it and modify this table for your actual web application. If your SaaS web applications requires teams you want to consider adding functionalities such as switching between teams and team-specific permissions.

___

## Refactor class component into functional component [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#refactor-class-component-into-functional-component)

In previous section, we updated `react` and `react-dom` packages to stay in step with `next` and `@mui` packages. We bumped version from `16.13.1` to `17.0.2`. Since version `16.8`, React supports so called hooks:

[https://reactjs.org/docs/hooks-intro.html](https://reactjs.org/docs/hooks-intro.html)

React team encourages web developers who use React to convert class components with lifecycle methods to functional components with hooks. The motivation is to have cleaner and less verbose code for components. React team has no plans on removing class support but we decided to show how to convert largest component in our web application (`ReadChapter`) from class to functional. After we made this conversion, we indeed found code to be easier to read and code is definitely less verbose.

In Chapters 1 to 3 we already discussed functional components when creating stateless functional component. In this section we will stateful functional component. We will convert `ReadChapter` class component that uses lifecycle methods to `ReadChapterFunctional` functional component that uses hooks.

To make such conversion you have to change how you think about changes that happen to component. There is no replacement for official documentation but here is a good guide on how to get started with hooks:

```
https://www.digitalocean.com/community/tutorials/five-ways-to-convert-react-class-components-to-functional-components-with-react-hooks
```

Before we make our conversion, let's summarize rules of conversion:

-   there is no `this` instance (functional, not class)
    
-   no `render` instance (functional, not class)
    
-   no lifecycle methods (no popular `componentDidMount` and no less popular `getDerivedStateFromProps`)
    
-   `state` initialization goes from:
    
    ```
      state = {
        userName: 'johndoe',
      }
    ```
    
    To using `useState` hook:
    
    ```
      const [userName, setUsername] = useState('johndoe');
    ```
    
-   `setState` gets replaced with corresponding `setParameter`:
    
    ```
      this.setState({ userName: 'janedoe' });
    ```
    
    With:
    
    ```
      setUsername('janedoe');
    ```
    
    Usage of `prevState` ([https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects](https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects)) stays the same as before.
    
-   `componentDidMount` lifecycle method can be replaced with `useEffect` hook:
    
    ```
      componentDidMount() {
        this.setState({
          userName: 'janedoe',
        });
      }
    ```
    
    Using `useEffect`:
    
    ```
      useEffect(() => {
        setUsername('janedoe');
      });
    ```
    
-   `getDerivedStateFromProps` can be replaced with `useEffect` hook and `setParameter` method as well (we don't have `getDerivedStateFromProps` inside `DiscussionPageComp` page but we still provide you with this tip):
    
    ```
      useEffect(() => {
        if (someProp) {
          // call setParameter to set state
        }
      }, [someProp]);
    ```
    
-   `componentDidUpdate` can be replaced with `useEffect` hook as well ([https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect](https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect)):
    
    ```
      useEffect(() => {
        if (prev.someProp !== someProp) {
          // some logic
        }
      }, [someProp]);
    ```
    
    Where `someProp` is prop value that has to change in order to run code inside `useEffect` hook. In case of `ReadChapter` component `someProp` is `chapter` prop, its value changes when book's reader switches between chapters while on `ReadChapter` page. `prev` is basically `prevProps`, we can replace condition `prev.someProp !== someProp` with `prevChapter !== chapter` and define `prevChapter` with help of `useRef` hook:
    
    ```
      function usePrevious(value) {
        const ref = useRef();
        useEffect(() => {
          ref.current = value;
        });
        return ref.current;
      }
    
      const prevChapter = usePrevious(chapter);
    ```
    
-   `componentWillUnmount` can be replaced with `useEffect` hook ([https://stackoverflow.com/questions/62654874/replacing-componentdidupdate-with-useeffect](https://stackoverflow.com/questions/62654874/replacing-componentdidupdate-with-useeffect)):
    
    ```
      useEffect(() => {
        // your code
    
        // once done with the component
        return () => {
           // your unmount code
        }
      }, [someProp]);
    ```
    
-   all three `componentDidMount`, `componentDidUpdate` and `componentWillUnmount` can be replaced with `useEffect` hook like this:
    
    ```
      const mounted = useRef();
    
      useEffect(() => {
        if (!mounted.current) {
          // do componentDidMount logic
          mounted.current = true;
        } else {
          // do componentDidUpdate logic
        }
    
        return () => {
            // do componentWillUnmount logic
          }
        }, [someProp]);
    ```
    

Follow all of the above pointers, add missing imports, you should get following definition for `DiscussionPageCompFunctional`:

```
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Head from 'next/head';
import Router from 'next/router';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';

import { observer } from 'mobx-react';

import Layout from '../components/layout';
import PostDetail from '../components/posts/PostDetail';
import PostForm from '../components/posts/PostForm';
import notify from '../lib/notify';
import { Store } from '../lib/store';
import { Discussion } from '../lib/store/discussion';
import withAuth from '../lib/withAuth';
import { Post } from 'lib/store/post';

type Props = {
  store: Store;
  teamSlug: string;
  discussionSlug: string;
  isServer: boolean;
  isMobile: boolean;
  firstGridItem: boolean;
};

function DiscussionPageCompFunctional({
  store,
  teamSlug,
  discussionSlug,
  isServer,
  isMobile,
  firstGridItem,
}: Props) {
  const [selectedPost, setSelectedPost] = useState<Post>(null);
  const [showMarkdownClicked, setShowMarkdownClicked] = useState<boolean>(false);

  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const prevDiscussionSlug = usePrevious(discussionSlug);

  const mounted = useRef();

  useEffect(() => {
    if (!mounted.current) {
      console.log('useEffect 1 for DiscussionPageCompFunctional');

      if (store.currentTeam && (!isServer || !discussionSlug)) {
        store.currentTeam.loadDiscussions().catch((err) => notify(err));
      }

      const discussion = getDiscussion(discussionSlug);

      if (discussion) {
        discussion.joinSocketRooms();
      }

      console.log(store.socket);

      store.socket.on('discussionEvent', handleDiscussionEvent);
      store.socket.on('postEvent', handlePostEvent);
      store.socket.on('reconnect', handleSocketReconnect);

      (mounted as any).current = true;
    } else {
      console.log('useEffect 2 for DiscussionPageCompFunctional');

      if (prevDiscussionSlug) {
        const prevDiscussion = getDiscussion(prevDiscussionSlug);
        if (prevDiscussion) {
          prevDiscussion.leaveSocketRooms();
        }
      }

      const discussion = getDiscussion(discussionSlug);

      if (!isServer && discussion) {
        discussion.loadPosts().catch((err) => notify(err));
      }

      if (discussion) {
        discussion.joinSocketRooms();
      }
    }

    return () => {
      console.log('useEffect 3 for DiscussionPageCompFunctional');

      const discussion = getDiscussion(discussionSlug);

      if (discussion) {
        discussion.leaveSocketRooms();
      }

      store.socket.off('discussionEvent', handleDiscussionEvent);
      store.socket.off('postEvent', handlePostEvent);
      store.socket.off('reconnect', handleSocketReconnect);
    };
  }, [discussionSlug]);

  const { currentTeam } = store;

  const getDiscussion = (slug: string): Discussion => {
    if (!currentTeam) {
      return;
    }

    if (!slug && currentTeam.discussions.length > 0) {
      Router.replace(
        `/discussion-f?teamSlug=${teamSlug}&discussionSlug=${currentTeam.orderedDiscussions[0].slug}`,
        `/teams/${teamSlug}/discussions-f/${currentTeam.orderedDiscussions[0].slug}`,
      );
      return;
    }

    if (slug && currentTeam) {
      return currentTeam.getDiscussionBySlug(slug);
    }

    return null;
  };

  const renderPosts = () => {
    const discussion = getDiscussion(discussionSlug);

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
                    setSelectedPost(null);
                    setShowMarkdownClicked(false);
                  }}
                />
              ) : (
                <PostDetail
                  key={p._id}
                  post={p}
                  onEditClick={onEditClickCallback}
                  onShowMarkdownClick={onSnowMarkdownClickCallback}
                  isMobile={isMobile}
                  store={store}
                />
              ),
            )
          : null}

        {discussion && discussion.isLoadingPosts && !isServer ? <p>{loading}</p> : null}
      </React.Fragment>
    );
  };

  const onEditClickCallback = (post) => {
    setSelectedPost(post);
    setShowMarkdownClicked(false);
  };

  const onSnowMarkdownClickCallback = (post) => {
    setSelectedPost(post);
    setShowMarkdownClicked(true);
  };

  const handleDiscussionEvent = (data) => {
    console.log('discussion realtime event', data);

    const discussion = getDiscussion(discussionSlug);
    if (discussion) {
      discussion.handleDiscussionRealtimeEvent(data);
    }
  };

  const handlePostEvent = (data) => {
    console.log('post realtime event', data);

    const discussion = getDiscussion(discussionSlug);
    if (discussion) {
      discussion.handlePostRealtimeEvent(data);
    }
  };

  const handleSocketReconnect = () => {
    console.log('pages/discussion.tsx: socket re-connected');

    const discussion = getDiscussion(discussionSlug);
    if (discussion) {
      discussion.loadPosts().catch((err) => notify(err));
      discussion.joinSocketRooms();
    }
  };

  if (!currentTeam || currentTeam.slug !== teamSlug) {
    return (
      <Layout store={store} isMobile={isMobile} firstGridItem={firstGridItem}>
        <Head>
          <title>No Team is found.</title>
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>No Team is found.</div>
      </Layout>
    );
  }

  const discussion = getDiscussion(discussionSlug);

  if (!discussion) {
    if (currentTeam.isLoadingDiscussions) {
      return (
        <Layout store={store} isMobile={isMobile} firstGridItem={firstGridItem}>
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
        <Layout store={store} isMobile={isMobile} firstGridItem={firstGridItem}>
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

  const title = discussion ? `${discussion.name} · Discussion` : 'Discussions';

  return (
    <Layout store={store} isMobile={isMobile} firstGridItem={firstGridItem}>
      <Head>
        <title>{title}</title>
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
        {renderPosts()}
        {discussion && !discussion.isLoadingPosts ? (
          <React.Fragment>
            {selectedPost ? null : (
              <PostForm
                post={null}
                discussion={discussion}
                members={discussion.members}
                isMobile={isMobile}
                store={store}
              />
            )}
          </React.Fragment>
        ) : null}
        <p />
        <br />
      </div>
    </Layout>
  );
}

export default withAuth(observer(DiscussionPageCompFunctional));
```

Please make sure that you have `-f` inside:

```
Router.replace(
  `/discussion-f?teamSlug=${teamSlug}&discussionSlug=${currentTeam.orderedDiscussions[0].slug}`,
  `/teams/${teamSlug}/discussions-f/${currentTeam.orderedDiscussions[0].slug}`,
);
```

Create a new file `pages/discussion-f.tsx`, add the above content to it and save it.

Open `server/server.ts` file and add two new Express routes to it:

```
server.get('/teams/:teamSlug/discussions-f/:discussionSlug', (req, res) => {
  const { teamSlug, discussionSlug } = req.params;
  app.render(req, res, '/discussion-f', { teamSlug, discussionSlug });
});

server.get('/teams/:teamSlug/discussions-f', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/discussion-f', { teamSlug });
});
```

Let's make change that we will later reverse to `components/discussions/DiscussionListItem.tsx`. Find block:

```
<Link
  scroll={false}
  href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
  as={`/teams/${team.slug}/discussions/${discussion.slug}`}
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

Add `-f` to the above block, like this:

```
<Link
  scroll={false}
  href={`/discussion-f?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
  as={`/teams/${team.slug}/discussions-f/${discussion.slug}`}
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

Also modify definition of `selectedDiscussion` with `-f`:

```
const selectedDiscussion =
  store.currentUrl === `/teams/${team.slug}/discussions-f/${discussion.slug}`;
```

To make sure that our component still functions as expected, start `app` and `api` projects with `yarn dev`. For this test, please make sure you have one `team` and two discussions.

Load functional component `DiscussionPageCompFunctional` page by navigating to:

[http://localhost:3000/teams/1/discussions-f](http://localhost:3000/teams/1/discussions-f)

![Builder Book](https://user-images.githubusercontent.com/10218864/144176284-730a9fcb-d141-4361-bbb2-4df96c92cbef.png)

Switch between two discussions:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144176293-ec740142-2520-46cb-9a7a-e098d7bff7b5.png)

`DiscussionPageCompFunctional` works as expected and in the same way as `DiscussionPageComp`! Thus our `class -> functional` conversion was a success.

Please undo `-f` changes you made to `components/discussions/DiscussionListItem.tsx`.

At this point, you can see that we created a separate folder, `book/10-end-functional`, where all code is rewritten from class components to functional components. You can try rewriting `book/10-end` by yourself and see how your rewrite compares to the `book/10-end-functional` project.

___

In the next section we will deploy `app` and `api` to Heroku but before we conclude this section, let's do a few experiments that will help us understand difference between CSR (client-side rendered) and SSR (server-side rendered) page.

In previous section, we added statement:

```
console.log('MyDocument.render');
```

`MyDocument.render` will only be printed on server logs (terminal on your local machine) and only when page is SSR.

In previous section, we also added another statement:

```
console.log('MyApp.getInitialProps');
```

`MyApp.getInitialProps` can be printed on both server logs (terminal on your local machine) and browser logs (Chrome browser: `Developer tools > Console` or `Ctrl + J`).

We will load `DiscussionPageComp` page into new tab (this is SSR page) and we will also switch between two discussions (this is CSR page).

Please comment out unnecessary `console.log` statements inside `app` project except two statements that we want to observe - `console.log('MyDocument.render');` and `console.log('MyApp.getInitialProps');`.

Please start both `app` and `api` with `yarn dev`. And observe **both** server logs and browser logs.

Load your first discussion into new browser tab, this ensures that `DiscussionPageComp` page is SSR. We load following URL but for you it could be different URL:

```
http://localhost:3000/teams/1/discussions/1
```

Server logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144180586-e3800613-d2a9-4f7a-b7f3-9c7c8a6a4f73.png)

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144180591-fa680ffd-d371-4f18-8d6e-7db01b1c23bf.png)

When load page as SSR, `MyApp.getInitialProps` runs first on server and gets all initial data necessary for rendering page on the server. After that, `MyDocument.render` fires and renders page on the server with all necessary data. When SSR page arrives to the browser, `MyApp.getInitialProps` runs again but this time on browser. Thus an important lesson, `MyApp.getInitialProps` runs on both server and browser, `MyDocument.render` only runs on server.

Let's load `DiscussionPageComp` differently, click on second discussion item on the list on the left (`DiscussionList`), this ensures that `DiscussionPageComp` page is CSR (not SSR).

Server logs:  
No logs

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144180754-3205d3a4-f071-4ee6-9483-8491bc749a4b.png)

No server logs because clicking on `Link` inside Next.js web application triggers CSR rendering and not SSR rendering. However, `MyApp.getInitialProps` runs again, however this time it runs only once and only on browser.

___

Let's do more experiment, this time to understand React's lifecycle methods.

Comment out `console.log('MyDocument.render');` and `console.log('MyApp.getInitialProps');`.

Uncomment out following 3 statements inside `pages/discussion.tsx`:

```
console.log('DiscussionPageComp.componentDidMount');

console.log('before condition DiscussionPageComp.componentDidUpdate');

console.log('inside condition DiscussionPageComp.componentDidUpdate');

console.log('DiscussionPageComp.componentWillUnmount');
```

Please observe **both** server logs and browser logs. Load your first discussion into new browser tab, this ensures that `DiscussionPageComp` page is SSR. We load following URL but for you it could be different URL:

```
http://localhost:3000/teams/1/discussions/1
```

Server logs:  
No logs

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144183210-118f0bd4-9758-42ae-ae9c-c5abf14bdec2.png)

This means that lifecycle methods do not fire on the server. The lifecycle methods run on browser only - `componentDidMount` runs right after `render`. `componentDidUpdate` fires when `props` or `state` is changed. In our case, `MyApp.getInitialProps` fires and change value for `store` and `isServer` props, thus `componentDidUpdate` fires. The value of `discussionSlug` does not change between, it's the same value on the server and on the browser. Thus `before condition DiscussionPageComp.componentDidUpdate` gets printed but not `inside condition DiscussionPageComp.componentDidUpdate`.

Let's load `DiscussionPageComp` differently, click on second discussion item on the list on the left (`DiscussionList`), this ensures that `DiscussionPageComp` page is CSR (not SSR).

Server logs:  
No logs again

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144186165-ce97dd2d-2cdd-476b-8c34-cafe92bf0b21.png)

Again, lifecycle methods do not fire on the server. On a browser, since we changed value of `discussionSlug` prop - we have both `before condition DiscussionPageComp.componentDidUpdate` and `inside condition DiscussionPageComp.componentDidUpdate` printed. Then we have multiple `before condition DiscussionPageComp.componentDidUpdate` statements printed on a new page due to `store` prop changing its value (`store.currentUrl`, `store.currentTeam.currentDiscussion`, `store.currentTeam.currentDiscussionSlug` change their respective values). `componentDidMount` does not fire this time, `componentDidMount` only called once in the lifecycle of any component and re-render does not trigger it.

To trigger `componentWillUnmount`, click on `Your Settings` link from dropdown menu:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144186867-ef4f754d-2e7a-4669-9f8b-b038bcd86eab.png)

Server logs:  
No logs again

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144186879-ae4cc59f-6cb9-48e3-8f3c-d7b7d2968493.png)

Now we know that `componentWillUnmount` fires before a component is unmounted from DOM.

___

Let's do one more experiment, this time to understand React's hooks better.

Comment out following 3 statements inside `pages/discussion.tsx`:

```
console.log('DiscussionPageComp.componentDidMount');

console.log('before condition DiscussionPageComp.componentDidUpdate');

console.log('inside condition DiscussionPageComp.componentDidUpdate');

console.log('DiscussionPageComp.componentWillUnmount');
```

Uncomment out following 2 statements inside `pages/discussion-f.tsx`:

```
console.log('useEffect 1 for DiscussionPageCompFunctional');

console.log('useEffect 2 for DiscussionPageCompFunctional');
```

Let's make a change that we will later reverse to `components/discussions/DiscussionListItem.tsx`. Find block:

```
<Link
  scroll={false}
  href={`/discussion?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
  as={`/teams/${team.slug}/discussions/${discussion.slug}`}
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

Add `-f` to the above block, like this:

```
<Link
  scroll={false}
  href={`/discussion-f?teamSlug=${team.slug}&discussionSlug=${discussion.slug}`}
  as={`/teams/${team.slug}/discussions-f/${discussion.slug}`}
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

Also modify definition of `selectedDiscussion` with `-f`:

```
const selectedDiscussion =
  store.currentUrl === `/teams/${team.slug}/discussions-f/${discussion.slug}`;
```

Please observe **both** server logs and browser logs. Load your first discussion into new browser tab, this ensures that `DiscussionPageCompFunctional` page is SSR. We load following URL but for you it could be different URL:

```
http://localhost:3000/teams/1/discussions-f/1
```

Server logs:  
No logs again

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144187733-11ac6cc5-1865-492a-a9ab-821e06ea5c1a.png)

Similarly to lifecycle methods, `useEffect` hook does not run on the server. On the browser, we have `useEffect 1 for DiscussionPageCompFunctional` printed once because of our condition `if(!mounted.current)`. Either code inside `if` or inside `else` will run after component renders. You probably noticed that `useEffect 2 for DiscussionPageCompFunctional` but `before condition DiscussionPageComp.componentDidUpdate` did get printed in our previous experiment with class component. That's because we have `discussionSlug` inside `useEffect`:

```
useEffect(() => {
  // some code
}, [discussionSlug]);
```

`useEffect` will fire when value of `discussionSlug` changes. Not when value of any other prop (for example, `store` ) changes.

Let's load `DiscussionPageComp` differently, click on second discussion item on the list on the left (`DiscussionList`), this ensures that `DiscussionPageComp` page is CSR (not SSR).

Server logs:  
No logs again

Browser logs:  
![Builder Book](https://user-images.githubusercontent.com/10218864/144187856-43c2711f-79e2-4612-a645-073144e692d9.png)

`useEffect 2 for DiscussionPageCompFunctional` fires this time! This is because value of `discussionSlug` has changed. `useEffect 1 for DiscussionPageCompFunctional` does not printed this time, since `mounted.current` is `true` and `!mounted.current` is `false` after initial mounting. Subsequent re-render events don't change its value.

We hope you know have better understanding of Next.js's SSR/CSR, and React's lifecycle methods/hooks.

Please remember to undo changes you made to `components/discussions/DiscussionListItem.tsx`.

___

## Heroku [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#heroku)

We prepared both `APP` and `API` for deployment by adding new set of environmental variables that are used in production. We also added logger that prints less output in production and made `API` server more secure. We showed you how to implement some features that are not required but may be useful to your application in production: SEO, server-side caching, Google Analytics.

To deploy to Heroku or AWS Elastic Beanstalk, we need a new section inside `package.json` file (for both `app` and `api` projects):

```
"engines": {
  "node": "18.17.0",
  "yarn": "1.22.5"
},
```

On your local machine you can upgrade `node` using `nvm`, run:

```
nvm install 18.17.0
```

Then run:

```
nvm alias default 18.17.0
```

To upgrade `yarn`, run on Linux:

```
curl --compressed -o- -L https://yarnpkg.com/install.sh | bash
```

From your project's root:

```
yarn policies set-version 1.22.5
```

Check version:

```
yarn --version
```

Let's deploy `APP` and `API` projects to our first hosting platform, Heroku.

We will deploy `APP` to `https://saas-app.async-await.com` and `API` to `https://saas-api.builderbook.org`. Our domain's DNS records are hosted by Route 53 service by AWS:

![Builder Book](https://user-images.githubusercontent.com/10218864/90339383-4648de80-dfa5-11ea-99f2-b9b067fe76b6.png)

That means that after we deploy each of projects to Heroku, we need to properly map deployed projects to the above production URLs. We will do so by creating CNAME records inside hosted zone for builderbook.org domain at Route 53 dashboard. If you are using different DNS service, you will need to create CNAME records as well but instructions on how to do it will, obviously, be different. We will create CNAME records at Route 53 dashboard at the end of this section.

Create a Heroku account at [https://signup.heroku.com](https://signup.heroku.com/), go to your dashboard and click on `Create new app` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/heroku-create.png)

Provide unique name, select region and click `Create app` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90339858-c6247800-dfa8-11ea-9235-d8fd6cb8282f.png)

Make sure that both `app` and `api` folders are uploaded to your private GitHub repository then click on `Connect to GitHub` button inside `Deployment method` section of `Deploy` page of your Heroku application:

![Builder Book](https://user-images.githubusercontent.com/10218864/90339953-67133300-dfa9-11ea-9f6f-bb23f7270c99.png)

In `Connect to GitHub` section, search for the repository that has your projects. Once you find it, click the `Connect` button. In our case, we will deploy both `APP` and `API` projects from a **public** repository, `async-labs/saas`:

-   The project at `async-labs/saas/app` is the same as the project at `async-labs/saas/book/10-end/app`.
-   The project at `async-labs/saas/api` is the same as the project at `async-labs/saas/book/10-end/api`.
-   The project at `async-labs/saas/lambda` is the same as the project at `async-labs/saas/book/10-end/lambda`. We already deployed Lambda function to AWS Lambda but please do remember redeploy since we added new environmental variables earlier in this chapter. Redeploy using `NODE_ENV=production serverless deploy` or `NODE_ENV=production serverless deploy function --function sendEmailForNewPost` command. Navigate to your Lambda function at AWS Lambda dashboard and make sure that you see new environmental variables and they proper values.

After you connect your repository to Heroku, next task is to figure out how to deploy project from repo's subdirectory. By default, Heroku will look for `package.json` file at the root of repo but we have no project to deploy at the root. Instead we have `app` and `api` folders. To make Heroku to deploy from subdirectory we need to add custom buildpack that enables deploying from subdirectory. To do so, go to `Settings` page of your Heroku application and scroll to `Buildpacks` section, click `Add buildpack` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90340378-91b2bb00-dfac-11ea-99c4-8039d199d3ce.png)

Click on `nodejs` buildpack, then click on `Save changes` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90340411-e0605500-dfac-11ea-9e6d-cb7d6f84a5f3.png)

Cookie subsection Google OAuth API Team Leader mount middleware static method calls check if value is truthy Google OAuth API static method calls mount middleware page component conditional operator. HTTP S3 bucket triggers method response You already learned in this book At AWS dashboard S3 bucket Put it all together. If truthy then withAuth HOC show notification check if value is truthy redirect to checkout in production in a browser email and name mount middleware. WithAuth HOC static method calls request Next.js web application API method production-ready subsection if truthy then triggers method. S3 bucket decorate method with action email and name static method calls open this file withAuth HOC API infrastructure new Express route MongoDB database Put it all together check if value is truthy session MongoDB database in production API infrastructure. Compiles add environmental variable it works as expected conditional operator Material-UI Navigate to check if value is truthy AWS dashboard Google OAuth API API method calls corresponding store method API infrastructure AWS dashboard. Team members request in this book it works as expected subsection page component subsection team members API method response Remember to add import production-ready. API infrastructure on the client Next.js web application production-ready AWS dashboard team members compiles decorate method with action Navigate to HTTP We will discuss open this file redirect to checkout Next.js web application. End user end user Remember to add import on server only on the client HTTP it works as expected. Mount middleware API method team members in production triggers method open this file it works as expected server-side rendering conditional operator Team Leader list of posts.

Click on `Add buildpack` button again, this time paste `https://github.com/timanovsky/subdir-heroku-buildpack` into `Enter Buildpack URL` input, click `Save changes` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90340509-91ff8600-dfad-11ea-95e2-c26306fe48a9.png)

Drag and drop `subdir-heroku-buildpack` to be above `nodejs` backpack:

![Builder Book](https://user-images.githubusercontent.com/10218864/90340534-b9eee980-dfad-11ea-8211-418a74599de5.png)

`subdir-heroku-buildpack`, as you may guess from its name, will ensure that Heroku looks for project inside the right directory. All we need to do is to add environmental variable `PROJECT_PATH` to our Heroku application. While you are on `Settings` page, click on `Reveal Config Vars` button inside `Config Vars` section:

![Builder Book](https://user-images.githubusercontent.com/10218864/90340615-5618f080-dfae-11ea-90ec-2abd7db7d27a.png)

Add `PROJECT_PATH` env variable with value `app` (subdirectory's name), click `Add` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90340649-9f694000-dfae-11ea-80b2-a882e840da63.png)

We recommend that you host code from `https://github.com/timanovsky/subdir-heroku-buildpack` repo in your own private repository, since original repo is public repo with no guarantee to exist next time you send request to it.

For `APP` project to work properly in production, you need to add these environmental variables to `Config Vars` section (in addition to `PROJECT_PATH` env variable):

```
NEXT_PUBLIC_BUCKET_FOR_AVATARS=
NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS=
NEXT_PUBLIC_BUCKET_FOR_POSTS=


NEXT_PUBLIC_PRODUCTION_URL_APP=https://saas-app.async-await.com
NEXT_PUBLIC_PRODUCTION_URL_API=https://saas-api.builderbook.org

NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY=

NEXT_PUBLIC_API_GATEWAY_ENDPOINT=

NEXT_PUBLIC_GA_MEASUREMENT_ID=

NODE_ENV=production
```

A word of caution, whenever applies, please remember to add **your values** for environmental variables. For example, use your values for `NEXT_PUBLIC_PRODUCTION_URL_APP` and `NEXT_PUBLIC_PRODUCTION_URL_API` env variables.

After you are done adding all env variables, your `Config Vars` section for `APP` project should look like this:

![Builder Book](https://user-images.githubusercontent.com/10218864/90341665-3a194d00-dfb6-11ea-9788-0fdaa1bad168.png)

Before we deploy project to Heroku, open `book/10-begin/app/package.json` file and change `version` value from `1` to `1.0.0`. If you don't, it will likely throw `npm` error on Heroku's server. Do the same for `book/10-begin/api/package.json` file. Push changes to your GitHub repo where you host `APP` and `API` projects.

On Heroku dashboard, navigate to `Deploy` page for your Heroku app, scroll to section `Manual deploy`. Select branch of your repo where you placed `APP` and `API` projects. Then click `Deploy Branch` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90341753-f4a94f80-dfb6-11ea-95de-d0b7bba943b9.png)

Heroku will show you build logs in real time:

![Builder Book](https://user-images.githubusercontent.com/10218864/90341768-228e9400-dfb7-11ea-8ad3-0b3eb9068bf9.png)

Let's not access deployed `APP` on browser just yet, since deployed `APP` requires deployed `API` project. Also because we set productions URLs to:

```
PRODUCTION_URL_APP=https://saas-app.async-await.com
PRODUCTION_URL_API=https://saas-api.builderbook.org
```

But did not update DNS records.

But we haven't set corresponding CNAME records at Route 53.

Next step is to upgrade heroku's dyno from free to Hobby, this will allow us to add SSL certificate and make sure that our Heroku application does not "sleep". Go to `Resources` page and click `Change Dyno Type` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90342669-ef500300-dfbe-11ea-9e3a-3973cb78552d.png)

Then click on `Hobby` option and click `Save` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90342683-0f7fc200-dfbf-11ea-9892-9eab356977e2.png)

Done!

Repeat all of the above steps, starting with creation of new Heroku app, for `API` project. With only one difference, add following env variables to `Config Vars` section:

```
MONGO_URL=

AWS_ACCESSKEYID=
AWS_SECRETACCESSKEY=

SESSION_NAME=
SESSION_SECRET=

GOOGLE_CLIENTID=
GOOGLE_CLIENTSECRET=

EMAIL_SUPPORT_FROM_ADDRESS=team@builderbook.org

MAILCHIMP_API_KEY=
MAILCHIMP_REGION=
MAILCHIMP_SAAS_ALL_LIST_ID=

STRIPE_LIVE_SECRETKEY=

STRIPE_LIVE_PUBLISHABLEKEY=

STRIPE_LIVE_PRICEID=

STRIPE_LIVE_ENDPOINTSECRET=

PRODUCTION_URL_API=https://saas-api.async-await.com
PRODUCTION_URL_APP=https://saas-app.async-await.com

COOKIE_DOMAIN=.async-await.com
```

If you like to opt out from anonymous telemetry in your Next.js web application, add additional environmental variable with following value:

```
NEXT_TELEMETRY_DISABLED=1
```

Please do remember to add one more env variable `PROJECT_PATH` with value `api`. Please do remember to add your own values for all env variables including `EMAIL_SUPPORT_FROM_ADDRESS`, `PRODUCTION_URL_API`, `PRODUCTION_URL_APP` and `COOKIE_DOMAIN`.

After deploying successfully deploying `API` project, **for each Heroku application**, navigate to `Settings` page, scroll to `Domains` section and click on `Add Domain` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90344961-d6e9e380-dfd2-11ea-80e2-4538e4b3e22d.png)

Add domain for each Heroku application, for example, for deployed `APP` project, add value of `PRODUCTION_URL_APP` without `https://` part, then click on `Next` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345047-2defb880-dfd3-11ea-86fe-de6e2c655560.png)

After that, Heroku will generate `DNS Target` for each deployed app, for us values are:

```
genetic-mamenchisaurus-xxxxxxxxxxxxxxxxxxxxxxx.herokudns.com

mysterious-tor-xxxxxxxxxxxxxxxxxxxxxxx.herokudns.com
```

for `APP` and `API` deployed projects respectively.

You need to take these `DNS Target` values and use them as destination value for new CNAME records at Route 53 (or whatever DNS service you might use instead of ROute 53).

AWS dashboard page component new Express route compiles S3 bucket Google OAuth API compiles. On the client on the client request page component this chapter add environmental variable Team Leader new Express route decorate method with action in production redirect to checkout. Decorate method with action HTTP AWS dashboard compiles in this book request. This chapter show notification if truthy then it works as expected Next.js web application. At AWS dashboard open this file subsection cookie compiles. Open this file list of posts Remember to add import check if value is truthy API method calls corresponding store method. You already learned triggers method in production Click on the button Put it all together list of posts add environmental variable Material-UI Next.js web application API method Click on the button We will discuss. On the client API infrastructure end user on the client subsection end user At AWS dashboard data model it works as expected triggers method AWS dashboard At AWS dashboard redirect to checkout. Request You already learned this chapter redirect to checkout withAuth HOC request was sent. Check if value is truthy MongoDB database if truthy then on the client it works as expected S3 bucket redirect to checkout compiles it works as expected redirect to checkout redirect to checkout MongoDB database in production Material-UI in production.

On Route 53 dashboard at AWS, find `hosted zone` for your main domain, for us this domain is `async-await.com`. Click on `Create record` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345193-c5550b80-dfd3-11ea-8a58-e56c699e4d43.png)

Select `Simple routing`, click `Next` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345247-051bf300-dfd4-11ea-84e9-fe3d46889b58.png)

Click on `Define simple record` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345296-40b6bd00-dfd4-11ea-8956-aadc5438166c.png)

You will see a popup form, fill it out. Click on `Define simple record` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345329-8f645700-dfd4-11ea-9785-3af71ba603cf.png)

Do the same for `saas-api` domain. Click on `Define simple record` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345359-cc304e00-dfd4-11ea-831d-2749d3e4e26a.png)

Click on `Create records` button:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345399-0bf73580-dfd5-11ea-8970-a9e20119056a.png)

Wait between 5 to 60 min for records to propage, go back to Heroku applications at Heroku dashboard. After records propagate successfully, you will see green check icon with Ok as value for `ACM status` at `Settings` page, section `Domains` (check both Heroku applications):

![Builder Book](https://user-images.githubusercontent.com/10218864/90345452-7f994280-dfd5-11ea-9a13-a75d8c6c2bae.png)

On your browser, paste `https://saas-app.async-await.com/` into browser's address bar and press `Enter`:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345472-be2efd00-dfd5-11ea-971a-1467f69d2271.png)

You are successfully redirected from `/` to `/login` route. That's because of redirected we created earlier in this chapter in section [APP server](https://builderbook.org/books/saas-boilerplate/environmental-variables-production-development-logger-app-server-api-server-seo-robots-txt-sitemap-xml-server-side-caching-heroku-testing-application-in-production-aws-elastic-beanstalk#app-server).

You successfully deployed both projects to Heroku!

We will test some of the features on deployed projects in the next section.

___

## Testing application in production [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-application-in-production)

To see Heroku application's logs on our local machine, please install Heroku CLI and log into it:

[https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

You can run following command to see logs in real time:

```
heroku logs --tail --app app-saas-boilerplate
```

Or you can see last 100 lines of log output. On your terminal, go to `app` folder and run:

```
heroku logs -n 100 --app app-saas-boilerplate
```

You can do the same for `API` project, on your terminal, go to `api` folder and run:

```
heroku logs -n 100 --app api-saas-boilerplate
```

Make sure that you use your value for Heroku application's name.

You will see error if any, if no errors you will all incoming requests and outcoming responses for each server:

![Builder Book](https://user-images.githubusercontent.com/10218864/90344866-50cd9d00-dfd2-11ea-990b-9dd8da14f39e.png)

Try outputting more than 100 lines of log for `APP` project (in our case application with bname `app-saas-boilerplate`), eventually you will see these lines:

```
020-08-16T21:03:33.546834+00:00 heroku[web.1]: Starting process with command `npm start`
2020-08-16T21:03:35.646349+00:00 app[web.1]: 
2020-08-16T21:03:35.646372+00:00 app[web.1]: > app-same-as-10-end-app@1.0.0 start /app
2020-08-16T21:03:35.646373+00:00 app[web.1]: > node production-server/server.js
2020-08-16T21:03:35.646373+00:00 app[web.1]: 
2020-08-16T21:03:35.912088+00:00 app[web.1]: > Ready on https://saas-app.async-await.com
2020-08-16T21:03:37.000000+00:00 app[api]: Build succeeded
2020-08-16T21:03:37.257578+00:00 heroku[web.1]: State changed from starting to up
2020-08-16T21:03:59.731270+00:00 app[web.1]: WithAuth.getInitialProps
2020-08-16T21:03:59.767361+00:00 app[web.1]: MyApp.constructor
2020-08-16T21:03:59.877610+00:00 heroku[router]: at=info method=GET path="/login" host=saas-app.async-await.com request_id=fa7adb4f-4391-47e8-9399-1f240f2c49dc fwd="173.225.82.228" dyno=web.1 connect=1ms service=851ms status=200 bytes=6025 protocol=https
2020-08-16T21:04:00.942399+00:00 heroku[router]: at=info method=GET path="/_next/static/p-q-umXXXEmQ6GxSdiPzA/pages/login.js" host=saas-app.async-await.com request_id=8041a17a-b75a-41b6-afff-554e4bccd245 fwd="173.225.82.228" dyno=web.1 connect=1ms service=10ms status=200 bytes=2191 protocol=https
```

Seeing `Ready on https://saas-app.async-await.com` on logs means that `dev` has value of `false` and our application has used value for `PRODUCTION_URL_APP` instead of `URL_APP`, as it should have.

___

Next, let's make a small addition to the code inside `book/10-begin/api/server/server.ts` file, `API` server:

```
http.listen(port, () => {
  logger.debug('debug right before info');
  logger.info(`> Ready on ${dev ? process.env.URL_API : process.env.PRODUCTION_URL_API}`);
});
```

Why did we add `logger.debug` line? Our goal is to test if `winston` logger that we created earlier in this chapter indeed works as we designed it. In development, we should see both outputs printed in logs. In production, we should see only second output, `logger.info`, but not first output, `logger.debug`.

After you made the above change, start `API` project locally using `yarn dev` command. Look at your local logs:

![Builder Book](https://user-images.githubusercontent.com/10218864/90352606-b6cd1b00-dff8-11ea-9549-c2a7ed202655.png)

Indeed! There are two outputs, next to each other, as it should be.

Now, push your recent change to your GitHub repository, go to `Deploy` page at Heroku dashboard and begin deploying `API` project. Right after that, on your terminal, run command:

```
heroku logs --tail --app api-saas-boilerplate
```

to see real time logs.

Alternatively, you can go to your Heroku application at Heroku dashboard and click on `More` button, then on `View logs` menu item in dropdown menu:

![Builder Book](https://user-images.githubusercontent.com/10218864/90353086-268fd580-dffa-11ea-8759-f5f0748a4bf8.png)

As expected, only second output is on logs `logger.info`:

![Builder Book](https://user-images.githubusercontent.com/10218864/90353348-cfd6cb80-dffa-11ea-9a1b-edfd307079d6.png)

That means our logger indeed works properly.

Production-ready if truthy then Navigate to withAuth HOC store method calls request was sent send this response end user. Response AWS dashboard AWS dashboard S3 bucket Click on the button in a browser server-side rendering Google OAuth API compiles triggers method Team Leader. We will discuss API method triggers method server-side rendering new Express route show notification new Express route. On server only Google OAuth API add environmental variable MongoDB database compiles. Response production-ready S3 bucket Team Leader team members Remember to add import mount middleware. WithAuth HOC on the client subsection triggers method conditional operator in a browser on server only. On server only HTTP Remember to add import email and name in this book redirect to checkout this chapter end user Material-UI in production list of posts. Navigate to triggers method MongoDB database new Express route subsection API method calls corresponding store method triggers method data model conditional operator session open this file cookie. On the client You already learned mount middleware Team Leader API method new Express route data model S3 bucket request was sent production-ready show notification Click on the button decorate method with action in this book. Material-UI production-ready add environmental variable discussion request session if truthy then subsection.

___

Next, we test our SEO features.

On your browser, paste following URL into browser's address var and press `Enter`:

```
https://saas-app.async-await.com/robots.txt
```

Make sure to use **your** actual production URL.

You will see that `APP` server indeed sends `robots.txt` file to browser:

![Builder Book](https://user-images.githubusercontent.com/10218864/90354452-33162d00-dffe-11ea-9925-6e8914be50f8.png)

Next, paste following URL into browser's address var and press `Enter`:

```
https://saas-app.async-await.com/sitemap.xml
```

And again, `APP` server sends `sitemap.xml` file to browser:

![Builder Book](https://user-images.githubusercontent.com/10218864/90354511-648ef880-dffe-11ea-9f1f-2697d9ea04f6.png)

You should add your client-facing domain to `Google Search Console` (in our case, it is `https://saas-app.async-await.com`):

[https://search.google.com/search-console/about](https://search.google.com/search-console/about)

Verify your domain and tell Google where to find `sitemap.xml` file.

You can also test your `robots.txt` file at:

[https://www.google.com/webmasters/tools/robots-testing-tool](https://www.google.com/webmasters/tools/robots-testing-tool)

___

Let's test if `APP` server indeed servers **cached** `Login` page when end user loads `/login-cached` route on a browser. Paste following URL into browser's address var and press `Enter`:

```
https://saas-app.async-await.com/login-cached
```

Press `Ctrl + Shift + J` to access `Chrome Developer Tools`, click on `Network` tab. Reload route and select `login-cached` request-response cycle:

![Builder Book](https://user-images.githubusercontent.com/10218864/90345662-6d200880-dfd7-11ea-8698-c58071aee858.png)

Click on `Headers` tab - response does indeed have header `X-Cache` with value `HIT`! That means `APP` server indeed served already cached page because of this code we wrote earlier in this chapter:

```
if (ssrCache.has(key)) {
  res.setHeader('x-cache', 'HIT');
  res.send(ssrCache.get(key));
  return;
}
```

You can also click on `Timing` tab (located on the same level as `Headers` tab). Make sure `Disable cache` checkbox is empty and reload `/login-cached` route again:

![Builder Book](https://user-images.githubusercontent.com/10218864/90355113-47f3c000-e000-11ea-928f-ac6e40f0087b.png)

TTFB is the time to first byte of the response that comes to browser from `APP` server. Note its value.

Do the same experiment for `/login` route. This time, you will not see `X-Cache` header on response and TTFB value for `/login` route will be significantly higher than for `/login-cached` route. That's a biggest benefit of caching pages.

___

Finally, let's test out Google Analytics. Make sure all of your adblockers are temporary disabled. If not, Google Analytic's scripts will be blocked.

Go to `/login` route and look at your Google Analytics dashboard, `Realtime > Content`:

![Builder Book](https://user-images.githubusercontent.com/10218864/90362341-3ff24b00-e015-11ea-88b5-99fa2cc3a10c.png)

As you can see, there two users on the website currently, one of them is co-author of this book who just loaded `/login` route into browser.

If I load `/signup` route and close tab with `/login` route, I will see that Google Analytics detected it and reported it:

![Builder Book](https://user-images.githubusercontent.com/10218864/90362396-5e584680-e015-11ea-917d-624e999149ad.png)

Ok, server-side rendered pages do get reported to Google Analytics. But what about client-side rendering? If we switch between discussions on a browser - that's client-side rendered `DiscussionPageComp` page.

Log in using Google OAuth with your Team Leader account (Team Leader Potato), you will be redirected to discussion with name `first discussion with posts` and URL:

```
https://saas-app.async-await.com/team/1/discussions/1
```

Go to Google Analytics dashboard, `Realtime > Content`:

![Builder Book](https://user-images.githubusercontent.com/10218864/90363296-4aaddf80-e017-11ea-8c4f-e379bb86b668.png)

Click on `third discussion - email notification`, browser will load:

```
https://saas-app.async-await.com/team/1/discussions/3
```

Go to Google Analytics dashboard, `Realtime > Content`:

![Builder Book](https://user-images.githubusercontent.com/10218864/90363422-92346b80-e017-11ea-96e6-23c4636cbd8c.png)

Works as expected!

___

## AWS Elastic Beanstalk [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#aws-elastic-beanstalk)

Deploying `APP` and `API` projects to AWS Elastic Beanstalk is somewhat similar but there is significantly more setup and configuration involved. Here is a list of tasks in chronological order:

1.  On AWS dashboard, inside `AWS Elastic Beanstalk` service, we need to create a new `Application` and two `Environments`. Each environment corresponds to one project. In other words, we will create one environment for `APP` project and one environment for `API` project. We can configure first environment and then clone configuration to create second environment. Add env variables to each of the new environments.
    
2.  Install Elastic Beanstalk command line interface on our local machine so we can deploy each project by running `eb deploy environment-name`.
    
3.  Fill out `book/10-begin/app/.elasticbeanstalk/config.yml` file with configs. We provided you with both already, check up `book/10-begin/*` folder. Here we will explain why we used particular extensions.
    
4.  We will deploy each project to AWS Elastic Beanstalk using `eb deploy environment-name` command.
    
5.  We will create two A records at Route 53 dashboard to point production domains to Elastic Beanstalk environments (deployed projects).
    

___

1.  On AWS dashboard, click `Services`, then inside `Compute` section, click on `Elastic Beanstalk`:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90367381-a5e2d080-e01d-11ea-95a3-61ac8279e74c.png)
    
    Click on `Applications` on the left menu, then click on `Create a new application button`:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90368121-77192a00-e01e-11ea-9fd3-63a7093404d8.png)
    
    Give a name to your new `Application` and click `Create` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90373902-7df86a80-e027-11ea-9414-75208e76175d.png)
    
    Elastic Beanstalk application contains environments. Our goal is to create a new environment. Click on `Create a new environment` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90373771-4e496280-e027-11ea-9b0c-d694d1ab82f8.png)
    
    Select `Web server environment`, click `Select` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90374033-b304bd00-e027-11ea-8666-cb3a00e0269a.png)
    
    Give name to your environment. We name it `app-saas-boilerplate`. Then scrolled down. Select `Platform`, `Platform branch` and `Platform version`. Then select `Sample application`. Then select `High availability` option. Then click `Next` few times. Finally, click on `Submit` button:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/eb-create-env.png)
    
    Click on `Edit` button on `Software` card:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90370935-0f191280-e023-11ea-86ff-c0bf0048de29.png)
    
    Select `Nginx` as `Proxy server`, scroll down to `Environmental properties` section and add following env vars:
    
    ```
     NEXT_PUBLIC_BUCKET_FOR_AVATARS=
     NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS=
     NEXT_PUBLIC_BUCKET_FOR_POSTS=
    
     NEXT_PUBLIC_PRODUCTION_URL_APP=https://saas-app-aws.async-await.com
     NEXT_PUBLIC_PRODUCTION_URL_API=https://saas-api-aws.async-await.com
    
     NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY=
    
     NEXT_PUBLIC_API_GATEWAY_ENDPOINT=
    
     NEXT_PUBLIC_GA_MEASUREMENT_ID=
    
     NODE_ENV=production
     NPM_CONFIG_UNSAFE_PERM=true
    ```
    
    If you like to opt out from anonymous telemetry in your Next.js web application, add additional environmental variable with following value:
    
    ```
     NEXT_TELEMETRY_DISABLED=1
    ```
    
    Once you are done adding env variables, click `Save` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90371949-88fdcb80-e024-11ea-8c4a-68d0f77917bf.png)
    
    Then click on `Create environment` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90373047-332a2300-e026-11ea-8216-b1bde42ed90a.png)
    
    Dashboard will show you progress:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90373226-6f5d8380-e026-11ea-90e9-ba054f1e928f.png)
    
    Once environment is successfully deployed, you will be redirected to environment's page:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90374255-10990980-e028-11ea-80b4-89dc2a6e3379.png)
    
    If you click on environment's URL, you will AWS's sample application:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90374287-1a227180-e028-11ea-915d-bb971cbd484c.png)
    
    But we are not done with configuring our new environment. Click on `Configuration` on the left menu. Then click `Edit` button on `Load balancer` card:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90374562-8604da00-e028-11ea-9a8b-532095923dc5.png)
    
    Click on `+ Add listener` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90374691-bcdaf000-e028-11ea-8c41-8da4d2b65ed9.png)
    
    Fill out form like this and click `Add` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90375395-be58e800-e029-11ea-91ec-619308d8fd6e.png)
    
    If you don't have SSL certificate with AWS Certificate Manager, created by following these steps, then come back and fill out the above form:
    
    [https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html)
    
    After clicking `Add` on the above form, scroll down and click `Apply` button at the bottom-right:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90375646-198ada80-e02a-11ea-9789-6705c477dcfb.png)
    
    Once environment finished updating, click on `Actions > Clone environment`:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90376310-16dcb500-e02b-11ea-83a1-54575cf9b3ed.png)
    
    Then give name to your new environment (we name it `api-saas-boilerplate`) and click `Clone` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90376564-8357b400-e02b-11ea-838d-a2fec5a0a8d8.png)
    
    After our second environment is successfully created by cloning, click on `Configuration`. Then click on `Edit` button at `Software` card. Scroll down and env variables:
    
    ```
     MONGO_URL=
    
     AWS_ACCESSKEYID=
     AWS_SECRETACCESSKEY=
    
     SESSION_NAME=
     SESSION_SECRET=
    
     GOOGLE_CLIENTID=
     GOOGLE_CLIENTSECRET=
    
     EMAIL_SUPPORT_FROM_ADDRESS=team@builderbook.org
    
     MAILCHIMP_API_KEY=
     MAILCHIMP_REGION=
     MAILCHIMP_SAAS_ALL_LIST_ID=
    
     STRIPE_LIVE_SECRETKEY=
    
     STRIPE_LIVE_PUBLISHABLEKEY=
    
     STRIPE_LIVE_PRICEID=
    
     STRIPE_LIVE_ENDPOINTSECRET=
    
     PRODUCTION_URL_API=https://saas-api-aws.async-await.com
     PRODUCTION_URL_APP=https://saas-app-aws.async-await.com
    
     COOKIE_DOMAIN=.async-await.com
    
     NODE_ENV=production
     NPM_CONFIG_UNSAFE_PERM=true
    ```
    
    Please be sure to remove any env variables that came from `app-saas-boilerplate` environment as a result of cloning.
    
    Once done, click `Save` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90371590-070da280-e024-11ea-9486-03360828ffe2.png)
    
2.  Install Elastic Beanstal CLI using these steps (Linux, Ubuntu):
    
    [https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install-linux.html](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install-linux.html)
    
3.  We already provided you with `.elasticbeanstalk/config.yml` file for each project. Please remember to replace application's and environment's names in this file with your actual values. Check value for `default_region` as well, add your actual value.
    
4.  Elastic Beanstalk CLI will deploy version of code that you either pushed to GitHub repo or at least staged. If you staged changes, you can run `eb deploy environment-name --staged` to deploy version of code **with** staged changes. Otherwise, if there are no staged changes and no local changes that you want to deploy, you can deploy version of code pushed to GitHub repo with simple `eb deploy environment-name`.
    
    Since we are deploying our projects to `Amazon Linux 2` server - by default only `start` script from `package.json` file will run after code is uploaded to AWS Elastic Beanstalk. Thus we must build project locally before uploading it to AWS Elastic Beanstalk.
    
    On your local machine, navigate to `book/10-begin/app`, run:
    
    ```
     NODE_ENV=production yarn build
    ```
    
    Then run to upload already built project:
    
    ```
     eb deploy app-saas-boilerplate
    ```
    
    On your local machine, use terminal and navigate to `book/10-begin/api` and run:
    
    ```
     NODE_ENV=production yarn build
    ```
    
    Then run to upload already built project:
    
    ```
     eb deploy api-saas-boilerplate
    ```
    
5.  Finally, navigate to Route 53 dashboard, find hosted zone for your main domain. Click on `Create record` button:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90381014-a5eccb80-e031-11ea-84ca-5c447c1a656c.png)
    
    Follow the same instructions as before, define two new A records like this:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90381308-0a0f8f80-e032-11ea-801a-68a8b91dc95a.png)
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/90381460-44792c80-e032-11ea-9097-f922695c19b4.png)
    

Wait for DNS records to propagate.

MongoDB database cookie it works as expected Navigate to this chapter conditional operator if truthy then decorate method with action add environmental variable decorate method with action static method calls this chapter Team Leader mount middleware in a browser. Material-UI end user Material-UI MongoDB database cookie withAuth HOC Next.js web application AWS dashboard API method team members it works as expected open this file. Conditional operator open this file Put it all together in production on server only conditional operator mount middleware API method calls corresponding store method At AWS dashboard API method calls corresponding store method response. Data model At AWS dashboard subsection response session page component on server only API method Put it all together API infrastructure API infrastructure on the client API method Google OAuth API in a browser. It works as expected new Express route this chapter check if value is truthy server-side rendering on the client withAuth HOC discussion open this file AWS dashboard production-ready add environmental variable. In this book compiles in a browser redirect to checkout AWS dashboard Next.js web application redirect to checkout email and name end user. Cookie store method calls API method server-side rendering withAuth HOC triggers method cookie this chapter Click on the button team members. Click on the button cookie end user subsection discussion Next.js web application Team Leader production-ready S3 bucket API method calls corresponding store method in a browser Navigate to new Express route. Navigate to Google OAuth API Put it all together server-side rendering compiles Google OAuth API response. Team Leader show notification At AWS dashboard in this book Google OAuth API it works as expected Next.js web application session team members Remember to add import S3 bucket.

On your browser, navigate to:

```
https://saas-app-aws.builderbook.org
```

You will see:

![Builder Book](https://user-images.githubusercontent.com/10218864/90397374-9af36480-e04c-11ea-8c57-02d14ff19fa4.png)

Navigate to:

```
https://saas-api-aws.builderbook.org
```

You will see:

![Builder Book](https://user-images.githubusercontent.com/10218864/90397586-ead22b80-e04c-11ea-806d-4d0c79b63a10.png)

We have successfully deployed both `APP` and `API` to AWS Elastic Beanstalk!

This is the end of Chapter 10 and the end of this book.

You are one of very few who completed the entire book! We hope you will use this SaaS boilerplate to build your own profitable business and gain financial freedom. Let us know if you do - [team@builderbook.org](mailto:team@builderbook.org).

If you have any questions or feedback, feel free to create an issue at:  
[https://github.com/async-labs/saas/issues](https://github.com/async-labs/saas/issues)

To give a review of our book, please fill out this [Google Form](https://goo.gl/forms/JdevtnCWsLwZTAio2) or email us at:  
[team@builderbook.org](mailto:team@builderbook.org)

___

Kelly Burke and Timur Zhiyentayev, August 2020

___

If you followed the instructions in this chapter closely, your codebase should match the codebase located at `book/10-end`. The exact same codebase is hosted at the root of our open source repository: [https://github.com/async-labs/saas](https://github.com/async-labs/saas)

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___