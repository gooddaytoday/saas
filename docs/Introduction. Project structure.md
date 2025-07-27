-   Table of Contents  
    

-   Why this book?  
    

-   Who is this book for?  
    

-   What will you learn?  
    

-   Screenshots  
    

-   Project structure  
    

-   Authors  
    

___

> "What I cannot create, I do not understand." Richard Feynman

___

## Table of Contents [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#table-of-contents)

In this book, you'll build a full-stack JavaScript web application from scratch. The final app is a boilerplate to build any SaaS product. We used it ourselves to build our open source team communication software, [Async](https://async-await.com/)

The book has 10 chapters, which are shown in the Table of Contents on the left menu. Click any title to see a free preview of that chapter.

By the end of chapter 10, you will write over 10,000 lines of code (mainly TypeScript).

___

## Why this book? [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#why-this-book-)

This is our second book for web developers. The first one is [Builder Book](https://builderbook.org/), which is popular among junior or mid-career web developers who are learning a modern JavaScript fullstack: React, Next, Material UI, Express.

The motivation for this book is two-fold.

-   First, we want to explain more advanced topics that did not fit logically into our first book. For example, the project in this book has a standalone API server. This makes a web application more scalable on one hand and more readable/maintainable on the other hand. In our first book, we discussed basic concepts such as: request, response, async/await, Promise, session, cookie, single payments. In this book, we introduce more advanced topics, such as: data store, file upload, Passwordless authentication, websockets, "two-project" architecture, subscriptions with Stripe API, AWS API Gateway, and AWS Lambda.
    
-   The second motivation is we realized the world is mostly made of corporations that inevitably become more monopolistic. We believe that monopolies are overall bad for the economy. A part of our personal mission is to encourage more people to start their own businesses. We were the first to open source a boilerplate for a SaaS business. Currently, our public repository ([https://github.com/async-labs/saas](https://github.com/async-labs/saas)) is the most starred project among all SaaS boilerplates on GitHub. In this book, we walk you through the process of building this SaaS Boilerplate ([https://github.com/async-labs/saas](https://github.com/async-labs/saas)) from scratch, so that you, as a potential future business owner, understand every detail of the boilerplate and are able to read, extend, and maintain it. We hope that you will succeed in using our SaaS boilerlplate to build your own software business. We used this SaaS boilerplate to build our own businesses: [https://builderbook.org](https://builderbook.org/), [https://async-await.com](https://async-await.com/), [https://workinbiotech.com/](https://workinbiotech.com/), [https://async-labs.com](https://async-labs.com/).
    

As you read through SaaS Boilerplate, we are here to help. We've answered hundreds of our readers' questions via email and via [issues](https://github.com/async-labs/saas/issues?q=is%3Aissue) in our public GitHub repo. We also regularly update packages and code in this book. So far, we have made >500 improvement/updates (see [commits](https://github.com/async-labs/saas/commits/master)).

___

## Who is this book for? [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#who-is-this-book-for-)

Similar to our first book, this book assumes basic knowledge of HTML, CSS, basic React, and basic JavaScript.

This book also assumes some basic understanding of HTTP, API, and asynchronous execution - topics that we discussed in our first book.

As mentioned in the above section, you may have at least one of two reasons to purchase this book. One reason could be purely educational: you want to learn how to put together a boilerplate using a productive fullstack (React, Next, Material-UI, Express, MongoDB, AWS Lambda, TypeScript). In many cases, people who bought and mastered our first book decide to advance their knowledge further by reading this book.

The second reason could be to use the knowledge acquired from this book to build your own SaaS business. Our public repo received a lot of praise via email - from these emails, we do indeed know that real people use our SaaS boilerplate to build their own businesses. We also notice many blog posts by other web developers that recommend our boilerplate. So if you are indeed building a business, depending on your level of experience and commitment, this book and this public repo can save you a few or many weeks of your effort. You could pay $500+ for a SaaS boilerplate with obscure/unknown documentation, or you could buy this book with detailed explanations of all code. You will completely understand how your SaaS app works and how to extend it.

If you agree with at least some ideas of the [Basecamp founders](https://m.signalvnoise.com/reconsider/), [Pinboard founder](https://pinboard.in/about/), or the author of [Company of One](https://ofone.co/) - then you can use our public repo alone or with this book. Our public repo and this book will help you build software on your own, so you can stay independent, small and, hopefully, profitable. Being small and independent can help you stay focused on your product and on your customers.

The final project that you build by the end of Chapter 10 is practically the same as our open source project:

[https://github.com/async-labs/saas](https://github.com/async-labs/saas)

All code for chapters of this book is public and can be found in the `/book` directory of our public repo:

[https://github.com/async-labs/saas/tree/master/book](https://github.com/async-labs/saas/tree/master/book)

This book is reltively expensive. The current price is $149. Why so expensive? The aswer is two-fold:

-   We make a commitment to make a regular (twice a year) review and update of both the book's content and the book's codebase. This includes upgrading packages and fixing breaking changes, updating syntax and linters, improving explanations or refactoring features or part of features, and more. When you buy a book, we guarantee you at least two such updates.
-   Unless you are a senior web developer who already has a boilerplate and does not mind googling for many days, this book will save you weeks of your effort. How much is your time worth? If your time is worth $45+/hour, this book is worth buying if it saves you 5 hours or more.

___

## What will you learn? [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#what-will-you-learn-)

Most components in this book are class components, however in Chapter 10 we take our largest `DiscussionPageComp` class component and convert it into functional `DiscussionPageCompFunctional` component. We discuss in detail on how to convert React's lifecycle methods to hooks. We also run experiments in Chapter 10 on how lifecycle methods and hooks fire when we load page in our Next.js web application. Finally, we created a 10-end-functional codebase, where we converted our entire final project from class components to functional components. You can look at the [`book/10-end`](https://github.com/async-labs/saas/tree/master/book/10-end) and [`book/10-end-functional`](https://github.com/async-labs/saas/tree/master/book/10-end-functional) folders of our GitHub repo to see how the codebases compare. The final [`saas`](https://github.com/async-labs/saas/tree/master/saas) app of our GitHub repo is written with functional components.

This book will, among other lessons:

-   Introduce you to TypeScript
-   Show you how to integrate Next.js with Material-UI
-   Explain the difference between server-side rendering (SSR) and client-side rendering (CSR), and how this affects API infrastructures.
-   Teach you how to define Mongoose data models, schemas, API methods and etc.
-   Walk you through implementation of Google OAuth API and Passwordless API for user authentication.
-   Show you how to integrate essential AWS services into your web application: S3, SES, Lambda, API Gateway. Deploy to AWS Elastic Beanstalk service.
-   Show you how `mobx` data stores can be used to automatically re-render components to create reactive UX.
-   Show you how websockets can be used for real-time message exchange.
-   Teach you how to use Stripe's API to create and update subscriptions, customers, card information, and display invoices in your web application.
-   Show how to create a few dozen pages, HOCs and non-page components using React, Next, Material-UI and TypeScript.
-   Help you design and engineer many API infrastructures, both internal and external (third-party server other than MongoDB server). This includes numerous component methods, API methods, Express routes, Express middleware functions, utility methods, data models and their static methods and more.
-   Show you how to prepare your web application for production and how to deploy it to Heroku and AWS Elastic Beanstalk clouds.

You could spend weeks searching these topics on Google. We did all of heavy lifting. Our book puts everything about building a web application into one place.

___

## Screenshots [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#screenshots)

By the end of this book, you will build this web application:

[https://github.com/async-labs/saas](https://github.com/async-labs/saas)

You are welcome to sign up at our deployed demo so you can poke around:

[https://saas-app.async-await.com](https://saas-app.async-await.com/)

If you like, we can mention any project that you built using this SaaS boilerplate in our public repo.

Below are screenshots of the web application you will build in this book.

Google or passwordless login:  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/1_SaaS_login.png)

Dropdown menu for settings:  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/2_SaaS_DropdownMenu.png)

Personal settings page:  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/3_SaaS_PersonalSettings.png)

Team settings page:  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/4_SaaS_TeamSettings.png)

Creating Discussions between multiple team members:  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/5_SaaS_Discussion_Creation.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/6_SaaS_Discussion_Markdown.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/7_SaaS_Discussion_HTML.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/8_SaaS_Discussion_Dark.png)

Billing settings:  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/9_SaaS_Billing.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/introduction/12_SaaS_PaymentHistory.png)

___

## Project structure [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#project-structure)

The final project that you build by the end of Chapter 10 is practically the same as our open source project:

[https://github.com/async-labs/saas](https://github.com/async-labs/saas)

All code for chapters of this book is public and can be found in the `/book` directory of our public repo:

[https://github.com/async-labs/saas/tree/master/book](https://github.com/async-labs/saas/tree/master/book)

In total, you will write more than 10,000 lines code over 10 chapters. Your final project structure:

```
├── api
│   ├── .elasticbeanstalk
│   │   └── config.yml
│   ├── server
│   │   ├── api
│   │   │   ├── index.ts
│   │   │   ├── public.ts
│   │   │   ├── team-leader.ts
│   │   │   └── team-member.ts
│   │   ├── models
│   │   │   ├── Discussion.ts
│   │   │   ├── EmailTemplate.ts
│   │   │   ├── Invitation.ts
│   │   │   ├── Post.ts
│   │   │   ├── Team.ts
│   │   │   └── User.ts
│   │   ├── utils
│   │   │   ├── slugify.ts
│   │   │   └── sum.ts
│   │   ├── aws-s3.ts
│   │   ├── aws-ses.ts
│   │   ├── google-auth.ts
│   │   ├── logger.ts
│   │   ├── mailchimp.ts
│   │   ├── passwordless-auth.ts
│   │   ├── passwordless-token-mongostore.ts
│   │   ├── server.ts
│   │   ├── sockets.ts
│   │   └── stripe.ts
│   ├── static
│   │   └── robots.txt
│   ├── test/server/utils
│   │   ├── slugify.test.ts
│   │   └── sum.test.ts
│   ├── .eslintignore
│   ├── .eslintrc.js
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.server.json
│   └── yarn.lock
├── app
│   ├── .elasticbeanstalk
│   │   └── config.yml
│   ├── components
│   │   ├── common
│   │   │   ├── Confirmer.tsx
│   │   │   ├── LoginButton.tsx
│   │   │   ├── MemberChooser.tsx
│   │   │   ├── MenuWithLinks.tsx
│   │   │   ├── MenuWithMenuItems.tsx
│   │   │   └── Notifier.tsx
│   │   ├── discussions
│   │   │   ├── CreateDiscussionForm.tsx
│   │   │   ├── DiscussionActionMenu.tsx
│   │   │   ├── DiscussionList.tsx
│   │   │   ├── DiscussionListItem.tsx
│   │   │   └── EditDiscussionForm.tsx
│   │   ├── layout
│   │   │   ├── index.tsx
│   │   ├── posts
│   │   │   ├── PostContent.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   ├── PostEditor.tsx
│   │   │   └── PostForm.tsx
│   │   ├── teams
│   │   │   └── InviteMember.tsx
│   ├── lib
│   │   ├── api
│   │   │   ├── makeQueryString.ts
│   │   │   ├── public.ts
│   │   │   ├── sendRequestAndGetResponse.ts
│   │   │   ├── team-leader.ts
│   │   │   └── team-member.ts
│   │   ├── store
│   │   │   ├── discussion.ts
│   │   │   ├── index.ts
│   │   │   ├── invitation.ts
│   │   │   ├── post.ts
│   │   │   ├── team.ts
│   │   │   └── user.ts
│   │   ├── confirm.ts
│   │   ├── isMobile.ts
│   │   ├── notify.ts
│   │   ├── resizeImage.ts
│   │   ├── sharedStyles.ts
│   │   ├── theme.ts
│   │   └── withAuth.tsx
│   ├── pages
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── billing.tsx
│   │   ├── create-team.tsx
│   │   ├── discussion.tsx
│   │   ├── invitation.tsx
│   │   ├── login-cached.tsx
│   │   ├── login.tsx
│   │   ├── team-settings.tsx
│   │   └── your-settings.tsx
│   ├── public
│   │   └── pepe.jpg
│   ├── server
│   │   ├── robots.txt
│   │   ├── routesWithCache.ts
│   │   ├── server.ts
│   │   └── setupSitemapAndRobots.ts
│   ├── .babelrc
│   ├── .eslintignore
│   ├── .eslintrc.js
│   ├── .gitignore
│   ├── next.env.d.ts
│   ├── next.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.server.json
│   └── yarn.lock
├── lambda
│   ├── .estlintignore
│   ├── .eslintrc.js
│   ├── .gitignore
│   ├── api
│   ├── handler.ts
│   ├── package.json
│   ├── serverless.yml
│   ├── tsconfig.json
│   └── yarn.lock
├── .gitignore
```

___

## Authors [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#authors)

We:

-   maintain two popular repos (combined: over 6000 stars and 1000 unique visitors per week).
-   built and maintain the most popular React/TypeScript/Node [boilerplate](https://github.com/async-labs/saas) for starting a SaaS business.
-   built [Async](https://async-await.com/), open source team communication web app to separate urgent vs non-urgent conversations.
-   built [Work in biotech](https://workinbiotech.com/), growing niche job board for small biotech startups.
-   built [AI-cruiter](https://workinbiotech.com/ai-cruiter), browser extension is built for recruiters managing a high volume of job applicants. AI-cruiter uses LLMs - like ChatGPT, PaLM 2, our private fine-tuned LLM - to generate succinct and relevant summaries of your job applicants' resumes.
-   built over a dozen SaaS web applications in the last 10 years and offer custom development service: [async-labs.com](https://async-labs.com/)

Learn more about us at [Async Labs](https://async-labs.com/about-us).

You can find us on GitHub:

-   [Async Labs org](https://github.com/async-labs)
-   [Kelly Burke](https://github.com/klyburke)
-   [Timur Zhiyentayev](https://github.com/tima101)

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___