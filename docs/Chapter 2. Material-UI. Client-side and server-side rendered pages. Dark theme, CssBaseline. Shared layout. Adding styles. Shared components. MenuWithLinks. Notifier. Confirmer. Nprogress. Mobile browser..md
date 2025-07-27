In Chapter 2, you will start with the codebase in the [2-begin folder](https://github.com/async-labs/saas/tree/master/book/2-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [2-end folder](https://github.com/async-labs/saas/tree/master/book/2-end).

We will cover the following topics in this chapter:

-   Material-UI  
    
    -   Client-side and server-side rendered pages
    -   Theme, dark theme, CssBaseline
    -   Remove styles injected on the server
-   Shared layout  
    
-   Adding styles  
    
-   Shared components  
    
    -   MenuWithLinks
    -   Notifier
    -   Confirmer
-   Nprogress  
    
-   Mobile browser  
    

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

In this chapter, we will integrate our `app` project, which is currently a simple Next.js project, with Material-UI. We will also discuss differences between server-side and client-side rendering. We will modify both `Document` and `App` HOCs so that Material-UI integration works for both types of rendering. We will create a new component, `Layout`. It is a shared layout that we will explicitly use in all of the `app` project's pages. We will define an `isMobile` method that returns `true` or `false` depending on whether the browser is mobile or desktop. Finally, we will modify our `App` HOC so that it passes `isMobile` and `firstGridItem` props to all pages of the `app` project. We will discuss the purpose of these props later in this chapter when we discuss them.

## Material-UI [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#material-ui)

As you develop your own project, you can choose to create your own styles and apply these styles to components and page components. In this chapter, in the subsection Shared styles, we will show different ways of adding styles in this project.

We are a two-person software team. Creating and maintaining a constistent styling library is not a good use of our time. We find our time better spent on listening to our customers and adding/improving business logic of our existing software businesses. If you have a dedicated designer on your team, you may want to create your own styling library. However, if you are a small team like us, we recommend using an existing library.

Material Design ([https://material.io/guidelines](https://material.io/guidelines)) is a design framework for web and mobile apps. It was developed and released by Google under an Apache-2 license. Since then, developers have created React-specific libraries for material design. We use the Material-UI library ([https://github.com/mui-org/material-ui](https://github.com/mui-org/material-ui)) to implement material design in our web application.

We find the Material-UI library straighforward to use, relatively mature, and well-maintained by its active team of contributors. As for design, it seems relatively clean and familiar to most users, since it is based on Google's Material Design.

As you already know, a Next.js web application supports two types of page rendering - server-side and client-side. Material-UI's library works out-of-the-box for client-side rendered pages but **not** for server-side rendered pages. We have to modify our `Document` HOC to inject Material-UI's styles on the server so that Next.js can use these injected styles to render pages on the server. Later in this section, we will create a `CSRPage` with Material-UI's `Button` component. You will see a so-called "flash of style" problem when the page is server-side rendered.

To integrate our Next.js app with Material-UI, we will follow the official example from Material-UI's public repository:

[https://github.com/mui-org/material-ui/tree/master/examples/nextjs-with-typescript](https://github.com/mui-org/material-ui/tree/master/examples/nextjs-with-typescript)

___

#### Client-side and server-side rendered pages [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#client-side-and-server-side-rendered-pages)

We mentioned that Material-UI's library works fine for client-side rendered pages but not server-side rendered pages. Let's actually test it out using a new page called `CSRPage`. Open the file `book/2-begin/app/pages/index.tsx`, which contains code for our `Index` page. Import and add a navigational link to this page as follows:

```
import React from 'react';
import Head from 'next/head';

import Link from 'next/link';

const Index = () => (
  <div>
    <Head>
      <title>Index page</title>
      <meta name="description" content="This is a description of the Index page" />
    </Head>
    <div>
      <p>Content on Index page</p>
      <Link href='/csr-page' as='/csr-page'>
        Go to CSR page
      </Link>
    </div>
  </div>
);

export default Index;
```

Read more about navigational links at:

[https://nextjs.org/docs/api-reference/next/link](https://nextjs.org/docs/api-reference/next/link)

Why did we add a navigational link that leads to the `CSRPage` at route `/csr-page`? That's because Next.js web applications can render **the same** page either on the server or on the client (browser) depending on how the page is accessed. If we access `CSRPage` by loading it in a new browser tab or reloading the browser tab, then this page will server-side rendered. If this page is loaded via clicking on a navigational link, then this page will be client-side rendered.

Now create a new page, `CSRPage`, by creating a new file, `book/2-begin/app/pages/csr-page.tsx`, with the following content:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';

const CSRPage = () => (
  <div>
    <Head>
      <title>CSR page</title>
      <meta name="description" content="This is a description of the CSR page" />
    </Head>
    <div style={{ padding: '0px 30px', fontSize: '15px', height: '100%', color: '#222' }}>
      <p>Content on CSR page</p>
      <Button variant="outlined">Some button</Button>
    </div>
  </div>
);

export default CSRPage;
```

Note that `CSRPage` page contains our first component from Material-UI's library - `Button`:

[https://material-ui.com/components/buttons/](https://material-ui.com/components/buttons/)

Although we called `CSRPage`, it does not mean that it will always be client-side rendered. The rendering type depends on how the page is accessed (new browser tab or navigational link).

Start your app with `yarn dev` and navigate to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-22+17-14-26.png)

Now click on the `Go to CSR` navigational link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-22+17-15-16.png)

As you can see, the `Button` component and its styles are loaded without problems! Since you loaded the page via a navigational link, this page rendered on the client (on the browser). This means that Material-UI's library works out-of-the-box for client-side rendering.

Since `CSRPage` has no dynamic data and only contains static HTML, Next.js has prefetched this page in the background by default. This loads page faster. To learn about the `prefetch` option, search `prefetch` on this page about the navigational link `Link` in the docs:

[https://nextjs.org/docs/api-reference/next/link](https://nextjs.org/docs/api-reference/next/link)

Let's load the same page, but this time, render the page on the server. Stay on the `/csr-page` page and click the refresh button on your browser. Alternatively, you can open a new tab, paste `https://localhost:3000/csr-page` URL, and press `Enter`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-22+17-34-09.png)

The CSR page looks the same, but the page is now rendered on the server. We can prove server-side rendering by adding a `console.log` statement to our `Document` HOC. Open your `book/2-begin/app/pages/_document.tsx` file and add `console.log('rendered on the server');` statement in this location:

```
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

class MyDocument extends Document {
  public render() {
    console.log('rendered on the server');

    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="google" content="notranslate" />
          <meta name="theme-color" content="#303030" />
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

Restart your app and observe the output of your terminal.

Navigate to the `CSR` page via the navigational link on the `Index` page. There is no `rendered on the server` printed in your terminal.

Now, reload the `CSR` page by pressing the refresh button or by loading it in a new tab. Look at the terminal every time you do it:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-22+17-48-54.png)

You indeed see `rendered on the server` printed in your terminal.

Though the page looks the same, the rendering type is different. There is one more striking difference. There is a noticable flash of style in the server-side rendered page. Try refreshing the tab multiple times while you are on the `CSR page`. You will notice, for a fraction of a second, that the `Button` component does not have styles from Material-UI:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-22+18-08-46.png)

The flash of style contains an unstyled `Button` - barebone HTML button - without any styles from Material-UI's library. That's because our integration is not complete, and our application only adds Material-UI's styles properly to the client-side rendered pages. No styles are added on the server, to the server-side rendered pages.

We discussed the benefits of server-side rendering in Chapter 1. Thus, our goal here is to make Material-UI's library work properly for server-side rendering. To do so, we need to inject Material-UI styles on the server. Thus, we need to modify our `Document` HOC that runs whenever a page is rendered on the server. Next.js docs suggest that the `renderPage` method needs to be customized to add styles to a server-side rendered page:

[https://nextjs.org/docs/advanced-features/custom-document#customizing-renderpage](https://nextjs.org/docs/advanced-features/custom-document#customizing-renderpage)

Prescription from the above link on how to customize the `renderPage` method:

```
import Document from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const originalRenderPage = ctx.renderPage

    ctx.renderPage = () =>
      originalRenderPage({
        // useful for wrapping the whole react tree
        enhanceApp: App => App,
        // useful for wrapping in a per-page basis
        enhanceComponent: Component => Component,
      })

    // Run the parent `getInitialProps` using `ctx` that now includes our custom `renderPage`
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }
}

export default MyDocument
```

The `ctx.renderPage` method runs actual React rendering logic (on the server), takes the entire React-tree `enhanceApp`, and returns a rendered page, which is an HTML string:

[https://github.com/vercel/next.js/blob/57e156bc49024fda19ffdffb1ed4befc4a07c2c3/packages/next/pages/\_document.tsx#L76-L86](https://github.com/vercel/next.js/blob/57e156bc49024fda19ffdffb1ed4befc4a07c2c3/packages/next/pages/_document.tsx#L76-L86)

```
static async getInitialProps(
  ctx: DocumentContext
): Promise<DocumentInitialProps> {
  const enhanceApp = (App: any) => {
    return (props: any) => <App {...props} />
  }

  const { html, head } = await ctx.renderPage({ enhanceApp })
  const styles = [...flush()]
  return { html, head, styles }
}
```

Here is an example of a customized `renderPage` from Material-UI's documentation:

[https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/\_document.tsx](https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/_document.tsx)

As you can see, the main difference between our current `Document` HOC and `Document` in the Material-UI example is changes to the `MyDocument.getInitialProps` method:

```
MyDocument.getInitialProps = async ctx => {
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()],
  };
};
```

You may notice methods that you are not familiar - for example, `ServerStyleSheets()`, `sheets.collect()`, `sheets.getStyleElement()`, and `React.Children.toArray()`. Check up Material-UI docs for explanations:

[https://material-ui.com/styles/api/#serverstylesheets](https://material-ui.com/styles/api/#serverstylesheets)

As you can see from Material-UI docs:

-   `sheets` is a collection of style rules (CSS rules)
-   `sheets.collect()` method collects all styles during server-side rendering so these styles can be sent to the client
-   `sheets.getStyleElement()` method returns a string of all collected styles (styles collected with the `sheets.collect()` method)
-   `React.Children.toArray(initialProps.styles)` method returns a flat array of styles from `intitialProps` ([React docs](https://reactjs.org/docs/react-api.html#reactchildrentoarray))
-   `spread operator ...` ([https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread\_syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)) creates a new array of `styles` from the elements of array `React.Children.toArray(initialProps.styles)` and `sheets.getStyleElement()`

So far, we understand that code collects styles during server-side rendering of a page and sends these styles to the client as the page's `this.props.styles`. This is because the `getInitialProps` method populates the page's `props`. So when you see that `getInitialProps` returns something like:

```
return {
  ...initialProps,
  styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()],
};
```

then the page's `props` will have the property `styles`. `this.props.styles` will have a string of CSS styles that were collected during server-side rendering of the page.

More on the `getInitialProps` method:

[https://nextjs.org/docs/api-reference/data-fetching/getInitialProps](https://nextjs.org/docs/api-reference/data-fetching/getInitialProps)

This method populates the page's `props` with data. This method can be used in pages and in the `App` and `Document` HOCs but cannot be used in child `components` (non-page components). We will use this method on many pages, whenever we need to get data for the page. It's a good place to call an API method to fetch data from the database. A page's `getInitialProps` runs on both the server and the browser, depending on rendering type. If you know for a fact that your page will be only accessed as client-side rendered, then you can call an API method to fetch data inside `componentDidMount` instead of `getInitialProps`. The method `getInitialProps` runs before `render`, thus we collect CSS rules on the server and send this collection of rules to the client as the page's `this.props.styles` inside `MyDocument.getInitialProps`.

Let's define the `getInitialProps` method for the `MyDocument` component (extension for `Document` HOC):

```
public static getInitialProps = async (ctx) => {
  const sheets = new ServerStyleSheets();
  console.log(sheets);
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  console.log(initialProps);
  console.log(initialProps.styles);
  console.log(React.Children.toArray(initialProps.styles));

  console.log(sheets);
  console.log(sheets.getStyleElement());

  return {
    ...initialProps,
    styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()],
  };
};
```

The content of `book/2-begin/app/pages/_document.tsx` becomes:

```
import { ServerStyleSheets } from '@material-ui/styles';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

class MyDocument extends Document {
  public static getInitialProps = async (ctx) => {
    // Render app and page and get the context of the page with collected side effects.
    const sheets = new ServerStyleSheets();
    const originalRenderPage = ctx.renderPage;

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
      });

    const initialProps = await Document.getInitialProps(ctx);

    console.log(initialProps);
    console.log(initialProps.styles);
    console.log(React.Children.toArray(initialProps.styles));

    console.log(sheets);
    console.log(sheets.getStyleElement());

    return {
      ...initialProps,
      styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()],
    };
  };

  public render() {

    console.log('rendered on the server');

    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="google" content="notranslate" />
          <meta name="theme-color" content="#303030" />
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

To understand our integration better, we added a few `console.log` statements. Go ahead and start your app with `yarn dev`, load `http://localhost:3000` route on the browser, and then check your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-25+13-20-20.png)

Add environmental variable Remember to add import conditional operator store method calls show notification compiles in a browser check if value is truthy triggers method add environmental variable show notification decorate method with action API infrastructure Material-UI You already learned. If truthy then it works as expected At AWS dashboard response AWS dashboard email and name API method in a browser API infrastructure Google OAuth API mount middleware Google OAuth API request. On server only triggers method on server only session list of posts API method conditional operator new Express route. Triggers method end user data model Team Leader open this file Navigate to send this response in this book Put it all together check if value is truthy email and name Google OAuth API. Add environmental variable end user production-ready Remember to add import subsection. Click on the button in production in production in this book team members email and name redirect to checkout. Team Leader subsection team members end user Google OAuth API. In production MongoDB database At AWS dashboard team members response AWS dashboard list of posts Navigate to Team Leader Put it all together data model. Google OAuth API MongoDB database MongoDB database Material-UI team members S3 bucket page component triggers method API method compiles show notification S3 bucket check if value is truthy email and name cookie. On server only check if value is truthy Click on the button withAuth HOC production-ready.

The `initialProps` object has properties such as `html`, `head`, `styles` and more:

```
{
  html: '<div><div style="padding:0px ' +
    '30px;font-size:15px;height:100%;color:#222"><p>Content ' +
    'on Index page</p><a href="/csr-page">Go to CSR ' +
    'page</a></div></div>',
  head: [
    {
      '$$typeof': Symbol(react.element),
      type: 'meta',
      key: 'viewport',
      ref: null,
      props: [Object],
      _owner: null,
      _store: {}
    },
    {
      '$$typeof': Symbol(react.element),
      type: 'meta',
      key: 'charSet',
      ref: null,
      props: [Object],
      _owner: null,
      _store: {}
    },
    {
      '$$typeof': Symbol(react.element),
      type: 'title',
      key: '.0',
      ref: null,
      props: [Object],
      _owner: null,
      _store: {}
    },
    {
      '$$typeof': Symbol(react.element),
      type: 'meta',
      key: '.1',
      ref: null,
      props: [Object],
      _owner: null,
      _store: {}
    }
  ],
  styles: [],
  dataOnly: undefined
}
```

As you can see above, `initialProps.styles` is currently an empty array:

```
[]
```

As a result, `React.Children.toArray(initialProps.styles)` is an empty array as well:

```
[]
```

`sheets` is a nested object:

```
ServerStyleSheets {
  options: {},
  sheetsRegistry: SheetsRegistry { registry: [ [StyleSheet] ] }
}
```

`sheets.getStyleElement()` returns an object with following properties:

```
{
  '$$typeof': Symbol(react.element),
  type: 'style',
  key: 'jss-server-side',
  ref: null,
  props: {
    id: 'jss-server-side',
    dangerouslySetInnerHTML: {
      __html: 'html {\n  box-sizing: border-box;\n  -webkit-font-smoothing: ' +
        'antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n*, *::before, ' +
        '*::after {\n  box-sizing: inherit;\n}\nstrong, b {\n  font-weight: ' +
        'bolder;\n}\nbody {\n  color: rgba(0, 0, 0, 0.87);\n  margin: 0;\n  ' +
        'font-size: 0.875rem;\n  font-family: "Roboto", "Helvetica", "Arial", ' +
        'sans-serif;\n  font-weight: 400;\n  line-height: 1.43;\n  ' +
        'letter-spacing: 0.01071em;\n  background-color: #fafafa;\n}\n@media ' +
        'print {\n  body {\n    background-color: #fff;\n  }\n}\nbody::backdrop {\n ' +
        ' background-color: #fafafa;\n}'
    }
  },
  _owner: null,
  _store: {}
}
```

Note how the `id` value is `jss-server-side`. We will discuss this value when we remove server-side styles on the browser to avoid side effects, later in this section.

While your app is running, navigate to the `CSR` page and reload it multiple times using the browser's reload button. Please pay close attention to the flash of style that you observed earlier.

Now there is no flash of style for `Button` component! You successfully Material-UI with server-side rendered pages.

Check your terminal.

`sheets.getStyleElement()` returns an object that has all styles related to Material-UI's Button, as expected:

```
{
  '$$typeof': Symbol(react.element),
  type: 'style',
  key: 'jss-server-side',
  ref: null,
  props: {
    id: 'jss-server-side',
    dangerouslySetInnerHTML: {
      __html: '.MuiButtonBase-root {\n  color: inherit;\n  border: 0;\n  cursor: ' +
        'pointer;\n  margin: 0;\n  display: inline-flex;\n  outline: 0;\n  padding: ' +
        '0;\n  position: relative;\n  align-items: center;\n  user-select: none;\n  ' +
        'border-radius: 0;\n  vertical-align: middle;\n  -moz-appearance: none;\n  ' +
        'justify-content: center;\n  text-decoration: none;\n  background-color: ' +
        'transparent;\n  -webkit-appearance: none;\n  ' +
        '-webkit-tap-highlight-color: transparent;\n}\n' +
        '.MuiButtonBase-root::-moz-focus-inner {\n  border-style: none;\n}\n' +
        '.MuiButtonBase-root.Mui-disabled {\n  cursor: default;\n  ' +
        'pointer-events: none;\n}\n.MuiButton-root {\n  color: rgba(0, 0, 0, ' +
        '0.87);\n  padding: 6px 16px;\n  font-size: 0.875rem;\n  min-width: 64px;\n ' +
        ' box-sizing: border-box;\n  transition: background-color 250ms ' +
        'cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, ' +
        '0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;\n  ' +
        'font-family: "Roboto", "Helvetica", "Arial", sans-serif;\n  ' +
        'font-weight: 500;\n  line-height: 1.75;\n  border-radius: 4px;\n  ' +
        'letter-spacing: 0.02857em;\n  text-transform: uppercase;\n}\n' +
        '.MuiButton-root:hover {\n  text-decoration: none;\n  background-color: ' +
        'rgba(0, 0, 0, 0.08);\n}\n.MuiButton-root.Mui-disabled {\n  color: rgba(0, ' +
        '0, 0, 0.26);\n}\n@media (hover: none) {\n  .MuiButton-root:hover {\n    ' +
        'background-color: transparent;\n  }\n}\n  ' +
        '.MuiButton-root:hover.Mui-disabled {\n    background-color: ' +
        'transparent;\n  }\n  .MuiButton-label {\n    width: 100%;\n    display: ' +
        'inherit;\n    align-items: inherit;\n    justify-content: inherit;\n  }\n  ' +
        '.MuiButton-text {\n    padding: 6px 8px;\n  }\n  .MuiButton-textPrimary {\n' +
        '    color: #424242;\n  }\n  .MuiButton-textPrimary:hover {\n    ' +
        'background-color: rgba(66, 66, 66, 0.08);\n  }\n@media (hover: none) {\n  ' +
        '.MuiButton-textPrimary:hover {\n    background-color: transparent;\n  }\n' +
        '}\n  .MuiButton-textSecondary {\n    color: #212121;\n  }\n  ' +
        '.MuiButton-textSecondary:hover {\n    background-color: rgba(33, 33, ' +
        '33, 0.08);\n  }\n@media (hover: none) {\n  .MuiButton-textSecondary:hover ' +
        '{\n    background-color: transparent;\n  }\n}\n  .MuiButton-outlined {\n    ' +
        'border: 1px solid rgba(0, 0, 0, 0.23);\n    padding: 5px 15px;\n  }\n  ' +
        '.MuiButton-outlined.Mui-disabled {\n    border: 1px solid rgba(0, 0, 0, ' +
        '0.26);\n  }\n  .MuiButton-outlinedPrimary {\n    color: #424242;\n    ' +
        'border: 1px solid rgba(66, 66, 66, 0.5);\n  }\n  ' +
        '.MuiButton-outlinedPrimary:hover {\n    border: 1px solid #424242;\n    ' +
        'background-color: rgba(66, 66, 66, 0.08);\n  }\n@media (hover: none) {\n  ' +
        '.MuiButton-outlinedPrimary:hover {\n    background-color: transparent;\n ' +
        ' }\n}\n  .MuiButton-outlinedSecondary {\n    color: #212121;\n    border: ' +
        '1px solid rgba(33, 33, 33, 0.5);\n  }\n  ' +
        '.MuiButton-outlinedSecondary:hover {\n    border: 1px solid #212121;\n   ' +
        ' background-color: rgba(33, 33, 33, 0.08);\n  }\n  ' +
        '.MuiButton-outlinedSecondary.Mui-disabled {\n    border: 1px solid ' +
        'rgba(0, 0, 0, 0.26);\n  }\n@media (hover: none) {\n  ' +
        '.MuiButton-outlinedSecondary:hover {\n    background-color: ' +
        'transparent;\n  }\n}\n  .MuiButton-contained {\n    color: rgba(0, 0, 0, ' +
        '0.87);\n    box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px ' +
        '0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);\n    ' +
        'background-color: #e0e0e0;\n  }\n  .MuiButton-contained:hover {\n    ' +
        'box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px ' +
        'rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12);\n    ' +
        'background-color: #d5d5d5;\n  }\n  .MuiButton-contained.Mui-focusVisible ' +
        '{\n    box-shadow: 0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px ' +
        'rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12);\n  }\n  ' +
        '.MuiButton-contained:active {\n    box-shadow: 0px 5px 5px -3px ' +
        'rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px ' +
        'rgba(0,0,0,0.12);\n  }\n  .MuiButton-contained.Mui-disabled {\n    color: ' +
        'rgba(0, 0, 0, 0.26);\n    box-shadow: none;\n    background-color: ' +
        'rgba(0, 0, 0, 0.12);\n  }\n@media (hover: none) {\n  ' +
        '.MuiButton-contained:hover {\n    box-shadow: 0px 3px 1px -2px ' +
        'rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px ' +
        'rgba(0,0,0,0.12);\n    background-color: #e0e0e0;\n  }\n}\n  ' +
        '.MuiButton-contained:hover.Mui-disabled {\n    background-color: ' +
        'rgba(0, 0, 0, 0.12);\n  }\n  .MuiButton-containedPrimary {\n    color: ' +
        '#fff;\n    background-color: #424242;\n  }\n  ' +
        '.MuiButton-containedPrimary:hover {\n    background-color: rgb(46, 46, ' +
        '46);\n  }\n@media (hover: none) {\n  .MuiButton-containedPrimary:hover {\n ' +
        '   background-color: #424242;\n  }\n}\n  .MuiButton-containedSecondary {\n ' +
        '   color: #fff;\n    background-color: #212121;\n  }\n  ' +
        '.MuiButton-containedSecondary:hover {\n    background-color: rgb(23, ' +
        '23, 23);\n  }\n@media (hover: none) {\n  ' +
        '.MuiButton-containedSecondary:hover {\n    background-color: #212121;\n  ' +
        '}\n}\n  .MuiButton-colorInherit {\n    color: inherit;\n    border-color: ' +
        'currentColor;\n  }\n  .MuiButton-textSizeSmall {\n    padding: 4px 5px;\n  ' +
        '  font-size: 0.8125rem;\n  }\n  .MuiButton-textSizeLarge {\n    padding: ' +
        '8px 11px;\n    font-size: 0.9375rem;\n  }\n  .MuiButton-outlinedSizeSmall ' +
        '{\n    padding: 3px 9px;\n    font-size: 0.8125rem;\n  }\n  ' +
        '.MuiButton-outlinedSizeLarge {\n    padding: 7px 21px;\n    font-size: ' +
        '0.9375rem;\n  }\n  .MuiButton-containedSizeSmall {\n    padding: 4px ' +
        '10px;\n    font-size: 0.8125rem;\n  }\n  .MuiButton-containedSizeLarge {\n ' +
        '   padding: 8px 22px;\n    font-size: 0.9375rem;\n  }\n  ' +
        '.MuiButton-fullWidth {\n    width: 100%;\n  }\n  .MuiButton-startIcon {\n  ' +
        '  display: inherit;\n    margin-left: -4px;\n    margin-right: 8px;\n  }\n ' +
        ' .MuiButton-startIcon.MuiButton-iconSizeSmall {\n    margin-left: -2px;\n' +
        '  }\n  .MuiButton-endIcon {\n    display: inherit;\n    margin-left: 8px;\n' +
        '    margin-right: -4px;\n  }\n  ' +
        '.MuiButton-endIcon.MuiButton-iconSizeSmall {\n    margin-right: -2px;\n  ' +
        '}\n  .MuiButton-iconSizeSmall > *:first-child {\n    font-size: 18px;\n  ' +
        '}\n  .MuiButton-iconSizeMedium > *:first-child {\n    font-size: 20px;\n  ' +
        '}\n  .MuiButton-iconSizeLarge > *:first-child {\n    font-size: 22px;\n  ' +
        '}\nhtml {\n  box-sizing: border-box;\n  -webkit-font-smoothing: ' +
        'antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n*, *::before, ' +
        '*::after {\n  box-sizing: inherit;\n}\nstrong, b {\n  font-weight: bolder;\n' +
        '}\nbody {\n  color: rgba(0, 0, 0, 0.87);\n  margin: 0;\n  font-size: ' +
        '0.875rem;\n  font-family: "Roboto", "Helvetica", "Arial", sans-serif;\n  ' +
        'font-weight: 400;\n  line-height: 1.43;\n  letter-spacing: 0.01071em;\n  ' +
        'background-color: #fafafa;\n}\n@media print {\n  body {\n    ' +
        'background-color: #fff;\n  }\n}\nbody::backdrop {\n  background-color: ' +
        '#fafafa;\n}'
    }
  },
  _owner: null,
  _store: {}
}
```

In the next subsection we will add Material-UI's theme, define dark theme in addition to light theme, add some global styles from Material-UI.

___

#### Theme, dark theme, CssBaseline [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#theme-dark-theme-cssbaseline)

In the previous subsection, we successfully added and displayed `Button` component. We modified `Document` HOC and showed that both client-side and server-side rendered pages work properly with Material-UI library and there is no flash of style problem.

In this subsection we add a few global styles from Material-UI library to our web application. These styles will come from Material-UI's theme and `CssBaseline` component.

How do we add styles to all pages of our project. We could add them individually to every page. But it's counter productive. It's easier and better in long-term to add these styles to higher-order component. Since `App` runs on both the server and the client, let's add these global styles to `App` HOC.

```
import { createMuiTheme } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';

// Create a theme instance.
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
});

export default theme;
```

As you can see, we simply import and call the `createMuiTheme` method.

Create a `lib` folder inside `book/2-begin/app/` folder. The code in the `lib` folder gets imported to pages and can run both on the server and on the browser (unlike the content inside the `server` folder, which is server-only). We want code related to design to be available on both the server and the browser.

Inside new `lib` folder, create a `theme.ts` file with following content:

```
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
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

export { theme };
```

As you can see, we chose to modify only the `palette` property in our custom `theme` object. The `theme` object has many other properties that you are free to modify:

[https://material-ui.com/customization/default-theme/#default-theme](https://material-ui.com/customization/default-theme/#default-theme)

In this book, we only modify following theme properties:

-   `palette.primary`
-   `palette.secondary`
-   `palette.type`
-   `palette.background`
-   `palette.text`
-   `typography.button`

Palette\` properties:

[https://material-ui.com/customization/palette/](https://material-ui.com/customization/palette/)

`Typography` properties:

[https://material-ui.com/customization/typography/](https://material-ui.com/customization/typography/)

It's important to note that because we did not provide value for `typography.fontFamily`, Material-UI will use `Roboto` font by default. At the end of this book, in Chapter 10, we will show you how to self host fonts. We will modify `typography.fontFamily` value with the name of self hosted font.

Next, check up the `App` higher-order component in Material-UI's official example:

[https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/\_app.tsx](https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx)

As you can see from the above example's code - we have to make three changes to our current `App` HOC:

-   First, we need to wrap `<Component {...pageProps} />` with `ThemeProvider` and remember to pass our custom `theme` object as `ThemeProvider`'s prop. Simply import `ThemeProvider` and `theme` from their respective locations and wrap \`\`<Component {...pageProps} />\` like this:
    
    ```
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    ```
    
    Once we finish Material-UI integration, we can make changes to the `theme` and see changes in our browser.
    
-   Second, we need to import and add the `<CssBaseline />` component. By using `<CssBaseline />`, we add some global baseline styles (margins, paddings and more, see second link below) to our project. To find all baseleine styles, check up:
    
    [https://material-ui.com/components/css-baseline/#css-baseline](https://material-ui.com/components/css-baseline/#css-baseline)
    
    [https://github.com/necolas/normalize.css/blob/master/normalize.css](https://github.com/necolas/normalize.css/blob/master/normalize.css)
    
    Import `<CssBaseline />` and let's remember to wrap `ThemeProvider` around `<CssBaseline />`:
    
    ```
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    ```
    
    Once we finish integration, we can use `Chrome Dev Tools` on our browser to find these baseline styles.
    

Dark theme is popular among users of Youtube, Reddit, Github and many other web applications. One Reddit user noted:

> Night is dark. Screen is bright. Eyes hurt.

> Night is dark. Screen is dark. Eyes not hurt.

If you have an easy way to research if end users of your web application would like to have a dark theme option - we recommend that you do.

In this subsection, we will show you how to create a dark theme and how to add conditional logic to your web application to use the dark theme. Later in this book, Chapter 7, we will save individual users' choice of theme to the database (as a `user.darkTheme` property). This allows each user to decide which theme to use, and then this theme choice is persistent through all pages of the web application. In this subsection, however, we will simply create a dark theme and add conditional logic.

Open the `book/2-begin/app/lib/theme.ts` file. Define and export `themeDark`, `themeLight` as follows:

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

Now let's modify our `App` HOC. Import `themeDark` and `themeLight` and pass their values to `theme` using this conditional operator:

```
theme={false ? themeDark : themeLight}
```

A conditional operator has a condition and two values:

```
condition ? exprIfTrue : exprIfFalse
```

Read more about conditional operators in JS documentation:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional\_Operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator)

Your file should look like:  
`book/2-begin/app/pages/_app.tsx`:

```
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import App from 'next/app';
import Head from 'next/head';
import React from 'react';
import { themeDark, themeLight } from '../lib/theme';

class MyApp extends App {
  public componentDidMount() {
    // Remove the server-side injected CSS.
  }

  public render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={false ? themeDark : themeLight}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}

export default MyApp;
```

Note that we added `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` meta tag. This meta tag controls width and scale of the viewport. For example, so our web application won't look like desktop screen on mobile browser. This meta tag should be placed to `MyApp` component instead of `MyDocument` component according to Next.js docs:

[https://github.com/vercel/next.js/blob/master/errors/no-document-viewport-meta.md](https://github.com/vercel/next.js/blob/master/errors/no-document-viewport-meta.md)

Later, we will replace the hardcoded `false` value with value of `store.currentUser.darkTheme`. In other words, we hardcoded value for now, in the future (Chapter 7), we will retrieve value from database. This will tell our app whether a user made a choice to have dark theme as default:

-   if `store.currentUser.darkTheme` is `true`, then `theme=themeDark`
-   if `store.currentUser.darkTheme` is `false`, then `theme=themeLight`

Let's test our conditional operator `theme={false ? themeDark : themeLight}`, so we understand it better.

Start your app with `yarn dev` and go to `http://localhost:3000/csr-page`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-27+13-13-23.png)

As expected, `theme=themeLight` because `condition` in our conditional operator is `false`.

Keep the application running. Open `book/2-begin/app/pages/_app.tsx` and change the conditional operator to become:

```
theme={true ? themeDark : themeLight}
```

Next.js will detect this change and hot reload the updated application automatically. Take a look at the `http://localhost:3000/csr-page` page now:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-27+13-16-03.png)

Material-UI's dark theme looks good! The background is indeed dark. The button's styles also adjust to stand out on the dark background.

However, the text does not have the right color, Material-UI takes care of the text, but we assigned a local style. And this style takes over since it's local style. To fix this problem, open `book/2-begin/app/pages/csr-page.tsx`, find and delete the `color: '#222'` style. Look at your browser:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-27+13-24-08.png)

Looks much better. Text gets its styles from theme now.

As we add styles to the web application, you will see us add more conditional operators for dark vs light theme and also for desktop browser vs mobile browser.

In this book page component end user in this book At AWS dashboard Put it all together it works as expected if truthy then. In this book We will discuss Google OAuth API list of posts mount middleware API method team members show notification if truthy then decorate method with action show notification send this response withAuth HOC. Static method calls conditional operator S3 bucket open this file At AWS dashboard on the client MongoDB database response check if value is truthy add environmental variable MongoDB database. Data model MongoDB database conditional operator check if value is truthy list of posts S3 bucket compiles in a browser API method list of posts We will discuss API method You already learned. S3 bucket Click on the button request was sent show notification page component in production it works as expected S3 bucket decorate method with action. Compiles We will discuss show notification triggers method MongoDB database session send this response. Data model decorate method with action Put it all together static method calls on server only cookie this chapter We will discuss compiles data model check if value is truthy list of posts in this book. Server-side rendering page component Navigate to new Express route API method this chapter At AWS dashboard add environmental variable new Express route it works as expected data model discussion At AWS dashboard new Express route. S3 bucket Material-UI on server only in this book HTTP We will discuss compiles. Static method calls send this response MongoDB database new Express route Material-UI session it works as expected add environmental variable open this file Click on the button.

As we go forward, we will present screenshots of pages with the light theme. If you want your pages to match screenshots from this book, set theme to be light, change logic to be

```
theme={false ? themeDark : themeLight}
```

___

#### Remove styles injected on the server [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#remove-styles-injected-on-the-server)

To complete our integration with Material-Ui library, we need to remove server-side injected styles after `App` HOC (and `MyApp` component) mounts on the browser. Why do we need to do it? That's because for server-side rendered pages, we get two sets of styles. In other words, we have duplicated styles. One set of styles gets injected on the server and has `id` of value `jss-server-side`, second set gets added to the page on the browser once it's mounted. If HTML element has two sets of styles, these make create artifacts. For example, modal may not open when triggered or tooltip will be not visible when hovered over. Another potential problem with duplicated styles - if our page has duplicated styles, this may cause a "flash of style" when the server-side and client-side styles don't match.

Let's look at how integration example removes server-side styles:

[https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/\_app.tsx](https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx)

```
React.useEffect(() => {
  // Remove the server-side injected CSS.
  const jssStyles = document.querySelector('#jss-server-side');
  if (jssStyles) {
    jssStyles.parentElement.removeChild(jssStyles);
  }
}, []);
```

In the official integration example `MyApp` defined as stateless functional component, thus authors were able to use and actually used newer syntax - `useEffect` hook. We defined `MyApp` as ES6 class and therefore we will use older `componentDidMount` hook instead of `useEffect` hook:

[https://reactjs.org/docs/react-component.html#componentdidmount](https://reactjs.org/docs/react-component.html#componentdidmount)

```
public componentDidMount() {
  // Remove the server-side injected styles.
  const jssStyles = document.querySelector('#jss-server-side');
  if (jssStyles && jssStyles.parentNode) {
    jssStyles.parentNode.removeChild(jssStyles);
  }
}
```

After adding above snipper, the `book/2-begin/app/pages/_app.tsx` file should have following content:

```
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import App from 'next/app';
import Head from 'next/head';
import React from 'react';
import { isMobile } from '../lib/isMobile';
import { theme } from '../lib/theme';

class MyApp extends App {
  public componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  }
  public render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={theme}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}

export default MyApp;
```

Finally, as we mentioned earlier, let's make sure we understand server-side styles get removed on the browser:

```
public componentDidMount() {
  // Remove the server-side injected CSS.
  const jssStyles = document.querySelector('#jss-server-side');
  if (jssStyles && jssStyles.parentNode) {
    jssStyles.parentNode.removeChild(jssStyles);
  }
}
```

Go ahead and comment the above code block snippet inside `book/2-begin/app/pages/_app.tsx`.

-   Start your project, load the `CSRPage` page by going to `http:localhost:3000/csr-page`.
-   On the browser, access `Developer tools` by pressing `Ctrl + Shift + J`.
-   Then navigate to the `Elements` tab and click on the `<head>` element.

There, you can see the style element with the `id` value of `jss-server-side`. This style element was added on the server and contains styles for Material-UI's Button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-11-25+13-45-17.png)

This style element needs to be removed, because Material-UI adds new styles on the browser and styles get duplicated. Look under the style element we discussed. You will see multiple style elements such as

```
<style data-jss="" data-meta="MuiTouchRipple">
  ...
</style>
```

This style with `data-meta="MuiTouchRipple"` has the same styles as the style with `id="jss-server-side"`.

Go back to `book/2-begin/app/pages/_app.tsx` and uncomment code block with `MyApp.componentDidMount` definition.

-   Start your project, load the `CSRPage` page by going to `http:localhost:3000/csr-page`.
-   On the browser, access `Developer tools` by pressing `Ctrl + Shift + J`.
-   Then navigate to the `Elements` tab and click on the `<head>` element.

This time you won't find a style element with `id="jss-server-side"` - it was successfully removed to prevent duplication.

Good job on integrating your Next.js project with the Material-UI library.

___

## Shared layout [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#shared-layout)

Now that our Next.js app is integrated with Material-UI, let's make improvements to the user interface. We will add shared layout and shared styles. All pages of our web application will have this shared layout and these shared styles. We will also create a few components that will be frequently used on most pages of our web application:

-   MenuWithLinks
-   Notifier
-   Confirmer

Most of the pages in our web applications will have 2 columns, for example:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-04+13-31-26.png)

However, a few pages will have only one column, for example:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-04+13-46-15.png)

To implement such dual behavior, we can create a higher-order component - say `Layout` - that will receive a boolean prop `firstGridItem` from the page to decide whether to show either a 2-column or 1-column layout.

We could have placed such shared layout to `App` HOC but we decided with standalone `Layout` component that you have option to add or not to add to any of pages of your web application. `App` automatically wraps all pages of Next.js web application, and if you think that all pages will share the same layout, then when you are done with this book you can move content of `Layout` component to `MyApp` component that extends `App` HOC.

Since we integrated our Next.js app with Material-UI, we can now use `Grid` component to create a grid layout with either 1 or 2 columns:

[https://material-ui.com/components/grid/#grid](https://material-ui.com/components/grid/#grid)

To create a simple 2 columns layout:

```
<Grid container direction="row" justify="flex-start" alignItems="stretch">
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
    </Grid>
  ) : null}
  <Grid item sm={10} xs={12}>
    {children}
  </Grid>
</Grid>
```

You probably noticed that `xs={12}` for both of the `Grid` items inside the `Grid container`. That means for anyone with a browser width of less than 600 px, both items will occupy all 12 columns. In other words, the container will show 2 `Grid` items as 1 column with 2 rows:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-04+16-28-37.png)

Now notice that `sm={2}` on the first item and `sm={10}` on the second item. That means for anyone with a browser width of more than 600 px, the container will show 2 `Grid` items as 2 columns and 1 row:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-04+16-28-58.png)

You can find the exact pixel values for different breakpoints at:

[https://material-ui.com/customization/breakpoints/](https://material-ui.com/customization/breakpoints/)

`sm` breaking point has value of 600 px.

Next step: let's display the first column only when `fisrtGridItem` is true using the conditional operator you learned earlier in this chapter:

```
condition ? exprIfTrue : exprIfFalse
```

To conditionally hide the first column, we can set `exprIfFalse` to be `null` like this:

```
<Grid container direction="row" justify="flex-start" alignItems="stretch">
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
    </Grid>
  ) : null}
  <Grid item sm={10} xs={12}>
    {children}
  </Grid>
</Grid>
```

Now we are ready to create a new file `book/2-begin/app/components/layout/index.tsx` and define our `Layout` component. Inside the `app` folder, create a `components` folder. Then inside this `components` folder, create a folder called `layout`. Finally, create `index.tsx` with following content:

```
import Grid from '@material-ui/core/Grid';
import React from 'react';

const styleGrid = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

type Props = {
  firstGridItem?: boolean;
  children: React.ReactNode;
};

class Layout extends React.Component<Props> {
  public render() {
    const { firstGridItem, children } = this.props;

    return (
        <Grid container direction="row" justify="flex-start" alignItems="stretch" style={styleGrid}>
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
                <p>SVG icon</p>
                <p>Clickable Avatar</p>
              </div>
              <hr />
              <p />
              <p />
            </Grid>
          ) : null}
          <Grid item sm={10} xs={12}>
            {children}
          </Grid>
        </Grid>
    );
  }
}

export default Layout;
```

A few notes on the above definition of the `Layout` HOC:

-   Notice that when we defined the `Index` page, we defined it as a so-called `functional component`:
    
    ```
      const Index = () => ...
    ```
    
    It's called functional, because the component is defined as a JavaScript function and not as ES6 class. It's easy to write and understand. Such component is often called stateless functional component since it has no state property unlike ES6 class component.
    
    Take a look at the definition of the above `Layout`. In this case, we did not define it as `functional component` but defined it as an ES6 class:
    
    [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)
    
    ```
      class Layout extends React.Component<Props> { ... }
    ```
    
    The keyword `extends` ([https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)) is used to create a new class that is a child of another class, in this case the `React.Component` class.
    
    So how do you decide when to use `functional component` or `class/extends`? The latter definition does support `state`, `refs`, and `lifecycle methods`. We chose to define `Layout` component as ES^ class so we have option of using lifecycle hook, for example, `componentDidMount`. Generally, though, we recommend writing components as stateless functional components unless you need `state`, `refs`, or `lifecycle methods`. Since React 16.8 version, you can use `useState` and `useEffect` hooks for functional components, but don't cover these hooks in the current version of this book.
    
-   Another note. We could have created a `components/layout.tsx` file instead of `components/layout/index.tsx`. There is no difference between these two approaches. However, since at the end of this book, our `components` folder will only contain multiple folders, we opted to create a `layout` folder purely for more consistent file and folder organization.
    
-   Yet another note: `this.props.children` is a page component. Remember, `Layout` is a HOC that will **wrap** a page component. So think of the final result like this - take whatever code your page component contains and paste this code instead of `{children}` inside the `Layout` component. You may notice that this `children` is `React.ReactNode` and `ReactNode` ([https://www.reactenlightenment.com/react-nodes/4.1.html](https://www.reactenlightenment.com/react-nodes/4.1.html)) is a virtual DOM element. If you make this mental exercise, you will see that the page code goes into the second `Grid` item of `Layout` component.
    

Time to wrap our `Index` page with our new `Layout` HOC.

HTTP end user triggers method check if value is truthy request production-ready in production request You already learned. Team members send this response You already learned HTTP it works as expected We will discuss add environmental variable request show notification check if value is truthy list of posts response API method calls corresponding store method session Remember to add import. Store method calls this chapter withAuth HOC data model session add environmental variable request was sent check if value is truthy in production on the client production-ready in a browser server-side rendering redirect to checkout conditional operator. Session Material-UI response You already learned it works as expected email and name data model. Request add environmental variable discussion conditional operator Next.js web application. New Express route email and name session page component conditional operator Navigate to. Open this file Next.js web application redirect to checkout cookie Next.js web application server-side rendering API method calls corresponding store method. Open this file open this file page component server-side rendering page component Team Leader it works as expected discussion API method calls corresponding store method. Click on the button discussion S3 bucket if truthy then static method calls on server only in a browser open this file decorate method with action You already learned end user HTTP. WithAuth HOC AWS dashboard in a browser mount middleware Google OAuth API end user store method calls mount middleware cookie.

Open `book/2-begin/app/pages/index.tsx`. Import `Layout` and wrap the page's code like this:

```
import React from 'react';
import Head from 'next/head';

import Link from 'next/link';

import Layout from '../components/layout';

const Index = () => (
  <Layout firstGridItem={true}>
    <Head>
      <title>Index page</title>
      <meta name="description" content="This is a description of the Index page" />
    </Head>
    <div style={{ padding: '0px 30px', fontSize: '15px', height: '100%' }}>
      <p>Content on Index page</p>
      <Link href="/csr-page" as="/csr-page">
        Go to CSR page
      </Link>
    </div>
  </Layout>
);

export default Index;
```

Start your app with `yarn dev` and navigate to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-05+11-55-59.png)

Try changing the logic by setting `firstGridItem` to `false` in `<Layout firstGridItem={false}>`. Go to your browser:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-05+11-56-26.png)

Boom - now you have a simple way to control which page gets 2 columns and which gets 1 column.

Let's make one more improvement to `Layout`. Replace `<p>SVG icon</p>` with an actual svg code of the icon. You can paste any icon. We use one of our company's logo.

`book/2-begin/app/components/layout/index.tsx`:

```
import Grid from '@material-ui/core/Grid';
import React from 'react';
import MenuWithLinks from '../common/MenuWithLinks';

const styleGrid = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

type Props = {
  firstGridItem?: boolean;
  children: React.ReactNode;
};

class Layout extends React.Component<Props> {
  public render() {
    const { firstGridItem, children } = this.props;

    const isThemeDark = false;

    return (
        <Grid container direction="row" justify="flex-start" alignItems="stretch" style={styleGrid}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0px 10px' }}>
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
                <p>Clickable Avatar</p>
              </div>
              <hr />
              <p />
              <p />
            </Grid>
          ) : null}
          <Grid item sm={10} xs={12}>
            {children}
          </Grid>
        </Grid>
    );
  }
}

export default Layout;
```

Notice that we change the icon's color depending on the value of boolean variable `isThemeDark`. For now we hardcoded its value to be `false`. Eventually, we will get its value from database. We added such conditional logic in order for the icon to have proper contrast - black icon on white background and vice versa.

Change `firstGridItem` back to `true` inside of `book/2-begin/app/pages/index.tsx`.

Start your project with `yarn dev` and go to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-05+12-07-59.png)

Side note: in order to get svg code, you can simply open your svg file with your browser, right-click on your icon and select `Inspect element`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-12+10-43-58.png)

___

## Adding styles [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#adding-styles)

You can add styles to any element, component, or page in your web application. There are no absolute rules on how to add and manage styles throughout your project.

If you notice that you use a certain style frequently, we recommend that you make such style reusable. And again there are no absolute rules on how and where to define such styles. Let's talk about what we did in this book and why.

1.  Let's put reusable styles that need to be explicitly added to components and pages into `lib/sharedStyles.ts` file.
    
    Here is an example of some styles we suggest adding to new file `book/2-begin/app/lib/sharedStyles.ts`:
    
    ```
     const styleBigAvatar = {
       width: '80px',
       height: '80px',
       margin: '0px auto 15px',
     };
    
     const styleRaisedButton = {
       margin: '15px',
       font: '14px Roboto',
     };
    
     const styleToolbar = {
       background: '#FFF',
       height: '64px',
       paddingRight: '20px',
     };
    
     const styleLoginButton = {
       borderRadius: '2px',
       font: '16px Roboto',
       fontWeight: 400,
       letterSpacing: '0.01em',
       color: '#fff',
       backgroundColor: '#DF4930',
     };
    
     const styleTextField = {
       font: '15px Roboto',
       color: '#222',
       fontWeight: '300',
     };
    
     const styleForm = {
       margin: '7% auto',
       width: '360px',
     };
    
     export {
       styleBigAvatar,
       styleRaisedButton,
       styleToolbar,
       styleLoginButton,
       styleTextField,
       styleForm,
     };
    ```
    
    You are welcome to add or remove any of your own styles. Once you have defined and exported a style, you can simply import and use it anywhere you want (component or page component).
    
2.  If you don't want to explicitly add resusable style because you want style to be on all pages of your web applicaiton, you can add such style to HOCs. For example, if you want all pages of your web application to share certain styles, you can add styles to the `Document` HOC at`book/2-begin/app/pages/_document.tsx` like so:
    
    ```
     import { ServerStyleSheets } from '@material-ui/styles';
     import Document, { Head, Html, Main, NextScript } from 'next/document';
     import React from 'react';
    
     class MyDocument extends Document {
       public static getInitialProps = async (ctx) => {
         // Render app and page and get the context of the page with collected side effects.
         const sheets = new ServerStyleSheets();
         const originalRenderPage = ctx.renderPage;
    
         ctx.renderPage = () =>
           originalRenderPage({
             enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
           });
    
         const initialProps = await Document.getInitialProps(ctx);
    
         return {
           ...initialProps,
           // Styles fragment is rendered after the app and page rendering finish.
           styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()],
         };
       };
    
       public render() {
         console.log('rendered on the server');
    
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
    
               <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
               <link rel="stylesheet" href="https://storage.googleapis.com/async-await/vs2015.min.css" />
    
               <link
                 rel="stylesheet"
                 href="https://storage.googleapis.com/async-await/nprogress-dark.min.css?v=1"
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
    
    Note that besides adding styles using the `<style />` tag, you have an option of hosting a CSS file elsewhere (CDN) and importing styles from this file using a `<link rel="stylesheet" href="" />` tag:
    
    ```
     <link rel="stylesheet" href="https://storage.googleapis.com/async-await/vs2015.min.css" />
    ```
    
    File `vs2015.min.css` is a minified CSS file that contains styles for markdown-related HTML elements. When we have `<code>` and `<pre>` tags in our web application, these tags have styles (for example, colors) that make them easier to read by the end user. We will mention this file later when we add markdown support to our `Post` data model.
    
    WithAuth HOC list of posts Navigate to AWS dashboard AWS dashboard triggers method session end user HTTP. Show notification list of posts team members API method calls corresponding store method You already learned response Material-UI compiles in this book Navigate to MongoDB database send this response Next.js web application decorate method with action. Cookie MongoDB database if truthy then new Express route You already learned API method. It works as expected decorate method with action team members session email and name compiles triggers method You already learned on server only. API method triggers method on the client decorate method with action end user. MongoDB database in production We will discuss Put it all together add environmental variable add environmental variable HTTP in production triggers method API infrastructure. In this book check if value is truthy At AWS dashboard send this response check if value is truthy check if value is truthy API infrastructure response data model. Production-ready API infrastructure if truthy then response on server only request compiles on the client decorate method with action API method calls corresponding store method data model request At AWS dashboard. Team Leader Navigate to API method Team Leader mount middleware cookie Material-UI You already learned. End user on the client production-ready team members show notification server-side rendering check if value is truthy redirect to checkout.
    
    We also added minified CSS file for a loading bar that we will discuss later in the book. The [Nprogress](https://ricostacruz.com/nprogress/) loading bar:
    
    ```
     <link
       rel="stylesheet"
       href="https://storage.googleapis.com/async-await/nprogress-dark.min.css?v=1"
     />
    ```
    
    We will discuss the Nprogress loading bar later in this book when we discuss waiting and loading data on the page.
    
    Normally, a web developer would add font using `<link />` as well. We don't do this, because Material-UI does added default font to our web application automatically.
    
    We did add a favicon icon ([https://www.w3.org/2005/10/howto-favicon](https://www.w3.org/2005/10/howto-favicon)) to our web application:
    
    ```
     <link
       rel="shortcut icon"
       href="https://storage.googleapis.com/async-await/async-favicon32.png"
     />
    ```
    
    Finally, we added styles for a library of icons:
    
    ```
     <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    ```
    
    Open the `book/2-begin/app/pages/index.tsx` file, then add this paragraph and icon code:
    
    ```
     <p />
     <i className="material-icons">menu</i>
    ```
    
    Start your project with `yarn dev` and navigate to `http://localhost:3000`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-12+11-44-16.png)
    
    Take a look at your browser tab - it properly displays the favicon icon we added. The `menu` icon and `<a>` tag render properly as well. Every page in your application will have the styles you just added to the `Document` HOC, since this HOC wraps all pages.
    

Besides `book/2-begin/app/lib/sharedStyles.ts` and `book/2-begin/app/pages/_document.tsx`, you are more than welcome to add styles to particular HTML elements, components, and pages.

3.  Reusable style within the context of page or component.
    
    Create a reusable style when you want to apply to multiple elements of the same page or component.
    
    For example, in the code snippet above, we could have written a resusable style at the top of the file and then applied that style to the `<div>` element. In this case, the style is reusable and can be applied to multiple elements on the same page:
    
    ```
     const styleDiv = {
       padding: '10px 45px',
     };
    
     // some code
    
     <div style={styleDiv}>
       // some code
     </div>
    ```
    
    You store such styles in the corresponding file.
    
4.  Inline (or non-reusable or local) style for a single element in a single page.
    
    Add an inline style when you want to apply a style to one element inside page or component file.
    
    For example, on our `Index` page, we wrote this single inline style for `<div>` element:
    
    ```
     <div style={{ padding: '10px 45px' }}>
       // some code
     </div>
    ```
    
    You store such styles in the corresponding file.
    

Keep in mind that you will have much less headache if you keep the number of custom styles low. After all, we integrated our Next.js web project with Material-UI's library that has opinionated styles for all elements. So we encourage you to limit the number of custom styles and rely more on Material-UI's library. Unless your goal is significantly customize Material-UI's styles. In that case, you may want drop Material-UI library from your project completely.

___

## Shared components [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#shared-components)

This section contains three subsections `MenuWithLinks`, `Notifier`, and `Confirm`. In each subsection, we will discuss and create a new component. The names of components somewhat describe their purpose. When building each of these three components, we will rely heavily on components from the Material-UI library.

All three components - `MenuWithLinks`, `Notifier` and `Confirm` - will be imported into our `Layout` component. Thus, all three components will be part of every page in our web application that is wrapped by `Layout` component.

___

#### MenuWithLinks [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#menuwithlinks)

Out of the three components, `MenuWithLinks` is the simplest to implement. Here, we want to create a dropdown menu. When a user clicks this menu, a dropdown with a list of links will appear. Let's check up Material-UI's library for anything we can use.

Check up `Menu` and `MenuItem` components from Material-UI:

[https://material-ui.com/components/menus/#simple-menu](https://material-ui.com/components/menus/#simple-menu)

Button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+14-14-45.png)

Dropdown list:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+14-15-20.png)

The code from the above link:

```
import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export default function SimpleMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
        Open Menu
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>My account</MenuItem>
        <MenuItem onClick={handleClose}>Logout</MenuItem>
      </Menu>
    </div>
  );
}
```

Notice that the `Button` component has attributes `aria-controls` with value `simple-menu` and `aria-haspopup` with value `true`:

[https://www.w3.org/TR/wai-aria-1.1/#aria-controls](https://www.w3.org/TR/wai-aria-1.1/#aria-controls)

[https://www.w3.org/TR/wai-aria-1.1/#aria-haspopup](https://www.w3.org/TR/wai-aria-1.1/#aria-haspopup)

And the `Menu` component has an `id` value set to `simple-menu`.

`aria-controls` creates a relationship between `Button` and `Menu` components. `aria-haspopup` indicates the presence of a popup, which is the `Menu` component in this case.

As with any component from Material-UI's library, we strongly suggest that you check up API documentation of each component you intend to use. In this case, the `Menu` API:

[https://material-ui.com/api/menu/](https://material-ui.com/api/menu/)

For example, from API documentation, `open` is boolean parameter. If it is `true`, then the dropdown is open. So when you see `Boolean(anchorEl)` - this expression checks whether the `DOM element` ([https://developer.mozilla.org/en-US/docs/Web/API/Element](https://developer.mozilla.org/en-US/docs/Web/API/Element)) `anchorEl` exists in the `DOM`, document model loaded in the browser and representing the document as a node tree ([https://developer.mozilla.org/en-US/docs/Glossary/DOM](https://developer.mozilla.org/en-US/docs/Glossary/DOM)).

If we define `handleClick` and `handleClose` like this:

```
public handleClick = (event) => {
  this.setState({ anchorEl: event.currentTarget });
};

public handleClose = () => {
  this.setState({ anchorEl: null });
};
```

following interaction happens.

-   When a user clicks on the `Button` component - `Boolean(anchorEl)` is `true` and `Menu`/dropdown is displayed.
-   When a user clicks elsewhere on the page (not on `Button` component) - `anchorEl` is `null`, `Boolean(anchorEl)` is `false`, and `Menu`/dropdown gets hidden.

It's important to note that the `Menu` component is already in the DOM after the page is loaded on a user's browser. The user's behavior simply controls whether `Menu` is visible or not.

Our menu will be a bit more sophisticated than the simple menu example from the above. Here are key differences:

-   We do not want to hardcode text for our `MenuItem` component. We want to pass an array called `options` to the `MenuWithLinks` component. This `options` array will have members that are objects with properties `text`, `href`, `as`, and `separator`:
    
    ```
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
                  fontWeight: 300,
                  fontSize: '14px',
                }}
              >
                {option.text}
              </MenuItem>
            </Link>
          ),
        )}
      </Menu>
    ```
    
    As you can see, we want items on the dropdown list to be either a `<hr>` line or a link. Here is the final dropdown we are aiming for:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+14-57-57.png)
    
-   Similarly, we don't want to hardcode the `Button` element. We want our `MenuWithLinks` component to be anything you want. Not just `Button`, but any other element. So we want to take the `children` element and wrap it in a `div` that has all attributes necessary to control `Menu`/dropdown:
    
    ```
      <div
        aria-controls={anchorEl ? 'simple-menu' : null}
        aria-haspopup="true"
        onClick={this.handleClick}
        onKeyPress={this.handleClick}
      >
        {children}
      </div>
    ```
    
    As you can see in the below screenshot, the clickable element is the `Avatar` component from Material-UI and material icon `arrow_drop_down`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+15-03-03.png)
    

Let's put our code together. Go ahead and create a new file at `book/2-begin/app/components/common/MenuWithLinks.tsx` (create new folder `common` beforehand) with the following content:

```
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Link from 'next/link';
import { NextRouter, withRouter } from 'next/router';
import React from 'react';

type Props = {
  options: any[];
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
                    fontWeight: 300,
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

You may notice that we used `React.PureComponent` instead of `React.Component`. The pure component is component that does not call `render` method when `props` and `state` have been updated but have the same values.

[https://reactjs.org/docs/react-api.html#reactpurecomponent](https://reactjs.org/docs/react-api.html#reactpurecomponent)

In other words, `MenuWithLinks` component that is defined as ES6 class that extends `React.PureComponent` will not re-render if `props` and `state` have the same value after update. This may result in increased performance of your web application.

Data model on server only check if value is truthy team members discussion discussion redirect to checkout. New Express route decorate method with action Remember to add import withAuth HOC Material-UI add environmental variable subsection We will discuss API method calls corresponding store method response You already learned. Data model on server only AWS dashboard response Put it all together Next.js web application if truthy then. API infrastructure if truthy then if truthy then cookie new Express route list of posts. Put it all together response session Click on the button if truthy then response API method email and name triggers method Material-UI email and name triggers method. End user on the client Navigate to cookie team members API method calls corresponding store method this chapter page component AWS dashboard static method calls in this book Google OAuth API. HTTP on the client redirect to checkout mount middleware cookie production-ready S3 bucket We will discuss page component page component end user request static method calls static method calls. New Express route end user Remember to add import it works as expected withAuth HOC You already learned MongoDB database withAuth HOC conditional operator server-side rendering. In this book session static method calls discussion conditional operator conditional operator S3 bucket store method calls send this response new Express route. Conditional operator decorate method with action page component static method calls Next.js web application store method calls AWS dashboard You already learned At AWS dashboard Click on the button decorate method with action API method calls corresponding store method AWS dashboard compiles.

As you can see if accessed `router` object from component's `props`. We haven't used `router` yet but we do so later in this section. We would access `router.asPath` value and use it to conditionally highlight link inside menu. We were able to access `router` object as `this.props.router` because we wrapped component with `withRouter` HOC:

[https://nextjs.org/docs/api-reference/next/router#withrouter](https://nextjs.org/docs/api-reference/next/router#withrouter)

On your VS code editor, you will notice a warning on the line:

```
options: any;
```

You can also run `yarn lint` in your terminal and see `Unexpected any` warning.

The word `any` will have warning underscore and if you mouseover to `any` - VS code editor will display warning text:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2020-04-20+08-37-19.png)

TypeScript wants you to specify a more specific type for your data, `any` is way too broad and TypeScript loses its value if we, as developers, say that `options` can be any `array`:

[https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md)

But occasionally, it's ok to use `any` if you, as a developer, do not know what type data will be eventually. We could have written:

```
options: any[];
```

But may not be true eventually, some parameters will be `string` but eventually there be at least one `boolean` parameter inside `options`. Thus we specified type to be `any[]`.

If you like to remove warning, open `book/2-begin/app/.eslintrc.js` file and a new line that turns off this warning:

```
"@typescript-eslint/camelcase": "off",
"@typescript-eslint/explicit-function-return-type": "off",
"react/no-unescaped-entities": "off",
"react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
"@typescript-eslint/no-explicit-any": "off",
```

This line disables above warning:

```
"@typescript-eslint/no-explicit-any": "off",
```

If you go back to `book/2-begin/app/components/common/MenuWithLinks.tsx` file, there be no warning at `options: any[]`. If you run `yarn lint`, there will be no warning.

In case of `options` we completely design data types and we know what data types we will evenutally pass, so let's specify actual data types instead of using `any[]`:

```
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
```

Note that we used { ... }\[\] to define data type of `options` as array of objects. So if in the future you need to define such data type, you will know how to do it.

One more important point on data types. We could have defined initial `state` with:

```
public state = {
  anchorEl: null,
};
```

But instead we chose wordier:

```
constructor(props) {
  super(props);

  this.state = {
    anchorEl: null,
  };
}
```

Both of the above expressions achieve similar result, they set initial value for property inside `state`. However, in second approach `state` inherits data types from `type State`. If we use first approach, there is no such inheritance:

[https://stackoverflow.com/questions/51465921/react-typescript-constructor-state-vs-property](https://stackoverflow.com/questions/51465921/react-typescript-constructor-state-vs-property)

Thus, in this book, we use second approach wherever applicable.

Next, let's import and add `MenuWithLinks` to `Layout`, so we can finally see `MenuWithLinks`. Replace `<p>Clickable Avatar</p>` with:

```
<MenuWithLinks
  options={[
    {
      text: 'Index page',
      href: '/',
    },
    {
      text: 'Your Settings',
      href: '/your-settings',
    },
    {
      separator: true,
    },
    {
      text: 'Log out',
      href: '/logout',
    },
  ]}
>
  <Button>Open menu</Button>
</MenuWithLinks>
```

You will get inside `book/2-begin/app/components/layout/index.tsx` file:

```
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import React from 'react';
import MenuWithLinks from '../common/MenuWithLinks';
import Confirm from '../common/Confirm';
import Notifier from '../common/Notifier';

const styleGrid = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

type Props = {
  firstGridItem?: boolean;
  children: React.ReactNode;
};

class Layout extends React.Component<Props> {
  public render() {
    const { firstGridItem, children } = this.props;

    const isThemeDark = false;

    return (
      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="stretch"
        style={styleGrid}
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
                    text: 'Index page',
                    href: '/',
                  },
                  {
                    text: 'Your Settings',
                    href: '/your-settings',
                  },
                  {
                    separator: true,
                  },
                  {
                    text: 'Log out',
                    href: '/logout',
                  },
                ]}
              >
                <Button>Open menu</Button>
              </MenuWithLinks>
            </div>
            <hr />
            <p />
            <p />
          </Grid>
        ) : null}
        <Grid item sm={10} xs={12}>
          {children}
        </Grid>
        <Notifier />
        <Confirm />
      </Grid>
    );
  }
}

export default Layout;
```

Start your project with `yarn dev` and go to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+15-23-11.png)

Click the button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+15-24-42.png)

Good job if your menu behaves as expected (becomes visible on button click and then gets hidden on click outside of dropdown list)!

Next step: let's replace `Button` with `Avatar` and icon. Inside `book/2-begin/app/components/layout/index.tsx` you should get:

```
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import React from 'react';
import MenuWithLinks from '../common/MenuWithLinks';
import Confirm from '../common/Confirm';
import Notifier from '../common/Notifier';

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

type Props = {
  firstGridItem?: boolean;
  children: React.ReactNode;
};

class Layout extends React.Component<Props> {
  public render() {
    const { firstGridItem, children } = this.props;

    const isThemeDark = false;

    return (
      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="stretch"
        style={styleGrid}
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
              {/* <p>Clickable Avatar</p> */}
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
                    href: '/logout',
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
        <Grid item sm={10} xs={12}>
          {children}
        </Grid>
        <Notifier />
        <Confirm />
      </Grid>
    );
  }
}

export default Layout;
```

As you can see from the value of `src` - we used a generic user avatar. Later in this book, we will pass a URL of the actual user's avatar.

Start your project with `yarn dev` and go to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+15-03-03.png)

Try clicking the `Avatar` and make sure that the menu still works as it should.

Before we move to the next subsection, let's make one small UI/UX impovement. Let's add a distinct style, for example `fontWeight: 600`, to the link on the dropdown. If a user is on `/` page, then the `Index page` text on the dropdown will have the style `fontWeight: 600`:

To do so, we need to know the current value of path and then compare this value to, say, `options.highlighterSlug`.

-   As we mentioned earlier in this chapter, we can access `router` object from components `props`, if we wrap component with `withRouter` HOC Next.js ([https://nextjs.org/docs/api-reference/next/router#withrouter](https://nextjs.org/docs/api-reference/next/router#withrouter)). We can get the current value of path, `router.asPath`:
    
    ```
      import { withRouter } from 'next/router'
    
      function Page({ router }) {
        return <p>{router.asPath}</p>
      }
    
      export default withRouter(Page)
    ```
    
    For `fontWeight` of `Link` text inside `MenuWithLinks` we would get this conditional expression:
    
    ```
      fontWeight: router.asPath.includes(option.highlighterSlug) ? 600 : 300,
    ```
    
    Note that `fontWeight: 300` became `fontWeight: router.asPath.includes(option.highlighterSlug) ? 600 : 300`. This logic checks if `router.asPath` includes `option.highlighterSlug` string. If it does -> `fontWeight: 600`. Like with any JavaScript method, we recommend you use Mozilla's documentation to learn about the `includes` method:
    
    [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/String/includes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes)
    
-   Let's add value for `highlighterSlug` prop to `Layout`. This block of code:
    
    ```
      options={[
        {
          text: 'Index page',
          href: '/',
        },
        {
          text: 'Your Settings',
          href: '/your-settings',
        },
        {
          separator: true,
        },
        {
          text: 'Log out',
          href: '/logout',
        },
      ]}
    ```
    
    Becomes:
    
    ```
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
          href: '/logout',
        },
      ]}
    ```
    

Start your project with `yarn dev` and go to `http://localhost:3000`.

Click on the avatar:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-18+15-48-41.png)

If you are at `/` and the `Index page` text has `fontWeight: 600`, then our UX/UI addition works!

___

Before move on to the next shared (common) component, let's take a short detour to talk about DOM and performance. Every time you open and close the menu, it gets added and removed from the DOM. This is OK behavior - but if you are at a stage of development where you figured out your business model and want to scale your web application - you need to think about performance.

In most cases, adding/removing an element to/from the DOM is slower than keeping that element and simply using a few CSS rules to hide it. Some components from the Material-UI library can be kept mounted in the DOM.

Open `book/2-begin/app/components/common/MenuWithLink.tsx` and find the `Menu` component. Start typing `keep...` and you will see a dropdown with suggestions:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-21+13-01-56.png)

Team members store method calls end user conditional operator mount middleware API method calls corresponding store method data model on the client request was sent API method. Check if value is truthy discussion page component list of posts request subsection. In production show notification API method it works as expected compiles send this response static method calls withAuth HOC request on the client API infrastructure MongoDB database data model this chapter in a browser. End user conditional operator request was sent this chapter Put it all together Google OAuth API HTTP Put it all together Remember to add import. Material-UI in production Material-UI API method calls corresponding store method API infrastructure production-ready Remember to add import Material-UI page component S3 bucket withAuth HOC You already learned cookie compiles cookie. Session Put it all together subsection this chapter subsection. At AWS dashboard subsection Navigate to MongoDB database on the client Click on the button. This chapter page component At AWS dashboard API infrastructure team members Team Leader Team Leader open this file Next.js web application discussion data model HTTP production-ready add environmental variable in this book. Material-UI request on the client store method calls request was sent. Team Leader page component API method calls corresponding store method page component AWS dashboard on server only We will discuss discussion discussion request was sent HTTP request.

That means Material-UI's component `Menu` has an API called `keepMounted`. If you set it up, the menu will stay mounted in the DOM instead of being removed every time you close the menu. Let's test to understand it better.

Make sure that you don't have the `keepMounted` attribute in your `Menu` component.

Start your app with `yarn dev` and go to `http://localhost:3000`.

Click on the `Avatar` element, then right-click on the dropdown and select `Inspect element`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-21+13-09-16.png)

As you can see, Material-UI renders the `Menu` component as a nested element with a parent element that has the following `class`:

```
class="MuiPaper-root MuiMenu-paper MuiPaper-elevation8 MuiPopover-paper MuiPaper-rounded"
```

Go ahead and click anywhere on the page in order to close the dropdown. Try to find the element inside DOM that has the above `class`. You can look for it by eye or using the search bar. If you are inside the `Chrom Dev Tools > Elements` tab, simply open the search bar with `Ctrl + F`. You won't find it, since this nested element was removed from the DOM after you closed the menu's dropdown.

Let's attempt to keep this nested element in the DOM. Open `book/2-begin/app/components/common/MenuWithLink.tsx`, find the `Menu` component, and add the `keepMounted` attribute to it. Follow the same steps from above: Start your project with `yarn dev` and go to `http://localhost:3000`. Click on the `Avatar`. Right-click on the dropdown and select `Inspect element`. Find the parent element again. Click anywhere on the page to close the dropdown. Search the DOM again. This time you will find the element! This element is still in the DOM, though some of its styles, such as `opacity` and `visibility`, have changed.

We recommend to not overly obsess with performance optimization when you are in earlier stages of development. In many ways, `app-api` structure and stack that you are learning in this book lets you build fast web applications by default. Next.js does a lot of heavy lifting for us. We will talk about performance occasionally throughout book and more in Chapter 10.

___

#### Notifier [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#notifier)

In this subsection, we implement yet another shared component - component that we will re-use on some pages and define inside `common` folder. We call it `Notifier`.

The purpose of `MenuWithLinks` that we just implemented with you is to be able to add a menu anywhere in your web application. Adding a menu to any page of your web application will now take only few minutes.

The `Notifier` component allows you to show an informational message (notification) to an end user. It could be success or error type of message. For example, your end user may delete a Post or Discussion or buy a subscription - you can show a notification to indicate that the action was indeed successful.

After deleting a Discussion, you may want to inform a user like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-21+13-40-11.png)

If the user forgets to add content to a new Discussion:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-21+13-39-53.png)

By the end of this book, your web application will have over a dozen of places where `Notifier` shows an informational message.

Similar to when you implemented `MenuWithLinks` - we won't start building component from scratch. Instead, we will search Material-UI's library to find the most appropriate component for the desired functionality. In this case, the component is `Snackbar`:

[https://material-ui.com/components/snackbars/#snackbar](https://material-ui.com/components/snackbars/#snackbar)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-21+13-49-29.png)

The code from the above link:

```
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

export default function SimpleSnackbar() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleClick}>Open simple snackbar</Button>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        ContentProps={{
          'aria-describedby': 'message-id',
        }}
        message={<span id="message-id">Note archived</span>}
        action={[
          <Button key="undo" color="secondary" size="small" onClick={handleClose}>
            UNDO
          </Button>,
          <IconButton
            key="close"
            aria-label="close"
            color="inherit"
            className={classes.close}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      />
    </div>
  );
}
```

Let's follow the above example but make a few changes:

-   Instead of `React.useState` and `setOpen`, we use `state` and `this.setState`
-   We change `anchorOrigin` values so that the snackbar appears at the top right corner
-   Instead of `<div>`, we use `<React.Fragment>`, since there is no reason to have an unnecessary `<div>`. Side note: if you ever see an error in your VS editor `Left side of comma operator is unused and has no side effects.ts(2695)`, that means you need to add a parent element, such as `<React.Fragment>`.
-   We make the content of the `<span>` element `dangerouslySetInnerHTML={{ __html: this.state.message }}`. This allows us to pass HTML code as content. This is useful if you, say, want to have a hyperlink added to the content of the snackbar.

Send this response server-side rendering decorate method with action API method Put it all together HTTP subsection. In a browser email and name discussion MongoDB database end user check if value is truthy. Add environmental variable cookie S3 bucket discussion store method calls list of posts request was sent show notification session server-side rendering send this response. Cookie new Express route API method API method calls corresponding store method it works as expected. Cookie API method check if value is truthy triggers method request was sent cookie team members session server-side rendering conditional operator. Server-side rendering API infrastructure team members Put it all together static method calls request in production server-side rendering Remember to add import in production list of posts add environmental variable triggers method. Navigate to list of posts static method calls server-side rendering session server-side rendering compiles API infrastructure HTTP. Data model HTTP You already learned Navigate to team members Google OAuth API Remember to add import. Material-UI API infrastructure Material-UI response compiles it works as expected API infrastructure cookie show notification mount middleware response API method calls corresponding store method if truthy then MongoDB database. Server-side rendering email and name open this file conditional operator HTTP subsection session At AWS dashboard.

Create a new file `book/2-begin/app/components/common/Notifier.tsx`. Make the above changes to the above example and you will get this content:

```
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import React from 'react';

type State = {
  open: boolean;
  message: string;
};

class Notifier extends React.PureComponent<any, State> {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      message: '',
    };
  }

  public render() {
    const message = (
      <span id="snackbar-message-id" dangerouslySetInnerHTML={{ __html: this.state.message }} />
    );

    return (
      <React.Fragment>
        <Button
          onClick={() => {
            this.openSnackbar({ message: 'test' });
          }}
        >
          Open Notifier
        </Button>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          message={message}
          autoHideDuration={5000}
          onClose={this.handleSnackbarClose}
          open={this.state.open}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
        />
      </React.Fragment>
    );
  }

  public handleSnackbarClose = () => {
    this.setState({
      open: false,
      message: '',
    });
  };

  public openSnackbar = ({ message }) => {
    this.setState({ open: true, message });
  };
}

export default Notifier;
```

Import and add this newly created `Notifier` component to `Layout`. Open `book/2-begin/app/components/layout/index.tsx` and find the code for first grid column. Add `Notifier` like this:

```
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
    // some code
  </div>
  <hr />
  <p />
  <p />
  <Notifier />
</Grid>
```

As always, please remember to add missing imports!

Start your project with `yarn dev`, navigate to `http://localhost:3000`, and click the `Open Notfier` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-21+14-39-10.png)

As we mentioned when working on `MenuWithLinks`, we encourage you to check up the API documentation so you can customize components to specific requirements. For example, you can change the location and duration of `Notifier` by changing values for `anchorOrigin` and `autoHideDuration`:

[https://material-ui.com/api/snackbar/](https://material-ui.com/api/snackbar/)

So far so good! Alhough our component opens/closes properly - this is not exactly the behavior we want. The above example has a clickable button, but we don't want to bind `Notifier` to a button click. We want to show `Notifier` when we call some asynchronous method, for example, API method that fetches data from database, and then show the notifier if the action was successful or returned error.

So our goal is to create a function - let's call it `openSnackbar` - that takes `message` as an argument. If called, this functions shows the `Notifier` component. Then we can export this function from `book/2-begin/app/components/common/Notifier.tsx` and import it to any page. In other words, we can import and add `Notifier` to `Layout` only once and then import/add the `openSnackbar` function as needed to any page.

What are our requirements for such method? Let's call this method `openSnackbarExternal`

1.  First requirement: The `openSnackbarExternal` must be defined outside of the `class Notifier`. This is because we want to access component's `Notifier.openSnackbar` method from outside of component itself. If this method is the method of the `class Notifier` - for example `this.openSnackbar` - we cannot export it out and cannot access it elsewhere in our project. In other words, `let openSnackbarExternal;` must be outside of `Notifier` component.
    
2.  Second requirement: When we call this method, it should call class's method `this.openSnackbar`. Or if translated to JavaScript
    
    ```
     openSnackbarExternal = this.openSnackbar;
    ```
    
3.  Third requirement: Let's remember to export `openSnackbarExternal`:
    
    ```
     export let openSnackbarExternal;
    ```
    

Put these three requirements together, remove the `<Button>` element, and you will get following content inside `book/2-begin/app/components/common/Notifier.tsx` file:

```
import Snackbar from '@material-ui/core/Snackbar';
import React from 'react';

let openSnackbarExternal;

type State = {
  open: boolean;
  message: string;
};

class Notifier extends React.PureComponent<any, State>  {
  constructor(props) {
    super(props);
    openSnackbarExternal = this.openSnackbar;

    this.state = {
      open: false,
      message: '',
    };
  }

  public render() {
    const message = (
      <span id="snackbar-message-id" dangerouslySetInnerHTML={{ __html: this.state.message }} />
    );

    return (
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        message={message}
        autoHideDuration={5000}
        onClose={this.handleSnackbarClose}
        open={this.state.open}
        ContentProps={{
          'aria-describedby': 'snackbar-message-id',
        }}
      />
    );
  }

  public handleSnackbarClose = () => {
    this.setState({
      open: false,
      message: '',
    });
  };

  public openSnackbar = ({ message }) => {
    this.setState({ open: true, message });
  };
}

export default Notifier;
```

Notice that we assigned a value to `openSnackbarExternal` inside the `constructor` method. This method is unique to JavaScript's class that allows you to initialize the class object (`this`) with certain initial values (parameters or methods):

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor)

For example initializing `poly1` with parameter `poly1.name`:

```
class Polygon {
  constructor() {
    this.name = "Polygon";
  }
}

const poly1 = new Polygon();

console.log(poly1.name);
// expected output: "Polygon"
```

In React, `constructor` is often used to set an initial value for state with `this.state = ...` and bind some methods to `this`. We use it for latter.

It is a requirement to call `super(props)` inside `constructor` so that `props` are not `undefined` inside `constructor`. If you don't, TypeScript will throw an error:

```
Constructors for derived classes must contain a 'super' call.
```

Our next step is to test if our outside-of-component `openSnackbarExternal` method works as expected. Our ultimate goal was to have the `Notifier` component added only once to the `Layout` HOC and then to import and call the `openSnackbarExternal` method on any page to control open state of already present `Notifier` component.

Open your `Index` page file at `book/2-begin/app/pages/index.tsx`. Import `openSnackbarExternal`, create a button, and bind the button's `onClick` method to the `openSnackbarExternal` function. Pass a value to the `message` argument:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';

import Link from 'next/link';

import Layout from '../components/layout';
import { openSnackbarExternal } from '../components/common/Notifier';

const Index = () => (
  <Layout firstGridItem={true}>
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
      <Button variant="contained" onClick={() => openSnackbarExternal({ message: 'some text' })}>
        Open Notifier
      </Button>
    </div>
  </Layout>
);

export default Index;
```

Start your project with `yarn dev`, go to `http://localhost:3000`, and click the `Open Notifier` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-22+12-39-54.png)

If you see a snackbar with the proper value of `message` - good job! You did it!

Before we move to the next subsection, let's make two improvements to the way we use the `Notifier` component:

1.  Let's move `Notifier` inside `Layout` from the first grid column:
    
    ```
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
         ...
       </div>
       <hr />
       <p />
       <p />
       <Notifier />
     </Grid>
    ```
    
    To under the second grid column, like this:
    
    ```
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
         ...
       </div>
       <hr />
       <p />
       <p />
     </Grid>
     <Grid item sm={10} xs={12}>
       {children}
     </Grid>
     <Notifier />
    ```
    
2.  For purely organizational reasons, let's create a `notify.ts` file at `book/2-begin/app/lib/notify.ts` with the following content:
    
    ```
     import { openSnackbarExternal } from '../components/common/Notifier';
    
     export default function notify(obj) {
       openSnackbarExternal({ message: obj.message || obj.toString() });
     }
    ```
    
    This will allow us to show `Notifier` with a simple call `notify('some text')` instead of `openSnackbarExternal({ message: 'some text' })`. Go ahead and update your `Index` page:
    
    ```
     import Button from '@material-ui/core/Button';
     import React from 'react';
     import Head from 'next/head';
    
     import Link from 'next/link';
    
     import Layout from '../components/layout';
     import notify from '../lib/notify';
    
     const Index = () => (
       <Layout firstGridItem={true}>
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
           <Button variant="contained" onClick={() => notify('some text')}>
             Open Notifier
           </Button>
         </div>
       </Layout>
     );
    
     export default Index;
    ```
    
    Start your project with `yarn dev`. Make sure the `Notifier` component works as expected.
    

Although it took a while to implement `Notifier`, the benefit is nice: `Notifier` is imported and used only once, inside `Layout`; and we can import and use the `notify` function on any pages that are wrapped by `Layout`.

___

#### Confirmer [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#confirmer)

The purpose of creating the `MenuWithLinks` component is to be able to quickly add a menu anywhere in your web application. The purpose of the `Notifier` component is to show informational success/error messages after a user takes an action. In this subsection, we discuss the `Confirmer` component that looks like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-22+13-26-00.png)

As you can see from the above snapshot, `Confirmer` asks a user to confirm an action. For example, when a user wants to make an action with significant consequences, for example, delete a Team Member or Discussion, unsubcribe from a paid plan, remove an account - we, as program's engineers, should show `Confirmer` to make sure that the user indeed wants to perform the action and did not click on the button by accident. In other words, we should show `Confirmer` for actions that are irreversible and consequential. It is up to you, as the web developer of your own project or business, to deem certain actions worthy of having `Confirmer`.

The most suitable component for creating `Confirmer` is Material-UI's `Dialog` (that works with `DialogActions`):

[https://material-ui.com/components/dialogs/#form-dialogs](https://material-ui.com/components/dialogs/#form-dialogs)

Here is an example from Material-UI's docs:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-22+13-11-42.png)

And here is code from the above link:

```
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default function FormDialog() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open form dialog
      </Button>
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
    </div>
  );
}
```

It is somewhat similar to `Notifier`. Again, there is `this.state.open` that controls whether the confirmation dialog is rendered open or closed, and there are buttons that a user clicks to change `this.state.open`. When a user clicks the `Open form dialog` button, the `this.state.open` property changes to `true` and the user sees the confirmation dialog. When a user clicks the `Cancel` button, the `open` parameter inside the `state` object changes to `false` and the confirmation dialog renders with `this.state.open` with value of `false`, it renders in closed state.

Open `book/2-begin/app/components/common/Notifier.tsx` and see how we just implemented our `Notifier` component. The `Confirmer` component will be very similar with only a few changes that we discuss below.

API method calls corresponding store method Navigate to this chapter redirect to checkout Next.js web application check if value is truthy Click on the button if truthy then discussion conditional operator response Material-UI. Discussion compiles Navigate to Team Leader Put it all together server-side rendering API method calls corresponding store method static method calls subsection Click on the button in production At AWS dashboard API infrastructure data model if truthy then. AWS dashboard Navigate to if truthy then decorate method with action S3 bucket. Put it all together store method calls Put it all together At AWS dashboard Click on the button subsection cookie S3 bucket in this book S3 bucket if truthy then. You already learned check if value is truthy it works as expected show notification Put it all together store method calls Navigate to cookie session Material-UI store method calls. WithAuth HOC list of posts new Express route list of posts Navigate to Material-UI. Production-ready team members response API method open this file API infrastructure Google OAuth API static method calls request was sent. Page component in production MongoDB database decorate method with action check if value is truthy team members At AWS dashboard discussion new Express route S3 bucket AWS dashboard on server only Next.js web application MongoDB database decorate method with action. Navigate to S3 bucket in this book S3 bucket Google OAuth API production-ready cookie. Email and name cookie on server only Remember to add import list of posts list of posts Remember to add import Next.js web application data model API method calls corresponding store method send this response in this book list of posts Team Leader.

Create a new file `book/2-begin/app/components/common/Confirmer.tsx` with the following content:

```
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';

export let openConfirmDialogExternal;

type State = {
  open: boolean;
  title: string;
  message: string;
  onAnswer: (answer) => void;
};

class Confirmer extends React.Component<any, State> {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      title: 'Are you sure?',
      message: '',
      onAnswer: null,
    };

    openConfirmDialogExternal = this.openConfirmDialog;
  }

  public render() {
    return (
      <Dialog
        open={this.state.open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{this.state.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{this.state.message}</DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: '10px' }}>
          <Button onClick={this.handleClose} variant="contained" color="primary" autoFocus>
            Cancel
          </Button>
          <Button onClick={this.handleYes} variant="contained" color="secondary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  public handleClose = () => {
    this.setState({ open: false });
    this.state.onAnswer(false);
  };

  public handleYes = () => {
    this.setState({ open: false });
    this.state.onAnswer(true);
  };

  public openConfirmDialog = ({ title, message, onAnswer }) => {
    this.setState({ open: true, title, message, onAnswer });
  };
}

export default Confirmer;
```

As you can see, the only differences between `Notifier` and `Confirmer` are:

-   Intead of `Snackbar` component, we use `Dialog`, `DialogTitle`, `DialogContent`, and `DialogActions`.
-   Intead of just one `message` argument that we pass to `this.openSnackbar` function, we pass three: `title`, `message`, `onAnswer`. We pass them to component's method `openConfirmDialog` method as arguments. The method `openConfirmDialogExternal` plays the same role as `openSnackbarExternal`. We need some method **outside** of component to trigger internal component's method.
-   Clicking both buttons `OK` and `Cancel` set `this.state.open` to `false`. In other words, clicking either button will result in a closed confirmation dialog.
-   The function `onAnswer` takes one boolean argument. If a user clicks the `OK` button, we pass the `true` as an argument. If a user clicks the `Cancel` button, we pass the `false` as an argument. Below you will see why we designed this function this way. We specified initial values for `title`, `message` and `onAswer`. We will pass the actual values of `title`, `message` and `onAnswer` from our page to `Confirmer` component.

Import and add the `Confirmer` component right under the `Notifier` component inside `Layout` at `book/2-begin/app/components/layout/index.tsx` like so:

```
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
    ...
  </div>
  <hr />
  <p />
  <p />
</Grid>
<Grid item sm={10} xs={12}>
  {children}
</Grid>
<Notifier />
<Confirmer />
```

Next, for the sake of organization and being consistent, let's create a `confirm` method similarly to how we created `notify` method. Create a `book/2-begin/app/lib/confirm.ts` file with the following content:

```
import { openConfirmDialogExternal } from '../components/common/Confirmer';

export default function confirm({
  title,
  message,
  onAnswer,
}: {
  title: string;
  message: string;
  onAnswer: (answer) => void;
}) {
  openConfirmDialogExternal({ title, message, onAnswer });
}
```

As you can see `openConfirmDialogExternal` method has the same arguments as `openConfirmDialog` method, as it should.

Import the `confirm` method to your `Index` page and define the `onAswer` function inside `book/2-begin/app/pages/index.tsx`:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '../components/layout';
import NProgress from 'nprogress';

import confirm from '../lib/confirm';
import notify from '../lib/notify';

const Index = () => (
  <Layout firstGridItem={true}>
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

              try {
                notify('You successfully confirmed.');
              } catch (error) {
                console.error(error);
                notify(error);
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

export default Index;
```

Let's take a closer look at the `onAswer` function:

```
onAnswer: async (answer) => {
  console.log(answer);

  if (!answer) {
    return;
  }

  try {
    notify('You successfully confirmed.');
  } catch (error) {
    console.error(error);
    notify(error);
  }
},
```

Logic of this function is as follows:

-   When a user clicks the `Cancel` button, `answer` is `false` and `!answer` is `true` and the try/catch block does **not** run, code does not run pass `return;`.
-   When a user clicks the `OK` button, `answer` is `true` and `!answer` is `false` and the try/catch block does run.

Note that we added `console.log(answer);` to see its value printed in the browser console and to confirm that our code works as expected.

We also used a `try/catch` block inside the definition of `onAnswer`. Check up Mozilla's docs about `try/catch/finally`:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)

Whatever is in the `try` block will run as follows:

-   if the code inside `try` returns no error, ignore the `catch` block and execute the `finally` block
-   if the code inside `try` returns error, ignore the rest of the `try` block, execute the `catch` block, then execute the `finally` block

We haven't used `finally` in the above block, but we will add a `finally` block when we discuss our `Nprogress` loading bar, later in this chapter.

Currently, there is nothing inside `try` block except `notify` method. Typically, we will have an API method there that perform some CRUD operation with data. For example, delete Discussion from the connected database and from the browser.

We are ready to test our new component `Confirmer`!

Start your project with `yarn dev` and navigate to `http://localhost:3000`.

Click the `Test Confirmer and Notifier` button. Watch the output printed in your browser console using `Chrome Dev Tools > Console`.

Click the `Cancel` button on the confirmation dialog:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-22+15-05-16.png)

Reload the page. Click `Test Confirmer and Notifier` again. Click the `OK` button on the confirmation dialog:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-22+15-05-34.png)

If what you see matches the above screenshots, then your code works properly.

Good job!

___

## Nprogress [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#nprogress)

In the above subsection, we discussed a `try/catch` block:

```
try {
  notify('You successfully confirmed.');
} catch (error) {
  console.error(error);
  notify(error);
}
```

We discussed how this construct works already and we will use this construct tmany times throughout the book. `try/catch` can run on both browser and server. For both server-side and client-side rendered pages, we will call asynchronous API method inside `try` block of `try/catch` construct (to CRUD data from our database). On the server only, we will use `try/catch` inside so called Express routes (also called Express handlers) that we will discuss later in this book.

The CRUDing of data, for example, fetching list of posts for discussion page, is not instantaneous. There is no need to show progress on the server but there should be some way to show progress on the browser. In other words, since data retrieval is not instant, we, as web application's engineers, need to show end users some indicator of progress. This indicator will assure the user that the request has been sent, and the user has to wait for data to fetch.

One good option for an indicator of progress is Nprogress:

[https://ricostacruz.com/nprogress/](https://ricostacruz.com/nprogress/)

Go to the above website. Click `NProgress.start()` to start the progress bar, and then click `NProgress.done()` to end the progress bar.

Setting up `Nprogress` is straightforward. Import `NProgress` to the `Index` page and add `NProgress.start()` when you want to start the progress bar. Add `NProgress.done()` when you want to end the progress bar.

```
NProgress.start();

try {
  notify('You successfully confirmed.');
  NProgress.done();
} catch (error) {
  console.error(error);
  notify(error);
  NProgress.done();
}
```

Here, we start the progress bar before we run any code in the `try` block (this is where we call a method that sends a request to our server). We end the progress bar either at the end of the `try` block or at the end of the `catch` block. We can further simplify the above code snippet since we know about the `finally` block:

```
NProgress.start();

try {
  notify('You successfully confirmed.');
} catch (error) {
  console.error(error);
  notify(error);
} finally {
  NProgress.done();
}
```

Function-wise, this code snippet achieves exactly the same as the code snippet above it. But it is easier to read and write than the former snippet.

Open `book/2-begin/app/pages/index.tsx` file and make the changes that we just discussed:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '../components/layout';
import NProgress from 'nprogress';

import confirm from '../lib/confirm';
import notify from '../lib/notify';

const Index = () => (
  <Layout firstGridItem={true}>
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

export default Index;
```

Start your project with `yarn dev`, navigate to `http://localhost:3000`, and click the `Test Confirmer and Notifier` button. Then click `OK` on the confirmation dialog. Look for the progress bar at the top border of the page and browser:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-24+11-05-03.png)

Earlier in this chapter, we showed that you can add styles for the NProgress bar in `_document.tsx`. Because we want both server-side and client-side rendered pages to show the correct style for the NProgress bar, we should put the NProgress bar style in our `MyApp` HOC extension.

Go to your `_app.tsx` file and modify the `<Head>` tag like so:

```
...
  <Head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://storage.googleapis.com/async-await/nprogress-dark.min.css?v=1"
    />
  </Head>
...
```

___

## Mobile browser [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#mobile-browser)

This is the last section of Chapter 2.

Some internet users will access your web app on their mobile browser. 10-15 years ago, you would design a page to look good on the desktop browser and that's it, you were done. Nowadays, you have to make sure that **both** desktop and mobile browser users have proper layouts and styles.

We know that layout and styles look good on a desktop browser since we, as web developers, use a desktop browser for development. Before we do anything to address the issue of mobile browsers, let's see how our `Index` page looks like on a mobile browser at this point. If using Chrome, access `Chrome Dev Tools` (press `Ctrl + Shift + J`) and then click on the `phone + tablet` icon (or press `Ctrl + Shift + M`). If you do it right, you will see a new toolbar on the top of the page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-24+11-16-13.png)

In the first dropdown of this toolbar, you can see a default selection `Responsive`. Change it to be `IPhone X`. Once you change it, you will see how your web page looks on IPhone X:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-24+11-41-22.png)

Not bad! And that's the advantage of using a library like Material-UI and `Grid` component in particular. The page's layout has 2 grid columns rendered next to each other on the desktop browser, but Material-UI automatically stacks these 2 grid columns on each other on the mobile browser. And it looks good.

However, as our pages get more complicated, we will need to decide what elements to reorganize or, perhaps, hide on the mobile browser, since we have very little space on mobile browser.

We need someway to figure if user's browser is mobile and if so pass new boolean prop with value `true` value. Let's call it `isMobile`. Once value of `isMobile` is available on the page, we can use it to control styles on the page. We can add **conditional** styles that have different value depending on value of `isMobile` prop.

Let's outline all tasks we need to complete to be able to add mobile vs desktop conditional style:

-   Figure out how to detect if user's browser is indeed mobile, then assign `true` as value to `isMobile`, if browser is desktop - assign `false` value.
-   Add `isMobile` prop to all pages via `App` HOC, by populating it inside `MyApp.getInitialProps` method.
-   Access and use `isMobile` from page's props, create conditional styles on the page. Pass `isMobile` from page component to `Layout` component.
-   Access and use `isMobile` from component's props, create conditional styles.

___

How to reliably detect if browser is indeed mobile browser?

When the browser renders a page, we can use something like `window.innerWidth` or `window.screen.width`, which is accessible via `Window` interface:

[https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth](https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth)

[https://developer.mozilla.org/en-US/docs/Web/API/Screen/width](https://developer.mozilla.org/en-US/docs/Web/API/Screen/width)

But `window` is `undefined` on the server. That means we will have a flash of style for server-side rendered pages. A flash of style is poor UX, so we need to find a solution that works for both client-side and server-side rendered pages.

One solution is to take the request, `req`, that a user's browser sends to our server for server-side rendered pages and look into the request's headers, `req.headers`. We can check the value of one particular header, User-Agent, by accessing it with `req.headers['user-agent']`

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent)

The User-Agent header will have all information about browser in format:

```
User-Agent: Mozilla/5.0 (<system-information>) <platform> (<platform-details>) <extensions>
```

If User-Agent, for example, contains the string `IPhone OS`, then we know for sure that a user accessed our web app via mobile browser from IPhone device.

It works as expected Put it all together email and name API method session API infrastructure send this response send this response production-ready page component team members. Store method calls MongoDB database conditional operator Next.js web application on server only static method calls page component MongoDB database Put it all together At AWS dashboard AWS dashboard check if value is truthy. Store method calls Put it all together show notification request add environmental variable it works as expected At AWS dashboard HTTP mount middleware conditional operator API method. Send this response add environmental variable email and name this chapter mount middleware Navigate to new Express route if truthy then S3 bucket. Static method calls Next.js web application compiles response decorate method with action. HTTP Team Leader team members Remember to add import Team Leader You already learned on the client new Express route response Navigate to new Express route S3 bucket. Page component You already learned production-ready Put it all together API method calls corresponding store method Team Leader it works as expected API method. Conditional operator in a browser response MongoDB database mount middleware static method calls on server only on the client cookie API method calls corresponding store method. Remember to add import withAuth HOC static method calls if truthy then redirect to checkout server-side rendering Put it all together request was sent email and name server-side rendering Next.js web application static method calls if truthy then send this response. Cookie discussion team members server-side rendering compiles if truthy then show notification MongoDB database request check if value is truthy conditional operator if truthy then.

For example, after I set view to `iPhone X` on my browser, my `User-Agent` header has value:

```
Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1
```

We can create an `isMobile` method and define it in the new file `book/2-begin/app/lib/isMobile.ts` to ensure that it is available on both the server and the browser. This method will take an object, `opts`, as an argument. `opts` will contain request, `req`, that a user's browser sends. Inside this `isMobile` method, we will look at the value of `ua = opts.req.headers['user-agent']` and test if this value matches any value from the long string `mobileRE` that contains all values for mobile browsers.

To test for match, we can simply use the JavaScripts `test` method:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/RegExp/test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)

Let's make `isMobile(opts)` to return `true` if there is a match. We can make `isMobile(opts)` return `mobileRE.test(ua)`, since this expression will be evaluated `true` if there is a match.

Put it all together into new file `book/2-begin/app/lib/isMobile.ts`:

```
const mobileRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;

export function isMobile(opts) {
  if (!opts) {
    opts = {};
  }

  let ua = opts.ua;

  if (!ua && typeof navigator !== 'undefined') {
    ua = navigator.userAgent;
  }

  if (!ua && opts.req && opts.req.headers && typeof opts.req.headers['user-agent'] === 'string') {
    ua = opts.req.headers['user-agent'];
    console.log(ua);
  }

  if (typeof ua !== 'string') {
    return false;
  }

  return mobileRE.test(ua);
}
```

How do we add `isMobile` to all pages? One way is to add call `getInitialProps` method on every page, explicitly: For every page in our web app, we can write something like this:

```
public static async getInitialProps({ ctx }) {
  const pageProps = { isMobile: isMobile({ req: ctx.req }) };
  return { pageProps };
}
```

But this would be tedious. Easier way would be is to add `isMobile` inside HOC and call `getInitialProps` method inside that HOC. Let's do it inside `App` HOC by defining `MyApp.getInitalProps` method. Open our `book/2-begin/app/pages/_app.tsx` and add the `getInitialProps` method that we discussed earlier in this chapter, like this:

```
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import App from 'next/app';
import Head from 'next/head';
import React from 'react';
import { isMobile } from '../lib/isMobile';
import { themeDark, themeLight } from '../lib/theme';

class MyApp extends App<{ isMobile: boolean }> {
  public static async getInitialProps({ Component, ctx }) {
    const pageProps = { isMobile: isMobile({ req: ctx.req }), firstGridItem: true };

    if (Component.getInitialProps) {
      Object.assign(pageProps, await Component.getInitialProps(ctx));
    }

    console.log(pageProps);

    return { pageProps };
  }

  public componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  }
  public render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={false ? themeDark : themeLight}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link
            rel="stylesheet"
            href="https://storage.googleapis.com/async-await/nprogress-dark.min.css?v=1"
          />
        </Head>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}

export default MyApp;
```

You probably noticed this code block:

```
  if (Component.getInitialProps) {
    Object.assign(pageProps, await Component.getInitialProps(ctx));
  }
```

This says that if our page component `Component` has the `getInitialProps` method, then we will create a new object with `Object.assign` ([https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Object/assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)) that contains parameters from the `pageProps` object and props returned by `await Component.getInitialProps(ctx)`. In other words, if you use the `getInitialProps` method on, say, the `Index` page, whatever page's props you got from that method on the page will be combined with `pageProps` props (`isMobile` and `firstGridItem`).

We also printed the `pageProps` object with `console.log(pageProps);`.

Let's see where we are in terms of tasks:

-   (done) Figure out how to detect if user's browser is indeed mobile, then assign `true` as value to `isMobile`, if browser is desktop - assign `false` value.
-   (done) Add `isMobile` prop to all pages via `App` HOC, by populating it inside `MyApp.getInitialProps` method.
-   (not done) Access and use `isMobile` from page's props, create conditional styles on the page. Pass `isMobile` from page component to `Layout` component.
-   (not done) Access and use `isMobile` from component's props, create conditional styles.

Let's access `isMobile` and `firstGridItem` props on `Index` page, pass them to `Layout` component, and access and use them inside `Layout` component.

Before we can test out our `isMobile(opts)` function on the `Index` page, we need to modify this page, since it has a hardcoded `isMobile` prop on the `Layout` HOC. Open `book/2-begin/app/pages/index.tsx`:

Inside `Index` page, we want to pass `props` that are calculated by `isMobile` method and populated by the `App` HOC:

```
<Layout firstGridItem={this.props.firstGridItem} isMobile={this.props.isMobile}>
```

Shorter version using `spread operator`([https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread\_syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)) that iterates through all parameters of `this.props` object will be:

```
<Layout {...this.props}>
```

Since `this` and `this.props` does not exist for `const Index` page, we need to rewrite the page as ES6 class, as a derived class of parent class `React.Component`:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '../components/layout';
import NProgress from 'nprogress';

import confirm from '../lib/confirm';
import notify from '../lib/notify';

class Index extends React.Component {
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

Next, open `Layout` component, file `book/2-begin/app/components/layout/index.tsx`), and update it to become:

```
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import React from 'react';
import MenuWithLinks from '../common/MenuWithLinks';
import Confirmer from '../common/Confirmer';
import Notifier from '../common/Notifier';

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

type Props = {
  children: React.ReactNode;
  firstGridItem?: boolean;
  isMobile?: boolean;
};

class Layout extends React.Component<Props> {
  public render() {
    const { children, firstGridItem, isMobile } = this.props;

    const isThemeDark = false;

    console.log(isMobile);

    return (
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
                    href: '/logout',
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
        <Grid item sm={10} xs={12}>
          {isMobile ? <hr /> : null}
          {children}
        </Grid>
        <Notifier />
        <Confirmer />
      </Grid>
    );
  }
}

export default Layout;
```

Here is what we did:

-   We added `isMobile` to `Props` and specified the data type:
    
    ```
      type Props = {
        children: React.ReactNode;
        firstGridItem?: boolean;
        isMobile?: boolean;
      };
    ```
    
    The question mark at the end of `isMobile?` means this `prop` is optional and not required. If it does not exist, the web application will not throw an error.
    
-   We accessed the `isMobile` value from `this.props.isMobile`:
    
    ```
      const { children, firstGridItem, isMobile } = this.props;
    ```
    
-   We printed the value so we can verify it in the browser console:
    
    ```
      console.log(isMobile);
    ```
    
-   We created a new style called `styleGridIsMobile` and passed it to the parent `<Grid>` component with conditional operator `style={isMobile ? styleGridIsMobile : styleGrid}`, or what we called "adding conditional style" earlier in this section.
    
-   We conditionally added a horizontal separator with:
    
    ```
      {isMobile ? <hr /> : null}
    ```
    

Start your project with `yarn dev`, go to `http://localhost:3000`, and set the view to `IPhone X`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-24+12-06-45.png)

As you can see, we have a slightly better looking page now. The width is 100%, and there is a clear separator between two stacked grid cloumns.

Look at your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-24+13-53-19.png)

You should see the following values:

-   `User-Agent` (`console.log(ua)` from `book/2-begin/app/lib/isMobile.ts`)
-   `pageProps` (`console.log(pageProps)` from `book/2-begin/pages/_app.tsx`)
-   `isMobile` (`console.log(isMobile)` from `book/2-begin/app/components/layout/index.tsx`)

Go back to the browser and close `Chrome Dev Tools` to return to the desktop view.

Refresh the tab and look at your terminal again:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-2/Screenshot+from+2019-12-24+13-58-36.png)

As you can see, the `isMobile` value changed to `false` - desktop browser!

And `User-Agent` does not contain the `IPhone X` string anymore!

This is the end of Chapter 2.

If you followed steps described in this chapter closely, your codebase should match the codebase located at `book/2-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___