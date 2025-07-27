In Chapter 3, you will start with the codebase in the [3-begin folder](https://github.com/async-labs/saas/tree/master/book/3-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [3-end folder](https://github.com/async-labs/saas/tree/master/book/3-end).

We will cover the following topics in this chapter:

-   HTTP  
    
-   APP server  
    
    -   Step 1: Fetch method
    -   Step 2: API method at Index page
    -   Step 3: Next-Express server. Express route.
-   Asynchronous execution, callback, Promise, async/await  
    
-   API server  
    
    -   New project API
    -   Updating APP

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

In Chapter 2, we successfully integrated our Next.js web application with Material-UI and made many layout-related improvements. We discussed in detail two types of rendering in a Next.js web application: server-side and client-side. We set and ran many tests to understand differences between server-side and client-side rendered pages. However, in those tests, our pages did not contain data fetched from the server. We had static HTML code, but we never had an API method that sent a request to the server to CRUD (create, read, update, delete) data.

The simplest example of data retrieval can be described like this: An end user loads a page of our web application. That page contains some static HTML and CSS code that shows layout and styles. On this page, our goal is to show the user some data in addition to the static code. The data could be the user's picture or email, so the user knows that he/she is properly authenticated on this page. To implement such a scenario, we have to:

-   Create an API method that sends a request from the user's browser to our server
-   In return, our server sends a request to our database
-   Once our server receives data from our database, it sends a response with the attached data to the user's browser

The above is just a simple example of data retrieval that may happen for a client-side rendered page. Once you finish this book, your final web application will have dozens of API methods to not only read data but also do other data transformations.

In this chapter, we will only focus on reading the user's email from our application's server. The main focus is on two-project architecture. Normally, with one-project architecture, we have browser-side and server-side code inside the same project. With two-project architecture (`app` and `api`), we will have `app` that primarily has pages' code. This code can run on both browser and server, depending on the type of rendering (client-side or server-side rendering). `app` is either on the browser or the server, and `app` calls API methods that send requests to the `api` server. Code at the `api` project is server-only. The `api` server sends a request to MongoDB's server to CRUD data from our database, then sends a response to `app`, which is either on browser or server depending on the type of rendering.

Here is a typical internal API infrastructure and request-response cycles in our SaaS boilerplate:

![Builder Book](https://user-images.githubusercontent.com/10218864/105227082-b12eb080-5b15-11eb-8823-80bdd4cea035.png)

We will discuss later the difference between internal and external API infrastructure (or API for short).

In the section below, we will learn about the concepts of HTTP request and HTTP response.

___

## HTTP, request, response [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#http-request-response)

Before we can discuss fetching data in our web application, we need to get familiar with the basic concepts of HTTP, request, and response.

Simply put - HTTP (HyperText Transfer Protocol) is a set of rules (`protocol`) that governs data exchange on the web. These rules specify how a `client` (typically a web browser, called client because it is served data by a server) and `server` (typically a web server, a machine that sends data to a client) exchange messages. These messages are `request` (sent by the client to the server) and `response` (sent by the server to the client in response to a request). The data can be an HTML document, image, JSON or practically any other type of data.

HTTP is currently the most popular protocol on the web. You've probably noticed prepended `http` or `https` on web addresses:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)

Why is it important for us to understand HTTP? Because when building any data exchange for our web application, we will be thinking about it in terms of a `request` sent from the browser to the server and a `response` sent from the server to the browser. We will use so-called API methods to send requests from the browser to the server, and we will use so-called Express routes on the server to get data and respond back to the browser.

In this chapter, our goal is to set up infrastructure to display a user's email address on the `Index` page. We want to write code in the following way: When a user loads the `Index` page, the user's browser (the `client`) sends a `request` to the `server`. The server will process the `request` and send back a `response` that will have a `body` parameter that contains an email address.

Both `request` and `response` are HTTP messages:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages)

`request` is an HTTP message that is sent from the browser to the server:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http\_requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_requests)

`response` is also an HTTP message, but it is sent from the server to the browser (the client):

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http\_responses](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_responses)

___

The `request` has multiple properties. In JavaScript, an object that corresponds to a `request` can contain these properties among other: `version of protocol`, `path`, `method`, `credentials`, and `headers` (`Content-Type` and `Cookie` headers).

[https://developer.mozilla.org/en-US/docs/Web/API/Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)

![Builder Book](https://user-images.githubusercontent.com/10218864/34074923-1f2d2c84-e26e-11e7-9626-8dd172c13742.png)

The properties we will specify are listed below.

`version of protocol` is the version of the HTTP protocol - either HTTP/1.1 or HTTP/2.0. The latter is designed to have lower latency for the end user. Read more about it [here](https://http2.github.io/).

`url` or `path` property. `path` is a relative route of the resource. Relative means that it does not include the protocol name (https://), main domain (say, builderbook.org), or port (443). In the example above, the `path` is `/_next/cb2af84e5f28446e3dd58f1d53357d95/server.js`:

[https://developer.mozilla.org/en-US/docs/Web/API/Request/url](https://developer.mozilla.org/en-US/docs/Web/API/Request/url)

`method` property. An HTTP `method` is an operation that the browser wants to perform. Most often, the browser gets data (say, a list of books) with the `GET` method or posts data (e.g creates a new book using the form's data) with the `POST` method. Other methods are available for more rare operations:

[https://developer.mozilla.org/en-US/docs/Web/API/Request/method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method)

`credentials` property controls whether the client (the browser) attaches `cookie` (`Cookie` header with value) to `request`. The server can use `cookie` to identify a unique `session` and user. For example, `cookie` can be used to create acpersistent session for a logged-in user. Check up possible values for the `credentials` property:

[https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)

`headers` provide more descriptions to the server. Among the many properties on the screenshot above, you'll notice `dnt: 1`. This parameter tells the server `do not track`.

On `Do Not Track` header:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/DNT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/DNT)

On `Content-Type` header:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)

On `Cookie` header:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie)

`request` has an optional `body` property (not all requests and responses have one):

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#body](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#body)

`req.body` contains data and is typically used by a `request` with the method `POST` to send data from the client to the server. For example, when an end user creates a new Post or Discussion in our web application. For a `request` with the method `GET`, we don't specify `body` to send data. Typically, we will use `req.query` to send string-type data - for example, slug.

___

A `response` contains `version of protocol`, `status code`, `status message`, and optional `headers` or `body`.

[https://developer.mozilla.org/en-US/docs/Web/API/Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

![Builder Book](https://user-images.githubusercontent.com/10218864/34074915-060841b2-e26e-11e7-9a13-ff9bccfda070.png)

We already covered `version protocol`, `headers`, and `body` when discussing `request`.

`status code` indicates whether a request succeeded or failed. `status message` is typically a one-word description that accompanies a `status code`.

Take a look at our screenshot of a typical response. The response status `200 OK` says that our request succeeded. Success means that the response's body contains the data that we requested with the GET `method` and `path`.

If our `request` used the POST method instead, then `200 OK` would mean that data inside the `request`'s body was successfuly sent and received by the server.

A full list of status codes is here:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

In Chapter 4, when we add `cors` configuration to our server (`api` project), our server will add `Access-Control-Allow-Origin` header to the server's response. This `response` header controls whether requesting code can access a response from the server. Since our `app` and `api` projects will be served at different domains, setting up `cors` configuration that allows `app` access to a response from `api` is a must:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)

___

## APP project [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#app-project)

So now that you know about HTTP request and HTTP response, we can write our first API method that sends a request and receives a response from the server.

We can start making changes to the `app` project at the `book/3-begin` location. Our final goal is to display the email address of a user when the user loads the `Index` page.

We can split our entire task into three parts:

1.  Call the `fetch` method with a constructed `request` object and `route` (same website for now, later to a different website) as arguments. Receive a `response` object and return data (which is the JSON-parsed `body` of the `response`). Define `sendRequestAndGetResponse` using the `fetch` method.
    
2.  Define an API method using the `sendRequestAndGetResponse` method. This API method should be executed when the end user loads the `Index` page. The API method calls the `sendRequestAndGetResponse` method, which in turn, calls the `fetch` method. The final result is the `Index` page getting data from the `response` object's `body` property.
    
3.  On the server, we need some way to detect an incoming `request` at a particular `route`. We should also retrieve requested data and send it back to requesting code as a `response`. Since we plan to use an Express server, such construct is called an **Express route**. A handler function of an Express route gets executed once our Express server receives a `request` with a matching `route`. Typically, the goal of an `Express route` is to retrieve data from a database and send a `response` with the data attached. Since we are not discussing database in this chapter, we will simply hardcode the requested data inside the Express route.
    

___

#### Step 1: Fetch method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#step-1-fetch-method)

Our `app` web application, on both the server and the client, is a JavaScript application. In JavaScript, you can use the `fetch` method to send a `request` to the server and to receive a `response`. The method is called `fetch`:

[https://developer.mozilla.org/en-US/docs/Web/API/Fetch\_API/Using\_Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

From the above documentation:

```
// Example POST method implementation:
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}

postData('https://example.com/answer', { answer: 42 })
  .then((data) => {
    console.log(data); // JSON data parsed by `response.json()` call
  });
```

What do we see here?

-   `fetch` takes the `url` string and `request` object as arguments
-   `fetch` returns a `response` object
-   the function `postData` has `async` in front of it, and `fetch` has `await` in front of it

Both the `postData` and `fetch` method are asynchronous - that means each of these functions returns a `Promise`.

In JavaScript, code executes from top to bottom. But if there is some kind of error in the middle of the code, execution will stop at that point. To avoid this, JavaScript offers the asynchronous function. A code block with an asynchronous function does not need to complete execution - the rest of the code can still be executed in synchronous fashion.

Why do we need an asynchronous function? Imagine we built a SaaS boilerplate where fetching data was not an asynchronous operation. Every time a user sends a data request to the server, this user and our web application won't be able to do anything else on our web application. The web application will not function while the browser is waiting for data. Imagine multiple users blocking each other.

We dedicated a separate section of this chapter to explain `Promise` and its syntactic sugar `async/await` in detail. `postData` and `fetch` are asynchronous. Usage of `await` is optional for an asynchronous function. In the above example, we defined the asynchronous `postData` function and added `await` in front the `fetch` method. It's important to remember that `await` can be added only in front of another asynchronous function - in our case, this function is `fetch`. Adding `await` makes JavaScript pause on the line that has `await` until, in this case, the asynchronous method `fetch` returns data.

Later in this subsection, we will create an asynchronous method with `async function sendRequestAndGetResponse`. Inside this method's definition, we will use `await fetch`.

Let's follow the above example for the asynchronous `postData` function and define our own asynchronous `sendRequestAndGetResponse` method. Create a new file, `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts`, with the following content:

```
import 'isomorphic-unfetch';

export default async function sendRequestAndGetResponse(path, opts: any = {}) {
  const headers = Object.assign(
    {},
    opts.headers || {},
    {
      'Content-type': 'application/json; charset=UTF-8',
    },
  );

  const { request } = opts;
  if (request && request.headers && request.headers.cookie) {
    headers.cookie = request.headers.cookie;
  }

  const qs = opts.qs || '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`,
    Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
  );

  const text = await response.text();

  if (response.status >= 400) {
    throw new Error(response.statusText);
  }

  try {
    const data = JSON.parse(text);

    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      return text;
    }

    throw err;
  }
}
```

Why do we need to add and import a new dependency, `isomorphic-unfetch`?

By default, not all clients (browsers) and servers support the `fetch` method. The package `isomorphic-unfetch` makes `fetch` globally available in our code on both the client and on the server:

[https://www.npmjs.com/package/isomorphic-unfetch](https://www.npmjs.com/package/isomorphic-unfetch)

This package switches between `unfetch` and `node-fetch` for the browser and the server, respectively.

Why do we need `fetch` on both client and server? Because our Next.js web application can render pages on both the client and the server. In Chapter 2, we discussed in detail when our Next.js web application renders pages on the client and when on the server - it depends on how a user accessed the page.

-   For a client-side rendered page, `fetch` runs on the browser, and the `app` code on the browser sends a request to the `app` code on the server.
-   For a server-side rendered page, `fetch` runs on the server, and the `app` code on the server sends a request to itself.

Thus, we need to make sure that the `fetch` method is available on both the client and the server.

Let's look more closely into the above code:

-   The asynchronous method `sendRequestAndGetResponse` takes two arguments: the string `path` and object `opts` (options). Properties inside `opts` become the `request`'s properties.
    
-   We construct a `headers` object from an empty object - whatever headers might be in `opts` (`opts.headers`) and `Content-type` header:
    
    ```
      const headers = Object.assign(
        {},
        opts.headers || {},
        {
          'Content-type': 'application/json; charset=UTF-8',
        },
      );
    ```
    
    We already discussed the `Object.assign` method in Chapter 2. This method creates a new object from properties of objects passed as arguments.
    
-   If `opts` contains `request`, then we can access cookie as `opts.request.headers.cookie` and assign this value to a newly created `headers` object as the property `headers.cookie`.
    
-   If `opts` contains query string `qs`, we can access it as `opts.qs` or assign a value of empty string to it.
    
-   `fetch` takes two arguments: `path`, which is `${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`, and `request`, which has parameters `method`, `credentials`, `headers` and properties from `opts`:
    
    ```
      Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
    ```
    
-   We get USVString data from the `response`'s `body` by calling the `text` method that returns a Promise:  
    [https://developer.mozilla.org/en-US/docs/Web/API/Body/text](https://developer.mozilla.org/en-US/docs/Web/API/Body/text)
    
    ```
      const text = await response.text();
    ```
    
-   We need to decide what to do if the status of `response` is an error status. Go ahead and check up methods for `response`:  
    [https://github.com/developit/unfetch#response-methods-and-attributes](https://github.com/developit/unfetch#response-methods-and-attributes)
    
    From the above link, we get:
    
    -   `response.status` - contains the status code of the response, e.g. 404 for a not found resource, 200 for a success.
        
    -   `response.statusText` - a message related to the status attribute, e.g. OK for a status 200.
        
    -   `response.text()` - will return the response content as plain text.
        
        So if the status is 400 or higher (client errors: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)), we want to throw an error:
        
        ```
        if (response.status >= 400) {
        throw new Error(response.statusText);
        }
        ```
        
        Read about `throw` and `Error`:
        
        [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw)
        
        [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
        
        As you can see, `throw new Error(response.statusText)` creates an error object with the parameter `message`, which has a value of `response.statusText`.
        
-   We JSON-parse the response with:
    
    ```
      const data = JSON.parse(text);
    ```
    
-   We return `data` unless `try/catch` (discussed in Chapter 2) returns an error in the `try` block. In that case, we throw an error or return text:
    
    ```
      if (err instanceof SyntaxError) {
          return text;
        }
    
        throw err;
      }
    ```
    

For us to better understand value of `path` argument for `fetch` method and value for `response.status`, let's add two `console.log` statements:

```
import 'isomorphic-unfetch';

export default async function sendRequestAndGetResponse(path, opts: any = {}) {
  const headers = Object.assign({}, opts.headers || {}, {
    'Content-type': 'application/json; charset=UTF-8',
  });

  const { request } = opts;
  if (request && request.headers && request.headers.cookie) {
    headers.cookie = request.headers.cookie;
  }

  const qs = opts.qs || '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`,
    Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
  );

  console.log(`${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`);
  console.log(response.status);

  const text = await response.text();

  if (response.status >= 400) {
    throw new Error(response.statusText);
  }

  try {
    const data = JSON.parse(text);

    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      return text;
    }

    throw err;
  }
}
```

We defined our `sendRequestAndGetResponse` method. Now we can use it to create any internal API method in our project.

We don't discuss concepts of `cookie` and `session` in this chapter yet. We will do so in Chapter 5 when we work on user authentication. In other words, the following code block, though introduced here, becomes relevant and discussed later, in Chapter 5:

```
if (request && request.headers && request.headers.cookie) {
  headers.cookie = request.headers.cookie;
}
```

___

#### Step 2: API method at Index page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#step-2-api-method-at-index-page)

In this short subsection, we will create our very first API method using the `sendRequestAndGetResponse` method that we just defined at `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts`.

An API is generally defined as "a set of functions and procedures allowing the creation of applications that access the features or data of an operating system, application, or other service". In this book we use API and API infrastructure interchangeably. By API, we mean all code (infrastructure) that we create to achieve particular data exchange. For example, later in this book we will create Google OAuth API, Post API and many other APIs.

Compiles session redirect to checkout end user email and name mount middleware new Express route production-ready API method calls corresponding store method check if value is truthy. Data model At AWS dashboard Google OAuth API email and name show notification email and name Material-UI Material-UI. In a browser Remember to add import Navigate to page component new Express route show notification data model list of posts API method. In production discussion server-side rendering HTTP You already learned list of posts request was sent email and name Navigate to if truthy then if truthy then static method calls. Show notification store method calls mount middleware page component check if value is truthy list of posts triggers method. Team members add environmental variable triggers method mount middleware We will discuss request was sent At AWS dashboard subsection Put it all together team members decorate method with action Material-UI. Data model production-ready send this response in this book subsection store method calls store method calls end user HTTP. Show notification send this response request was sent Next.js web application add environmental variable. Production-ready production-ready new Express route conditional operator production-ready We will discuss decorate method with action We will discuss withAuth HOC We will discuss in production cookie. Check if value is truthy in production this chapter this chapter HTTP it works as expected API infrastructure compiles API infrastructure request decorate method with action add environmental variable production-ready MongoDB database You already learned.

In our web application, an API method is a function that runs on the client or the server and sends a request to the server and receives a response that contains data. We, as developers, need to make sure that our API methods execute when a end user requests page or when an end user takes an action (e.g. submits a form or deletes a post, and etc). In this section, we will create an API method called `getUserApiMethod`. This method is an **internal** API method, meaning it sends a request to one of our own servers. If an API method sends a request to a third-party server (e.g. AWS S3, Google OAuth, or Stripe), then we call the method an **external** API method.

Creating the `getUserApiMethod` API method is straighforward because most of heavy lifting is done by `sendRequestAndGetResponse` method. Simply create a new file `book/3-begin/app/lib/api/public.ts`, import the `sendRequestAndGetResponse` method, and pass 2 arguments (`path` and `request`) to it:

```
import sendRequestAndGetResponse from './sendRequestAndGetResponse';

const BASE_PATH = '/api/v1/public';

export const getUserApiMethod = (request) =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-user`, {
    request,
    method: 'GET',
  });
```

It's important to note that the `path` argument is `/api/v1/public/get-user`. Why so long? We want to make it long and unique enough so it does not match any of the page routes of our Next.js web application and for organizational reason.

We saved this API method to our `public.ts` file. That's where we will add any API methods that do not require user to be authenticated and do not require any other permissions. Later in this book, we will introduce two more user roles: Team Leader and Team Member. We will add API methods specific to Team Leader and Team Member to `team-leader.ts` and `team-member.ts` files inside `lib/api` folder, respectively.

We are done with our definition of the `getUser` API method. Our next step is to import the method to our `Index` page and make sure the method runs when this page requested. We have 2 choices here of where to call `getUserApiMethod`:

-   Inside `getInitialProps` that we also discussed in Chapter 2 (when working on the `Document` HOC). `getInitialProps` runs after a page is requested and can run on both the client and the server.
-   Inside `componentDidMount` that we discussed in Chapter 2. In this case, `getUser` executes right after the page mounts into the DOM. However, this approach will not work for server-side rendered pages. We will not be able to populate pages rendered on the server with data, since `componentDidMount` does not run on the server.

So if you know that the page in question can be accessed in both ways, so that the page will be both server-side and client-side rendered, then put API method, that adds dynamic data to static HTML page, inside page's `getInitialProps` method.

Open `book/3-begin/app/pages/index.tsx` and add `Index.getInitialProps` method above `Index.render` method like this:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '../components/layout';
import NProgress from 'nprogress';

import confirm from '../lib/confirm';
import notify from '../lib/notify';

import { getUserApiMethod } from '../lib/api/public';

type Props = { user: { email: string } };

class Index extends React.Component<Props> {
  public static async getInitialProps(ctx) {
    const { req } = ctx;

    const user = await getUserApiMethod(req);

    console.log(user);

    return { ...user };
  }

  public render() {
    return (
      <Layout {...this.props}>
        <Head>
          <title>Index page</title>
          <meta name="description" content="This is a description of the Index page" />
        </Head>
        <div style={{ padding: '0px 30px', fontSize: '15px', height: '100%' }}>
          <p>Content on Index page</p>
          <Link href="/csr-page" as="/csr-page">
            Go to CSR page
          </Link>
          <p />
          <Button
            variant="contained"
            onClick={() =>
              confirm({
                title: 'Are you sure?',
                message: 'explanatory message',
                onAnswer: async (answer) => {
                  console.log(answer);
                  if (!answer) {
                    return;
                  }

                  NProgress.start();

                  try {
                    notify('You successfully confirmed.');
                  } catch (error) {
                    console.error(error);
                    notify(error);
                  } finally {
                    NProgress.done();
                  }
                },
              })
            }
          >
            Test Confirmer and Notifier
          </Button>
        </div>
      </Layout>
    );
  }
}

export default Index;
```

Remember to add a `console.log(this.props);` statement. Our goal is to populate `this.props.user` with actual data.

Note a few things:

-   We specified the data type for `user`. If you don't do this and then try to print `this.props.user` anywhere on your page, you will get an error: `Property 'user' does not exist on type 'Readonly<{}> & Readonly<{ children?: ReactNode; }>'`
-   We added the `user` object to `this.props` using the spread operator that we discussed in Chapter 2. The expression `return { ...user };` means that `this.props` will be made of whatever `props` the page gets from `Document` and `App` HOCs (in our case, `isMobile` and `firstGridItem`) plus `user`. In other words, page's props `this.props` object will have 3 properties in total: `isMobile`, `firstItemGrid`, and `user`.

Before we move to Step 3, we should test and make sure that `getInitialProps`, `getUser`, and `sendRequestAndGetResponse` run as expected. To remove any confusion, let's search for all `console.log` statements inside `book/3-begin/app` and comment them out. Our goal is to have only two `console.log` statements inside `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts`. You can uncomment these statements after we are done with testing.

To find all `console.log` statements:

-   Open VS Editor and click `Ctrl + Shift + F` to navigate to Search.
    
-   Click on the "three dots" icon and fill out inputs like this:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-11+17-08-06.png)
    
    The first input is what you search for, second input is where you want to search, and third input is files that you want to exclude.
    
-   Click directly on the search results to open files and comment out the `console.log` statements.
    

Once you are done, we are ready to test the code we wrote in Step 1 and Step 2.

Start your project with `yarn dev` and navigate to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-16+15-22-04.png)

You should see the above error (`Error: Not Found`) on the browser. The error was thrown by this line:

```
throw new Error(response.statusText);
```

To make sure that this error message indeed comes from the above line, let's print out something else. Open file `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts` and change the above line of code to:

```
throw new Error(response.status.toString());
```

Go back to your browser:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-16+15-37-58.png)

The error object's message changed to `Error: 404` instead of `Error: Not Found`. This proves our point.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-16+15-27-17.png)

Next, look at your terminal:

```
http://localhost:3000/api/v1/public/get-user
404
Not Found
```

These values belong to the following `console.log` statements:

```
console.log(`${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`);
console.log(response.status);
console.log(response.statusText);
```

But why is `response.status` a `404` error code? Let's check up the meaning of the `404` status code at:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

`404` description:

> The server can not find requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 to hide the existence of a resource from an unauthorized client. This response code is probably the most famous one due to its frequent occurrence on the web.

In our case, the endpoint and resource don't exist. There is nothing in our server code that accepts incoming request at endpoint `/api/v1/public/get-user` and sends a response (that contains the `user` object). In this context, endpoint, API endpoint, path, and route all mean the same thing. In other words, an end user loads `/` route, our page sends request using API method `getUserApiMethod` method (`sendRequestAndGetResponse` method) to the API endpoint `/api/v1/public/get-user` but on our server we don't register and process this request in any way.

In the next subsection, we will actually write our first server-only code and discuss how to create a so called Express route to process incoming request and send response back to requesting code so we get a proper `200` status code instead of the `404` error status code.

___

#### Step 3: Next-Express server. Express route. [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#step-3-next-express-server-express-route-)

So far, we have not written any server-only code in our Next.js web application.

The code inside `pages`, `components`, and `lib` is available on both the client (browser) and the server.

-   If you load the `Index` page on the browser into new browser tab. The code from `components` is imported to the `Index` page, and this page gets rendered on the server and then sent to the browser.
-   If you access the `Index` page by clicking a navigational link (`<Link />` element), then the page is rendered on the browser.

In other words, the code we wrote, including `getUserApiMethod` API method is available and runs on both the client and the server.

We have not written any code that is only present on the server and never gets sent to the client (browser). The code that is responsible for processing request from `getUserApiMethod` API method.

Why haven't we? Because up until this moment, there was no need to have such code. Next.js was taking care of routing for pages, pages are static HTML and there was no need for fetching dynamic data up until this point! If we want to render a page at route `/`, then we create a file with the name `index.tsx` inside the `pages` folder. That's it, done. The name of the file becomes a route automatically. Next.js provides simple routing for pages out-of-the-box.

Now, however, we need to asynchronously add dynamic data to our static pages. And we need some way to register request and send response back. In this book we chose to work with Express.js for our server and use Express routes to register incoming requests and send responses back to requesting code. Express.js is has established API, secure, and transferrable framework to learn.

[http://expressjs.com](http://expressjs.com/)

Material-UI request check if value is truthy decorate method with action mount middleware AWS dashboard Next.js web application check if value is truthy. End user it works as expected conditional operator end user request cookie MongoDB database session cookie server-side rendering on server only conditional operator Navigate to production-ready this chapter. Remember to add import AWS dashboard discussion add environmental variable on server only mount middleware in production request was sent Material-UI email and name. Open this file Put it all together API method on server only end user on server only on the client add environmental variable request was sent redirect to checkout Next.js web application. Cookie Put it all together triggers method redirect to checkout show notification open this file cookie data model in this book API infrastructure it works as expected API infrastructure compiles. Remember to add import in this book withAuth HOC API method calls corresponding store method MongoDB database list of posts it works as expected subsection cookie page component AWS dashboard S3 bucket. Email and name static method calls Google OAuth API Next.js web application request API infrastructure in this book response page component withAuth HOC this chapter triggers method server-side rendering. Page component MongoDB database Material-UI We will discuss discussion. It works as expected Remember to add import if truthy then server-side rendering page component team members triggers method Material-UI. Page component triggers method API infrastructure if truthy then request was sent.

Even though Next.js provides well-established routing for pages, API routing is relatively new and not transferrable (we can learn Express.js and use in non-Next.js web applications). The `getUserApiMethod` API method sends a request to the `/api/v1/public/get-user` API endpoint. We need to create and define some function/method that gets executed when this request is sent to `/api/v1/public/get-user`. This function/method needs to (optionally) do something with the received request object and return a response object.

To create such a function/method, on Express.js server, you have to define so called Express route. An Express route executes a function when a request with a matching method is sent to a matching route:

[https://expressjs.com/en/starter/basic-routing.html](https://expressjs.com/en/starter/basic-routing.html)

The very basic example of an Express route:

```
app.get('/', function (req, res) {
  res.send('Hello World!')
})
```

-   `app` is an instance of an Express server
-   `function(req, res)` is a handler function - a function that executes when a request with a matching method (in this case, `GET`) is sent to a matching route (in this case, `/`).
-   We don't do anything with incoming request `req`.
-   `res.send(body)` sends an HTTP response with `body`. The type of `body` can be a buffer object, a string, an object, or an array. In our example, `body` is a string data type.

Here is another example of simple Express server that we will introduce in Chapter 5:

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

Take a careful look, as this code has all features of a basic Express route:

-   `server` is an instance of an Express server
-   It specifies a method for an incoming `request` (represented as `req` on the server); in this case method `GET`: `server.get`.
-   It specifies API endpoint: `/logout`.
-   It executes a handler function - in this case, an anonymous arrow function: `(req, res, next) => { ... }`.
-   It modifies `req` by calling the method `req.logout` and sends a `response` (represented as `res` on the server) that contains a directive to redirect a user to `/login` on the browser.

When called, the `req.logout` method sets the `req.user` property to `null` and removes the `user` property from the corresponding session.

Take the above two examples of an Express route and modify them to return, hardcoded for now, `user` object:

```
server.get('/api/v1/public/get-user', (_, res) => {
  console.log('Express route /get-user');
  res.json({ user: { email: "team@builderbook.org" } });
});
```

As you can see, we hardcoded the user object to be:

```
{ email: "team@builderbook.org" }
```

That's because we are not retrieving the user object from our database yet. We will retrieve the user object from a MongoDB database in Chapter 4. In this chapter, to keep our focus on API methods and Express routes, we simply hardcoded the user object.

At this point, we have an internal API method that we tested out in a previous subsection. And we have an Express route that we haven't tested. Where do we place our Express route? We know that all code ffrom `lib` and `components` folder get imported to the `pages` folder. Code for shared components is in the `components` folder, and code for API methods and other utility methods is in the `lib` folder. The code of our Express route will never be on the client (browser) for security reason. Moreover, in the future, the handler function of most of our API methods will be sending a request to the database. If, somehow, our Express routes are available on the client - we could share a unique URL of our database, and anyone on the web would be able to manipulate data in our database. Ouch!

Thus, Express routes should be exclusively on the server. To achieve that, we should not place Express routes into `pages`, `components`, or `lib` folders. We have to create a new folder, that Next.js does not compile, called `server` and place our Express server and Express routes into new file `server/server.ts`. Since Next.js, by default, does **not** compile code in the `server` folder, we have to add new commands to `package.json` to properly compile our TypeScript server-only code by ourselves.

Now we know **where** to put code for our Express route. Before we add code to the `server/server.ts` file, we need to create an instance of our `express` server and properly initiate with `next` server. Remember, right now, our web application has one type of server: a `next` server. We haven't explicitly modified `next` server but we have it. We have no server-only code, because we did not make any customizations to our default `next` server.

The Zeit team, who developed and maintains Next.js, maintains a large collection of examples. For example, here is an example of how to customize a default `next` server:

[https://github.com/vercel/next.js/blob/canary/examples/custom-server/server.js](https://github.com/vercel/next.js/blob/canary/examples/custom-server/server.js)

Our goal is to not only customize the default `next` server, but also to properly initiate an `express` server on the `next` server:

[https://nextjs.org/docs/advanced-features/custom-server](https://nextjs.org/docs/advanced-features/custom-server)

Let's look inside Next.js examples. You can find a `custom-server-express` example in the `examples` folder:

[https://github.com/vercel/next.js/blob/canary/examples/custom-server-express/server.js](https://github.com/vercel/next.js/blob/canary/examples/custom-server-express/server.js)

Here is code from the above example for creating an `express` server in a Next.js web application:

```
const express = require('express')
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.get('/a', (req, res) => {
    return app.render(req, res, '/a', req.query)
  })

  server.get('/b', (req, res) => {
    return app.render(req, res, '/b', req.query)
  })

  server.get('/posts/:id', (req, res) => {
    return app.render(req, res, '/posts', { id: req.params.id })
  })

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
```

Place the above example's code into the `book/3-begin/app/server/server.ts` file.

Then add one Express routes, one Express middleware and one more Express route:

```
server.get('/_next/*', (req, res) => {
  console.log('/_next/*', req.url);
  handle(req, res);
});

server.use(express.json());

server.get('/api/v1/public/get-user', (_, res) => {
  console.log('Express route /get-user');
  res.json({ user: { email: 'team@builderbook.org' } });
});
```

You should get:

```
import express from 'express';
import next from 'next';

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEV = NODE_ENV !== 'production';

const app = next({ dev: IS_DEV });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.get('/_next/*', (req, res) => {
    console.log('/_next/*', req.url);
    handle(req, res);
  });

  server.use(express.json());

  server.get('/api/v1/public/get-user', (_, res) => {
    console.log('Express route /get-user');
    res.json({ user: { email: 'team@builderbook.org' } });
  });

  server.all('*', (req, res) => {
    handle(req, res);
  });

  server.listen(process.env.NEXT_PUBLIC_PORT_APP, () => {
    console.log(`> Ready on ${process.env.NEXT_PUBLIC_URL_APP}`);
  });
});
```

Note that we have Express route `server.all` after all API-related Express routes (currently only one):

[https://expressjs.com/en/4x/api.html#app.all](https://expressjs.com/en/4x/api.html#app.all)

This Express route can accept requests with any HTTP method. Why is it placed at the end? So that requests that do not contain `/_next/` in their endpoints (page requests) and are not API requests, get passed and handled by Next.js server with `handle(req, res)`.

What is the purpose of the above `/_next/*` Express route? Why did we added it above (which process page requests):

```
server.all('*', (req, res) => {
  handle(req, res);
});
```

Over the course of this book we will keep adding page and API routes to our Next.js/Express.js server. By placing `/_next/*` Express route **upstream** of all other Express routes we tell Next.js to catch and process all request with routes that contain `/_next/*` in them. Such requests load Next.js-specific code and data, manifest-related and server-related code and data. For efficiency reason we can catch and process such requests right away by placing `/_next/*` Express route above all other routes. In other words, non-page non-authentication non-api requests get managed by Next.js server right away. This increases efficiancy of our hybrid Next.js/Express.js server.

Start our project with `yarn dev` and you can see following server logs:

```
/_next/* /_next/static/O4t4UiUPCycHVjEYYa-wG/_buildManifest.js
/_next/* /_next/static/O4t4UiUPCycHVjEYYa-wG/_ssgManifest.js
/_next/* /_next/static/O4t4UiUPCycHVjEYYa-wG/_middlewareManifest.js
```

You may also see some other logs if your version of Next.js is different from what's recommended in this chapter.

We, as project's architects, need to make sure that none of page, authentication and api routes have `_next` in their routes (endpoints).

To see that request to load page indeed contains `_next` in its route, do the following. Start your project with `yarn dev`, go to the browser, and navigate to `http://localhost:3000`. Then open `Chrome Dev Tools`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-18+12-33-01.png)

When inside `Chrome Dev Tools`, make sure you have the `Elements` tab selected.

Find an element:

```
<script async="" data-next-page="/" src="/_next/static/development/pages/index.js?ts=1579379822316"></script>
```

This is the compiled JavaScript for our `Index` page. You can go to your VS code editor and search `/_next/`, and you can find `static/development/pages/index.js` file in it.

Ok, we explained the purpose of the above two Express routes. Now let's look at the second block of code that we added to `book/3-begin/app/server/server.ts`:

```
server.use(express.json());
```

It's definitely not an Express route. `use` is not a `request`'s method ([https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)). Also, there is no route and handler function as arguments. So what is `server.use`?

`server.use` is Express's syntax of mounting (enabling) a middleware (remember that we called our instance of `express` server `server`, not `app`):

[https://expressjs.com/en/4x/api.html#app.use](https://expressjs.com/en/4x/api.html#app.use)

Ok, we mounted the middleware `express.json()`. But what is middleware?

Simply put, middleware is a function that can act on request and response, optinally transforming them and passing control to the downstream Express middleware and eventually to Express route.

[https://expressjs.com/en/guide/using-middleware.html](https://expressjs.com/en/guide/using-middleware.html)

`express.json` middleware looks for requests with the `Content-Type` header `application/json`. If the `Content-Type` matches, then middleware parses a request's body with JSON and populates the request's body with **parsed** data:

[https://expressjs.com/en/4x/api.html#express](https://expressjs.com/en/4x/api.html#express)

If we don't parse a request's body with JSON and later want to read data from the request's body, we will get an `Invalid JSON` error. Sending JSON data over a network is more efficient, since JSON data is lighter than XML data. Accessing data from a `request`'s body that is populated with JSON data (by the above middleware) is straightforward:

```
const { parameter1, parameter2 } = req.body;
```

We will access data inside `req.body` later in this book when we create Express routes with the `POST` method.

Sending a response with a body that is populated with JSON data is straightforward as well:

```
res.json({ user: { email: 'team@builderbook.org' } });
```

We are almost ready to test.

According to our `package.json` - when you run `yarn dev`, you run `yarn next`. In turn, `yarn next` only starts the `next` server. But we want to start our new `next`/`express` hybrid server. Also, Next.js does not compile the TypeScript file `book/3-begin/app/server/server.ts`. In order to start hybrid `next` and `express` server, we need to modify our `dev` script inside `package.json`.

In our first book, Builder Book, we showed our readers how to build a production-ready JavaScript web application. In that book, we would start an Express.js server locally with the `nodemon` package. `nodemon` allowed us to monitor changes in our server code and respawn or restart our server when needed. Here we need similar functionality but for TypeScript instead of JavaScript. One popular option is `ts-node-dev` - the name of the package is self-explanatory. `ts` is TypeScript, `node` is Node, and `dev` is development environment (running project locally).

If you ran `yarn` at the beginning of this chapter, then you already have the `ts-node-dev` package installed. To make sure, check up your `package.json` file in the `devDependencies` section.

The easiest way to compile server code is to create a separate configuration file. This file should extend `tsconfig.json` file that is used by Next.js to compile pages. Extending is done by using `extends` property. Create a new file `book/3-begin/app/tsconfig.server.json` with the following content:

```
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "production-server/",
    "target": "es2017",
    "isolatedModules": false,
    "noEmit": false
  },
  "exclude": ["./server/types.d.ts"],
  "include": ["./server/**/*.ts"],
  "typeRoots": ["./node_modules/@types", "./server/types.d.ts"]
}
```

This file, if used, will compile `.ts` files inside the `./server/*` folder and saves it to `production-server` folder that will be used later, in Chapter 10, when deploy our projects to Heroku and AWS cloud services.

Our new `dev` command will be:

```
"dev": "ts-node-dev --respawn --transpile-only --project tsconfig.server.json --ignore-watch .next --ignore-watch components --ignore-watch lib --ignore-watch pages server/server.ts",
```

The `--respawn` option comes from:

[https://github.com/fgnass/node-dev#usage](https://github.com/fgnass/node-dev#usage)

The `--transpile-only`, `--project` and `--ignore-watch` options come from:

[https://github.com/TypeStrong/ts-node#cli-and-programmatic-options](https://github.com/TypeStrong/ts-node#cli-and-programmatic-options)

Go ahead and check the above links for the meaning of these command options.

Why did we make `ts-node-dev` ignore so many folders, `components`/`lib`/`pages`. That's because Next.js has a built-in feature that watches those folder and hot reloads code if any changes made to files in those folders. In other words, if you, as a web developer, made a change to any files within the `components`/`lib`/`pages` folders, then Next.js will automatically rebuild (recompile) code on the fly. We also chose to ignore `.next` folder since this is where Next.js saves compiled code.

In May 2021 we retired `ts-node-dev` in favor of `nodemon` and `ts-node` combination. You can remove `ts-node-dev` package with:

```
yarn remove ts-node-dev
```

And add `nodemon` and `ts-node` packages with:

```
yarn add nodemon@^2.0.7 ts-node@^10.8.1 --dev
```

Then open `package.json` file and update `dev` script like so:

```
"dev": "nodemon server/server.ts",
```

Finally, create a new file, `nodemon.json` at the root of `app` project, with following content:

```
{
  "watch": ["server"],
  "exec": "ts-node --project tsconfig.server.json",
  "ext": "ts"
}
```

Done. This how to use `nodemon` instead of `ts-node-dev`. If our project was pure Next.js application, we did not have to use `nodemon` or `ts-node-dev`. However, `app` is hybrid project (it has both `next` and Express servers) and `api` project is Express server - we have to somehow watch for changes in `server.ts` file. Thus, we chose to use `nodemon` to do so.

On server only request was sent Google OAuth API mount middleware S3 bucket show notification production-ready this chapter response Click on the button API method calls corresponding store method. Store method calls decorate method with action check if value is truthy show notification redirect to checkout redirect to checkout Material-UI data model new Express route. API method in this book Click on the button mount middleware conditional operator conditional operator Remember to add import show notification email and name this chapter At AWS dashboard Material-UI decorate method with action Navigate to. Static method calls store method calls check if value is truthy Material-UI check if value is truthy Click on the button cookie Navigate to end user MongoDB database session. In this book static method calls check if value is truthy request Google OAuth API Next.js web application mount middleware mount middleware decorate method with action. Remember to add import cookie data model response Material-UI list of posts data model conditional operator Team Leader production-ready API method. Show notification S3 bucket session Put it all together S3 bucket production-ready API method team members We will discuss triggers method in this book compiles Navigate to Next.js web application. MongoDB database Team Leader show notification on the client Remember to add import Click on the button Team Leader on server only mount middleware show notification HTTP request compiles MongoDB database. Cookie check if value is truthy HTTP API method calls corresponding store method withAuth HOC this chapter response MongoDB database Team Leader Click on the button in this book HTTP Team Leader email and name. Mount middleware MongoDB database it works as expected on the client We will discuss API infrastructure.

You can check up when hot-reloading feature works. At the end of this chapter, start `book/3-end/app` project with `yarn dev`. Make any change you like in `book/3-end/app/pages/index.js` file. On the browser open `Chrome Dev Tools` by pressing `Ctrl + Shift + J`, click `Console` to access browser console. After you make change to the file, watch browser console, you will this output:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-05-28+08-01-06.png)

Later in this chapter, we will define `yarn dev` command for `API` project, this command will be much shorter, since `api` is an Express server and has no Next.js in it, so there is no need to ignore a bunch of folders and `yarn dev` command will be much shorter.

Alrighty, we are ready for testing!

Our goal is to print a user's email on the `Index` page. If we see an expected value of `this.props.user.email` on the `Index` page, then we successfully implemented our API method.

Open the `Index` page file, `book/3-begin/app/pages/index.tsx`. Add this line of code:

```
<p>Email: {this.props.user.email}</p>
```

So you get:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '../components/layout';
import NProgress from 'nprogress';

import confirm from '../lib/confirm';
import notify from '../lib/notify';
import { getUserApiMethod } from '../lib/api/public';

type Props = { user: { email: string } };

class Index extends React.Component<Props> {
  public static async getInitialProps(ctx) {
    const { req } = ctx;

    const user = await getUserApiMethod(req);

    console.log(user);

    return { ...user };
  }

  public render() {
    return (
      <Layout {...this.props}>
        <Head>
          <title>Index page</title>
          <meta name="description" content="This is a description of the Index page" />
        </Head>
        <div style={{ padding: '0px 30px', fontSize: '15px', height: '100%' }}>
          <p>Content on Index page</p>
          <Link href="/csr-page" as="/csr-page">
            Go to CSR page
          </Link>
          <p />
          <Button
            variant="contained"
            onClick={() =>
              confirm({
                title: 'Are you sure?',
                message: 'explanatory message',
                onAnswer: async (answer) => {
                  // console.log(answer);
                  if (!answer) {
                    return;
                  }

                  NProgress.start();

                  try {
                    notify('You successfully confirmed.');
                  } catch (error) {
                    console.error(error);
                    notify(error);
                  } finally {
                    NProgress.done();
                  }
                },
              })
            }
          >
            Test Confirmer and Notifier
          </Button>
          <p>Email: {this.props.user.email}</p>
        </div>
      </Layout>
    );
  }
}

export default Index;
```

Open your `.env` file. Make sure that you have values for:

```
NEXT_PUBLIC_URL_APP=http://localhost:3000
NEXT_PUBLIC_PORT_APP=3000
```

You must have values for these two environmental variables because we use them inside `book/3-begin/app/server/server.ts`.

Start `app` web applicatiob with `yarn dev` (make sure that you updated the value for the `dev` script).

Go to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-18+17-14-54.png)

In your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-18+17-12-24.png)

If you see the same values on your browser and terminal, then success! You properly implemented your first API infrastructure in this book.

Note that on your terminal you have both `next server, page` and `express server, user object`. That's because when our `Index` page is requested by the browser, both servers receive a request.

-   The `next` server receives a request because we loaded `/` route in our browser.
-   The `express` server receives a request because we call our `getUserApiMethod` API method inside `getInitialProps` of the `Index` page.

Go to `http://localhost:3000/csr-page` and check your terminal again:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-18+17-19-38.png)

Now you don't get any outputs other than `next server, page`. That is because our application doesn't call the `getUserApiMethod` method on the `CSRPage` page.

When we say "API infrastructure" or "API", we mean all code we implemented in this chapter to display user's email address. For our server-side rendered `Index` page, this infrastructure is:

-   The browser sends a request to the server
-   This triggers page's `getInitialProps` method (on the server)
-   This triggers the `getUserApiMethod` API method (on the server)
-   This triggers the `sendRequestAndGetResponse` method (on the server)
-   This triggers the `fetch` method (on the server)
-   This sends a request to the Express route `/api/v1/public/get-user` (on the server)
-   The Express route sends a response with a body that has a `user` object in JSON format to the page (via network, but the response is sent from the server to the server)
-   The server renders a page with the user's email addresss (on the server)
-   The server sends a rendered page with populated data to the browser
-   The browser displays a server-side rendered page with user's email (on the browser)

Phew.

Here is an illustration to help understand the main requests and responses in API infrastructure for the `Index` page in our Next.js/Express.js web application:

![Builder Book](https://user-images.githubusercontent.com/10218864/105513235-ead2f900-5c86-11eb-9a4f-2466f1ef1b0d.png)

The API endpoint we just add contains `/api/v1/public` in its value. One reason for having such a long route is for organization. We know that this route is an API endpoint (`api`). We also know that this is version 1 of our entire API infratructure. We also know that this API method is public (anyone on the web can access it, user does not need to be authenticated, no other permissions are necessary to access it). There is another reason - we want to make sure that our API endpoints do not match any routes for Next.js's pages. By having such a unique and long route, we make sure that it does not.

A side note: we have not modified the `yarn build` command. It is still `next build`. In Chapter 10, we will have to modify `build` script so that `production-server` folder gets successfully generated. We need `production-server` folder with compiled server code for successful deployment of project to Heroku and AWS services.

Another important point to understand. `app` project has code that can run on both the client and the server. All pages and code that is imported to pages (`lib` and `components`). `app` project also contains server-only code, that is our new hybrid `next` and `express` server. At the end of this chapter, we will introduce `api` project that is entirely server-only code. It's `express` server only and its sole purpose is to deal with all internal and external APIs in our SaaS boilerplate:

![Builder Book](https://user-images.githubusercontent.com/10218864/105515548-abf27280-5c89-11eb-92e8-c3c29405cad4.png)

It's very useful to understand where request-response cycle happens. What communicates with what? Here is two examples, why differentiating between client and server is important.

-   There is no CORS (Cross-Origin Resource Sharing) restriction for server-to-server request-response cycle but there is one for browser-to-server. So we have to deal with CORS restriction if API method sends request **from the browser of one domain to the server of another domain**. Later in Chapter 4 we will set up proper CORS configuration between `app` and `api` projects.
-   When we add new environmental variables to the `app` project, we add them to `.env` file. Because we prepend our environmental variables in the `app` project with "NEXT\_PUBLIC\_", they are available on both server and browser.

In the next section, we will take a detour and talk about asynchronous execution, then we will discuss `api` Express server, discuss its purpose and build it.

___

## Asynchronous execution, callback, Promise, async/await [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#asynchronous-execution-callback-promise-async-await)

Earlier in this chapter, we defined a `sendRequestAndGetResponse` method. This is an asynchronous function that calls a another asynchronous method `fetch` and **waits** for a response. You can see `async/await` syntactic sugar, `async function sendRequestAndGetResponse` and `await fetch`, inside `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts`:

```
import 'isomorphic-unfetch';

export default async function sendRequestAndGetResponse(path, opts: any = {}) {
  // some code

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`,
    Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
  );

  // some code
}
```

Before we understand how code execution works in the above `async/await` construct, we need to discuss asynchronous execution and three ways to implement it in JavaScript:

1.  Asynchronous callback
2.  Promise with `Promise.then` and `Promise.catch` methods
3.  `async/await`

An asynchronous function is one that completes with a delay. Traditionally in JavaScript, software engineers used asynchronous callback to figure out whether an asynchronous function has completed or not. Callback function is a function that is passed to an asynchronous function as an argument:

[https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing#async\_callbacks](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing#async_callbacks)

Asynchronous function, with callback function as an argument, is called main or containing or higher-order function.

When an asynchronous function completes - the callback function executes. As a result, you know that the asynchronous function has completed (either with success or error). Note that you may use callback synchronously and execute it before the main function completes. But in this section, we discuss only asynchronous functions.

Here is an example of `andThenThis` callback function and `doThis` main function from:

[https://www.freecodecamp.org/news/javascript-from-callbacks-to-async-await-1cc090ddad99/](https://www.freecodecamp.org/news/javascript-from-callbacks-to-async-await-1cc090ddad99/)

```
doThis(andThenThis);

function andThenThis() {
  console.log('and then this');
}

function doThis(callback) {
  console.log('this first');

  callback();
}
```

On your browser, open `Console`. Press `Ctrl + Shift + J` and then select `Console` tab.

Paste above code and press `Enter`:

![Builder Book](https://user-images.githubusercontent.com/10218864/105540688-72cafa00-5cab-11eb-8243-e3125df1e399.png)

We pass a callback function `andThenThis` as an argument to another function, called main function (also containing or higher-order function), `doThis`. Callback `andThenThis` is not executed immediately, it is “called back” (thus the name "callback") asynchronously inside the main function `doThis`.

Here is more complicated example with multiple callback functions (callback functions are `(nextStep)`, `function(err, beef)`, `function(err, cookedBeef)`, `function(err, buns)`, `function(err, burger)`):

[https://www.freecodecamp.org/news/how-to-deal-with-nested-callbacks-and-avoid-callback-hell-1bc8dc4a2012/](https://www.freecodecamp.org/news/how-to-deal-with-nested-callbacks-and-avoid-callback-hell-1bc8dc4a2012/)

```
const makeBurger = (nextStep) => {
  getBeef(function(err, beef) {
    if (err) throw err;
    cookBeef(beef, function(err, cookedBeef) {
      if (err) throw err;
      getBuns(function(err, buns) {
        if (err) throw err;
        putBeefBetweenBuns(buns, beef, function(err, burger) {
          if (err) throw err;
          nextStep(burger);
        });
      });
    });
  });
};

// Make and serve the burger
makeBurger(function (burger) => {
  serve(burger)
})
```

As you can see error handling is repetitive and it is hard to read the above construct, that is called "pyramid of doom" or "callback hell". This is how this pyramid get formed:

![Builder Book](https://user-images.githubusercontent.com/10218864/105542141-bc1c4900-5cad-11eb-9b94-dcad4bce05e4.png)

___

Alternatively, you can rewrite the above "callback hell" example using `Promise.then` syntax:

```
const makeBurger = () => {
  return getBeef()
    .then((beef) => cookBeef(beef))
    .then(() => getBuns())
    .then((cookedBeef, buns) => putBeefBetweenBuns(cookedBeef, buns))
    .catch(err => throw err);
};

// Make and serve burger
makeBurger().then(burger => serve(burger));
```

Promises are designed for asynchronous execution, you can probably spot some of advantages of Promise over asynchronous callbacks:

-   It's easier and less repetitive to manage errors as you can from the above example. A singe `Promise.catch` method at the end - catches all errors. We avoided using numerous `if (err) throw err;` statements.
-   Multiple asynchronous callback functions can be replaced by multiple `then` calls and the result of the previous operation gets passed into the the next, thus creating so called promise chaining. Promise chaining avoids "callback hell".

To understand Promise better, let's consider the following example:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Resolved"), 2000);
});

delay.then(
  (result) => alert(result),
  (error) => alert(error)
);
```

We created a new `delay` Promise using `new Promise(resolve, reject)` constructor, this contructor creates a new Promise with `state: "pending", result: undefined`:

[https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript\_code\_modules/Promise.jsm/Promise#Constructor](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise#Constructor)

The `Promise.then` method waits for `Promise` to return result or error, then executes provided function or functions (in the above example, provided function is either `(result) =>` or `(error) =>`):

[https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript\_code\_modules/Promise.jsm/Promise#then()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise#then())

Go to Chrome's `Developer tools` (press `Ctrl + Shift + J`), click `Console`, and paste the code above. Click enter to run the code. In the browser window, an alert modal shows up with 2 seconds delay (asynchronous execution!) and says `Resolved`:

![Builder Book](https://user-images.githubusercontent.com/10218864/35460395-bac226c8-0298-11e8-83ce-189fa42c3d9e.png)

Now run this slightly modified code:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => reject("Rejected"), 2000);
});

delay.then(
  result => alert(result),
  error => alert(error)
);
```

In the browser window, an alert modal shows up after 2 seconds and says `Rejected`:

![Builder Book](https://user-images.githubusercontent.com/10218864/35460663-9f5b8202-0299-11e8-965a-48e932ee1e83.png)

From this example, you can see that Promise has some similarities with asynchronous callback:

-   `delay` Promise completes with delay, it needs time to return `result` or `error`. Asynchronous callback is also executed with delay.
-   `delay.then` method is **waiting** for the result and won't execute provided function unless the `delay` Promise gets a value. Main function completes after callback runs and returns value.

`delay.then` method can access the `delay` Promise's `state` and `result`. The `delay.then` method returns `alert(result)` or `alert(error)`, depending on the values of `state` and `result` of `delay` Promise.

In JavaScript, Promise is a special object that has `state` and `result` properties.

-   A new Promise object initially has `state: "pending", result: undefined`.
-   When Promise calls `resolve("Resolved")` (see first example), the object parameters become `state: "fulfilled", result: "Resolved"`.
-   When Promise calls `reject("Rejected")` (see second example), the object parameters become `state: "rejected", result: "Rejected"`.

The Promise object's `state` and `result` are **not available** in the code and have to be accessed with the method `Promise.then`.

The asynchronous `Promise.then` method that waits for the main function to return a `result` or `error` is nice and a step up from callbacks. `Promise.then` allows you to avoid callback hell and write more readable promise chain:

```
const makeBurger = () => {
  return getBeef()
    .then((beef) => cookBeef(beef))
    .then(() => getBuns())
    .then((cookedBeef, buns) => putBeefBetweenBuns(cookedBeef, buns))
    .catch(err => throw err);
};

// Make and serve burger
makeBurger().then(burger => serve(burger));
```

Promise chain is an instance when you need to run multiple functions/methods one after another once the main function completes and the Promise's `result` value is available. Go to Chrome's `Developer tools`, click `Console`, paste and run the following promise chain with two `then` instances:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Resolved"), 2000);
});

delay
.then(
  result => {
    alert(result);
    return result;
  }
)
.then(
  result => alert(result+" again"),
);
```

You will see two sequential alert modals. The first shows up after 2 seconds and says `Resolved`. You click `OK` on the first modal, and then the second modal shows up immediately after and says `Resolved again`.

About catching errors using `Promise.catch`. You already saw from the above `makeBurger` example that `Promise.catch` is a big step up from managing errors when using asynchronous callbacks.

[https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript\_code\_modules/Promise.jsm/Promise#catch()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise#catch())

Try running this code in your browser console:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => reject("Rejected"), 2000);
});

delay.then(
  result => alert(result)
);
```

You won't see any alert modal. Instead, the browser will tell you that `error` is `uncaught`:

![Builder Book](https://user-images.githubusercontent.com/10218864/35462709-ef44fc3c-02a1-11e8-9f2d-9481b6ac19a5.png)

You will see this error in the browser's console:

```
Uncaught (in promise) Rejected
```

Now, add `null` to `delay.then` and run the code again:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => reject("Rejected"), 2000);
});

delay.then(null,
  result => alert(result)
);
```

In this case, you will see an alert modal that says `Rejected` after 2 seconds - you caught the `error` successfully. To catch an error, instead of using `Promise.then(null, function)`, you can use a shorter and more memorable `Promise.catch(function)`. Run this code in your browser console:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => reject("Rejected"), 2000);
});

delay.catch(
  result => alert(result),
);
```

The same output as if you had:

```
delay.then(null,
  result => alert(result)
);
```

So you caught an error in both situations, proving you can use `Promise.catch(function)` instead of `Promise.then(null, function)`.

The nice thing about `Promise.catch`, no matter how many `then` methods precede `catch` method, you can catch **all** errors by adding `catch` downstream of all `then`. See the above `makeBurger` example.

Promise is a big step up from asynchronous callback. `async/await` is a syntactic sugar for `Promise` and `Promise.then`. In other words, in some situations `async/await` syntax may provide you, software engineer, with better readibility and maintability of code.

___

`async/await` is a syntactic sugar for Promise and its methods. A syntactic (or syntax) sugar makes it easier for software engineers to read, understand and maintain code.

In Chapter 4, we will introduce `generateSlug` method and use it like this:

```
async signInOrSignUpViaGoogle({ displayName }) {
  const slug = await generateSlug(this, displayName);
}
```

Inside asynchronous function `signInOrSignUpViaGoogle`, JavaScript's execution **pauses** on the line that contains `await` until the `generateSlug` settles Promise (gets the `state` value of `"fulfilled"` or `"rejected"`) and returns a `result` (in this case, the value of user's `slug` generated from `displayName`).

To better understand how execution pausing happens on the line with `await`, let's do a short exercise. Earlier in this section, you ran this code:

```
var delay = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Resolved"), 2000);
});

delay.then(
  result => alert(result)
);
```

Let's rewrite this code block using the syntactic sugar `async/await`:

-   Decide which function you are waiting for. Let's define `delay` as an asynchronous anonymous function that returns `foo` Promise:
    
    ```
      var delay = async () => {
        var foo = new Promise((resolve, reject) => {
          setTimeout(() => resolve("Resolved"), 2000)
        });
      }
    ```
    
-   Replace `Promise.then` (`delay.then(result => alert(result))`), which waits for `result` before showing the modal, with a line that has `await` and also waits for `result` before showing the modal:
    
    ```
      var result = await foo;
      alert(result);
    ```
    

After making the above two changes, you shoud get:

```
var delay = async () => {
  var foo = new Promise((resolve, reject) => {
    setTimeout(() => resolve("Resolved"), 2000)
  });

  var result = await foo;
  alert(result);
}

delay();
```

Paste and run this code in your browser console, and you will get the same alert modal that says `Resolved` after a 2 second delay.

We just achieved the same goal with `async/await` syntax instead of `Promise.then` but with more readable code, although there is no gain in code size necessarily (we did not make the code shorter). We know and it is easy to understand that the code pauses at the `var result = await foo;` line.

Click on the button response in production team members session AWS dashboard team members production-ready on server only API infrastructure Material-UI At AWS dashboard. Data model if truthy then show notification API infrastructure static method calls mount middleware HTTP check if value is truthy subsection server-side rendering Next.js web application Remember to add import API method calls corresponding store method request was sent withAuth HOC. Team Leader We will discuss conditional operator on server only Team Leader request send this response list of posts. Store method calls At AWS dashboard API method page component data model session in production. Show notification discussion Remember to add import show notification Material-UI triggers method API method We will discuss page component static method calls Material-UI page component. Request check if value is truthy request was sent redirect to checkout this chapter At AWS dashboard in a browser check if value is truthy email and name API method Put it all together. WithAuth HOC Material-UI add environmental variable MongoDB database production-ready decorate method with action Click on the button MongoDB database conditional operator. API method Google OAuth API conditional operator AWS dashboard add environmental variable compiles request was sent cookie subsection triggers method We will discuss store method calls At AWS dashboard. Open this file S3 bucket send this response Click on the button production-ready in this book if truthy then. HTTP session if truthy then email and name in production Material-UI API infrastructure on the client if truthy then withAuth HOC redirect to checkout cookie Navigate to Google OAuth API.

In practice, the code can become more concise in addition to being more readable. You will see this in Chapter 5, where we write many static methods for our data models. By default, all Mongoose API methods (aka Mongoose Queries), such as `create`, `update`, and `findOne`, return a Promise. Thus, we don't need to use `new Promise((resolve, reject) => ...)` explicitly in our code when using `await` on any of these Mongoose API methods. `mongoose` library defines Promises in its internal code.

Let's rewrite below `makeBurger` example using `async/await`.

From this code:

```
const makeBurger = () => {
  return getBeef()
    .then((beef) => cookBeef(beef))
    .then(() => getBuns())
    .then((cookedBeef, buns) => putBeefBetweenBuns(cookedBeef, buns))
    .catch(err => throw err);
};

// Make and serve burger
makeBurger().then(burger => serve(burger));
```

To this code:

```
async makeBurger() {
  try {
    const beef = await getBeef();
    const cookedBeef = await cookBeef(beef);
    const buns = await getBuns();
    const burger = await putBeefBetweenBuns(cookedBeef, buns);
  } catch (err) {
    console.log(err);
    throw err;
  }

  return burger;
}

serve(await makeBurger());
```

Much more readable code!

You can gain readibility and reduce code length for seven `then` statements. Check up definition for static method `User.signInOrSignUpViaGoogle` method:

```
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
    defaultTeamSlug: '',
    darkTheme: false,
  });

  const emailTemplate = await getEmailTemplate('welcome', { userName: displayName });

  if (!emailTemplate) {
    throw new Error('Welcome email template not found');
  }

  try {
    await sendEmail({
      from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
      to: [email],
      subject: emailTemplate.subject,
      body: emailTemplate.message,
    });
  } catch (err) {
    console.error('Email sending error:', err);
  }

  try {
    await addToMailchimp({ email, listName: 'signups' });
  } catch (error) {
    console.error('Mailchimp error:', error);
  }

  return _.pick(newUser, this.publicFields());
}
```

Chaining would have been hard to construct and read, much more readable with `async/await`!

How does pausing of execution happens at the line with `await`?

In the example with `foo`, we define `foo` as Promise, because the function after `await`, `foo`, must return a Promise. For JavaScript to pause at a line with `await foo`, the `foo` must return a Promise. To demonstrate that JavaScript pauses on the line that contains `await foo` and that `foo` must return a Promise, run this code in your browser console:

```
var delay = async () => {
  var foo = new Promise((resolve, reject) => {
    setTimeout(() => resolve("Resolved"), 2000)
  });

  console.log('Line BEFORE await');
  var result = await foo;
  console.log('Line AFTER await');

  alert(result);
}

delay();
```

While running this code, notice the order in which the console prints text and the browser shows the alert modal:

![Builder Book](https://user-images.githubusercontent.com/10218864/35467230-cbda9512-02c0-11e8-9652-e63c8b97284f.png)

Here are the events in chronological order:

-   the console prints `Line BEFORE await`
-   nothing is printed in the browser consode for about 2 seconds (code in main function pauses for 2 sec at the `await foo` line)
-   the alert modal shows up
-   the console prints `Line AFTER await`

Now, let's try running this code where `foo` does not return a Promise:

```
var delay = async () => {
  var foo = setTimeout(() => alert('Resolved'), 2000);

  console.log('Line BEFORE await');
  var result = await foo;
  console.log('Line AFTER await');

  result;
}

delay();
```

This time, you see **no pausing**, and the console prints `Line BEFORE await` and `Line AFTER await` without delay in between, right after the code starts to execute. That's exactly what we expected, since `foo` does not return a Promise (unlike the previous example). Make sure function that you await result from is a Promise.

___

Earlier in this chapter, we defined a `sendRequestAndGetResponse` method. This is an asynchronous function that calls a `fetch` method and **waits** for a response. Check up our definition from earlier in this chapter. Open the file `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts`:

```
import 'isomorphic-unfetch';

export default async function sendRequestAndGetResponse(path, opts: any = {}) {
  // some code

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`,
    Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
  );

  // some code
}
```

JavaScript execution inside main function `sendRequestAndGetResponse` pauses at line `await fetch` until fetch returns result.

In summary, the synctatic sugar `async/await` achieves the same goal as a Promise and its methods, as well as asynchronous callbacks. However, the syntax is more readable and thus developer-friendly.

We hope this section and the previous one showed you - via practical exercises - how asynchronous callbacks, Promise and `async/await` help you add asynchronous execution to your web application if needed. In our project, we will end up using syntactic sugar `async/await` many dozen times.

___

## API server [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-server)

Earlier in this chapter, we discussed a one-project architecture:

![Builder Book](https://user-images.githubusercontent.com/10218864/105513235-ead2f900-5c86-11eb-9a4f-2466f1ef1b0d.png)

In this last section of Chapter 3, we will update above architecture with new project `api`. In the last chapter of this book we will discuss some of security topics, here we add `api` project to improve scalability of our SaaS boilerplate.

Scalabilty addresses this question: how many users can use your web application and not experience an intolerable reduction in performance? Node.js is by design a single-threaded engine (thus the name), meaning all server's resources (CPU, memory, etc) are devoted to a single process (single thread) that executes incoming tasks. There only one task getting executed at a time. All incoming tasks are in the queue. When you design your project and write your code, you should be mindful about not blocking a process. If Node.js is performing some heavy task, all other tasks have to wait. To put it in the context of you web application - if one user of your web application creates some heavy task (e.g. uploading a file to the server), another user who wants to perform some task at the same time will find that the application is not responsive - pages don't load, button don't trigger underlying API infrastructure and etc:

[https://nodejs.dev/learn/the-nodejs-event-loop](https://nodejs.dev/learn/the-nodejs-event-loop)

Single-thread is not a bad thing. Remember, most of a server's resources are devoted to this single process or thread. When a server has many threads, resources are shared.

Node.js does allow you to create threads in addition to the main thread, which, then, is called the main process. These additional threads are called forked processes. If you have some very heavy task in your web application and you worry about blocking of the main process, you may want to create a forked process to run one or few heavy task. Then you can delete the forked process to release resources back to the main process.

[https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js](https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js)

Alternatively, to creating a forked process that shares resources with the main process, you can just add more servers. This is how Node.js application is supposed to be scaled. Adding more server creates a set of nodes, thus the name `Node`.

Let's talk about another aspect of scalability that is unique to our choice of technology. We chose the Next.js framework for many benefits it offers: server-side rendering, routing for pages, compiling, hot code reload and more. Our current web application, `app` project, has a server (Next.js/Express.js) that is responsible for both:

-   `next` server deals with requests for pages and public files.
-   `express` server deals with API requests (data manipulation, CRUD tasks, connection to database)

In other words, if you have web application where users load pages often, API requests will be blocked. If you have API-heavy web application, pages' loading will be blocked. All due to single thread nature of Node.js. In other words, our `next` and `express` servers are mutually blocking.

One solution is to decouple API requests from our "hybrid-purpose" server. We can make one server responsible for requests to pages and make a new `api` server deal with API requests. Server that deals with serving pages is our current project, it's name is `app`. New server that will deal with API requests will be called `api` project, we will place at the same level as `app` project, inside `3-begin` folder, at `book/3-begin/api`.

Next.js web application this chapter decorate method with action HTTP show notification We will discuss email and name redirect to checkout in this book conditional operator session response static method calls mount middleware We will discuss. Compiles mount middleware if truthy then You already learned request was sent request was sent response on server only Google OAuth API discussion session API method data model. API method on server only end user cookie check if value is truthy AWS dashboard it works as expected AWS dashboard Next.js web application Put it all together compiles API infrastructure end user. API infrastructure Material-UI open this file show notification API method on server only API method calls corresponding store method end user response API method in this book Material-UI response. Decorate method with action check if value is truthy AWS dashboard data model check if value is truthy redirect to checkout Google OAuth API compiles. Open this file Next.js web application Navigate to Put it all together Remember to add import in a browser compiles this chapter new Express route list of posts in a browser redirect to checkout. Navigate to page component API method calls corresponding store method email and name new Express route show notification send this response request page component. This chapter it works as expected new Express route cookie Google OAuth API on the client in this book add environmental variable cookie store method calls cookie Google OAuth API response. Navigate to API method Click on the button redirect to checkout At AWS dashboard request was sent in this book We will discuss email and name page component redirect to checkout. Session Material-UI in this book decorate method with action check if value is truthy Next.js web application static method calls Material-UI in a browser request was sent check if value is truthy redirect to checkout withAuth HOC server-side rendering mount middleware.

Let's illustrate a new infrastructure where we have two servers, `APP` and `API`, instead of only one:

![Builder Book](https://user-images.githubusercontent.com/10218864/105515548-abf27280-5c89-11eb-92e8-c3c29405cad4.png)

The benefit of the above, two-project, architecture is straightforward to appreciate. End users who load pages don't block end users who perform data manipulation. And vice versa. The request-response cycle between `app` and `api` servers in the same region happens via local network (for server-side rendered pages) and is thus much faster than typical public browser-to-server network. When we deploy `app` and `api` projects to AWS in Chapter 10, we will make sure that we place these two servers into the same region.

In the next few subsections, we will work on implementing this new infrastructure.

___

#### New project API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#new-project-api)

Here are the steps to refactor our current architecture:

1.  Create a new Node.js project called `api` and define a new Express.js server (no Next.js for `api` server)
2.  Create an Express route on a new `api` server.
3.  Update existing `app` project so that request gets sent by `getUserApiMethod` to Express route of new `api` server instead of `app` server.

Let's discuss tasks 1 and 2 in detail in this subsection and task 3 in the next subsection.

1.  Look at the server code you already wrote earlier in this chapter for `app` project. Open `book/3-begin/app/server/server.ts`. This is our hybrid `next-express` server:
    
    ```
     import express from 'express';
     import next from 'next';
    
     const NODE_ENV = process.env.NODE_ENV || 'development';
     const IS_DEV = NODE_ENV !== 'production';
    
     const app = next({ dev: IS_DEV });
     const handle = app.getRequestHandler();
    
     app.prepare().then(() => {
       const server = express();
    
       // give all Nextjs's request to Nextjs before anything else
       server.get('/_next/*', (req, res) => {
         console.log('next server, page');
         handle(req, res);
       });
    
       server.use(express.json());
    
       server.get('/api/v1/public/get-user', (_, res) => {
         console.log('Express route /get-user');
         console.log('express server, user object');
         res.json({ user: { email: 'team@builderbook.org' } });
       });
    
       server.all('*', (req, res) => {
         handle(req, res);
       });
    
       server.listen(process.env.NEXT_PUBLIC_PORT_APP, () => {
         console.log(`> Ready on ${process.env.NEXT_PUBLIC_URL_APP}`);
       });
     });
    ```
    
    Our Express.js server for new project `api` can be created in fewer lines of code:
    
    ```
     import * as express from 'express';
    
     const server = express();
    
     server.use(express.json());
    
     server.listen(process.env.PORT_API, () => {
       console.log(`> Ready on ${process.env.URL_API}`);
     });
    ```
    
    Place the above code into new file `book/3-begin/api/server/server.ts`. Please create `api` and `server` folders beforehand. Create `api` folder on the same level as `app`.
    
    We defined Express server, next step is to create a `package.json` file for our new Node.js project. Create a new file `book/3-begin/api/package.json` with following content:
    
    ```
     {
       "name": "3-end-api",
       "version": "1",
       "license": "MIT",
       "scripts": {
         "dev": "nodemon server/server.ts",
         "lint": "eslint . --ext .ts,.tsx"
       },
       "dependencies": {
         "dotenv": "^16.3.1",
         "express": "^4.18.2",
         "typescript": "^5.3.2"
       },
       "devDependencies": {
         "@types/dotenv": "^8.2.0",
         "@types/express": "^4.17.21",
         "@types/node": "^20.10.1",
         "@typescript-eslint/eslint-plugin": "^6.13.1",
         "@typescript-eslint/parser": "^6.13.1",
         "eslint": "^8.54.0",
         "eslint-config-prettier": "^9.0.0",
         "eslint-plugin-prettier": "^5.0.1",
         "nodemon": "^3.0.1",
         "prettier": "^3.1.0",
         "ts-node": "^10.9.1"
       }
     }
    ```
    
    Define files that contain compiler options for this `express` server.
    
    Create a `book/3-begin/api/tsconfig.json` file:
    
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
    
    Create a `book/3-begin/api/tsconfig.server.json` file:
    
    ```
     {
       "extends": "./tsconfig.json",
       "compilerOptions": {
         "module": "commonjs",
         "outDir": "production-server/"
       },
       "include": ["./server/**/*.ts"],
       "exclude": ["./server/**/*.test.ts"]
     }
    ```
    
    We don't go into details of creating the above configuration files, since we already discussed them when we worked on setting up `app` project.
    
    For linting, create a new `book/3-begin/api/.eslintrc.js` and `book/3-begin/api/.eslintignore`. You can copy content for these files from corresponding files in the `book/3-begin/app/*` folder. We don't
    
    Do the same for the \`\`book/3-begin/api/.gitignore\` file.
    
    Create a new `book/3-begin/api/.env` file. Add two environmental variables to it:
    
    ```
     PORT_API=8000
     URL_API=http://localhost:8000
    ```
    
    Remember to run the `yarn` command inside the `book/3-begin/api/*` folder to install all dependencies. You can check for presence of a `node_modules` folder and `yarn.lock` file. If they are present, then you have installed dependencies.
    
2.  Time to start our `express` server and then create a new Express route. Open `book/3-begin/api/package.json` and find the `dev` command in the `scripts` section:
    
    ```
     nodemon server/server.ts
    ```
    
    Remember to create `nodemon.json` file with folowing content at the root of `api` folder:
    
    ```
     {
       "watch": ["server"],
       "exec": "ts-node --project tsconfig.server.json",
       "ext": "ts"
     }
    ```
    
    To start our `express` server, go to `book/3-begin/api/*` in your terminal and run `yarn dev`.
    
    In your terminal, you will see the following output:
    
    ![Builder Book](https://user-images.githubusercontent.com/10218864/105768667-90999880-5f11-11eb-96bd-a3f987dc1315.png)
    
    What's wrong? Why do we see:
    
    ```
     > Ready on undefined
    ```
    
    Why `process.env.URL_API` has value of `undefined`.
    
    Stop your project (`Ctrl + C`). Open the `.env` file and you will see two environmental variables there that we added a bit earlier:
    
    ```
     PORT_API=8000
     URL_API=http://localhost:8000
    ```
    
    The problem is that we did not import `dotenv`. We did properly for `app` project inside `next.config.js` but not for our new `api` project. `Open`book/3-begin/api/server/server.ts\` at two new lines like this:
    
    ```
     import * as express from 'express';
    
     // eslint-disable-next-line
     require('dotenv').config();
    
     const server = express();
    
     server.use(express.json());
    
     console.log(process.env.PORT_API, process.env.URL_API);
    
     server.listen(process.env.PORT_API, () => {
       console.log(`> Ready on ${process.env.URL_API}`);
     });
    ```
    
    Note that we also added `console.log` statement above line with `server.listen`.
    
    Start `api` project with `yarn dev`.
    
    Check up the output in your terminal:  
    ![Builder Book](https://user-images.githubusercontent.com/10218864/105767941-8925bf80-5f10-11eb-974e-86f330604a3b.png)
    
    Go to `http://localhost:8000` on your browser and you should see:  
    ![Builder Book](https://user-images.githubusercontent.com/10218864/105768968-fab23d80-5f11-11eb-8ddd-096c9b940716.png)
    
    This means that our server started successfully and runs but there is simply no Express route with a `GET` method for path `/` on our Express server.
    
    Let's add this missing Express route. You already know how to create basic Express routes. Open `book/3-begin/api/server/server.ts` and find this line:
    
    ```
     server.use(express.json());
    ```
    
    Under this line, add a new Express route:
    
    ```
     server.get('*', (_, res) => {
       res.sendStatus(403);
     });
    ```
    
    For security reasons, we send a 403 status to the browser:  
    [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)
    
    The `*` wildcard oute is basically us sending a response with 403 status on all possible routes.
    
    In other words, we tell to whoever sends a request to `api` server that access is forbidden.
    
    Start `api` project with `yarn dev`. Go to your browser and access the `http://localhost:8000/` and `http://localhost:8000/abc` routes:  
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-23+17-06-46.png)
    
    You may ask "why do we use the `*` wildcard route?" This is to cover all possible routes. We can still have the `/api/v1/public/get-user` Express route with a non-403 response status. But we must make sure that this new Express route is **upstream** of the Express route for the `*` wildcard path. Order of Express routes and Express middleware matters. If you move `server.use(express.json());` middleware under all Express routes, then you will get an `Invalid JSON` error since parsing will not happen upstream of all Express routes.
    
    We are ready to add an Express route `/api/v1/public/get-user`:
    
    ```
     server.get('/api/v1/public/get-user', (_, res) => {
       console.log('API server got request from APP server or browser');
       res.json({ user: { email: 'team@builderbook.org' } });
     });
    ```
    
    Make sure it is **upstream** (above) the Express route with the `*` wildcard path.
    
    Start `api` project with `yarn dev`. On your browser, navigate to `http://localhost:8000/api/v1/public/get-user`:  
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-23+17-17-00.png)
    
    If you see `{"user":{"email":"team@builderbook.org"}}` on the page, then good job!
    
    Remember, if you had `/api/v1/public/get-user` Express route **downstream** of Express route `*` then you would have seen `Forbidden` when you navigate to `http://localhost:8000/api/v1/public/get-user`.
    

Let's see where we are in our progress:

1.  (done) Create a new Node.js app called `API` and define a new Express.js server (no Next.js for `api` server)
2.  (done) Create an Express route on `api` server.
3.  Update `app` project so that request gets sent to Express route of new `api` server.

We have one more task remaining before we can test our new architecture, we will work on completing this task in the next subsection.

___

#### Updating APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-app)

We've created a separate project that has dedicated server for handling API requests only.

Our next step is to modify `app` project to reflect our new architecture:

-   Modify the `sendRequestAndGetResponse` method in `app` project
-   Remove the Express route `/api/v1/public/get-user` from `app` project
-   Add missing env variables to `app/.env` file

Let's discuss these steps in detail.

-   We created a new project `api` that is a simple `express` server with one middleware and two Express routes. In this step, we go back to `app` project and modify the `sendRequestAndGetResponse` method.
    
    Open `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts` file. Find the line with `${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}` - we do not send an API request to `process.env.URL_APP` anymore. In our new architecture, we send it to `process.env.URL_API`.
    
    Also uncomment line:
    
    ```
      // console.log(`${process.env.NEXT_PUBLIC_URL_APP}${path}${qs}`);
    ```
    
    And change value to:
    
    ```
      console.log(`${process.env.URL_API}${path}${qs}`);
    ```
    
-   Final step - removing the unneccessary Express route from `app` project's server.
    
    Open `book/3-begin/app/server/server.ts`. Delete or comment out the Express route:
    
    ```
      server.get('/api/v1/public/get-user', (_, res) => {
        console.log('Express route /get-user');
        res.json({ user: { email: 'team@builderbook.org' } });
      });
    ```
    
    Also delete or comment out this line:
    
    ```
      console.log('next server, page');
    ```
    
    We already tested our `next` server earlier in this chapter, so we don't need this `console.log` statement any longer.
    
-   Open `book/3-begin/app/.env` and add a new environmental variable to it:
    
    ```
      NEXT_PUBLIC_URL_API=http://localhost:8000
    ```
    

Time to test!

We have to start two projects to test "two-project" architecture. We have to run both `app` and `api` at the same time!

VS code editor makes it easy. If you use VS Editor's terminal, simply click the `Split Screen` icon or press `Ctrl + Shift + 5`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-24+12-14-34.png)

On the left screen, run `cd book/3-begin/app`.

On the right screen, run `cd book/3-begin/api`.

In each screen, run `yarn dev` to start each project.

Response open this file subsection conditional operator response decorate method with action on server only We will discuss add environmental variable email and name new Express route production-ready API method calls corresponding store method. Send this response on the client new Express route You already learned API method list of posts Click on the button AWS dashboard list of posts. Store method calls data model it works as expected email and name in this book request was sent. We will discuss API method calls corresponding store method request session discussion this chapter response static method calls API infrastructure We will discuss new Express route. Decorate method with action mount middleware send this response Google OAuth API We will discuss AWS dashboard production-ready server-side rendering API method calls corresponding store method. Material-UI request was sent Put it all together email and name discussion page component. Check if value is truthy Remember to add import add environmental variable request Remember to add import response static method calls. Put it all together triggers method response discussion on server only response. On the client Team Leader cookie cookie Put it all together send this response. Decorate method with action mount middleware session on the client We will discuss production-ready API method Next.js web application if truthy then server-side rendering server-side rendering in production end user.

Navigate to `http://localhost:3000/`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-24+12-19-03.png)

You see the user's email on the `Index` page of `app` project!

Our new `app`/`api` architecture works!

On your split screen terminals you see:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-3/Screenshot+from+2020-01-24+12-26-41.png)

The output of the **left** screen (`app` project):

```
http://localhost:8000/api/v1/public/get-user
{ user: { email: 'team@builderbook.org' } }
```

comes from `book/3-begin/app/lib/api/sendRequestAndGetResponse.ts`:

```
console.log(`${process.env.URL_API}${path}${qs}`);
```

and from `book/3-begin/app/pages/index.tsx`:

```
console.log(user);
```

The output of the **right** screen (`api` project):

```
API server got request from APP server or browser
```

comes from `book/3-begin/api/server/server.ts`:

```
console.log('API server got request from APP server or browser');
```

Good job if you got to the end of this chapter!

___

In the next chapter, Chapter 4, we will work on adding database to our architecture:

![Builder Book](https://user-images.githubusercontent.com/10218864/105751210-8e780f80-5efa-11eb-8039-ad1e078fe005.png)

___

This is the end of Chapter 3.

If you followed steps described in this chapter closely, your codebase should match the codebase located at `book/3-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___