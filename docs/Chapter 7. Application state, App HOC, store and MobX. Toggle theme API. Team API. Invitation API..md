In Chapter 7, you will start with the codebase in the [7-begin folder](https://github.com/async-labs/saas/tree/master/book/7-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [7-end folder](https://github.com/async-labs/saas/tree/master/book/7-end).

We will cover the following topics in this chapter:

-   Application state, withStore HOC, store and MobX  
    
    -   Updating App HOC
    -   store, observable, decorate
    -   initializeStore, getStore, server-side rendering, action
    -   Data store for User
    -   Updating withAuth HOC
    -   Updating YourSettings page
    -   Testing store infrastructure
-   Toggle theme API  
    
    -   Layout
    -   Store method toggleTheme
    -   toggleThemeApiMethod API method
    -   Express route /user/toggle-theme
    -   Static method toggleTheme
    -   Testing toggle theme API
-   Team API  
    
    -   Model and static methods - Team
    -   Updating User model - Team
    -   Express routes - Team
    -   API methods - Team
    -   Data store and store methods - Team
    -   Updating main store - Team
    -   Initial data from App.getInitialProps - Team
    -   teamRequired - Team
    -   CreateTeam page
    -   TeamSettings page
    -   Testing Team API
-   Invitation API  
    
    -   Updating TeamSettings page
    -   InviteMember component
    -   Invitation page
    -   Updating LoginButton component
    -   Invitation data store - Invitation
    -   Updating Team data store - Invitation
    -   API methods - Invitation
    -   Express routes - Invitation
    -   Model and static methods
    -   Invitation email template
    -   Updating Team model - Invitation
    -   Testing Invitation API

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

In this chapter, we will learn about data stores and their purpose. We will build a data store for User and modify our `APP` project to work properly with MobX. We will introduce multiple new models (`Team`, `Invitation`, `Discussion`, and `Post`) and build the corresponding infrastructure for these models in both `APP` and `API` projects.

Inside the `API` project, we will build many "Model - Static method - Express route" infrastructures.

Inside the `APP` project, we will build many "API method - Store - Page - Component" infrastructures.

## Application state, withStore HOC, store and MobX [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#application-state-withstore-hoc-store-and-mobx)

As your SaaS boilerplate grows and becomes more complicated, there is a growing need for management of your application's state. The application's state is all data associated with your application (objects, arrays, etc). For example, the `user` object with public parameters in `APP` is part of our application's state. In this chapter, we will add more data to our application's state (`Team`, `Invitation`, `Discussion` and `Post`).

Why do we need to worry about carefully managing our application's state? What happens when a project grows? Here are a few consequences:

-   Number of pages (page components), higher-order components, and regular components increases
    
    Let's say you need to display user information (`displayName` and `avatarUrl`) on multiple pages. As the number of pages grows, you, as a web developer, have to call some API method inside the `getInitialProps` method on **each** page.
    
-   Number of user events increases (end user clicks on button, uploads file, creates or deletes post and etc).
    
    An end user may update their `avatarUrl` on `YourSettings` page. You, as a web developer, need to make sure the `user` object gets an updated `avatarUrl` parameter inside your application's state so that all other pages of your application display this updated avatar. You can achieve this by calling an API method that sends a request from your `APP` to `API` server for every page load, but that is not efficient. You'd rather send a request to your `API` server only one time, get an updated `avatarUrl`, save it to application's state, and then use this saved `avatarUrl` for every page that needs it - without sending a request to the `API` server for every page.
    
-   For some interactions with your web application, end users expect reactivity. For example, a user updates their `avatarUrl` and wants to see a new avatar right away, without reloading the page. Or a user creates a new post and wants to see this new post right away, without reloading the page. In other words, the end user does not want to reload their browser tab (server-side rendered page) or click a navigational link (client-side rendered page) to see successfully updated data on the user interface.
    

If we do not manage our application's state properly, we may show inconsistent and/or non-reactive data throughout our web application.

We wish there was a way to define data store for `User`. We want such data store to persist. When updated, we want to send a request to our `API` server to update that data in the database and automatically re-render corresponding components to display this data reactively to the end user. Every time an end user loads a page that requires user information, the page gets data from data store for `User` instead of sending a request to the `API` server.

The `mobx` package allows us to define data store with the above properties. The `mobx-react` package allows us to automatically re-render React components if the corresponding data changes inside the MobX data store.

Let's discuss how we will implement the above infrastructure. We can create a `store` object that contains all MobX data stores in our web application. We can populate the page component's props with this `store` object, so we can easily access it on any page with `this.props.store`. You already know two ways to populate `props` of a page component. One method is to to call the `getInitialProps` method. The second method is to wrap the page component with a higher-order component that can add props to the page's props. For example, let's look at `YourSettings` page at the end of Chapter 4. Open file `book/4-end/app/pages/your-settings.tsx` and file `book/4-end/app/pages/_app.tsx`:

-   `getInitialProps` method of `YourSettings` page populates `user` prop
-   `App` higher-order component that wraps all pages (Next.js feature) populates `isMobile` and `firstGridItem` props

In other words, at the end of Chapter 4, we used both methods to populate `YourSettings` page's props.

We can create a new higher-order `withStore` or update an existing higher-order component, for example, `App` HOC. Then on any page that needs user data, we can access it simply by:

```
this.props.store.currentUser
```

In this book, we chose to do the latter, updating `App` HOC instead of creating a new HOC.

Here is how our typical internal (non third-party) API infrastructure looks like **now**:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Update+profile+API+without+store.png)

Here how it will look like **with store**:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Update+profile+API+with+store.png)

You may ask why complicate things (add an extra step) and have a data store? As we discussed earlier, one benefit is to be productive as a developer. On any page, we can access `this.props.store.currentUser` and `this.props.store.currentUser.updateProfile` methods - no need to call `getInitialProps` and define the `user` prop for every page. A second benefit is that if data displayed on the UI changes in the store, the UI will get updated automatically and reactively:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Data+store.png)

Before we can access `this.props.store` on any page, we have to build the following parts:

-   Update our `App` HOC so it populates a page's props with `store`, which can be accessed as `this.props.store`
-   Define `store` from the above step
-   Update our `withAuth` HOC
-   Update `YourSettings` page
-   Test store infrastructure

___

#### Updating App HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-app-hoc)

In order to automatically and reactively re-render components when the corresponding data inside the store changes, we need to do a few things:

-   Wrap our page component with a `Provider` higher-order component from the `mobx-react` package. `Provider` passes `store` as a prop to a page component and **all** child components:
    
    [https://github.com/mobxjs/mobx-react#provider-and-inject](https://github.com/mobxjs/mobx-react#provider-and-inject)
    
-   Wrap our page component with an `observer` HOC from the `mobx-react` package to subscribe the wrapped components to an `observable` change. This will automatically re-render wrapped components if there is change in `observable`:
    
    [https://mobx.js.org/refguide/observer-component.html](https://mobx.js.org/refguide/observer-component.html)
    
    `observable` is data (object, array, parameter and etc) in `store` that will change over time and trigger re-rendering of corresponding React components:
    
    [https://mobx.js.org/intro/overview.html](https://mobx.js.org/intro/overview.html)
    
    `MobX` creates a clone of `store` (`store` contains all `observables`), and when data changes in your application, it gets compared to the cloned instance to conclude if data changed.
    
    An example of `observable` in our case is `store.currentUser` (object) or `store.currentUrl` (parameter, string).
    
-   We need to inject `store` into our page component before it can render. We can do this by wrapping our page component with the `inject` HOC from the `mobx-react` package:
    
    [https://github.com/mobxjs/mobx-react#provider-and-inject](https://github.com/mobxjs/mobx-react#provider-and-inject)
    

Official docs for `mobx-react` show the above steps can be implemented:

```
@inject("color")
@observer
class Button extends React.Component {
    render() {
        return <button style={{ background: this.props.color }}>{this.props.children}</button>
    }
}

class Message extends React.Component {
    render() {
        return (
            <div>
                {this.props.text} <Button>Delete</Button>
            </div>
        )
    }
}

class MessageList extends React.Component {
    render() {
        const children = this.props.messages.map(message => <Message text={message.text} />)
        return (
            <Provider color="red">
                <div>{children}</div>
            </Provider>
        )
    }
}
```

In the above example, `store` has one parameter: `color`. `Provider` wraps child components to pass `store` to them. `inject` and `observer` HOCs wrap components. In our case, we decided to modify our `App` HOC that wraps our page component. Open `book/7-begin/app/pages/_app.tsx` and find this line:

```
<Component {...pageProps} />
```

Based on the above example and docs, we can do:

```
import { Provider } from 'mobx-react';

<Provider store={store}>
  <Component {...pageProps} />
</Provider>
```

And then, somewhere before page component renders, we need to add:

```
inject('store')(observer(Component))
```

Note that the official docs suggest wrapping with the `observer` HOC before wrapping with the `inject` HOC.

API method list of posts page component At AWS dashboard API method calls corresponding store method show notification. It works as expected compiles Click on the button it works as expected data model MongoDB database cookie it works as expected redirect to checkout send this response add environmental variable At AWS dashboard cookie. Remember to add import check if value is truthy this chapter send this response on the client team members on server only conditional operator Google OAuth API it works as expected. Redirect to checkout email and name Navigate to open this file team members team members add environmental variable mount middleware triggers method in this book compiles. Triggers method API method calls corresponding store method add environmental variable mount middleware in production API method Team Leader in production redirect to checkout Navigate to withAuth HOC Navigate to. Static method calls decorate method with action HTTP Navigate to this chapter this chapter this chapter. Open this file response Material-UI if truthy then server-side rendering in production in this book in a browser withAuth HOC end user. In production S3 bucket email and name Click on the button response We will discuss store method calls subsection Team Leader cookie show notification in production request team members new Express route. MongoDB database Click on the button server-side rendering show notification Navigate to server-side rendering. Material-UI end user S3 bucket check if value is truthy withAuth HOC.

Alternatively, we can pass `store` to our page component like this:

```
<Component {...pageProps} store={store} />
```

If we do so, we don't need wrap **page components** with the `inject` HOC. Hovewer, we still need to wrap all other components that require reactive re-rendering with the `inject` HOC.

We still need to subscribe our page components to `observables` inside `store`. We can achieve this by wrapping our page component with the `observer` HOC. Later in this section, we will do the same for the `YourSettings` page:

```
export default withAuth(observer(YourSettings));
```

Make the above two changes to your `App` HOC, and you should get:

```
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import { Provider } from 'mobx-react';
import App from 'next/app';
import Head from 'next/head';
import React from 'react';

import { themeDark, themeLight } from '../lib/theme';
import { getUserApiMethod } from '../lib/api/public';
import { isMobile } from '../lib/isMobile';
import { getStore, initializeStore, Store } from '../lib/store';

class MyApp extends App<{ isMobile: boolean }> {
  public static async getInitialProps({ Component, ctx }) {
    let firstGridItem = true;

    if (ctx.pathname.includes('/login')) {
      firstGridItem = false;
    }

    const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem };

    if (Component.getInitialProps) {
      Object.assign(pageProps, await Component.getInitialProps(ctx));
    }

    const appProps = { pageProps };

    if (getStore()) {
      return appProps;
    }

    let userObj = null;
    try {
      const { user } = await getUserApiMethod(ctx.req);
      userObj = user;
    } catch (error) {
      console.log(error);
    }

    return {
      ...appProps,
      initialState: { user: userObj, currentUrl: ctx.asPath },
    };
  }

  public componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  }

  private store: Store;

  constructor(props) {
    super(props);

    this.store = initializeStore(props.initialState);
  }

  public render() {
    const { Component, pageProps } = this.props;
    const store = this.store;

    const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;

    return (
      <ThemeProvider theme={isThemeDark ? themeDark : themeLight}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <CssBaseline />
        <Provider store={store}>
          <Component {...pageProps} store={store} />
        </Provider>
      </ThemeProvider>
    );
  }
}

export default MyApp;
```

We defined `store` using imported `initializeStore`:

```
private store: Store;

constructor(props) {
  super(props);

  this.store = initializeStore(props.initialState);
}
```

Unlike the above example, where `store` is simply one parameter (`color`), our `store` will have many more data structures.

We also added the following logic to our `App` HOC for efficiency:

```
const store = getStore();
if (store) {
  return appProps;
}
```

If `store` already exists, we simply return the page component's props.

We imported `initializeStore`, `getStore`, and `Store`. This means that we will have to define `initializeStore` and `getStore` methods, as well `Store` data structure, in a new file: `book/7-begin/app/lib/store/index.ts`.

Note that we moved `getUserApiMethod` with `ctx.req` as an argument from our `withAuth` HOC to our `App` HOC. Later in this section, we will discuss all changes that we need to make to our `withAuth` HOC.

#### store, observable, decorate [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#store-observable-decorate)

In the previous subsection, we passsed `store` to pages via our `App` HOC. We imported two methods, `getStore` and `initializeStore`, and `Store` from our `book/7-begin/app/lib/store/index.ts` file. Let's create `book/7-begin/app/lib/store/index.ts` and define these two methods and `Store`.

Defining the `Store` class will be very similar to how we already defined classes for our page components in this book. For example, we defined the `YourSettings` class like this:

```
class PageComponent extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      // initialize state object
    };
  }

  // other methods such as getInitialProps, render, etc
}
```

We defined `constructor` to initialize the `state` object for our page component, `YourSettings`.

Let's define `Store` in a similar way. In the official example from the previous subsection, `store` is as simple as one parameter: `color`. Our `store` will be more complicated. By the end of this book, our `store` will have the following data structure:

```
class Store {
  public isServer: boolean;

  public teams: IObservableArray<Team> = observable([]);

  public isLoadingTeams = false;
  public isInitialTeamsLoaded = false;

  public currentUser?: User = null;
  public currentTeam?: Team = null;
  public currentUrl = '';

  public socket: SocketIOClient.Socket;

  constructor(...);

  // some methods
}
```

However, for now, our `store` will have less data:

```
class Store {
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  constructor(...);

  // some methods
}
```

You are already familiar with `observable`. According to the `mobX` docs, in TypeScript, we have to use a decorator `@observable` in order to make data `observable`:

[https://mobx.js.org/refguide/observable.html](https://mobx.js.org/refguide/observable.html)

[https://mobx.js.org/refguide/observable-decorator.html](https://mobx.js.org/refguide/observable-decorator.html)

Redirect to checkout email and name production-ready page component API method this chapter list of posts request compiles Click on the button add environmental variable in a browser Material-UI send this response. Compiles response page component cookie request production-ready API method calls corresponding store method session show notification show notification. Material-UI withAuth HOC conditional operator show notification Google OAuth API At AWS dashboard list of posts Click on the button show notification. If truthy then send this response S3 bucket it works as expected S3 bucket server-side rendering API method calls corresponding store method in this book request was sent AWS dashboard triggers method this chapter request was sent compiles. On the client check if value is truthy We will discuss S3 bucket static method calls withAuth HOC Put it all together Team Leader subsection Next.js web application Material-UI API method calls corresponding store method AWS dashboard this chapter. Compiles S3 bucket in this book static method calls email and name triggers method request list of posts triggers method server-side rendering. Conditional operator discussion We will discuss cookie Next.js web application conditional operator Remember to add import if truthy then session At AWS dashboard this chapter. Redirect to checkout AWS dashboard list of posts Navigate to on the client We will discuss store method calls Material-UI. Email and name Navigate to Click on the button email and name cookie Next.js web application add environmental variable Navigate to withAuth HOC cookie. Team members redirect to checkout MongoDB database in a browser conditional operator open this file end user response.

So our code becomes:

```
class Store {
  @observable public isServer: boolean;

  @observable public currentUser?: User = null;
  @observable public currentUrl = '';

  constructor(...);

  // some methods
}
```

However, in this book, we chose to use a `decorate` utility that works like this:

[https://mobx.js.org/best/decorators.html](https://mobx.js.org/best/decorators.html)

So our code that looks like this:

```
import { observable, computed, action } from "mobx"

class Timer {
    @observable start = Date.now()
    @observable current = Date.now()

    @computed
    get elapsedTime() {
        return this.current - this.start + "milliseconds"
    }

    @action
    tick() {
        this.current = Date.now()
    }
}
```

Becomes this with the `decorate` utility:

```
import { observable, computed, action, decorate } from "mobx"

class Timer {
    start = Date.now()
    current = Date.now()

    get elapsedTime() {
        return this.current - this.start + "milliseconds"
    }

    tick() {
        this.current = Date.now()
    }
}
decorate(Timer, {
    start: observable,
    current: observable,
    elapsedTime: computed,
    tick: action
})
```

Our code with a `decorate` utility will look like:

```
class Store {
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  constructor(...);

  // some methods
}

decorate(Store, {
  currentUser: observable,
  currentUrl: observable,
});
```

Next, we need to set initial values for `isServer`, `currentUser`, and `currentUrl`. We do so inside `constructor`:

```
constructor({
  initialState = {},
  isServer,
}: {
  initialState?: any;
  isServer: boolean;
}) {
  this.isServer = !!isServer;

  this.setCurrentUser(initialState.user);

  this.currentUrl = initialState.currentUrl || '';
}
```

You are already familiar with usage of `this`. In this case, `this` refers to the instance of `store`. The `constructor` method takes two arguments: `initialState` object and `isServer` boolean parameter. We defined `isServer` as:

```
!!isServer
```

So if the argument that we pass has value `false`, then `this.isServer` is also `false`. Why not simply to `isServer` instead of `!!isServer`? It's because there are cases when the value of `isServer` may be `null` or `undefined`, but we want `this.isServer` to be strictly `true` or `false`. Double negation (`!!`) of `null` or `undefined` is `false`.

To populate the initial value for `this.currentUser`, we call this method:

```
this.setCurrentUser(initialState.user);
```

To populate the initial value for `this.currentUrl`, we check the `currentUrl` parameter inside the `initialState` object. If `currentUrl` does not exist, we set its value to an empty string:

```
this.currentUrl = initialState.currentUrl || '';`
```

Now we have to define our `setCurrentUser` method:

```
public async setCurrentUser(user) {
  if (user) {
    this.currentUser = new User({ store: this, ...user });

  } else {
    this.currentUser = null;
  }
}
```

Our `setCurrentUser` method accepts one argument, `user` (from `initialState.user`), and either (1) populates `this.currentUser` with User store if `user` exists or (2) sets `this.currentUser` to `null` if `user` does not exist. We have yet to define User store (class `User`) - we will do it later in this section. We already discussed the usage of `public/private` earlier in this book when working on `YourSettings` page.

Let's import all necessary functions and add the above code to our `book/7-begin/app/lib/store/index.ts` file:

```
import * as mobx from 'mobx';
import { decorate, observable, runInAction } from 'mobx';

import { User } from './user';

class Store {
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  constructor({
    initialState = {},
    isServer,
  }: {
    initialState?: any;
    isServer: boolean;
  }) {
    this.isServer = !!isServer;

    this.setCurrentUser(initialState.user);

    this.currentUrl = initialState.currentUrl || '';
  }

  public async setCurrentUser(user) {
    if (user) {
      this.currentUser = new User({ store: this, ...user });

    } else {
      this.currentUser = null;
    }
  }
}

decorate(Store, {
  currentUser: observable,
  currentUrl: observable,
});

let store: Store = null;

function initializeStore(initialState = {}) {
  // definition
}

function getStore() {
  // definition
}

export { Store, initializeStore, getStore };
```

#### initializeStore, getStore, server-side rendering, action [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#initializestore-getstore-server-side-rendering-action)

When we updated our `App` HOC, we defined `store` either by calling the `initializeStore` method (inside `App.constructor`) or by calling the `getStore` method (inside `App.getInitialProps`). However, we have not defined these methods.

When you work on a Next.js web application and want to implement some popular functionality (such as store by `mobx`), a good place to start is Next.js's examples folder:

[https://github.com/zeit/next.js/tree/canary/examples](https://github.com/zeit/next.js/tree/canary/examples)

This is a folder inside the public Next.js repo on GitHub. The folder contains dozens of examples of how to implement popular features in your Next.js application. Let's look at the example for `mobx`:

[https://github.com/zeit/next.js/tree/canary/examples/with-mobx](https://github.com/zeit/next.js/tree/canary/examples/with-mobx)

Let's look at how the authors of this example define `initializeStore` and `getStore`. At the root of the `with-mobx` folder, find the file `store.js`:

[https://github.com/zeit/next.js/blob/canary/examples/with-mobx/store.js](https://github.com/zeit/next.js/blob/canary/examples/with-mobx/store.js)

Definitions of methods from this file:

```
let store

function initializeStore(initialData = null) {
  const _store = store ?? new Store()

  // If your page has Next.js data fetching methods that use a Mobx store, it will
  // get hydrated here, check `pages/ssg.js` and `pages/ssr.js` for more details
  if (initialData) {
    _store.hydrate(initialData)
  }
  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') return _store
  // Create the store once in the client
  if (!store) store = _store

  return _store
}

export function useStore(initialState) {
  const store = useMemo(() => initializeStore(initialState), [initialState])
  return store
}
```

Since the Nullish coalescing operator `??` syntax is not yet supported by TypeScript:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish\_coalescing\_operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator)

We have to re-write it using the supported syntax:

```
const _store = (store !== null && store !== undefined) ? store : new Store();
```

In our case, the above line will be:

```
const _store =
  store !== null && store !== undefined ? store : new Store({ initialState, isServer, socket });
```

The rest of the `initializeStore` definition will pretty much be the same. We only add a `console.log` statement for debugging and educational reasons:

```
function initializeStore(initialState = {}) {
  const isServer = typeof window === 'undefined';

  const _store =
    store !== null && store !== undefined ? store : new Store({ initialState, isServer });

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
```

Inside `getStore`, we can simply return `store` that we initialized outside of both methods with:

```
let store: Store = null;
```

When an end user loads a page of our web application, the `App.constructor` method runs. As a result, `initializeStore` runs. Then `store`, if it was `null`, gets a value: `new Store({ initialState, isServer })`. The `getStore` method, which runs later, gets this `store` value. So we can define `getStore` as simply as:

```
function getStore() {
  return store;
}
```

Your `book/7-begin/app/lib/store/index.ts` file should have the following content after you make all of the above changes:

```
import * as mobx from 'mobx';
import { action, decorate, observable } from 'mobx';
import { useStaticRendering } from 'mobx-react';

import { User } from './user';

useStaticRendering(typeof window === 'undefined');

mobx.configure({ enforceActions: 'observed' });

class Store {
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  constructor({
    initialState = {},
    isServer,
  }: {
    initialState?: any;
    isServer: boolean;
  }) {
    this.isServer = !!isServer;

    this.setCurrentUser(initialState.user);

    this.currentUrl = initialState.currentUrl || '';
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
}

decorate(Store, {
  currentUser: observable,
  currentUrl: observable,

  changeCurrentUrl: action,
});

let store: Store = null;

function initializeStore(initialState = {}) {
  const isServer = typeof window === 'undefined';

  const _store =
    store !== null && store !== undefined ? store : new Store({ initialState, isServer });

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

We added two configurations: one for `mobx-react` and one for `mobx`.

The first configuration is for `mobx-react`:

```
useStaticRendering(typeof window === 'undefined');
```

We have to remember that our `APP` project is based on Next.js, so we have two types of page rendering: client-side and server-side.

For client-side rendered pages, `mobx` creates a data store (discussed earlier in the section). `mobx` creates a clone of data and holds it in the browser's memory. When an end user takes an action that causes some data change inside `store`, `mobx` compares the new value to the corresponding value inside the cloned `store`. If `mobx` detects a difference, `mobx` updates the changed value in `store`. Then, with help of `mobx-react`, the corresponding components are re-rendered automatically and reactively.

For server-side rendered pages, as you may guess, an end user cannot take any action. As you remember from previous chapters, in Next.js, pages are rendered on the server when they are loaded in a new tab on the browser. So by definition, there are no user actions, such as clicking buttons, uploading a new avatar, deleting a post, etc. The `store` gets created and deleted per request. An end user loads a page in a new browser tab, the browser sends a request to our `API` server, `mobx` creates `store` **on the server**, the page uses `store` to populate data, our `API` server renders the page with data and sends this rendered page to the browser, and finally `mobX` deletes `store`. So, as you can see, there is **no reason** for `mobx` to hold a clone of `store` in the server's memory and wait for any changes in the data inside `store`. Simply put, there are no user actions to change any data inside `store`, and `store` gets created and deleted per request.

Thus we have a setting that tells `mobx` to not occupy any memory in the case of server-side rendering. For any server-side rendered page, `typeof window === 'undefined'` is indeed `true`, giving the configuration of `useStaticRendering(true)`:

[https://github.com/mobxjs/mobx-react#server-side-rendering-with-usestaticrendering](https://github.com/mobxjs/mobx-react#server-side-rendering-with-usestaticrendering)

Offical docs say:

> When using server side rendering, normal lifecycle hooks of React components are not fired, as the components are rendered only once. Since components are never unmounted, observer components would in this case leak memory when being rendered server side. To avoid leaking memory, call useStaticRendering(true) when using server side rendering.

In our situation, "leaking memory" refers to `mobX` occupying our `API` server's memory for no good reason.

Back to the configurations we added. The second one is for `mobx`:

```
mobx.configure({ enforceActions: 'observed' });
```

Official docs:

[https://mobx.js.org/refguide/api.html#enforceactions](https://mobx.js.org/refguide/api.html#enforceactions)

> "observed": All state that is observed somewhere needs to be changed through actions. This is the recommended strictness mode in non-trivial applications.

Check up your `book/7-begin/app/lib/store/index.ts` file and find this line:

```
changeCurrentUrl: action,
```

We already discussed the definition of `observable`. Most data inside `store` is `observable`. But we specified `changeCurrentUrl` to be an `action` instead of an `observable`. In `mobx`, an action is anything that modifies an application's state. So in our case, anything that modifies `store` and other data stores that we will introduce later. In other words, calling `this.props.store.changeCurrentUrl` will modify `store`. It will modify `this.currentUrl`:

```
public changeCurrentUrl(url: string) {
  this.currentUrl = url;
}
```

`observed` configuration means that only calling `changeCurrentUrl` can modify the value `currentUrl` inside the store.

We will discuss later why we need `currentUrl`.

___

#### Data store for User [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#data-store-for-user)

At this point, we updated our `App` HOC and defined `store` so that on any page of our web application, we can access `this.props.store`. By the end of this section, our goal is populate the `user` object on the `YourSettings` page by using `this.props.store.currentUser`. Let's see how we get this value. Open `book/7-begin/app/lib/store/index.ts` and find this line:

```
this.currentUser = new User({ store: this, ...user });
```

So `store.currentUser` gets its value by calling `User`, which is the User data store that we have not defined yet. As you may already notice, we will save all data stores inside the `book/7-begin/app/lib/store/*` folder. Since we just created data store for `store`, we simply follow the code structure from `book/7-begin/app/lib/store/index.ts` and create a new file, `book/7-begin/app/lib/store/user.ts`, with the following content:

```
import { action, decorate, observable, runInAction } from 'mobx';

import { updateProfileApiMethod } from '../api/team-member';
import { Store } from './index';

class User {
  public store: Store;

  public _id: string;
  public slug: string;
  public email: string | null;
  public displayName: string | null;
  public avatarUrl: string | null;
  public isSignedupViaGoogle: boolean;

  constructor(params) {
    this.store = params.store;
    this._id = params._id;
    this.slug = params.slug;
    this.email = params.email;
    this.displayName = params.displayName;
    this.avatarUrl = params.avatarUrl;
    this.isSignedupViaGoogle = !!params.isSignedupViaGoogle;
  }

  public async updateProfile({ name, avatarUrl }: { name: string; avatarUrl: string }) {
    const { updatedUser } = await updateProfileApiMethod({
      name,
      avatarUrl,
    });

    runInAction(() => {
      this.displayName = updatedUser.displayName;
      this.avatarUrl = updatedUser.avatarUrl;
      this.slug = updatedUser.slug;
    });
  }

}

decorate(User, {
  slug: observable,
  email: observable,
  displayName: observable,
  avatarUrl: observable,

  updateProfile: action,
});

export { User };
```

The above code for user store does not need much explanation, since we created data store for `store` in the previous subsection. A few decisions are worth explaining:

-   We moved the API method, `updateProfileApiMethod`, from `book/7-begin/app/lib/api/public.ts` to `book/7-begin/app/lib/api/team-member.ts`. We did this because updating a user profile is not really a public API - it's an API for logged-in users. Similar to the API for uploading a file.
    
-   It's important to note that we create a new data store for User. We used `store` as an argument, like this:
    
    ```
      this.currentUser = new User({ store: this, ...user });
    ```
    
    And indeed we define `store` inside data store for User:
    
    ```
      class User {
        public store: Store;
        // some other parameters and methods
      }
    ```
    
    You may ask why ne need to have `store` available as `this.props.store.currentUser.store` on these pages. In the case of data store for User, we don't. However, later in this chapter, we will introduce data stores for other data models, such as Post and Discussion. For data stores of these new data models, we will indeed use `this.props.store.currentModel.store`. So we added `store` to the data store for User simply as a consistency measure - to be consistent with other data stores in our web application.
    
-   You may notice a new method that we never called before in this book:
    
    ```
      runInAction(() => {
        this.displayName = updatedUser.displayName;
        this.avatarUrl = updatedUser.avatarUrl;
        this.slug = updatedUser.slug;
      });
    ```
    
    `runInAction(f)` is [syntactic sugar](https://en.wikipedia.org/wiki/Syntactic_sugar) for `action(f)()`. `mobx` requires us to wrap functions that modify state with `action(f)()`. By doing so, we make sure that intermediate or incomplete data is not available throughout the application until an action has finished. Example of `runInAction(f)` usage from official docs:
    
    [https://mobx.js.org/best/actions.html#async-await](https://mobx.js.org/best/actions.html#async-await)
    
    ```
      mobx.configure({ enforceActions: "observed" })
    
      class Store {
          @observable githubProjects = []
          @observable state = "pending" // "pending" / "done" / "error"
    
          @action
          async fetchProjects() {
              this.githubProjects = []
              this.state = "pending"
              try {
                  const projects = await fetchGithubProjectsSomehow()
                  const filteredProjects = somePreprocessing(projects)
                  // after await, modifying state again, needs an actions:
                  runInAction(() => {
                      this.state = "done"
                      this.githubProjects = filteredProjects
                  })
              } catch (error) {
                  runInAction(() => {
                      this.state = "error"
                  })
              }
          }
      }
    ```
    
    As you can see, `mobx` prescribes us to wrap and group all state-modifying actions with `runInAction` at the end of the `@action` function. Note that our code does not use `@action` and `@observer`, since we opted to use the `decorate` utility that we discussed in the previous subsection.
    
-   Another part of code that is important to discuss is the `constructor` method:
    
    ```
      constructor(params) {
        this.store = params.store;
        this._id = params._id;
        this.slug = params.slug;
        this.email = params.email;
        this.displayName = params.displayName;
        this.avatarUrl = params.avatarUrl;
        this.isSignedupViaGoogle = !!params.isSignedupViaGoogle;
      }
    ```
    
    Where does the `params` argument come from? For example, how does the value for `params.displayName` get populated? The `params` object gets populated with this line of code from `book/7-begin/app/lib/store/index.ts`:
    
    ```
      this.setCurrentUser(initialState.user);
    ```
    
    Definition of `setCurrentUser`:
    
    ```
      public async setCurrentUser(user) {
        if (user) {
          this.currentUser = new User({ store: this, ...user });
    
        } else {
          this.currentUser = null;
        }
      }
    ```
    
    And `initialState.user` gets populated by the `App.getInitialProps` method in `book/7-begin/app/pages/_app.tsx`.
    

Before we can implement our new store infrastructure, we need to update the way we get the user object inside:

-   `withAuth` HOC
-   `YourSettings` page

Our goal is retrieve the user object from `store.currentUser` for both `withAuth` HOC and `YourSettings` page.

___

#### Updating withAuth HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-withauth-hoc)

This is how our `withAuth` HOC looks now:

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

We call the `getUserApiMethod` API method inside the `WithAuth.getInitialProps` method to get the user object. Then we run all redirect logic, and the end user either gets redirected to the `YourSettings` or `Login` page depending on the value of the user object. After we updated our `App` HOC, we decided that it is more appropriate to call `getUserApiMethod` inside `App.getInitialProps`. That means the goal for our `withAuth` HOC is to remove the `getInitialProps` method and get the user object from `store.currentUser`.

Google OAuth API it works as expected API method withAuth HOC store method calls At AWS dashboard session list of posts if truthy then cookie Click on the button decorate method with action decorate method with action team members. MongoDB database if truthy then this chapter Next.js web application Remember to add import AWS dashboard check if value is truthy Navigate to. You already learned session static method calls page component data model subsection team members server-side rendering add environmental variable withAuth HOC You already learned HTTP. Subsection on server only triggers method subsection response request was sent server-side rendering request was sent show notification. We will discuss API method At AWS dashboard server-side rendering discussion conditional operator if truthy then add environmental variable compiles. Remember to add import in production production-ready static method calls this chapter server-side rendering Remember to add import team members S3 bucket. Discussion At AWS dashboard Put it all together Click on the button new Express route check if value is truthy request store method calls MongoDB database Navigate to this chapter discussion in a browser Put it all together cookie. Production-ready server-side rendering Google OAuth API triggers method send this response request add environmental variable Navigate to data model on server only on the client mount middleware. Show notification AWS dashboard email and name Put it all together this chapter conditional operator discussion data model in this book. Conditional operator store method calls session decorate method with action request withAuth HOC API method calls corresponding store method Next.js web application request page component Team Leader.

We can remove:

```
const { user } = await getUserApiMethod({ headers });
```

And write something like this:

```
const store = getStore();
const user = store.currentUser;
```

Now the question is where/when to get `store`. If we put the above code snippet inside `WithAuth.getInitialProps`, we will find that `store` is `null`. Why is that? That's because the `WithAuth.getInitialProps` method gets called **before** `MyApp.constructor`, and `MyApp.constructor` populates `store`:

```
constructor(props) {
  super(props);

  this.store = initializeStore(props.initialState);
}
```

In other words, if we get `store` inside `WithAuth.getInitialProps`, its value will always be `null`. Later, when we test our new store infrastructure, we can use `console.log` statements to see the order of execution. In general, adding `console.log` statement is a powerful way to determine the execution order.

We could access `store` inside `WithAuth.componentDidMount` that runs **after** `MyApp.constructor`. Since it runs after `MyApp.constructor`, we can access `store` like this:

```
const { store } = this.props;
const user = store.currentUser;
```

After adding the above code block and redirect logic that we already have inside `withAuth`, we get:

```
public componentDidMount() {
  const { store } = this.props;
  const user = store.currentUser;

  if (loginRequired && !logoutRequired && !user) {
    Router.push('/login');
    return;
  }

  let redirectUrl = '/login';
  let asUrl = '/login';
  if (user) {
    redirectUrl = `/your-settings`;
    asUrl = `/your-settings`;
  }

  if (logoutRequired && user) {
    Router.push(redirectUrl, asUrl);
  }
}
```

Also, we need to update the way we get the `user` object inside the `WithAuth.render` method:

```
public render() {
  const { store } = this.props;
  const user = store.currentUser;

  if (loginRequired && !logoutRequired && !user) {
    return null;
  }

  if (logoutRequired && user) {
    return null;
  }

  return <Component {...this.props} />;
}
```

After these two changes, an updated version of our `withAuth` HOC will look like this:

```
import { observer } from 'mobx-react';
import Router from 'next/router';
import React from 'react';

import * as NProgress from 'nprogress';

import { Store } from './store';

Router.events.on('routeChangeStart', () => {
  NProgress.start();
});

Router.events.on('routeChangeComplete', () => {
  NProgress.done();
});

Router.events.on('routeChangeError', () => NProgress.done());

export default function withAuth(Component, { loginRequired = true, logoutRequired = false } = {}) {
  class WithAuth extends React.Component<{ store: Store }> {
    public static async getInitialProps(ctx) {
      const { req } = ctx;

      let pageComponentProps = {};

      if (Component.getInitialProps) {
        pageComponentProps = await Component.getInitialProps(ctx);
      }

      return {
        ...pageComponentProps,
        isServer: !!req,
      };
    }

    public componentDidMount() {
      const { store } = this.props;
      const user = store.currentUser;

      if (loginRequired && !logoutRequired && !user) {
        Router.push('/login');
        return;
      }

      let redirectUrl = '/login';
      let asUrl = '/login';
      if (user) {
        redirectUrl = `/your-settings`;
        asUrl = `/your-settings`;
      }

      if (logoutRequired && user) {
        Router.push(redirectUrl, asUrl);
      }
    }

    public render() {
      const { store } = this.props;
      const user = store.currentUser;

      if (loginRequired && !logoutRequired && !user) {
        return null;
      }

      if (logoutRequired && user) {
        return null;
      }

      return <Component {...this.props} />;
    }
  }

  return observer(WithAuth);
}
```

Note that for a component to re-render automatically and reactively when its corresponding data changes, it has to wrapped by the `observer` HOC.

#### Update YouSettings page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#update-yousettings-page)

In this subsection, we will change the way we get the user object on the `YourSettings` page. The task is similar to what we did in the previous subsection. Our goal is to access the user object using the store object.

Open `book/7-begin/app/pages/your-settings.tsx` and make following changes.

-   Find this block:
    
    ```
      type Props = {
        isMobile: boolean;
        user: { email: string; displayName: string; slug: string; avatarUrl: string };
      };
    ```
    
    Replace it with:
    
    ```
      type Props = { isMobile: boolean; store: Store };
    ```
    
-   Find this block:
    
    ```
      this.state = {
        newName: this.props.user.displayName,
        newAvatarUrl: this.props.user.avatarUrl,
        disabled: false,
      };
    ```
    
    Replace it with:
    
    ```
      this.state = {
        newName: this.props.store.currentUser.displayName,
        newAvatarUrl: this.props.store.currentUser.avatarUrl,
        disabled: false,
      };
    ```
    
-   Find this line:
    
    ```
      const { user } = this.props;
    ```
    
    Replace it with a new line:
    
    ```
      const { currentUser } = this.props.store;
    ```
    
-   Change:
    
    ```
      <ul>
        <li>
          Your email: <b>{user.email}</b>
        </li>
        <li>
          Your name: <b>{user.displayName}</b>
        </li>
      </ul>
    ```
    
    To:
    
    ```
      <div>
        <i
          className="material-icons"
          color="action"
          style={{ verticalAlign: 'text-bottom' }}
        >
          done
        </i>{' '}
        {currentUser.isSignedupViaGoogle
          ? 'You signed up on Async using your Google account.'
          : 'You signed up on Async using your email.'}
        <p />
        <li>
          Your email: <b>{currentUser.email}</b>
        </li>
        <li>
          Your name: <b>{currentUser.displayName}</b>
        </li>
      </div>
    ```
    
-   Change this line:
    
    ```
      const { user } = this.props;
    ```
    
    To:
    
    ```
      const { currentUser } = this.props.store;
    ```
    
-   Add the following line to the `onSubmit` method:
    
    ```
      const { currentUser } = this.props.store;
    ```
    
-   Inside `onSubmit`, change how you call the `updateProfileApiMethod` API method:
    
    ```
      await updateProfileApiMethod({
        name: this.state.newName,
        avatarUrl: this.state.newAvatarUrl,
      });
    ```
    
    Change it to:
    
    ```
      await currentUser.updateProfile({ name: newName, avatarUrl: newAvatarUrl });
    ```
    
-   Replace the hardcoded `prefix` value
    
    ```
      const prefix = 'team-builder-book';
    ```
    
    With the user-specific value:
    
    ```
      const prefix = `${currentUser.slug}`;
    ```
    
-   Change how you call `updateProfileApiMethod` inside the `uploadFile` method:
    
    ```
      await updateProfileApiMethod({
        name: this.state.newName,
        avatarUrl: this.state.newAvatarUrl,
      });
    ```
    
    Change it to:
    
    ```
      await currentUser.updateProfile({
        name: this.state.newName,
        avatarUrl: this.state.newAvatarUrl,
      });
    ```
    
-   Remember to wrap the `YourSettings` page component with the `observer` HOC.
    

After all changes, the content of `book/7-begin/app/pages/your-settings.tsx` should be:

```
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { observer } from 'mobx-react';
import Head from 'next/head';
import NProgress from 'nprogress';
import * as React from 'react';

import Layout from '../components/layout';

import {
  getSignedRequestForUploadApiMethod,
  uploadFileUsingSignedPutRequestApiMethod,
} from '../lib/api/team-member';

import notify from '../lib/notify';
import { resizeImage } from '../lib/resizeImage';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

type Props = { isMobile: boolean; store: Store };

type State = { newName: string; newAvatarUrl: string; disabled: boolean };

class YourSettings extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      newName: this.props.store.currentUser.displayName,
      newAvatarUrl: this.props.store.currentUser.avatarUrl,
      disabled: false,
    };
  }

  public render() {
    const { currentUser } = this.props.store;
    const { newName, newAvatarUrl } = this.state;

    return (
      <Layout {...this.props}>
        <Head>
          <title>Your Settings at Async</title>
          <meta name="description" content="description" />
        </Head>
        <div
          style={{
            padding: this.props.isMobile ? '0px' : '0px 30px',
            height: '100%',
          }}
        >
          <h3>Your Settings</h3>
          <h4 style={{ marginTop: '40px' }}>Your account</h4>
          <div>
            <i
              className="material-icons"
              color="action"
              style={{ verticalAlign: 'text-bottom' }}
            >
              done
            </i>{' '}
            {currentUser.isSignedupViaGoogle
              ? 'You signed up on Async using your Google account.'
              : 'You signed up on Async using your email.'}
            <p />
            <li>
              Your email: <b>{currentUser.email}</b>
            </li>
            <li>
              Your name: <b>{currentUser.displayName}</b>
            </li>
          </div>
          <form onSubmit={this.onSubmit} autoComplete="off">
            <h4>Your name</h4>
            <TextField
              autoComplete="off"
              value={newName}
              helperText="Your username as seen by your team members"
              onChange={(event) => {
                this.setState({ newName: event.target.value });
              }}
            />
            <br />
            <br />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={this.state.disabled}
            >
              Update username
            </Button>
          </form>

          <br />
          <h4>Your photo</h4>
          <Avatar
            src={newAvatarUrl}
            style={{
              display: 'inline-flex',
              verticalAlign: 'middle',
              marginRight: 20,
              width: 60,
              height: 60,
            }}
          />
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
          <p />
          <br />
        </div>
      </Layout>
    );
  }

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { currentUser } = this.props.store;

    const { newName, newAvatarUrl } = this.state;

    console.log(newName);

    if (!newName) {
      notify('Name is required');
      return;
    }

    NProgress.start();
    this.setState({ disabled: true });

    try {
      await currentUser.updateProfile({ name: newName, avatarUrl: newAvatarUrl });

      notify('You successfully updated your profile.');
    } catch (error) {
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };

  private uploadFile = async () => {
    const fileElement = document.getElementById('upload-file-user-avatar') as HTMLFormElement;
    const file = fileElement.files[0];

    const { currentUser } = this.props.store;

    if (file == null) {
      notify('No file selected for upload.');
      return;
    }

    const fileName = file.name;
    const fileType = file.type;

    NProgress.start();
    this.setState({ disabled: true });

    const bucket = process.env.BUCKET_FOR_AVATARS;

    const prefix = `${currentUser.slug}`;

    try {
      const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
        fileName,
        fileType,
        prefix,
        bucket,
      });

      const resizedFile = await resizeImage(file, 128, 128);

      console.log(file);
      console.log(resizedFile);

      await uploadFileUsingSignedPutRequestApiMethod(
        resizedFile,
        responseFromApiServerForUpload.signedRequest,
        { 'Cache-Control': 'max-age=2592000' },
      );

      this.setState({
        newAvatarUrl: responseFromApiServerForUpload.url,
      });

      await currentUser.updateProfile({
        name: this.state.newName,
        avatarUrl: this.state.newAvatarUrl,
      });

      notify('You successfully uploaded new avatar.');
    } catch (error) {
      notify(error);
    } finally {
      fileElement.value = '';
      this.setState({ disabled: false });
      NProgress.done();
    }
  };
}

export default withAuth(observer(YourSettings));
```

#### Testing store infrastructure [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-store-infrastructure)

We are ready to test whether our infrastructure indeed works as expected.

Triggers method add environmental variable production-ready static method calls production-ready redirect to checkout request was sent decorate method with action. Add environmental variable mount middleware mount middleware Google OAuth API static method calls response on server only check if value is truthy withAuth HOC session mount middleware request was sent team members in this book. AWS dashboard Navigate to decorate method with action session subsection check if value is truthy request was sent static method calls subsection cookie Remember to add import show notification. Triggers method end user MongoDB database static method calls Material-UI Next.js web application email and name S3 bucket check if value is truthy check if value is truthy request Remember to add import end user. Discussion Click on the button Team Leader decorate method with action if truthy then static method calls page component API method calls corresponding store method MongoDB database on the client API method. Remember to add import session MongoDB database production-ready production-ready conditional operator API method store method calls AWS dashboard API method add environmental variable Navigate to triggers method. Send this response discussion in this book page component triggers method. Google OAuth API email and name if truthy then At AWS dashboard if truthy then Next.js web application check if value is truthy withAuth HOC production-ready. Decorate method with action server-side rendering session send this response API infrastructure. Response At AWS dashboard cookie We will discuss add environmental variable request on the client list of posts You already learned session Put it all together conditional operator in production compiles session.

Before we start `APP` and `API` projects, let's add a few `console.log` statements.

Open `book/7-begin/app/lib/withAuth.tsx`. Add two `console.log` statements like so:

```
public static async getInitialProps(ctx) {
  console.log('WithAuth.getInitialProps');

  const { req } = ctx;

  let pageComponentProps = {};

  if (Component.getInitialProps) {
    pageComponentProps = await Component.getInitialProps(ctx);
  }

  return {
    ...pageComponentProps,
    isServer: !!req,
  };
}

public componentDidMount() {
  console.log('WithAuth.componentDidMount');

  const { store } = this.props;
  const user = store.currentUser;

  if (loginRequired && !logoutRequired && !user) {
    Router.push('/login');
    return;
  }

  let redirectUrl = '/login';
  let asUrl = '/login';
  if (user) {
    redirectUrl = `/your-settings`;
    asUrl = `/your-settings`;
  }

  if (logoutRequired && user) {
    Router.push(redirectUrl, asUrl);
  }
}
```

Open `book/7-begin/app/pages/_app.tsx`. Add one `console.log` statement like this:

```
constructor(props) {
  console.log('MyApp.constructor');

  super(props);

  this.store = initializeStore(props.initialState);
}
```

Also remember, if everything works as it should in the browser console, we should see `store` data as a store object because of this statement inside `book/7-begin/app/lib/store/index.ts` :

```
console.log(_store);
```

And we should see the User data store object because of this statement inside `book/7-begin/app/pages/_app.tsx`:

```
console.log(store.currentUser);
```

Let's comment out `console.log(url)` inside `book/7-begin/app/components/common/LoginButton.tsx`, to avoid unnecessary outputs on the browser console for now:

```
// console.log(url);
```

Let's start both `APP` and `API` projects with `yarn dev`.

Make sure you are logged out.

Navigate to the `Login` page. Open the browser console. If you are using Chrome, press `Ctrl + Shift + J` to open `Chrome Dev Tools`, then click on the `Console` tab.

This is view of the `Login` page and browser console:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-28+08-19-1.png)

As you can see from the browser console, `MyApp.constructor` indeed executes before `WithAuth.componentDidMount`.

After `MyApp.constructor` runs, data store `Store` has a value:

```
{isServer: false, currentUser: null, currentUrl: "/login"}
```

Data store for `User` is `null`.

An interesting observation: `isServer: false` although we loaded the `Login` page into a new tab, meaning the page is server-side rendered. The `Login` page is indeed rendered on the `API` server but `initializeStore` runs on both browser and server. To prove that this is true, open `book/7-begin/app/lib/store/index.ts`. Add `console.log(_store);` like so:

```
function initializeStore(initialState = {}) {
  const isServer = typeof window === 'undefined';

  const _store = (store !== null && store !== undefined) ? store : new Store({ initialState, isServer });

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') {
    console.log(_store);
    return _store
  }
  // Create the store once in the client
  if (!store) {
    store = _store
  }

  console.log(_store);

  return _store
}
```

Now, compare the `Store` value from the browser console to the value from your terminal output (`APP` server logs):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-28+08-33-44.png)

As you can see, the value is:

```
{isServer: true, currentUser: null, currentUrl: "/login"}
```

Indeed, `initializeStore` runs on both browser and server. A server-side rendered page uses data from the server-side `store`.

As you can see from our `APP` server's logs, `WithAuth.getInitialProps` indeed executes before `MyApp.constructor`. This means we made a good decision moving `getStore` from our `WithAuth.getInitialProps` method to `WithAuth.componentDidMount`.

Next, let's populate the `User` data store. To do so, we need to log in to our web application. Log in using your Google account. You will be redirected to the `YourSettings` page, and the browser console will have:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-28+08-43-35.png)

Now both `Store` and `User` data stores have proper, expected values! What's cool is that user data on the `YourSettings` page comes from `this.props.store.currentUser`. Any page of our web application has access to `this.props.store` to access any data! This will save you a lot of development time!

Besides accessing `store` on any page (and any non-page component as well), what other benefits did we gain? Let's test out if we indeed gain automatic and reactive reloading of components when corresponding data changes. Open `YourSettings` page and update the value for `Your name`. We chose to change our name from `Team Builder Book` to `Team BB`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-28+08-54-47.png)

You will see that data displayed by this element indeed gets updated reactively!

```
<li>
  Your name: <b>{currentUser.displayName}</b>
</li>
```

Store method `updateProfile` changes the value for `displayName` (file `book/7-begin/app/lib/store/user.ts`):

```
public async updateProfile({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  const { updatedUser } = await updateProfileApiMethod({
    name,
    avatarUrl,
  });

  runInAction(() => {
    this.displayName = updatedUser.displayName;
    this.avatarUrl = updatedUser.avatarUrl;
    this.slug = updatedUser.slug;
  });
}
```

`mobx` and `mobx-react` detect this change in `store.currentUser.displayName` and re-render the `YourSetting` page with updated data.

Phew, good job if you got this far!

In the next subsection, we will add a new API infrastructure: "toggle theme API".

## Toggle theme API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#toggle-theme-api)

In the previous section, we added a store infrastructure that improves developer productivity with data stores that are accessible in any component and allow for reactive re-rendering of components when data changes.

In this section, we can practice adding a new API to our web application with store infrastructure. We will implement a "toggle theme API" that allows an end user to switch between dark and light themes in our web application. We are not discussing the benefits of offering a dark theme, but if your customers spend many hours staring at their computer screens, you might want a dark theme option.

At this point in the book, you have already built at least half a dozen API infrastructures. The toggle theme API should work like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Toggle+theme+API.png)

Typically in this book, when we build a new API infrastructure, we start from server-side. We typically work on our `API` project first, then implement code in our `APP` project. In this subsection, we can practice implementing a new API infrastructure in the opposite order. We will start with our `APP` project and then work on our `API` project.

We are not starting completely from scratch. In Chapter 2, we briefly discussed dark theme. When we created Material-UI's theme, we created `themeDark` and `themeLight`. Open `book/7-begin/app/lib/theme.ts` to remember how we did it:

```
import { createMuiTheme } from '@material-ui/core/styles';

const themeDark = createMuiTheme({
  palette: {
    primary: { main: '#238636' },
    secondary: { main: '#b62324' },
    type: 'dark',
    background: { default: '#0d1117' },
    text: {
      primary: '#c9d1d9',
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
});

const themeLight = createMuiTheme({
  palette: {
    primary: { main: '#238636' },
    secondary: { main: '#b62324' },
    type: 'light',
    background: { default: '#fff' },
    text: {
      primary: '#222',
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
});

export { themeDark, themeLight };
```

Also, in the previous section, we replaced this hardcoded logic:

```
theme={false ? themeDark : themeLight}
```

With proper logic that uses the `darkTheme` value from our `User` data store, `store.currentUser`:

```
theme={isThemeDark ? themeDark : themeLight}
```

We defined `isThemeDark` inside `MyApp.render` method as:

```
const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;
```

Meaning when user is logged out and `currentUser` is `null`, pages, such as `Login` page, will have dark theme. If user is logged in, theme will match value of `store.currentUser.darkTheme`, theme can be either dark or light.

Open up `book/7-begin/app/pages/_app.tsx` and find this block of code:

```
<ThemeProvider theme={isThemeDark ? themeDark : themeLight}>
  <CssBaseline />
  <Provider store={store}>
    <Component {...pageProps} store={store} />
  </Provider>
</ThemeProvider>
```

Finally, we already added proper logic for our product's logo; however the `isThemeDark` value is still hardcoded inside `Layout` (we assigned `false` value to it). Instead hardcoding value for `isThemeDark` we want to access value of `store.currentUser.darkTheme` and assign its value to `isThemeDark`.

#### Layout [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#layout)

We want an end user to be able to click an icon on any page of our application to switch between light and dark themes. Instead of adding this icon to every page, we can add it only once to the `Layout` component, which is a higher-order component.

Our goal is to get the value of `isThemeDark` from `store.currentUser.darkTheme` instead of hardcoding it:

```
const isThemeDark = false;
```

We will make multiple changes to our `book/7-begin/app/components/layout/index.tsx` file:

-   Import `Store` type:
    
    ```
      import { Store } from '../../lib/store';
    ```
    
-   Define `store` type in `Layout`'s props:
    
    ```
      type Props = {
        firstGridItem?: boolean;
        children: React.ReactNode;
        isMobile?: boolean;
        store?: Store;
      };
    ```
    
-   Get `store` from `this.props.store`. Get `darkTheme` from `store.currentUser`:
    
    ```
      const { firstGridItem, children, isMobile, store } = this.props;
    
      const { currentUser } = store;
    
      const isThemeDark = currentUser && currentUser.darkTheme === true;
    ```
    
    If `currentUser.darkTheme` has a value of `true`, then the value for `isThemeDark` is `true`.
    
    If `currentUser.darkTheme` has a value of `false`, then the value for `isThemeDark` is `false`.
    
-   Replace:
    
    ```
      {isMobile ? <hr /> : null}
    ```
    
    With:
    
    ```
      <div>
        {isMobile ? null : (
          <React.Fragment>
            <i
              style={{
                float: 'left',
                margin: '15px 0px 10px 25px',
                opacity: 0.8,
                fontSize: '18px',
                cursor: 'pointer',
                verticalAlign: 'top',
              }}
              className="material-icons"
              onClick={async () => {
                await store.currentUser.toggleTheme(!store.currentUser.darkTheme);
              }}
            >
              lens
            </i>
          </React.Fragment>
        )}
        <div style={{ clear: 'both' }} />
      </div>
    ```
    
    We used `React.Fragment`, because it lets you wrap child elements without adding an extra node, such as `div`, to the DOM:
    
    [https://reactjs.org/docs/fragments.html](https://reactjs.org/docs/fragments.html)
    
    We don't want to show our icon on mobile browsers, since the UI is already overly crowded on mobile browsers. That's why we used the conditional operator (which we introduced in Chapter 2) to **not** render our icon on mobile browsers.
    
    When an end user clicks on our icon, we call:
    
    ```
      store.currentUser.toggleTheme(!store.currentUser.darkTheme);
    ```
    
    We could have defined some new method for `Layout` in addition to `render`. Within that new method, we could have called the Store method `store.currentUser.toggleTheme`, similar to how we defined `onSubmit` and `uploadFile` methods for the `YourSettings` component. If we did, we would have had more readable code. But for educational purpose, we showed an alternative way and created an anonymous asynchronous function:
    
    ```
      onClick={async () => {
        await store.currentUser.toggleTheme(!store.currentUser.darkTheme);
      }}
    ```
    
    Since an end user switches between themes by clicking on the icon, we have `!` in front of `store.currentUser.darkTheme`.
    

#### Store method toggleTheme [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#store-method-toggletheme)

When an end user clicks the icon, our web applications calls `store.currentUser.toggleTheme`. We have not defined this method. Let's define the Store method `toggleTheme` for our `User` data store.

Open `book/7-begin/app/lib/store/user.ts`. Define the `darkTheme` property and `toggleTheme` method like this:

```
import { action, decorate, observable, runInAction } from 'mobx';

import { toggleThemeApiMethod, updateProfileApiMethod } from '../api/team-member';
import { Store } from './index';

class User {
  public store: Store;

  public _id: string;
  public slug: string;
  public email: string | null;
  public displayName: string | null;
  public avatarUrl: string | null;
  public isSignedupViaGoogle: boolean;

  public darkTheme = false;

  constructor(params) {
    this.store = params.store;
    this._id = params._id;
    this.slug = params.slug;
    this.email = params.email;
    this.displayName = params.displayName;
    this.avatarUrl = params.avatarUrl;
    this.isSignedupViaGoogle = !!params.isSignedupViaGoogle;
    this.darkTheme = !!params.darkTheme;
  }

  public async updateProfile({ name, avatarUrl }: { name: string; avatarUrl: string }) {
    const { updatedUser } = await updateProfileApiMethod({
      name,
      avatarUrl,
    });

    runInAction(() => {
      this.displayName = updatedUser.displayName;
      this.avatarUrl = updatedUser.avatarUrl;
      this.slug = updatedUser.slug;
    });
  }

  public async toggleTheme(darkTheme: boolean) {
    await toggleThemeApiMethod({ darkTheme });
    runInAction(() => {
      this.darkTheme = darkTheme;
    });
    window.location.reload();
  }
}

decorate(User, {
  slug: observable,
  email: observable,
  displayName: observable,
  avatarUrl: observable,
  darkTheme: observable,

  updateProfile: action,
  toggleTheme: action,
});

export { User };
```

The above code should be mostly self-explanatory. We added a new `observable`: `darkTheme`. It has a default value of `false`. We added a new `action`: `toggleTheme`. We imported and used the `toggleThemeApiMethod` API method from `book/7-begin/app/lib/api/team-member.ts`. We have yet to define this `toggleThemeApiMethod` API method.

After experimenting, we found that `mobx` and `mobx-react` do not reactively re-render `ThemeProvider` from Material-UI when the value for `theme` changes:

```
<ThemeProvider theme={isThemeDark ? themeDark : themeLight}>
  <CssBaseline />
  <Provider store={store}>
    <Component {...pageProps} store={store} />
  </Provider>
</ThemeProvider>
```

So the only way to implement a theme switch is to reload the browser tab with `window.location.reload()`:

[https://developer.mozilla.org/en-US/docs/Web/API/Location/reload](https://developer.mozilla.org/en-US/docs/Web/API/Location/reload)

Reloading the tab, as you know by now, makes a page render on the server with the dark theme's styles.

Let's make a few improvements to the `toggleTheme` store method. Open `book/7-begin/app/lib/store/user.ts` and import:

```
import * as NProgress from 'nprogress';
```

Then use it like so:

```
public async toggleTheme(darkTheme: boolean) {
  await toggleThemeApiMethod({ darkTheme });
  runInAction(() => {
    this.darkTheme = darkTheme;
  });
  NProgress.start();
  NProgress.set(0.5);
  window.location.reload();
}
```

Also comment out line with `darkTheme: observable,` inside `book/7-begin/app/lib/store/user.ts` file.

These changes will ensure that end user, who clicks material icon `lens`, sees progress bar before page reloads and also eliminates any unnecessary flash of style before page reloads. In Chapter 8, we will define `DiscussionList` and `DiscussionListItem` components. Inside them, we will define `isThemeDark` variable like this:

```
const isThemeDark = store && store.currentUser && store.currentUser.darkTheme === true;
```

Then we will use `isThemeDark` to conditionally style some elements. If line `darkTheme: observable,` is not commented out, clicking on `lens` will changes styles prematurely and unnecessary before page reloads (due to `mobx` reactivity). Thus commenting out this line solves this flash of style behavior.

#### toggleThemeApiMethod API method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#togglethemeapimethod-api-method)

The `toggleThemeApiMethod` method is very similar in structure to the `updateProfileApiMethod` method:

```
export const updateProfileApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/user/update-profile`, {
    body: JSON.stringify(data),
  });
```

Open `book/7-begin/app/lib/api/team-member.ts`, and let's define the `toggleThemeApiMethod` API method:

```
export const toggleThemeApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/user/toggle-theme`, {
    body: JSON.stringify(data),
  });
```

As you can see, the method sends a request via `POST` (default value) from `APP` to `API`. `data` is `{ darkTheme }`, an object with one boolean parameter. The API endpoint is `/user/toggle-theme`. We have yet to define the corresponding Express route in our `API` project.

#### Express route /user/toggle-theme [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-route-user-toggle-theme)

Let's look at the existing Express route `/user/update-profile`:

```
router.post('/user/update-profile', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    const updatedUser = await User.updateProfile({
      userId: req.user.id,
      name,
      avatarUrl,
    });

    res.json({ updatedUser });
  } catch (err) {
    next(err);
  }
});
```

The Express route `/user/toggle-theme` is similar in structure:

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

We have yet to define the static method `User.toggleTheme`.

Add the above new Express route to your `book/7-begin/api/server/api/team-member.ts` file.

#### Static method toggleTheme [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#static-method-toggletheme)

Let's define the static method `toggleTheme` for User ourmodel.

Open `book/7-begin/api/server/models/User.ts`:

-   Define types:
    
    ```
      toggleTheme({ userId, darkTheme }: { userId: string; darkTheme: boolean }): Promise<void>;
    ```
    
-   Define method:
    
    ```
      public static toggleTheme({ userId, darkTheme }) {
        return this.updateOne({ _id: userId }, { darkTheme: !!darkTheme });
      }
    ```
    
    The static method `toggleTheme` uses only one Mongoose API method: `Model.updateOne`. You are already familiar with `Model.updateOne`. We used it earlier in this book when defining the static method `signInOrSignUpViaGoogle`. We also discussed the usage of `!!` when defining `store.isServer`. `toggleTheme` finds a user document by id in our MongoDB database and updates the value of the `darkTheme` field.
    

#### Testing toggle theme API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-toggle-theme-api)

We are ready to test!

Before we test, as always, let's think if it would be useful to add any `console.log` statements. Let's add `console.log(this.props.store.currentUser.darkTheme);` to `book/7-begin/app/components/layout/index.tsx` like so:

```
// some code

const { firstGridItem, children, isMobile, store } = this.props;

const { currentUser } = store;

console.log(this.props.store.currentUser.darkTheme);

// some code
```

Let's also open our MongoDB Atlas dashboard, go to `Cluster0`, and click on `Collection`. Inside the `test` database, find the `users` collection - you should have a user document that has **no** `darkTheme` field:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-30+23-03-23.png)

Start both `APP` and `API` with `yarn dev`.

Navigate to the `YourSettings` page. Log in if you are logged out.

Click on the icon that toggles theme:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-30+23-38-22.png)

Request triggers method compiles decorate method with action Navigate to mount middleware page component in this book Team Leader new Express route static method calls At AWS dashboard static method calls. Mount middleware server-side rendering Remember to add import Put it all together We will discuss send this response page component page component API infrastructure show notification You already learned in a browser page component. Material-UI Team Leader MongoDB database team members At AWS dashboard data model this chapter it works as expected on server only session data model production-ready At AWS dashboard add environmental variable. New Express route conditional operator At AWS dashboard static method calls in this book Google OAuth API You already learned. API infrastructure in production show notification store method calls API method email and name in a browser conditional operator open this file MongoDB database Team Leader production-ready API infrastructure. Decorate method with action mount middleware request triggers method discussion on server only cookie API infrastructure discussion mount middleware team members API method API infrastructure AWS dashboard redirect to checkout. Team members on server only on the client API infrastructure We will discuss Material-UI static method calls API infrastructure redirect to checkout in production API infrastructure Team Leader. This chapter API infrastructure triggers method Click on the button team members. In production Click on the button Click on the button store method calls session in production cookie check if value is truthy add environmental variable conditional operator show notification mount middleware Click on the button At AWS dashboard. Team Leader cookie send this response triggers method request in a browser check if value is truthy in this book Put it all together on the client request it works as expected.

The browser tab will reload automatically and you will see:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-01+10-13-03.png)

Next, go to MongoDB Atlas and find your user document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-05-30+23-03-46.png)

Now it has a `darkTheme` field with value `true`.

Let's check up the browser console. It should display a value for `currentUser.darkTheme`, because we have this statement inside `Layout.render`:

```
console.log(this.props.store.currentUser.darkTheme);
```

While you are on the `YourSettings` page, click `Ctrl + Shift + J` on Chrome browser. Then click on the `Console` tab to access the browser console:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-01+10-40-19.png)

Indeed, the printed value is `true`, as it should be.

To switch theme, click again on the icon that toggles theme:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-01+10-40-43.png)

The theme becomes light, and the printed value for `currentUser.darkTheme` is `false`, as it should be.

In the next four sections of Chapter 7, we will introduce two more data models and data stores:

-   Team
-   Invitation

___

## Team API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#team-api)

So far, our MongoDB database has four collections:

-   `users`
-   `emailtemplates`
-   `sessions`
-   `passwordless-token`

We explicitly defined two data models: `User` and `EmailTemplates`. We also implicitly defined `Session` and `Passwordless-Token` models by installing and configuring the `express-session` and `passwordless-tokenstore` packages.

Our final SaaS boilerplate will have four more data models and corresponding infrastructure:

-   `Team`
-   `Invitation`
-   `Discussion`
-   `Post`

Here in Chapter 7, we will discuss and implement `Team` and `Invitation` data models and corresponding API infrastructure. We will discuss `Discussion` and `Post` data models in Chapter 8.

In addition to `Team` and `Invitation` APIs, we will discuss two user roles: Team Leader and Team Member.

Here is how the relationship between Team Leader, Team Member, Team, and Invitation can be summarized:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Team%2C+TL%2C+TM%2C+Invitation.png)

Team Leader is a user that creates a Team and invites other users to join the Team. Team Member is a user that is invited by a Team Leader and accepts an invitation to join a team. Both Team Leader and Team Member can create Discussions and Posts. But only a Team Leader can create a Team, access the Team's settings (`TeamSettings` page), and become a paying customer.

A lot of SaaS applications are designed for groups of people. Be it project management, communication, customer relationship - almost all SaaS applications allow for collaboration and are designed for groups. Hence our decision to have a `Team` concept in this SaaS boilerplate. In our SaaS application, [Async](https://async-await.com/), we have a similar concept called `Project`.

We will implement Team API in the same way we did all previous internal APIs (not external or third-party APIs):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Team+API.png)

In the previous section, we started implementing toggle theme API from our client-facing project, `APP`. This time we will start with our server-side code, `API`. Starting with server-side code is how we typically implement new API infrastructures in our SaaS product.

#### Model and static methods - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#model-and-static-methods-team)

You've already defined `User` and `EmailTemplate` models, so you can simply open either

-   `book/7-begin/api/server/models/User.ts` file or
-   `book/7-begin/api/server/models/EmailTemplate.ts` file

to see how we defined `Schema`, `Document`, and `Model`.

We want a Team Leader to be able to create a Team using a `CreateTeam` page. On that page, the Team Leader should provide the name and optional avatar for a new Team. Thus, let's have some typical fields in our `Schema`:

```
name: {
  type: String,
  required: true,
},
slug: {
  type: String,
  required: true,
  unique: true,
},
avatarUrl: String,
createdAt: {
  type: Date,
  required: true,
},
```

Since you have similar fields in your `User` and `EmailTemplate` schema, there is no need to discuss theme further.

It would be handy to know which user was a creator of the Team; hence we have `teamLeaderId`, which is the `id` of the Team Leader that created a specific Team:

```
teamLeaderId: {
  type: String,
  required: true,
},
```

A Team's `Schema` should have an array of ids for all Team Members, users who are part of the Team. The Team Leader invites potential Team Members. Users who the accept invitation by clicking on an invitation link become Team Members. Let's introduce a field for these Team Members - `memberIds`:

```
memberIds: [
  {
    type: String,
    required: true,
  },
],
```

When a Team Leader creates a new Team, the `memberIds` array has at least one value, the id of the Team Leader.

Part of the code that we will write in this section and the next section assumes that a Team Leader can create and have multiple Teams. Although we try to keep SaaS boilerplate simple whenever possible, we decided to have some code related to having multiple Teams.

For example, Team's `Schema` will have one more field:

```
defaultTeam: {
  type: Boolean,
  default: false,
},
```

`defaultTeam` is a boolean field that indicates whether a Team is default. If a Team Leader has more than one team, which Team's data should we load after a Team Leader logged into our web application? Which Team to choose out of multiple Teams? In a situation like that, we can load the Team that has `defaultTeam: true`.

Here is a second example of having code that supports the case of a Team Leader having multiple teams. We can find a Team inside the `teams` collection by defining a `Team.findBySlug` static method. Instead, we opt not to define such a static method and instead define `Team.getAllTeamsForUser`, which returns an array of teams. For a Team Leader, `Team.getAllTeamsForUser` returns an array of all Teams that Team Leader has created. This way, it is easier for you, as a web developer, to display all of a Team Leader's Teams on some user interface. You can filter this array of Teams with `teamSlug` and get one Team with a matching slug.

Ok, at this point we discussed enough to define `Schema` and `Document`:

```
const mongoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  avatarUrl: String,
  createdAt: {
    type: Date,
    required: true,
  },
  teamLeaderId: {
    type: String,
    required: true,
  },
  memberIds: [
    {
      type: String,
      required: true,
    },
  ],
  defaultTeam: {
    type: Boolean,
    default: false,
  },
});

export interface TeamDocument extends mongoose.Document {
  name: string;
  slug: string;
  avatarUrl: string;
  createdAt: Date;

  teamLeaderId: string;
  memberIds: string[];
  defaultTeam: boolean;
}
```

Next, we need to define `Model`. Which static method do we have to define for our `Team` model?

The Team Leader creates a Team and can update this Team (change `name` and/or `avatar`), so we have to define `addTeam` and `updateTeam` static methods. The Team Leader can send invitations to potential Team Members, so we have to define a corresponding static method in the next section when we implement our `Invitation` model. The Team Leader can remove an existing Team Member from the Team, so we have to define a `removeMember` static method. And, as we just discussed earlier, we need to define a `getAllTeamsForUser` static method as well.

Let's define all four static methods for our `Team` model:

-   `addTeam`:
    
    ```
      public static async addTeam({ userId, name, avatarUrl }) {
        console.log(`Static method: ${name}, ${avatarUrl}`);
    
        if (!userId || !name || !avatarUrl) {
          throw new Error('Bad data');
        }
    
        const slug = await generateNumberSlug(this);
    
        let defaultTeam = false;
        if ((await this.countDocuments({ teamLeaderId: userId })) === 0) {
          await User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: slug } });
          defaultTeam = true;
        }
    
        const team = await this.create({
          teamLeaderId: userId,
          name,
          slug,
          avatarUrl,
          memberIds: [userId],
          createdAt: new Date(),
          defaultTeam,
        });
    
        return team;
      }
    ```
    
    `addTeam` requires three arguments: `userId`, `name`, `avatarUrl`. A Team Leader provides `name` and `avatarUrl` when creating a new Team using the `CreateTeam` page. We will define this page later in this section. `userId` is the id of the user who is creating the Team - the Team Leader. We want to check if we have all required data with:
    
    ```
      if (!userId || !name || !avatarUrl) {
        throw new Error('Bad data');
      }
    ```
    
    We generate `slug` for `Team` document.
    
    If a `Team` document that is being created is the first and only one for a Team Leader, we make this `Team` document have `defaultTeam: true` and update `defaultTeamSlug` with the above `slug`:
    
    ```
      let defaultTeam = false;
      if ((await this.countDocuments({ teamLeaderId: userId })) === 0) {
        await User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: slug } });
        defaultTeam = true;
      }
    ```
    
    Then we create a `Team` document and return it. We remember to create a `memberIds` field with one member - the id of the Team Leader, `userId`:
    
    ```
      const team = await this.create({
        teamLeaderId: userId,
        name,
        slug,
        avatarUrl,
        memberIds: [userId],
        createdAt: new Date(),
        defaultTeam,
      });
    
      return team;
    ```
    

-   `updateTeam`:
    
    ```
      public static async updateTeam({ userId, teamId, name, avatarUrl }) {
        const team = await this.findById(teamId, 'name teamLeaderId');
    
        if (!team) {
          throw new Error('Team not found');
        }
    
        if (team.teamLeaderId !== userId) {
          throw new Error('Permission denied');
        }
    
        const modifier = { name: team.name, avatarUrl };
    
        if (name !== team.name) {
          modifier.name = name;
        }
    
        await this.updateOne({ _id: teamId }, { $set: modifier }, { runValidators: true });
    
        return this.findById(teamId, 'name avatarUrl slug defaultTeam').setOptions({ lean: true });
      }
    ```
    
    The static method `updateTeam` accepts four arguments: `userId`, `teamId`, `name`, `avatarUrl`. The Team Leader updates a Team on the `Settings` page. `userId` is the Team Leader's user id, and `teamId` is id of the Team that is being updated. `name` and `avatarUrl` are values that are being updated.
    
    At first, we search the `teams` collection by id to make sure a `Team` document exists.
    
    If a `Team` document exists, we check if the Team Leader is indeed a creator of the `Team` document.
    
    Then we check if an existing `Team` document has the same value for the `name` field. If not, we save the new `name` to the `modifier` object that is made of two properties: `name` and `avatarUrl`.
    
    Then we call Mongoose's API method `updateOne`, which you already used multiple times in this book when working on `User` and `EmailTemplate` models.
    
    Then we find and return the already-updated `Team` document with some field that deems it to be public and safe to send to the browser.
    
    You've already used `runValidators` and `lean` options in Chapter 4, so there is no need to discuss them here.
    

-   `getAllTeamsForUser`:
    
    ```
      public static getAllTeamsForUser(userId: string) {
        return this.find({ memberIds: userId }).setOptions({ lean: true });
      }
    ```
    
    This one is easy to understand. `getAllTeamsForUser` takes only one argument, `userId`. `userId` is the user id of the Team Leader or user id of a Team Member.
    
    We search the `teams` collection by checking if the `memberIds` array contains `userId`, and we return an array of Teams. The Mongoose API method `find` returns an array of documents - in our case, an array of Team objects that correspond to either all Teams created by a Team Leader or all Teams that a Team Member has joined.
    

-   `removeMember`:
    
    ```
      public static async removeMember({ teamId, teamLeaderId, userId }) {
        const team = await this.findById(teamId).select('memberIds teamLeaderId');
    
        if (team.teamLeaderId !== teamLeaderId || teamLeaderId === userId) {
          throw new Error('Permission denied');
        }
    
        await this.findByIdAndUpdate(teamId, { $pull: { memberIds: userId } });
      }
    ```
    
    `removeMember` takes three arguments: `teamId`, `teamLeaderId`, `userId`. `teamId` is the id of the Team from which a Team Member is being removed. `teamLeaderId` is the user id of the Team Leader who is removing a Team Member. `userId` is user id of the Team Member who is being removed.
    
    First, we search the `teams` collection by id and check if the Team Leader is indeed a creator of this `Team` document. We also check that a Team Leader is not trying to remove himself/herself from the team.
    
    Then we return an updated `Team` document with updated `memberIds` field.
    

Remember to define type definitions for static methods (for both arguments and return value). If you're not sure how to do it, check your `User` and `EmailTemplate` models.

```
interface TeamModel extends mongoose.Model<TeamDocument> {
  addTeam({ name, userId }: { userId: string; name: string; avatarUrl: string }): Promise<TeamDocument>;

  updateTeam({
    userId,
    teamId,
    name,
    avatarUrl,
  }: {
    userId: string;
    teamId: string;
    name: string;
    avatarUrl: string;
  }): Promise<TeamDocument>;

  getAllTeamsForUser(userId: string): Promise<TeamDocument[]>;

  removeMember({
    teamId,
    teamLeaderId,
    userId,
  }: {
    teamId: string;
    teamLeaderId: string;
    userId: string;
  }): Promise<void>;
}
```

Put all the code together and remember to export `TeamDocument` and `Team` model. Create a new file `book/7-begin/api/server/models/Team.ts` with the following content:

```
import * as mongoose from 'mongoose';

import { generateNumberSlug } from '../utils/slugify';
import User from './User';

const mongoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  avatarUrl: String,
  createdAt: {
    type: Date,
    required: true,
  },
  teamLeaderId: {
    type: String,
    required: true,
  },
  memberIds: [
    {
      type: String,
      required: true,
    },
  ],
  defaultTeam: {
    type: Boolean,
    default: false,
  },
});

export interface TeamDocument extends mongoose.Document {
  name: string;
  slug: string;
  avatarUrl: string;
  createdAt: Date;

  teamLeaderId: string;
  memberIds: string[];
  defaultTeam: boolean;
}

interface TeamModel extends mongoose.Model<TeamDocument> {
  addTeam({ name, userId }: { userId: string; name: string; avatarUrl: string }): Promise<TeamDocument>;
  updateTeam({
    userId,
    teamId,
    name,
    avatarUrl,
  }: {
    userId: string;
    teamId: string;
    name: string;
    avatarUrl: string;
  }): Promise<TeamDocument>;
  getAllTeamsForUser(userId: string): Promise<TeamDocument[]>;
  removeMember({
    teamId,
    teamLeaderId,
    userId,
  }: {
    teamId: string;
    teamLeaderId: string;
    userId: string;
  }): Promise<void>;
}

class TeamClass extends mongoose.Model {
  public static async addTeam({ userId, name, avatarUrl }) {
    console.log(`Static method: ${name}, ${avatarUrl}`);

    if (!userId || !name || !avatarUrl) {
      throw new Error('Bad data');
    }

    const slug = await generateNumberSlug(this);

    let defaultTeam = false;
    if ((await this.countDocuments({ teamLeaderId: userId })) === 0) {
      await User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: slug } });
      defaultTeam = true;
    }

    const team = await this.create({
      teamLeaderId: userId,
      name,
      slug,
      avatarUrl,
      memberIds: [userId],
      createdAt: new Date(),
      defaultTeam,
    });

    return team;
  }

  public static async updateTeam({ userId, teamId, name, avatarUrl }) {
    const team = await this.findById(teamId, 'slug name defaultTeam teamLeaderId');

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.teamLeaderId !== userId) {
      throw new Error('Permission denied');
    }

    const modifier = { name: team.name, avatarUrl };

    if (name !== team.name) {
      modifier.name = name;
    }

    await this.updateOne({ _id: teamId }, { $set: modifier }, { runValidators: true });

    if (team.defaultTeam) {
      await User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: modifier.slug } });
    }

    return this.findById(teamId, 'name avatarUrl slug defaultTeam').setOptions({ lean: true });
  }

  public static getAllTeamsForUser(userId: string) {
    return this.find({ memberIds: userId }).setOptions({ lean: true });
  }

  public static async removeMember({ teamId, teamLeaderId, userId }) {
    const team = await this.findById(teamId).select('memberIds teamLeaderId');

    if (team.teamLeaderId !== teamLeaderId || teamLeaderId === userId) {
      throw new Error('Permission denied');
    }

    await this.findByIdAndUpdate(teamId, { $pull: { memberIds: userId } });
  }
}

mongoSchema.loadClass(TeamClass);

const Team = mongoose.model<TeamDocument, TeamModel>('Team', mongoSchema);

export default Team;
```

When we defined `addTeam` earlier in this subsection, we used the `generateNumberSlug` utility method. This method checks a pool of existing slugs in the `teams` collection. `generateNumberSlug` checks if there is a `Team` document with `slug: 1`, `slug: 2` and so forth. If, say, there is a `Team` document with `slug: 5` but no document with `slug: 6`, then this method returns `6`. Then we use `6` (`string` type) as the `slug` for the newly created `Team` document (inside the `addTeam` static method):

```
const slug = await generateNumberSlug(this);
```

Open your existing `book/7-begin/api/server/utils/slugify.ts` file. At the end of the file, add this definition for `generateNumberSlug` and rememeber to export it:

```
async function generateNumberSlug(Model, filter = {}, n = 1) {
  const obj = await Model.findOne({ slug: n, ...filter })
    .select('_id')
    .setOptions({ lean: true });

  if (!obj) {
    return `${n}`;
  }

  return generateNumberSlug(Model, filter, ++n);
}

export { generateSlug, generateNumberSlug };
```

___

#### Updating User model - Team - here [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-user-model-team-here)

When we defined the `updateTeam` method, we called:

```
User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: modifier.slug } });
```

In other words, we introduced a new field for our `User` document - `defaultTeamSlug`. In this subsection, we update our `User` model to reflect this change.

Open `book/7-begin/api/server/models/User.ts` and make the following changes:

-   Add new imports
    
    ```
      import Team, { TeamDocument } from './Team';
    ```
    
-   Add a new field to `Schema`:
    
    ```
      defaultTeamSlug: {
        type: String,
        default: '',
      },
    ```
    
-   Add a new type definition for `UserDocument`:
    
    ```
      defaultTeamSlug: string;
    ```
    
-   Add a new array member to the output of the `publicFields` static method:
    
    ```
      public static publicFields(): string[] {
        return [
          '_id',
          'id',
          'displayName',
          'email',
          'avatarUrl',
          'slug',
          'isSignedupViaGoogle',
          'darkTheme',
          'defaultTeamSlug',
        ];
      }
    ```
    
-   Inside the static method `signInOrSignUpViaGoogle`, find the following code block and add `defaultTeamSlug: ''` like this:
    
    ```
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
    ```
    
-   Inside the static method `signInOrSignUpByPasswordless`, find the following code block and add `defaultTeamSlug: ''` like this:
    
    ```
      const newUser = await this.create({
        _id: uid,
        createdAt: new Date(),
        email,
        slug,
        defaultTeamSlug: '',
      });
    ```
    
-   At the end of this section, we will build a new page called `TeamSettings`. On that page, we let a Team Leader manage their Team's members. In particular, the Team Leader can invite potential members and remove existing members. The Team Leader also sees a table of existing and invited members. To properly populate this table of members on the `TeamSettings` page, we will access the `Team` data store like so:
    
    ```
    this.store.currentTeam.members
    ```
    

And to populate the table of invited users, we will use:

```
this.store.currentTeam.invitations
```

In order for us to populate `this.store.currentTeam.members`, we need a static method for our `User` model that returns an array of user documents with public fields. These user documents are the Team's existing members. In other words, we need a static method that takes `teamId` (team's id) and outputs an array of existing members:

```
public static async getMembersByTeam({ userId, teamId }) {
  const team = await this.checkPermissionAndGetTeam({ userId, teamId });

  return this.find({ _id: { $in: team.memberIds } })
    .select(this.publicFields().join(' '))
    .setOptions({ lean: true });
}
```

We also passed `userId` to check if a user who requests a list of a Team's existing members has permission to do so. We want to make sure that the Team's `memberIds` array contains `userId`, meaning a user who initiates the `getMembersByTeam` method is either the Team Leader or a Team Member. If the following statement is `true`:

```
team.memberIds.indexOf(userId) === -1
```

Then `userId` is not a member of the `memberIds` array.

Check up:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/indexOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)

```
const beasts = ['ant', 'bison', 'camel', 'duck', 'bison'];

console.log(beasts.indexOf('bison'));
// expected output: 1

// start from index 2
console.log(beasts.indexOf('bison', 2));
// expected output: 4

console.log(beasts.indexOf('giraffe'));
// expected output: -1
```

`giraffe` is not a member of the `beasts` array; thus `beasts.indexOf('giraffe') === -1` is `true`.

The `checkPermissionAndGetTeam` method takes two arguments `userId` and `teamId`. First we check if the method has all the data, then we search the `teams` collection by id, then we check if a `userId` is part of the Team's `memeberIds` array:

```
private static async checkPermissionAndGetTeam({ userId, teamId }) {
  if (!userId || !teamId) {
    throw new Error('Bad data');
  }

  const team = await Team.findById(teamId)
    .select('memberIds')
    .setOptions({ lean: true });

  if (!team || team.memberIds.indexOf(userId.toString()) === -1) {
    throw new Error('Team not found');
  }

  return team;
}
```

Add the above two new static methods at the end of the `class UserClass` block inside of `book/7-begin/api/server/models/User.ts`

WithAuth HOC data model discussion mount middleware show notification Click on the button if truthy then You already learned if truthy then. Team members Next.js web application S3 bucket if truthy then We will discuss API infrastructure team members subsection Remember to add import response send this response You already learned At AWS dashboard session request was sent. End user page component in a browser response Next.js web application end user in a browser API method calls corresponding store method on the client static method calls. Check if value is truthy end user request was sent new Express route compiles check if value is truthy static method calls store method calls list of posts. Production-ready triggers method email and name it works as expected Next.js web application subsection Team Leader At AWS dashboard if truthy then this chapter new Express route At AWS dashboard You already learned request. If truthy then withAuth HOC API infrastructure team members response send this response in this book Click on the button Team Leader if truthy then Remember to add import conditional operator. New Express route You already learned Navigate to compiles check if value is truthy AWS dashboard API method calls corresponding store method API method discussion conditional operator At AWS dashboard. It works as expected API method calls corresponding store method it works as expected Google OAuth API check if value is truthy on the client list of posts HTTP. Redirect to checkout request Material-UI You already learned discussion session it works as expected API method compiles request was sent API method API method. S3 bucket withAuth HOC mount middleware store method calls response Put it all together.

Remember to define type definitions for `getMembersByTeam` and `checkPermissionAndGetTeam`, since we build our SaaS boilerplate with TypeScript:

```
getMembersForTeam({
  userId,
  teamId,
}: {
  userId: string;
  teamId: string;
}): Promise<UserDocument[]>;

checkPermissionAndGetTeam({
  userId,
  teamId,
}: {
  userId: string;
  teamId: string;
}): Promise<TeamDocument>;
```

Add the above type definitions at the end of the `interface UserModel` block inside of `book/7-begin/api/server/models/User.ts`

Alrighty, we are almost done with the server-side part of implementation. The only remaining part is Express routes.

___

#### Express routes - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-team)

We can put new Express routes for our Team API into the existing file `book/7-begin/api/server/api/team-member.ts`. However, if we want to make our codebase more organized and easy to read, we can make a distinction between Team Member and Team Leader APIs.

In our current business logic for SaaS boilerplate, the Team Leader creates and updates Team. The Team Leader also invites Team Members to the Team and can remove any Team Member from the Team. For these four **Team Leader unique** operations, let's create four new Express routes:

-   `/api/v1/team-leader//teams/add` or `/teams/add` without prefix
-   `/teams/update` (without prefix)
-   `/teams/get-invited-users`

Let's define these new Express routes:

-   Express route `/teams/add` calls the static method `Team.add`, which we just defined earlier in this section:
    
    ```
      router.post('/teams/add', async (req: any, res, next) => {
        try {
          const { name, avatarUrl } = req.body;
    
          const team = await Team.addTeam({ userId: req.user.id, name, avatarUrl });
    
          res.json(team);
        } catch (err) {
          next(err);
        }
      });
    ```
    
    You've already created over half a dozen Express routes in this book, so we are not going into the details of `async/await`, `try/catch`, `res.json`, `next(err)` work.
    
-   Express route `/teams/update` calls the static method `Team.updateTeam`:
    
    ```
      router.post('/teams/update', async (req: any, res, next) => {
        try {
          const { teamId, name, avatarUrl } = req.body;
    
          const team = await Team.updateTeam({
            userId: req.user.id,
            teamId,
            name,
            avatarUrl,
          });
    
          res.json(team);
        } catch (err) {
          next(err);
        }
      });
    ```
    
-   We define Express route `/teams/get-invited-users` in the next and final section of this chapter. For now, we will just write down its carcass:
    
    ```
      router.get('/teams/get-invited-users', async (req: any, res, next) => {
        // defined later in this chapter
      });
    ```
    

Create a new file `book/7-begin/api/server/api/team-leader.ts` with the above content:

```
import * as express from 'express';

import Team from '../models/Team';
import User from '../models/User';

const router = express.Router();

router.use((req, res, next) => {
  console.log('team leader API', req.path);

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});

router.post('/teams/add', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    const team = await Team.addTeam({ userId: req.user.id, name, avatarUrl });

    res.json(team);
  } catch (err) {
    next(err);
  }
});

router.post('/teams/update', async (req: any, res, next) => {
  try {
    const { teamId, name, avatarUrl } = req.body;

    const team = await Team.updateTeam({
      userId: req.user.id,
      teamId,
      name,
      avatarUrl,
    });

    res.json(team);
  } catch (err) {
    next(err);
  }
});

router.get('/teams/get-invited-users', async (req: any, res, next) => {
  // defined later in this chapter
});
```

Note that we have the same check as we do for Team Member APIs:

```
router.use((req, res, next) => {
  console.log('team leader API', req.path);

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});
```

This upstream logic, as we discussed earlier in Chapter 6, checks if a user that sends requests to the downstream Express routes is logged-in (`req.user` is not `undefined`).

If someone sends request to our `api` server at API endpoints `http://localhost:8000/api/v1/team-leader` or `http://localhost:8000/api/v1/team-leader/*` and `req.user` is falsy then our `api` server will respond with:

![Builder Book](https://user-images.githubusercontent.com/10218864/107122237-63bb7e80-684b-11eb-975f-e84f8047b2d1.png)

For the Team Leader Express routes to mount properly on our `API` server, we need to update `book/7-begin/api/server/api/index.ts`. Open this file and import `teamLeaderApi` like this:

```
import teamLeaderApi from './team-leader';
```

Then mount all Express routes related to Team Leader APIs like this:

```
server.use('/api/v1/team-leader', teamLeaderApi, handleError);
```

The contents of `book/7-begin/api/server/api/index.ts` will become:

```
import * as express from 'express';

import publicExpressRoutes from './public';
import teamMemberExpressRoutes from './team-member';
import teamLeaderApi from './team-leader';

function handleError(err, _, res, __) {
  console.error(err.stack);

  res.json({ error: err.message || err.toString() });
}

export default function api(server: express.Express) {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/team-member', teamMemberExpressRoutes, handleError);
  server.use('/api/v1/team-leader', teamLeaderApi, handleError);
}
```

We are almost done with changes to our `API` project. We need to define two more Express routes:

-   `/get-initial-data`
    
-   `/teams`
    
    Here is how these two Express routes are similar. Both Express routes call the static method `Team.getAllTeamsForUser` and return `teams` with a response. The Express route `/get-initial-data` returns an array of `teams` with only one member if the user is part of one team or multiple array members if the user is part of multiple teams. The same is true for the Express route `/teams` that returns an array of `teams` with one or more array members. However, the data structure of `teams` is very different.
    

The data structure of `team` member inside the `teams` array returned by the Express route `/get-initial-data` has an extra parameter in addition to the `TeamDocument` interface:

```
initialMembers
```

And by the end of this chapter, the data structure for `team` will have three extra parameters in addition to the `TeamDocument` interface:

```
initialMembers, initialInvitations, initialDiscussions
```

The data structure of `team` member inside the `teams` array returned by the Express route `/teams` is the same as the `TeamDocument` interface without any extra parameters:

```
export interface TeamDocument extends mongoose.Document {
  name: string;
  slug: string;
  avatarUrl: string;
  createdAt: Date;

  teamLeaderId: string;
  memberIds: string[];
  defaultTeam: boolean;
}
```

The Express route `/get-initial-data` returns an array of objects. Each object has a team's members, invitations, and discussions. The Express route `/get-initial-data` will call three static methods by the end of this chapter:

-   `Team.getAllTeamsForUser`
-   `Invitation.getTeamInvitedUsers`
-   `Discussion.getList`

The Express route `/teams` returns an array of objects. Each object has the same data structure as the `TeamDocument`'s interface. The Express route `/teams` calls only one static method:

-   `Team.getAllTeamsForUser`

Both Team Leader and Team Member can access these two Express routes, so instead of placing them into the `book/7-begin/api/server/api/team-leader.ts` file that has Express routes exclusively used by the Team Leader, we will place these two Express routes into `book/7-begin/api/server/api/team-member.ts`.

Let's define the Express route `/get-initial-data`:

```
router.post('/get-initial-data', async (req: any, res, next) => {
  try {
    const teams = await Team.getAllTeamsForUser(req.user.id);

    let selectedTeamSlug = req.body.teamSlug;
    if (!selectedTeamSlug && teams && teams.length > 0) {
      selectedTeamSlug = teams[0].slug;
    }

    for (const team of teams) {
      if (team.slug === selectedTeamSlug) {
        Object.assign(team, await loadTeamData(team, req.user.id));
        break;
      }
    }

    res.json({ teams });
  } catch (err) {
    next(err);
  }
});
```

First, for a logged-in user, we get an array of `teams` by calling the static method `Team.getAllTeamsForUser`. Then we defined the variable `selectedTeamSlug`, which is either `req.body.teamSlug` (`teamSlug` from request's body) or `teams[0].slug` (`slug` value from the first object of the `teams` array). Then we iterate through the `teams` array using `for` that you learned about in Chapter 6 when we iterated through an array of email templates. When `team.slug === selectedTeamSlug` is `true` (value of `selectedTeamSlug` matches the value of the array's member), we replace this array member `team` with:

```
Object.assign(team, await loadTeamData(team, req.user.id));
```

As you learned from Chapter 2, `Object.assign` creates a new object from parameters (properties) of the `team` object and object returned by `await loadTeamData(team, req.user.id)`.

Here is how we define the `loadTeamData` method:

```
async function loadTeamData(team, userId) {
  const initialMembers = await User.getMembersForTeam({
    userId,
    teamId: team._id,
  });

  const data: any = { initialMembers };

  return data;
}
```

So you can see that in our case, `Object.assign` returns a `team` object with an extra parameter (property), `initialMembers`. In other words, the Express route `/get-initial-data` returns the `teams` array with `team` objects as members. Each `team` object has an extra parameter, `initialMembers`, which is an array of user objects (each user object has a public fields parameters), in addition to parameters defined in `TeamDocument`.

Another Express route that both Team Leader and Team Member can access is `/teams/get-members`. This method Express route will be eventually used to populate array parameter `members` of `Team` data store, `store.currentTeam.members`. We call static method `User.getTeamMembers` inside Express route `/teams/get-members` to get `users` - array of user objects that correspond to users who part of the team with team id `teamId`:

```
router.get('/teams/get-members', async (req: any, res, next) => {
  try {
    const users = await User.getMembersForTeam({
      userId: req.user.id,
      teamId: req.query.teamId as string,
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});
```

Open file `book/7-begin/api/server/api/team-member.ts`, and the end of it but before `export default router;`, add:

```
async function loadTeamData(team, userId) {
  const initialMembers = await User.getMembersForTeam({
    userId,
    teamId: team._id,
  });

  const data: any = { initialMembers };

  return data;
}

router.post('/get-initial-data', async (req: any, res, next) => {
  try {
    const teams = await Team.getAllTeamsForUser(req.user.id);

    let selectedTeamSlug = req.body.teamSlug;
    if (!selectedTeamSlug && teams && teams.length > 0) {
      selectedTeamSlug = teams[0].slug;
    }

    for (const team of teams) {
      if (team.slug === selectedTeamSlug) {
        Object.assign(team, await loadTeamData(team, req.user.id));
        break;
      }
    }

    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

router.get('/teams', async (req, res, next) => {
  try {
    const teams = await Team.getAllTeamsForUser(req.user.id);

    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

router.get('/teams/get-members', async (req: any, res, next) => {
  try {
    const users = await User.getMembersForTeam({
      userId: req.user.id,
      teamId: req.query.teamId as string,
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});
```

___

#### API methods - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-methods-team)

We are done with changes to our `API` project. In this subsection and all subsecquent subsections, we will work on our `APP` project. In the previous subsection, we defined five new Express routes.

We defined three Express routes for Team Leader APIs and two Express routes for Team Member APIs.

Navigate to Material-UI conditional operator list of posts open this file. We will discuss request on the client in this book withAuth HOC store method calls response Material-UI API infrastructure AWS dashboard Remember to add import. You already learned on server only show notification AWS dashboard it works as expected response Team Leader. Production-ready Remember to add import add environmental variable request request was sent API method calls corresponding store method API method API method calls corresponding store method We will discuss We will discuss Team Leader data model request was sent server-side rendering on server only. Remember to add import show notification request triggers method cookie API method calls corresponding store method session MongoDB database cookie Navigate to session. Check if value is truthy production-ready You already learned Navigate to You already learned static method calls. Mount middleware We will discuss conditional operator decorate method with action team members decorate method with action We will discuss. Next.js web application data model mount middleware triggers method on the client in this book decorate method with action mount middleware it works as expected S3 bucket HTTP on the client show notification in a browser. Google OAuth API store method calls it works as expected You already learned Material-UI API method send this response. Mount middleware AWS dashboard We will discuss AWS dashboard in production API method check if value is truthy send this response withAuth HOC Google OAuth API.

Defining API methods is straightforward. For every Express route that accepts a request, we need to create an API method that sends that request.

Let's create three new API methods for the three new Express routes for Team Leader APIs. Create a new file `book/7-begin/app/lib/api/team-leader.ts` with the following content:

```
import sendRequestAndGetResponse from './sendRequestAndGetResponse';

const BASE_PATH = '/api/v1/team-leader';

export const addTeamApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/teams/add`, {
    body: JSON.stringify(data),
  });

export const updateTeamApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/teams/update`, {
    body: JSON.stringify(data),
  });
```

Update the existing `book/7-begin/app/lib/api/team-member.ts` file by adding the following new API methods at the end of the file:

```
export const getInitialDataApiMethod = (options: any = {}) =>
  sendRequestAndGetResponse(
    `${BASE_PATH}/get-initial-data`,
    Object.assign(
      {
        body: JSON.stringify(options.data || {}),
      },
      options,
    ),
  );

export const getTeamListApiMethod = () =>
  sendRequestAndGetResponse(`${BASE_PATH}/teams`, {
    method: 'GET',
  });

export const getTeamMembersApiMethod = (teamId: string) =>
  sendRequestAndGetResponse(`${BASE_PATH}/teams/get-members`, {
    method: 'GET',
    qs: { teamId },
  });
```

Since you already created many API methods at this point in the book, we skipped a detailed explanation. It's worth noting that whenever we send a `GET` request, we either submit no data or add a query parameter to the URL by assigning value to `qs`. We will discuss how we construct API endpoints using `qs` later in this chapter. For now, you need to know that on the `API` server, we will access the `teamId` value as `req.query.teamId`. You will learn when to use `req.query` and `req.params` on an Express.js server.

Whenever we send a `POST` request, we submit and save data to the request's body.

___

#### Data store and store methods - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#data-store-and-store-methods-team)

It's time to check up our Team API diagram. We began working from the bottom of this diagram:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Team+API.png)

Since we are done with API methods, the next step is to add the `Team` data store and other store methods.

We defined the main `store` and its methods in:

`book/7-begin/app/lib/store/index.ts`

We defined the `User` data store and its methods in:

`book/7-begin/app/lib/store/user.ts`

Similarly, we will define the `Team` data store and its method in:

`book/7-begin/app/lib/store/team.ts`

While we work on implementing data store for Team, let's keep in mind that there could be a situation where a potential Team Leader has not created any Team yet. Say an end user signed up on our application and got redirected to the `CreateTeam` page, but then the user decided not to create a Team. Without a Team, `this.props.store.currentTeam` object on any page will be `null` or `undefined`. As a consequence, we cannot call `this.props.store.currentTeam.addTeam`. You probably can guess what we are getting at - we need to keep some observable data and store methods in the main `store` and some in the `Team` store.

For example, the `Team` data store can have `updateTheme` and `removeMember` store methods. And we will access them easily on any page as `this.props.store.currentTheme.updateTheme` and `this.props.store.currentTheme.removeMember`, respectively. Both of these methods require an existing Team, thus we can define them as the `Team` data store's methods.

The main data store, `store`, should have the `addTheme` store method, since it does not require an existing Team. We, as developers, will be able to access it as `this.props.store.addTheme` on any page of our application.

In this subsection, we will work on the `Team` data store and store methods. In the next subsection, we will update the main `store`.

We will define the `class` Team like so:

```
class Team {
  public store: Store;

  public _id: string;
  public teamLeaderId: string;

  public name: string;
  public slug: string;
  public avatarUrl: string;
  public memberIds: IObservableArray<string> = observable([]);
  public members: Map<string, User> = new Map();

  constructor(params) {
    this._id = params._id;
    this.teamLeaderId = params.teamLeaderId;
    this.slug = params.slug;
    this.name = params.name;
    this.avatarUrl = params.avatarUrl;
    this.memberIds.replace(params.memberIds || []);

    this.store = params.store;

    if (params.initialMembers) {
      this.setInitialMembers(params.initialMembers);
    }
  }
```

As you can see, most of the parameters are the same as `interface` of the `TeamDocument` from `book/7-begin/api/server/models/Team.ts`. We also save our main store to the `Team` data store for just for consistency - other data stores that we will build in Chapter 8 will also have our main `store` in them. Besides `store`, another parameter that is **not** from `interface` of the `TeamDocument` are `members` (array of `User` data stores).

We discussed where the value of the `params` argument comes from when we worked on our `User` data store earlier in this chapter. In short, `params`, in the case of `User` data store, gets its value from the main `store` method `setCurrentUser`, which gets its value from `initialState.user`. This `initialState.user` gets populated by the `App.getInitialProps` method. To trace how this value gets passed around, check up the corresponding files:

-   `book/7-begin/app/lib/store/user.ts`
-   `book/7-begin/app/lib/store/index.ts`
-   `book/7-begin/app/pages/_app.tsx`

Similar to how `params` gets populated for our `User` data store with a user object, `params` get populated for our `Team` data store with a team object.

Here is how `params` for our `Team` data store gets its value: `params` gets its value from the main `store` method `setCurrentTeam` (which we will define later in this subsection). The `setCurrentTeam` method requires the arguments `slug` and `initialTeams`, which get their values from `initialState.teamSlug` and `initialState.teams`, respectively. The `initialState` gets populated by the `App.getInitialProps` method (to be modified by us later in the next subsection).

In addition to populating `initialState.teamSlug` and `initialState.teams` by `App.getInitialProps`, we need to populate `initialState.initialMembers`, which will become accessible as `params.initialMembers`. If this value is **not** a `null` or `undefined`, then we will call the `setInitialMembers` store method to populate our `this.members` array:

```
if (params.initialMembers) {
  this.setInitialMembers(params.initialMembers);
}
```

Definition for `setInitialMembers` store method:

```
public setInitialMembers(users) {
  this.members.clear();

  for (const user of users) {
    if (this.store.currentUser && this.store.currentUser._id === user._id) {
      this.members.set(user._id, this.store.currentUser);
    } else {
      this.members.set(user._id, new User(user));
    }
  }
}
```

We could've simply use the `this.members.set(user._id, new User(user));` line only, but because a logged-in user may update their `displayName` or `avatarUrl`, we want to populate this updated value to the `members` array by including `this.store.currentUser` into it.

There are two more store methods we need to define for our `Team` data store: `updateTheme` and `removeMember`. As developers, we will be able to access these methods on any page as `this.props.store.currentTheme.updateTheme` and `this.props.store.currentTheme.removeMember`, respectively.

The store method `updateTheme` takes `name` and `avatarUrl` as arguments (these are new values submitted by a Team Leader on the `TeamSettings` page) and calls the `updateTeamApiMethod` API method with these two parameters plus `teamId`. If there is no error, three `Team` data store parameters get updated: `this.name`, `this.avatarUrl`, `this.slug`.

```
public async updateTheme({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  try {
    const { slug } = await updateTeamApiMethod({
      teamId: this._id,
      name,
      avatarUrl,
    });

    runInAction(() => {
      this.name = name;
      this.avatarUrl = avatarUrl;
      this.slug = slug;
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

The store method `updateTheme` takes `userId` as an argument and calls the `removeMemberApiMethod` API method with `userId` and `teamId`. `userId` is the user id of a user who will be removed from a Team with a Team id `teamId`. We also need to remove item from `members` and `memberIds` arrays.

```
public async removeMember(userId: string) {
  try {
  await removeMemberApiMethod({ teamId: this._id, userId });

  runInAction(() => {
    this.members.delete(userId);
     this.memberIds.remove(userId);
  });
} catch (error) {
  console.error(error);
  throw error;
}
```

Let's create a new file, `book/7-begin/app/lib/store/team.ts`. Add the code we discussed so far in this subsection, and you should get:

```
import { action, decorate, IObservableArray, observable, runInAction } from 'mobx';
import { removeMemberApiMethod, updateTeamApiMethod } from '../api/team-leader';

import { Store } from './index';
import { User } from './user';

class Team {
  public store: Store;

  public _id: string;
  public teamLeaderId: string;

  public name: string;
  public slug: string;
  public avatarUrl: string;
  public memberIds: IObservableArray<string> = observable([]);

  public members: Map<string, User> = new Map();

  public isLoadingMembers = false;
  public isInitialMembersLoaded = false;

  constructor(params) {
    this._id = params._id;
    this.teamLeaderId = params.teamLeaderId;
    this.slug = params.slug;
    this.name = params.name;
    this.avatarUrl = params.avatarUrl;
    this.memberIds.replace(params.memberIds || []);

    this.store = params.store;

    if (params.initialMembers) {
      this.setInitialMembers(params.initialMembers);
    }
  }

  public setInitialMembers(users) {
    this.members.clear();

    for (const user of users) {
      if (this.store.currentUser && this.store.currentUser._id === user._id) {
        this.members.set(user._id, this.store.currentUser);
      } else {
        this.members.set(user._id, new User(user));
      }
    }
  }

  public async updateTheme({ name, avatarUrl }: { name: string; avatarUrl: string }) {
    try {
      const { slug } = await updateTeamApiMethod({
        teamId: this._id,
        name,
        avatarUrl,
      });

      runInAction(() => {
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.slug = slug;
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async removeMember(userId: string) {
    try {
    await removeMemberApiMethod({ teamId: this._id, userId });

    runInAction(() => {
      this.members.delete(userId);
      this.memberIds.remove(userId);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

decorate(Team, {
  name: observable,
  slug: observable,
  avatarUrl: observable,
  memberIds: observable,
  members: observable,

  setInitialMembers: action,
  updateTheme: action,
  removeMember: action,
});

export { Team };
```

___

#### Updating main store - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-main-store-team)

As we mentioned in the previous section, some store methods cannot exist on the `Team` data store. For example, the store method `addTheme` may be called when a user has not created any teams. And similar to how we defined the `setCurrentUser` method in the main `store`, we have to define the `setCurrentTeam` method. Without defining the `setCurrentTeam` store method, `Team.constructor` from `book/7-begin/app/lib/store/team.ts` will get `params` with a value of `null` or `undefined`:

```
constructor(params) {
  this._id = params._id;
  this.teamLeaderId = params.teamLeaderId;
  this.slug = params.slug;
  this.name = params.name;
  this.avatarUrl = params.avatarUrl;
  this.memberIds.replace(params.memberIds || []);

  this.store = params.store;

  if (params.initialMembers) {
    this.setInitialMembers(params.initialMembers);
  }
}
```

Open `book/7-begin/app/lib/store/index.ts`. Check that `initialState.teamSlug` is not `null` or `undefined` OR `initialState.user.defaultTeamSlug` is not `null` or `undefined` or an empty string, and then call `this.setCurrentTeam(initialState.teamSlug || initialState.user.defaultTeamSlug, initialState.teams)`:

```
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  public currentTeam?: Team = null;

  constructor({
    initialState = {},
    isServer,
  }: {
    initialState?: any;
    isServer: boolean;
  }) {
    this.isServer = !!isServer;

    this.setCurrentUser(initialState.user);

    this.currentUrl = initialState.currentUrl || '';

    if (initialState.teamSlug || (initialState.user && initialState.user.defaultTeamSlug)) {
      this.setCurrentTeam(
        initialState.teamSlug || initialState.user.defaultTeamSlug,
        initialState.teams,
      );
    }
  }
```

Why do we need such complicated logic `initialState.teamSlug || initialState.user.defaultTeamSlug`? That's because for different pages, we will get the Team's `slug` differently. On the `TeamSettings` page, we will extract `slug` as `ctx.query.teamSlug` from route `/team/:teamSlug/team-settings`. Then we will populate `initialState.teamSlug` inside `App.getInitialProps`. It's a different story for the `YourSettings` page. For the `YourSettings` page, `ctx.query.teamSlug` is `undefined` and `initialState.teamSlug` is `undefined`. Thus, we need to get the Team's slug elsewhere. Every end user who created a Team or became a member of a Team will have a `defaultTeamSlug` parameter in the data store - thus, `initialState.user.defaultTeamSlug`.

We also check if `initialState.user` is `null` or `undefined`, because on the `Login` page, it is indeed `null` and `initialState.user.defaultTeamSlug` is `undefined`. And we would get an error on our `Login` page if we did not check for `initialState.user`.

Next, let's define the store method `setCurrentTeam`. First, this method will check if the value of `this.currentTeam.slug` matches the value of `initialState.teamSlug`. If not, the method returns `undefined` (we can omit the returned expression to return `undefined`). Then the method calls `getTeamListApiMethod` that returns an array of `teams`. Then we iterate through each `team` member of the `teams` array. We use the value of `initialState.teamSlug` to find a matching `team` member. Then we take the found `team` member and assign its value to `this.currentTeam`:

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

      this.currentTeam.setInitialMembers(users);

      break;
    }
  }

  if (!found) {
    this.currentTeam = null;
  }
}
```

If `initialTeams` is not `null` or `undefined`, then `teams` gets its value from `initialTeams`. Otherwise, `teams` gets its value by calling the `getTeamListApiMethod` API method.

Note that writing `(await getTeamListApiMethod()).teams` and `(await getTeamMembersApiMethod(this.currentTeam._id)).users` increases readability. And using the `OR` operator, `||`, reduces the amount of code. If we did not use `||`, we would have had to write something like:

```
let users = [];

if (team.initialMembers) {
  users = team.initialMembers;
}

users = (await getTeamMembersApiMethod(this.currentTeam._id)).users;
```

For a matching `team`, we define `this.currentTeam`, which is a `Team` data store:

```
this.currentUser = new User({ store: this, ...user });
```

This is exactly how we defined `this.currentUser`, a `User` data store, when working on the `setCurrentUser` store method:

```
this.currentUser = new User({ store: this, ...user });
```

Also, for a matching `team` member, we call the `setInitialMembers` store method of the `Team` data store. Check up the previous subsection for the definition of our `setInitialMembers` method. `setInitialMembers` requires an argument that is an array of user objects that correspond to all users who are part of the Team. We get the `users` argument by calling the previously defined `getTeamMembersApiMethod` API method (defined in `book/7-begin/app/lib/api/team-member.ts`). The `setInitialMembers` method populates the `store.currentTeam.members` array with an array of user objects.

If a matching `team` member is not found, we set the value of `this.currentTeam` to `null`.

The store method `addTeam` takes `name` and `avatarUrl` arguments (Team Leader provides those when creating a new Team on the `CreateTeam` page) and calls the `addTeamApiMethod` API method. Then we call `new Team` to create a new `Team` data store and return it:

```
public async addTeam({ name, avatarUrl }: { name: string; avatarUrl: string }): Promise<Team> {
  const data = await addTeamApiMethod({ name, avatarUrl });
  const team = new Team({ store: this, ...data });

  return team;
}
```

This returned `team` will be used on the `CreateTeam` page. For example, `team.slug` will be used as a prefix for our S3 bucket that contains team avatars.

If you add a `console.log` statement to the store method `setInitialMembers` inside the `Team` data store (`book/7-begin/app/lib/store/team.ts`) and try loading, say, `TeamSettings` by the end of the `Team API` section - you will find that it runs twice. This is not a critical problem but makes our application less efficient.

`setInitialMembers` runs twice because it runs the `Team` data store:

```
if (params.initialMembers) {
  this.setInitialMembers(params.initialMembers);
}
```

And runs again when we set up our initial main store, inside the `setCurrentTeam` store method:

```
this.currentTeam.setInitialMembers(users);
```

To prevent it from running twice, remove the following block from the `Team` data store (`book/7-begin/app/lib/store/team.ts`)):

```
if (params.initialMembers) {
  this.setInitialMembers(params.initialMembers);
}
```

Alright, we are almost done with modifying our main store. Let's update the `decorate` section. Add `setCurrentTeam` to the `decorate` section:

```
decorate(Store, {
  currentUser: observable,
  currentUrl: observable,
  currentTeam: observable,

  changeCurrentUrl: action,
  setCurrentUser: action,
  setCurrentTeam: action,
});
```

Also remember to import the `Team` data store and two API methods we used:

```
import { addTeamApiMethod } from '../api/team-leader';
import { getTeamListApiMethod, getTeamMembersApiMethod } from '../api/team-member';

import { User } from './user';
import { Team } from './team';
```

___

#### Initial data from App.getInitialProps - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#initial-data-from-app-getinitialprops-team)

Our main `store` needs `initialState.teamSlug`, and our `Team` data store needs `params.initialMembers`. We can get these two values from the same place we got `initialState.user` for the main `store` to populate `store.currentUser`. This place is `App.getInitialProps` method.

Discussion it works as expected it works as expected AWS dashboard send this response open this file. Show notification Team Leader this chapter HTTP Put it all together API infrastructure session. In production subsection server-side rendering request was sent team members. Redirect to checkout discussion S3 bucket decorate method with action in this book Material-UI Next.js web application add environmental variable request was sent show notification Team Leader decorate method with action. Data model check if value is truthy conditional operator production-ready team members API method calls corresponding store method request was sent Put it all together decorate method with action response new Express route. Mount middleware request was sent Next.js web application Google OAuth API open this file triggers method in this book. Add environmental variable Google OAuth API Put it all together this chapter Next.js web application API method. Store method calls request this chapter on server only static method calls At AWS dashboard compiles At AWS dashboard in this book conditional operator cookie request S3 bucket decorate method with action. Decorate method with action send this response Next.js web application show notification decorate method with action We will discuss team members email and name We will discuss redirect to checkout list of posts response Put it all together email and name. Email and name triggers method redirect to checkout API method conditional operator page component email and name list of posts on the client triggers method response.

Open `book/7-begin/app/pages/_app.tsx` and find the `App.getInitialProps` method:

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

  const appProps = { pageProps };

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

  return {
    ...appProps,
    initialState: { user: userObj, currentUrl: ctx.asPath },
  };
}
```

Let's import the `getInitialDataApiMethod` API method:

```
import { getInitialDataApiMethod } from '../lib/api/team-member';
```

And use it like this:

```
public static async getInitialProps({ Component, ctx }) {
  let firstGridItem = true;

  if (ctx.pathname.includes('/login')) {
    firstGridItem = false;
  }

  const { teamSlug } = ctx.query;

  const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem, teamSlug };

  if (Component.getInitialProps) {
    Object.assign(pageProps, await Component.getInitialProps(ctx));
  }

  const appProps = { pageProps };

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

  let initialData = {};

  if (userObj) {
    try {
      initialData = await getInitialDataApiMethod({
        request: ctx.req,
        data: { teamSlug },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return {
    ...appProps,
    initialState: { user: userObj, currentUrl: ctx.asPath, teamSlug, ...initialData },
  };
}
```

Note that by using the spread operator, `...initialData`, we take parameters of the `initialData` object and add them to the `initialState` object. In other words, the `initialState` object will have the parameter `initialMembers` (array of user objects) because on the server, for the Express route `/get-initial-data`, we wrote:

```
async function loadTeamData(team, userId) {
  const initialMembers = await User.getMembersForTeam({
    userId,
    teamId: team._id,
  });

  const data: any = { initialMembers };

  return data;
}
```

In addition to adding `initialData` to `initialState`, we also added `teamSlug` to both `appProps` and `initialState`. We will discuss later in this section, subsection [Testing Team API](https://builderbook.org/books/saas-boilerplate/application-state-app-hoc-store-and-mobx-toggle-theme-api-team-api-invitation-api#testing-team-api), how to make `teamSlug` accessible as `ctx.query.teamSlug`.

So once `App.constructor` runs and completes, we will have both `teamSlug` and `initialMembers` inside `initialState`. Our main `store` and `Team` data store need these two values for populating `store.currentTeam` and `store.currentTeam.members`, respectively.

Look at the above definition of `App.getInitialProps`. Keep in mind that `initialData` data is used to populate props of **all** pages of your Next.js web application. You should always fight against increasing the size of `initialData`. The larger `initialData` the slower initial load speed of **any** pages of your Next.js web application. You, as web architect, should think regularly about what required initial data for **each** page is. And aim to load that data for that page only, using page methods such as `getInitialProps` or `getServerSideProps`. There should be very little data that is needed by **all** pages and must be added to `initialData`. One example is `user` prop. Typically, all pages of your web application should know if a user is logged-in or logged-out. Thus we can fetch and populate `user` using `App.getInitialProps`. In many other cases, you should load initial data (data required for the initial load) on a per-page basis and keep `initialData` as small as possible.

___

#### teamRequired - Team [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#teamrequired-team)

We've created a new UX problem, though not intentionally. Some pages of our web application, for example the existing `YourSettings` page and future `CreateTeam` page, do not require a Team. In other words, `this.props.store.currentTeam` can be `null` or `undefined` on `YourSettings` and `CreateTeam` pages.

But there are pages that do require a Team. The `TeamSettings` page, which will be introduced in this chapter, requires a non `null` and non `undefined` value for `this.props.store.currentTeam`. Other pages that require a Team are the `Discussion` page (to be introduced in Chapter 8) and `Billing` page (to be introduced in Chapter 10).

So why do we call this a problem? Because if an end user has not created any Team, this user will not have access to the `TeamSettings` and `Billing` pages. And if the end user is not a creator or not a member of any Team, then this end user will not have access to the `Discussion` page. In other words, we need to set up proper redirects and notifications for the end user who attempts to load pages that require Team but this user either is not the creator of a Team (`TeamSettings` and `Billing` pages) or not a member of a Team (`Discussion` page).

It looks like we need some boolean parameter, for example `teamRequired`. The default value should be `false`. But `teamRequired` will be `true` for `TeamSettings`, `Discussion`, and `Billing` pages. If we define this logic for `teamRequired` inside `App.getInitialProps`, then we can add this boolean prop to `pageProps` in the same way we did it for `firstGridItem`:

```
let firstGridItem = true;
let teamRequired = false;

if (ctx.pathname.includes('/login')) {
  firstGridItem = false;
}

if (
  ctx.pathname.includes('/team-settings') ||
  ctx.pathname.includes('/discussion') ||
  ctx.pathname.includes('/billing') 
) {
  teamRequired = true;
}

const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem, teamSlug, teamRequired };
```

Now, `teamRequired` is available on any page as `this.props.teamRequired`. It is also available inside the `Layout` HOC when the page is wrapped with `Layout`:

```
<Layout {...this.props}>
  // page's content
</Layout>
```

Since the `Layout` HOC wraps all of our pages, `teamRequired` will be available on all pages. We will use the boolean `teamRequired` to show a conditional user interface inside `Layout`. If a page requires a Team but an end user who loads the page has not created a Team (in the case of the `TeamSettings` page), then we will show some informational message and offer an end user to navigate to the `CreateTeam` page to create a new Team.

Open `book/7-begin/app/components/layout/index.tsx` and make following changes to the `Layout` HOC:

-   Add type definition for `teamRequired`:
    
    ```
      type Props = {
        children: React.ReactNode;
        isMobile?: boolean;
        firstGridItem?: boolean;
        store?: Store;
        teamRequired?: boolean;
      };
    ```
    
-   Inside `Layout.render`, access `teamRequired` as `this.props.teamRequired`:
    
    ```
      const { children, isMobile, firstGridItem, store, teamRequired } = this.props;
    ```
    
-   Inside `Layout.render`, access `currentTeam` as `this.props.store.currentTeam`:
    
    ```
      const { currentUser, currentTeam } = store;
    ```
    
    VS editor should show possible options as you type `curr...`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-10+12-39-12.png)
    
-   Add two more links to the main menu. The first link is for the `TeamSettings` page, and the second link is for the `Billing` page. Both links require a value for `currentTeam`. Current main menu:
    
    ```
      <MenuWithLinks
        options={[
          {
            text: 'Index page',
            href: '/',
            highlighterSlug: '/',
          },
          {
            text: 'Your Settings',
            href: '/your-settings',
            highlighterSlug: '/your-settings',
          },
          {
            separator: true,
          },
          {
            text: 'Log out',
            href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
            as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
            externalServer: true,
          },
        ]}
      >
    ```
    
    Updated menu (with two new links and removed link for the `Index` page):
    
    ```
      <MenuWithLinks
        options={[
          {
            text: 'Team Settings',
            href: `/team-settings?teamSlug=${currentTeam.slug}`,
            as: `/team/${currentTeam.slug}/team-settings`,
            simple: true,
          },
          {
            text: 'Billing',
            href: `/billing?teamSlug=${currentTeam.slug}`,
            as: `/team/${currentTeam.slug}/billing`,
            simple: true,
          },
          {
            text: 'Your Settings',
            href: '/your-settings',
            highlighterSlug: '/your-settings',
          },
          {
            separator: true,
          },
          {
            text: 'Log out',
            href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
            as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
            externalServer: true,
          },
        ]}
      >
    ```
    
-   To reduce the amount of repetitive code for our user interface, let's introduce a new function `LayoutWrapper`:
    
    ```
      function LayoutWrapper({
        children,
        isMobile,
        firstGridItem,
        store,
      }: {
        children: React.ReactNode;
        isMobile: boolean;
        firstGridItem: boolean;
        store: Store;
      }) {
        const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;
    
        return (
          <React.Fragment>
            <Grid
              container
              direction="row"
              justify="flex-start"
              alignItems="stretch"
              style={isMobile ? styleGridIsMobile : styleGrid}
            >
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
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="124"
                      height="40"
                      viewBox="0 0 124 40"
                      style={{
                        marginTop: '20px',
                        display: 'inline-flex',
                        height: '40px',
                      }}
                    >
                      <g id="async-logo">
                        <g id="async-logo-40">
                          <circle id="Ellipse 2" cx="20" cy="20" r="20" fill="black" />
                          <path
                            id="path-async-logo"
                            d="M7.07825 -0.0960007V16H4.51825V13.088C4.04892 14.0907 3.33425 14.8693 2.37425 15.424C1.43558 15.9573 0.336917 16.224 -0.92175 16.224C-2.35108 16.224 -3.60975 15.8827 -4.69775 15.2C-5.76442 14.5173 -6.59642 13.5573 -7.19375 12.32C-7.76975 11.0613 -8.05775 9.6 -8.05775 7.936C-8.05775 6.272 -7.75908 4.81067 -7.16175 3.552C-6.56442 2.272 -5.73242 1.28 -4.66575 0.576C-3.57775 -0.128 -2.32975 -0.48 -0.92175 -0.48C0.336917 -0.48 1.43558 -0.202666 2.37425 0.352C3.31292 0.906667 4.02758 1.68533 4.51825 2.688V-0.0960007H7.07825ZM-0.40975 14.08C1.16892 14.08 2.38492 13.5467 3.23825 12.48C4.09158 11.392 4.51825 9.856 4.51825 7.872C4.51825 5.888 4.09158 4.36267 3.23825 3.296C2.38492 2.22933 1.16892 1.696 -0.40975 1.696C-1.98842 1.696 -3.22575 2.25067 -4.12175 3.36C-4.99642 4.448 -5.43375 5.97333 -5.43375 7.936C-5.43375 9.89867 -4.99642 11.4133 -4.12175 12.48C-3.24708 13.5467 -2.00975 14.08 -0.40975 14.08Z"
                            transform="translate(19.5938 12)"
                            fill="white"
                          />
                        </g>
                        <path
                          id="path-async-text"
                          d="M22.6251 11.928V24H20.7051V21.816C20.3531 22.568 19.8171 23.152 19.0971 23.568C18.3931 23.968 17.5691 24.168 16.6251 24.168C15.5531 24.168 14.6091 23.912 13.7931 23.4C12.9931 22.888 12.3691 22.168 11.9211 21.24C11.4891 20.296 11.2731 19.2 11.2731 17.952C11.2731 16.704 11.4971 15.608 11.9451 14.664C12.3931 13.704 13.0171 12.96 13.8171 12.432C14.6331 11.904 15.5691 11.64 16.6251 11.64C17.5691 11.64 18.3931 11.848 19.0971 12.264C19.8011 12.68 20.3371 13.264 20.7051 14.016V11.928H22.6251ZM17.0091 22.56C18.1931 22.56 19.1051 22.16 19.7451 21.36C20.3851 20.544 20.7051 19.392 20.7051 17.904C20.7051 16.416 20.3851 15.272 19.7451 14.472C19.1051 13.672 18.1931 13.272 17.0091 13.272C15.8251 13.272 14.8971 13.688 14.2251 14.52C13.5691 15.336 13.2411 16.48 13.2411 17.952C13.2411 19.424 13.5691 20.56 14.2251 21.36C14.8811 22.16 15.8091 22.56 17.0091 22.56ZM30.4637 24.168C28.4317 24.168 26.8237 23.648 25.6397 22.608L26.2877 21.168C26.9437 21.68 27.6077 22.048 28.2797 22.272C28.9517 22.496 29.7037 22.608 30.5357 22.608C31.4477 22.608 32.1357 22.456 32.5997 22.152C33.0797 21.832 33.3197 21.376 33.3197 20.784C33.3197 20.304 33.1597 19.92 32.8397 19.632C32.5197 19.344 31.9917 19.12 31.2557 18.96L29.2157 18.48C28.2077 18.256 27.4237 17.856 26.8637 17.28C26.3197 16.704 26.0477 16.016 26.0477 15.216C26.0477 14.16 26.4717 13.304 27.3197 12.648C28.1677 11.976 29.2877 11.64 30.6797 11.64C31.5277 11.64 32.3277 11.776 33.0797 12.048C33.8317 12.32 34.4637 12.712 34.9757 13.224L34.3277 14.64C33.1917 13.696 31.9757 13.224 30.6797 13.224C29.8157 13.224 29.1437 13.392 28.6637 13.728C28.1997 14.048 27.9677 14.504 27.9677 15.096C27.9677 15.592 28.1117 15.984 28.3997 16.272C28.7037 16.56 29.1837 16.784 29.8397 16.944L31.8797 17.448C32.9997 17.704 33.8317 18.104 34.3757 18.648C34.9197 19.176 35.1917 19.872 35.1917 20.736C35.1917 21.776 34.7677 22.608 33.9197 23.232C33.0717 23.856 31.9197 24.168 30.4637 24.168ZM48.687 11.928L43.047 25.104C42.455 26.48 41.711 27.488 40.815 28.128C39.919 28.768 38.815 29.208 37.503 29.448L37.095 27.936C38.231 27.68 39.087 27.336 39.663 26.904C40.255 26.488 40.743 25.84 41.127 24.96L41.607 23.88L36.495 11.928H38.535L42.615 21.888L46.743 11.928H48.687ZM56.853 11.64C59.749 11.64 61.197 13.232 61.197 16.416V24H59.253V16.512C59.253 15.392 59.029 14.576 58.581 14.064C58.133 13.536 57.429 13.272 56.469 13.272C55.349 13.272 54.453 13.616 53.781 14.304C53.109 14.992 52.773 15.92 52.773 17.088V24H50.829V15.312C50.829 14.064 50.765 12.936 50.637 11.928H52.485L52.677 14.088C53.045 13.304 53.597 12.704 54.333 12.288C55.069 11.856 55.909 11.64 56.853 11.64ZM69.9321 24.168C68.7641 24.168 67.7401 23.912 66.8601 23.4C65.9961 22.888 65.3241 22.168 64.8441 21.24C64.3801 20.296 64.1481 19.2 64.1481 17.952C64.1481 16.704 64.3881 15.608 64.8681 14.664C65.3481 13.704 66.0281 12.96 66.9081 12.432C67.8041 11.904 68.8441 11.64 70.0281 11.64C70.8441 11.64 71.6281 11.784 72.3801 12.072C73.1481 12.344 73.7801 12.728 74.2761 13.224L73.6281 14.664C73.0201 14.184 72.4281 13.832 71.8521 13.608C71.2921 13.384 70.7161 13.272 70.1241 13.272C68.8921 13.272 67.9241 13.688 67.2201 14.52C66.5161 15.336 66.1641 16.48 66.1641 17.952C66.1641 19.408 66.5081 20.544 67.1961 21.36C67.9001 22.16 68.8761 22.56 70.1241 22.56C70.7161 22.56 71.2921 22.448 71.8521 22.224C72.4281 22 73.0201 21.648 73.6281 21.168L74.2761 22.608C73.7641 23.088 73.1161 23.472 72.3321 23.76C71.5641 24.032 70.7641 24.168 69.9321 24.168Z"
                          transform="translate(39 4)"
                          fill={isThemeDark ? 'white' : 'black'}
                        />
                      </g>
                    </svg>
                    <MenuWithLinks
                      options={[
                        {
                          text: 'Team Settings',
                          href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
                          as: `/team/${store.currentTeam.slug}/team-settings`,
                          simple: true,
                        },
                        {
                          text: 'Billing',
                          href: `/billing?teamSlug=${store.currentTeam.slug}`,
                          as: `/team/${store.currentTeam.slug}/billing`,
                          simple: true,
                        },
                        {
                          text: 'Your Settings',
                          href: '/your-settings',
                          highlighterSlug: '/your-settings',
                        },
                        {
                          separator: true,
                        },
                        {
                          text: 'Log out',
                          href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
                          as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
                          externalServer: true,
                        },
                      ]}
                    >
                      <Avatar
                        src={'https://storage.googleapis.com/async-await/default-user.png'}
                        alt="Add username here later in the book"
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
                </Grid>
              ) : null}
    
              {children}
            </Grid>
            <Notifier />
            <Confirmer />
          </React.Fragment>
        );
      }
    ```
    
    `LayoutWrapper` contains a left column and its content (column with width of 2 out of 12). The left column is either shown or not, depending on the value of the `firstGridItem` prop. `children` is interface code that will be wrapped by `LayoutWrapper`. In our case, `children` is user interface code for the right column and its content (column with width of 10 or 12 out of 12).
    
    Add the above definition of the `LayoutWrapper` function above the line:
    
    ```
      type Props = {
    ```
    
    Since `LayoutWrapper` has definition for `isThemeDark`, we don't have to define `isThemeDark` inside `Layout.render`. Go ahead and remove following line from `Layout.render`:
    
    ```
      const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;
    ```
    
-   Above `Layout.render` before `return`, add the following logic for checks (`!object` checks if `object` is `null` or `undefined`; empty object is `undefined`):
    
    ```
      if (!currentUser) {
        return (
          <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
            <Grid item sm={12} xs={12}>
              {children}
            </Grid>
          </LayoutWrapper>
        );
      }
    
      if (!currentTeam) {
        if (teamRequired) {
          return (
            <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
              <Grid
                item
                sm={10}
                xs={12}
                style={{ padding: '0px 35px', overflow: 'auto', height: 'auto' }}
              >
                <div style={{ padding: '20px' }}>
                  Select existing team or create a new team.
                  <p />
                  <Link href="/create-team">
                    <Button variant="outlined" color="primary">
                      Create new team
                    </Button>
                  </Link>
                </div>
              </Grid>
            </LayoutWrapper>
          );
        } else {
          return (
            <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
              <Grid
                item
                sm={10}
                xs={12}
                style={{ padding: '0px 35px', overflow: 'auto', height: 'auto' }}
              >
                {children}
              </Grid>
            </LayoutWrapper>
          );
        }
      }
    ```
    
    If `currentUser` is `null` or `undefined`, for example, and the end user loads `Login` page, then we simply want to return one column that occupies the entire window's width (12 out 12).
    
    If `currentUser` is not `null` or `undefined`, we will check if `currentTeam` is `null` or `undefined` and if `teamRequired` is `true`. Then instead of showing the page's content inside the right column, we will show the end user a button that navigates the user to the `CreateTeam` page. This scenario will happen when an end user has not created a Team and tries to navigate to `/team-settings`, the `TeamSettings` page.
    
    If `currentTeam` is `null` or `undefined` and `teamRequired` is `false`, then we will show an end user the page's content inside the right column. For example, the content of the `TeamSettings` page.
    

Make all of the above updates to the code in `book/7-book/app/components/layout/index.tsx`. Add all missing imports. Remember to wrap code inside the main `return` with `LayoutWrapper`. You should get:

```
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

import Link from 'next/link';
import React from 'react';

import MenuWithLinks from '../common/MenuWithLinks';
import Confirmer from '../common/Confirmer';
import Notifier from '../common/Notifier';

import { Store } from '../../lib/store';


const styleGrid = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

const styleGridIsMobile = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 0px 0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

function LayoutWrapper({
  children,
  isMobile,
  firstGridItem,
  store,
}: {
  children: React.ReactNode;
  isMobile: boolean;
  firstGridItem: boolean;
  store: Store;
}) {
  const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;

  return (
    <React.Fragment>
      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="stretch"
        style={isMobile ? styleGridIsMobile : styleGrid}
      >
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="124"
                height="40"
                viewBox="0 0 124 40"
                style={{
                  marginTop: '20px',
                  display: 'inline-flex',
                  height: '40px',
                }}
              >
                <g id="async-logo">
                  <g id="async-logo-40">
                    <circle id="Ellipse 2" cx="20" cy="20" r="20" fill="black" />
                    <path
                      id="path-async-logo"
                      d="M7.07825 -0.0960007V16H4.51825V13.088C4.04892 14.0907 3.33425 14.8693 2.37425 15.424C1.43558 15.9573 0.336917 16.224 -0.92175 16.224C-2.35108 16.224 -3.60975 15.8827 -4.69775 15.2C-5.76442 14.5173 -6.59642 13.5573 -7.19375 12.32C-7.76975 11.0613 -8.05775 9.6 -8.05775 7.936C-8.05775 6.272 -7.75908 4.81067 -7.16175 3.552C-6.56442 2.272 -5.73242 1.28 -4.66575 0.576C-3.57775 -0.128 -2.32975 -0.48 -0.92175 -0.48C0.336917 -0.48 1.43558 -0.202666 2.37425 0.352C3.31292 0.906667 4.02758 1.68533 4.51825 2.688V-0.0960007H7.07825ZM-0.40975 14.08C1.16892 14.08 2.38492 13.5467 3.23825 12.48C4.09158 11.392 4.51825 9.856 4.51825 7.872C4.51825 5.888 4.09158 4.36267 3.23825 3.296C2.38492 2.22933 1.16892 1.696 -0.40975 1.696C-1.98842 1.696 -3.22575 2.25067 -4.12175 3.36C-4.99642 4.448 -5.43375 5.97333 -5.43375 7.936C-5.43375 9.89867 -4.99642 11.4133 -4.12175 12.48C-3.24708 13.5467 -2.00975 14.08 -0.40975 14.08Z"
                      transform="translate(19.5938 12)"
                      fill="white"
                    />
                  </g>
                  <path
                    id="path-async-text"
                    d="M22.6251 11.928V24H20.7051V21.816C20.3531 22.568 19.8171 23.152 19.0971 23.568C18.3931 23.968 17.5691 24.168 16.6251 24.168C15.5531 24.168 14.6091 23.912 13.7931 23.4C12.9931 22.888 12.3691 22.168 11.9211 21.24C11.4891 20.296 11.2731 19.2 11.2731 17.952C11.2731 16.704 11.4971 15.608 11.9451 14.664C12.3931 13.704 13.0171 12.96 13.8171 12.432C14.6331 11.904 15.5691 11.64 16.6251 11.64C17.5691 11.64 18.3931 11.848 19.0971 12.264C19.8011 12.68 20.3371 13.264 20.7051 14.016V11.928H22.6251ZM17.0091 22.56C18.1931 22.56 19.1051 22.16 19.7451 21.36C20.3851 20.544 20.7051 19.392 20.7051 17.904C20.7051 16.416 20.3851 15.272 19.7451 14.472C19.1051 13.672 18.1931 13.272 17.0091 13.272C15.8251 13.272 14.8971 13.688 14.2251 14.52C13.5691 15.336 13.2411 16.48 13.2411 17.952C13.2411 19.424 13.5691 20.56 14.2251 21.36C14.8811 22.16 15.8091 22.56 17.0091 22.56ZM30.4637 24.168C28.4317 24.168 26.8237 23.648 25.6397 22.608L26.2877 21.168C26.9437 21.68 27.6077 22.048 28.2797 22.272C28.9517 22.496 29.7037 22.608 30.5357 22.608C31.4477 22.608 32.1357 22.456 32.5997 22.152C33.0797 21.832 33.3197 21.376 33.3197 20.784C33.3197 20.304 33.1597 19.92 32.8397 19.632C32.5197 19.344 31.9917 19.12 31.2557 18.96L29.2157 18.48C28.2077 18.256 27.4237 17.856 26.8637 17.28C26.3197 16.704 26.0477 16.016 26.0477 15.216C26.0477 14.16 26.4717 13.304 27.3197 12.648C28.1677 11.976 29.2877 11.64 30.6797 11.64C31.5277 11.64 32.3277 11.776 33.0797 12.048C33.8317 12.32 34.4637 12.712 34.9757 13.224L34.3277 14.64C33.1917 13.696 31.9757 13.224 30.6797 13.224C29.8157 13.224 29.1437 13.392 28.6637 13.728C28.1997 14.048 27.9677 14.504 27.9677 15.096C27.9677 15.592 28.1117 15.984 28.3997 16.272C28.7037 16.56 29.1837 16.784 29.8397 16.944L31.8797 17.448C32.9997 17.704 33.8317 18.104 34.3757 18.648C34.9197 19.176 35.1917 19.872 35.1917 20.736C35.1917 21.776 34.7677 22.608 33.9197 23.232C33.0717 23.856 31.9197 24.168 30.4637 24.168ZM48.687 11.928L43.047 25.104C42.455 26.48 41.711 27.488 40.815 28.128C39.919 28.768 38.815 29.208 37.503 29.448L37.095 27.936C38.231 27.68 39.087 27.336 39.663 26.904C40.255 26.488 40.743 25.84 41.127 24.96L41.607 23.88L36.495 11.928H38.535L42.615 21.888L46.743 11.928H48.687ZM56.853 11.64C59.749 11.64 61.197 13.232 61.197 16.416V24H59.253V16.512C59.253 15.392 59.029 14.576 58.581 14.064C58.133 13.536 57.429 13.272 56.469 13.272C55.349 13.272 54.453 13.616 53.781 14.304C53.109 14.992 52.773 15.92 52.773 17.088V24H50.829V15.312C50.829 14.064 50.765 12.936 50.637 11.928H52.485L52.677 14.088C53.045 13.304 53.597 12.704 54.333 12.288C55.069 11.856 55.909 11.64 56.853 11.64ZM69.9321 24.168C68.7641 24.168 67.7401 23.912 66.8601 23.4C65.9961 22.888 65.3241 22.168 64.8441 21.24C64.3801 20.296 64.1481 19.2 64.1481 17.952C64.1481 16.704 64.3881 15.608 64.8681 14.664C65.3481 13.704 66.0281 12.96 66.9081 12.432C67.8041 11.904 68.8441 11.64 70.0281 11.64C70.8441 11.64 71.6281 11.784 72.3801 12.072C73.1481 12.344 73.7801 12.728 74.2761 13.224L73.6281 14.664C73.0201 14.184 72.4281 13.832 71.8521 13.608C71.2921 13.384 70.7161 13.272 70.1241 13.272C68.8921 13.272 67.9241 13.688 67.2201 14.52C66.5161 15.336 66.1641 16.48 66.1641 17.952C66.1641 19.408 66.5081 20.544 67.1961 21.36C67.9001 22.16 68.8761 22.56 70.1241 22.56C70.7161 22.56 71.2921 22.448 71.8521 22.224C72.4281 22 73.0201 21.648 73.6281 21.168L74.2761 22.608C73.7641 23.088 73.1161 23.472 72.3321 23.76C71.5641 24.032 70.7641 24.168 69.9321 24.168Z"
                    transform="translate(39 4)"
                    fill={isThemeDark ? 'white' : 'black'}
                  />
                </g>
              </svg>
              <MenuWithLinks
                options={[
                  {
                    text: 'Team Settings',
                    href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
                    as: `/team/${store.currentTeam.slug}/team-settings`,
                    simple: true,
                  },
                  {
                    text: 'Billing',
                    href: `/billing?teamSlug=${store.currentTeam.slug}`,
                    as: `/team/${store.currentTeam.slug}/billing`,
                    simple: true,
                  },
                  {
                    text: 'Your Settings',
                    href: '/your-settings',
                    highlighterSlug: '/your-settings',
                  },
                  {
                    separator: true,
                  },
                  {
                    text: 'Log out',
                    href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
                    as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
                    externalServer: true,
                  },
                ]}
              >
                <Avatar
                  src={'https://storage.googleapis.com/async-await/default-user.png'}
                  alt="Add username here later in the book"
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
          </Grid>
        ) : null}

        {children}
      </Grid>
      <Notifier />
      <Confirmer />
    </React.Fragment>
  );
}

type Props = {
  children: React.ReactNode;
  isMobile?: boolean;
  firstGridItem?: boolean;
  store?: Store;
  teamRequired?: boolean;
};

class Layout extends React.Component<Props> {
  public render() {
    const { children, isMobile, firstGridItem, store, teamRequired } = this.props;

    const { currentUser, currentTeam } = store;

    // console.log(this.props.store.currentUser.darkTheme);

    // const isThemeDark = false;

    // console.log(isMobile);

    if (!currentTeam) {
      if (teamRequired) {
        return (
          <LayoutWrapper
            firstGridItem={firstGridItem}
            isMobile={isMobile}
            isThemeDark={isThemeDark}
            store={store}
          >
            <Grid item sm={10} xs={12}>
              <div style={{ padding: '20px' }}>
                Select existing team or create a new team.
                <p />
                <Link href="/create-team">
                  <Button variant="outlined" color="primary">
                    Create new team
                  </Button>
                </Link>
              </div>
            </Grid>
          </LayoutWrapper>
        );
      } else {
        return (
          <LayoutWrapper
            firstGridItem={firstGridItem}
            isMobile={isMobile}
            isThemeDark={isThemeDark}
            store={store}
          >
            <Grid item sm={10} xs={12}
              style={{ padding: '0px 35px', overflowY: 'auto', height: 'auto' }}
            >
              {children}
            </Grid>
          </LayoutWrapper>
        );
      }
    }

    return (
      <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
        <Grid
          item
          sm={firstGridItem ? 10 : 12}
          xs={12}
          style={{ padding: '0px 35px', overflowY: 'auto', height: 'inherit' }}
        >
          <div>
            {isMobile || store.currentUrl.includes('create-team') ? null : (
              <React.Fragment>
                <i
                  style={{
                    float: 'left',
                    margin: '15px 0px 10px 25px',
                    opacity: 0.8,
                    fontSize: '18px',
                    cursor: 'pointer',
                    verticalAlign: 'top',
                  }}
                  className="material-icons"
                  onClick={async () => {
                    await store.currentUser.toggleTheme(!store.currentUser.darkTheme);
                  }}
                >
                  lens
                </i>
              </React.Fragment>
            )}
            <div style={{ clear: 'both' }} />
          </div>
          {children}
        </Grid>
      </LayoutWrapper>
    );
  }
}

export default Layout;
```

___

#### CreateTeam page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#createteam-page)

We are almost at the end of the long road of implementing our Team API. According to our diagram, we implemented everything but pages:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Team+API.png)

In this subsection, we will build a new page, `CreateTeam`. We want to redirect a newly signed up end user to the `CreateTeam` page and offer this end user a form to create a new page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-13+09-13-43.png)

You already built multiple pages in this book. The most complexed one so far is `YourSettings` page. Open `book/7-begin/app/pages/your-settings.tsx` and check up the code. Look at your code for `Index` and `Login` pages as well. Do you a see a pattern in these pages' structures?

We can summarize our typical page structure like this:

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

What you see above is a typical carcass of the page in our SaaS boilerplate. This carcass can be simpler but cannot be more complex. For example, you may choose to write a page as a [pure stateless function](https://reactjs.org/docs/components-and-props.html), like we did for `CSRPage` earlier in this book. Then your carcass will be much simpler. No need to define `initial` state and use it. No need to use `class...extends`. No page methods. You simply render some user interface that does not change.

The good news is that the above carcass can't get any more complex. You may end up with a lot of code, but the structure will remain the same. You may end up with multiple HOCs wrapping the page. You may have larger user interface code or use many methods. But the most complex of all of your pages will have this carcass:

-   Importing all necessary modules
-   Defining types for `Props` and `State`
-   Creating class with `class ... extends`
-   Passing type definitions to `React.Component`, since we are using TypeScript
-   Populating page's props with `getInitialProps`
-   Setting initial page's `state` with `constructor` if you plan on accessing the page's `props` to set the initial page's `state`
-   If not using a page's `props` to set the initial page's `state`, you can use `public state =` instead of `constructor(props)`
-   `TypicalPage.render` where you will access values from the page's `props` and `state` and define the user interface code
-   Page's public methods (for example, `componentDidMount` if you need to do something on the browser after the page component got inserted into the DOM)
-   Page's private methods (for example, `onSubmit` for form)

The order in which you define a page's methods, including `TypicalPage.render`/`TypicalPage.constructor`/`TypicalPage.getInitialProps`, is really up to you. We recommend that you come up with some order that is logical to you. In our small team, we developed a habit of following the above order.

It's important to note that the `getInitialProps` method has `static` in front of it unlike other methods. `static` means that a method is a `class`'s method, not the method for the `instance` of a `class`. `class` is a blueprint on which an `instance` of `class` is created upon; an `instance` of a `class` is an `object`. In our case, this `object` is the page component, which we refer to as `this` whenever we access `this.props` or `this.state` inside a page's files. We discussed the usage of `this` in our first book [Builder Book](https://builderbook.org/).

Back to `getInitialProps`. Why should it be a method of the `class`? It's because Next.js's `getInitialProps` method runs before creation of a page component (`instance` of a `class`). To create a page component in Next.js, we need to have initial `props` returned by `getInitialProps`. The exception is a page that does not need initial `props`. For example, our `CreateTeam` page does not need initial `props`.

Let's use the above carcass to create a new page, `CreateTeam`:

```
// imports

// type Props = ...

// type State = ...

class CreateTeam extends React.Component<Props, State> {
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

export default SomeHOCs(CreateTeam);
```

-   **imports**:
    
    ```
      import { observer } from 'mobx-react';
      import * as React from 'react';
    
      import Avatar from '@material-ui/core/Avatar';
      import Button from '@material-ui/core/Button';
      import Grid from '@material-ui/core/Grid';
      import TextField from '@material-ui/core/TextField';
      import Head from 'next/head';
      import Router from 'next/router';
    
      import { getSignedRequestForUploadApiMethod, uploadFileUsingSignedPutRequestApiMethod } from '../lib/api/team-member';
      import notify from '../lib/notify';
      import { resizeImage } from '../lib/resizeImage';
      import { Store } from '../lib/store';
      import withAuth from '../lib/withAuth';
    
      import Layout from '../components/layout';
    
      const styleGrid = {
        height: '100%',
      };
    ```
    
    As you can see, you can define some local style inside the page's file instead of importing it from `book/7-begin/app/lib/sharedStyles.ts`. But it is up to you. In our small team, if a style is used in many places, we put it into `book/7-begin/app/lib/sharedStyles.ts`. Otherwise, we define that style in the page's file.
    
-   **type Props = ...**:
    
    ```
      type Props = { store: Store; isMobile: boolean; teamRequired: boolean };
    ```
    
    It's important that we have `teamRequired` in our page's `props`. A page gets the `teamRequired` value from our `App` HOC (`App.getInitialProps`) and passes this value to the `Layout` HOC. Inside the `Layout` HOC, we use the value of `teamRequired` to show an end user different interfaces.
    
-   **type State = ...**:
    
    ```
      type State = { newName: string; newAvatarUrl: string | ArrayBuffer; disabled: boolean };
    ```
    
-   **public static async getInitialProps**:  
    No need for it. The page component does not need initial `props`. And even if a page needs initial `props` (for example, the `TeamSettings` page), some of the data can already be accessed via `this.props.store`.
    
-   **constructor(props)**:  
    We do have to define initial `state`, but we do **not** need to access `props` to define initial `state`. Thus, instead of using `constructor(props)`, we will use `public state =`:
    
    ```
      constructor(props) {
        super(props);
    
        this.state = {
          newName: '',
          newAvatarUrl: 'https://storage.googleapis.com/async-await/default-user.png?v=1',
          disabled: false,
        };
      }
    ```
    
-   **access some values from props or state**:
    
    ```
      const { newAvatarUrl } = this.state;
    ```
    
-   **interface code for page**
    
    ```
      <div style={{ padding: '0px', fontSize: '14px', height: '100%' }}>
        <Grid container style={styleGrid}>
          <Grid
            item
            sm={12}
            xs={12}
            style={{ padding: this.props.isMobile ? '0px' : '0px 30px' }}
          >
            <h3>Create team</h3>
            <p />
            <form onSubmit={this.onSubmit}>
              <h4>Team name</h4>
              <TextField
                value={this.state.newName}
                label="Type your team's name."
                helperText="Team name as seen by your team members."
                onChange={(event) => {
                  this.setState({ newName: event.target.value });
                }}
              />
              <p />
              <h4 style={{ marginTop: '40px' }}>Team logo (optional)</h4>
              <Avatar
                src={newAvatarUrl}
                style={{
                  display: 'inline-flex',
                  verticalAlign: 'middle',
                  marginRight: 20,
                  width: 60,
                  height: 60,
                }}
              />
              <label htmlFor="upload-file">
                <Button variant="outlined" color="primary" component="span">
                  Select team logo
                </Button>
              </label>
              <input
                accept="image/*"
                name="upload-file"
                id="upload-file"
                type="file"
                style={{ display: 'none' }}
                onChange={this.previewTeamLogo}
              />
              <p />
              <br />
              <br />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={this.state.disabled}
              >
                Create new team
              </Button>
            </form>
          </Grid>
        </Grid>
        <br />
      </div>
    ```
    
    We've discussed `form` and `input` elements, as well as `TextField`, `Avatar`, and `Button` Material-UI components in Chapters 4 and 5 when working on the `YourSettings` page. Check up `book/7-begin/app/pages/your-settings.tsx`. Thus, we won't go into detail of the interface code.
    
-   **page's public methods**:  
    Only `CreateTeam.render`. No other public methods for the `CreateTeam` page.
    
-   **page's private methods**:
    
    There are two methods: `onSubmit` and `previewTeamLogo`.
    
    `CreateTeam.onSubmit` is somewhat similar to `YourSettings.onSubmit`. But intead of calling the `User` data store method `currentUser.updateProfile`, we need to call the main `store` method `store.addTeam`. Then, similar to `YourSettings.onSubmit`, we call the API methods `getSignedRequestForUploadApiMethod` and `uploadFileUsingSignedPutRequestApiMethod` to upload a Team's logo to an S3 bucket. At the end, instead of calling \`\`currentUser.updateProfile`, we need to call the`Team`data store method`team.updateTeam`. After an end user creates a Team successfully, it's good UX to redirect the end user to the`TeamSettings\` page:
    
    ```
      Router.push(`/team/${team.slug}/team-settings`);
    ```
    
    `CreateTeam.onSubmit`:
    
    ```
      private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    
        const { newName } = this.state;
    
        const { store } = this.props;
    
        if (!newName) {
          notify('Team name is required.');
          return;
        }
    
        const file = (document.getElementById('upload-file') as HTMLFormElement).files[0];
    
        try {
          this.setState({ disabled: true });
    
          const defaultAvatarUrl = 'https://storage.googleapis.com/async-await/default-user.png?v=1';
          const team = await store.addTeam({
            name: newName,
            avatarUrl: defaultAvatarUrl,
          });
    
          console.log(`Returned to client: ${team._id}, ${team.name}, ${team.slug}`);
    
          if (file == null) {
            Router.push(`/team/${team.slug}/team-settings`);
            notify('You successfully created Team.<p />Redirecting...');
            return;
          }
    
          const fileName = file.name;
          const fileType = file.type;
          const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS;
          const prefix = team.slug;
    
          const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
            fileName,
            fileType,
            prefix,
            bucket,
          });
    
          const resizedFile = await resizeImage(file, 128, 128);
    
          await uploadFileUsingSignedPutRequestApiMethod(resizedFile, responseFromApiServerForUpload.signedRequest, {
            'Cache-Control': 'max-age=2592000',
          });
    
          const uploadedAvatarUrl = responseFromApiServerForUpload.url;
    
          await team.updateTheme({ name: team.name, avatarUrl: uploadedAvatarUrl });
    
          this.setState({
            newName: '',
            newAvatarUrl: 'https://storage.googleapis.com/async-await/default-user.png?v=1',
          });
    
          (document.getElementById('upload-file') as HTMLFormElement).value = '';
    
          Router.push(`/team/${team.slug}/team-settings`);
    
          notify('You successfully created Team. Redirecting ...');
        } catch (error) {
          console.log(error);
          notify(error);
        } finally {
          this.setState({ disabled: false });
        }
      };
    ```
    
    `CreateTeam.previewTeamLogo` allows an end user to view their Team's logo **after** selecting the file but before clicking the `Create new team` button (see the above interface code):
    
    ```
      private previewTeamLogo = () => {
        const file = (document.getElementById('upload-file') as HTMLFormElement).files[0];
        if (!file) {
          return;
        }
    
        const reader = new FileReader();
    
        reader.readAsDataURL(file);
    
        reader.onload = (e) => {
          this.setState({ newAvatarUrl: e.target.result as string});
        };
      };
    ```
    
    Again, here we won't go into details about using `FileReader` and `onload` methods. This is because we covered them in detail in Chapter 4, subsection [resizeImage](https://builderbook.org/books/saas-boilerplate/infrastructure-for-user-mongodb-database-mongodb-index-jest-testing-for-typescript-your-settings-page-api-infrastructure-for-uploading-file#resizeimage).
    
-   **export default SomeHOCs(CreateTeam);**:
    
    ```
      export default withAuth((observer(CreateTeam));
    ```
    
    In addition to the `Layout` HOC that we specified inside our interface code, we wrap the `CreateTeam` page component with two more higher-order components: `observer` and `withAuth`.
    

Plug in the above sections into a new file, `book/7-begin/app/pages/create-team.tsx`. You should have the following content:

```
import { observer } from 'mobx-react';
import * as React from 'react';

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Head from 'next/head';
import Router from 'next/router';

import { getSignedRequestForUploadApiMethod, uploadFileUsingSignedPutRequestApiMethod } from '../lib/api/team-member';
import notify from '../lib/notify';
import { resizeImage } from '../lib/resizeImage';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

import Layout from '../components/layout';

const styleGrid = {
  height: '100%',
};

type Props = { store: Store; isTL: boolean; isMobile: boolean };

type State = { newName: string; newAvatarUrl: string | ArrayBuffer; disabled: boolean };

class CreateTeam extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      newName: '',
      newAvatarUrl: 'https://storage.googleapis.com/async-await/default-user.png?v=1',
      disabled: false,
    };
  }

  public render() {
    const { newAvatarUrl } = this.state;

    return (
      <Layout {...this.props}>
        <Head>
          <title>Create Team</title>
          <meta name="description" content="Create a new Team at SaaS Boilerplate" />
        </Head>
        <div style={{ padding: '0px', fontSize: '14px', height: '100%' }}>
          <Grid container style={styleGrid}>
            <Grid
              item
              sm={12}
              xs={12}
              style={{ padding: this.props.isMobile ? '0px' : '0px 30px' }}
            >
              <h3>Create team</h3>
              <p />
              <form onSubmit={this.onSubmit}>
                <h4>Team name</h4>
                <TextField
                  value={this.state.newName}
                  label="Type your team's name."
                  helperText="Team name as seen by your team members."
                  onChange={(event) => {
                    this.setState({ newName: event.target.value });
                  }}
                />
                <p />
                <h4 style={{ marginTop: '40px' }}>Team logo (optional)</h4>
                <Avatar
                  src={newAvatarUrl}
                  style={{
                    display: 'inline-flex',
                    verticalAlign: 'middle',
                    marginRight: 20,
                    width: 60,
                    height: 60,
                  }}
                />
                <label htmlFor="upload-file">
                  <Button variant="outlined" color="primary" component="span">
                    Select team logo
                  </Button>
                </label>
                <input
                  accept="image/*"
                  name="upload-file"
                  id="upload-file"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={this.previewTeamLogo}
                />
                <p />
                <br />
                <br />
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={this.state.disabled}
                >
                  Create new team
                </Button>
              </form>
            </Grid>
          </Grid>
          <br />
        </div>
      </Layout>
    );
  }

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { newName } = this.state;

    if (!newName) {
      notify('Team name is required.');
      return;
    }

    const file = (document.getElementById('upload-file') as HTMLFormElement).files[0];

    try {
      this.setState({ disabled: true });

      const defaultAvatarUrl = 'https://storage.googleapis.com/async-await/default-user.png?v=1';
      const team = await this.props.store.addTeam({
        name: newName,
        avatarUrl: defaultAvatarUrl,
      });

      console.log(`Returned to client: ${team._id}, ${team.name}, ${team.slug}`);

      if (file == null) {
        Router.push(`/team/${team.slug}/team-settings`);
        notify('You successfully created Team.<p />Redirecting...');
        return;
      }

      const fileName = file.name;
      const fileType = file.type;
      const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS;
      const prefix = team.slug;

      const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
        fileName,
        fileType,
        prefix,
        bucket,
      });

      const resizedFile = await resizeImage(file, 128, 128);

      await uploadFileUsingSignedPutRequestApiMethod(resizedFile, responseFromApiServerForUpload.signedRequest, {
        'Cache-Control': 'max-age=2592000',
      });

      const uploadedAvatarUrl = responseFromApiServerForUpload.url;

      await team.updateTheme({ name: team.name, avatarUrl: uploadedAvatarUrl });

      this.setState({
        newName: '',
        newAvatarUrl: 'https://storage.googleapis.com/async-await/default-user.png?v=1',
      });

      (document.getElementById('upload-file') as HTMLFormElement).value = '';

      Router.push(`/team/${team.slug}/team-settings`);

      notify('You successfully created Team. Redirecting ...');
    } catch (error) {
      console.log(error);
      notify(error);
    } finally {
      this.setState({ disabled: false });
    }
  };

  private previewTeamLogo = () => {
    const file = (document.getElementById('upload-file') as HTMLFormElement).files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (e) => {
      this.setState({ newAvatarUrl: e.target.result as string });
    };
  };
}

export default withAuth(observer(CreateTeam));
```

Now that we have a `CreateTeam` page, we can set up a client-side redirect (client-side, because we put logic inside `componentDidMount`) for an end user who does not have a `user.defaultTeamSlug` (`null`, `undefined`, empty string):

```
let redirectUrl = '/login';
let asUrl = '/login';
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

Inside `book/7-begin/app/lib/withAuth.tsx`, replace the following code block with the above code block:

```
let redirectUrl = '/login';
let asUrl = '/login';
if (user) {
  redirectUrl = `/your-settings`;
  asUrl = `/your-settings`;
}
```

Also let's make sure the `CreateTeam` page has `firstGridItem` set to `false`.

Find this code block:

```
if (ctx.pathname.includes('/login')) {
  firstGridItem = false;
}
```

Change it to:

```
if (ctx.pathname.includes('/login') || ctx.pathname.includes('/create-team')) {
  firstGridItem = false;
}
```

The above change to `withAuth` HOC will automatically redirect a newly signed up user to the `CreateTeam` page, because for a newly signed up user, `user.defaultTeamSlug` is an empty string. Our test user, whose document in the database has no `defaultTeamSlug` field, will be redirected to the `CreateTeam` page as well.

After end user creates a new Team on the browser, we run the static method `Team.addTeam` on the server. `Team.addTeam` adds a `defaultTeamSlug` property to the Team Leader's user document in the database. We already added `defaultTeamSlug` to the `User.publicFields` static method on the server. However, we haven't added `defaultTeamSlug` to the `User` data store.

Request was sent redirect to checkout Navigate to this chapter triggers method page component in this book this chapter send this response response You already learned. Server-side rendering server-side rendering S3 bucket static method calls it works as expected withAuth HOC API method email and name request subsection We will discuss compiles new Express route MongoDB database. API infrastructure end user list of posts show notification show notification At AWS dashboard team members team members decorate method with action. Google OAuth API check if value is truthy API infrastructure withAuth HOC end user. In a browser it works as expected response email and name data model on the client. Data model static method calls API method calls corresponding store method discussion AWS dashboard in a browser team members MongoDB database add environmental variable. On server only new Express route session compiles Click on the button static method calls subsection MongoDB database API method calls corresponding store method. S3 bucket static method calls subsection data model Team Leader check if value is truthy send this response send this response email and name conditional operator MongoDB database Material-UI cookie. Navigate to data model new Express route new Express route triggers method cookie team members it works as expected cookie on server only end user withAuth HOC show notification Google OAuth API if truthy then. Cookie add environmental variable withAuth HOC static method calls withAuth HOC on the client open this file Navigate to Team Leader list of posts Put it all together.

Open `book/7-begin/app/lib/store/user.ts` and add the following line:

```
public defaultTeamSlug: string;
```

Under this line:

```
public darkTheme = false;
```

Then add the following line:

```
this.defaultTeamSlug = params.defaultTeamSlug;
```

Under:

```
this.darkTheme = !!params.darkTheme;
```

And finally add the following line:

```
defaultTeamSlug: observable,
```

Under:

```
darkTheme: observable,
```

#### TeamSettings page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#teamsettings-page)

Once an end user creates a Team on the `CreateTeam` page, this user becomes a Team Leader. A Team Leader is redirected by our web application and able to load the `TeamSettings` page, where the Team Leader can manage the settings of their created Team. The page will look very similar to the `YourSettings` page. There is a way to change the Team's name and logo, similar to changing a user's name and avatar. The biggest difference from the `YourSettings` page is a `Team Members` section that displays a table of current and invited Team Members.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-15+19-23-13.png)

We will implement code that displays this list of invited users in the next section, `Invitation API`.

Similar to how we just built the `CreateTeam` page, we will use the page carcass we discussed in the previous subsection to create a new page, `TeamSettings`:

```
// imports

// type Props = ...

// type State = ...

class TeamSettings extends React.Component<Props, State> {
  // public static async getInitialProps

  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      <Layout {...this.props}>
        <Head>
          <title>Team Settings</title>
          <meta name="description" content={`Edit team settings. Add or edit members for Team ${currentTeam.name}`} />
        </Head>
        // interface code for page
      </Layout>
    );
  }

  // page's public methods

  // page's private methods
}

export default SomeHOCs(TeamSettings);
```

We discuss each section below.

-   **imports**:
    
    ```
      import Avatar from '@material-ui/core/Avatar';
      import Button from '@material-ui/core/Button';
      import Grid from '@material-ui/core/Grid';
      import Hidden from '@material-ui/core/Hidden';
      import TextField from '@material-ui/core/TextField';
      import { observer } from 'mobx-react';
      import Head from 'next/head';
      import NProgress from 'nprogress';
      import * as React from 'react';
      import Table from '@material-ui/core/Table';
      import TableBody from '@material-ui/core/TableBody';
      import TableCell from '@material-ui/core/TableCell';
      import TableContainer from '@material-ui/core/TableContainer';
      import TableHead from '@material-ui/core/TableHead';
      import TableRow from '@material-ui/core/TableRow';
      import Paper from '@material-ui/core/Paper';
    
      import Layout from '../components/layout';
      import { getSignedRequestForUploadApiMethod, uploadFileUsingSignedPutRequestApiMethod } from '../lib/api/team-member';
      import notify from '../lib/notify';
      import { Store } from '../lib/store';
      import withAuth from '../lib/withAuth';
    
      const styleGrid = {
        height: '100%',
      };
    ```
    
    Same as the `CreateTeam` page, with the exception of `Table` and related components from Material-UI's library.
    
-   **type Props = ...**:
    
    ```
      type Props = { isMobile: boolean; store: Store; teamSlug: string };
    ```
    
-   **type State = ...**:
    
    ```
      type State = {
        newName: string;
        newAvatarUrl: string;
        disabled: boolean;
      };
    ```
    
-   **public static async getInitialProps**:  
    No need for it. The page component does not need `getInitialProps` defined for the corresponding `class`.
    
-   **constructor(props)**:  
    We do have to define initial `state`, and we do need to access `props` to define this initial `state`. Thus we should use `constructor(props)` instead of `public state =`:
    
    ```
      constructor(props) {
        super(props);
    
        this.state = {
          newName: this.props.store.currentTeam.name,
          newAvatarUrl: this.props.store.currentTeam.avatarUrl,
          disabled: false,
        };
      }
    ```
    
-   **access some values from props or state**:
    
    ```
      const { store, isMobile } = this.props;
      const { currentTeam, currentUser } = store;
      const { newName, newAvatarUrl } = this.state;
      const isTeamLeader = currentTeam && currentUser && currentUser._id === currentTeam.teamLeaderId;
    
      if (!currentTeam || currentTeam.slug !== this.props.teamSlug) {
        return (
          <Layout {...this.props}>
            <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
              <p>You did not select any team.</p>
              <p>
                To access this page, please select existing team or create new team if you have no
                teams.
              </p>
            </div>
          </Layout>
        );
      }
    
      if (!isTeamLeader) {
        return (
          <Layout {...this.props}>
            <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
              <p>Only the Team Leader can access this page.</p>
              <p>Create your own team to become a Team Leader.</p>
            </div>
          </Layout>
        );
      }
    ```
    
    In addition to accessing values inside the `props` and `state` objects, we also added two checks.
    
    The first check checks if `currentTeam` from store is `null` or `undefined` and checks if `teamSlug` from the URL inside the browser's address bar matches `currentTeam.slug`:
    
    ```
      !currentTeam || currentTeam.slug !== this.props.teamSlug
    ```
    
    The second check checks if an end user who tries to access the `TeamSettings` page is a creator of the Team by comparing `currentUser._id` to `currentTeam.teamLeaderId`:
    
    ```
      const isTeamLeader = currentTeam && currentUser && currentUser._id === currentTeam.teamLeaderId;
    ```
    
    Generally, when writing logic where you access some property/parameter of the object, do check if the object itself is not `null` or `undefined`. Say you need to check if `object.someProperty` is equal to `someValue`. Instead of writing:
    
    ```
      `object.someProperty` === `someValue`
    ```
    
    Write:
    
    ```
      `object` && `object.someProperty` === `someValue`
    ```
    
-   **interface code for page**
    
    ```
      <div style={{ padding: isMobile ? '0px' : '0px 30px', fontSize: '15px', height: '100%' }}>
        <h3>Team Settings</h3>
        <p />
        <br />
        <form onSubmit={this.onSubmit}>
          <h4>Team name</h4>
          <TextField
            value={newName}
            helperText="Team name as seen by your team members"
            onChange={(event) => {
              this.setState({ newName: event.target.value });
            }}
          />
          <br />
          <br />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={this.state.disabled}
          >
            Update username
          </Button>
        </form>
        <p />
        <br />
        <h4>Team logo</h4>
        <Avatar
          src={newAvatarUrl}
          style={{
            display: 'inline-flex',
            verticalAlign: 'middle',
            marginRight: 20,
            width: 60,
            height: 60,
          }}
        />
        <label htmlFor="upload-file-team-logo">
          <Button variant="outlined" color="primary" component="span">
            Update logo
          </Button>
        </label>
        <input
          accept="image/*"
          name="upload-file-team-logo"
          id="upload-file-team-logo"
          type="file"
          style={{ display: 'none' }}
          onChange={this.uploadFile}
        />
        <p />
        <br />
        <br />
        <h4 style={{ marginRight: 20, display: 'inline' }}>
          Team Members ( {Array.from(currentTeam.members.values()).length} / 20 )
        </h4>
        <p />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Person</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
    
            <TableBody>
              {Array.from(currentTeam.members.values()).map((m) => (
                <TableRow key={m._id}>
                  <TableCell style={{ width: '300px' }}>
                    <Hidden smDown>
                      <Avatar
                        role="presentation"
                        src={m.avatarUrl}
                        alt={(m.displayName || m.email)[0]}
                        key={m._id}
                        style={{
                          margin: '0px 5px',
                          display: 'inline-flex',
                          width: '30px',
                          height: '30px',
                          verticalAlign: 'middle',
                        }}
                      />
                    </Hidden>
                    {m.email}
                  </TableCell>
                  <TableCell>
                    {isTeamLeader && m._id !== currentUser._id ? 'Team Member' : 'Team Leader'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <p />
        <br />
        <br />
      </div>
    ```
    
    We already discussed all elements and components when building the `YourSettings` page, except for `Table` and its related components:
    
    [https://material-ui.com/components/tables/#table](https://material-ui.com/components/tables/#table)
    
    From the official Material-UI example, the interface for a simple table is:
    
    ```
      <TableContainer>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Dessert (100g serving)</TableCell>
              <TableCell align="right">Calories</TableCell>
              <TableCell align="right">Fat (g)</TableCell>
              <TableCell align="right">Carbs (g)</TableCell>
              <TableCell align="right">Protein (g)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="right">{row.calories}</TableCell>
                <TableCell align="right">{row.fat}</TableCell>
                <TableCell align="right">{row.carbs}</TableCell>
                <TableCell align="right">{row.protein}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ```
    
    We followed the above example exactly.
    
    For every Team Member, we add one table row to the table (`TableRow`). We iterate through the copy of the `currentTeam.members` array:
    
    ```
      Array.from(currentTeam.members.values()).map((m) =>
    ```
    
    `Array.from` creates a shallow copy of an array:
    
    [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/from](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
    
    `Array.map` allows you to run a function for every member of an array and return a new array in which the original members are replaced with the function's result.
    
    In our case, the original array is:
    
    ```
      Array.from(currentTeam.members.values())
    ```
    
    The new array is an array of the `TableRow` components. The number corresponds to the number of members in the team.
    
    The original array is made from the object `currentTeam.members.values()` using the method `values`:
    
    [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_objects/Object/values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values)
    
    We populate `currentTeam.members` with the method `setInitialMembers` of the `Team` data store in `book/7-begin/app/lib/store/team.ts`.
    
    Our table has two columns. In the first column, we show a user's email. In the second column, we show `Team Leader` for the Team Member who created the Team OR `Team Member` for all other Team Members.
    
-   **page's public methods**:  
    Only `TeamSettings.render`. No other public methods for the `TeamSettings` page.
    
-   **page's private methods**:  
    There are two methods: `onSubmit` and `uploadFile`.
    
    `CreateTeam.onSubmit` is very similar to `YourSettings.onSubmit`. Instead of calling the `User` data store method `currentUser.updateProfile`, we need to call the `Team` data store method `currentTeam.updateTheme`. We also made changes to the notifier's text. The rest is practically the same.
    
    `TeamSettings.onSubmit`:
    
    ```
      private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { newName, newAvatarUrl } = this.state;
        const { currentTeam } = this.props.store;
    
        if (!newName) {
          notify('Team name is required');
          return;
        }
    
        NProgress.start();
    
        try {
          this.setState({ disabled: true });
    
          await currentTeam.updateTheme({ name: newName, avatarUrl: newAvatarUrl });
    
          notify('You successfully updated Team name.');
        } catch (error) {
          notify(error);
        } finally {
          this.setState({ disabled: false });
          NProgress.done();
        }
      };
    ```
    
    `TeamSettings.uploadFile` is very similar to `YourSettings.uploadFile`. Instead of `currentUser.slug`, we use `currentTeam.slug` for `prefix` that is used in generating a destination URL for an uploaded file. Instead of calling `currentUser.updateProfile`, we call `currentTeam.updateTheme`:
    
    ```
      private uploadFile = async () => {
        const { store } = this.props;
        const { currentTeam } = store;
    
        const fileElm = document.getElementById('upload-file') as HTMLFormElement;
        const file = fileElm.files[0];
    
        if (file == null) {
          notify('No file selected for upload.');
          return;
        }
    
        const fileName = file.name;
        const fileType = file.type;
    
        NProgress.start();
        this.setState({ disabled: true });
    
        const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS;
        const prefix = `${currentTeam.slug}`
    
        try {
          const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
            fileName,
            fileType,
            prefix,
            bucket,
          });
    
          const resizedFile = await resizeImage(file, 128, 128);
    
          await uploadFileUsingSignedPutRequestApiMethod(
            resizedFile,
            responseFromApiServerForUpload.signedRequest,
            { 'Cache-Control': 'max-age=2592000' },
          );
    
          this.setState({
            newAvatarUrl: responseFromApiServerForUpload.url,
          });
    
          await currentTeam.updateTheme({ name: currentTeam.name, avatarUrl: this.state.newAvatarUrl });
    
          notify('You successfully uploaded new Team logo.');
        } catch (error) {
          notify(error);
        } finally {
          this.setState({ disabled: false });
          NProgress.done();
        }
      };
    ```
    
-   **export default SomeHOCs(TeamSettings);**:
    
    We wrap `TeamSettings` with the `observer` and `withAuth` HOCs:
    
    ```
      export default withAuth((observer(TeamSettings));
    ```
    

Put all of the above sections together inside a new file, `book/7-begin/app/pages/team-settings.tsx`:

```
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import TextField from '@material-ui/core/TextField';
import { observer } from 'mobx-react';
import Head from 'next/head';
import NProgress from 'nprogress';
import * as React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Layout from '../components/layout';
import { getSignedRequestForUploadApiMethod, uploadFileUsingSignedPutRequestApiMethod } from '../lib/api/team-member';
import notify from '../lib/notify';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

const styleGrid = {
  height: '100%',
};

type Props = { isMobile: boolean; store: Store; teamSlug: string };

type State = {
  newName: string;
  newAvatarUrl: string;
  disabled: boolean;
};

class TeamSettings extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      newName: this.props.store.currentTeam.name,
      newAvatarUrl: this.props.store.currentTeam.avatarUrl,
      disabled: false,
    };
  }

  public render() {
    const { store, isMobile } = this.props;
    const { currentTeam, currentUser } = store;
    const { newName, newAvatarUrl } = this.state;
    const isTeamLeader = currentTeam && currentUser && currentUser._id === currentTeam.teamLeaderId;

    if (!currentTeam || currentTeam.slug !== this.props.teamSlug) {
      return (
        <Layout {...this.props}>
          <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
            <p>You did not select any team.</p>
            <p>
              To access this page, please select existing team or create new team if you have no
              teams.
            </p>
          </div>
        </Layout>
      );
    }

    if (!isTeamLeader) {
      return (
        <Layout {...this.props}>
          <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
            <p>Only the Team Leader can access this page.</p>
            <p>Create your own team to become a Team Leader.</p>
          </div>
        </Layout>
      );
    }

    return (
      <Layout {...this.props}>
        <Head>
          <title>Team Settings</title>
          <meta name="description" content={`Edit team settings. Add or edit members for Team ${currentTeam.name}`} />
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px', fontSize: '15px', height: '100%' }}>
          <h3>Team Settings</h3>
          <p />
          <br />
          <form onSubmit={this.onSubmit}>
            <h4>Team name</h4>
            <TextField
              value={newName}
              helperText="Team name as seen by your team members"
              onChange={(event) => {
                this.setState({ newName: event.target.value });
              }}
            />
            <br />
            <br />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={this.state.disabled}
            >
              Update username
            </Button>
          </form>
          <p />
          <br />
          <h4>Team logo</h4>
          <Avatar
            src={newAvatarUrl}
            style={{
              display: 'inline-flex',
              verticalAlign: 'middle',
              marginRight: 20,
              width: 60,
              height: 60,
            }}
          />
          <label htmlFor="upload-file-team-logo">
            <Button variant="outlined" color="primary" component="span">
              Update logo
            </Button>
          </label>
          <input
            accept="image/*"
            name="upload-file-team-logo"
            id="upload-file-team-logo"
            type="file"
            style={{ display: 'none' }}
            onChange={this.uploadFile}
          />
          <p />
          <br />
          <br />
          <h4 style={{ marginRight: 20, display: 'inline' }}>
            Team Members ( {Array.from(currentTeam.members.values()).length} / 20 )
          </h4>
          <p />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {Array.from(currentTeam.members.values()).map((m) => (
                  <TableRow key={m._id}>
                    <TableCell style={{ width: '300px' }}>
                      <Hidden smDown>
                        <Avatar
                          role="presentation"
                          src={m.avatarUrl}
                          alt={(m.displayName || m.email)[0]}
                          key={m._id}
                          style={{
                            margin: '0px 5px',
                            display: 'inline-flex',
                            width: '30px',
                            height: '30px',
                            verticalAlign: 'middle',
                          }}
                        />
                      </Hidden>
                      {m.email}
                    </TableCell>
                    <TableCell>
                      {isTeamLeader && m._id !== currentUser._id ? 'Team Member' : 'Team Leader'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <p />
          <br />
          <br />
        </div>
      </Layout>
    );
  }

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { newName, newAvatarUrl } = this.state;
    const { currentTeam } = this.props.store;

    if (!newName) {
      notify('Team name is required');
      return;
    }

    NProgress.start();

    try {
      this.setState({ disabled: true });

      await currentTeam.updateTheme({ name: newName, avatarUrl: newAvatarUrl });

      notify('You successfully updated Team name.');
    } catch (error) {
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };

  private uploadFile = async () => {
    const { store } = this.props;
    const { currentTeam } = store;

    const fileElm = document.getElementById('upload-file-team-logo') as HTMLFormElement;
    const file = fileElm.files[0];

    if (file == null) {
      notify('No file selected for upload.');
      return;
    }

    const fileName = file.name;
    const fileType = file.type;

    NProgress.start();
    this.setState({ disabled: true });

    const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS;
    const prefix = `${currentTeam.slug}`

    try {
      const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
        fileName,
        fileType,
        prefix,
        bucket,
      });

      const resizedFile = await resizeImage(file, 128, 128);

      await uploadFileUsingSignedPutRequestApiMethod(
        resizedFile,
        responseFromApiServerForUpload.signedRequest,
        { 'Cache-Control': 'max-age=2592000' },
      );

      this.setState({
        newAvatarUrl: responseFromApiServerForUpload.url,
      });

      await currentTeam.updateTheme({ name: currentTeam.name, avatarUrl: this.state.newAvatarUrl });

      notify('You successfully uploaded new Team logo.');
    } catch (error) {
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };
}

export default withAuth(observer(TeamSettings));
```

#### Testing Team API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-team-api)

It's been a big task, but we are done implementing our Team API:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Team+API.png)

Add a new environmental variable to your `book/7-begin/app/.env` file:

```
NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS=
```

The value is the name of S3 bucket where your application stores team logos.

Go to your AWS S3 dashboard and create a new bucket. Follow [these instructions](https://builderbook.org/books/saas-boilerplate/infrastructure-for-user-mongodb-database-mongodb-index-jest-testing-for-typescript-your-settings-page-api-infrastructure-for-uploading-file#env-variables-and-cors-settings-for-uploading-file) from Chapter 4.

After that, add the env variable and its value to `book/7-begin/app/.env`.

Let's start testing our Team API and check if everything works as we designed it.

Go to your dashboard at MongoDB Atlas. Inside the `test.users` collection, find the user document that corresponds to your user. Note that there is no `defaultTeamSlug` field in that document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-16+09-26-59.png)

Also note that there is no `teams` collection in our database yet.

Start both `APP` and `API` with `yarn dev`.

Make sure you are logged-out. Either find the `Logout` link inside the dropdown menu of `Layout` and click it OR manually paste `http://localhost:8000/logout` on your browser tab and load it.

Once logged-out, you will be redirected to the `Login` page.

Go ahead and log in. We will log in using Google OAuth:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-16+12-50-12.png)

You will be redirected to the `YourSettings` page, but because `store.currentTeam` is `undefined`, you will see the above error. This is correct behavior, due to the changes we made to the `Layout` HOC earlier in this section.

There is also a UX problem. Why redirect an end user to the `YourSettings` page? We need to redirect an end user to the `CreateTeam` page to create a Team, since we need `store.currentTeam` on all pages (`Layout` HOC) that have a dropdown menu that requires `store.currentTeam.slug`:

```
{
  text: 'Team Settings',
  href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
  as: `/team/${store.currentTeam.slug}/team-settings`,
  simple: true,
},
```

Let's make the necessary changes to redirect a user to the `CreateTeam` page if `req.user.defaultTeamSlug` is `null` or `undefined` or empty string - that means the user either has not created a Team or did not accept/receive an invitation to become a member of some Team. Open both `book/7-begin/api/server/google-auth.ts` and `book/7-begin/api/server/passwordless-auth.ts`. Find this line in both files:

```
res.redirect(`${process.env.URL_APP}/your-settings`);
```

In both files, replace the above line with:

```
let teamSlugOfInvitedTeam;

if (req.user && req.session.invitationToken) {
  teamSlugOfInvitedTeam = await Invitation.addUserToTeam({
    token: req.session.invitationToken,
    user: req.user,
  }).catch((err) => console.error(err));

  req.session.invitationToken = null;
}

let redirectUrlAfterLogin;
const defaultTeamSlug = req.user && req.user.defaultTeamSlug;

if (teamSlugOfInvitedTeam || defaultTeamSlug) {
  redirectUrlAfterLogin = `/your-settings`;
} else {
  redirectUrlAfterLogin = `/create-team`;
}

res.redirect(`${process.env.URL_APP}${redirectUrlAfterLogin}`);
```

In both files, remember to replace `_` with `req` inside `(_, res) =>`.

When the `req.user` object is not `null` or `undefined` and when `req.user.defaultTeamSlug` is `null` or `undefined` or an empty string - our application will redirect an end user to the `CreateTeam` page instead of `YourSettings` page.

We also introduced `teamSlugOfInvitedTeam` that we haven't defined yet. In the next section, Invitation API, we will define it as teamId of team to which invitee user is invited.

Let's test this new logic. Log out of our application by pasting `http://localhost:8000/logout` into the browser's address bar and clicking `Enter`.

Then log in using Google OAuth:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-16+12-57-51.png)

The new redirect works! The browser's address bar shows `http://localhost:3000/create-team`. And if you open `Chrome Developer Tools` by pressing `Ctrl + Shift + J` on your Chrome browser, you will see the main `store` object on the `Console` tab.

```
currentTeam: undefined
currentUrl: "/create-team"
currentUser: User {store: Store, _id: "5eb31fdd2ea04220e52aba66", slug: "team-bb", email: "team@builderbook.org", displayName: "Team BB", …}
isServer: false
__proto__: Object
```

As expected, `store.currentUrl` has a value of `/create-team` and `store.currentTeam` has a value of `undefined`. Our test user has not created a Team yet.

Next, go ahead and fill out the form. Provide a Team name and optional logo:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-16+13-02-19.png)

Note that you can preview the selected team logo before it is uploaded to your S3 bucket, courtesy of the `CreateTeam.previewTeamLogo` method.

Click the `Create new team` button.

You will see an error shown by `Notifier`; `Failed to fetch`.

Go ahead and check the `test.teams` and `test.users` collection in your `test` database at MongoDB Atlas. You will indeed find a new team document with `slug: 1`, and your user document will have `defaultTeamSlug: 1` field.

So why this error?

Since redirect to the `TeamSettings` page did not work (see `book/7-begin/app/pages/create-team.tsx`):

```
Router.push(`/team/${team.slug}/team-settings`);
```

Then the error occured somewhere earlier.

That's because `teamSlug` is **not** accessible as `ctx.query.teamSlug`, and we use `teamSlug` inside `App.getInitialProps` to populate `initialState.teamSlug`. `initialState.teamSlug` is later used by the `store.setCurrentTeam` method. So you see now, if `ctx.query.teamSlug` is `null` or `undefined`, then `store.currentTeam` is `undefined`.

So how do we fix this problem? How do we make `ctx.query.teamSlug` to have a non-`null`, non-`undefined`, non-empty value?

Let's confirm that `ctx.query.teamSlug` is indeed the culprit.

Open `book/7-begin/app/pages/_app.tsx` file, under the line:

```
const { teamSlug } = ctx.query;
```

Add a new line:

```
console.log(`ctx.query.teamSlug:${teamSlug}`);
```

Next, confirm that you indeed have a new team document inside the `test.teams` collection in your MongoDB database. This new team document should have a `slug` with value `1`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+06-26-15.png)

Since we implemented the `TeamSettings` page earlier, we should be able to access it by loading the following route:

```
http://localhost:3000/team/:teamSlug/team-settings
```

`teamSlug` in the above route is called a `router parameter`, which is a part of the URL that our Express server (our `APP` project is Next.js-Express.js) can read and access as `req.params`:

[https://expressjs.com/en/guide/routing.html](https://expressjs.com/en/guide/routing.html)

Here is an example from official docs:

```
Route path: /users/:userId/books/:bookId
Request URL: http://localhost:3000/users/34/books/8989
req.params: { "userId": "34", "bookId": "8989" }
```

In our case, we can read the value as `req.params.teamSlug`.

Start both `APP` and `API` projects with `yarn dev`. Try loading the following route in the browser, since we do have a team document with `slug: 1`:

```
http://localhost:3000/team/1/team-settings
```

On your browser, you will get:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+06-39-09.png)

On the terminal tab for your `APP` project:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+06-39-40.png)

As we suspected:

```
ctx.query.teamSlug:undefined
```

So we have a few problems to solve:

1.  First problem, the `404` error suggest that the `TeamSettings` page does not exist. We just build it, so we know that it does in fact exist. However, we did not tell our Next.js-Express.js server to render the `TeamSettings` page when an end user loads `/team/:teamSlug/team-settings`. All Next.js knows is that the `TeamSettings` page will be loaded if an end user loads `/team-settings`.  
    Go ahead and load `http://localhost:3000/team-settings` in your browser:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+06-44-55.png)
    
    Instead of the `404` error, you get another error that indicates that `store.currentTeam` is `undefined`, but at least Next.js attempted to load `TeamSettings`.
    
    So the first problem is to customize an access route for the `TeamSettings` page.
    
    We can do it simply by defining a new Express route in our `APP` project. You already created many Express routes in the `API` projejct, so we are skipping the details of how to define an Express route:
    
    ```
     server.get('/team/:teamSlug/team-settings', (req, res) => {
       app.render(req, res, '/team-settings');
     });
    ```
    
    By adding the above Express route, we tell our Next.js-Express.js server to load the `TeamSettings` page when an end user loads `/team/:teamSlug/team-settings` in the browser. Open `book/7-begin/app/server/server.ts` and add the above Express route **above**:
    
    ```
     server.all('*', (req, res) => {
       handle(req, res);
     });
    ```
    
    Let's also add one more missing page route - `/invitation` route. We would like to render Invitation page and pass value of `req.query.token` to it:
    
    ```
     server.get('/invitation', (req, res) => {
       app.render(req, res, '/invitation', { token: req.query.token as string });
     });
    ```
    
    We will read this passed value inside `Invitation.getInitialProps` method.
    
    You need to define custom Express routes when user-loaded URL does not match Next.js's page route or when you want to pass query or params value from URL to page's props. In case of Invitation page we do just that, pass value of `token` query to page. Inside `Invitation.getInitialProps` method we will access this value as `ctx.query.token` and pass it to page's initial props.
    
    Go to your browser and load:
    
    ```
     http://localhost:3000/team/1/team-settings
    ```
    
    You will see that now our application indeed attempts to load `TeamSettings` instead of showing the `404` error, but `store.currentTeam` is `undefined`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+06-53-57.png)
    
2.  Second problem, we still get:
    
    ```
     ctx.query.teamSlug:undefined
    ```
    
    That's because we haven't extracted the value of `teamSlug` from the `/team/:teamSlug/team-settings`. To do so, let's modify our newly created Express route to become:
    
    ```
     server.get('/team/:teamSlug/team-settings', (req, res) => {
       const { teamSlug } = req.params;
       app.render(req, res, '/team-settings', { teamSlug });
     });
    ```
    
    In your browser, load:
    
    ```
     http://localhost:3000/team/1/team-settings
    ```
    
    Now `TeamSettings` loads as it should:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+08-18-55.png)
    
3.  Third problem, we need to make sure that the S3 bucket we created for team logos has the same region as the S3 setting in the `book/7-begin/api/server/aws-s3.ts` file:
    
    ```
     const s3 = new aws.S3({
       apiVersion: 'latest',
       region: process.env.AWS_REGION,
       accessKeyId: process.env.AWS_ACCESSKEYID,
       secretAccessKey: process.env.AWS_SECRETACCESSKEY,
     });
    ```
    
    In our case, it's `us-east-1`. For you, it can be a different region.
    

After solving the above three problems, you will be able create a new Team at the `CreateTeam` page and edit the name/logo of your Team at the `TeamSettings` page.

An important side note - `req.user.id` is a type of `string`, and `req.user._id` is a type of `object`. So if you would like to work with `req.user._id`, go inside your models' static methods and use the `objectId.toString` method to convert the value to a `string`:

[https://docs.mongodb.com/manual/reference/method/ObjectId.toString](https://docs.mongodb.com/manual/reference/method/ObjectId.toString)

Add two new `console.log` statements to the Express route `/teams/update` in `book/7-begin/api/server/api/team-member.ts`:

```
router.post('/teams/update', async (req: any, res, next) => {
  try {
    const { teamId, name, avatarUrl } = req.body;

    console.log(req.user.id, typeof req.user.id);
    console.log(req.user._id, typeof req.user._id);

    const team = await Team.updateTeam({
      userId: req.user.id,
      teamId,
      name,
      avatarUrl,
    });

    res.json(team);
  } catch (err) {
    next(err);
  }
});
```

Go to the `TeamSettings` page and update either `name` or `avatarUrl`. Then look at the terminal with the `API` server's output:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-18+09-56-56.png)

In the next section, we will add functionality to add and remove members from a Team. To do so, we will discuss and build a new data model and API infrastructure: Invitation API.

___

## Invitation API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#invitation-api)

This is the last section of Chapter 7. Here, we discuss one more important data model and API infrastructure: Invitation API. In most SaaS applications that are designed for team collaboration, there is a way to manage team members. Typically, an inviter (in our case the Team Leader) sends an invitation to the invitee (in our case, a Team Member). A Team Member can accept the invitation and become part of the Team. Once part of the Team, this Team Member has permission to interact with pages and data that are only available to Team Members.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Team%2C+TL%2C+TM%2C+Invitation.png)

Like any other data model and API infrastructure, we can summarize Invitation API in our SaaS boilerplate:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Invitation+API.png)

In the previous section, Team API, we built the entire API infrastructure from the ground up starting with Mongoose model and static methods and ending with pages and components. We started from server-only code (`API` project) and finished with server/client code (`APP` project; code can run on both server and client).

Here we suggest we take the opposite approach - start with pages and components and end with model and static methods. As you gain more experience, you will be able to build any part of an API infrastructure. We might as well practice going in the opposite direction.

To send an invitation, a Team Leader has to provide our application with an invited user's email address. Our application will send an invitation email to invited user. This email contains an invitation link. After clicking on this link, an inivted user is redirected to an Invitation page that has a `LoginButton` component. If the invited user was already logged in to our application, this invited user automatically becomes a Team Member and is shown a informational message. If the invited user was not logged in to our application, then this invited user has to log in. Once logged in, the inivted user becomes a Team Member.

In production AWS dashboard Remember to add import MongoDB database it works as expected Put it all together redirect to checkout S3 bucket static method calls. HTTP compiles decorate method with action page component HTTP mount middleware production-ready open this file withAuth HOC withAuth HOC. API infrastructure decorate method with action redirect to checkout redirect to checkout discussion S3 bucket Material-UI API infrastructure in production new Express route in this book on the client conditional operator. Remember to add import S3 bucket discussion conditional operator Click on the button store method calls discussion page component API method calls corresponding store method Material-UI. API method calls corresponding store method HTTP At AWS dashboard request was sent discussion Remember to add import in a browser. Show notification withAuth HOC Material-UI Material-UI Team Leader session check if value is truthy. If truthy then check if value is truthy Put it all together API method data model We will discuss. API method calls corresponding store method response open this file in a browser end user S3 bucket. Conditional operator add environmental variable request was sent send this response Put it all together decorate method with action. At AWS dashboard conditional operator request in production API method calls corresponding store method AWS dashboard redirect to checkout HTTP You already learned.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Inviting+user.png)

#### Updating TeamSettings page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-teamsettings-page)

As you already know from building the `TeamSettings` page in the previous section, the page shows a table of Team Members, among other things. We need to show the Team Leader not only current the Team Members but also the invited ones. That's good UX, as it prevents a Team Leader from sending multiple invitations. Plus, when an invited user accepts an invitation, the user gets removed from the table of invited users and added to the table of Team Members.

Here a list of updates we need to make to the `TeamSettings` page:

1.  Table of invited users
2.  Button that triggers an `InviteMember` component to be shown and associated page method
3.  `InviteMember` component and associated page method
4.  Icon to remove a Team Member from the Team and associated page method

We discuss each of the above tasks individually:

1.  The table of invited users is practically the same as the table of Team Members. We simply iterate through a different array. Instead of `currentTeam.members`, we iterate through `currentTeam.invitations`.
    
    ```
     {Array.from(currentTeam.invitations.values()).length > 0 ? (
       <React.Fragment>
         <h4>
           Invited users
         </h4>
         <p />
         <TableContainer>
           <Table>
             <TableHead>
               <TableRow>
                 <TableCell>Email</TableCell>
                 <TableCell>Status</TableCell>
               </TableRow>
             </TableHead>
    
             <TableBody>
               {Array.from(currentTeam.invitations.values()).map((i) => (
                 <TableRow key={i._id}>
                   <TableCell style={{ width: '300px' }}>{i.email}</TableCell>
                   <TableCell>Sent</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </TableContainer>
       </React.Fragment>
     ) : null}
    ```
    
    The table of invited users is made of two columns: the left column has invited users' email addresses, and the right column simply shows the status `Sent`. Keep in mind, we haven't made any changes to the `Team` data store to populate the `currentTeam.invitations` array. Your VS code editor will highlight `invitations` and show:
    
    ```
     Property 'invitations' does not exist on type 'Team'.ts(2339)
    ```
    
    That's ok. We decided to build pages and components first and then update data stores and store methods. We haven't defined the property `invitations` for our `Team` data store. As we make progress in this section and create new definitions, we will clear all warnings.
    
    We discussed how iteration works (`map`), Material-UI's `Table`. and related components earlier when building the table of current Team Members.
    
2.  Button that triggers `InviteMember` component:
    
    ```
     <Button
       onClick={this.openInviteMember}
       variant="contained"
       color="primary"
       style={{ float: 'right', marginTop: '-20px' }}
       disabled={this.state.disabled}
     >
       Invite member
     </Button>
    ```
    
    The associated page method `openInviteMember` simply changes the default value of `inviteMemberOpen` from `false` to `true`:
    
    ```
     private openInviteMember = async () => {
       const { currentTeam } = this.props.store;
       if (!currentTeam) {
         notify('You have not selected a Team.');
         return;
       }
    
       this.setState({ inviteMemberOpen: true });
     };
    ```
    
    We should remember to add the missing boolean parameter `inviteMemberOpen` to type definition:
    
    ```
     type State = {
       newName: string;
       newAvatarUrl: string;
       disabled: boolean;
       inviteMemberOpen: boolean;
     };
    ```
    
    And to initial state inside `TeamSettings.constructor`:
    
    ```
     this.state = {
       newName: this.props.store.currentTeam.name,
       newAvatarUrl: this.props.store.currentTeam.avatarUrl,
       disabled: false,
       inviteMemberOpen: false,
     };
    ```
    
3.  We define the `InviteMember` component in `book/7-begin/app/components/teams/InviteMember.tsx`. Here, on the `TeamSettings` page, we simply import and use `InviteMember` like this:
    
    ```
     <InviteMember
       open={this.state.inviteMemberOpen}
       onClose={this.handleInviteMemberClose}
       store={this.props.store}
     />
    ```
    
    The `open` prop for `InviteMember` controls whether the underlying modal component (`Dialog` from Material-UI's library) is visible. The `onClose` prop hides the `InviteMember` component on the `TeamSettings` page and sets the initial `email` value to an empty string. `onClose` also enables a disabled button. We also pass a `store` prop. We will define the `InviteMember` component in the next subsection, and then you will see how we use `open`, `onClose`, and `store` props.
    
    The associated page component's method `handleInviteMemberClose`:
    
    ```
     private handleInviteMemberClose = () => {
       this.setState({ inviteMemberOpen: false });
     };
    ```
    
4.  When a Team Leader clicks on the `delete` icon from Material-UI's library, our application executes the page's `removeMember` method.
    
    ```
     <TableCell>
       {isTeamLeader && m._id !== currentUser._id ? (
         <i
           color="action"
           data-id={m._id}
           onClick={this.removeMember}
           style={{
             marginLeft: '20px',
             fontSize: '16px',
             opacity: 0.6,
             cursor: 'pointer',
             verticalAlign: 'middle',
           }}
           className="material-icons"
         >
           delete
         </i>
       ) : null}
     </TableCell>
    ```
    
    Add the above code for a new table cell under this existing table cell in the table of Team Members:
    
    ```
     <TableCell>
       {isTeamLeader && m._id !== currentUser._id ? 'Team Member' : 'Team Leader'}
     </TableCell>
    ```
    
    Associated method `removeMember`:
    
    ```
     private removeMember = (event) => {
       const { currentTeam } = this.props.store;
       if (!currentTeam) {
         notify('You have not selected a Team.');
         return;
       }
    
       const userId = event.currentTarget.dataset.id;
       if (!userId) {
         notify('Select user.');
         return;
       }
    
       confirm({
         title: 'Are you sure?',
         message: '',
         onAnswer: async (answer) => {
           if (answer) {
             try {
               await currentTeam.removeMember(userId);
             } catch (error) {
               notify(error);
             }
           }
         },
       });
     };
    ```
    

After adding missing imports, the code for `TeamSettings` should become (`book/7-begin/app/pages/team-settings.tsx`):

```
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Hidden from '@material-ui/core/Hidden';
import TextField from '@material-ui/core/TextField';
import { inject, observer } from 'mobx-react';
import Head from 'next/head';
import NProgress from 'nprogress';
import * as React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Layout from '../components/layout';
import InviteMember from '../components/teams/InviteMember';
import { getSignedRequestForUploadApiMethod, uploadFileUsingSignedPutRequestApiMethod } from '../lib/api/team-member';
import confirm from '../lib/confirm';
import notify from '../lib/notify';
import { resizeImage } from '../lib/resizeImage';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

type Props = { isMobile: boolean; store: Store; teamSlug: string };

type State = {
  newName: string;
  newAvatarUrl: string;
  disabled: boolean;
  inviteMemberOpen: boolean;
};

class TeamSettings extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      newName: this.props.store.currentTeam.name,
      newAvatarUrl: this.props.store.currentTeam.avatarUrl,
      disabled: false,
      inviteMemberOpen: false,
    };
  }

  public render() {
    const { store, isMobile } = this.props;
    const { currentTeam, currentUser } = store;
    const { newName, newAvatarUrl } = this.state;
    const isTeamLeader = currentTeam && currentUser && currentUser._id === currentTeam.teamLeaderId;

    if (!currentTeam || currentTeam.slug !== this.props.teamSlug) {
      return (
        <Layout {...this.props}>
          <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
            <p>You did not select any team.</p>
            <p>
              To access this page, please select existing team or create new team if you have no
              teams.
            </p>
          </div>
        </Layout>
      );
    }

    if (!isTeamLeader) {
      return (
        <Layout {...this.props}>
          <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
            <p>Only the Team Leader can access this page.</p>
            <p>Create your own team to become a Team Leader.</p>
          </div>
        </Layout>
      );
    }

    return (
      <Layout {...this.props}>
        <Head>
          <title>Team Settings</title>
          <meta name="description" content={`Edit team settings. Add or edit members for Team ${currentTeam.name}`} />
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px', fontSize: '15px', height: '100%' }}>
              <h3>Team Settings</h3>
              <p />
              <br />
              <form onSubmit={this.onSubmit}>
                <h4>Team name</h4>
                <TextField
                  value={newName}
                  helperText="Team name as seen by your team members"
                  onChange={(event) => {
                    this.setState({ newName: event.target.value });
                  }}
                />
                <br />
                <br />
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={this.state.disabled}
                >
                  Update username
                </Button>
              </form>
              <p />
              <br />
              <h4>Team logo</h4>
              <Avatar
                src={newAvatarUrl}
                style={{
                  display: 'inline-flex',
                  verticalAlign: 'middle',
                  marginRight: 20,
                  width: 60,
                  height: 60,
                }}
              />
              <label htmlFor="upload-file-team-logo">
                <Button
                  variant="outlined"
                  color="primary"
                  component="span"
                  disabled={this.state.disabled}
                >
                  Update logo
                </Button>
              </label>
              <input
                accept="image/*"
                name="upload-file-team-logo"
                id="upload-file-team-logo"
                type="file"
                style={{ display: 'none' }}
                onChange={this.uploadFile}
              />
              <p />
              <br />
              <br />
              <h4 style={{ marginRight: 20, display: 'inline' }}>
                Team Members ( {Array.from(currentTeam.members.values()).length} / 20 )
              </h4>
              <Button
                onClick={this.openInviteMember}
                variant="contained"
                color="primary"
                style={{ float: 'right', marginTop: '-20px' }}
                disabled={this.state.disabled}
              >
                Invite member
              </Button>
              <p />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Person</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {Array.from(currentTeam.members.values()).map((m) => (
                      <TableRow key={m._id}>
                        <TableCell style={{ width: '300px' }}>
                          <Hidden smDown>
                            <Avatar
                              role="presentation"
                              src={m.avatarUrl}
                              alt={(m.displayName || m.email)[0]}
                              key={m._id}
                              style={{
                                margin: '0px 5px',
                                display: 'inline-flex',
                                width: '30px',
                                height: '30px',
                                verticalAlign: 'middle',
                              }}
                            />
                          </Hidden>
                          {m.email}
                        </TableCell>
                        <TableCell>
                          {isTeamLeader && m._id !== currentUser._id ? 'Team Member' : 'Team Leader'}
                        </TableCell>
                        <TableCell>
                        {isTeamLeader && m._id !== currentUser._id ? (
                          <i
                            color="action"
                            data-id={m._id}
                            onClick={this.removeMember}
                            style={{
                              marginLeft: '20px',
                              fontSize: '16px',
                              opacity: 0.6,
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                            }}
                            className="material-icons"
                          >
                            delete
                          </i>
                        ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <p />
              <br />

              {Array.from(currentTeam.invitations.values()).length > 0 ? (
                <React.Fragment>
                  <h4>
                    Invited users
                  </h4>
                  <p />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Email</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {Array.from(currentTeam.invitations.values()).map((i) => (
                          <TableRow key={i._id}>
                            <TableCell style={{ width: '300px' }}>{i.email}</TableCell>
                            <TableCell>Sent</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </React.Fragment>
              ) : null}
              <p />
              <br />
              <InviteMember
                open={this.state.inviteMemberOpen}
                onClose={this.handleInviteMemberClose}
                store={this.props.store}
              />
          <br />
        </div>
      </Layout>
    );
  }

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { newName, newAvatarUrl } = this.state;
    const { currentTeam } = this.props.store;

    if (!newName) {
      notify('Team name is required');
      return;
    }

    NProgress.start();

    try {
      this.setState({ disabled: true });

      await currentTeam.updateTheme({ name: newName, avatarUrl: newAvatarUrl });

      notify('You successfully updated Team name.');
    } catch (error) {
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };

  private uploadFile = async () => {
    const { store } = this.props;
    const { currentTeam } = store;

    const fileElement = document.getElementById('upload-file-team-logo') as HTMLFormElement;
    const file = fileElement.files[0];

    if (file == null) {
      notify('No file selected for upload.');
      return;
    }

    const fileName = file.name;
    const fileType = file.type;

    NProgress.start();
    this.setState({ disabled: true });

    const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS;
    const prefix = `${currentTeam.slug}`

    console.log(bucket);

    try {
      const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
        fileName,
        fileType,
        prefix,
        bucket,
      });

      const resizedFile = await resizeImage(file, 128, 128);

      await uploadFileUsingSignedPutRequestApiMethod(
        resizedFile,
        responseFromApiServerForUpload.signedRequest,
        { 'Cache-Control': 'max-age=2592000' },
      );

      this.setState({
        newAvatarUrl: responseFromApiServerForUpload.url,
      });

      await currentTeam.updateTheme({
        name: this.state.newName,
        avatarUrl: this.state.newAvatarUrl,
      });

      notify('You successfully uploaded new Team logo.');
    } catch (error) {
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };

  private openInviteMember = async () => {
    const { currentTeam } = this.props.store;
    if (!currentTeam) {
      notify('You have not selected a Team.');
      return;
    }

    this.setState({ inviteMemberOpen: true });
  };

  private handleInviteMemberClose = () => {
    this.setState({ inviteMemberOpen: false });
  };

  private removeMember = (event) => {
    const { currentTeam } = this.props.store;
    if (!currentTeam) {
      notify('You have not selected a Team.');
      return;
    }

    const userId = event.currentTarget.dataset.id;
    if (!userId) {
      notify('Select user.');
      return;
    }

    confirm({
      title: 'Are you sure?',
      message: '',
      onAnswer: async (answer) => {
        if (answer) {
          try {
            await currentTeam.removeMember(userId);
          } catch (error) {
            notify(error);
          }
        }
      },
    });
  };
}

export default withAuth(inject('store')(observer(TeamSettings)));
```

#### InviteMember component [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#invitemember-component)

`InviteMember` is a modal that contains a `form` element. The `form` is made of one `TextField` and two `Button` components from Material-UI's library. The goal of `InviteMember` is to allow a Team Leader to provide an email address of an invited user.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-21+09-32-42.png)

You are already familiar with `TextField` and `Button` components from building forms earlier in this book. We use Material-UI's `Dialog` to create a modal:

[https://material-ui.com/components/dialogs/#dialog](https://material-ui.com/components/dialogs/#dialog)

We followed this example from the official docs:

[https://material-ui.com/components/dialogs/#form-dialogs](https://material-ui.com/components/dialogs/#form-dialogs)

Here is a code snippet for the above example:

```
<Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
  <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
  <DialogContent>
    <DialogContentText>
      To subscribe to this website, please enter your email address here. We will send updates
      occasionally.
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      id="name"
      label="Email Address"
      type="email"
      fullWidth
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose} color="primary">
      Cancel
    </Button>
    <Button onClick={handleClose} color="primary">
      Subscribe
    </Button>
  </DialogActions>
</Dialog>
```

We decided to use only three out of five components - `Dialog`, `DialogTitle` and `DialogContent` - like this:

```
<Dialog onClose={this.handleClose} aria-labelledby="invite-member-dialog-title" open={open}>
  <DialogTitle id="invite-member-dialog-title">Invite member</DialogTitle>
  <DialogContent>
    <form onSubmit={this.onSubmit} style={{ padding: '20px' }}>
      <TextField
        autoComplete="off"
        value={this.state.email}
        placeholder="Email"
        onChange={(event) => {
          this.setState({ email: event.target.value });
        }}
      />
      <p />
      <br />
      <Button variant="outlined" onClick={this.handleClose} disabled={this.state.disabled}>
        Cancel
      </Button>{' '}
      <Button type="submit" variant="contained" color="primary" disabled={this.state.disabled}>
        Invite
      </Button>
    </form>
  </DialogContent>
</Dialog>
```

When a Team Leader clicks the `Cancel` button, our application executes the `handleClose` method that should, among other things, hide the modal:

```
private handleClose = () => {
  this.setState({ email: '', disabled: false });
  this.props.onClose();
};
```

As you can see, the `handleClose` method achieves two goals when executed. First, it sets the `email` value of `TextField` to an empty string and makes buttons clickable. Second, it executes the `onClose` function, which gets defined like this:

```
<InviteMember
  open={this.state.inviteMemberOpen}
  onClose={this.handleInviteMemberClose}
  store={this.props.store}
/>
```

And the definition for `handleInviteMemberClose` method:

```
private handleInviteMemberClose = () => {
  this.setState({ inviteMemberOpen: false });
};
```

To summarize, an end user clicks on the `Cancel` button of `InviteMember`. That triggers `onClose` to execute. In return, it sets `this.state.inviteMemberOpen` to `false`. As a result, the `open` prop gets set to `false`, and modal becomes hidden.

If a Team Leader clicks the `Invite` button, the `onSubmit` method executes:

```
private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const { store } = this.props;

  if (!store.currentTeam) {
    notify('Team have not selected');
    return;
  }

  const { email } = this.state;

  if (!email) {
    notify('Email is required');
    return;
  }

  NProgress.start();
  try {
    this.setState({ disabled: true });
    await store.currentTeam.inviteMember({ email });

    this.setState({ email: '' });
    notify('You successfully sent invitation.');
    NProgress.done();
  } catch (error) {
    console.log(error);
    notify(error);
  } finally {
    this.props.onClose();
    this.setState({ disabled: false });
    NProgress.done();
  }
};
```

You already create multiple `onSubmit` methods for forms in this book, so we are not going through details here. An important point is that `onSubmit` executes `store.currentTeam.inviteMember` with the argument `email`. We are yet to define the store method `inviteMember` for our `Team` data store.

Create a new file, `book/7-begin/app/components/teams/InviteMember.tsx`, and use the above code we discussed to define the `InviteMember` component. We leave it to you to write the import and export sections:

```
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { inject, observer } from 'mobx-react';
import NProgress from 'nprogress';
import React from 'react';

import notify from '../../lib/notify';
import { Store } from '../../lib/store';

type Props = {
  store: Store;
  onClose: () => void;
  open: boolean;
};

type State = {
  email: string;
  disabled: boolean;
};

class InviteMember extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      disabled: false,
    };
  }

  public render() {
    const { open } = this.props;

    return (
      <Dialog onClose={this.handleClose} aria-labelledby="invite-member-dialog-title" open={open}>
        <DialogTitle id="invite-member-dialog-title">Invite member</DialogTitle>
        <DialogContent>
          <form onSubmit={this.onSubmit} style={{ padding: '20px' }}>
            <TextField
              autoComplete="off"
              value={this.state.email}
              placeholder="Email"
              onChange={(event) => {
                this.setState({ email: event.target.value });
              }}
            />
            <p />
            <br />
            <Button variant="outlined" onClick={this.handleClose} disabled={this.state.disabled}>
              Cancel
            </Button>{' '}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={this.state.disabled}
            >
              Invite
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  private handleClose = () => {
    this.setState({ email: '', disabled: false });
    this.props.onClose();
  };

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { store } = this.props;

    if (!store.currentTeam) {
      notify('Team have not selected');
      return;
    }

    const { email } = this.state;

    if (!email) {
      notify('Email is required');
      return;
    }

    NProgress.start();
    try {
      this.setState({ disabled: true });
      await store.currentTeam.inviteMember(email);

      this.setState({ email: '' });
      notify('You successfully sent invitation.');
      NProgress.done();
    } catch (error) {
      console.log(error);
      notify(error);
    } finally {
      this.props.onClose();
      this.setState({ disabled: false });
      NProgress.done();
    }
  };
}

export default inject('store')(observer(InviteMember));
```

#### Invitation page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#invitation-page)

So far we made changes to the `TeamSettings` page so that a Team Leader is able to provide email addresses of invited users. After submitting an email address, our application will execute the `store.currentTeam.inviteMember` store method.

However, we haven't created a page on which an invited user lands after clicking the invitation link inside the invitation email. We need this page for invited users who either (1) never signed up in our application or (2) signed up but are currently logged out. If an invited user is logged in, we simply show an informational message using the `notify` method. But if an invited user is logged out (never signed up or signed up but logged out), then our application will redirect that user to the `Invitation` page.

The `Invitation` page is very similar to the `Login` page. It also uses `LoginButton` to render two authentication methods: Google OAuth and Passwordless.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-21+11-05-18.png)

Indeed, very similar to the `Login` page. There is a Team logo, Team name, and some extra text. Another difference is the route, which you can check in the browser's address bar:

```
/invitation?token=zaambiynrk90nw77b8y8
```

So we need query `token` inside the inivitation link. As you already know, the value of `token` can be accessed as `ctx.query.token`. We discussed a similar situation when we created the route `/team/:teamSlug/team-settings` and then read the value of `teamSlug` as `ctx.query.teamSlug` in the previous section.

S3 bucket Remember to add import open this file email and name Remember to add import HTTP response email and name request was sent it works as expected You already learned if truthy then static method calls add environmental variable request was sent. API method if truthy then session send this response send this response mount middleware request was sent static method calls on the client API method calls corresponding store method static method calls Google OAuth API subsection subsection. Send this response end user subsection HTTP Click on the button team members AWS dashboard Google OAuth API end user in a browser show notification. Page component At AWS dashboard this chapter response withAuth HOC add environmental variable on server only decorate method with action request was sent open this file if truthy then list of posts list of posts Navigate to on the client. It works as expected mount middleware it works as expected in this book decorate method with action if truthy then check if value is truthy. End user check if value is truthy AWS dashboard triggers method end user conditional operator API method Put it all together We will discuss end user At AWS dashboard. Production-ready withAuth HOC production-ready Next.js web application request was sent subsection. Show notification subsection cookie S3 bucket send this response if truthy then data model in this book send this response this chapter add environmental variable withAuth HOC Remember to add import decorate method with action. Send this response request add environmental variable compiles triggers method server-side rendering page component API method calls corresponding store method Put it all together withAuth HOC. MongoDB database At AWS dashboard in production withAuth HOC store method calls API method calls corresponding store method Click on the button page component redirect to checkout store method calls list of posts conditional operator Remember to add import.

In the previous section, we came up with a page carcass, a code structure that helps us create new pages in our SaaS boilerplate. Let's discuss this carcass for our `Invitation` page:

```
// imports

// type Props = ...

// type State = ...

class InvitationPageComp extends React.Component<Props, State> {
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

export default SomeHOCs(InvitationPageComp);
```

-   **imports**:
    
    ```
      import Avatar from '@material-ui/core/Avatar';
      import { observer } from 'mobx-react';
      import Error from 'next/error';
      import Head from 'next/head';
      import Router from 'next/router';
      import React from 'react';
    
      import LoginButton from '../components/common/LoginButton';
      import Layout from '../components/layout';
      import { getTeamByTokenApiMethod } from '../lib/api/public';
      import notify from '../lib/notify';
      import { Team } from '../lib/store/team';
      import { Store } from '../lib/store';
      import withAuth from '../lib/withAuth';
    ```
    
-   **type Props = ...**:
    
    ```
      type Props = { store: Store; team: Team; token: string };
    ```
    
-   **public static async getInitialProps**:
    
    ```
      public static async getInitialProps(ctx) {
        const { token } = ctx.query;
        if (!token) {
          return {};
        }
    
        try {
          const { team } = await getTeamByTokenApiMethod(token, ctx.req);
    
          return { team, token };
        } catch (error) {
          console.log(error);
          return {};
        }
      }
    ```
    
    `Invitation.getInitialProps` populates two props: `team` and `token`. The API method `getTeamByTokenApiMethod` is not yet defined.
    
-   **access some values from props or state**:
    
    ```
      const { team, token, store } = this.props;
    
      if (!team) {
        return <Error statusCode={404} />;
      }
    
      const user = store.currentUser;
    
      if (user) {
        return null;
      }
    ```
    
    If the `team` object is `null` or `undefined`, our application returns a 404 error page. We achieve this by returning the `Error` component provided to us by Next.js. If an invited user is logged-in, `store.currentUser` is not `null` or `undefined`. In that case, instead of returning the `Invitation` page, our application returns `null`.
    
-   **interface code for page**:
    
    ```
      <div style={{ textAlign: 'center', margin: '0 20px' }}>
        <br />
        <Avatar
          src={`${
            team.avatarUrl || 'https://storage.googleapis.com/async-await/default-user.png?v=1'
          }`}
          alt="Team logo"
          style={{
            verticalAlign: 'middle',
            display: 'inline-flex',
          }}
        />{' '}
        <h2>{team.name}</h2>
        <p>
          Join <b>{team.name}</b>  by logging in or signing up.
        </p>
        <br />
        <LoginButton invitationToken={token} />
      </div>
    ```
    
    We, as developers of our application, want to provide an invited user with good UX - we show the Team's name and logo to an invited user. We also display text that explains that an invited user is about to accept an invitation to become a Team Member.
    
    Note that we pass a `token` value to the `LoginButton`'s prop `invitationToken`.
    
-   **page's public methods**:
    
    ```
      public async componentDidMount() {
        const { store, team, token } = this.props;
    
        const user = store.currentUser;
    
        if (user && team) {
          Router.push(
            `${process.env.NEXT_PUBLIC_URL_API}/logout?invitationToken=${token}`,
            `${process.env.NEXT_PUBLIC_URL_API}/logout`,
          );
        }
      }
    ```
    
    If `store.currentUser` is not `null` or `undefined`, then an invited user is logged in to our application. In that case, we need to remove the invitation document from the `test.invitation` collection of our database.
    
    We wrote earlier this block that returns `null` instead of invitation page when user is logged-in:
    
    ```
      if (user) {
        return null;
      }
    ```
    
    In other words, our code returns `null` if a user exists (logged-in). Returning null (showing empty browser window) is not a great UX.
    
    We need to:
    
    ```
    * render some simple interface showing the invited user that accepting the invitation indeed succeeded 
    * or redirect the invited user to some existing page and show a success message there
    * or log out user and redirect user to the invitation page
    ```
    
    Here, we chose to log out user and redirect user to `InvitationCompPage`. Invited user will not become part of team until invited user logs in or signs up on `InvitationCompPage`. Code that logs out invited user if user is logged-in:
    
    ```
      Router.push(
        `${process.env.NEXT_PUBLIC_URL_API}/logout?invitationToken=${token}`,
        `${process.env.NEXT_PUBLIC_URL_API}/logout`,
      );
    ```
    
    We also chose to include a query to our redirect URL, so it has the format of `/logout?invitationToken=someString`. We included the query using a URL object:  
    [https://nextjs.org/docs/api-reference/next/router#with-url-object](https://nextjs.org/docs/api-reference/next/router#with-url-object)
    
    We want to include `invitationToken` query, because we want not only to log out user - we also want user to be redirected to `InvitationCompPage` with the original value of `token`. To do so we also need to modify Express route `/logout`. Open `book/7-begin/api/server/passwordless-auth.ts`, update Express route `/logout` so it becomes:
    
    ```
      server.get('/logout', (req, res, next) => {
        req.logout((err) => {
          if (err) {
            next(err);
          }
    
          if (req.query && req.query.invitationToken) {
            res.redirect(`${process.env.URL_APP}/invitation?token=${req.query.invitationToken}`);
          } else {
            res.redirect(`${process.env.URL_APP}/login`);
          }
        });
      });
    ```
    
    If `invitationToken` is falsy, we redirect to `Login` page. If `invitationToken` is truthy, we redirect to `InvitationCompPage` page with the original value of `token`. Then invited user has to complete invitation flow by logging in or signing up at `InvitationCompPage` page.
    

Create a new file, `book/7-begin/app/pages/invitation.tsx`, and add the content we discussed above:

```
import Avatar from '@material-ui/core/Avatar';
import { observer } from 'mobx-react';
import Error from 'next/error';
import Head from 'next/head';
import Router from 'next/router';
import React from 'react';

import LoginButton from '../components/common/LoginButton';
import Layout from '../components/layout';
import { getTeamByTokenApiMethod } from '../lib/api/public';
import notify from '../lib/notify';
import { Team } from '../lib/store/team';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

class InvitationPageComp extends React.Component<{ store: Store; team: Team; token: string }> {
  public static async getInitialProps(ctx) {
    const { token } = ctx.query;
    if (!token) {
      return {};
    }

    try {
      const { team } = await getTeamByTokenApiMethod(token, ctx.req);

      return { team, token };
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  public render() {
    const { team, token, store } = this.props;

    if (!team) {
      return <Error statusCode={404} />;
    }

    const user = store.currentUser;

    if (user) {
      return null;
    }

    return (
      <Layout {...this.props}>
        <Head>
          <title>Invitation to {team.name}</title>
          <meta name="description" content={`Invitation to join ${team.name}`} />
        </Head>
        <div style={{ textAlign: 'center', margin: '0 20px' }}>
          <br />
          <Avatar
            src={`${
              team.avatarUrl || 'https://storage.googleapis.com/async-await/default-user.png?v=1'
            }`}
            alt="Team logo"
            style={{
              verticalAlign: 'middle',
              display: 'inline-flex',
            }}
          />{' '}
          <h2>{team.name}</h2>
          <p>
            Join <b>{team.name}</b>  by logging in or signing up.
          </p>
          <br />
          <LoginButton invitationToken={token} />
        </div>
      </Layout>
    );
  }

  public async componentDidMount() {
    const { store, team, token } = this.props;

    const user = store.currentUser;

    if (user && team) {
      Router.push(
        `${process.env.NEXT_PUBLIC_URL_API}/logout?invitationToken=${token}`,
        `${process.env.NEXT_PUBLIC_URL_API}/logout`,
      );
    }
  }
}

export default withAuth(observer(InvitationPageComp), { loginRequired: false });
```

#### Updating LoginButton component [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-loginbutton-component)

On the `Invitation` page, we passed a `token` value to the `LoginButton` component like this:

```
<LoginButton invitationToken={token} />
```

Our goal is to pass the value of `invitationToken` to our `API` server, and we have to do it for both authentication methods: Google OAuth and Passwordless.

For Google OAuth, we can inclde the value of `invitationToken` into the URL as a query. Since we already discussed the `teamSlug` query before, you are already familiar with the concept of query. In our application, the Express.js server can read the value using `req.params.teamSlug`, and the Next.js server/browser can read the value as `ctx.query.teamSlug`. Here, we can construct a URL using the `makeQueryString` method, so the URL contains the query `invitationToken`:

```
let url = `${process.env.NEXT_PUBLIC_URL_API}/auth/google`;
const qs = makeQueryString({ invitationToken });

if (qs) {
  url += `?${qs}`;
}

console.log(url);
```

Then we use `url` for the button `Log in with Google`:

```
<Button variant="contained" color="secondary" href={url}>
```

For Passwordless, we can simply add a second argument to the `emailLoginLinkApiMethod` API method:

```
private onSubmit = async (event) => {
  event.preventDefault();
  const { email } = this.state;
  const { invitationToken } = this.props;

  if (!email) {
    notify('Email is required');
  }

  try {
    await emailLoginLinkApiMethod({ email, invitationToken });
    this.setState({ email: '' });
    notify('SaaS boilerplate emailed you a login link.');
  } catch (error) {
    notify(error);
  }
};
```

Let's remember to update `emailLoginLinkApiMethod` API method in one of the next subsections.

Make the above changes to the `LoginButton` component. Also, separately define types for `props` and `state`. You should end up with the following content for `book/7-begin/app/components/common/LoginButton.tsx`:

```
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import React from 'react';

import { emailLoginLinkApiMethod } from '../../lib/api/public';
import notify from '../../lib/notify';
import { makeQueryString } from '../../lib/api/makeQueryString';

type Props = { invitationToken?: string };
type State = { email: string };

class LoginButton extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = { email: '' };
  }

  public render() {
    const { invitationToken } = this.props;

    let url = `${process.env.NEXT_PUBLIC_URL_API}/auth/google`;
    const qs = makeQueryString({ invitationToken });

    if (qs) {
      url += `?${qs}`;
    }

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
        <hr style={{ width: '60px' }} /> <h4>OR</h4> <hr style={{ width: '60px' }} />
        <p />
        <br />
        <div>
          <form autoComplete="off" onSubmit={this.onSubmit}>
            <TextField
              required
              type="email"
              label="Email address"
              value={this.state.email}
              onChange={(event) => {
                this.setState({ email: event.target.value });
              }}
              style={{ width: '300px' }}
            />
            <p />
            <Button variant="contained" color="primary" type="submit">
              Log in with email
            </Button>
          </form>
          <p />
          <br />
        </div>
      </React.Fragment>
    );
  }

  private onSubmit = async (event) => {
    event.preventDefault();
    const { email } = this.state;
    const { invitationToken } = this.props;

    if (!email) {
      notify('Email is required');
    }

    try {
      await emailLoginLinkApiMethod({ email, invitationToken });
      this.setState({ email: '' });
      notify('SaaS boilerplate emailed you a login link.');
    } catch (error) {
      notify(error);
    }
  };
}

export default LoginButton;
```

We used the `makeQueryString` method to generate a URL that contains a specified query, but we haven't defined it.

Create a new file, `book/7-begin/app/lib/api/makeQueryString.ts`, with the following content:

```
function makeQueryString(params) {
  const query = Object.keys(params)
    .filter((k) => !!params[k])
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  return query;
}

export { makeQueryString };
```

To better understand how this method works, go to your browser, click `Ctrl + Shift + J`, and navigate to the `Console` tab.  
Paste the following code into the browser's console:

```
function makeQueryString(params) {
  const query = Object.keys(params)
    .filter((k) => !!params[k])
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  return query;
}
makeQueryString({ invitationToken: '123abc' });
```

Click `Enter`, and you will see following output:  
"invitationToken=123abc"

So for Google OAuth, the value for `url` would have become `${process.env.URL_API}/auth/google?invitationToken=123abc`.

If we passed two parameters, `url` would have become `${process.env.URL_API}/auth/google?invitationToken=123abc&secondParameter=someValue`.

You can read about the JavaScript methods we used in the official docs:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Object/keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) (discussed in this book earlier)

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Array/join](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)

This is not the only place where we will use the `makeQueryString` method. When we discuss API methods related to Invitation API, we will use this method again, for the definition of `getTeamMembersApiMethod`.

It's important to note that our application is hybrid - it has Next.js and Express.js, it can run on server and on client (browser). So when you, as a developer, need to read data from a URL inside the `getInitialProps` method, access it via `ctx.query`, like we did it for `ctx.query.teamSlug`.

Inside Next.js's `getInitialProps`, either on server or browser, you will use `ctx.query` for the following URLs:

```
/team/:teamSlug/team-settings
?invitationToken=someValue
```

On the Express.js server, you would use `req.params` to access the `teamSlug` value for:

```
/team/:teamSlug/team-settings`
```

But you will use `req.query` to access the `invitationToken` value for the URL in this format:

```
?invitationToken=someValue
```

It's important to understand why we have **both**:

-   Express route that accesses the `teamSlug` value with `req.params.teamSlug` and
-   `ctx.query.teamSlug` inside `App.getInitialProps`

The Express route runs only on the server (`API` project is for server-only code). When an end user loads a server-side rendered page (end user loads a page in a new browser tab), the Express route `/team/:teamSlug/team-settings` runs **on the server** and populates `ctx.query` with `teamSlug` using:

```
app.render(req, res, '/team-settings', { teamSlug });
```

Then `App.getInitialProps` runs **on the server** to populate the `TeamSettings` page's props.

In the case of a client-side rendered page (end user loads a page by clicking on the `Link` component from Next.js), an Express route does not get called. We, as developers, need to construct a proper route using:

```
?teamSlug=someValue
```

And we have to pass this route as an `href` prop of the `Link` component. We actually did it inside `book/7-begin/app/components/layout/index.tsx`. Find the line `/team-settings?teamSlug=${store.currentTeam.slug}` inside:

```
<MenuWithLinks
  options={[
    {
      text: 'Team Settings',
      href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
      as: `/team/${store.currentTeam.slug}/team-settings`,
      simple: true,
    },
    {
      text: 'Billing',
      href: `/billing?teamSlug=${store.currentTeam.slug}`,
      as: `/team/${store.currentTeam.slug}/billing`,
      simple: true,
    },
    {
      text: 'Your Settings',
      href: '/your-settings',
      highlighterSlug: '/your-settings',
    },
    {
      separator: true,
    },
    {
      text: 'Log out',
      href: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
      as: `${process.env.NEXT_PUBLIC_URL_API}/logout`,
      externalServer: true,
    },
  ]}
>
```

So for a client-side rendered page, we have `ctx.query.teamSlug` available because we constructed a properly formatted route for the `href` prop of the `Link` component. After that, the `App.getInitialProps` method runs **on the browser**.

Since our application can render pages **on both** server and client - we need both Express routes and `Link` components with a proper `href` prop to make `ctx.query` have a query property with the value extracted from the corresponding route.

___

#### Invitation data store - Invitation [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#invitation-data-store-invitation)

We are done with pages and the component part of our Invitation API implementation. The next step is data store and store methods. The `Invitation` data store itself will not have any store methods because inviting member, removing member, and populating `store.currentTeam.invitations`, logically, are in the `Team` data store's methods.

Create a new file `book/7-begin/app/lib/store/invitation.ts` with the following content:

```
class Invitation {
  public _id: string;
  public teamId: string;
  public email: string;
  public createdAt: Date;

  constructor(params) {
    Object.assign(this, params);
  }
}

export { Invitation };
```

It's a simple data store with no store methods. The properties (parameters) are the same as fields for the invitation document in our MongoDB database.

___

#### Updating Team data store - Invitation [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-team-data-store-invitation)

When constructing new pages and components for our Invitation API, we used but did not define a few store methods.

We need to modify the `Team` data store by adding two new store methods:

-   `inviteMember` (we used it inside the `InviteMember` component at the `TeamSettings` page)
-   `removeMember` (we used it directly inside the `TeamSettings` page)

And we need to modify an existing store method so the `store.currentTeam.invitations` array gets populated with actual data:

-   `setInitialMembers`

Open `book/7-begin/app/lib/store/team.ts`. We will be making additions and updates to this file.

The new store method `inviteMember` calls the `inviteMemberApiMethod` API method and gets the `newInvitation` object. Then it creates a new `Invitation` data store using a `newInvitation` object and adds it to a `this.invitations` array:

```
public async inviteMember(email: string) {
  try {
    const { newInvitation } = await inviteMemberApiMethod({ teamId: this._id, email });

    runInAction(() => {
      this.invitations.set(newInvitation._id, new Invitation(newInvitation));
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

Because of how we defined the `inviteMember` store method, we have to import the `Invitation` data store and define the `invitations` property for our `Team` data store:

```
import { Invitation } from './invitation';
```

and:

```
public invitations: Map<string, Invitation> = new Map();
```

The new store method `removeMember` calls the `removeMemberApiMethod` API method. Then, if there is no error, it deletes the matching user object from the `this.members` and `this.memberIds` arrays:

```
public async removeMember(userId: string) {
  try {
    await removeMemberApiMethod({ teamId: this._id, userId });

    runInAction(() => {
      this.members.delete(userId);
      this.memberIds.remove(userId);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

Finally, let's update the `setInitialMembers` store method:

```
public setInitialMembers(users) {
  this.members.clear();

  for (const user of users) {
    if (this.store.currentUser && this.store.currentUser._id === user._id) {
      this.members.set(user._id, this.store.currentUser);
    } else {
      this.members.set(user._id, new User(user));
    }
  }
}
```

Currently, this method populates the `this.members` array with data. We need it to **also** populate the `this.invitations` array. First, let's make the method accept an extra argument: `inivitations`. Then we simply populate the `this.invitations` array in the same way as we populate the `this.members` array. To better describe what the method does, we rename it from `setInitialMembers` to `setInitialMembersAndInvitations`:

```
public setInitialMembersAndInvitations(users, invitations) {
  this.members.clear();
  this.invitations.clear();

  for (const user of users) {
    if (this.store.currentUser && this.store.currentUser._id === user._id) {
      this.members.set(user._id, this.store.currentUser);
    } else {
      this.members.set(user._id, new User(user));
    }
  }

  for (const invitation of invitations) {
    this.invitations.set(invitation._id, new Invitation(invitation));
  }
}
```

A natural question is where do we get this second `invitations` argument for the `setInitialMembersAndInvitations` store method? We get the argument where we get all of our initial data - from `initialState`, which contains `initialData`. We get all initial data after `App.getInitialProps` calls the `getInitialDataApiMethod` API method and adds `initialData` to every page's props:

```
// some code

if (userObj) {
  try {
    initialData = await getInitialDataApiMethod({
      request: ctx.req,
      data: { teamSlug },
    });
  } catch (error) {
    console.error(error);
  }
}

return {
  ...appProps,
  initialState: { user: userObj, currentUrl: ctx.asPath, teamSlug, ...initialData },
};
```

So in the upcoming section on Express routes, let's make sure that we make changes to the Express route `/get-initial-data`, so it returns `initialInvitations` in addition to `initialMembers`.

Back to the `Team` data store. Since we renamed the store method `setInitialMembers` to `setInitialMembersAndInvitations`, we also need to update it inside `store.setCurrentTeam`. We use the method there as:

```
this.currentTeam.setInitialMembers(users);
```

Open `book/7-begin/app/lib/store/index.ts` and replace the above line with the following two lines of code:

```
const invitations =
  team.initialInvitations ||
  (await getTeamInvitationsApiMethod(this.currentTeam._id)).invitations;

this.currentTeam.setInitialMembersAndInvitations(users, invitations);
```

Remember to add the missing import to `book/7-begin/app/lib/store/index.ts` like so:

```
import { addTeamApiMethod, getTeamInvitationsApiMethod } from '../api/team-leader';
```

If you followed this subsection closely, you should have the following content for `book/7-begin/app/lib/store/team.ts`:

```
import { action, decorate, IObservableArray, observable, runInAction } from 'mobx';
import {
  inviteMemberApiMethod,
  removeMemberApiMethod,
  updateTeamApiMethod,
} from '../api/team-leader';
import { Store } from './index';
import { User } from './user';
import { Invitation } from './invitation';

class Team {
  public store: Store;

  public _id: string;
  public teamLeaderId: string;

  public name: string;
  public slug: string;
  public avatarUrl: string;
  public memberIds: IObservableArray<string> = observable([]);
  public members: Map<string, User> = new Map();
  public invitations: Map<string, Invitation> = new Map();

  constructor(params) {
    this._id = params._id;
    this.teamLeaderId = params.teamLeaderId;
    this.slug = params.slug;
    this.name = params.name;
    this.avatarUrl = params.avatarUrl;
    this.memberIds.replace(params.memberIds || []);

    this.store = params.store;
  }

  public setInitialMembersAndInvitations(users, invitations) {
    this.members.clear();
    this.invitations.clear();

    for (const user of users) {
      if (this.store.currentUser && this.store.currentUser._id === user._id) {
        this.members.set(user._id, this.store.currentUser);
      } else {
        this.members.set(user._id, new User(user));
      }
    }

    for (const invitation of invitations) {
      this.invitations.set(invitation._id, new Invitation(invitation));
    }
  }

  public async updateTheme({ name, avatarUrl }: { name: string; avatarUrl: string }) {
    try {
      const { slug } = await updateTeamApiMethod({
        teamId: this._id,
        name,
        avatarUrl,
      });

      runInAction(() => {
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.slug = slug;
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async inviteMember(email: string) {
    try {
      const { newInvitation } = await inviteMemberApiMethod({ teamId: this._id, email });

      runInAction(() => {
        this.invitations.set(newInvitation._id, new Invitation(newInvitation));
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async removeMember(userId: string) {
    try {
      await removeMemberApiMethod({ teamId: this._id, userId });

      runInAction(() => {
        this.members.delete(userId);
        this.memberIds.remove(userId);
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

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

export { Team };
```

We updated the `decorate` section with this new property and updated the name for our existing store method and two new store methods.

___

#### API methods - Invitation [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-methods-invitation)

We are almost done with changes to our `APP` project. The only part remaining is API methods. After this subsection, we will begin working on Express routes of our `API` project.

Response discussion You already learned email and name session API infrastructure request Team Leader this chapter Material-UI. End user We will discuss HTTP email and name if truthy then compiles session in production S3 bucket cookie mount middleware subsection if truthy then session. HTTP MongoDB database in a browser redirect to checkout Click on the button on server only on the client on the client HTTP API method calls corresponding store method in a browser. Production-ready At AWS dashboard email and name team members request was sent Click on the button production-ready withAuth HOC. Triggers method data model decorate method with action At AWS dashboard conditional operator. End user compiles end user compiles You already learned Next.js web application Next.js web application production-ready new Express route new Express route data model team members production-ready You already learned Navigate to. We will discuss MongoDB database new Express route team members compiles in production API infrastructure. Click on the button withAuth HOC Material-UI server-side rendering Google OAuth API static method calls Click on the button session discussion withAuth HOC Remember to add import HTTP this chapter show notification withAuth HOC. In production HTTP page component triggers method on the client if truthy then. Server-side rendering API method Navigate to You already learned discussion conditional operator.

We have two groups of API methods to work on in this subsection. The first is for a Team Leader only, and the second is for public use.

1.  First. We have three API methods to add to Team Leader-specific API methods. We have `inviteMemberApiMethod` and `removeMemberApiMethod` that we used when defining store methods for the `Team` data store. We also have `getTeamInvitationsApiMethod` that we used inside `store.setCurrentTeam`. All three of these API methods are only for the Team Leader's use at the `TeamSettings` page. Thus, we can add all three of them to `book/7-begin/app/lib/api/team-leader.ts`:
    
    ```
     export const inviteMemberApiMethod = (data) =>
       sendRequestAndGetResponse(`${BASE_PATH}/teams/invite-member`, {
         body: JSON.stringify(data),
       });
    
     export const removeMemberApiMethod = (data) =>
       sendRequestAndGetResponse(`${BASE_PATH}/teams/remove-member`, {
         body: JSON.stringify(data),
       });
    
     export const getTeamInvitationsApiMethod = (teamId: string) =>
       sendRequestAndGetResponse(`${BASE_PATH}/teams/get-invitations-for-team`, {
         method: 'GET',
         qs: { teamId },
       });
    ```
    
    The first two requests have the `POST` method, since they are sending `email` and `userId`, respectively, to the `API` server. The last one has the `GET` method and contains `teamId` as a URL query. We discussed the way Next.js and Express.js uses query to extract data from a URL earlier in this section. In order for us, application developers, to access the `teamId` value on our `API` server as `req.query.teamId`, we need to make sure that the API endpoint has the following format:
    
    ```
    /teams/get-invitations-for-team?teamId=someValue
    ```
    
    And this is what the `makeQueryString` method can do for us. Earlier in this section, we defined and used the `makeQueryString` method to add `invitationToken` query to our Google OAuth API endpoint. Now we can use this same `makeQueryString` method to add `?teamId=someValue` to the `/teams/get-invitations-for-team` API endpoint. To do so, we need to open `book/7-begin/app/lib/api/sendRequestAndGetResponse.ts` and replace this line:
    
    ```
    const qs = opts.qs || '';
    ```
    
    With this new line:
    
    ```
    const qs = (opts.qs && `?${makeQueryString(opts.qs)}`) || '';
    ```
    
    Please do rememeber to import:
    
    ```
    import { makeQueryString } from './makeQueryString';
    ```
    
    Done! Now, we can access the `teamId` value as `req.query.teamId` inside an Express route at our `API` server.
    
    In fact, this is not the first API method that adds query to an API endpoint. The first one was `getTeamMembersApiMethod` that we defined earlier inside `book/7-begin/app/lib/api/team-member.ts`:
    
    ```
    export const getTeamMembersApiMethod = (teamId: string) =>
     sendRequestAndGetResponse(`${BASE_PATH}/teams/get-members`, {
       method: 'GET',
       qs: { teamId },
     });
    ```
    
    That's right. This `getTeamMembersApiMethod` does not work properly without `makeQueryString`, but now it does.
    
2.  Second. On the `Invitation` page, we use API method directly, without calling store method: `getTeamByTokenApiMethod` API method without corresponding store method. Let's define them. By nature, an end user on our `Invitation` page is a logged-out user. Thus, these API methods are public in nature. And thus, we put them together with other public API methods inside `book/7-begin/app/lib/api/public.ts`:
    
    ```
     export const getTeamByTokenApiMethod = (token: string, request) =>
       sendRequestAndGetResponse(`${BASE_PATH}/invitations/get-team-by-token`, {
         request,
         method: 'GET',
         qs: { token },
       });
    ```
    
    As you may guess from the name, the first API method called `getTeamByTokenApiMethod` will get a Team from the `API` server using a token included in the API endpoint. We then use Team to populate the Team's name and Team's logo on the `Invitation` page.
    
    In addition to the above two new public API methods, we have to modify an existing API method - `emailLoginLinkApiMethod`. We use this API method for Passwordless API. Currently, `emailLoginLinkApiMethod`, which we built in Chapter 6, looks like this:
    
    ```
     export const emailLoginLinkApiMethod = ({ email }: { email: string }) =>
       sendRequestAndGetResponse('/auth/email-login-link', {
         body: JSON.stringify({ user: email }),
       });
    ```
    
    After we pass `invitationToken` as an additional argument and included its value into the API endpoint as query:
    
    ```
     export const emailLoginLinkApiMethod = ({
       email,
       invitationToken,
     }: {
       email: string;
       invitationToken?: string;
     }) =>
       sendRequestAndGetResponse('/auth/email-login-link', {
         qs: { invitationToken },
         body: JSON.stringify({ user: email }),
       });
    ```
    

We do not have any Team Member-specific API methods to add or modify. However, in the next subsection, we will modify the Express route `/get-initial-data` so it returns more data - namely, `initialInvitations`.

Another important point, there is an API method for Passwordless API (`emailLoginLinkApiMethod`), but there is no API method for Google OAuth API. However, there is an API endpoint with `invitationToken` query - check up the `LoginButton` component:

```
let url = `${process.env.NEXT_PUBLIC_URL_API}/auth/google`;
const qs = makeQueryString({ invitationToken });

if (qs) {
  url += `?${qs}`;
}
```

So we gotta modify logic inside Google OAuth's Express routes `/auth/google` and `/oauth2callback`.

___

#### Express routes - Invitation [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-invitation)

Building Express routes is somewhat easy once you've defined API methods. It's also easier to build API methods once Express routes are defined. All you do is to look at matching API endpoints.

In this subsection, we will work on these five tasks:

1.  Update Team Leader-specific Express routes.
2.  Update public Express routes.
3.  Update Express route `/get-initial-data` so it returns `initialInvitations`.
4.  Update Express routes related to Google OAuth API. These are Express routes `/auth/google` and `/oauth2callback`. So an invited user that logs into our application from the `Invitation` page is added to the Team as a Team Member and the correpsonding invitation document is removed from our database.
5.  Update Express routes related to Passwordless API. These are Express routes `/auth/email-login-link'` and `/auth/logged_in`. The reasons are the same as for task 4 above.

Let's get to it:

1.  Open your `book/7-begin/api/server/api/team-leader.ts` file. The Express route `/teams/get-invitations-for-team` accepts a request from the `getTeamInvitationsApiMethod` API method and calls the static method `Invitation.getTeamInvitations`. The Express route `/teams/invite-member` accepts a request from the `inviteMemberApiMethod` API method and calls the static method `Invitation.add`. The Express route `/teams/remove-member` accepts a request from the `removeMemberApiMethod` API method and calls the static method `Team.removeMember`.
    
    ```
     router.get('/teams/get-invitations-for-team', async (req: any, res, next) => {
       try {
         const invitations = await Invitation.getTeamInvitations({
           userId: req.user.id,
           teamId: req.query.teamId as string,
         });
    
         res.json({ invitations });
       } catch (err) {
         next(err);
       }
     });
    
     router.post('/teams/invite-member', async (req: any, res, next) => {
       try {
         const { teamId, email } = req.body;
    
         const newInvitation = await Invitation.add({ userId: req.user.id, teamId, email });
    
         res.json({ newInvitation });
       } catch (err) {
         next(err);
       }
     });
    
     router.post('/teams/remove-member', async (req: any, res, next) => {
       try {
         const { teamId, userId } = req.body;
    
         await Team.removeMember({ teamLeaderId: req.user.id, teamId, userId });
    
         res.json({ done: 1 });
       } catch (err) {
         next(err);
       }
     });
    ```
    
    Add the above three new Express routes at the end of the file.
    
2.  Open `book/7-begin/api/server/api/public.ts` and add two new Express routes that our application sends a request to from the `Invitation` page. The Express route `/invitations/get-team-by-token` accepts a request from the `getTeamByTokenApiMethod` API method and calls the static method `Invitation.getTeamByToken`.
    
    Add this new Express route at the end of the `public.ts` file.
    
    ```
     router.get('/invitations/get-team-by-token', async (req, res, next) => {
       const token = req.query.token as string;
    
       try {
         const team = await Invitation.getTeamByToken({ token });
    
         res.json({ team });
       } catch (err) {
         next(err);
       }
     });
    ```
    
3.  Open `book/7-begin/api/server/api/team-member.ts`, find the method `loadTeamData`, and update it like this:
    
    ```
    async function loadTeamData(team, userId) {
      const initialMembers = await User.getTeamMembers({
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
    
    We called static `Invitation.getTeamInvitations` to add an array of invitation objects to `data`. That means the Express route `/get-initial-data` will send a response that contains two arrays,`{ initialMembers, initialInvitations }`, instead of one array, `{ initialMembers }`.
    
    Please do remember to add this import statement:
    
    ```
    import Invitation from '../models/Invitation';
    ```
    
4.  Open `book/7-begin/api/server/google-auth.ts`. Since we included `invitationToken` as a query into our API endpoint, we can access it as `req.query.invitationToken` on the `API` server when it gets a request from `APP`. Then we can save this value on the `API` server to `req.session.invitationToken`. Then, when our `API` server receives a request from the Google OAuth server, we can check if `req.session.invitationToken` is non-`null` and non-`undefined`. If so, call the static method `Invitation.addUserToTeam` and get `teamSlugOfInvitedTeam`. Make these discussed changes to `/auth/google` and `/oauth2callback` Express routes:
    
    ```
     server.get('/auth/google', (req, res, next) => {
       const options = {
         scope: ['profile', 'email'],
         prompt: 'select_account',
       };
    
       if (req.query && req.query.invitationToken) {
         req.session.invitationToken = req.query.invitationToken;
       } else {
         req.session.invitationToken = null;
       }
    
       passport.authenticate('google', options)(req, res, next);
     });
    
     server.get(
       '/oauth2callback',
       passport.authenticate('google', {
         failureRedirect: '/login',
       }),
       async (req, res) => {
         let teamSlugOfInvitedTeam;
    
         if (req.user && req.session.invitationToken) {
           teamSlugOfInvitedTeam = await Invitation.addUserToTeam({
             token: req.session.invitationToken,
             user: req.user,
           }).catch((err) => console.error(err));
    
           req.session.invitationToken = null;
         }
    
         let redirectUrlAfterLogin;
         const defaultTeamSlug = req.user && req.user.defaultTeamSlug;
    
         if (teamSlugOfInvitedTeam || defaultTeamSlug) {
           redirectUrlAfterLogin = `/your-settings`;
         } else {
           redirectUrlAfterLogin = `/create-team`;
         }
    
         res.redirect(`${process.env.URL_APP}${redirectUrlAfterLogin}`);
       },
    ```
    
    Remember to import:
    
    ```
     import Invitation from './models/Invitation';
    ```
    

5.  Open `api/server/passwordless-auth.ts` and update the following two Express routes in the exact same way as you did in the above task:
    
    ```
     server.post(
       '/auth/email-login-link',
       passwordless.requestToken(async (email, __, callback) => {
         try {
           const user = await User.findOne({ email }).select('_id').setOptions({ lean: true });
    
           if (user) {
             callback(null, user._id);
           } else {
             const id = await mongoStore.storeOrUpdateByEmail(email);
             callback(null, id);
           }
         } catch (error) {
           callback(error, null);
         }
       }),
       (req, res) => {
         if (req.query && req.query.invitationToken) {
           req.session.invitationToken = req.query.invitationToken;
         } else {
           req.session.invitationToken = null;
         }
    
         res.json({ done: 1 });
       },
     );
    
     server.get(
       '/auth/logged_in',
       passwordless.acceptToken(),
       (req, __, next) => {
         if (req.user && typeof req.user === 'string') {
           User.findById(req.user, User.publicFields())
             .then((user) => {
               req.user = user;
               next();
             })
             .catch((err) => {
               next(err);
             });
         } else {
           next();
         }
       },
       async (req, res) => {
         let teamSlugOfInvitedTeam;
    
         if (req.user && req.session.invitationToken) {
           teamSlugOfInvitedTeam = await Invitation.addUserToTeam({
             token: req.session.invitationToken,
             user: req.user,
         }).catch((err) => console.error(err));
    
         req.session.invitationToken = null;
       }
         let redirectUrlAfterLogin;
         const defaultTeamSlug = req.user && req.user.defaultTeamSlug;
    
         if (teamSlugOfInvitedTeam || defaultTeamSlug) {
           redirectUrlAfterLogin = `/your-settings`;
         } else {
           redirectUrlAfterLogin = `/create-team`;
         }
         res.redirect(`${process.env.URL_APP}${redirectUrlAfterLogin}`);
       },
     );
    ```
    
    Remember to import:
    
    ```
     import Invitation from './models/Invitation';
    ```
    

___

#### Model and static methods [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#model-and-static-methods)

We defined Express routes in the previous subsection. In this subsection, we will define an `Invitation` model and associated static methods.

Let's make a list of all static methods we need to define to complete our Invitation API. Look at the previous subsection and simply add each static method to the list. After doing so, you should get:

-   `Invitation.getTeamInvitations`
-   `Invitation.add`
-   `Team.removeMember`
-   `Invitation.getTeamByToken`
-   `Invitation.getTeamInvitations`
-   `Invitation.addUserToTeam`

So for our `Invitation` data model, we need to define the following five unique static methods:

-   `Invitation.add`
-   `Invitation.getTeamInvitations`
-   `Invitation.getTeamByToken`
-   `Invitation.addUserToTeam`

The `Invitation` data schema is relatively simple and has only four parameters (in addition to auto-generated `_id`):

```
const mongoSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 60 * 60 * 24, // delete doc after 24 hours
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
});
```

We discussed how to construct a data schema earlier in this book when working on `User`, `EmailTemplate`, and `Team` models. So we don't go into much detail here. It's worth noting the `expires` option for a parameter with type `Date`:

[https://mongoosejs.com/docs/api.html#schemadateoptions\_SchemaDateOptions-expires](https://mongoosejs.com/docs/api.html#schemadateoptions_SchemaDateOptions-expires)

In our case, the invitation document will be deleted from the database in 24 hours.

Let's make sure that the combination of `teamId` and `email` are unique:

```
mongoSchema.index({ teamId: 1, email: 1 }, { unique: true });
```

We set up a unique index in this way, because we don't want to have two documents inside our `test.invitations` collection that have the same combination of `teamId` and `email`. This would mean that the same user gets two invitation to the same Team. We discussed indices in depth in Chapter 4.

To complete the `Invitation` document, let's define the above five static methods.

-   `Invitation.add`. Before we create a new invitation document using the Mongoose method `create`, we need to do a few checks. First, we need to check if `teamId` and `email` exist (not `null` and not `undefined`):
    
    ```
      if (!teamId || !email) {
        throw new Error('Bad data');
      }
    ```
    
    We need to make sure that the Team to which a user is invited does indeed exist. We also need to make sure that only the Team Leader can invite a user to become a Team Member:
    
    ```
      const team = await Team.findById(teamId).setOptions({ lean: true });
    
      if (!team || team.teamLeaderId !== userId) {
        throw new Error('Team does not exist or you have no permission');
      }
    ```
    
    We need to check if the submitted `email` already belongs to a registered user. If so, we need to check if the invited user is already a member of the Team - `team.memberIds.includes(registeredUser._id.toString())`. If so, we throw an error:
    
    ```
      const registeredUser = await User.findOne({ email }).setOptions({ lean: true });
    
      if (registeredUser && team.memberIds.includes(registeredUser._id.toString())) {
        throw new Error('This user is already Team Member.');
      }
    ```
    
    If not, we add the invited user id to the Team's document `memberIds` field and update the invited user document's field `defaultTeamSlug` (see below).
    
    Only then do we check if the `invitation` document already exists in database. If it does, we don't call `this.create`. If it does not exist, then we do call `this.create` to create a new invitation MongoDB document:
    
    ```
      public static async add({ userId, teamId, email }) {
        if (!teamId || !email) {
          throw new Error('Bad data');
        }
    
        const team = await Team.findById(teamId).setOptions({ lean: true });
    
        if (!team || team.teamLeaderId !== userId) {
          throw new Error('Team does not exist or you have no permission');
        }
    
        const registeredUser = await User.findOne({ email }).setOptions({ lean: true });
    
        if (registeredUser && team.memberIds.includes(registeredUser._id.toString())) {
          throw new Error('This user is already Team Member.');
        }
    
        let token;
        const invitation = await this.findOne({ teamId, email }).select('token').setOptions({ lean: true });
    
        if (invitation) {
          token = invitation.token;
        } else {
          token = generateToken();
          while ((await this.countDocuments({ token })) > 0) {
            token = generateToken();
          }
    
          await this.create({
            teamId,
            email,
            token,
          });
        }
    
        const emailTemplate = await getEmailTemplate('invitation', {
          teamName: team.name,
          invitationURL: `${process.env.URL_APP}/invitation?token=${token}`,
        });
    
        if (!emailTemplate) {
          throw new Error('Invitation email template not found');
        }
    
        try {
          await sendEmail({
            from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
            to: [email],
            subject: emailTemplate.subject,
            body: emailTemplate.message,
          });
        } catch (err) {
          console.log('Email sending error:', err);
        }
    
        return await this.findOne({ teamId, email }).setOptions({ lean: true });
      }
    ```
    
    Important to note - before `Invitation.add` returns a newly created invitation document, we call the `generateToken` function if the invitation document does not exist in the database. We use the same approach as in generating a unique destination URL for an uploaded file inside `book/7-begin/api/server/aws-s3.ts`:
    
    ```
      const randomStringForPrefix =
        Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    ```
    
    `generateToken` returns the above random string:
    
    ```
      function generateToken() {
        const gen = () =>
          Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    
        return `${gen()}`;
      }
    ```
    
    We also call `getEmailTemplate` and `sendEmail` methods before returning a newly created invitation document. This is to send an invitation email that contains an invitation link to an invited user. Regardless of whether the invitation document already exists or gets created, this invitation link contains a `token` query with a value of `token`. The value for `token` is either retrieved from an existing invitation document or auto-generated for a newly created invitation document.
    
-   The `Invitation.getTeamInvitations` method is much easier to understand than `Invitation.add`. Here we use `teamId` to find all invitations with a matching value for the `teamId` field. The static method `Invitation.getTeamInvitations` returns an array of such found objects:
    
    ```
      public static async getTeamInvitations({ userId, teamId }) {
        const team = await Team.findOne({ _id: teamId }).select('teamLeaderId').setOptions({ lean: true });
    
        if (userId !== team.teamLeaderId) {
          throw new Error('You have no permission.');
        }
    
        return this.find({ teamId }).select('email').setOptions({ lean: true });
      }
    ```
    
-   Inside the `Invitation.getTeamByToken` method, we check if an invitation document exists in the database. If it does not, we throw an error. If it does, we use `teamId` of the found invitation document to find a Team document in our database. Again, we throw an error if the Team document does not exist. Otherwise, we return a Team object (which corresponds to found Team document).
    
    ```
      public static async getTeamByToken({ token }) {
        if (!token) {
          throw new Error('Bad data');
        }
    
        const invitation = await this.findOne({ token }).setOptions({ lean: true });
    
        if (!invitation) {
          throw new Error('Invitation not found');
        }
    
        const team = await Team.findById(invitation.teamId)
          .select('name slug avatarUrl memberIds')
          .setOptions({ lean: true });
    
        if (!team) {
          throw new Error('Team does not exist');
        }
    
        return team;
      }
    ```
    
-   Inside the `Invitation.addUserToTeam` method, we check if arguments are non-`null` and non-`undefined` (as we did in all of the above methods). We search our database for an invitation document by `token`. We check if the document exists. If so, we delete it. Then we search for a Team document by `teamId`. Check if it exists. Finally, we add the invited user's id to the found Team document's field, `memberIds`, and update the invited user document's field `defaultTeamSlug`.
    
    ```
      public static async addUserToTeam({ token, user }) {
        if (!token || !user) {
          throw new Error('Bad data');
        }
    
        const invitation = await this.findOne({ token }).setOptions({ lean: true });
    
        if (!invitation || invitation.email !== user.email) {
          throw new Error('Invitation not found');
        }
    
        await this.deleteOne({ token });
    
        const team = await Team.findById(invitation.teamId)
          .select('name slug avatarUrl memberIds')
          .setOptions({ lean: true });
    
        if (!team) {
          throw new Error('Team does not exist');
        }
    
        if (team && !team.memberIds.includes(user._id)) {
          await Team.updateOne({ _id: team._id }, { $addToSet: { memberIds: user._id } });
    
          if (user._id !== team.teamLeaderId) {
            await User.findByIdAndUpdate(user._id, { $set: { defaultTeamSlug: team.slug } });
          }
        }
    
        return team.slug;
      }
    ```
    

Add import/export statements and type definitions for static methods to the code we discussed so far in this subsection. You should get the following content:

```
import * as mongoose from 'mongoose';

import sendEmail from '../aws-ses';
import getEmailTemplate from './EmailTemplate';
import Team from './Team';
import User, { UserDocument } from './User';

const mongoSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 60 * 60 * 24, // delete doc after 24 hours
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
});

mongoSchema.index({ teamId: 1, email: 1 }, { unique: true });

interface InvitationDocument extends mongoose.Document {
  teamId: string;
  email: string;
  createdAt: Date;
  token: string;
}

interface InvitationModel extends mongoose.Model<InvitationDocument> {
  add({
    userId,
    teamId,
    email,
  }: {
    userId: string;
    teamId: string;
    email: string;
  }): InvitationDocument;

  getTeamInvitations({ userId, teamId }: { userId: string; teamId: string });
  getTeamByToken({ token }: { token: string });
  addUserToTeam({ token, user }: { token: string; user: UserDocument });
}

function generateToken() {
  const gen = () =>
    Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);

  return `${gen()}`;
}

class InvitationClass extends mongoose.Model {
  public static async add({ userId, teamId, email }) {
    if (!teamId || !email) {
      throw new Error('Bad data');
    }

    const team = await Team.findById(teamId).setOptions({ lean: true });
    if (!team || team.teamLeaderId !== userId) {
      throw new Error('Team does not exist or you have no permission');
    }

    const registeredUser = await User.findOne({ email }).setOptions({ lean: true });

    if (registeredUser && team.memberIds.includes(registeredUser._id.toString())) {
      throw new Error('This user is already Team Member.');
    }

    let token;
    const invitation = await this.findOne({ teamId, email }).select('token').setOptions({ lean: true });

    if (invitation) {
      token = invitation.token;
    } else {
      token = generateToken();
      while ((await this.countDocuments({ token })) > 0) {
        token = generateToken();
      }

      await this.create({
        teamId,
        email,
        token,
      });
    }

    const emailTemplate = await getEmailTemplate('invitation', {
      teamName: team.name,
      invitationURL: `${process.env.URL_APP}/invitation?token=${token}`,
    });

    if (!emailTemplate) {
      throw new Error('Invitation email template not found');
    }

    try {
      await sendEmail({
        from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [email],
        subject: emailTemplate.subject,
        body: emailTemplate.message,
      });
    } catch (err) {
      console.log('Email sending error:', err);
    }

    return await this.findOne({ teamId, email }).setOptions({ lean: true });
  }

  public static async getTeamInvitations({ userId, teamId }) {
    const team = await Team.findOne({ _id: teamId }).select('teamLeaderId').setOptions({ lean: true });

    if (userId !== team.teamLeaderId) {
      throw new Error('You have no permission.');
    }

    return this.find({ teamId }).select('email').setOptions({ lean: true });
  }

  public static async getTeamByToken({ token }) {
    if (!token) {
      throw new Error('Bad data');
    }

    const invitation = await this.findOne({ token }).setOptions({ lean: true });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const team = await Team.findById(invitation.teamId)
      .select('name slug avatarUrl memberIds')
      .setOptions({ lean: true });

    if (!team) {
      throw new Error('Team does not exist');
    }

    return team;
  }

  public static async addUserToTeam({ token, user }) {
    if (!token || !user) {
      throw new Error('Bad data');
    }

    const invitation = await this.findOne({ token }).setOptions({ lean: true });

    if (!invitation || invitation.email !== user.email) {
      throw new Error('Invitation not found');
    }

    await this.deleteOne({ token });

    const team = await Team.findById(invitation.teamId)
      .select('name slug avatarUrl memberIds')
      .setOptions({ lean: true });

    if (!team) {
      throw new Error('Team does not exist');
    }

    if (team && !team.memberIds.includes(user._id)) {
      await Team.updateOne({ _id: team._id }, { $addToSet: { memberIds: user._id } });

      if (user._id !== team.teamLeaderId) {
        await User.findByIdAndUpdate(user._id, { $set: { defaultTeamSlug: team.slug } });
      }
    }

    return team.slug;
  }
}

mongoSchema.loadClass(InvitationClass);

const Invitation = mongoose.model<InvitationDocument, InvitationModel>('Invitation', mongoSchema);

export default Invitation;
```

Add the above content to the newly created file `book/7-begin/api/server/models/Invitation.ts`.

___

#### Invitation email template [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#invitation-email-template)

In the previous subsection, we defined the `Invitation.add` static method. Inside it, we call the `getEmailTemplate` method like so:

```
const emailTemplate = await getEmailTemplate('invitation', {
  teamName: team.name,
  invitationURL: `${process.env.URL_API}/invitation?token=${token}`,
});
```

We send an invitation email using an email template with the value `invitation` for `name`. The problem - we haven't created an email template with such `name`. Open `book/7-begin/api/server/models/EmailTemplate.ts`, find the `templates` array inside the `insertTemplates` method. At the end of the `templates` array, add:

```
{
  name: 'invitation',
  subject: 'You are invited to join a team at saas-app.async-await.com',
  message: `You've been invited to join <b><%= teamName%></b>.
    <br/>Click here to accept the invitation: <%= invitationURL%>
  `,
},
```

___

#### Updating Team model - Invitation [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#updating-team-model-invitation)

In the subsection [Express routes - Invitation](https://builderbook.org/books/saas-boilerplate/application-state-app-hoc-store-and-mobx-toggle-theme-api-team-api-invitation-api#express-routes-invitation), we defined a new Express route for Team Leader:

```
router.post('/teams/remove-member', async (req: any, res, next) => {
  try {
    const { teamId, userId } = req.body;

    await Team.removeMember({ teamLeaderId: req.user.id, teamId, userId });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});
```

However, we haven't defined the static method `Team.removeMember`. In this section, we do so. Open `book/7-begin/api/server/models/Team.ts` and add the definition of `removeMember`:

```
public static async removeMember({ teamId, teamLeaderId, userId }) {
  const team = await this.findById(teamId).select('memberIds teamLeaderId');

  if (!team) {
    throw new Error('Team does not exist');
  }

  if (team.teamLeaderId !== teamLeaderId || teamLeaderId === userId) {
    throw new Error('Permission denied');
  }

  await this.findByIdAndUpdate(teamId, { $pull: { memberIds: userId } });
}
```

Inside `removeMember`, we search for a Team document in the database by `teamId`. Check if it exists. Then check if a user who attempts to use this API is indeed a Team Leader of the found Team. Also, we make sure that the Team Leader cannot remove their user id from the `memberIds` field. Then update the Team document's `memberIds` field by removing the invited user's id from the Team document's `memberIds` field.

Remember to provide type definitions:

```
removeMember({
  teamId,
  teamLeaderId,
  userId,
}: {
  teamId: string;
  teamLeaderId: string;
  userId: string;
}): Promise<void>;
```

___

#### Testing Invitation API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-invitation-api)

We are done implementing our Invitation API!

It was a long road, and we built starting from client-facing code, unlike previous API infrastructures that we built starting with server-only code.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Invitation+API.png)

In this last subsection of the chapter, we have to test the entire flow. The Team Leader provides an email address. Our application creates a corresponding invitation document in `test.invitations` and sends an invitation email to an invited user. Theh invited user clicks on the invitation link inside the invitation email.

After that, we have two scenarios:

1.  Invited user is logged out of our application. In this case, the invited user is redirected to the `Invitation` page after clicking the invitation link.
2.  Invited user is logged in to our application. In this case, the invited user is redirected to the `YouSettings` page after clicking the invitation link.

In both of these scenarios, our application deleted the invitation document and updated the Team document's `memberIds` field with the id of the invited user.

It makes sense for us to test Scenario 1 before Scenario 2. In Scenario 1, we can register a new user in our application, then use this newly registered user for Scenario 2. As you can see, to properly test the Invitation API, you have to create a second account in our SaaS boilerplate.

We already have a user document with `email: team@builderbook.org`, and our second account will have `email: team@async-await.com`. We will use Google OAuth for testing Scenario 1.

To put it in terms we use in this book, in both scenarios, we want the Team Leader with `email: team@builderbook.org` to successfully invite a user with email address `team@async-await.com` to the Team with `name: Team Builder Book` and `slug: 1`.

Go to your MongoDB Atlas dashboard, find `Cluster 0` (free cluster you created in Chapter 4), click `Collections`, and find the `test` database. Note two things:

-   The `test.invitations` collection does not exist
    
-   Inside `test.teams`, find the Team document you created when testing Team API. Check the value for the `memberIds` field. It should contain one member, the Team Leader's user id:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+12-37-19.png)
    

One more code update before start up our project. Go to `book/7-begin/app/pages/_app.tsx` and find the block:

```
if (ctx.pathname.includes('/login') || ctx.pathname.includes('/create-team')) {
  firstGridItem = false;
}
```

Replace it with the following block, since we do not want to show the first grid on the`Invitation` page (for the same reasons we don't show the first grid on the `Login` page):

```
if (
  ctx.pathname.includes('/login') ||
  ctx.pathname.includes('/create-team') ||
  ctx.pathname.includes('/invitation') 
) {
  firstGridItem = false;
}
```

Start both `APP` and `API` with `yarn dev`.

Log in if you are logged out. Navigate to the `TeamSettings` page (either via dropdown menu or by pasting `http://localhost:3000/team/1/team-settings` into browser's address bar):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-05-35.png)

Click `Invite member` button, and you should see the `InviteMember` component. Provide an email address of the user you, as a Team Leader, intend to invite to your Team. In our case, the email address is `team@async-await.com`. It will be a different value for you. Click the `Invite` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-09-40.png)

After clicking the `Inivte` button, you should see a second table for `Invited users`. There you should see a row that corresponds to an invitee with the email address you provided:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-11-07.png)

Next, check up the email inbox of the invited user. For us, it is Gmail for `team@async-await.com`. You should see a new email, since our application sent an invitation email to the invited user's inbox:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-28-26.png)

Since we are testing Scenario 1, please **do not click on the invitation link** just yet.

You either have to log out of our application **or** copy/paste the invitation link into a tab of incognito mode.

Before you click on the invitation link, go to your MongoDB Atlas dashboard and check out the `test.invitations` collection:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-21-00.png)

It should have the exact same value as the `token` query inside the invitation link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-29-56.png)

You can either log out or use incognito mode to test Scenario 1 (we will log out). Click on the invitation link.

You will be redirected to the `Invitation` page. This page should have expected values of the Team's logo and Team's name:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-37-26.png)

Next, log in to our application.

We will use Google OAuth and log in with our `team@async-await.com` account.

You will be redirected to the `CreateTeam` page. This is not a good UX, but technically, it is expected behavior:

```
let redirectUrlAfterLogin;
const defaultTeamSlug = req.user && req.user.defaultTeamSlug;

if (teamSlugOfInvitedTeam || defaultTeamSlug) {
  redirectUrlAfterLogin = `/your-settings`;
} else {
  redirectUrlAfterLogin = `/create-team`;
}
```

The `defaultTeamSlug` is an empty string for a newly signed up user with `email: team@async-await.com`. It gets populated after the signup event. We will improve this UX in the next chapter - one of the improvements will be redirecting an invited user to the `Discussion` page.

Check up the `test.invitations` collection on your MongoDB Atlas dashboard. Indeed, our `API` server has deleted the invitation document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-44-35.png)

Indeed, the Team document with `name: Team Builder Book` has an updated `memberIds` field. Now this field has the id of an invited user in addition to the id of the Team Leader:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-45-58.png)

Go ahead and check up the `test.users` colelction. Make sure that the id value for a new user is indeed one of the members of the `memberIds` field of the Team document.

Next, log out of your application either via dropdown menu or pasting `http://localhost:8000/logout` into the browser's address bar.

Log back in with the Team Leader's account. In our case, it is the user document with `email: team@builderbook.org`.

Go to the `TeamSettings` page either via dropdown menu or by pasting `http://localhost:3000/team/1/team-settings` into the browser's address bar. You should see **no** `Invited users` table but `Team Members` will have an extra row that corresponds to a new Team Member:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-27+14-49-41.png)

Our Invitation API works for Scenario 1!

Let's test Scenario 2.

Manually delete the new user's id from the Team document's `memberIds` array.

Log in to your application with the Team Leader's account (`team@builderbook.org` for us) and invite a new user (`team@async-await.com` for us) to your Team (`Team Builder Book` for us). Your emails and Team name will be different.

Log out of your application.

Now log in to your application with the invited user's account. In our case, we will log in using Google OAuth for our `team@async-await.com` account.

After you logged in with the invited user's account, go to the invited user's inbox, open the invitation email, and click on the invitation link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-28+13-53-08.png)

You should see a success message that we coded earlier in this section (check relevant code on the `Invitation` page, `App` HOC, and `YourSettings` page). Also check up your database. You should see that the `memberIds` field indeed has a new member - user id of the invited member.

The only thing left to test is removing an existing Team Member from the Team. Log out of your Team Member account and then re-log in using your Team Leader account. Once logged in, navigate to the `TeamSettings` page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-28+13-59-56.png)

Click the delete icon next to the newly added Team Member:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-28+13-59-57.png)

Surprisingly enough, you will still see a table row with a Team Member inside the Team Members table. If you go to your MongoDB Atlas dashboard and look into the Team document's `memberIds` field, you will find that the Team member's id was successfully deleted. What is going on here? Reload pthe age and you will see a table row that corresponds to a Team Member who is not there anymore. Apparently, the removing member API does work as we designed, but automatic re-rendering, promised to us by `mobx` and `mobx-react`, does **not** work.

After some debugging, you may find that although `currentTeam.members` is observable, using `Array.from` breaks reactivity.

To fix the problem, open `book/7-begin/app/pages/team-settings.tsx`.

Find the line:

```
Array.from(currentTeam.members.values()).map((m) =>
```

Replace it with:

```
currentTeam.memberIds.map(userId => currentTeam.members.get(userId)).map((m) =>
```

Add a Team Member to your Team again, log in to our application as the Team Leader and click the delete icon. You will see that the table row with the removed Team Member gets removed reactively without page reload. Ta-da!

We are done implementing Invitation API, and you succesffully completed Chapter 7, so far the longest chapter in the book!

___

Let's make just a few small improvements.

Instead of a placeholder image, let's display a real user avatar:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-28+13-59-58.png)

Should look like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-7/Screenshot+from+2020-06-28+14-13-59.png)

Open `book/7-begin/app/components/layout/index.tsx` and eplace line:

```
src={'https://storage.googleapis.com/async-await/default-user.png'}
```

With line:

```
src={store.currentUser.avatarUrl}
```

___

As a bonus, you can print `this.members` inside the `Team` data store to see how the `Map` object looks in the browser console. Open `book/7-begin/app/lib/store/team.ts` and find this line:

```
public members: Map<string, User> = new Map();
```

By definition, the `Map` object key-value pairs:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

In our particular case, we designed `key` to be a user's id `string`, and `value` to be a user's object.

Let's print `this.members`. Add the line `console.log(this.members);` like so:

```
public setInitialMembersAndInvitations(users, invitations) {
  this.members.clear();
  this.invitations.clear();

  for (const user of users) {
    if (this.store.currentUser && this.store.currentUser._id === user._id) {
      this.members.set(user._id, this.store.currentUser);
    } else {
      this.members.set(user._id, new User(user));
    }
  }

  for (const invitation of invitations) {
    this.invitations.set(invitation._id, new Invitation(invitation));
  }

  console.log(this.members);
}
```

Start both `APP` and `API`. Navigate to, say, the `TeamSettings` page by going to the following route:

```
http://localhost:3000/team/1/team-settings
```

On Chrome browser, open `Chrome Dev Tools` by pressing `Ctrl + Shift + J`. Select the `Console` tab and find the `Map` object on the browser console:

```
Map {_c: Map(2)}
  _c: Map(2)
    [[Entries]]
      0: {"5eb31fdd2ea04220e52aba66" => User}
      key: "5eb31fdd2ea04220e52aba66"
      value: User {store: Store, _id: "5eb31fdd2ea04220e52aba66", …}
      1: {"5ef7bca9e1410c382de1164f" => User}
      key: "5ef7bca9e1410c382de1164f"
      value: User {store: undefined, _id: "5ef7bca9e1410c382de1164f", …}
      size: (...)
    __proto__: Map
  size: (...)
  __proto__: Map
```

The printed `Map` object has two key-value pairs, because our Team has two members now: Team Leader and invited Team Member.

Look at `key`, which is a `string` with a value that corresponds to the user's id.

Look at `value`, which is an `object` with a value that is the `User` data store object.

___

And let's remove some pages that we don't need in our final SaaS boilerplate. Since we no longer need `Index` and `CSRPage` pages, go ahead and delete the following files:

-   `book/7-begin/app/pages/index.tsx`
-   `book/7-begin/app/pages/csr-page.tsx`

___

In the next chapter, Chapter 8, we will introduce two more data models and stores: Discussin and Post. We will also learn about web sockets and how to use them to create realtime updates to improve end user experience in our web application.

If you followed the instructions in this chapter closely, your codebase should match the codebase located at `book/7-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___