In Chapter 1, you will start with the codebase in the [1-begin folder](https://github.com/async-labs/saas/tree/master/book/1-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [1-end folder](https://github.com/async-labs/saas/tree/master/book/1-end).

We will cover the following topics in this chapter:

-   Setup  
    
    -   GitHub and Git
    -   Visual Studio code editor
    -   Node, Yarn
    -   package.json
    -   TypeScript
    -   ESLint, Prettier
-   Next.js  
    
    -   Server-side rendering
    -   Project structure
    -   Extension for Document HOC
    -   Extension for App HOC
    -   Index page
-   Testing  
    
-   Environmental variables  
    

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

As you learned from the Introduction chapter, this book assumes a basic understanding of JavaScript, React, Next.js, and Express. Although we will have occasional detours to discuss important concepts, we will make fewer detours compared to our first book. If you are new to concepts such as HTTP, Promise, syntactic sugar async/await, server-side rendering, MongoDB index - you should read our first book, [Builder Book](https://builderbook.org/books/builder-book/introduction).

In the Introduction chapter, we discussed our motivation to write this book and showed you a final structure of the project you will build in this book. You may have noticed from the [project's structure](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#project-structure) that the final project is made of two projects: `app` and `api`.

The `app` project has code that can run on both browser and server (code inside `pages`) and code that runs only on the server (code inside `server`), which is made of a Next-Express server whose main purpose is to either (1) send JSON data to the browser for a client-side rendered page or (2) send a server-side rendered page. The server from `app` sends most of its requests for data to the `api` server.

`api` has server-only code and is made of an Express server that contains all internal and external APIs - for example, an API to display a list of Posts or an API for Google OAuth. The `app` server sends requests for data to the `api` server, and the `api` server sends data to a MongoDB server to CRUD that data in a MongoDB database.

In this setup, page requests that come to the `app` server or browser do not block requests to the `api` server (user authentication, processing payments, sending transactional emails, CRUDing data in database). And vice versa - requests that come to `api` don't block page requests to `app`. We will discuss this architecture in more detail in Chapter 3, where we introduce the `api` project. We will also discuss a `lambda` project in more detail in Chapter 9.

In Chapter 1, our sole focus is to set up the `app` project. We will not write much code, but we will discuss and create many configurations and configuration files. Please see the table of contents for this chapter. You can always find the table of contents on the left sticky panel or at the top of each chapter.

___

## Setup [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#setup)

Similar to our first book, we work on Ubuntu 18.04.3 LTS. All installation instructions in this book should work on Ubuntu 18.04.3 LTS, Ubuntu 20.04.1 LTS, and most Linux-based operating systems (Debian). Most instructions will work on MacOS as well. You have to do your own research if you work on Windows. We make no promise to have instructions for Windows-based operating systems.

You can download Ubuntu 18.04.3 LTS from:

[https://ubuntu.com/download/desktop](https://ubuntu.com/download/desktop)

Instructions on installing it to your machine:

[https://www.linuxtechi.com/ubuntu-18-04-lts-desktop-installation-guide-screenshots/](https://www.linuxtechi.com/ubuntu-18-04-lts-desktop-installation-guide-screenshots/)

___

#### GitHub and Git [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#github-and-git)

If you bought our first book, you know that we make the entire codebase for our book public on GitHub. For this book, the codebase is hosted in our public repo `saas`:

[https://github.com/async-labs/saas/tree/master/book](https://github.com/async-labs/saas/tree/master/book)

As you can see, every chapter has two folders: one with the suffix `-begin`, one with the suffix `-end`.

Every chapter in the book guides you from the `N-begin` codebase to `N-end` codebase. For example, in this chapter we will start with `1-begin` and end up with `1-end`. The `1-end` codebase is identical to the `2-begin` codebase, and the `2-end` codebase is identical to the `3-begin` codebase, etc.

After you succesfully install Ubuntu, press `Ctrl+Alt+T` to start a new terminal window.

Inside your terminal, navigate to the folder on your computer where you want to save all chapters' folders. Navigate between directories using `cd folderName` or `cd ..`.

To copy the entire `saas` repo from GitHub, you have to run a [Git command](https://git-scm.com/docs/git-clone) inside your terminal:

`git clone https://github.com/async-labs/saas.git`

Check if value is truthy data model response AWS dashboard API method Click on the button store method calls. Click on the button Next.js web application We will discuss open this file subsection withAuth HOC end user data model compiles compiles email and name email and name Click on the button on server only. Response end user in a browser mount middleware add environmental variable page component send this response compiles team members. Server-side rendering Remember to add import triggers method production-ready Google OAuth API cookie discussion on server only compiles mount middleware Google OAuth API discussion compiles S3 bucket. It works as expected page component store method calls production-ready compiles. API method calls corresponding store method list of posts response send this response store method calls. Server-side rendering server-side rendering Put it all together email and name response API method calls corresponding store method on server only session API method request response Google OAuth API We will discuss. Google OAuth API end user data model decorate method with action MongoDB database request Put it all together add environmental variable HTTP API infrastructure. Request We will discuss this chapter session discussion data model new Express route session if truthy then decorate method with action HTTP on the client show notification mount middleware. Request if truthy then API method this chapter At AWS dashboard You already learned it works as expected HTTP response check if value is truthy this chapter Google OAuth API.

Navigate to the cloned folder. In your terminal, you can type `cd book/1-begin`. As you can see, since this is the very beginning of our journey, this folder is nearly empty. It contains only one file, `.gitignore`.

___

#### Visual Studio code editor [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#visual-studio-code-editor)

At this point, you have installed Ubuntu, used the terminal, and used GitHub and Git to copy the book's codebase to your local machine.

The next step is to install a code editor on your local machine. Over years of writing software, we found Visual Studio code editor ([https://code.visualstudio.com](https://code.visualstudio.com/)) to be a good choice, for now.

Follow these instructions to install VS code editor on your operating system:

[https://code.visualstudio.com/docs/setup/linux](https://code.visualstudio.com/docs/setup/linux)

We use version 1.52.1 as of writing of this book.

Once installed, open the code editor:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-11-03+09-34-36.png)

VS code editor has User and Workspace settings:

-   You can modify any of the settings for _all_ projects opened with the code editor using the User settings. These settings are specific to your machine.
-   You can modify _project_ settings using the Workspace settings. Workspace settings overwrite User settings for a particular project (narrower settings overwrite global settings). These settings are specific to a project.

Read more about settings here:

[https://code.visualstudio.com/docs/getstarted/settings](https://code.visualstudio.com/docs/getstarted/settings)

Let's edit some of our Workspace settings. Open the `saas` folder with your code editor. Then go to `File (or Code) > Preferences > Settings`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-11-03+09-38-24.png)

Select the tab that says `Workspace`. Scroll through the list of different settings and you can, for example, set up the following configs:

```
{
"window.zoomLevel": 0,
"files.autoSave": "afterDelay",
"git.enableSmartCommit": true,
"editor.formatOnSave": true,
}
```

The first setting controls the zoom level of your window. You can also adjust it on-the-go by pressing `Ctrl+` or `Ctrl-`.

The second setting allows you to automatically save files after you modify them, without manually clicking `Ctrl + S`.

The third setting commits changes automatically if there are no staged changes.

The last setting allows the editor to automaticallty format code on every save event. Later on, when you press `Ctrl+S`, the code editor will apply TSLint formatting to the code.

After you modify these settings, your Workspace settings will be saved to the root of the `saas` folder inside `.vscode/settings.json`. You can open the `.vscode/settings.json` file to see all Workspaces we provided you.

You can find explanations for all settings inside this `.vscode/settings.json` file:

[https://code.visualstudio.com/docs/getstarted/settings#\_default-settings](https://code.visualstudio.com/docs/getstarted/settings#_default-settings)

[https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

We will discuss the `dbaeumer.vscode-eslint` extension for VS code editor later in this chapter.

___

#### Node, Yarn [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#node-yarn)

Both `app` and `api` are [Node.js](https://nodejs.org/) projects. All third-party packages (also called libraries) are built for Node projects.

We recommend using `nvm` ([https://github.com/creationix/nvm](https://github.com/creationix/nvm)) (Node Version Manager) for installing Node and managing its version.

On Ubuntu, press `Ctrl+Alt+T` to open your terminal (alternatively, use the search bar to search for terminal).

-   Run the command below to install nvm:
    
    ```
      curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
    ```
    
-   Check the nvm version to confirm successful installation:
    
    ```
      nvm --version
    ```
    
-   Trigger nvm:
    
    ```
      . ~/.nvm/nvm.sh
    ```
    
-   Install Node 18.17.0:
    
    ```
      nvm install 18.17.0
    ```
    
-   Make it default:
    
    ```
      nvm alias default 18.17.0
    ```
    
-   Check Node version to confirm successful installation:
    
    ```
      node -v
    ```
    

Node version, as of writing this book, is 18.17.0.

Once Node is installed, we can install Yarn, a manager for third-party packages (also called dependencies or libraries). Whenever we need to use code developed by other developers, we add the package name and version to a `package.json` file (or you can run `yarn add packageName@packageVersion`) and run `yarn` in the project's directory. More on `package.json` in the next section.

Throughout this book, we are using `yarn` instead of `npm` package manager.

Install Yarn on Ubuntu as follows:

-   Configure the Debian package repository for Yarn ([https://yarnpkg.com/en/docs/install#linux-tab](https://yarnpkg.com/en/docs/install#linux-tab)) by running the following two commands in your terminal:
    
    ```
      curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
      echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    ```
    
-   Then install Yarn with:
    
    ```
      sudo apt-get update && sudo apt-get install yarn
    ```
    
-   Check Yarn version to confirm successful installation:
    
    ```
      yarn -v
    ```
    

If you're using another operating system, find specific instructions [here](https://yarnpkg.com/en/docs/install) on Yarn's official website. Select your operating system from the "Operating system" dropdown menu.

In this book, the Yarn version is `1.22.5`.

At this point, you have Node and Yarn installed on your local machine. Now we can create a Node project by defining a `package.json` file and installing third-party dependencies defined inside the `package.json` file using Yarn.

In this book, the Node version is `18.17.0` and Yarn version is `1.22.5`.

___

#### package.json [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#package-json)

As mentioned earlier in this chapter, the final app will consist of `app`, `api`, and `lambda` projects. We discuss `app` project setup in this chapter, `api` project in Chapter 3, and `lambda` project in Chapter 9.

All three projects are Node projects. Every Node project requires a configuration file: `package.json`. Learn about this file's metadata from the official docs:

[https://docs.npmjs.com/getting-started/using-a-package.json](https://docs.npmjs.com/getting-started/using-a-package.json)

On your VS code editor, open the cloned `saas` repo, navigate to the `book/1-begin` folder, create an `app` folder and inside it, create a `package.json` file.

`package.json` should contain the project's metadata such as:

-   name,
-   version,
-   scripts
-   dependenices (described by name and version), among many other required and optional properties.

Some metadata is required and some are optional. The parameters `keywords` and `license` are optional, while parameters `name` and `version` are required.

Open your newly created `package.json` file and add the following content to it:

```
{
  "name": "1-end-app",
  "version": "1",
  "license": "MIT",
  "scripts": {
    "dev": "next",
    "build": "next build && tsc --project tsconfig.server.json",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "next": "^14.0.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.1",
    "@types/react": "^18.2.39",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.13.1",
    "@typescript-eslint/parser": "^6.13.1",
    "eslint": "^8.54.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.1",
    "eslint-plugin-react": "^7.33.2",
    "prettier": "^3.1.0"
  }
}
```

You can see required metadata like `name` and `version` (version has a format of `major.minor.patch`).

The `dependencies` section contains a list of third-party packages that we need in production _and_ development environments. To install all packages from `package.json`, simply run `yarn` in your terminal while inside the `app` directory.

The `devDependencies` section contains dependencies that our app uses in development but _not_ in production. Typically, developers use packages in `devDependencies` to run tests, compile code, or lint code locally. Useful locally but not required in production.

If you see no `^` (caret) and no `~` (tilde) in front of the `major.minor.patch` version number, then when you run `Yarn` or `Npm`, you will install an exact version of the package.

However, if you use `^1.0.0` instead of `1.0.0`, then if a version with a higher `minor` number is available, you may install `1.1.0` instead of `1.0.0`.

If you use `~1.0.0` instead of `1.0.0`, then if a version with a higher `patch` number is available, you may install `1.0.1` instead of `1.0.0`.

To check if Yarn successfully installed the packages, check the autogenerated `node_modules` folder or `yarn.lock` lockfile at the project's root directory. The former folder contains the code of third-party packages, and the latter file contains the exact versions of packages (direct) and packages they depend on (indirect).

The section of `package.json` called `scripts` contains shortcuts for commands. At the end of this book, in Chapter 10, the `scripts` section will contain the following command:

```
"build": "next build && tsc --project tsconfig.server.json"
```

You can see that it's much easier to type `yarn build` in your terminal window than `yarn next build && tsc --project tsconfig.server.json`. Thus, scripts are essentially shortcuts for commands.

In this chapter, the commands are still short enough that shortcuts are not as useful, but they will become more useful as you make progress in this book.

We will discuss the `dev` and `build` scripts later in this chapter.

We can also prepend any command with a so-called environmental variable, for example:

```
"build": " NODE_ENV=production next build && tsc --project tsconfig.server.json"
```

But it is better not to store environmental variables (which are typically secret) in `package.json`. More about environmental variables later in this chapter.

Run the `yarn` command inside the `1-begin/app` folder, and you will see a newly generated `node_modules` folder and `yarn.lock` file. You successfully installed all packages we need for Chapter 1. We will discuss each installed package as we go.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-16+14-13-58.png)

___

#### TypeScript [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#typescript)

AWS dashboard cookie in production withAuth HOC email and name response send this response AWS dashboard. Send this response compiles S3 bucket page component triggers method. Triggers method store method calls response production-ready request data model add environmental variable We will discuss HTTP list of posts S3 bucket. Request You already learned on the client Google OAuth API redirect to checkout response MongoDB database redirect to checkout team members new Express route S3 bucket Click on the button send this response. Click on the button API method Next.js web application decorate method with action in this book email and name S3 bucket MongoDB database Next.js web application You already learned You already learned Click on the button static method calls mount middleware. In this book request was sent Material-UI triggers method cookie in a browser it works as expected Navigate to page component compiles email and name page component cookie Next.js web application. Cookie cookie S3 bucket request end user You already learned withAuth HOC add environmental variable Team Leader redirect to checkout Remember to add import request check if value is truthy. API method calls corresponding store method on the client end user conditional operator store method calls subsection session Next.js web application server-side rendering check if value is truthy session redirect to checkout. Navigate to cookie response Put it all together check if value is truthy. List of posts on the client team members mount middleware send this response.

JavaScript is a weakly typed language. This means that, in most cases, JavaScript executes code without checking data types.

For example, open the browser console on Chrome or Mozilla. On Chrome, go to `Chrome Dev Tools` by pressing `Ctrl + Shift + I`. Then click `Console`. Type "1" + 2 and you will get the answer "12":

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-12+10-31-32.png)

You added a `string` to a `number`, and you got a `string` back. As you can see, JavaScript ran code without checking for type. Moreover, JavaScript did not throw a type error. This demonstrates that JavaScript is a weakly typed language.

The problem with weakly typed or untyped languages is that it's harder to debug code. Your code may get different types of data from different sources and try, for example, to find a sum of two incompatible types of data.

TypeScript ([http://www.typescriptlang.org/index.html](http://www.typescriptlang.org/index.html)) is a superset of JavaScript that compiles into plain JavaScript. Check this website to see how TypeScript (TS) compiles into JavaScript (JS):

[http://www.typescriptlang.org/play/](http://www.typescriptlang.org/play/)

TS is a strongly typed language. It checks for types during compilation into plain JS. For example, if your code tries to find a sum of a `string` and a `number`, then TS will throw a type error.

Since a typical web application with a lot of business logic has extensive data manipulation - debugging such code is laborious. Without checking for types, one can easily spend an extra few hours on every bug related to wrong data type.

In our first book, we wrote code using plain JS. The codebase in this book is significantly larger; thus, we decided to use TS instead of JS. The benefits of TS may not be obvious for smaller web applications, but most real-life SaaS products are large enough to see a benefit from using TS. We also use TS for any project that is big enough to justify usage of TS instead of JS.

You already installed the `typescript` dependency if you followed the instructions in the previous subsection `package.json`. Check up the `dependencies` section of `package.json` file that you created in the previous subsection.

We can specify rules on how TS should be compiled into JS. These rules are listed in a `tsconfig.json` file. Go to `book/1-begin/app` and create `tsconfig.json` with following content:

```
{
  "compileOnSave": false,
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "jsx": "preserve",
    "allowJs": true,
    "alwaysStrict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "removeComments": true,
    "preserveConstEnums": true,
    "sourceMap": false,
    "skipLibCheck": true,
    "baseUrl": ".",
    "typeRoots": [
      "./node_modules/@types"
    ],
    "lib": [
      "dom",
      "es2017"
    ],
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  },
  "include": [
    "next-env.d.ts",
    "./**/*.tsx",
    "./**/*.ts"
  ],
  "exclude": [
    "dist",
    "production-server",
    ".next",
    "out",
    "next.config.js",
    "node_modules"
  ]
}
```

The section `compilerOptions` contains some of the options we chose to specify. You can see the list of all options at:

[https://www.typescriptlang.org/docs/handbook/compiler-options.html](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

Later in this chapter, we will change some of the above options to check if our compiler indeed respects these options and outputs proper code.

You can also see the `include` and `exclude` sections, which are self-explanatory. You use these properties to specify which files to include for compilation and which files to exclude. For example, Next.js compiles TS automatically into JS and places compiled code to the `.next` folder, so you want to exclude this folder. Next.js only compiles code inside `pages` folder (and all code that is imported to pages, for example, code from `lib` folder). However, you as web developer, is responsible for compiling any code that Next.js does not compile. For example, code in `server` folder. We will place code that we compile using `typescript` to `production-server` folder, thus we exclude the `production-server` folder as well.

Check up official docs for description of all properties of a `tsconfig.json` file is here:

[https://www.typescriptlang.org/docs/handbook/tsconfig-json.html](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

These rules will be automatically used by Next.js as well when we run the `yarn build` command:

```
"build": "next build && tsc --project tsconfig.server.json"
```

Later in this book, in Chapter 3, we will introduce `tsconfig.server.json` file that we will use to compile code inside `server` folders of both `app` and `api` projects. This file will get most of options from `tsconfig.json` but not all.

To summarize:

-   For `app` project, `tsconfig.json` is used by Next.js to compile code in `pages` folder (with all imported code, meaning from `lib` and `components` folders as well) and `tsconfig.server.json`, that extends `tsconfig.json` file, is used to compile server-only code from `server` folder.
-   For `api` project (not yet introduced), there be no `pages` folder and no Next.js, `api` is server-only code, an Express server, thus both `tsconfig.json` and `tsconfig.server.json` files will be used for compiling server-only code.
-   For `lambda` project there be only one file, `tsconfig.json`. `serverless` package will compile and upload code to AWS Lambda.

Later in this chapter, after we write actual code, we will modify `tsconfig.json` file and see how it affects compiled code inside the `.next` folder of `app` project.

___

#### ESLint, Prettier [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#eslint-prettier)

As we just mentioned, we used plain JS to write code for our first book, and we are using TS for our second book (this book). For plain JS, we used ESLint and Prettier to specify formatting rules, to display warnings and to auto-format formatting problems.

ESLint ([https://eslint.org/](https://eslint.org/)) is a linter library that scans code and reports programming and formatting (stylistic) errors. Think of a linter as a tool that sets formatting rules for your code. If a rule is broken, the linter scans code, finds the problem, and highlights it. Linter can also auto-format a problem in some cases. By having formatting rules, you make your code more consistent and more readable. This saves a lot of time whether you work alone or as a team on a codebase.

Prettier ([https://prettier.io/](https://prettier.io/)) is also a linter, code formatter, similar to ESLint, but focuses on a narrow set of formatting rules, for example line length formatting:

[https://prettier.io/docs/en/options.html#print-width](https://prettier.io/docs/en/options.html#print-width)

This rule will highlight code:

```
foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
```

And Prettier can auto-format the above line into:

```
foo(
  reallyLongArg(),
  omgSoManyParameters(),
  IShouldRefactorThis(),
  isThereSeriouslyAnotherOne()
);
```

To lint and format JS code in our first book, we used ESLint integrated with Prettier. To lint and format TS code, you have at least two choices: (1) using TSLint ([https://palantir.github.io/tslint/](https://palantir.github.io/tslint/)) and a Prettier integration or (2) ESLint and a Prettier integration. In early 2019, the maintainers of TSLint made a announcement that they decided to stop working on TSLint in a favor of `@typescript/eslint` project. The goal of this new project is to use the **already existing** ESLint rules to parse and find problems in TS code, instead of writing new rules from scratch for TSLint. Here, we chose to go with latter option and use ESLint instead of TSLint.

Let's install ESLint integrated with Prettier on our VS code editor. We will follow these steps:

-   On VS code editor, navigate to the Extensions tab (press `Ctrl + Shift + X`). Search and install Eslint by Dirk Baeumer (search extensions using the term `dbaeumer.vscode-eslint`).
-   Open the `.vscode/settings.json` file. This is your Workspace settings for VS code editor. You already have options saved in this file (`window.zoomLevel`, `files.autoSave` and other options). Add additional settings to this file so it becomes:
    
    ```
    "window.zoomLevel": 0,
    "files.autoSave": "afterDelay",
    "git.enableSmartCommit": true,
    "git.autofetch": true,
    "editor.detectIndentation": false,
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "typescript.updateImportsOnFileMove.enabled": "never",
    "search.exclude": {
      "**/node_modules": true,
      "**/production-server": true,
      "**/lambda/src/api": true,
      "**/.next": true,
      "**/.coverage": true
    },
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "eslint.workingDirectories": [
      { "directory": "./saas/app", "changeProcessCWD": true },
      { "directory": "./saas/api", "changeProcessCWD": true },
      { "directory": "./saas/lambda", "changeProcessCWD": true },
      { "directory": "./book/1-end/app", "changeProcessCWD": true },
      { "directory": "./book/2-begin/app", "changeProcessCWD": true },
      { "directory": "./book/2-end/app", "changeProcessCWD": true },
      { "directory": "./book/3-begin/app", "changeProcessCWD": true },
      { "directory": "./book/3-end/app", "changeProcessCWD": true },
      { "directory": "./book/3-end/api", "changeProcessCWD": true },
      // etc
      { "directory": "./book/10-end/app", "changeProcessCWD": true },
      { "directory": "./book/10-end/api", "changeProcessCWD": true },
      { "directory": "./book/10-end/lambda", "changeProcessCWD": true },
    ],
    ```
    

The above settings ensure that the ESLint extension properly scans, highlights, and auto-fixes TS code in your project.

It's important to understand that you don't need the VS code editor extension `dbaeumer.vscode-eslint` and a bunch of options associated with it to use ESLint and Prettier linters. You can install `eslint`, plugin `eslint-plugin-prettier`, plugin `@typescript-eslint/eslint-plugin` and parser `@typescript-eslint/parser`. Then use command `eslint '**/*.ts' '**/*.tsx'` inside your working directory to find all formatting problems. So why did we install `dbaeumer.vscode-eslint` extension and learned its options? Because we want VS code editor to automatically highlight formatting problems within code editor's interface and to automatically fix formatting problems when we manually save a file.

-   `"editor.formatOnSave": true`. From docs:
    
    > Format a file on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down.
    
    It's important to note that auto-formatting won't work when VS code editor saves a file for us. Auto-formatting only works when you save a file manually on your own.
    
-   `"editor.defaultFormatter": "dbaeumer.vscode-eslint"` From docs:
    
    > Defines a default formatter which takes precedence over all other formatter settings. Must be the identifier of an extension contributing a formatter.
    

Find and install the `dbaeumer.vscode-eslint` extension to your VS code editor:

![Builder Book](https://user-images.githubusercontent.com/10218864/101966130-cede3100-3bcb-11eb-8fc6-770f6e90994c.png)

Options `editor.defaultFormatter`, `editor.formatOnSave` and `editor.codeActionsOnSave` are from VS code editor and they ensure that `dbaeumer.vscode-eslint` extension highlights and auto-corrects formatting problems. Option `eslint.workingDirectories` is from `dbaeumer.vscode-eslint` extension:

```
"eslint.workingDirectories": [
  // directories
]
```

`eslint.workingDirectories` from extension's docs:

> As with JavaScript validating TypeScript in a mono repository requires that you tell the VS Code ESLint extension what the current working directories are. Use the eslint.workingDirectories setting to do so.

Feel free to check the extension's docs:

[https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

___

We set up ESLint for our project! We worked and completed two independent features:

-   VS code editor will highlight and auto-fix formatting problems in our TS code using ESLint
-   We can use `eslint . --ext .ts,.tsx` command at the root of our project to manually find formatting problems and we can manually auto-fix problems by running `eslint . --ext .ts,.tsx --fix`. Open `package.json` file and add new command to `scripts` section:
    
    ```
      "lint": "eslint . --ext .ts,.tsx"
    ```
    

Only thing that remains is configuration for ESLint, we need to specify parser, extensions, plugins and rules for ESLint. In other words, ESLint requires an `.eslintrc.js` file that contains a list of formatting rules.

A list of all ESLint rules is in the official docs:

[https://eslint.org/docs/rules](https://eslint.org/docs/rules)

We can explicitly specify rules, for example:

```
rules: {
  'prettier/prettier': [
    'error',
    {
      singleQuote: true,
      trailingComma: 'all',
      arrowParens: 'always',
      printWidth: 100,
      semi: true,
    },
  ],
  '@typescript-eslint/camelcase': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  'react/no-unescaped-entities': 'off',
  'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
  '@typescript-eslint/no-explicit-any': 'off',
  'prefer-arrow-callback': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
},
```

And we can add rules implicitly by adding extensions and plugins, extensions and plugins contain rules. It's important to note that by adding rules via `extends` property:

```
extends: ['plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
```

We automatically import and use rules that contained inside corresponding extensions.

But by adding rules using `plugins` property:

```
plugins: ['prettier', 'react'],
```

We do not add any enforced rules, but we give ourselves option to use rule(s) contained inside corresponding plugins. In other words, adding `react` plugin, allows us, web developers, to specify and force two rules inside `rules` property:

```
'react/no-unescaped-entities': 'off',
'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
```

Extending configuration file:

[https://eslint.org/docs/user-guide/configuring#extending-configuration-files](https://eslint.org/docs/user-guide/configuring#extending-configuration-files)

Adding plugins to configuration file:

[https://eslint.org/docs/user-guide/configuring#configuring-plugins](https://eslint.org/docs/user-guide/configuring#configuring-plugins)

Let's create a file `eslintrc.js` that contains `parser`, `extends`, `plugins` and `rules` properties among other:

```
module.exports = {
  settings: {
    react: { version: 'detect' },
  },
  parser: '@typescript-eslint/parser',
  extends: ['plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    es6: true,
    node: true,
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'always',
        printWidth: 100,
        semi: true,
      },
    ],
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/no-unescaped-entities': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    '@typescript-eslint/no-explicit-any': 'off',
    'prefer-arrow-callback': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  plugins: ['prettier', 'react'],
};
```

As you can see, the above ESLint configuration requires multiple dependencies. You **already** installed these parser, extensions and plugins earlier in this chapter - check up the `devDependencies` section of your `package.json` file.

We specified Prettier rules from `eslint-plugin-prettier` plugin:

```
singleQuote: true,
trailingComma: 'all',
arrowParens: 'always',
printWidth: 100,
semi: true
```

You can read about these rules in Prettier docs:

[https://prettier.io/docs/en/options.html](https://prettier.io/docs/en/options.html)

The `semi` option ([https://prettier.io/docs/en/options.html#semicolons](https://prettier.io/docs/en/options.html#semicolons)), if set to true, highlights when a semicolon is missing at the end of a statement and adds the missing semicolon by auto-formatting.

Since we don't have any actual code in our application at this point, we will test highlighting and auto-formatting of code later in this chapter, in the [Testing](https://builderbook.org/books/saas-boilerplate/setup-github-and-git-visual-studio-code-editor-node-yarn-package-json-typescript-eslint-prettier-next-js-server-side-rendering-project-structure-document-hoc-app-hoc-index-page-testing-environmental-variables#testing) section.

Important note: in addition to highlighting and auto-fixing code inside VS code editor, you can run an `eslint` command to see a list of all broken rules in your terminal by running `yarn lint`. You can auto-fix auto-fixable problems with `yarn lint --fix`. And again, since at this point we have no actual code, we will test this newly added `yarn lint` in the Testing section of this chapter.

___

## Next.js [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#next-js)

Next.js is a developer-friendly JavaScript framework that allows you to add server-side rendered pages to your web application and has few other developer-friendly features.

Compiles Click on the button on server only server-side rendering Material-UI cookie Remember to add import show notification Team Leader triggers method triggers method. Decorate method with action in this book server-side rendering We will discuss if truthy then cookie discussion AWS dashboard store method calls data model decorate method with action Next.js web application compiles in this book Navigate to. Production-ready in production API method Next.js web application API infrastructure Next.js web application. It works as expected static method calls request was sent request was sent AWS dashboard end user list of posts. WithAuth HOC page component request session production-ready. It works as expected Google OAuth API We will discuss Google OAuth API S3 bucket compiles list of posts Google OAuth API redirect to checkout. Static method calls Team Leader in this book end user API method Team Leader end user add environmental variable API method calls corresponding store method Click on the button end user Click on the button Remember to add import request was sent. Static method calls AWS dashboard store method calls compiles in this book API method calls corresponding store method if truthy then Next.js web application list of posts end user in this book Google OAuth API. We will discuss request was sent in production AWS dashboard in a browser Click on the button. HTTP decorate method with action check if value is truthy API method calls corresponding store method end user page component conditional operator MongoDB database decorate method with action Remember to add import MongoDB database Navigate to add environmental variable MongoDB database.

If you don't want to spend a lot of time on configuration and tooling, and you think that your project will benefit from having both client-side and server-side rendered pages then Next.js is a good choice.

On another hand, the code bundler [Webpack](https://webpack.js.org/) and code compiler [Babel](https://babeljs.io/) require you to go through configuration hell. Web developers who are familiar with PHP remember the good old days of creating and uploading a few files to a server and having server-side rendered pages with nearly zero configurations.

Consider this tweet from the creator of RemoteOk:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-14+12-28-50.png)

In a way, Next.js strives to achieve a near PHP-like experience for developers who are building web apps with JavaScript. Here are some of the main features you get as a web developer:

-   Optional server-side rendering for pages: [https://nextjs.org/docs/basic-features/data-fetching](https://nextjs.org/docs/basic-features/data-fetching)
-   Simple routing for pages: [https://nextjs.org/docs/basic-features/pages](https://nextjs.org/docs/basic-features/pages)
-   Hot code reload: [https://nextjs.org/docs/basic-features/fast-refresh](https://nextjs.org/docs/basic-features/fast-refresh)
-   Default and custom error handling (404 and 500 HTTP errors): [https://nextjs.org/docs/advanced-features/custom-error-page#404-page](https://nextjs.org/docs/advanced-features/custom-error-page#404-page)
-   Code compilation: [https://nextjs.org/docs/advanced-features/customizing-babel-config](https://nextjs.org/docs/advanced-features/customizing-babel-config)

In addition to these main features, there are many other features that either improve developer experience or user experience:

[https://nextjs.org/docs](https://nextjs.org/docs)

Next.js also preconfigures the code bundler Webpack (code that you write and dependencies that you need bundled to be usable by a browser) and the code compiler Babel (code that you write and dependencies that you need compiled into code that a browser understands). Since v9, Next.js compiles TypeScript code as well:

[https://nextjs.org/blog/next-9#built-in-zero-config-typescript-support](https://nextjs.org/blog/next-9#built-in-zero-config-typescript-support)

We already discussed earlier in this chapter that all TypeScript code imported to Next.js's pages will be compiled by Next.js and output JavaScript code is saved to `.next` folder. We, as web developers, are responsible for compiling server-only code that we add to our project.

You already installed `next`, `react`, and `react-dom` dependencies at the beginning of this chapter. In the next three subsections, we will define extensions for higher-order components `App` and `Document`, and create our first page for your Next.js app. After that, in subsection Testing, we will check if our page is indeed server-side rendered, whether ESLint linter and TypeScript compiler work as expected.

___

#### Server-side rendering [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#server-side-rendering)

Unlike client-side rendering (CSR), server-side rendering (SSR) has a few advantages. Two specific advantages are SEO (search engine optimization [https://en.wikipedia.org/wiki/Search\_engine\_optimization](https://en.wikipedia.org/wiki/Search_engine_optimization)) and UX (user experience):

-   SSR pages is properly indexed by all major search engine bots. Search engine bots don't need to render page since page is rendered on our server, bots only need to crawl already rendered page. Thus we leave search engine bots no room for mistake.
-   SSR pages have no loading delay, i.e. a user sees no empty page with a loading spinner - pages appear on the browser fully rendered. Typically, if page has dynamic data, server-side loads faster.

SSR page, typically, has faster loading speed for initial load. This advantage is more noticable on slower network. When network is slow, SSR page loads faster than CSR page (with data) since there is one extra trip over network.

Compare SSR to CSR:

-   SSR. An end user of your Next.js web application loads page into new browser tab. For initial page load with SSR, there is only **one** over-network round trip between the browser and the server. It does take the server more time to render the page with data (props), however, the browser gets rendered HTML with data for the requested page in **one round trip**.
    
-   CSR. An end user of your Next.js web application clicks on navigational link `Link`. For page load with CSR , there are **one extra** over-network round trip between browser (client) and server. After the first round trip, the client gets a page's code without data. After the second round trip, the client gets that page's data. The browser then adds data and styles to page's code and renders page. Typically, after the second round trip, the browser gets page code (static HTML without data) for all remaining pages of web application. Thus, subsequent page loads are typically faster, since they do not request static HTML but only data.
    

Keep in mind that rendering on the server does consume server's resources and in case of Node.js server, server's main thread may get blocked sooner as number of requests to your server grows. So allocate and scale your server with this fact in mind.

As you may guess by now, doing a combination of SSR on initial load (user loads page into new browser tab or reloads page) and CSR on subsequent loads (clicks on navigational links `Link`) will be best for user experience. TFast initial load and fast subsequent loads.

You, as a web application architect, need to figure out which of your pages need need only CSR or both SSR and CSR. If your page needs to send request to get data using API method then:

-   Use `PageComponent.getInitialProps` method to get data if you know that page is accessed as SSR page and CSR page.
-   Use `PageComponent.componentDidMount` method to get data if you know that page is only accessed as CSR page.

We will talk more on this when building actual pages in this book.

___

#### Project structure [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#project-structure)

Next.js has a few rules on how to structure your project. You store code for pages in a `/pages` folder, and the name of each page file becomes that page's route.

You store components and static files (such as images) in `components` and `public` folders, respectively. Important note - when we prepare our project for production and deployment, we strongly recommend moving files from `public` to some content delivery network (CDN). We store static resources at Google Cloud Platform and AWS:

```
├── components                  # React components
├── lib                         # Code available on both client and server
├── pages                       # Pages
├── server                      # Server code
├── public                      # Static resources
├── package.json                # List of packages and scripts
```

We place code that gets imported and used inside pages, for example higher-order components, non-page components and API methods, to the `lib` folder. Code in the `lib` folder can run on both the browser and the server. Code in the `pages` folder can run on both the browser and the server, as well. If a page is client-side rendered, page's code with all imported code, HOCs and API methods, all run on the browser. If a page is server-side rendered, page's code with all imported code, HOCs and API methods, all run on the server.

We will put all **server-only** code, such as Express server, Express routes (also called Express handlers), Express middleware, and third-party API infrastructures, to the `server` folder.

Next.js lets you configure webpack by creating a `next.config.js` file at the project's root. You can also customize error pages 404 and 500 by creating a custom page, `pages/_error.js`.

We won't customize webpack or error pages, but we will customize `Document` and `App` HOCs by defining their extensions inside `pages/_document.jsx` and `pages/_app.jsx` files, respectively.

___

#### Extension for Document HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#extension-for-document-hoc)

In React ([https://reactjs.org/docs/higher-order-components.html](https://reactjs.org/docs/higher-order-components.html)), a higher-order component (HOC) is a function takes one component and returns a new component. For example, a HOC can take a wrapped component and return an enhanced component:

```
const EnhancedComponent = higherOrderComponent(WrappedComponent);
```

Next.js allows you to customize two higher-order components for your pages: `App` and `Document`. Keep in mind, these HOCs wrap **all** pages in Next.js application by default. So whatever code you add to these HOCs will be added to all pages of your Next.js application. You don't need to wrap pages with these HOCs explicitly, Next.js does automatically, implicitly.

In Chapter 5, we will create a new HOC `withAuth` and we will define as function that takes wrapped page component as its argument, `higherOrderComponent(WrappedComponent)`. Here, we are **not** defining `Document` and `App` HOCs of Next.js, they are already defined internally in Next.js library. We are extending these HOCs, thus we will not use `higherOrderComponent(WrappedComponent)` syntax here but will use `class ... extends` syntax that defines new ES6 class (in JavaScript or TypeScript):

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)

```
class MyDocument extends Document
```

`Document` HOC wraps all pages of your Next.js web application. It is typically used to modify `html`, `head`, and `body` elements of the page. By modifying `Document` HOC, you can add common (shared) attributes to all page of your project, attributes such as metadata, fonts, styles, scripts, resources from CDN.

Let's define `MyDocument` that extends `Document`. This extension must be defined at `saas/book/1-begin/app/pages/_document.tsx`. Check up the Next.js official docs on how to modify `Document` HOC:

[https://nextjs.org/docs/advanced-features/custom-document](https://nextjs.org/docs/advanced-features/custom-document)

Google OAuth API MongoDB database if truthy then on server only list of posts Click on the button on server only if truthy then You already learned new Express route We will discuss. Next.js web application on the client static method calls on the client on server only on server only on the client production-ready in production list of posts. Static method calls We will discuss response S3 bucket open this file We will discuss end user discussion. API method discussion You already learned in this book request discussion store method calls discussion end user. Production-ready decorate method with action API method calls corresponding store method if truthy then Material-UI Put it all together page component HTTP if truthy then Next.js web application static method calls production-ready S3 bucket. Next.js web application You already learned new Express route open this file conditional operator on the client We will discuss in production it works as expected show notification page component page component open this file production-ready static method calls. HTTP decorate method with action open this file store method calls check if value is truthy HTTP static method calls static method calls MongoDB database Next.js web application redirect to checkout At AWS dashboard mount middleware on the client. API infrastructure this chapter API method it works as expected new Express route new Express route request was sent page component request server-side rendering We will discuss request end user Next.js web application. This chapter production-ready in this book static method calls MongoDB database Put it all together Navigate to data model You already learned S3 bucket discussion S3 bucket. In production Google OAuth API HTTP on the client session Team Leader.

Code from the above link:

```
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
```

Important note: `Head`, `Html`, `Main`, and `NextScript` must be returned in render method for the pages of a Next.js application to render properly.

```
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

class MyDocument extends Document {
  public render() {
    return (
      <Html>
        <Head />
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

Let's add the `lang` attribute to `Html` so that search engine bots can classify pages to be in English. Here is a list of benefits for the `lang` attribute:

[https://www.w3.org/International/questions/qa-lang-why](https://www.w3.org/International/questions/qa-lang-why)

Let's add four `meta` tags to `Head` as well. Check up a list of all possible meta tags:

[https://gist.github.com/kevinSuttle/1997924](https://gist.github.com/kevinSuttle/1997924)

After these changes, you will get following content for `book/1-begin/app/pages/_document.tsx` file:

```
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

class MyDocument extends Document {
  public render() {
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

Since the `Document` HOC wraps all pages of our Next.js application, then all pages that we create will have these meta tags. Notice that we did not add meta tags with `name="keywords"` and `name="description"`, since these meta tags are used by search engine bots and should have unique values for different pages. We will create a meta tag with `name="description"` with specific value on each page that we want to be crawlable when we define it.

It's important to remember that `Document` is rendered on the server only, and `onClick` and `componentDidMount` events are undefined on the server. In this next subsection we will discuss `App` HOC, this HOC can be rendered on both, the browser and the server.

It's important to note that in the next chapter when we integrate our Next.js app with Material-UI library, we will modify `Document` HOC. As we will show you in Chapter 2, without modifying `Document`, Material-UI will only work as expected for CSR pages but not SSR pages. In other words, when page is rendered on the server, Material-UI styles are not injected by default. We need to make explicit changes to `MyDocument` extension to inject Material-UI's styles to all server-side rendered pages.

___

#### Extension for App HOC [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#extension-for-app-hoc)

In the previous subsection, we created a `MyDocument` extension for our `Document` HOC. We discussed reasons why developer would want to customize `Document` HOC. Another, built-in HOC of Next.js application is `App`. Next.js docs recommend modifying `App` HOC if you like to add shared layout or additional data to all pages of your web application.

Read the Next.js official docs on what you can do with the `App` HOC:

[https://nextjs.org/docs/advanced-features/custom-app](https://nextjs.org/docs/advanced-features/custom-app)

For example, in our first book, we used `App` to add `Header` and `Notifier` components to all pages. In earlier versions of `App` inside this book, we used it to add `Notifier` and `Confirmer` components to all pages. In the current version of this book we moved a lot of shared layout code to `Layout` component and import and use `Layout` component explicitly inside pages. However, modifying `App` HOC is still crucial for few important reasons:

-   Adding Material-UI styles on the browser.
-   Removing server-side injected on the browser.
-   Making data `store` data store available on all pages, so we can, for example, access value such as `this.props.store.currentTeam` or `this.props.store.currentUser` on any of our pages.

We achieve above three important architectural goals in the next chapters, not in this chapter. In this chapter, we simply want to use `class ... extends` syntax to define `MyApp` class (same as `MyDocument` class). Create a new file `saas/book/1-begin/app/pages/_app.tsx` with the following content:

```
import App from 'next/app';
import React from 'react';

class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props;

    return <Component {...pageProps} />;
  }
}

export default MyApp;
```

In the current form, `MyApp` extension does not make any customizations to `App` HOC.

In Chapter 2, we will achieve:

-   Adding Material-UI styles on the browser.
-   Removing server-side injected on the browser.

In Chapter 7, we will achieve:

-   Making data `store` data store available on all pages, so we can, for example, access value such as `this.props.store.currentTeam` or `this.props.store.currentUser` on any of our pages.

___

#### Index page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#index-page)

At this point, you should have two files inside the `1-begin/app/pages` folder: `_document.tsx` and `_app.tsx`, these are extensions to `Document` and `App` HOCs defined by Next.js.

Let's create our first page component (or page, used interchangeably). In Next.js web application, if you create a file with, say, with name `test.tsx` inside `pages` folder, then this page will be served at `/test` route. This is one of the benefits of using Next.js. In addition, you can create a new folder, say, `my-tests` inside the `pages` folder. Then you can place the `test.tsx` file inside `pages/my-tests` and access this page on your browser at `/my-tests/test` route.

Triggers method if truthy then API method calls corresponding store method HTTP show notification store method calls API method calls corresponding store method store method calls team members Google OAuth API Next.js web application. Team members in production this chapter end user Put it all together request. Session subsection You already learned discussion store method calls open this file static method calls. Redirect to checkout this chapter request was sent You already learned We will discuss open this file S3 bucket Material-UI send this response subsection session. Request was sent Remember to add import AWS dashboard in this book Click on the button on the client. In a browser API method calls corresponding store method email and name page component Put it all together open this file AWS dashboard on the client static method calls Remember to add import compiles. Material-UI API method calls corresponding store method data model open this file MongoDB database API method calls corresponding store method redirect to checkout. If truthy then decorate method with action add environmental variable send this response it works as expected Material-UI redirect to checkout send this response API infrastructure team members MongoDB database if truthy then redirect to checkout S3 bucket. Google OAuth API Google OAuth API triggers method Material-UI conditional operator page component email and name on the client discussion server-side rendering it works as expected API method. Conditional operator MongoDB database static method calls this chapter decorate method with action Navigate to Material-UI Next.js web application Click on the button Team Leader request was sent open this file data model Next.js web application.

You can also create dynamic routes. For example, you can create a file `pages/my-tests/[testId].tsx`. Notice the square brackets around `testId`. When you access routes such as `/my-tests/abc` or `/my-tests/def`, Next.js will load the page using code from your `[testId].tsx` file. More on dynamic routing:

[https://nextjs.org/docs/routing/dynamic-routes](https://nextjs.org/docs/routing/dynamic-routes)

For now we have a simple goal - to create a page that gets served at `/` route. To do so, create a new file `1-begin/app/pages/index.tsx` with the following content:

```
import React from 'react';
import Head from 'next/head';

const Index = () => (
  <div>
    <Head>
      <title>Index page</title>
      <meta name="description" content="This is a description of the Index page" />
    </Head>
    <div style={{ padding: '0px 30px', fontSize: '15px', height: '100%', color: '#222' }}>
      <p>Content on Index page</p>
    </div>
  </div>
);

export default Index;
```

We imported `React` but did not use explicitly. But we have to import `React` to every `.tsx` file.

Take a look at the `Head` element. The contents of this `Head` element will be added to the contents of the `Head` element inside `MyDocument` extension of `Document` HOC. You see that we added a title and meta tag with `name="description"`, if you like particular page to be indexed by search engine bots, you need to specify these two attributes. You should also make sure that page is crawlable using `robots.txt` and `sitemap.xml` files, more on this in Chapter 10.

We also added local, non-shared, style to `div` element. We will discuss different ways of adding styles in Chapter 2.

We are ready to start our Next.js web app!

Make sure that you ran the `yarn` command in your terminal inside the `1-begin/app` folder. This will install missing dependencies. If successful, you will see a newly created `node_modules` folder and `yarn.lock` file at root of `1-begin/app`. Take a look at the `.gitignore` file - it contains `node_modules`, since this directory is typically over 100 MBs and there is no point in hosting it on GitHub. It also contains `.env` file, more on this at the end of this chapter.

Now let's take a look at our scripts inside the `package.json` file:

```
"scripts": {
  "dev": "next",
  "build": "next build",
  "lint": "eslint . --ext .ts,.tsx"
},
```

`yarn dev` command will build (compile) and start the project, while the `yarn build` command will only build (compile, in our case from developer-friendly TypeScript to browser-friendly JavaScript).

Run `yarn dev` in your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-16+14-18-46.png)

If your built is successful, you will find a newly generated `.next` folder at the root of `1-begin/app`. Similar to `node_modules`, `.next` is listed inside the `.gitignore` file. Since the content of `.next` is very dynamic (every change you make to code and some configs), there is no reason to host `.next` on GitHub.

As you can see in the above logs, our Next.js application is served at `http://localhost:3000` by default.

Navigate to `http://localhost:3000`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-16+14-21-13.png)

Try editing inline styles inside `1-begin/app/pages/index.tsx`. For example, let's change `fontSize` to `35px`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-16+14-22-00.png)

You will notice that the page updated automatically to reflect this change due to the hot code reload feature of Next.js.

Let's check up the contents of our `head` element. Open the browser console on Chrome or Mozilla. On Chrome, go to `Chrome Dev Tools` by pressing `Ctrl + Shift + I`, then click `Elements`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-16+14-43-42.png)

The `head` element has contents from both `index.tsx` and `_document.tsx`. This is an expected behavior for a Next.js web application, shared attributes from HOC get combined with attribute specified on particular page.

Remember, you can stop running the project by pressing `Ctrl + C` in your terminal.

Finally, after starting project, you may have noticed an automatically generated file `next-env.d.ts` at the root of `book/1-begin/app`. This file makes sure that data types defined by Next.js are picked by TypeScript compiler:

[https://nextjs.org/docs/basic-features/typescript](https://nextjs.org/docs/basic-features/typescript)

Among other heavy lifting, such as server-side rendering, Next.js provides you with pre-built error pages. You have an option to modify these error pages. For example, on your browser, navigate to `http://localhost:3000/abc`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2020-04-14+09-00-23.png)

This a pre-built `404` error page.

In the next section we will see how our code gets formatted by ESLint and compiled by TypeScript.

___

## Testing [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing)

Earlier in this chapter, we configured VS code editor so that ESLint, configured with parser, extensions and plugins, would highlight and auto-fix formatting rules, for example these rules:

```
singleQuote: true,
trailingComma: 'all',
arrowParens: 'always',
printWidth: 100,
semi: true
```

You can find these rules inside `book/1-begin/app/.eslintrc.js` file.

Open the `book/1-begin/app/pages/index.tsx` file that contains code for our `Index` page.

Remove `;` at the end of the first line:

```
import Head from 'next/head';
```

This chapter MongoDB database page component end user data model Navigate to in production. Material-UI Next.js web application on the client in a browser page component show notification open this file conditional operator session page component send this response mount middleware Put it all together. Conditional operator triggers method data model compiles send this response AWS dashboard cookie decorate method with action email and name HTTP HTTP on server only decorate method with action session on server only. On the client new Express route decorate method with action Navigate to conditional operator redirect to checkout redirect to checkout production-ready Team Leader cookie. It works as expected API method this chapter Put it all together conditional operator conditional operator show notification it works as expected store method calls. Production-ready Google OAuth API Google OAuth API in a browser S3 bucket data model. You already learned list of posts server-side rendering You already learned response. In a browser in a browser response API infrastructure page component list of posts API method calls corresponding store method end user discussion discussion end user. Material-UI response redirect to checkout mount middleware server-side rendering on server only triggers method request was sent session request compiles. Google OAuth API list of posts send this response on server only You already learned S3 bucket.

You will see that ESLint extension of VS code editor highlights that a semicolon is missing and references a rule from `eslint(prettier/prettier)`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-28+14-07-41.png)

So highlighting of broken rules works as expected. Let's test the auto-fixing functionality by pressing `Ctrl + S` to save file:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-28+14-18-54.png)

The semicolon is indeed added automatically, proving that auto-fixing of TS code works as well.

Next, let's test the `yarn lint` command:

-   Go ahead and remove `;` at the end of the first line again:
    
    ```
      import Head from 'next/head';
    ```
    
-   Open your terminal (you can open terminal within VS code editor by pressing `Ctrl + backtick`).
    
-   Navigate to `book/1-begin/app`, type `yarn lint` in the terminal, and then press `Enter`.
    
-   You will see the following output in your terminal:  
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-28+14-24-44.png)
    

Remember, highlighting is useful for finding and fixing problems in a particular file. To find all problems inside the `app` project, you can run `yarn lint`.

You can also auto-fix most of formatting problems by adding `--fix` to your command.

Follow the above steps but run `yarn lint --fix` instead of `yaern lint`. This time the output in the terminal will be:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-28+14-36-02.png)

And ESLint/Prettier automatically added a semicolon inside the `book/1-begin/app/pages/index.tsx` file!

We tested `semi` rule. You are welcome to test the 4 other rules from the `.eslintrc.js` file:

```
singleQuote: true,
trailingComma: 'all',
arrowParens: 'always',
printWidth: 100,
semi: true
```

___

Now, let's test whether we set up compilation of TypeScript code properly in our project. As you recall from the earlier subsection [TypeScript](https://builderbook.org/books/saas-boilerplate/setup-github-and-git-visual-studio-code-editor-node-yarn-package-json-typescript-eslint-prettier-next-js-server-side-rendering-project-structure-document-hoc-app-hoc-index-page-testing-environmental-variables#typescript), code that you write needs to be compiled into code that the browser understands.

Next.js v9 automatically compiles all TypeScript code inside `pages` folder using Babel and saves it to `.next` folder. Navigate to the `book/1-begin/app` folder and run `yarn build` in the terminal. You will see a newly generated `.next` folder that contains compiled code.

Let's see how changes to `tsconfig.json` file, that we introduced earlier, affects compiled code.

As we mentioned earlier in this chapter, we will eventually add an Express.js server to the `app` project. The `app` project will have custom Next.js/Express.js server. Since structure of `.next` directory is multi-level and complex, tracking changes in that folder is not easy. Instead, let's create a new file `book/1-begin/app/server/app.ts` with following content:

```
const a = 'someString';

// some comment

export default a;
```

Since this new file is located in the `server` directory, Next.js will not compile it. We have to compile it by ourselves.

-   Open `package.json` file. Update the `build` command in the `scripts` section to become:
    
    ```
      "build": "next build && tsc --project tsconfig.server.json"
    ```
    
-   Create a new configuration file `book/1-begin/app/tsconfig.server.json` with this content:
    
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
    
    As you can see `tsconfig.server.json` gets most of its configuration options from `tsconfig.json`, this is because of this line:
    
    ```
      "extends": "./tsconfig.json",
    ```
    

Open terminal, navigate to `book/1-begin/app`, and run `yarn build`. You will see a new `production-server` folder generated **in addition** to the `.next` folder:

![SaaS Boilerplate](https://user-images.githubusercontent.com/10218864/67977164-c8ae1080-fbd4-11e9-9f37-069cb756ac81.png)

Triggers method list of posts cookie end user Material-UI AWS dashboard send this response Team Leader on server only static method calls. Mount middleware triggers method API method calls corresponding store method AWS dashboard end user mount middleware. Page component discussion this chapter redirect to checkout send this response team members on the client Team Leader server-side rendering At AWS dashboard request check if value is truthy data model. Store method calls Team Leader this chapter redirect to checkout static method calls Team Leader Team Leader page component API method HTTP new Express route open this file email and name. Mount middleware list of posts triggers method AWS dashboard Next.js web application team members. Discussion server-side rendering subsection on server only session AWS dashboard discussion. WithAuth HOC email and name AWS dashboard S3 bucket discussion API method calls corresponding store method in production MongoDB database production-ready store method calls Remember to add import API method calls corresponding store method discussion You already learned response. API method API method calls corresponding store method check if value is truthy new Express route team members mount middleware check if value is truthy API method mount middleware open this file AWS dashboard send this response email and name request was sent. In a browser API method store method calls withAuth HOC check if value is truthy this chapter withAuth HOC. Open this file cookie request At AWS dashboard Material-UI email and name mount middleware API method calls corresponding store method Navigate to MongoDB database request was sent.

The content of `production-server/app.js` is your compiled code from original TS code from `server/server.ts`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-31+11-51-04.png)

Notice that compiled code is highlighted by ESLint. We use ESLint for formatting code written by us. There is no need to format compiled code, since the browser does not require code to be readable by a human. To remove highlighting of compiled code, simply create a new file `book/1-begin/app/.eslintignore` with the following content:

```
.next
production-server
node_modules
```

Also notice `production-server/app.map.js`. This type of file is called a source map, and it is a minified version ([https://en.wikipedia.org/wiki/Minification\_(programming)](https://en.wikipedia.org/wiki/Minification_(programming))) of `production-server/app.js`. Creating a source map version of the file is indeed one of our compiler options! Open `tsconfig.json` that you created earlier and find the compiler option `sourceMap`:

```
{
  "compileOnSave": false,
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "jsx": "preserve",
    "allowJs": true,
    "alwaysStrict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "removeComments": true,
    "preserveConstEnums": true,
    "sourceMap": false,
    "skipLibCheck": true,
    "baseUrl": ".",
    "typeRoots": [
      "./node_modules/@types"
    ],
    "lib": [
      "dom",
      "es2017"
    ],
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  },
  "include": [
    "next-env.d.ts",
    "./**/*.tsx",
    "./**/*.ts"
  ],
  "exclude": [
    "dist",
    "production-server",
    ".next",
    "out",
    "next.config.js",
    "node_modules"
  ]
}
```

As you can see, `sourceMap` is set to `true`. Thus, our compiled code contains a \`\` file.

Also notice that `production-server/app.js` contains `// some comment`. That's because the compile option `removeComments` is set to `false`.

To check that the compilation process of TypeScript works properly, let's change `sourceMap` to `false` and `removeComments` to `true`, then run `yarn build` again.

If you do so, you will notice that you have **no** `production-server/app.map.js` and `// some comment` is removed from `production-server/app.js`. This proves that compilation of TS works as expected. Remember to change the compiler options back.

You are welcome to learn more about other compiler options and see how changing them will affect your output:

[https://www.typescriptlang.org/docs/handbook/compiler-options.html](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

___

Notice the terminal's output when you run `yarn build`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-10-31+12-20-58.png)

You can see that the `Index` page will be served on the browser as pre-rendered static HTML. You can actually see this static HTML code at:

```
/.next/server/static/build_id/pages/index.html
```

The `Index` page is static HTML that contains no dynamic data. In future chapters, when we introduce new pages, some of those pages will require data from a database, for example `DiscussionPageComp` page. We will show you that such pages will be indeed rendered on the server with data before they are sent to the browser.

In Chapter 2 we will create client-side rendered page (`CSRPage` page) and discuss how its behavior differs from behavior of `Index` page which is loaded as server-side rendered page.

___

## Environmental variables [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#environmental-variables)

An environmental variable is a name-value pair set outside of the codebase and typically added to the project for security and productivity reasons. On one hand, we, as software developers, do not want to store some secure values inside our codebases. On other hand, if such value is not in our codebase, we can update it easily without redeploying our project too often.

By the end of this book, we will add the following environmental variables to our `app` project:

```
NEXT_PUBLIC_BUCKET_FOR_POSTS=
NEXT_PUBLIC_BUCKET_FOR_AVATARS=
NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS=

NEXT_PUBLIC_URL_APP=http://localhost:3000
NEXT_PUBLIC_URL_API=http://localhost:8000
NEXT_PUBLIC_PORT_APP=3000
NEXT_PUBLIC_PORT_API=8000
NEXT_PUBLIC_PRODUCTION_URL_API=
NEXT_PUBLIC_PRODUCTION_URL_APP=


NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY=
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY=

NEXT_PUBLIC_API_GATEWAY_ENDPOINT=

NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

In Chapter 10, you will learn to deploy the `app` and `api` projects to Heroku and AWS Elastic Beanstalk. Once the projects are deployed, you will be able to update environmental variables **without** redeploying your projects. Same is true for `lambda` project that you will deploy to AWS Lambda in Chapter 9.

For example, the values for `STRIPEPUBLISHABLEKEY` or `BUCKET_FOR_POSTS` or `LAMBDA_API_ENDPOINT` may change - you will be able to update these values from Heroku's or AWS's dashboards without redeploying your projects. This feature of environmental variables saves you a lot of time in the long run.

If truthy then Material-UI Navigate to new Express route S3 bucket Remember to add import it works as expected page component response Material-UI. Data model on the client You already learned conditional operator cookie You already learned check if value is truthy API method withAuth HOC in a browser end user open this file request session. Triggers method open this file team members Team Leader You already learned You already learned redirect to checkout redirect to checkout API infrastructure redirect to checkout Navigate to production-ready add environmental variable on the client. At AWS dashboard compiles end user it works as expected withAuth HOC team members new Express route in this book static method calls Next.js web application. Session email and name S3 bucket end user Click on the button team members email and name open this file. Team members data model Click on the button discussion mount middleware API infrastructure in a browser At AWS dashboard data model session request S3 bucket page component. MongoDB database Click on the button data model API infrastructure cookie decorate method with action if truthy then redirect to checkout S3 bucket Remember to add import team members Google OAuth API request. HTTP new Express route Team Leader response it works as expected static method calls withAuth HOC add environmental variable request was sent this chapter API method compiles Click on the button Team Leader. Static method calls We will discuss withAuth HOC on the client Next.js web application Remember to add import Next.js web application S3 bucket list of posts Next.js web application store method calls it works as expected end user. Email and name show notification session compiles withAuth HOC cookie.

Earlier in this chapter, we briefly mentioned the `NODE_ENV` variable. You can check up the value of `NODE_ENV` by printing it in your terminal. Open `book/1-begin/app/pages/_document.tsx` and add an extra line of code `console.log(process.env.NODE_ENV);` like this:

```
import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

class MyDocument extends Document {
  public render() {

    console.log(process.env.NODE_ENV);

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

In your terminal, make sure you are at `book/1-begin/app` and run `yarn dev`. On your browser, go to `http://localhost:3000`. Then look into your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-11-01+11-17-12.png)

You will see that the value of `NODE_ENV` is `development`.

Stop your `app` by pressing `Ctrl + C` in your terminal.

Now change this line

```
console.log(process.env.NODE_ENV);
```

to be

```
console.log(process.env.VAR123);
```

And start your app with new command:

```
VAR123=somevalue yarn dev
```

Navigate to `http://localhost:3000`. Check the output in your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-11-01+11-21-08.png)

Now you know one way to set up the value for an environmental variable (env var) - simply prepending a command with the name/value pair. You could save time and add name/value pairs to commands in the `scripts` section of `package.json`. However, prepending env vars to commands is laborious and adding env vars to `package.json` is not secure. So there has to be another way to manage environmental variables. Ideally, you want to store env vars in a separate file and keep this file on your local machine only (not host this file in a remote repository). To achieve exactly that, we will use the `dotenv` package:

[https://www.npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv)

Create a new file `.env` at the root of your project with following content:

```
NEXT_PUBLIC_BUCKET_FOR_POSTS=
NEXT_PUBLIC_BUCKET_FOR_AVATARS=
NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS=

NEXT_PUBLIC_URL_APP=http://localhost:3000
NEXT_PUBLIC_URL_API=http://localhost:8000
NEXT_PUBLIC_PORT_APP=3000
NEXT_PUBLIC_PORT_API=8000
NEXT_PUBLIC_PRODUCTION_URL_API=
NEXT_PUBLIC_PRODUCTION_URL_APP=


NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY=
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY=

NEXT_PUBLIC_API_GATEWAY_ENDPOINT=

NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

Now, all youi need to do is to call:

```
require('dotenv').config();
```

in any file, and you will be able to access values from `.env` file using `process.env` inside your code.

For example, you can access `http://localhost:3000` value in your code as `process.env.NEXT_PUBLIC_URL_APP` and etc.

Because we prepended our environmental variables with "NEXT\_PUBLIC\_", Next.js makes our environmental variables available on both server and browser (universally available). Read more in the Next.js docs: [https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser](https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser)

Now we just need to add a `next.config.js` file at the root of our project. Read more in the Next.js docs: [https://nextjs.org/docs/api-reference/next.config.js/environment-variables](https://nextjs.org/docs/api-reference/next.config.js/environment-variables)

Go to `book/1-begin/app` and create a new file `next.config.js` with the following content:

```
module.exports = {
  poweredByHeader: false,
  webpack5: true,
};
```

Let's test if we indeed can access value for environmental variables!

As you can see, we already assigned a value to some of our environamental variables:

```
NEXT_PUBLIC_URL_APP=http://localhost:3000
```

Open `book/1-begin/app/pages/_document.tsx`, replace the line

```
console.log(process.env.VAR123);
```

with

```
console.log(process.env.NEXT_PUBLIC_URL_APP);
```

Run `yarn dev` to start the app. On your browser, navigate to `http://localhost:3000`. Then look into your terminal:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-1/Screenshot+from+2019-11-02+13-39-31.png)

You set up the `dotenv` plugin properly if you see `http://localhost:3000` printed in your terminal and on the browser console.

It's important to note that you should not necessarily make all environmental variables univerally available in the `app` project. Only those that must be universal should be made so. In our particular case, the `app` project's environmental variables indeed must be available on the browser --> thus they must be universally available --> thus we prepend them with "NEXT\_PUBLIC\_". In our `api` project, all environmental variables are only available on the server.

Static method calls on server only request if truthy then Click on the button Put it all together email and name redirect to checkout team members store method calls. End user Remember to add import store method calls Material-UI withAuth HOC if truthy then send this response compiles in production. In a browser new Express route AWS dashboard page component send this response new Express route HTTP Google OAuth API response triggers method server-side rendering. Put it all together Navigate to request compiles withAuth HOC compiles this chapter decorate method with action store method calls it works as expected At AWS dashboard API method calls corresponding store method subsection open this file Remember to add import. At AWS dashboard HTTP show notification API infrastructure You already learned on server only list of posts production-ready check if value is truthy production-ready. Send this response on the client We will discuss Click on the button static method calls. If truthy then request list of posts subsection response send this response. Show notification in a browser send this response if truthy then team members data model in a browser decorate method with action show notification You already learned show notification request was sent compiles request was sent. At AWS dashboard We will discuss open this file response send this response mount middleware in a browser add environmental variable At AWS dashboard. Put it all together redirect to checkout AWS dashboard discussion Next.js web application AWS dashboard API method calls corresponding store method decorate method with action API infrastructure.

A very important step: make sure that the `.env` file is added to your `.gitignore` file. If you started from `.book/1-begin`, your `.gitignore` file should already have `.env` and `node_modules`. If you start new project, please make sure that you don't publish your `.env` file to remote repository.

___

This is the end of Chapter 1.

If you followed steps described in this chapter closely, your codebase should match the codebase located at `book/1-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___