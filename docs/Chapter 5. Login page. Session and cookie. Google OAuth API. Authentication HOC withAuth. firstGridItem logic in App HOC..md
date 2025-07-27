In Chapter 5, you will start with the codebase in the [5-begin folder](https://github.com/async-labs/saas/tree/master/book/5-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [5-end folder](https://github.com/async-labs/saas/tree/master/book/5-end).

We will cover the following topics in this chapter:

-   Login page  
    
    -   LoginButton
-   Session and cookie  
    
    -   Configure session and mount middleware
    -   Save session to database
    -   Configure and create cookie
-   Google OAuth API  
    
    -   Express routes for Google OAuth API
    -   Configure passport
    -   verify function
    -   passport and session
    -   Static methods publicFields and signInOrSignUpViaGoogle
    -   getUserApiMethod API method and '/get-user' Express route
    -   Google Cloud Platform
    -   Testing Google OAuth
-   Authentication HOC withAuth  
    
    -   getUserApiMethod in withAuth
    -   Redirect logic in withAuth
    -   Render logic in withAuth HOC
    -   Testing withAuth HOC
-   firstGridItem logic in App HOC  
    

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

We learned many useful topics in Chapter 4. A particularly useful topic was creating "two project" architecture and building internal and external API infrastructures within this architecture. For example, we defined and built "Getting user by slug API". For this API, req-res cycles are between `app`, `api`, and a MongoDB server. We built the more complicated "Uploading file API" that consists of two sub-APIs. The first sub-API, called "Getting signed request API", involves `app`, `api`, and an AWS S3 server. The second sub-API, called "Uploading file using signed request API", involves only `app` and an AWS S3 server, without `api`.

As you progress through this book, we will practice our API-building skills many more times. We will build both "internal" and "external" API infrastructures. Internal APIs will have req-res cycles in between `app`, `api`, and a MongoDB server. External APIs involve external, third-party servers other than MongoDB server. In Chapter 4, we built "Uploading file API", which is an external API, since it involves AWS S3 server.

Building various API infrastructures is one of key skills of a web developer.

Currently, our web application has no way to differentiate beetween a guest (or logged-out) user and a logged-in user. Our primary goal in Chapter 5 is to, finally, add user authentication to our web application. We will implement user authentication using Google OAuth API infrastructure. Then in Chapter 6, we will implement an alternative user authentication method using Passwordless API.

So you can see that adding user authentication to our web application amounts to adding a new external API infrastructure that involves Google OAuth server. As you may have concluded at this point, adding any new data exchange to our web application means adding a new internal or external API infrastructure.

In the first section of this chapter, we will discuss and create a `Login` page. Then we will discuss the concepts of `session` and `cookie`. After that, we will discuss details of the Google OAuth API infrastructure. After that, we will add user authentication by defining a new higher-order component, `withAuth`.

___

## Login page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#login-page)

In this section, we will create a new page: `Login`. The page is relatively simply to implement, since you already implemented the `Index` and `YourSettings` pages in previous chapters. Check up the code for the `Index` page at `book/5-begin/app/pages/index.tsx` and the code for the `YourSettings` page at `book/5-begin/app/pages/your-settings.tsx`. The pattern for these pages can be summarized like this. Let's call such pattern a blueprint for pages:

```
// some imports go here

type Props = { user: { email: string; displayName: string } };

class Index extends React.Component<Props> {
  public static async getInitialProps() {
    // some JS/TS code goes here
  }

  public render() {
    return (
      <Layout {...this.props}>
        <Head>
          <title>Index page</title>
          <meta name="description" content="This is a description of the Index page" />
        </Head>
        // some HTML/React/Material-UI code goes here
      </Layout>
    );
  }
}

export default Index;
```

The `Login` page is similar to both `Index` and `YourSettings` pages in the following aspects:

-   We define data types for `Props` of the page component.
-   The `Login` page contains a `Head` element and main `div` element, and the page is wrapped with a `Layout` component.

The `Login` page differs from the `Index` and `YourSettings` pages in the following aspects:

-   We don't need to define `getInitialProps` on the `Login` page, since we don't need any dynamic data to populate the page's props
-   Instead of having Material-UI's `Button` component, the `Login` page will contain an imported custom component called `LoginButton`. `LoginButton` will indeed use the `Button` component. but we define this component in the next subsection.

The `Login` page is even more straightforward to define than the `Index` page:

```
import Head from 'next/head';
import React from 'react';
import LoginButton from '../components/common/LoginButton';
import Layout from '../components/layout';

class Login extends React.Component {
  public render() {
    return (
      <Layout {...this.props}>
        <div style={{ textAlign: 'center', margin: '0 20px' }}>
          <Head>
            <title>Log in to SaaS boilerplate by Async</title>
            <meta
              name="description"
              content="Login and signup page for SaaS boilerplate demo by Async"
            />
          </Head>
          <br />
          <p style={{ margin: '45px auto', fontSize: '44px', fontWeight: 400 }}>Log in</p>
          <p>You’ll be logged in for 14 days unless you log out manually.</p>
          <br />

          <LoginButton />
        </div>
      </Layout>
    );
  }
}

export default Login;
```

Place the above code into a new file, `book/5-begin/app/pages/login.tsx`.

Note how we wrote a descriptive SEO title and description for the `Login` page. Why did we do it? It's because, unlike the `Index` and `YourSettings` pages, we want search engine bots to crawl the `Login` page. We want people who search on Google or other search engines to be able to discover our `Login` page. When we deploy our web app in Chapter 10, the crawled URL for the `Login` page will be `https://saas-app.async-await.com/login`. We will also set up proper `robots.txt` and `sitemap.xml` files for our `app` project in Chapter 10.

___

#### LoginButton [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#loginbutton)

Unlike other non-page components that we created so far in this book (`Notifier`, `Confirmer`, `MenuWithLinks`), the `LoginButton` component has no need for `state`, because there is no need for storing any temporary data. If you need to remember how we created these non-page components, check up any file inside the `book/5-begin/app/components/common/` folder.

The `LoginButton` component needs no methods except the `LoginButton.render` method. Create a new file, `book/5-begin/app/components/common/LoginButton.tsx`, with the following code:

```
import Button from '@material-ui/core/Button';
import React from 'react';

class LoginButton extends React.Component {
  public render() {
    const url = `${process.env.NEXT_PUBLIC_URL_API}/auth/google`;

    console.log(url);

    return (
      <React.Fragment>
        <Button variant="contained" color="secondary" href={url}>
          <img
            src="https://storage.googleapis.com/async-await-all/G.svg"
            alt="Log in with Google"
          />
              Log in with Google
        </Button>
        <p />
        <br />
      </React.Fragment>
    );
  }
}

export default LoginButton;
```

is called a "non-breaking space" HTML entity. On the browser, it renders as one empty space. HTML entities are special (reserved) strings of characters that start with `&` and render as some difficult-to-type characters:

[https://developer.mozilla.org/en-US/docs/Glossary/Entity](https://developer.mozilla.org/en-US/docs/Glossary/Entity)

We could have wrapped the text `Log in with Google` with `<span>...</span>` and applied styles to it to create space to the left of the text. Instead, we used the "non-breaking space" HTML entity.

We did not discuss the code for the `LoginButton` component in detail, since we already know how to build even more complicated components. However, there is one important fact to point out. So far in this book, every page we built had a page method that calls an API method to get some dynamic data inside the page's `getInitialProps` method. We have no `getInitialProps` method for `Login` page. Instead of an API method, we use a `Button` component with an `href` prop from Material-UI's library. This component renders into an HTML element: anchor `<a>`. When a user clicks on this anchor element, the browser automatically sends a request with the method `GET` to the API endpoint `${process.env.URL_API}/auth/google`. No need for us to define a page method and API method in addition to `<a>` anchor element, all we need to do is to define the Express route `/auth/google` on our `api` server.

Since we already imported `LoginButton` to the `Login` page and used it, it's time to see if our page renders as expected. Since the `Login` page does not have any methods that send requests to the `api` server, we can load the `Login` page **without** starting our `api` project.

Start your `app` project with `yarn dev` and navigate to `http://localhost:3000/login`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-03-26+14-52-43.png)

The page looks good, but the grid item on the left looks out of place. Later in this chapter, we will update our `App` HOC so that `firstGridItem` has a value of `false` for the `Login` page and we do not see the left grid item on the `Login` page. The `Login` page will ultimately have only one grid instead of two.

The terminal window for your `app` project prints:

```
http://localhost:8000/auth/google
```

This output is from:

```
console.log(url);
```

The API endpoint has a proper value; however, we haven't implemented an Express route `/auth/google` at `api` project to process this request. We will create this Express route later, in thesection "Google OAuth API".

In the next section, we will discuss the concept of `session` and `cookie`. It's important to understand these concepts before we discuss and add user authentication to our web application. After that, we will build our user authentication using Google OAuth API.

Redirect to checkout in production API method list of posts email and name session session show notification on the client Navigate to it works as expected decorate method with action request in production discussion. Next.js web application API method calls corresponding store method MongoDB database add environmental variable mount middleware it works as expected You already learned this chapter API method triggers method new Express route request API method end user subsection. AWS dashboard Material-UI redirect to checkout Navigate to You already learned Next.js web application. Open this file request conditional operator API method calls corresponding store method on the client withAuth HOC withAuth HOC. Google OAuth API decorate method with action show notification request Click on the button in a browser email and name request was sent data model HTTP in this book page component data model Click on the button list of posts. Subsection store method calls in this book You already learned Click on the button end user Navigate to. It works as expected new Express route it works as expected S3 bucket mount middleware. Page component in a browser on the client Material-UI decorate method with action Navigate to list of posts list of posts new Express route list of posts cookie. Discussion We will discuss store method calls API method calls corresponding store method end user in this book API infrastructure Click on the button discussion show notification Next.js web application end user HTTP cookie withAuth HOC. Production-ready data model if truthy then S3 bucket in a browser if truthy then data model mount middleware discussion API infrastructure team members in a browser withAuth HOC mount middleware Next.js web application.

___

## Session and cookie [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#session-and-cookie)

Before we build an infrastructure for user authentication, it is critical to understand the concept of `session` and `cookie`.How does a web application identify an end user who loads a page? How does a web application keep an end user logged-in? You can log in to any web application on the internet, close the tab, reopen the tab, and find that you are still logged in. This is called persistent login session and its a common feature of most of web applications on the web today.

The short answer, persistent login session can be achieved by setting up `session` on the server and `cookie` on the browser.

When an end user logs in to web application for the first time, the web application saves a so-called `cookie` object to the end user's browser. When this user later comes back and loads the web application's page into browser's tab, the `cookie`'s `name` and `value` are sent to the server with an initial request. The server uses `cookie`'s value to find a matching `session` document in the database. The `session` document will contain the `user`'s id, which the server uses to find and send back matching user data back to the browser.

Ok, we understand how a returning user can remain logged in, at least, in theory for now. Let's discuss details of implementation for `session`/`cookie` infrastructure.

What is `session`? As we already mentioned, `session` is an object that a server can create to store unique user-identifying information. The `session` object gets created by the server and is not accessible on the browser. When an end user logs in to your web application, the server can create a unique `session` object. For example, you can save a user's id into `session`. Then your server can save `session` object to your database as `Session` MongoDB document. You could make a persistent login session last for 14 days, thus sparing any user from having to re-log in to your web application for 14 days. You simply need some code on your server that removes `Session` MongoDB document from database after 14 days.

-   When a logged-out or completely new user logs in or signs up, respectively, on a web application, our server generates a unique `session` object that contains a user's id and saves a `Session` MongoDB document to our database. Then our server creates a unique `cookie` object that has `name` and `value`. The value for `value` is generated from the session's id. Our server sends a response to the browser that contains `cookie`, and `cookie` gets saved to a user's browser.
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/xB.rE6RBMJ9wsNc3E.Lwrru3CfjcWy2Q/chapter-2/Session+and+cookie+logged-out.png)
    

-   Later, a logged-in user can close a tab within our web application, come back later, and open our web application in a new browser tab. The user's browser will send a request to our server. This request contains `cookie`. Our server decodes `value` of the received `cookie`. Our server finds a matching `Session` MongoDB document by the session id in our database. Inside this `session` object, there is a user id. Our server finds a matching `User` MongoDB document by the user id and sends user data back to the browser. Thus, the user remains in a logged-in state in a new browser tab; in other words, our web application provides users with a persistent login session.
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/xB.rE6RBMJ9wsNc3E.Lwrru3CfjcWy2Q/chapter-2/Session+and+cookie+logged-in.png)
    

So how does `cookie`, that is already saved to the browser, gets sent from the browser to the server so that end user can enjoy a persisten login session? It's always important to remember that `app` project is Next.js and is capable of rendering pages on both the server and the browser. `cookie` (`name` and `value`) gets sent from the browser to the server:

-   For client-side rendered pages, because `credentials: 'include'` for all requests, we specified this value inside the definition of `sendRequestAndGetResponse` method that all API methods use in our web application. Open `book/5-begin/app/lib/api/sendRequestAndGetResponse.ts` file and find line with:
    
    ```
      Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
    ```
    
    Setting `credentials` value to `include` makes request to contain cookies even for cross-origin calls (and calls between `app` and `api` projects is cross-origin):
    
    [https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)
    
-   For server-side rendered page, there is request from the browser to `app` server and then there is request between two servers, `app` server and `api` server. Original request for page comes from the browser to the `app` server first. So `app` server has `cookie` because of `credentials: 'include'`. But how to ensure that request from `app` server to `api` server includes `cookie` as well? Actually, it already does! Because of the code we wrote earlier but promised to explained later. Open `book/5-begin/app/lib/api/sendRequestAndGetResponse.ts` file and find the following code block:
    
    ```
      if (request && request.headers && request.headers.cookie) {
        headers.cookie = request.headers.cookie;
      }
    ```
    
    And then find how `headers` that contain `cookie` are used:
    
    ```
      Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
    ```
    
    So what does the above code mean? It means that we take `cookie` from the very first request (from the browser to the `app` server), which is `request.headers.cookie`. Then we save this `cookie` value to `headers` by assigning value to `headers.cookie`. Then we use these `headers` with `cookie` for the second request (from the `app` server to the `api` server), thus ensuring that `api` server has `cookie` value. We still did not add any code that translates `cookie` value into matching `session` and `user` but we will do so below.
    

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/xB.rE6RBMJ9wsNc3E.Lwrru3CfjcWy2Q/chapter-2/Session+and+cookie+logged-out.png)

Let's create our very first `session` and `cookie` in this book. Look at the above diagram again. Let's outline our work:

-   When the `YourSettings` page loads, `getUserBySlugApiMethod` executes, and the browser sends a request to the `API` server. We don't have to add any code here. We already built the "getting user by slug" API.
    
-   `api` server gets a request (from the browser or from the server) and creates a `session` object, as long as we configured session Express middleware to our `api` Express server. For session Express middleware to work, we need to configure session and mount session Express middleware on `api` server. You already know about Express middleware, for example, you mounted cors and parser Express middleware earlier in this book like this:
    
    ```
      server.use(
        cors({
          origin: process.env.URL_APP,
          methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
          credentials: true,
        }),
      );
    
      server.use(express.json());
    ```
    
    If we configure `session` and mount session Express middleware, then every request to the `api` server will result in creation of a `session` object. For performance reasons, we can check if anything change inside `session` object and if not, then not create a new `session` object.
    
-   We need to ensure that any `session` object gets saved to our MongoDB database as a `Session` MongoDB document. Express middleware `express-session` that we plan to use is responsible for saving `session` to database that is connected to our server. Express middleware will save new `session` object or object that got modified. Later in this section, we will test creation and saving of `session` to our database, to save `session` to our database we will modify it by adding property `foo` with value `bar` to it.
    
-   The `api` server sends a response to the browser of user who just logged in. This response has a `cookie` object that gets saved to the this user's browser. Here, in addition to configuring `session`, we need to configure `cookie` as well.
    

There is no additional code to write for the first step. Below, in the next few subsections, let's work on the rest of the above steps.

___

#### Configure session and mount middleware [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#configure-session-and-mount-middleware)

In this subsection, we will configure `session` and create it with Express middleware `express-session`. This Express middleware is not only responsible for creating `session` and `cookie` but also responsible for saving/removing corresponding `Session` MongoDB document from our database. As we mentioned earlier, `session` object gets created and exists on the server only. This means we will be updating our `api` server code at `book/5-begin/api/server/server.ts` file.

If you ran `yarn` at the beginning of this chapter, you have already installed `express-session` package. Check up this example of how to create `session` on an Express server:

[https://github.com/expressjs/session#readme](https://github.com/expressjs/session#readme)

Example code:

```
var session = require('express-session')

var app = express()
var sess = {
  secret: 'keyboard cat',
  cookie: {}
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))
```

Since we are not preparing our project for production (we do this in Chapter 10), we can simplify the above example to become:

```
var session = require('express-session')

var app = express()
var sess = {
  secret: 'keyboard cat',
  cookie: {}
}

app.use(session(sess))
```

If we modify the above example to fit our syntax and names of variables:

```
import * as session from 'express-session';

const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
};

const sessionMiddleware = session(sessionOptions);
server.use(sessionMiddleware);
```

Above code mounts Express middleware but we haven't discuss `name`, `secret`, `resave` and `saveUninitialized` parameters:

-   `name` value becomes name for the `cookie` object that will be attached to the response and saved to the browser. As we discussed earlier, our `api` server not only creates a `session` object, but it also saves `session` to our database, creates a `cookie` object using `session`'s id. Technically, `name` parameter is optional. If you have multiple domains and cookies, you should give informative names to these cookies.
    
    Come up with a value and add a new environmental variable called `SESSION_NAME` into the `book/5-begin/api/.env` file.
    
    [https://github.com/expressjs/session#name](https://github.com/expressjs/session#name)
    
-   `secret` is a key that is used to encode a `value` for `cookie` from session's id. After `cookie` is saved to the browser, requests from the browser to our `api` server will contain `cookie` value. Our `api` server then decodes the `value` of `cookie` into `session`'s id. Using the id of `session`, our `api` server finds matching `Session` MongoDB document in our database and then - since the `session` document contains the user id - finds and retrieves matching `User` MongoDB document from the same datbase.
    
    Generate a random, long-enough, string value and add a new environmental variable called `SESSION_SECRET` to the `book/5-begin/api/.env` file.
    
    [https://github.com/expressjs/session#secret](https://github.com/expressjs/session#secret)
    
    It's important to note that a `cookie` does not contain any of the `session`'s data except the encoded `session`'s id. You can read more on the properties of `cookie` here:
    
    [https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
    
-   `resave` forces the `session` to be saved to whatever storage is specified in the `store` parameter, for us it would be MongoDB database. We set this parameter's value to `false` so that `session` is not resaved to database if `session` was not modified.
    
    [https://github.com/expressjs/session#resave](https://github.com/expressjs/session#resave)
    
-   `saveUninitialized` saves an uninitialized `session` to the database. An uninitialized `session` object is an object that was created but not modified in any way. We don't want our database to be overwhelmed with `session` MongoDB documents that, for example, do not have `user` property. If we set value of `saveUninitialized` to `false` then `session`s from non logged-in users will not be saved to our database. Only `session`s from logged-in users will be saved to database. Remember, every request to our `api` server will result in creating a `session` object, but we do not want to save any `session` object to the connected database.
    
    [https://github.com/expressjs/session#saveuninitialized](https://github.com/expressjs/session#saveuninitialized)
    

___

The above code will make sure that our `api` server creates a new `session` object with specified parameters and only save modified `session` to database. But how do we save the `session` object to our MongoDB database? In order to save and retrieve `session` from our MongoDB database, we will use the `connect-mongo` package that works together with the `express-session` package like this:

[https://github.com/jdesboeufs/connect-mongo#express-or-connect-integration](https://github.com/jdesboeufs/connect-mongo#express-or-connect-integration)

Example from the above link to official docs:

```
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

app.use(session({
    secret: 'foo',
    store: new MongoStore(options)
}));
```

For us, the above example becomes:

```
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo');
import * as session from 'express-session';

const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL_TEST,
    ttl: 14 * 24 * 60 * 60, // save session 14 days
    autoRemove: 'interval',
    autoRemoveInterval: 1440, // clears every day
  }),
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    secure: false,
  },
};
```

Before assigning `MongoStore` instance as value to `store` parameter, `api` server was storing `session` object in its memory, now it will save `session` object as `Session` MongoDB document ot MongoDB database.

End user Navigate to mount middleware subsection You already learned discussion API method calls corresponding store method page component in production. Production-ready request if truthy then withAuth HOC compiles in a browser on the client discussion it works as expected Put it all together. Team members AWS dashboard email and name API method discussion session compiles API method calls corresponding store method S3 bucket production-ready S3 bucket. Subsection check if value is truthy API method calls corresponding store method Remember to add import cookie team members discussion end user session request was sent request was sent compiles page component You already learned. Static method calls MongoDB database on server only it works as expected show notification. It works as expected discussion page component on the client in this book compiles server-side rendering cookie cookie compiles. Show notification send this response Click on the button MongoDB database response list of posts list of posts on the client data model S3 bucket. S3 bucket Material-UI API method open this file page component AWS dashboard session. WithAuth HOC server-side rendering list of posts redirect to checkout HTTP API method API method calls corresponding store method on the client S3 bucket Put it all together Next.js web application compiles decorate method with action session. S3 bucket email and name in a browser add environmental variable response.

Options that you can pass to `MongoStore` are described in the official docs for `connect-mongo`:

[https://github.com/jdesboeufs/connect-mongo#connection-related-options-required](https://github.com/jdesboeufs/connect-mongo#connection-related-options-required)

-   `mongoUrl` is process.env.MONGO\_URL\_TEST. If you don't specify a name for your database inside the `MONGO_URL` string, then the default value is `test`.
    
-   `ttl` is a value in seconds. It sets the `expires` parameter inside the `session` document in our database.
    
-   `autoRemove: 'interval'` means that expired sessions in our database will be removed after some interval of time.
    
-   `autoRemoveInterval: 1440` means that expired sessions will be removed from our database every day (measured in minutes).
    

As always, if you ran `yarn` inside the `book/5-begin/api` folder at the start of this chapter, then you have both `express-session` and `connect-mongo` successfully installed.

___

#### Save session to database [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#save-session-to-database)

We are almost done and ready for testing! The last piece is deciding how to modify a `session` object so that it gets saved to database. As we mentioned a bit earlier, an uninitialized (unmodified) `session` does not get saved to our MongoDB database.

Later in this chapter, when we implement user authentication with Google OAuth API, we will modify the `session` object by adding a `passport` property that contains user's id. In Chapter 6, when we implement user authentication with Passwordless API, we will modify the `session` object by adding a `passwordless` property to it. This is how we save `session` to the database after a user logs into our web application by using either Google OAuth API or Passwordless API.

So how do we modify `session` to test our new code? It is really up to us. For example, we can add the parameter `foo` with value the `bar` to the `session` object. Add the following line to the Express route `/get-user-by-slug`:

```
//@ts-ignore
req.session.foo = 'bar';
```

Inside `book/5-begin/api/server/api/public.ts`, add the above line of code like so:

```
router.post('/get-user-by-slug', async (req, res, next) => {
  console.log('Express route: /get-user-by-slug');

  //@ts-ignore
  req.session.foo = 'bar';

  try {
    const { slug } = req.body;

    const user = await User.getUserBySlug({ slug });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
```

Because we have `saveUninitialized: false`, and we did modify the `session` object by adding the `foo` property - our `api` server should save a `Session` MongoDB document to the `test.sessions` collection of our MongoDB database.

Make sure you added all of the above code to our `api` server at `book/5-begin/api/server/server.ts`:

```
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo');
import './env';
import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import * as mongoose from 'mongoose';

import api from './api';

mongoose.connect(process.env.MONGO_URL_TEST);

const server = express();

server.use(
  cors({
    origin: process.env.URL_APP,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }),
);

server.use(express.json());

const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL_TEST,
    ttl: 14 * 24 * 60 * 60, // save session 14 days
    autoRemove: 'interval',
    autoRemoveInterval: 1440, // clears every day
  }),
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    secure: false,
  },
};

const sessionMiddleware = session(sessionOptions);
server.use(sessionMiddleware);

api(server);

server.get('*', (_, res) => {
  res.sendStatus(403);
});

server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

We are ready to test the `session` part of our infrastructure. We will configure and create `cookie` and test `cookie` in the next subsection.

We have to start both `app` and `api` projects for testing, since we need to load a page to execute the `getUserBySlugApiMethod` API method. Let's check our `test` database at MongoDB Atlas before we start our servers:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+10-41-35.png)

As expected, we have only one collection called `test.users` with one `User` MongoDB document that we created in Chapter 4.

Open two terminal windows on your VS code editor. In the left window, navigate to `book/5-begin/app`. In the right window, navigate to `book/5-begin/api`. Go ahead and start both projects with `yarn dev`. On your browser, load `http://localhost:3000/your-settings`.

Then go to MongoDB Atlas and reload the page that displays the collections for your `test` database:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+10-46-59.png)

Neat!

As we expected, our `api` server with the help of `express-session` and `connect-mongo` created a new collection called `test.sessions` and saved a `Session` MongoDB document inside of it. Look at the `Session` MongoDB document:

```
_id:"_3XXE9ItLgrJLBMtjV8Dpt5NToqF4xw6"
expires:2020-04-15T17:46:31.356+00:00
session:{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"foo":"bar"}
```

Let's discuss above fields and their corresponding values:

-   This `Session` MongoDB document has `expires`, which 14 days from the moment you loaded `YourSettings` page on your browser. This is why we specified `ttl`.
-   Also, there is a `session.cookie` property that has some default properties with default values. Important to note, the `cookie` object has a `null` value for `expired`. That's not good, since we don't want our browser to store `cookie` indefinitely in the browser's memory.
-   Finally, there is `foo` parameter with a `bar` value that we indeed added inside the Express route `/get-user-by-slug`.

To better understand how parameters inside `store` work, let's run an experiment:

-   Delete the `Session` MongoDB document manually from your database at the MongoDB Atlas dashboard.
    
-   Open `book/5-begin/api/server/server.ts` and change values like this:
    
    ```
      ttl: 30,
      autoRemove: 'interval',
      autoRemoveInterval: 1,
    ```
    
    You just set the expiration time of the `Session` MongoDB document to 30 seconds. Our `api` server will check every 1 minute for expired sessions in the database. If there are any, the `api` server will remove them.
    
-   Go ahead and reload `http://localhost:3000/your-settings`.
    
-   Quickly go to MongoDB Atlas and confirm that the new `Session` MongoDB document was indeed created:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+11-31-39.png)
    
-   Wait 30 seconds or so, reload MongoDB Atlas and boom, the `Session` MongoDB document got removed:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+11-32-16.png)
    
-   Remember to change values back to:
    
    ```
      ttl: 14 * 24 * 60 * 60, // save session 14 days
      autoRemove: 'interval',
      autoRemoveInterval: 1440, // clears every day
    ```
    

In the next subsection, let's properly configure `cookie` and make sure that the browser indeed saves and contains `cookie`.

___

#### Configure and create cookie [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#configure-and-create-cookie)

Configuring `cookie` parameters is straightforward. Let's consult with the `express-session` official docs:

[https://github.com/expressjs/session#cookie](https://github.com/expressjs/session#cookie)

Code snippet from official docs:

```
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
```

So all we need to do is decide which parametes to specify for the `cookie`:

```
cookie: {
  httpOnly: true,
  maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
  secure: false,
}
```

-   `httpOnly: true` means that `cookie` will not be available to client-side JavaScript and will only be accessed via HTTP - received with a response from the server and sent with a request to the server.
    
    [https://github.com/expressjs/session#cookiehttponly](https://github.com/expressjs/session#cookiehttponly)
    
    Browsers that respect the corresponding header will not allow saving or updating `cookie` in any other way (for example, no saving through client-side JavaScript code).
    
-   `maxAge: 14 * 24 * 60 * 60 * 1000` is how long a `cookie` will be stored on the browser, measured in milliseconds (unlike `session.ttl`, which is measured in seconds).
    
    [https://github.com/expressjs/session#cookiemaxage](https://github.com/expressjs/session#cookiemaxage)
    
    We, as developers, do not want the browser to store `cookie` indefinitely. For your own SaaS product, you should decide how long you want your end user to stay logged-in before requiring that end user to log in again. Here, we specified 14 days. We want our end users to stay logged-in for 14 days when using SaaS boilerplate. After that, we ask users to log in again.
    
    Later, after introducing Google OAuth API, we will see what happens if a logged-in user manually deletes `cookie` from their browser's memory.
    
-   `secure: false` makes sure that once `cookie` exists on the browser, requests that are coming from the browser to the `api` server will contain `cookie`, even if the protocol is `HTTP` and not `HTTPS`. If `secure: true`, then the website must be secured with an SSL certificate (`HTTPS`) to send `cookie` with a request to the server. Later in Chapter 10, when we prepare SaaS boilerplate for production, we will need to create logic that sets `secure: true` when `NODE_ENV=production`.
    
    [https://github.com/expressjs/session#cookiesecure](https://github.com/expressjs/session#cookiesecure)
    

Add the above code snippet to the `sessionOptions` like so:

```
const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore.create({
    mongoUrl: process.env.MONGO_URL_TEST,
    ttl: 14 * 24 * 60 * 60, // save session 14 days
    autoRemove: 'interval',
    autoRemoveInterval: 1440, // clears every day
  }),
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    secure: false,
  },
};
```

Alrighty! We are ready to test if `cookie` indeed gets saved to the browser.

Remove any documents from your `test.sessions` collection manually at the MongoDB Atlas dashboard.

Start both `app` and `api` with `yarn dev`.

Send this response new Express route Put it all together static method calls HTTP cookie S3 bucket Remember to add import cookie Remember to add import Remember to add import. Next.js web application Google OAuth API send this response check if value is truthy discussion triggers method production-ready redirect to checkout new Express route At AWS dashboard API infrastructure We will discuss API infrastructure API infrastructure. Request was sent page component discussion page component open this file cookie Navigate to. Data model team members redirect to checkout triggers method end user AWS dashboard in this book add environmental variable in a browser. On the client triggers method on the client end user decorate method with action Click on the button Put it all together cookie send this response. Decorate method with action Next.js web application API infrastructure add environmental variable API method calls corresponding store method We will discuss withAuth HOC conditional operator on server only if truthy then Next.js web application email and name. In a browser Material-UI cookie on the client Material-UI Team Leader subsection compiles it works as expected add environmental variable on the client. If truthy then check if value is truthy redirect to checkout server-side rendering on server only API infrastructure production-ready triggers method in a browser list of posts list of posts mount middleware. Request list of posts if truthy then At AWS dashboard it works as expected triggers method. On the client in this book Put it all together on server only Next.js web application response on the client end user data model.

Navigate to `htpp://localhost:3000/your-settings` and check your `test.sessions` collection for a newly created `session` document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+13-01-18.png)

This `session` document in our database contains the proper `cookie` object:

```
{"cookie":{"originalMaxAge":1209600000,"expires":"2020-04-15T20:00:43.967Z","secure":false,"httpOnly":true,"path":"/"},"foo":"bar"}
```

As you can see, `maxAge` was used to create values for both `originalMaxAge` and `expires`.

On the browser, while on `YourSettings` page, click `Ctrl + Shift + J`.

Then click on the `Application` tab inside `Chrome Developer Tools`. Click on `http://localhost:3000` inside the `Cookies` dropdown list:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+13-04-33.png)

We have zero cookies on the list of cookies.

Why is that? As we mentioned at the beginning of this section, the `YourSettings` is server-side rendered when you load it in a new browser tab. For our `api` server to send `cookie` to the the browser instead of `app` server, `app` code on the browser has to send the original request. That means that we have to load `YourSettings` so that it's client-side rendered instead of server-side rendered. The easiest way to do so is to add a `Link` element from Next.js to the `Index` page.

Open `book/5-begin/app/pages/index.tsx` and modify an existing `Link` element to lead to `YourSettings` page, like this:

```
<p>Content on Index page</p>
<Link href="/your-settings" as="/your-settings">
  Go to Your Settings page
</Link>
```

Load the `Index` page in your browser by going to `http://localhost:3000`. Then click the link for `Go to Your Settings page`. Open `Chrome Developer Tools > Application`. Click on `http://localhost:3000` and look inside the `Cookies` dropdown list:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-01+13-13-27.png)

This time we successfully saved `cookie` to the browser! Congrats!

After we introduce our first user authentication method (Google OAuth API), we will experiment with changing `cookie` parameters and manually deleting `cookie` from the browser.

___

## Google OAuth API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#google-oauth-api)

Most people reading this book are individuals or small teams with scarce amount of time and or money. So when you, as a small team or single software engineer, build your web application for your SaaS business, an important decision is how your app will authenticate end users.

You want your user authentication method to be easy-to-use but also secure. Due to limited time and resources, you may not be able to build an authentication system (and two-factor authentication) on your own. One way to go is to implement so-called "delegated authentication". An example is Google OAuth. An end user of your web application will use their Google account to log in to your web application. Google has and encourages two-factor authentication for its accounts.

For example, we sell our books at [https://builderbook.org](https://builderbook.org/), and we use delegated authentication via Google OAuth. An end user can log in to this website using their Google account. Once logged-in, the user can purchase a book and/or access already purchased books. Google OAuth works just fine for a web application that sells online content. Google accounts are secured with 2-Step Verification:

[https://www.google.com/landing/2step/](https://www.google.com/landing/2step/)

In addition, a typical person does not share their Google account credentials with other people. Thus, our books are typically purchased by individuals or small teams which is our intent.

Another route could be called "non-delegated authentication", user authentication that we build without third-party, external, API service. An example is Passwordless. In this book, we teach you how to implement both delegated (Google OAuth API) and non-delegated (Passwordless API) user authentication infrastructures.

As you can imagine, a delegated method will have a request-response cycles not only between `app` on the browser and the `api` server but also between the `api` server and Google OAuth server. For non-delegated, request-response cycles occur between `app` on the browser and the `api` server. We will discuss and build Passwordless API in Chapter 6. Both delegated and non-delegated methods will have a request-response cycle between the `api` server and the MongoDB server, due to updating or retrieving `Session` and `User` MongoDB documents from the connected database.

In this section, we will use so-called "OAuth 2.0 Authorization Framework" to allow an end user to log in our web application using their Google account. Digital Ocean has a great tutorial on how OAuth 2.0 works. Please check it out, as it will make the rest of this section easier to understand:

[https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)

If you read the above article, you know that the authentication process involves multiple client-side (browser) redirects and multiple req-res cycles. Here is an infrastructure from the above article that we will adopt for our user authentication:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-06+10-54-00.png)

Here is a list of actions, redirects, and req-res cycles for our Google OAuth API:

-   An end user clicks the login button on the `Login` page of our web application. This is `app` code on the browser.
-   The browser sends `req1` to our `api` at the Express route `/auth/google`.
-   `api` calls the `passport.authenticate` method (from `passport` library) that sends `res1` to the browser. This response contains a directive to the browser to redirect an end user to Google page (page hosted by Google) at a unique URL. This unique URL is generated by `passport` library using your `GOOGLE_CLIENTID` and `GOOGLE_CLIENT_SECRET`.
-   On Google's page, the end user is offered to "Sign in with Google". If a user has more than one Google account, the user is offered to select a specific account. We will configure `passport` with a `prompt` parameter later in this section so that end user is always offered to select Google account. This is a good UX since, nowadays, many people have more than one Google account.
-   After an end user confirms their intent to log in with their Google account, Google's page sends `req2` to the Google OAuth server.
-   The Google OAuth server sends `res2` to the browser. This response contains `Authorization Code` and asks the browser to send `req3` to our `api` server at the Express route `/oauth2callback`.
-   Our `api` server calls the `passport.authenticate` method that sends `req4` to the Google OAuth server (again, URL generated by `passport`). This request contains `Authorization Code`.
-   The Google OAuth server sends `res4` to our `api` server. This response contains an `Access Token` or error.
-   If `api` gets an `Access Token` from Google OAuth server, then `api` sends `res3` to the browser. This response asks the browser to redirect an end user to `YourSettings` page, since authentication has succeeded.
-   If `api` gets an error response from Google OAuth server, then `api` sends `res3` to the browser. This time, the response asks the browser to redirect an end user to the `Login` page, since authentication has failed.

Let's visualize the above req-res cycles and redirects:

![Builder Book](https://user-images.githubusercontent.com/10218864/106919385-f37ff200-66be-11eb-91e8-95ab98068dc6.png)

A lot of heavy lifting, such as generation of unique API endpoint, sending request and processing response - all done by calling the `passport.authenticate` method. Instead of implementing an entire authentication flow from scratch, we use `passport` and `passport-google-oauth` packages for helping us to implement Google OAuth 2.0 strategy in our web application. Both packages are created by Jared Hanson:

[http://www.passportjs.org/docs/google/](http://www.passportjs.org/docs/google/)

As you build more JS/TS applications, you will find that the availability of all kinds of packages is both a blessing and a curse. On one hand, you can install a package and use its API to achieve whatever functionality you want in a short period of time. On the other hand, relying on 100s of packages requires you, as a developer, to keep an eye on any breaking changes in those packages. In addition to breaking changes, authors of packages do retire. And you must keep an eye on type of the license package has and whether commercial uses are allowed. For our other businesses, we strive to reduce number of packages. When we have time, we replace packages with our internal code.

Look at the above diagram for Google OAuth API. What triggers the very first request `req1` from the browser to our `API` server? The answer is the **click** on the `LoginButton` component of the `Login` page. The value of the first API endpoint is passed to the `href` prop of the `Button` component. Open `book/5-begin/app/components/common/LoginButton.tsx` and you will find:

```
const url = `${process.env.NEXT_PUBLIC_URL_API}/auth/google`;
```

Note that we did not define any API method to send request to the above API endpoint, clicking on the button or `<a>` anchor elemement sends request with method `GET` automatically.

___

#### Express routes for Google OAuth API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-for-google-oauth-api)

As you see from the above description of the OAuth 2.0 flow and the diagram we drew, `passport` does multiple things. It generates a unique URL for redirecting an end user to Google's website. Passport is also responsible for sending requests and processing responses. How did we know when to call the `passport.authenticate` method? Because the `passport` official docs suggest calling this method two times: once inside each of two required Express route:

-   Express route `/auth/google`
-   Express route `/auth/google/callback`

Open up the official docs from `passport`:

[http://www.passportjs.org/docs/google/](http://www.passportjs.org/docs/google/)

Then scroll to the `oAuth 2.0` Section. Under it, find the subsection `Routes`.

Description for routes (in our case, Express routes) from the official docs:

```
// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
```

The only difference is that the docs use API endopoint `/auth/google/callback` for the second Express route, and we use `/oauth2callback`.

How do we know that `passport` and `passport-google-oauth` do indeed generate a unique URL for redirecting an end user to Google page (hosted by Google) and for sending request `req4` to Google OAuth server? We can always search inside the source code of the packages that we use. Here is the snippet that sets `authorizationURL` and `tokenURL` inside `options`:

[https://github.com/jaredhanson/passport-google-oauth2/blob/master/lib/strategy.js#L49-L50](https://github.com/jaredhanson/passport-google-oauth2/blob/master/lib/strategy.js#L49-L50)

And here is the code that adds redirect instructions to responses `res1` and `res3`:

[https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js#L315](https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js#L315)

Let's modify the above code from the official `passport` docs to fit into our codebase. Remember that we need to call `passport.authenticate('google', options)` inside each of the above Express routes. Create a new file, `book/5-begin/api/server/google-auth.ts`, inside it add:

```
import * as passport from 'passport';

// some other code

server.get('/auth/google', (req, res, next) => {
  const options = {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  };

  passport.authenticate('google', options)(req, res, next);
});

server.get(
  '/oauth2callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
  }),
  (_, res) => {
    res.redirect(`${process.env.URL_APP}/your-settings`);
  },
);
```

In the first Express route, calling `passport.authenticate` generates a unique URL using your API keys (acquired from the dashboard at your Google Cloud Platform account) and sends response back to the browser with instruction to redirect end user from `Login` page of our web application this unique URL - to Google page of Google's web application. We passed an additional parameter called `prompt` that asks an end user to select a Google account, since many people have more than one.

In the second Express route, calling `passport.authneticate` generates a unique API endpoint, sends request to Google OAuth server and processes response. This response contains either `Access Token` or error. We explicitly send response from the `api` server back to the browser and redirect to either `/your-settings` or `/login` route depending on whether authentication was success (`/your-settings`) or failure (`/login`).

___

#### Configure passport [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#configure-passport)

So far so good. We've created two Express routes for Google OAuth API.

Although we have already called `passport.authenticate`, we haven't created and configured `passport` instance yet. As always, let's check the official docs for `passport`;

[http://www.passportjs.org/docs/google/](http://www.passportjs.org/docs/google/)

Scroll to the `oAuth 2.0` section. Under it, find the `Configuration` subsection.

Configuring `passport` from the offical docs:

```
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));
```

Let's adopt the above configuration for our `api` server:

```
import * as passport from 'passport';
import { OAuth2Strategy as Strategy } from 'passport-google-oauth';

// some code 

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_CLIENTSECRET,
      callbackURL: `${process.env.URL_API}/oauth2callback`,
    },
    verify,
  ),
);
```

We've changed the value for `callbackURL` to match our API endpoint for the second Express route that we defined in the previous subsection. We accessed values of our environmental variables with `process.env.`. For readibility, we replaced the unnamed function `function(accessToken, refreshToken, profile, done)` with function that has name - `verify`.

___

#### verify function [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#verify-function)

Our `verify` function compared to the one in the official `passport` docs:

```
function(accessToken, refreshToken, profile, done) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
}
```

To understand the purpose of `verify`, look at Google OAuth API again:

![Builder Book](https://user-images.githubusercontent.com/10218864/106919385-f37ff200-66be-11eb-91e8-95ab98068dc6.png)

Specifically, look at the `req4-res4` cycle. Our `api` server calls the `passport.authenticate` method that sends `req4` to Google OAuth server (at unique API endpoint generated by `passport`). This request contains `Authorization Code`. Google OAuth server sends `res4` to our `api` server. This response contains `Access Token` or error. This `accessToken` (along with other data such as `refreshToken` and `profile`) will be parsed by `passport` on our `api` server, which then passes data (`accessToken`, `refreshToken`, `profile`) parsed from the `res4` response to the `verify` function as arguments and calls this function.

Open this file email and name triggers method end user in production S3 bucket team members. You already learned We will discuss Next.js web application discussion MongoDB database new Express route list of posts Next.js web application this chapter new Express route Remember to add import. If truthy then Navigate to check if value is truthy page component Click on the button in this book show notification conditional operator subsection Team Leader check if value is truthy session conditional operator cookie API method calls corresponding store method. On server only check if value is truthy static method calls request was sent discussion At AWS dashboard production-ready Navigate to conditional operator cookie in a browser this chapter discussion. Remember to add import on server only on the client mount middleware send this response At AWS dashboard API method calls corresponding store method production-ready it works as expected Team Leader MongoDB database Click on the button At AWS dashboard AWS dashboard. It works as expected AWS dashboard send this response You already learned You already learned on the client show notification response redirect to checkout Remember to add import API infrastructure. On server only Click on the button compiles end user MongoDB database Google OAuth API AWS dashboard At AWS dashboard store method calls redirect to checkout. Check if value is truthy HTTP on the client At AWS dashboard API method store method calls. S3 bucket cookie Team Leader in production this chapter on server only request was sent cookie. Redirect to checkout page component response on server only MongoDB database AWS dashboard in a browser check if value is truthy in a browser.

When called, `verify` calls the `User.findOrCreate` static method of our `User` data model. This static method either creates a new `User` MongoDB document or finds and updates an existing `User` MongoDB document in our database.

In case an error is caught, for example, the database is not connected to our `api` server or Google OAuth server responds with error, `passport` docs advise calling `done` callback with an `err` argument:

```
done(err);
```

If no error is caught, `passport` docs suggest calling `done` callback with `null` for error argument and `user`:

```
done(null, user);
```

Calling `done(null, user)` ultimately causes:

-   User's id of created or existing `User` MongoDB document saved to `session` object and MongoDB document as `session.passport.user` property/field.
-   `api` server populates `req.user` property with `user` object that corresponds to created or existing `User` MongoDB document. So that end user can have a persisten login session. A browser of an end user who requests page, sends `cookie` to `api` server, `api` server finds matching `Session` MongoDB document. Then via `session.passport.user` field's value, finds matching `User` MongoDB document. Then `api` populates `req.user` with user's data and we can use it in any Express route or middleware.

Let's modify the `verify` function from the official docs to fit our use case, like this:

```
import * as passport from 'passport';
import { OAuth2Strategy as Strategy } from 'passport-google-oauth';

// some code 

const verify = async (accessToken, refreshToken, profile, done) => {
  let email;
  let avatarUrl;

  if (profile.emails) {
    email = profile.emails[0].value;
  }

  if (profile.photos && profile.photos.length > 0) {
    avatarUrl = profile.photos[0].value.replace('sz=50', 'sz=128');
  }

  try {
    const user = await User.signInOrSignUpViaGoogle({
      googleId: profile.id,
      email,
      googleToken: { accessToken, refreshToken },
      displayName: profile.displayName,
      avatarUrl,
    });

    done(null, user);
  } catch (err) {
    done(err);
    console.error(err);
  }
};
```

Compare our `verify` function to the one in the official docs.

What did we add and why?

We used our favorite `try/catch` construct (we introduced it in Chapter 2). In addition to `profile.id`, we get three more parameters: `profile.emails[0]`, `profile.photos[0]` and `profile.displayName`. We use them as values for following fields of `User` MongoDB document: `email`, `avatarUrl`, and `displayName`. Our static method for the User model is called `User.signInOrSignUpViaGoogle` instead of `User.findOrCreate` but it has the same ultimate purpose, to create or find/update `User` MongoDB document. We did call `done(null, user);` in the case of success. In the case of failure, we print `err` like this `done(null, false, { message: err });`.

___

#### passport and session [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#passport-and-session)

We are making progress! `passport` does a lot of heavy lifting for us, such as generating unique URL for redirect to Google page and API endpoint for req-res cycle between `api` server and Google OAuth server. At this point, we:

-   Defined two Express routes: `/auth/google` and `/oauth2callback`
-   Called `passport.authenticate` twice (once in each Express route).
-   Made `passport` to use Google strategy by calling `passport.use` method
-   Passed parsed data from response (response from Google OAuth server) to the `verify` function that ultimately either creates or updates existing `User` MongoDB document via `User.signInOrSignUpViaGoogle`.

However, we have not done any of the below tasks yet:

-   Initialized `passport`.
-   Once authentication is success (after `done(null, user)` is called), `passport` has to modify a `session` object.
-   Once authentication is success, `passport` has to save user's id to `session.passport.user` property.
-   Once authentication is success, `passport` has to populate `req.user` property

Earlier in this chapter, you learned the concepts of `session` and `cookie`. You learned that with our setup, the `session` object will not be saved as a document into our database unless it is modified in some way. Open `book/5-begin/api/server/api/public.ts`, and you can see how we achieved it earlier in this chapter:

```
//@ts-ignore
req.session.foo = 'bar';
```

We modified the `session` document via the parameter `foo` with the value `bar`.

We need to make `passport` modify our Express `session` like this:

```
"passport":{"user":"5e72dddc09b630001712429a"}
```

Where `5e72dddc09b630001712429a` is the value for a user's id (`user._id`).

Why do we need it? As discussed earlier in this chapter, the `cookie` that is saved to end user's browser. The browser sends a request to the `api` server, and this request contains the `cookie` name and value. Then, our `API` server decodes the value of `value` of the received `cookie` into the `session`'s id and finds a unique `Session` MongoDB document in the database. This matching `Session` MongoDB document contains the `session.passport.user` property, which is the user's id. Our `api` server finds matching `User` MongoDB document by id in the database and saves this user object to `req.user`. We then can use `req.user` for any request end user sends to `api` server thus making end user to have persistent login session. This is a good UX and pretty much an expected feature of web applications.

How do we initialize `passport` and make `passport` work with `session` as we just described? According to official docs (section `Middleware`), we have to mount two Express middleware functions on our Express server:

[http://www.passportjs.org/docs/configure#middleware](http://www.passportjs.org/docs/configure#middleware)

```
server.use(passport.initialize());
server.use(passport.session());
```

First middleware initializes `passport`. Second middleware ensures that `session` gets modified with `session.passport.user` property. However, value saved to `session.passport.user` has to be explicitly specified by us.

This is an example from the official docs (section `Sessions`) on how to define `passport.serializeUser` and `passport.deserializeUser`:

[http://www.passportjs.org/docs/configure#sessions](http://www.passportjs.org/docs/configure#sessions)

`passport.serializeUser` allows you to specify what user-identifying information gets saved as a value for `session.passport.user`. We will save `user._id` value to the `session.passport.user` property.

`passport.deserializeUser` allows you to specify what data will be populated to `req.user`. We will search for `User` MongoDB document by id and use `user` object that corresponds to found document for `req.user` value.

Here is example from the above link to the `Sessions` section of the official docs:

```
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, User.publicFields())
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
```

In our setup, the above code becomes:

```
import * as passport from 'passport';
import User, { UserDocument } from './models/User';

// some code

passport.serializeUser((user: UserDocument, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, User.publicFields())
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
```

In our case, the user's id is `user._id` instead of `user.id`. And since we use TypeScript, we specified type for `user`. We also save only some parameters from the found `User` MongoDB document to the user object. We call those parameters public. We will define a static method called `User.publicFields` later in this section.

Alright, we are ready to put all code together.

Open `book/5-begin/api/server/google-auth.ts` file, and add all the code we wrote so far in this section so far like:

```
import * as passport from 'passport';
import { OAuth2Strategy as Strategy } from 'passport-google-oauth';

import User, { UserDocument } from './models/User';

function setupGoogle({ server }) {
  if (!process.env.GOOGLE_CLIENTID) {
    return;
  }

  const verify = async (accessToken, refreshToken, profile, done) => {
    let email;
    let avatarUrl;

    if (profile.emails) {
      email = profile.emails[0].value;
    }

    if (profile.photos && profile.photos.length > 0) {
      avatarUrl = profile.photos[0].value.replace('sz=50', 'sz=128');
    }

    try {
      const user = await User.signInOrSignUpViaGoogle({
        googleId: profile.id,
        email,
        googleToken: { accessToken, refreshToken },
        displayName: profile.displayName,
        avatarUrl,
      });

      done(null, user);
    } catch (err) {
      done(err);
      console.error(err);
    }
  };

  passport.use(
    new Strategy(
      {
        clientID: process.env.GOOGLE_CLIENTID,
        clientSecret: process.env.GOOGLE_CLIENTSECRET,
        callbackURL: `${process.env.URL_API}/oauth2callback`,
      },
      verify,
    ),
  );

  passport.serializeUser((user: UserDocument, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, User.publicFields())
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  });

  server.use(passport.initialize());
  server.use(passport.session());

  server.get('/auth/google', (req, res, next) => {
    const options = {
      scope: ['profile', 'email'],
      prompt: 'select_account',
    };

    passport.authenticate('google', options)(req, res, next);
  });

  server.get(
    '/oauth2callback',
    passport.authenticate('google', {
      failureRedirect: '/login',
    }),
    (_, res) => {
      res.redirect(`${process.env.URL_APP}/your-settings`);
    },
  );
}

export { setupGoogle };
```

Note that if at least one environmental variable is missing (we chose `GOOGLE_CLIENTID`), there is no point in mounting two Express middleware functions and two Express routes:

```
if (!process.env.GOOGLE_CLIENTID) {
  return;
}
```

Next, open `book/5-begin/api/server/server.ts`, then import and use `setupGoogle`:

```
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo');
import './env';
import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import * as mongoose from 'mongoose';

import api from './api';
import { setupGoogle } from './google-auth';

mongoose.connect(process.env.MONGO_URL_TEST);

const server = express();

server.use(
  cors({
    origin: process.env.URL_APP,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }),
);

server.use(express.json());

const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL_TEST,
    ttl: 14 * 24 * 60 * 60, // save session 14 days
    autoRemove: 'interval',
    autoRemoveInterval: 1440, // clears every day
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    secure: false,
  },
};

const sessionMiddleware = session(sessionOptions);
server.use(sessionMiddleware);

setupGoogle({ server });

api(server);

server.get('*', (_, res) => {
  res.sendStatus(403);
});

server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

Finally, open `book/5-begin/api/server/api/public.ts`. Comment out the following line of code (so we don't save unnecessary `Session` MongoDB documents to our database):

```
//@ts-ignore
req.session.foo = 'bar';
```

In the next subsection, we will define thhe static methods `publicFields` and `signInOrSignUpViaGoogle`. After that, we will test our entire Google OAuth API infrastructure.

___

#### Static methods publicFields and signInOrSignUpViaGoogle [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#static-methods-publicfields-and-signinorsignupviagoogle)

When we defined `setupGoogle` in the previous subsection, we imported and called two static methods `User.publicFields` and `User.signInOrSignUpViaGoogle`. We briefly described these static methods, but we haven't described them.

The `User.publicFields` method populates and returns an `array`. This `array` contains parameters from the `User` MongoDB document that we, as developers, consider public. By public, we mean safe to send to the browser. For example, it's ok to send `displayName` and `email` to the browser, but it's not ok to send `googleToken`. There is no reason for the browser to have `googleToken`, and if we send it to browser, some other party on the browser can read and gain access to user information using Google API.

`signInOrSignUpViaGoogle` either finds an existing `User` MongoDB document or creates a new one. For an existing `User` MongoDB document, we want to update two parameters: `googleId` and `googleToken` (`googleToken: { refreshToken?: string; accessToken?: string }`). For a new user, we want to pass all necessary parameters, such as `createdAt` and others in addition to `googleId` and `googleToken`. We also want to add a new boolean parameter to a new `User` MongoDB document - `isSignedupViaGoogle` - and set its value to `true`.

Decorate method with action Navigate to You already learned Google OAuth API add environmental variable At AWS dashboard cookie You already learned page component this chapter cookie. Static method calls static method calls show notification this chapter if truthy then At AWS dashboard it works as expected withAuth HOC conditional operator send this response compiles. Show notification AWS dashboard email and name new Express route email and name At AWS dashboard. In a browser withAuth HOC Google OAuth API Click on the button send this response production-ready show notification in production open this file. Google OAuth API Next.js web application it works as expected Google OAuth API on server only team members You already learned Team Leader Team Leader Remember to add import on the client send this response discussion subsection cookie. Server-side rendering compiles Google OAuth API response if truthy then Team Leader triggers method cookie in production production-ready server-side rendering end user Next.js web application triggers method in a browser. Triggers method compiles MongoDB database team members API method request was sent request was sent static method calls withAuth HOC AWS dashboard We will discuss triggers method if truthy then We will discuss store method calls. You already learned mount middleware Next.js web application cookie API infrastructure session show notification request was sent At AWS dashboard server-side rendering session mount middleware conditional operator withAuth HOC. AWS dashboard Click on the button on server only production-ready MongoDB database response if truthy then Navigate to Click on the button. Response Navigate to response on the client request was sent HTTP.

Open `book/5-begin/api/server/models/User.ts` file, and let's define these two new static methods.

We already defined two static methods for the `User` data model: `User.getUserBySlug` and `User.updateProfile`.

Let's start working on `User.publicFields` and `User.signInOrSignUpViaGoogle` with defining data . This is a must since we are using TypeScript:

```
publicFields(): string[];

signInOrSignUpViaGoogle({
  googleId,
  email,
  displayName,
  avatarUrl,
  googleToken,
}: {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  googleToken: { accessToken?: string; refreshToken?: string };
}): Promise<UserDocument>;
```

As you can see, the `User.publicFields` static method simply returns an `array` of parameters that we, as project's developers, deem to be public. Public as in safe to be sent to the browser.

Let's define the `publicFields` static method:

```
public static publicFields(): string[] {
  return ['_id', 'id', 'displayName', 'email', 'avatarUrl', 'slug', 'isSignedupViaGoogle'];
}
```

We simply return an `array` of parameters. You may wonder why `User.publicFileds` does not use any Mongoose API methods. That's because we call the `User.publicFields` method as a second argument of our Mongoose API method `findById`:

```
User.findById(id, User.publicFields(), (err, user) => {
  done(err, user);
});
```

The second argument for Mongoose API method `findById` can by string or array of fields/properties that we want to return for retrieved `User`MongoDB document. Check up second parameter for `findById` inside the `User.updateProfile` static method:

```
const user = await this.findById(userId, 'slug displayName');
```

Thus `User.publicFields()` as a second argument to `findById` is simply array of fields/properties that we deem to be ok to be sent to the browser. Note that we did not include, `googleId`, `googleToken`, `createdAt` since sending first two parameters to the browser is not safe and sending the last parameter is unnecessary and potentially not safe as well.

The static method `User.signInOrSignUpViaGoogle` gets all of its parameters from inside `verify` function, which means, from the end user's Google account. As you learned in the previous subsection, `passport` gets `profile`, `accessToken`, and `refreshToken` from the Google OAuth server. Then `passport` passes data to the `verify` function. Inside `verify`, we define `googleId`, `email`, `displayName`, and `avatarUrl` from `profile`. We also define `accessToken` and `refreshToken`, and construct a `googleToken` object out of these two property/value pairs. Then we pass all user-related data to `User.signInOrSignUpViaGoogle` like this:

```
const user = await User.signInOrSignUpViaGoogle({
  googleId: profile.id,
  email,
  googleToken: { accessToken, refreshToken },
  displayName: profile.displayName,
  avatarUrl,
});
```

Definition for the `User.signInOrSignUpViaGoogle` static method is not complicated but relatively long since we want to achieve multiple things inside it. First, open `book/5-begin/api/server/models/User.ts` file and add three new fields for the `User` MongoDB document: `googleId` (`string`), `googleToken` (`object` with two parameters that are `string` type), and `isSignedupViaGoogle` (`boolean`). Let's add them to our mongoSchema for `User` data model:

```
googleId: {
  type: String,
  unique: true,
  sparse: true,
},
googleToken: {
  accessToken: String,
  refreshToken: String,
},
isSignedupViaGoogle: {
  type: Boolean,
  required: true,
  default: false,
},
```

Let's add all of these three fields/parameters to `interface` of `UserDocument`:

```
googleId: string;
googleToken: { accessToken: string; refreshToken: string };
isSignedupViaGoogle: boolean;
```

Inside `User.signInOrSignUpViaGoogle` definition, we need to write code that covers two cases:

-   We search the `users` collection by email, since each email is unique. If a `User` MongoDB document exists in our database, then we want to update `googleId` and `googleToken`, in case they changed, for this existing `User` MongoDB document:
    
    ```
      const user = await this.findOne({ email })
        .select([...this.publicFields(), 'googleId'].join(' '))
        .setOptions({ lean: true });
    
      if (user) {
        if (_.isEmpty(googleToken) && user.googleId) {
          return user;
        }
    
        const modifier = { googleId };
        if (googleToken.accessToken) {
          modifier['googleToken.accessToken'] = googleToken.accessToken;
        }
    
        if (googleToken.refreshToken) {
          modifier['googleToken.refreshToken'] = googleToken.refreshToken;
        }
    
        await this.updateOne({ email }, { $set: modifier });
    
        return user;
      }
    ```
    
    You already used the `modifier` object when creating the `User.updateProfile` static method, so we will not discuss in detail again. You also already used the `findOne` Mongoose API method inside the `User.getUserBySlug` static method. Finally, you are familiar with the `lean` option from Chapter 4. A new Mongoose API method that we haven't used in this book is `updateOne`. This is how it works:
    
    [https://mongoosejs.com/docs/api/model.html#model\_Model.updateOne](https://mongoosejs.com/docs/api/model.html#model_Model.updateOne)
    
    This line of code finds one `User` MongoDB document by email and updates values for fields specified as a second argument. In our case, for fields inside the `modifier` object:
    
    ```
      this.updateOne({ email }, { $set: modifier });
    ```
    
    We also checked whether the `googleToken` object is empty with:
    
    ```
      _.isEmpty(googleToken)
    ```
    
    The above statement returns `true` when the object is empty or null, and it returns `false` for a non-empty object. We used the `lodash` package, which saves us time by having a bunch of pre-built utility methods that we don't have to implement from scratch. This is how `isEmpty` works:
    
    [https://lodash.com/docs/4.17.15#isEmpty](https://lodash.com/docs/4.17.15#isEmpty)
    
    Remember to import `lodash` to `book/5-begin/api/server/models/User.ts` like this:
    
    ```
      import * as _ from 'lodash';
    ```
    
    If a `User` MongoDB document exists and `googleToken` is an empty object, we don't modify the `User` MongoDB document in any way and return the excisting `User` MongoDB document.
    
    If a `User` MongoDB document exists and `googleToken` is not an empty object, we update the `User` MongoDB document with `modifier` (object with `googleToken` and `googleId`) and return `user` object that represents/corresponds to the existing `User` MongoDB document.
    
-   We search the `users` collection by email. If a `User` MongoDB document **does not** exist in the database, we generate a `slug` from `displayName` and create a new `User` MongoDB document with all necessary parameters:
    
    ```
      const slug = await generateSlug(this, displayName);
    
      const newUser = await this.create({
        createdAt: new Date(),
        googleId,
        email,
        googleToken,
        displayName,
        avatarUrl,
        slug,
        isSignedupViaGoogle: true,
        darkTheme: false,
      });
    
      return _.pick(newUser, this.publicFields());
    ```
    
    We discussed `generateSlug` method in Chapter 4 when we defined it and learned about Jest testing. `create` is a Mongoose API method that we use for the first time in this book. This is how it creates a new MongoDB document:
    
    [https://mongoosejs.com/docs/api/model.html#model\_Model.create](https://mongoosejs.com/docs/api/model.html#model_Model.create)
    
    `pick` is another `lodash` utility function. It returns a new object that contains only "picked" parameters of the original object:
    
    [https://lodash.com/docs/4.17.15#pick](https://lodash.com/docs/4.17.15#pick)
    
    In other words, we return a new `User` MongoDB document but only with parameters that we deem public fields.
    
    `isSignedupViaGoogle` is a handy parameter. Later on, we can use it to show an end user, on the `YourSettings` page, how they signed up in our web application. Since we will have two, Google OAuth and Passwordless, signup options, `isSignedupViaGoogle` can help us distinguish between the two. Besides showing this information to the end user, we can use it internally to understand which authentication method is more popular among users of our web application.
    

After you plug all of the above code blocks into `book/5-begin/api/server/models/User.ts`, you should get:

```
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import { generateSlug } from '../utils/slugify';

const mongoSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: String,
  avatarUrl: String,
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  googleToken: {
    accessToken: String,
    refreshToken: String,
  },
  isSignedupViaGoogle: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export interface UserDocument extends mongoose.Document {
  slug: string;
  createdAt: Date;
  email: string;
  displayName: string;
  avatarUrl: string;
  googleId: string;
  googleToken: { accessToken: string; refreshToken: string };
  isSignedupViaGoogle: boolean;
}

interface UserModel extends mongoose.Model<UserDocument> {
  getUserBySlug({ slug }: { slug: string }): Promise<UserDocument>;

  updateProfile({
    userId,
    name,
    avatarUrl,
  }: {
    userId: string;
    name: string;
    avatarUrl: string;
  }): Promise<UserDocument[]>;

  publicFields(): string[];

  signInOrSignUpViaGoogle({
    googleId,
    email,
    displayName,
    avatarUrl,
    googleToken,
  }: {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    googleToken: { accessToken?: string; refreshToken?: string };
  }): Promise<UserDocument>;
}

class UserClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
  }

  public static async updateProfile({ userId, name, avatarUrl }) {
    console.log('Static method: updateProfile');

    const user = await this.findById(userId, 'slug displayName');

    const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };

    console.log(user.slug);

    if (name !== user.displayName) {
      modifier.displayName = name;
      modifier.slug = await generateSlug(this, name);
    }

    return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
      .select('displayName avatarUrl slug')
      .setOptions({ lean: true });
  }

  public static publicFields(): string[] {
    return ['_id', 'id', 'displayName', 'email', 'avatarUrl', 'slug', 'isSignedupViaGoogle'];
  }

  public static async signInOrSignUpViaGoogle({
    googleId,
    email,
    displayName,
    avatarUrl,
    googleToken,
  }) {
    const user = await this.findOne({ email })
      .select([...this.publicFields(), 'googleId'].join(' '))
      .setOptions({ lean: true });

    if (user) {
      if (_.isEmpty(googleToken) && user.googleId) {
        return user;
      }

      const modifier = { googleId };
      if (googleToken.accessToken) {
        modifier['googleToken.accessToken'] = googleToken.accessToken;
      }

      if (googleToken.refreshToken) {
        modifier['googleToken.refreshToken'] = googleToken.refreshToken;
      }

      await this.updateOne({ email }, { $set: modifier });

      return user;
    }

    const slug = await generateSlug(this, displayName);

    const newUser = await this.create({
      createdAt: new Date(),
      googleId,
      email,
      googleToken,
      displayName,
      avatarUrl,
      slug,
      isSignedupViaGoogle: true,
      darkTheme: false,
    });

    return _.pick(newUser, this.publicFields());
  }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);

export default User;
```

___

#### getUserApiMethod API method and /get-user Express route [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#getuserapimethod-api-method-and-get-user-express-route)

It's very handy to have user data available as `req.user` on the `api` server! For a logged-in user, we can access values inside `req.user` inside any of our Express routes!

Later in this book, when we build "Toggle theme API" infrastructure, we can simply access a user's id as `req.user.id` inside the corresponding Express route `/user/toggle-theme`.

```
router.post('/user/toggle-theme', async (req: any, res, next) => {
  try {
    const { darkTheme } = req.body;

    await User.toggleTheme({ userId: req.user.id, darkTheme });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});
```

This will allow us, as software engineers, to save a user's choice for theme to the corresponding `User` MongoDB document. It means theme choice is saved to a persistent store, in our case the database, and theme choice will persist between visits to our web application.

An important fact to keep in mind, though, is that `passport` populates `req.user` on our `api` server, not inside our `app` project's code (browser or server). If we had a one-project architecture, we don't need to populate `req.user` of `app` server. However, our SaaS boilerlplate has two-project architecture. Thus, we need to pass user object from the `api` server to the `app` requesting code. We need to create an API method that will send a request from the `app` to the `api` on every page load. And we need to define a corresponding Express route that sends a response containing the user object.  

Open `book/5-begin/app/lib/api/public.ts` and find existing `getUserApiMethod` API method:

```
export const getUserApiMethod = (request) =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-user`, {
    request,
    method: 'GET',
  });
```

So we already have API method, we defined earlier, in Chapter 3.

Open `book/5-begin/api/server/api/public.ts` and find commented out Express route `/get-user`:

```
// router.get('/get-user', (req, res) => {
//   res.json({ user: { email: 'team@builderbook.org' } });
// });
```

Uncomment the above Express route. Replace line:

```
res.json({ user: { email: 'team@builderbook.org' } });
```

With new line:

```
res.json({ user: req.user || null });
```

As you can see we used `req.user` on our `api` server to send response to the requesting code `app`.

Finally, we need to update the `getInitialProps` method for `YourSettings` page. This is the page where our end user will be redirected after a successful login event with Google OAuth API.

Open `book/5-begin/app/pages/your-settings.tsx` and find:

```
public static async getInitialProps() {
  const slug = 'team-builder-book';

  const user = await getUserBySlugApiMethod(slug);

  console.log(user);

  return { ...user };
}
```

Update it to become:

```
public static async getInitialProps() {
  const user = await getUserApiMethod();

  console.log(user);

  return { ...user };
}
```

Remember to update import statement:

```
import { getUserApiMethod, updateProfileApiMethod } from '../lib/api/public';
```

In the next subsection, we will add missing values for two new environmental variables `GOOGLE_CLIENTID` and `GOOGLE_CLIENTSECRET`.

___

#### Google Cloud Platform [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#google-cloud-platform)

We are one step away from testing Google OAuth API! You need to create `OAuth 2.0 Client ID` application on your Google Cloud Platform (GCP) dashboard. And generate values for `GOOGLE_CLIENTID` and `GOOGLE_CLIENTSECRET`. We need to add `GOOGLE_CLIENTID` and `GOOGLE_CLIENTSECRET` as new environmental variables to `book/5-begin/api/.env`.

From working on AWS S3 API, you know that the AWS S3 server has to recognize our server. Thus we have a unique set of `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` envronmental variables on our `api` server. The `aws-sdk` package uses these AWS environmental variables to generate unique API endpoints, send requests and process responses to/from AWS API servers. Such generated API endpoint has all reuired information for AWS S3 server to recognize our server. Similar to AWS API, our server, with help from the `passport` package, uses `GOOGLE_CLIENTID` and `GOOGLE_CLIENTSECRET` to generate unique API endpoints so that Google OAuth server recognizes our server.

To generate `GOOGLE_CLIENTID` and `GOOGLE_CLIENTSECRET`, the first step is to go to your GCP dashboard. If you are logged-in with your Google account, go to

[https://cloud.google.com/](https://cloud.google.com/)

If you are logged-in, then you will see your Google account's avatar in the top-right corner:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+15-52-16.png)

Click the `Console` link next to your avatar.

You will be redirected to your GCP dashboard. Again, you will see your Google account's avatar.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+15-55-08.png)

If you don't have any GCP projects, you will be offered to create a new project. We already have a few projects in our GCP account. To create a new project, we need to click on the name of the currently selected project. See a bold red arrow on the above screenshot.

This is how the list of projects and `New project` button look:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+15-59-04.png)

After you have a project, click on the `Menu` icon. Then hover your mouse over `APIs & Services` and click on `Credentials` inside the dropdown menu like so:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-03-47.png)

Page component redirect to checkout You already learned open this file store method calls production-ready API method calls corresponding store method end user At AWS dashboard add environmental variable cookie Navigate to in this book MongoDB database cookie. Triggers method in production send this response Put it all together it works as expected request was sent Next.js web application Material-UI API method withAuth HOC. API method open this file page component API method discussion AWS dashboard request We will discuss API method calls corresponding store method triggers method At AWS dashboard. It works as expected on server only Put it all together request was sent S3 bucket triggers method mount middleware open this file. Mount middleware in a browser show notification MongoDB database cookie subsection withAuth HOC open this file redirect to checkout. Request was sent withAuth HOC Team Leader check if value is truthy AWS dashboard store method calls We will discuss check if value is truthy session Material-UI Navigate to production-ready decorate method with action. Put it all together Material-UI conditional operator static method calls email and name static method calls data model if truthy then. Compiles Navigate to if truthy then AWS dashboard triggers method open this file if truthy then server-side rendering data model static method calls triggers method You already learned in production You already learned AWS dashboard. AWS dashboard this chapter new Express route We will discuss it works as expected static method calls open this file it works as expected. Open this file triggers method end user static method calls list of posts request open this file Click on the button subsection At AWS dashboard Material-UI team members in this book AWS dashboard new Express route.

On the loaded screen, click `+ CREATE CREDENTIALS`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-11-32.png)

After you create credentials (`GOOGLE_CLIENTID` and `GOOGLE_CLIENTSECRET`), you will see them on the `OAuth 2.0 Client IDs` list.

Then click on the `OAuth client ID` link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-14-01.png)

Then select the `Web application` option and fill out the form:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-16-13.png)

Give a name to the new credentials. This is a name for you, so remember where you will use these credentials. We will call our credentials `saas-boilerplate-demo`.

Then add two URLs to `Authorized JavaScript origins`:

```
http://localhost:8000
https://saas-api.builderbook.org
```

The second link is for when we deploy our production-ready SaaS boilerplate to AWS and Heroku in Chapter 10.

Add two URLs to `Authorized redirect URIs`:

```
http://localhost:8000/oauth2callback
https://saas-api.builderbook.org/oauth2callback
```

After you fill out the form, click the `Create` button. You will see a modal with newly-created credentials, and you will see your credentials on the list of all credentials:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-23-27.png)

Save the values to your `book/5-begin/api/.env` file:

```
GOOGLE_CLIENTID=xxxxxxxxxxxxxxx
GOOGLE_CLIENTSECRET=xxxxxxxxxx
```

There is one more task we need to complete on the GCP dashboard. Click the `OAuth consent screen` menu item on the left. Follow instructions and fill out the form:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-31-11.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-36-34.png)

After you are done, click `Submit for verification`.

The data that you add to the `OAuth consent screen` will be displayed on the Google page after an end user is redirected from our `Login` page to the Google page hosted by Google:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-31-35.png)

Just remember that `builderbook.org` is a domain where we intend to deploy our SaaS boilerplate. You should input **your own** value for domain and verify it:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+16-39-21.png)

___

#### Testing Google OAuth [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-google-oauth)

We are ready to test our entire Google OAuth API.

Before you attempt to log in to our SaaS boilerplate using Google OAuth API, go to your MongoDB Atlas dashboard. Check the `test.users` collection and confirm that there is only one `User` MongoDB document. This is a `User` MongoDB document that we created manually in Chapter 4:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+17-10-48.png)

Manually remove this `User` MongoDB document to reduce confusion. Also remove all documents from the `test.sessions` collection, so we can clearly see that our `api` server creates a `Session` MongoDB document with `session.passport.user` nested field with user's id as a value.

If Google OAuth API works as expected, our `api` server will create a new `User` MongoDB document in our database. And this `User` MongoDB document should contain `googleId`, `googleToken`, and `isSignedupViaGoogle` parameters.

We need both `app` and `api` projects running, start each project with `yarn dev`. Navigate to `http://localhost:3000/login`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+17-00-58.png)

In addition to deleting the `User` and `Session` MongoDB documents from our `test` database, let's also delete an existing `cookie` on the browser. While on the `Login` page, press `Ctrl + Shift + J` and select `Application > Cookies > http://localhost:3000`. Delete any `cookie` you see on the list of cookies.

Click on the `Log in with Google` button. You will be redirected to Google's page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+17-14-59.png)

Select and click on the Google account that you want to use to log in to our SaaS boilerplate. We chose `team@builderbook.org` Google account:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+17-14-60.png)

After selecting your Google account, you will be redirected back to our application's `YourSettings` page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-12+08-15-57.png)

Hmmm... But the page shows an error:

```
TypeError: Cannot read property 'displayName' of undefined
```

This type of error is most likely cause by `user` being `undefined` or `null`. If `user` is `undefined`, then `user.displayname` is `undefined`.

On your VS code editor, look at the terminal for `app` server:

```
null
TypeError: Cannot read property 'displayName' of undefined
```

Indeed, `user` is `null`.

This `null` is the result of this `console.log` statement from `book/5-begin/app/pages/your-settings.tsx` file :

```
public static async getInitialProps() {
  const user = await getUserApiMethod();

  console.log(user);

  return { ...user };
}
```

Before we debug, we should check up our `test` database at your MongoDB Atlas dashboard:

-   Check up the `test.sessions` collection.
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+17-33-02.png)
    
    There, you indeed can find a `Session` MongoDB document with a `session.passport.user` field with value `5e92614c77ff9f587ee999fc`. This value should be the value of the corresponding `User` MongoDB document.
    
-   Check up the `test.users` collection. There is one new `User` MongoDB document. This `User` MongoDB document has, as expected, an id value of `5e92614c77ff9f587ee999fc`. And, as expected, `User` MongoDB document has `isSignedupViaGoogle`, `googleId`, and `googleToken` fields:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-11+17-33-52.png)
    

This means that our `api` server behaved as it should and created proper `Session` and `User` MongoDB documents in the connected database.

Next, let's check if `cookie` is saved to the browser. Press `Ctrl + Shift + J` and select `Application > Cookies > http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-12+08-24-31.png)

Indeed, the browser's memory has `cookie` with the proper name, `saas-boilerplate.sid`. This is the value we specified for environmental variable `SESSION_NAME`.

Next, let's see if our two Express routes indeed get called. Open `book/5-begin/api/server/google-auth.ts` and add two `console.log` statements like so:

```
server.get('/auth/google', (req, res, next) => {
  const options = {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  };

  passport.authenticate('google', options)(req, res, next);

  console.log('/auth/google');
});

server.get(
  '/oauth2callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
  }),
  (_, res) => {
    console.log('/oauth2callback');
    res.redirect(`${process.env.URL_APP}/your-settings`);
  },
);
```

In general, we recommend adding `console.log` statements whenever you want to check if certain parts of you code indeed executes.

Go to the `Login` page and click the `Login with Google` button again. Then, on VS code editor, look at the output of the terminal for `api` server:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-12+08-35-53.png)

This means that the handler functions of both Express routes indeed ran successfully.

Store method calls Navigate to session Google OAuth API Google OAuth API triggers method API method calls corresponding store method. Compiles show notification You already learned Material-UI store method calls. It works as expected list of posts You already learned API method calls corresponding store method show notification add environmental variable Team Leader. Subsection if truthy then request was sent Next.js web application static method calls on server only this chapter decorate method with action on server only in production We will discuss. Response in production add environmental variable compiles API infrastructure decorate method with action on the client on server only. Page component show notification open this file MongoDB database in a browser withAuth HOC server-side rendering list of posts end user response API method calls corresponding store method. Response API method static method calls static method calls this chapter send this response request was sent this chapter API infrastructure You already learned add environmental variable team members production-ready. Subsection triggers method MongoDB database triggers method check if value is truthy check if value is truthy HTTP in production check if value is truthy on the client list of posts subsection session Google OAuth API it works as expected. Request was sent on the client in a browser new Express route session AWS dashboard new Express route Navigate to. Server-side rendering show notification server-side rendering open this file in a browser Put it all together decorate method with action Navigate to triggers method if truthy then API method this chapter store method calls.

You can also see `undefined` in the output of the `api` server. It comes from `book/5-begin/api/server/api/public.ts`:

```
router.get('/get-user', (req, res) => {
  console.log(req.user);
  res.json({ user: req.user || null });
});
```

It is clear now that `req.user` is `undefined` on the `api`. As a result of it, `user` is `null` on the `app`.

At this point, we should review our Google OAuth API:

![Builder Book](https://user-images.githubusercontent.com/10218864/106919385-f37ff200-66be-11eb-91e8-95ab98068dc6.png)

What part of this infrastructure does not work? We just did some debugging and it looks like everything works as expected. We narrowed the problem `req.user` to have value of `undefined` on our `api` server.

Previously we added the following logic to the definition of the `sendRequestAndGetResponse` method. Open `book/5-begin/app/lib/api/sendRequestAndGetResponse.ts` and find this part:

```
const { request } = opts;

if (request && request.headers && request.headers.cookie) {
  headers.cookie = request.headers.cookie;
}
```

We explained earlier in this chapter that the above ensures that `cookie` is attached for when:

-   `app` on the browser sends API request to the `api` server (client-side rendered pages that fetch dynamic data with API method)
-   `app` on the server sends API request to the `api` server (server-side rendered pages that fetch dynamic data with API method)

Open `book/5-begin/app/pages/your-settings.tsx` and look at this code inside `YourSettings.getInitialProps` method:

```
public static async getInitialProps() {
  const user = await getUserApiMethod();

  console.log(user);

  return { ...user };
}
```

We are calling `getUserApiMethod` **without** passing request as an argument. What does it mean? Let's say `YourSettings` page is loaded into new browser tab and it is server-side rendered. It means when end user requests page `YourSettings`, request with `cookie` gets sent from the browser to the `app` server. `getUserApiMethod` API method fires on the `app` server to send request from the `app` server to the `api` server. However, this second request does **not** contain `cookie` because `getUserApiMethod` method gets called with no argument and the following logic runs only when one of arguments is `request`:

```
const { request } = opts;

if (request && request.headers && request.headers.cookie) {
  headers.cookie = request.headers.cookie;
}
```

So how do we make sure that second request contains `cookie`? As you already know we can access context `ctx` and incoming request `ctx.req` inside any `getInitialProps` method. Let's simply `ctx.req` as argument to `getUserApiMethod` API method:

```
public static async getInitialProps(ctx) {
  const user = await getUserApiMethod(ctx.req);

  console.log(user);

  return { ...user };
}
```

By passing request from page to API method, in case of server-side rendered page, we essentially used the `app` server as a proxy ([https://developer.mozilla.org/en-US/docs/Glossary/Proxy\_server](https://developer.mozilla.org/en-US/docs/Glossary/Proxy_server)) between the browser (that requested page) and the `api` server (that got data from our database and rendered page).

This should fix it. Let's test again. Make sure both `app` and `api` are running. Navigate to `http://localhost:3000/login`. Click the `Log in with Google` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-12+09-00-47.png)

You are redirected to `YourSettings` page that has actual user data!

Check your terminals for both `app` and `api`. After our fix, instead of showing `null` and `undefined`, both terminals print a proper user object:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-12+09-01-51.png)

You are officially authenticated by your own web application!

Remember to update the Express route `/user/update-profile`. Previously, we hardcoded the value for `userId`. Open `book/5-begin/api/server/api/public.ts` and find the Express route:

```
router.post('/user/update-profile', async (req: any, res, next) => {
  console.log('Express route: /user/update-profile');

  try {
    const { name, avatarUrl } = req.body;

    const userId = '5e6427a51c9d440000c9ba6f';

    const updatedUser = await User.updateProfile({
      userId: userId,
      name,
      avatarUrl,
    });

    res.json({ updatedUser });
  } catch (err) {
    next(err);
  }
});
```

Remove this line:

```
const userId = '5e6427a51c9d440000c9ba6f';
```

Update this line:

```
userId: userId,
```

To become:

```
userId: req.user.id,
```

Earlier, before we added the above fix, `req.user` was `undefined`. However now, `req.user.id` is the user id of a currently logged-in user.

In the next and final section of this chapter, we will set up proper permissions and redirects. We want the `Login` page to be available only to logged-out users, and we want the `YourSettings` page to be available only to logged-in users. To do so, we will create a new higher-order component, `withAuth`, and wrap pages in our web application with it.

___

## Authentication HOC withAuth [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#authentication-hoc-withauth)

We successfully added a relatively large API infrastructure to our SaaS boilerplate - Google OAuth API. We tested every part of this new API, and it works as expected.

However, there are stil some UX problem in our user authentication. Currently, any end user, logged-in or logged-out, can access both, `Login` and `YourSettings` pages. In typical web application with user authentication, we want:

-   Only logged-in users to have access to the `YourSettings` page.
-   Only logged-out users to have access to the `Login` page.

In addition to the above UX (and techincally, security) problem, we have to add `getUserApiMethod(ctx.req)` call explicitly. In every page that requires the `user` prop, we have to call `getUserApiMethod` inside page's `getInitialProps` - like we did in the `YourSettings` page inside `book/5-begin/app/pages/your-settings.tsx` file. In addition to explicit call `getUserApiMethod(ctx.req)`, each page has to have some code that redirects an end user accordingly, depending on user's authentication state (logged-in or logged-out).

Any time when you are faced with writing repetitive code throughout your web application, you should consider creating a new utility function. Then simply import and use this utility function throughout your project. We did so with `notify` and `confirm` utility methods. Check up following files:

-   `book/5-begin/app/lib/notify.ts`
-   `book/5-begin/app/lib/confirm.ts`

We added corresponding `Notifier` and `Confirmer` components to `Layout` component. We could add `getUserApiMethod(ctx.req)` call and redirecting logic into every page, or we can add it to `Layout` or to `MyApp` extension of `App` HOC.

For readibility and maintainability reason, we will place `getUserApiMethod(ctx.req)` call and redirecting logic into new HOC that is dedicated to user authentication. Once this new HOC is defined, let's call it `withAuth`, we can import it and wrap any page with it.

At this point in the book, you are not new to the concept of a HOC. We have already discussed and defined three HOCs:

-   We defined `MyDocument` that extends `Document` at `book/5-begin/app/pages/_document.tsx`. This HOC runs on the server only. We have shared styles, fonts, and meta data in this HOC. Next.js automatically wraps all pages with the `Document` HOC.
-   `MyApp` that extends `App` at `book/5-begin/app/pages/_app.tsx`. This HOC runs on both, the server and the browser. We use it to integrate `app` project with Material-UI and to populate pages' props, such as `isMobile` and `firstItemGrid`. Next.js automatically wraps all pages with the `App` HOC.
-   `Layout` at `book/5-begin/app/components/layout/index.tsx`. Though not technically HOC, because it is not function, `Layout`, if added to a page, adds some common UI to it.

Our task right now is to create a `withAuth` HOC, which will perform two important functions:

-   Populate the `user` prop with value for pages that are wrapped with `withAuth`. We have to import the `withAuth` HOC to every page and wrap the page component with it.
-   Redirect an end user depending on the user's authentication state. For example, a logged-out user should be redirected from the `YourSettings` page to the `Login` page.

Structure-wise, the `withAuth` HOC will be similar to the `App` HOC. Open `book/5-begin/app/pages/_app.tsx`. Let's look at the code structure with this level of abstraction:

```
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import App from 'next/app';
import React from 'react';
import { isMobile } from '../lib/isMobile';
import { themeDark, themeLight } from '../lib/theme';

class MyApp extends App<{ isMobile: boolean }> {
  public static async getInitialProps({ Component, ctx }) {
    // some code here that defines page component's props
    return { pageProps };
  }

  public componentDidMount() {
    // some code needed for proper integration with Material-UI
  }

  public render() {
    const { Component, pageProps } = this.props;

    return (
      // wrapping page component with other HOC for proper integrations
    );
  }
}

export default MyApp;
```

Structurally, `withAuth` will be even simpler since we don't need to define `componentDidMount`:

```
import Router from 'next/router';
import React from 'react';

import * as NProgress from 'nprogress';

import { getUserApiMethod } from '../lib/api/public';

// Router events and Nprogress

type Props = {
  user: { email: string; displayName: string; slug: string; avatarUrl: string };
};

export default function withAuth(Component, { loginRequired = true, logoutRequired = false } = {}) {
  class WithAuth extends React.Component<Props> {
    public static async getInitialProps(ctx) {
      // call getUserApiMethod 
      // populate user prop and other pageComponentProps
      // define redirect logic
    }

    public render() {
      // return page component Component or null
    }
  }

  return WithAuth;
}
```

Notice that we import and use `Router` from Next.js. We already used `Router.push` for browser-side navigation inside the `MenuWithLinks` component. Open `book/5-begin/app/components/common/MenuWithLinks.tsx` and find this line:

```
Router.push(option.href, option.as || option.href);
```

Material-UI list of posts check if value is truthy triggers method You already learned redirect to checkout AWS dashboard Team Leader withAuth HOC Next.js web application page component. HTTP static method calls mount middleware conditional operator request discussion server-side rendering triggers method in production withAuth HOC response Click on the button Click on the button. Discussion AWS dashboard Material-UI Material-UI check if value is truthy S3 bucket. Page component cookie decorate method with action S3 bucket withAuth HOC. On the client on the client Navigate to page component You already learned MongoDB database. S3 bucket show notification add environmental variable API infrastructure We will discuss open this file You already learned withAuth HOC. WithAuth HOC request data model request decorate method with action in this book conditional operator AWS dashboard Google OAuth API MongoDB database in a browser on the client Material-UI API method calls corresponding store method. Compiles this chapter Click on the button this chapter it works as expected Navigate to withAuth HOC Google OAuth API redirect to checkout Material-UI We will discuss You already learned We will discuss. This chapter show notification page component Next.js web application Team Leader Navigate to production-ready At AWS dashboard page component AWS dashboard cookie Put it all together AWS dashboard send this response mount middleware. Page component open this file conditional operator Click on the button in production Material-UI conditional operator if truthy then discussion request was sent.

We used the `Router.push` method to navigate an end user to a new route on the browser. We will use `Router.push` inside the `withAuth` HOC as well. In addition to using `Router.push`, we want to start and complete an `Nprogress` loading bar inside `Router.events`. You already used `Nprogress` bar inside the `Index` page at `book/5-begin/app/pages/index.tsx`. Our goal for `withAuth` HOC is to start the loading bar when the route begins changing and complete the loading bar when the route completes its change:

```
Router.events.on('routeChangeStart', () => {
  NProgress.start();
});

Router.events.on('routeChangeComplete', () => {
  NProgress.done();
});

Router.events.on('routeChangeError', () => NProgress.done());
```

We also complete the loading bar if there is an error during the route change.

You can read about the above and other `Router` events in the Next.js docs:

[https://nextjs.org/docs/api-reference/next/router#routerevents](https://nextjs.org/docs/api-reference/next/router#routerevents)

___

#### getUserApiMethod in withAuth [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#getuserapimethod-in-withauth)

Let's start defining the `getInitialProps` method for `WithAuth` component inside `withAuth` HOC function. Any HOC for pages, by definition, should take page component and return modified page component, we called it `WithAuth`. You pretty much know all of the code.At this point in the book, you have all necessary knowledge to put `withAuth` definition together.

On one hand, you already know how the `App` HOC properly populates a page component's props `isMobile` and `firstGridItem` because of the following code:

```
public static async getInitialProps({ Component, ctx }) {
  const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem: true };

  if (Component.getInitialProps) {
    Object.assign(pageProps, await Component.getInitialProps(ctx));
  }

  // console.log(pageProps);

  return { pageProps };
}
```

On the other hand, you already know how to populate the `user` prop inside `YourSettings` page:

```
public static async getInitialProps(ctx) {
  const user = await getUserApiMethod(ctx.req);

  console.log(user);

  return { ...user };
}
```

Applying what you already know, we get this code for the `getInitialProps` method of `WithAuth` component inside `withAuth` HOC:

```
public static async getInitialProps(ctx) {
  const { req, res } = ctx;

  let pageComponentProps = {};

  if (Component.getInitialProps) {
    pageComponentProps = await Component.getInitialProps(ctx);
  }

  const { user } = await getUserApiMethod(req);

  console.log(user);

  // redirect logic

  return {
    ...pageComponentProps,
    user,
  };
}
```

Note that when we called `getUserApiMethod` inside the page component's `getInitialProps`, the result was:

```
{
  isSignedupViaGoogle: true,
  _id: '5e92614c77ff9f587ee999fc',
  email: 'team@builderbook.org',
  displayName: 'Team Builder Book',
  avatarUrl: 'https://lh3.googleusercontent.com/a-/AOh14GhcCp335eNZSjtQ9G5tczHgZ3oT5lQlKJL08XFldg',
  slug: 'team-builder-book'
}
```

Now we call `getUserApiMethod` inside `withAuth`, and the result is:

```
{
  user: {
    isSignedupViaGoogle: true,
    _id: '5e92614c77ff9f587ee999fc',
    email: 'team@builderbook.org',
    displayName: 'Team Builder Book',
    avatarUrl: 'https://lh3.googleusercontent.com/a-/AOh14GhcCp335eNZSjtQ9G5tczHgZ3oT5lQlKJL08XFldg',
    slug: 'team-builder-book'
  }
}
```

Thus we should change code from:

```
const user = await getUserApiMethod(req);
```

To:

```
const { user } = await getUserApiMethod(req);
```

Next step is define redirect logic.

___

#### Redirect logic in withAuth [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#redirect-logic-in-withauth)

From the above unfinished definition of `withAuth` HOC you might have noticed that we also passed two arguments to the `withAuth` function: `loginRequired` and `logoutRequired`.

```
withAuth(Component, { loginRequired = true, logoutRequired = false } = {})
```

These parameters have default values: `loginRequired = true` and `logoutRequired = false`. When a HOC has arguments with default values, you don't need to pass those values explicitly when wrapping pages with that HOC. Unless you want to override these default values.

For example, later in this section, when we wrap `YourSettings` page with `withAuth`, we can write:

```
export default withAuth(YourSettings, { loginRequired: true });
```

But since `loginRequired: true` is by default, then we can simplify by not specifying it explicitly:

```
export default withAuth(YourSettings);
```

You might have already guessed how these two parameters and their boolean values work.

For `YourSettings` page:

-   `loginRequired = true` and `logoutRequired = false` (default values)

For `Login` page:

-   `loginRequired = false` and `logoutRequired = true` (not default values)

Let's say a logged-out end user tries to access the `YourSettings` page. Our web application needs to redirect such user to the `Login` page:

```
if (loginRequired && !logoutRequired && !user) {
  if (res) {
    res.redirect('/login');
  } else {
    Router.push('/login');
  }
  return;
}
```

`if...else` syntax is not new to us. We discussed it in Chapter 4 when covering the server-side `signRequestForUpload` method.

As you can see, "logged-out" means `!user` is truthy in our code. You may remember that `user` is `null` if the end user is logged-out. Check up `book/5-begin/api/server/api/public.ts`:

```
router.get('/get-user', (req, res) => {
  console.log(req.user);
  res.json({ user: req.user || null });
});
```

If a page is server-side rendered (say, an end user attempts to load the `YourSettings` page in a new tab on the browser), then we call:

```
res.redirect('/login');
```

If a page is client-side rendered (say, an end user is on the `Index` page and clicks the `Link` that leads to the `YourSettings` page), then we redirect with:

```
Router.push('/login');
```

We used `res.redirect`. The reason we were able to use `res.redirect` is because `res` is Express's response object based inside this Express route we defined in `book/5-begin/app/server/server.ts` in Chapter 3:

```
server.all('*', (req, res) => {
  handle(req, res);
});
```

To remind you, the above Express route is defined **after** all API-related Express routes. In other words, if request did not match endpoint for any API-related Express routes, then we pass this request to the Next.js server and let Next.js server handle it.

More on the properties of `res.redirect`:

[https://expressjs.com/en/4x/api.html#res.redirect](https://expressjs.com/en/4x/api.html#res.redirect)

What happens if a logged-in user tries to load the `Login` page? Our web application should redirect this user to the `YourSettings` page:

```
let redirectUrl = '/login';
let asUrl = '/login';

if (user) {
  redirectUrl = `/your-settings`;
  asUrl = `/your-settings`;
}

if (logoutRequired && user) {
  if (res) {
    res.redirect(`${redirectUrl}`);
  } else {
    Router.push(redirectUrl, asUrl);
  }
}
```

"Logged-in" means `user` is not `null` in our case.

Put above two code blocks together:

```
if (loginRequired && !logoutRequired && !user) {
  if (res) {
    res.redirect('/login');
  } else {
    Router.push('/login');
  }
  return;
}

let redirectUrl = '/login';
let asUrl = '/login';

if (user) {
  redirectUrl = `/your-settings`;
  asUrl = `/your-settings`;
}

if (logoutRequired && user) {
  if (res) {
    res.redirect(`${redirectUrl}`);
  } else {
    Router.push(redirectUrl, asUrl);
  }
}
```

Put all parts of this `WithAuth.getInitialProps` method together:

```
public static async getInitialProps(ctx) {
  const { req, res } = ctx;

  let pageComponentProps = {};

  if (Component.getInitialProps) {
    pageComponentProps = await Component.getInitialProps(ctx);
  }

  const { user } = await getUserApiMethod(req);

  console.log(user);

  if (loginRequired && !logoutRequired && !user) {
    if (res) {
      res.redirect('/login');
    } else {
      Router.push('/login');
    }
    return;
  }

  let redirectUrl = '/login';
  let asUrl = '/login';

  if (user) {
    redirectUrl = `/your-settings`;
    asUrl = `/your-settings`;
  }

  if (logoutRequired && user) {
    if (res) {
      res.redirect(`${redirectUrl}`);
    } else {
      Router.push(redirectUrl, asUrl);
    }
  }

  return {
    ...pageComponentProps,
    user,
  };
}
```

Next step is define render logic.

___

#### Render logic in withAuth HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#render-logic-in-withauth-hoc)

Render logic is straightforward to understand and define. Our web application should return `null` instead of a page component when a logged-out end user attempts to load, say, the `YourSettings` page:

```
if (loginRequired && !logoutRequired && !user) {
  return null;
}
```

Our web application should return `null` instead of a page component when a logged-in end user attempts to load the `Login` page when `logoutRequired` has value of `true` and `user` is truthy as well at the same time:

```
if (logoutRequired && user) {
  return null;
}
```

All together, the `render` method for `withAuth` becomes:

```
public render() {
  const { user } = this.props;

  if (loginRequired && !logoutRequired && !user) {
    return null;
  }

  if (logoutRequired && user) {
    return null;
  }

  return <BaseComponent {...this.props} />;
}
```

Let's finally test out new `withAuth` HOC in the next subsection.

___

#### Testing withAuth HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-withauth-hoc)

We are ready to test out `withAuth` HOC.

-   Create a new file `book/5-begin/app/lib/withAuth.tsx` and place the following code into it:
    
    ```
      import Router from 'next/router';
      import React from 'react';
    
      import * as NProgress from 'nprogress';
    
      import { getUserApiMethod } from '../lib/api/public';
    
      Router.events.on('routeChangeStart', () => {
        NProgress.start();
      });
    
      Router.events.on('routeChangeComplete', () => {
        NProgress.done();
      });
    
      Router.events.on('routeChangeError', () => NProgress.done());
    
      type Props = {
        user: { email: string; displayName: string; slug: string; avatarUrl: string };
      };
    
      export default function withAuth(Component, { loginRequired = true, logoutRequired = false } = {}) {
        class WithAuth extends React.Component<Props> {
          public static async getInitialProps(ctx) {
            const { req, res } = ctx;
    
            let pageComponentProps = {};
    
            if (Component.getInitialProps) {
              pageComponentProps = await Component.getInitialProps(ctx);
            }
    
            const { user } = await getUserApiMethod(req);
    
            console.log(user);
    
            if (loginRequired && !logoutRequired && !user) {
              if (res) {
                res.redirect('/login');
              } else {
                Router.push('/login');
              }
              return;
            }
    
            let redirectUrl = '/login';
            let asUrl = '/login';
    
            if (user) {
              redirectUrl = `/your-settings`;
              asUrl = `/your-settings`;
            }
    
            if (logoutRequired && user) {
              if (res) {
                res.redirect(`${redirectUrl}`);
              } else {
                Router.push(redirectUrl, asUrl);
              }
            }
    
            return {
              ...pageComponentProps,
              user,
            };
          }
    
          public render() {
            const { user } = this.props;
    
            if (loginRequired && !logoutRequired && !user) {
              return null;
            }
    
            if (logoutRequired && user) {
              return null;
            }
    
            return <Component {...this.props} />;
          }
        }
    
        return WithAuth;
      }
    ```
    
-   Open `book/5-begin/app/pages/your-settings.tsx` and comment out the `getInitialProps` method for the `YourSettings` page component. Import and wrap `YourSettings` with `withAuth`. Remove `getUserApiMethod` from the import code. Your code will become:
    
    ```
      import Avatar from '@material-ui/core/Avatar';
      import Button from '@material-ui/core/Button';
      import TextField from '@material-ui/core/TextField';
      import Head from 'next/head';
      import NProgress from 'nprogress';
      import * as React from 'react';
    
      import Layout from '../components/layout';
    
      import { updateProfileApiMethod } from '../lib/api/public';
      import {
        getSignedRequestForUploadApiMethod,
        uploadFileUsingSignedPutRequestApiMethod,
      } from '../lib/api/team-member';
    
      import { resizeImage } from '../lib/resizeImage';
    
      import notify from '../lib/notify';
    
      import withAuth from '../lib/withAuth';
    
      type Props = {
        isMobile: boolean;
        user: { email: string; displayName: string; slug: string; avatarUrl: string };
      };
    
      type State = { newName: string; newAvatarUrl: string; disabled: boolean };
    
      class YourSettings extends React.Component<Props, State> {
        // public static async getInitialProps(ctx) {
        //   const user = await getUserApiMethod(ctx.req);
    
        //   console.log(user);
    
        //   return { ...user };
        // }
    
        // public static async getInitialProps() {
        //   const slug = 'team-builder-book';
    
        //   const user = await getUserBySlugApiMethod(slug);
    
        //   console.log(user);
    
        //   return { ...user };
        // }
    
        constructor(props) {
          super(props);
    
          this.state = {
            newName: this.props.user.displayName,
            newAvatarUrl: this.props.user.avatarUrl,
            disabled: false,
          };
        }
    
        public render() {
          const { user } = this.props;
          const { newName, newAvatarUrl } = this.state;
    
          return (
            // some code
          );
        }
    
        private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
          // some code
        };
    
        private uploadFile = async () => {
          // some code
        };
      }
    
      export default withAuth(YourSettings);
    ```
    
-   Open `book/5-begin/app/pages/login.tsx`. Import `withAuth` and wrap the `Login` page component with it:
    
    ```
      import Head from 'next/head';
      import React from 'react';
      import LoginButton from '../components/common/LoginButton';
      import Layout from '../components/layout';
      import withAuth from '../lib/withAuth';
    
      class Login extends React.Component {
        public render() {
          return (
            // some code
          );
        }
      }
    
      export default withAuth(Login, { logoutRequired: true });
    ```
    
-   Open `book/5-begin/app/components/layout/index.tsx` and `book/5-begin/app/components/common/MenuWithLinks.tsx`. Note how `MenuWithLinks` works. When an end user clicks the `Log out` link inside the dropdown menu of `MenuWithLinks`, our web application calls `Router.push('/logout')`. But we haven't implemented an Express route for the `/logout` API endpoint. Let's do it now. Open `book/5-begin/api/server/google-auth.ts` file. Add a new Express route `/logout`:
    
    ```
      server.get('/logout', (req, res, next) => {
        req.logout((err) => {
          if (err) {
            next(err);
          }
          res.redirect(`${process.env.URL_APP}/login`);
        });
      });
    ```
    
    When you use the `passport` package, you call `req.logout` to log out an end user (to clear `req.user`, making it `undefined` on the server):
    
    [http://www.passportjs.org/docs/logout/](http://www.passportjs.org/docs/logout/)
    
    Add the Express route `/logout` **under** the Express route `/oauth2callback`.
    
    Open `book/5-begin/app/components/layout/index.tsx` and find:
    
    ```
      {
        text: 'Log out',
        href: '/logout',
      },
    ```
    
    Replace it with:
    
    ```
      {
        text: 'Log out',
        href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
        as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
        externalServer: true,
      },
    ```
    
    Open `book/5-begin/app/components/common/MenuWithLinks.tsx` and find:
    
    ```
      <MenuItem
        onClick={() => {
          Router.push(option.href, option.as || option.href);
          this.handleClose();
        }}
        key={option.href}
        style={{
          fontWeight: router.asPath.includes(option.highlighterSlug) ? 600 : 300,
          fontSize: '14px',
        }}
      >
    ```
    
    Add logic that uses `externalServer` prop:
    
    ```
      <MenuItem
        onClick={() => {
          if (option.externalServer) {
            window.location.href = option.href;
          } else {
            Router.push(option.href, option.as || option.href);
          }
          this.handleClose();
        }}
        key={option.href}
        style={{
          fontWeight: router.asPath.includes(option.highlighterSlug) ? 600 : 300,
          fontSize: '14px',
        }}
      >
    ```
    
    Please remember to define data type (`boolean`) for `externalServer` inside `type Props`.
    
    If we don't have the `externalServer` parameter, then when an end user clicks the `Log out` link inside `MenuWithLinks`, he will be redirected to `http://localhost:3000/logout`. There is no such page or endpoint inside the `app` project. Instead, there is `http://localhost:8000/logout` endpoint and corresponding Express route. Thus we added `externalServer` parameter.
    

We are ready to test.

Start both `app` and `api` with `yarn dev`.

Navigate to the `YourSettings` page (`http://localhost:3000/your-settings`). Since you have `cookie` saved into your browser from the previous section of this chapter, you should see that the `YourSettings` page has data from your Google account:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-05-55.png)

You are currently logged-in (`user` inside `withAuth` is not `null`).

Paste `http://localhost:3000/login` into na ew tab on your browser and attempt to load the `Login` page. You will be immediately redirected back to `YourSettings`. That means one of our redirects works as expected! Good job to us.

Next, click the `Log out` link to become logged-out (`user` in `withAuth` is `null`):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-11-43.png)

You will be logged-out and redirected to `http://localhost:3000/login`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-18-18.png)

While you are logged-out, try accessing `http://localhost:3000/your-settings`. You will be immediately redirected back to the `Login` page. That means all of our redirects work as we designed them!

Good job to us again.

A bonus task. After you click the `Log out` link in the `MenuWithLinks`, look at the outputs of your `app` and `api` terminals (server logs):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-20-30.png)

Instead of printing the `user` object, the `app` terminal prints `null` and the `api` terminal prints `undefined`, as expected.

___

## firstGridItem logic in App HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#firstgriditem-logic-in-app-hoc)

You probably noticed that our `Login` page has two `Grid` items and looks confusing to potential end users:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-18-18.png)

There is no reason for our `Login` page to have two `Grid` items, it should have one. Let's fix this by making sure our `Login` page always renders with one `Grid` item instead of two.

Compiles MongoDB database Click on the button Material-UI production-ready cookie. WithAuth HOC list of posts mount middleware if truthy then end user Put it all together AWS dashboard team members subsection S3 bucket. Email and name You already learned list of posts We will discuss Material-UI session S3 bucket MongoDB database team members Click on the button. Send this response in a browser API infrastructure Material-UI on the client store method calls list of posts We will discuss Next.js web application HTTP session redirect to checkout Click on the button. It works as expected check if value is truthy Team Leader server-side rendering show notification. List of posts new Express route list of posts Put it all together request Click on the button production-ready Remember to add import compiles page component triggers method data model Material-UI email and name in a browser. We will discuss show notification discussion S3 bucket it works as expected open this file show notification on the client static method calls data model mount middleware decorate method with action. Navigate to API infrastructure if truthy then cookie We will discuss production-ready send this response MongoDB database response AWS dashboard add environmental variable. Navigate to send this response send this response Click on the button Remember to add import API method data model in production. Production-ready Next.js web application conditional operator end user show notification in this book.

We actually already have code that does this, depending on the value of the boolean value of `firstGridItem` prop. This prop's value gets set inside `MyApp` component and gets passed to all pages of our Next.js web application. Open `book/5-begin/app/components/layout/index.tsx` and find this code:

```
{firstGridItem ? (
  <Grid
    item
    sm={2}
    xs={12}
    style={{
      borderRight: '1px #707070 solid',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
```

Next, open `book/5-begin/app/pages/_app.tsx`, which has code for the `MyApp` component that extends `App` HOC. Find this snippet:

```
public static async getInitialProps({ Component, ctx }) {
  const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem: true };

  if (Component.getInitialProps) {
    Object.assign(pageProps, await Component.getInitialProps(ctx));
  }

  // console.log(pageProps);

  return { pageProps };
}
```

This means that our `App` HOC populates the `Login` page component's props with `firstGridItem: true`. Then, `firstGridItem` prop get passed from the `Login` page component to the `Layout` component, with this code from `book/5-begin/app/pages/login.tsx`:

```
<Layout {...this.props}>
```

We have to introduce additional logic to make `firstGridItem: false` for the `Login` page and `firstGridItem: true` for all other pages. This logic has should be located inside `MyApp`. We can do this by reading the current `pathname` (route without root domain) from the context `ctx`. We can access `pathname` as `ctx.pathname`:

[https://nextjs.org/docs/api-reference/data-fetching/getInitialProps#context-object](https://nextjs.org/docs/api-reference/data-fetching/getInitialProps#context-object)

Then, since `pathname` is a `string`, with the help of `String.prototype.includes`:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/String/includes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes)

We can add such logic:

```
public static async getInitialProps({ Component, ctx }) {
  let firstGridItem = true;

  if (ctx.pathname.includes('/login')) {
    firstGridItem = false;
  }

  const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem };

  if (Component.getInitialProps) {
    Object.assign(pageProps, await Component.getInitialProps(ctx));
  }

  return { pageProps };
}
```

Remember to add the above code to `book/5-begin/app/pages/_app.tsx`.

Go to browser and load/reload the `Login` page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-39-29.png)

Looks much better with one column instead of two.

One more improvement. Currently, our `Login` page only occupies 10 out of 12 grid spaces in the entire view. But there is no reason why it should occupy only 10 out of 12 columns. To fix it, open `book/5-begin/app/components/layout/index.tsx` file and find:

```
<Grid item sm={10} xs={12}>
  {isMobile ? <hr /> : null}
  {children}
</Grid>
```

Replace it with:

```
<Grid item sm={firstGridItem ? 10 : 12} xs={12}>
  {isMobile ? <hr /> : null}
  {children}
</Grid>
```

Go to the `Login` page on the browser again:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-5/Screenshot+from+2020-04-14+09-39-49.png)

After this fix, the `Login` page occupies 12 out of 12 grid spaces in the entire view.

___

Google OAuth API is the largest API infrastructure we have built so far in this book. Good job if you finished this chapter and successfully added our first user authentication method! In the next chapter, we will work on our second user authentication method, Passwordless API.

This is the end of Chapter 5.

If you followed steps described in this chapter closely, your codebase should match the codebase located at `book/5-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___