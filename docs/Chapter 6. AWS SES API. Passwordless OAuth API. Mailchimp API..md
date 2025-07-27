In Chapter 6, you will start with the codebase in the [6-begin folder](https://github.com/async-labs/saas/tree/master/book/6-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [6-end folder](https://github.com/async-labs/saas/tree/master/book/6-end).

We will cover the following topics in this chapter:

-   AWS SES API  
    
    -   EmailTemplate model, insertTemplates and getEmailTemplate methods
    -   Adding getEmailTemplate and sendEmail to signInOrSignUpViaGoogle
    -   sendEmail method
    -   Setting up AWS SES and EMAIL\_SUPPORT\_FROM\_ADDRESS
    -   Testing AWS SES API
-   Passwordless OAuth API  
    
    -   Configure passwordless
    -   Configure passwordless token
    -   Express routes for Passwordless API
    -   signInOrSignUpByPasswordless method for User model
    -   Testing Passwordless OAuth API
-   Mailchimp API  
    
    -   callAPI method
    -   addToMailchimp method
    -   Adding addToMailchimp to signInOrSignUpViaGoogle and signInOrSignUpByPasswordless
    -   Environmental variables for Mailchimp API
    -   Testing Mailchimp API

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

In this chapter, we have three major features to add to our SaaS boilerplate:

-   the ability to send emails (AWS SES API)
-   allowing end users to sign up or log in using passwordless authentication (Passwordless OAuth API)
-   saving email addresses to a Mailchimp list (Mailchimp API)

We will not only discuss how to build these features in detail but also discuss why you might want these feature in your SaaS business.

___

## AWS SES API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#aws-ses-api)

One common feature of modern web applications is the ability to send emails. In Chapter 5, we added user authentication using Google OAuth. Nowadays, a typical internet user signs up in many web applications. It is a good idea to send a welcome email to a newly signed-up user. When an end user logs into our web application for the first time, our `API` server, in addition to creating a new `User` document in our database, should send a welcome email to this user.

Besides welcoming a new user, sending emails might be useful for other situations. By the end of this book, you will set up the following emails in your SaaS boilerplate:

-   welcome email sent by `API` server to a newly signed-up user (this section)
-   login email sent by `API` server to let a user log into our web application using the passwordless method (next section of this chapter)
-   invitation email sent by `API` server to invite a new user to join an existing team (Chapter 7)
-   newPost email sent by AWS Lambda function `sendEmailForNewPost` to notify a user about a new Discussion or new Post inside an existing Discussion

Your business may have more use cases for sending emails. For example, in our SaaS product [Async](https://async-await.com/), we use AWS SES API to let Async's users create a new Post by simply replying to a `newPost` email.

This is the high-level outline of how we want our welcome email to work:

-   A new end user clicks the login button on the login page of our web application on the browser
-   Some method in our `API` server retrieves an email template for a welcome email from our MongoDB database
-   Some other method if our `API` server takes all necessary parameters and passes them to an AWS SES API method that sends a request to the AWS SES server.
-   The AWS SES server sends a request with an email message to the end user's Email server
-   The newly signed-up end user can see our welcome email on the browser, inside the end user's inbox web application

To better understand req-res cycles, let's display the above description on a diagram:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/AWS+SES+API.png)

This is how we want AWS SES API to work **in more detail**:

-   On the browser, a new end user clicks the `LoginButton` component on the `Login` page of our web application
    
-   This triggers an entire cascades of redirects, methods, and req-res cycles
    
-   Eventually, the static method `signInOrSignUpViaGoogle` of our User model gets called
    
-   Inside the `signInOrSignUpViaGoogle` method, we will call two methods: `getEmailTemplate` and `sendEmail`
    
-   `getEmailTemplate` will search for the welcome email template inside the `emailtemplates` collection of our MongoDB database
    
-   if `getEmailTemplate` successfully finds the welcome email template, it adds variable parameters to the template (in our case, the user's `displayName`)
    
-   next, the `sendEmail` method gets called with multiple arguments (email template is one of those arguments)
    
-   `sendEmail` calls the `ses.sendEmail` AWS SES API method:
    
    [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property)
    
-   `ses.sendEmail` sends a request with the `POST method` from our `API` server to the AWS SES server
    
-   The AWS SES server sends an email to an Email server. In our case, it is Gmail server.
    
-   A newly signed-up user finds our welcome email inside their inbox web application on the browser. In our case, we will be checking our Gmail inbox on the browser.
    

In the next few subsection of this section, we will implement every step from the above detailed description.

___

#### EmailTemplate model, insertTemplates and getEmailTemplate methods [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#emailtemplate-model-inserttemplates-and-getemailtemplate-methods)

In this section, we will define a new Mongoose model: `EmailTemplate`. At this point, our MongoDB database has two collections: `users` and `sessions`. We defined our `User` model in `book/6-begin/api/server/models/User.ts`, and that is why we have a `users` collection. The `express-session` package creates a `sessions` collection without us explicitly defining a schema and model for `Session`.

No need for us to reinvent the wheel. Let's open our `book/6-begin/api/server/models/User.ts` file and visually ignore the part that defines static methods and types for static methods:

```
import * as mongoose from 'mongoose';

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
}

// static methods

const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);

export default User;
```

As you can see from above, besides defining static methods and types, we:

-   defined `mongoSchema`
-   defined and exported `UserDocument` document
-   defined and exported `User` model

Since our `EmailTemplate` model will have no static methods, there is **no** reason for us to define `EmailTemplateClass` and there is **no** reason for us to call:

```
mongoSchema.loadClass(EmailTemplateClass);
```

So let's only achieve the following three goals for our `EmailTemplate` model:

-   define `mongoSchema`
-   define and export `EmailTemplateDocument` document
-   define and export `EmailTemplate` model

Create a new file `book/6-begin/api/server/models/EmailTemplate.ts` and add the following content to it:

```
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

const mongoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

interface EmailTemplateDocument extends mongoose.Document {
  name: string;
  subject: string;
  message: string;
}

const EmailTemplate = mongoose.model<EmailTemplateDocument>('EmailTemplate', mongoSchema);
```

The `EmailTemplate` document in our database and the corresponding JS object on our `API` server will have only three parameters, all of them with the `string` data type and a unique `name` parameter.

Email and name S3 bucket AWS dashboard add environmental variable mount middleware At AWS dashboard send this response withAuth HOC mount middleware session Navigate to in this book discussion open this file. API method subsection static method calls Google OAuth API new Express route request was sent. In this book decorate method with action compiles request data model API method Click on the button subsection session Google OAuth API. Triggers method production-ready add environmental variable it works as expected if truthy then compiles on the client on the client list of posts Material-UI end user. AWS dashboard end user in a browser show notification At AWS dashboard data model end user. On the client HTTP MongoDB database session page component page component request was sent add environmental variable API infrastructure in a browser API method calls corresponding store method. In production S3 bucket AWS dashboard API method triggers method in production server-side rendering. Response request MongoDB database We will discuss in this book team members We will discuss store method calls triggers method in a browser open this file data model API method. HTTP if truthy then data model Navigate to page component request was sent send this response HTTP AWS dashboard check if value is truthy API method calls corresponding store method data model Remember to add import. Next.js web application static method calls decorate method with action session add environmental variable static method calls discussion it works as expected discussion.

In this book, we hardcode email templates into the code. When you start your `API` server (either locally or in production), our goal is to make the `API` server insert these hardcoded templates into our MongoDB database. We need to define a method to do this. Here is how we define an `insertTemplates` method:

```
async function insertTemplates() {
  const templates = [
    {
      name: 'welcome',
      subject: 'Welcome to SaaS by Async',
      message: `<%= userName %>,
        <p>
          Thanks for signing up on our <a href="https://github.com/async-labs/saas" target="blank">SaaS boilerplate</a>!
        </p>
        <p>
          If you are learning how to build a SaaS web app, check out our two books:
           <a href="https://builderbook.org" target="blank">Builder Book</a>
           and
           <a href="https://builderbook.org/book" target="blank">SaaS Boilerplate</a>.
        </p>
        <p>
          Also check out
          <a href="https://async-await.com" target="blank"> Async</a>
          , our communication tool for small teams of software developers.
        </p>
        Kelly & Timur, Team Async
      `,
    },
  ];

  for (const t of templates) {
    const et = await EmailTemplate.findOne({ name: t.name });

    const message = t.message
      .replace(/\n/g, '')
      .replace(/[ ]+/g, ' ')
      .trim();

    if (!et) {
      EmailTemplate.create(Object.assign({}, t, { message }));
    } else if (et.subject !== t.subject || et.message !== message) {
      EmailTemplate.updateOne({ _id: et._id }, { $set: { message, subject: t.subject } }).exec();
    }
  }
}
```

As you can see, `templates` is an `array` of objects. Currently, this array has only one object that corresponds to the welcome email. These objects from the `templates` array are used to create corresponding MongoDB documents in our database. Eventually, by the end of this book, you will have a total of four templates with the following names: `welcome`, `login`, `invitation`, and `newPost`.

You are already familiar with how `if..else` syntax works from Chapter 4 and Chapter 5. In the above code, we use `if...else` like this:

```
if (!et) {
  EmailTemplate.create(Object.assign({}, t, { message }));
} else if (et.subject !== t.subject || et.message !== message) {
  EmailTemplate.updateOne({ _id: et._id }, { $set: { message, subject: t.subject } }).exec();
}
```

If our `API` server does not find an `EmailTemplate` document in our database by name, then the `API` server will create a new MongoDB document using Mongoose's API method `Model.create`. We already discussed this method in Chapter 5 when we used it to create a new `User` document inside the static method `signInOrSignUpViaGoogle` (check up `book/6-begin/api/server/models/User.ts` file).

But if our `API` server does find an `EmailTemplate` document by name, then the `API` server will update the document's `message` and `subject` providing they have different values from the ones defined inside the `templates` array.

You are familiar with `if..else` syntax, but we have not used `for...of` syntax in this book:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)

If `iterable` is `array`, then `for...of` works like this:

```
const iterable = [10, 20, 30];

for (const value of iterable) {
  console.log(value);
}
// 10
// 20
// 30
```

`console.log(value)` runs multiple times. In the above example, it runs three times. In our case, it will run as many times as the number of email templates. We will ultimately have four email templates in our boilerplate, meaning `console.log(value)` will run four times. By the end of this section, it will only run one time, since we will only have the single welcome email template inside `templates`.

The code inside `for...of` will run for **every** template inside the `templates` array:

```
const et = await EmailTemplate.findOne({ name: t.name });

const message = t.message
  .replace(/\n/g, '')
  .replace(/[ ]+/g, ' ')
  .trim();

if (!et) {
  EmailTemplate.create(Object.assign({}, t, { message }));
} else if (et.subject !== t.subject || et.message !== message) {
  EmailTemplate.updateOne({ _id: et._id }, { $set: { message, subject: t.subject } }).exec();
}
```

So for every template inside the array, our `API` server will attempt to find the MongoDB document by name. Our `API` server will then either create a new document or update an existing document in case `message` or `subject` values do not match between hardcoded data and database data.

Alright, we defined our `EmailTemplate` model and `insertTemplates` method. Next, let's define a method that finds email templates in our database by name and then replaces variables with corresponding values. Let's call this method `getEmailTemplate`. It should accept `name` and `params` objects as arguments, and it should be exported:

```
export default async function getEmailTemplate(name: string, params: any) {
  await insertTemplates();

  const et = await EmailTemplate.findOne({ name }).setOptions({ lean: true });

  if (!et) {
    throw new Error('Email Template is not found in database.');
  }

  return {
    message: _.template(et.message)(params),
    subject: _.template(et.subject)(params),
  };
}
```

Note that we want to insert missing templates or update edited templates in database **before** sending an actual email. One way to achieve is to call `insertTemplates` inside `getEmailTemplate`. This is exactly what we did.

You are familiar with most of the syntax in the above definition of a method. You already prepended `export default` to an export model or function/method. You already used the `lean` option (Chapter 4) to strip off metadata and methods from a MongoDB document and return lean plain JS object. You are familiar with the usage of `if`, `if...else`, and `if...else if`.

It is worth noting two places inside the definition of the `getEmailTemplate` method:

1.  If we knew for sure that all parameters inside the `params` object would be a `string` type, then we could have written:
    
    ```
     params: { userName: string; }
    ```
    
    Instead of
    
    ```
     params: any
    ```
    
    But we are not sure what other user data we, as developers, will include in our email. Some of those parameters might be `boolean` type. For example, in the future our email may tell an end user if they signed up via Google. In that case, we could include a boolean `isSignedupViaGoogle` parameter into `params`.
    
    VS code editor highlights `any` with a warning, because TypeScript wants to assign a more specific type:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-20+08-57-57.png)
    
    More on this warning:
    
    [https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md)
    
    Whenever possible, we will indicate a specific type, but in a few places where usage may evolve over time, we will use `any`.
    
    To remove this warning, we have to disable a corresponding rule. Open `book/6-begin/api/.eslintrc.js` and add a new line, like so:
    
    ```
     '@typescript-eslint/no-unused-vars': 'off',
     '@typescript-eslint/explicit-function-return-type': 'off',
     "@typescript-eslint/no-explicit-any": "off",
    ```
    
    We actually disabled this warning earlier, but we did so in our `APP` project when we worked on the `MenuWithLinks` component in Chapter 2. Now we are disabling the warning for our `API` project.
    
2.  You are already familiar with the `lodash` package. In Chapter 4, we used the `_.kebaCase` utility method, and in Chapter 5 we used the `_.pick` utility method. In this section, we use another utility method from the `lodash` library, `_.template`:
    
    [https://lodash.com/docs/4.17.15#template](https://lodash.com/docs/4.17.15#template)
    
    It works like this:
    
    ```
     var compiled = _.template('hello <%= user %>!');
     compiled({ 'user': 'fred' });
     // => 'hello fred!'
    ```
    
    We used this utility method to return an object like this:
    
    ```
     return {
       message: _.template(et.message)(params),
       subject: _.template(et.subject)(params),
     };
    ```
    
    In other words, we are replacing variables inside `message` and `subject` with corresponding values. Our welcome email template has a `userName` variable. Let's look closely at the welcome email template:
    
    ```
     {
       name: 'welcome',
       subject: 'Welcome to SaaS by Async',
       message: `<%= userName %>,
         <p>
           Thanks for signing up on our <a href="https://github.com/async-labs/saas" target="blank">SaaS boilerplate</a>!
         </p>
         <p>
           If you are learning how to build a SaaS web app, check out our two books:
           <a href="https://builderbook.org" target="blank">Builder Book</a>
           and
           <a href="https://builderbook.org/book" target="blank">SaaS Boilerplate</a>.
         </p>
         <p>
           Also check out
           <a href="https://async-await.com" target="blank"> Async</a>
           , our communication tool for small teams of software developers.
         </p>
         Kelly & Timur, Team Async
       `,
     },
    ```
    
    By calling `_.template(et.message)(params)`, we replace `<%= userName %>` with an actual value. Later in this section, we will call `getEmailTemplate` inside the static method `signInOrSignUpViaGoogle` and pass `userName: displayName` as an argument to the `getEmailTemplate` method.
    
    Although there are no variables inside `subject` of our welcome email template, we still have `subject: _.template(et.subject)(params)` in our code, just in case other email templates should have variables inside `subject`.
    

If you put all the above code together, the content of `book/6-begin/api/server/models/EmailTemplate.ts` should be:

```
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

interface EmailTemplateDocument extends mongoose.Document {
  name: string;
  subject: string;
  message: string;
}

const EmailTemplate = mongoose.model<EmailTemplateDocument>(
  'EmailTemplate',
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  }),
);

export async function insertTemplates() {
  const templates = [
    {
      name: 'welcome',
      subject: 'Welcome to SaaS boilerplate by Async',
      message: `Welcome <%= userName %>,
        <p>
          Thanks for signing up on our <a href="https://github.com/async-labs/saas" target="blank">SaaS boilerplate</a>!
        </p>
        <p>
          If you are learning how to build a SaaS web app, check out our 2 books:
           <a href="https://builderbook.org" target="blank">Builder Book</a>
           and
           <a href="https://builderbook.org/book" target="blank">SaaS Boilerplate</a>.
        </p>
        <p>
          Also check out
          <a href="https://async-await.com" target="blank"> Async</a>
          , our communication tool for small teams of software developers.
        </p>
        Kelly & Timur, Team Async
      `,
    },
  ];

  for (const t of templates) {
    const et = await EmailTemplate.findOne({ name: t.name });
    const message = t.message
      .replace(/\n/g, '')
      .replace(/[ ]+/g, ' ')
      .trim();

    if (!et) {
      EmailTemplate.create(Object.assign({}, t, { message }));
    } else if (et.subject !== t.subject || et.message !== message) {
      EmailTemplate.updateOne({ _id: et._id }, { $set: { message, subject: t.subject } }).exec();
    }
  }
}

export default async function getEmailTemplate(name: string, params: any) {
  await insertTemplates();

  const et = await EmailTemplate.findOne({ name }).setOptions({ lean: true });

  if (!et) {
    throw new Error('Email Template is not found in database.');
  }

  return {
    message: _.template(et.message)(params),
    subject: _.template(et.subject)(params),
  };
}
```

Note that we called `insertTemplates` like we would call any other asynchronous function:

```
await insertTemplates();
```

Call from inside `getEmailTemplate` method like so:

```
export default async function getEmailTemplate(name: string, params: any) {
  await insertTemplates();

  const et = await EmailTemplate.findOne({ name }).setOptions({ lean: true });

  if (!et) {
    throw new Error('Email Template is not found in database.');
  }

  return {
    message: _.template(et.message)(params),
    subject: _.template(et.subject)(params),
  };
}
```

Since you, as a developer, may change or add email templates, and you want to send end user most recent version of email template - we called `insertTemplates` method inside `getEmailTemplate` method, see the above definition of `getEmailTemplate` method, line `await insertTemplates();`.

Every time you start your `API` server, either locally or in production, `API` will execute the `insertTemplates` method and insert hardcoded email templates into the `emailtemplates` collection of your connected database. In our case, it would be the `test.emailtemplates` collection. To call `insertTemplate` method on `API` server's start, open `book/6-begin/api/server/server.ts`, import `insertTemplates` method and call it like so after server connects to database:

```
import './env';
import * as mongoSessionStore from 'connect-mongo';
import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import * as mongoose from 'mongoose';

import api from './api';
import { setupGoogle } from './google-auth';

import { insertTemplates } from './models/EmailTemplate';

mongoose.connect(process.env.MONGO_URL_TEST);

insertTemplates();

const server = express();

server.use(cors({ origin: process.env.URL_APP, credentials: true }));

server.use(express.json());

const MongoStore = mongoSessionStore(session);

const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
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

We have now written enough code to test:

-   Go to your MongoDB Atlas dashboard. Look at your collections and note that there is no `test.emailtemplates` collection in your `test` database:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+09-09-24.png)
    
    The only two collections in the `test` database are `users` and `sessions`.
    
-   Go to `book/6-begin/api`. Start your `API` server with `yarn dev`.
    
-   Refresh the tab with your MongoDB Atlas dashboard. Find a newly created `EmailTemplate` MongoDB document:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+09-13-10.png)
    
    The value of `name`, `subject`, and `message` match those of the hardcoded email template. That means our `insertTemplates` method works as expected.
    

Here are some bonus tests you can run by yourself:

-   On your MongoDB Atlas dashboard, you can manually delete either the `EmailTemplate` document or `test.emailtemplates` collection. Then you can either import and call restart your `API` server and see that `API` recreates both the document and collection.
-   On your MongoDB Atlas dashboard, you can manually edit `Thanks for signing up` to `Thank you for signing up` inside the `message` parameter. Then restart your `API` server and see that `API` updates the value of `message` to match the hardcoded value. The `message` will be edited back to `Thanks for signing up`.

Important to keep in mind while testing is that restarting server will only work when you call `instertTemplates` method inside `api/server/server.ts` file. Otherwise, you have to call `getEmailTemplate`, which will trigger `insertTemplates` method.

You can comment out or delete code related to `insertTemplates` from `book/6-begin/api/server/server.ts`. Every time our application calls `getEmailTemplate` method, `insertTemplates` method will be called as well.

In the next section, we will import this `getEmailTemplate` method to our `User` model and call it inside the static method `signInOrSignUpViaGoogle`.

___

#### Adding getEmailTemplate and sendEmail to signInOrSignUpViaGoogle [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#adding-getemailtemplate-and-sendemail-to-signinorsignupviagoogle)

In order to successfully send a welcome email to a newly signed-up user, we have to call two methods inside our `signInOrSignUpViaGoogle` static method:

1.  `getEmailTemplate` method to find and retrieve the welcome email template from our database and then and populate a user's `displayName` in this template.
2.  `sendEmail` method that passes the welcome email template and user's email addresss to AWS SES's API method `ses.sendEmail` and calls it.

In this subsection, we will import and call `getEmailTemplate` and `sendEmail` methods to the `signInOrSignUpViaGoogle` static method of our `User` model. We defined the `getEmailTemplate` method in the previous subsection. We will define the `sendEmail` method in the next subsection.

This is how we will import and call `getEmailTemplate`:

```
import getEmailTemplate from './EmailTemplate';

// some code

const emailTemplate = await getEmailTemplate('welcome', { userName: displayName });

if (!emailTemplate) {
  throw new Error('Welcome email template not found');
}
```

This is how we will import and call `sendEmail` (which is asynchronous):

```
import sendEmail from '../aws-ses';

// some code

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
```

Open `book/6-begin/api/server/models/User.ts` and find the definition of `signInOrSignUpViaGoogle`. Update like so:

```
public static async signInOrSignUpViaGoogle({
  googleId,
  email,
  displayName,
  avatarUrl,
  googleToken,
}) {
  const user = await this.findOne({ email })
    .select([...this.publicFieldsignInOrSignUpViaGoogle
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

  return _.pick(newUser, this.publicFields());
}
```

As you can see, we added new code **after** our `API` server creates a new `User` document in our database. There is no sense in sending an email to newly signed-up user if our `API` server fails to create a new `User` document.

Remember to update the import section of the file:

```
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import sendEmail from '../aws-ses';
import { generateSlug } from '../utils/slugify';
import getEmailTemplate from './EmailTemplate';
```

___

#### sendEmail method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#sendemail-method)

Time to define the server-side method `sendEmail`. This is not our first AWS API service. In Chapter 4, we implemented the `signRequestForUpload` server-side method that in turn called the `s3.getSignedUrl` AWS S3 API method. No reason for us to reinvent the wheel - let's remember how we did. Open `book/6-begin/api/server/aws-s3.ts` and look at how we defined the `signRequestForUpload` method:

```
const s3 = new aws.S3({
  apiVersion: 'latest',
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
});

return new Promise((resolve, reject) => {
  s3.getSignedUrl('putObject', params, (err, data) => {
    const parsedUrl = url.parse(data);

    const returnData = {
      signedRequest: data,
      url: `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`,
    };

    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve(returnData);
    }
  });
});
```

As you can see, we first configured `s3` service by calling `aws.S3` with four required parameters: `apiVersion`, `region`, `accessKeyId`, and `secretAccessKey`. Second, we called the `s3.getSignedUrl` method that sends a request to AWS S3's server and receives `returnData` that contains `signedRequest`, which we need to actually upload a file to an S3 bucket.

Compiles Put it all together team members on the client At AWS dashboard request Navigate to triggers method. S3 bucket send this response session add environmental variable decorate method with action discussion session show notification. In production server-side rendering this chapter new Express route Click on the button. Conditional operator this chapter Remember to add import Click on the button if truthy then end user cookie discussion on server only if truthy then withAuth HOC. On server only on server only team members end user S3 bucket session send this response if truthy then on server only At AWS dashboard it works as expected on the client. Team Leader discussion response subsection open this file Navigate to subsection compiles At AWS dashboard on server only Navigate to. Team members in this book on server only Google OAuth API compiles new Express route on server only it works as expected end user response. Put it all together API method add environmental variable static method calls static method calls request was sent it works as expected list of posts API method. Team Leader Remember to add import Remember to add import email and name in a browser on server only request was sent You already learned. Production-ready in a browser in production team members Next.js web application request new Express route team members HTTP.

The definition of `sendEmail` is similar to the definition of `signRequestForUpload`:

-   First, we configure `ses` service instead of `s3` service with:
    
    ```
      const ses = new aws.SES({
        apiVersion: 'latest',
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY,
      });
    ```
    
-   Second, we call `ses.sendEmail` instead of `s3.getSignedUrl`. And in the case of a non-error response from AWS SES's server, we call `resolve(info)` instead of `resolve(returnData)`:
    
    ```
      return new Promise((resolve, reject) => {
        ses.sendEmail(
          {
            Source: options.from,
            Destination: {
              CcAddresses: options.cc,
              ToAddresses: options.to,
            },
            Message: {
              Subject: {
                Data: options.subject,
              },
              Body: {
                Html: {
                  Data: options.body,
                },
              },
            },
            ReplyToAddresses: options.replyTo,
          },
          (err, info) => {
            if (err) {
              reject(err);
            } else {
              resolve(info);
            }
          },
        );
      });
    ```
    
    Unlike the `s3.getSignedUrl` AWS S3 API method, which accepts multiple arguments (such as `randomStringForPrefix`, `bucket`, `fileName`, etc) relevant to generating a unique `signedRequest`:
    
    [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property)
    
    the `ses.sendEmail` AWS SES API method accepts an object as its argument:
    
    [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property)
    
    This object has required parameters such as `Source`, `Destination`, and `Message`, as well as optional parameters like `ReplyToAddresses`. The meaning of these four parameters are self-explanatory. `Source` is the email address that sends an email, `Destination` is the destination and cc email addresses, `Message` is email's subject and body, and `ReplyToAddresses` is an email address to which replies from the recipient will be sent.
    

Put the above two code blocks together into a new file called `book/6-begin/api/server/aws-ses.ts`:

```
import * as aws from 'aws-sdk';

export default function sendEmail(options) {
  const ses = new aws.SES({
    apiVersion: 'latest',
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY,
  });

  return new Promise((resolve, reject) => {
    ses.sendEmail(
      {
        Source: options.from,
        Destination: {
          CcAddresses: options.cc,
          ToAddresses: options.to,
        },
        Message: {
          Subject: {
            Data: options.subject,
          },
          Body: {
            Html: {
              Data: options.body,
            },
          },
        },
        ReplyToAddresses: options.replyTo,
      },
      (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      },
    );
  });
}
```

___

#### Setting up AWS SES and EMAIL\_SUPPORT\_FROM\_ADDRESS [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#setting-up-aws-ses-and-email_support_from_address)

In Chapter 4, we already set up AWS S3 service. We found values for `AWS_REGION`, `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` environmental variables. On your AWS S3 dashboard, you created a new bucket and set up permissions, such as `CORS`. The name of the bucket you created is the value for the `NEXT_PUBLIC_BUCKET_FOR_AVATARS` environmental variable.

To set up SES service, we need to do following on our AWS dashboard:

-   To verify a domain
-   To verify an email address that you will pass as `Source`.
-   The verified email address from the previous step is the value for a new environmental variable called `EMAIL_SUPPORT_FROM_ADDRESS`, which we use here:
    
    ```
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
    ```
    

Go to your AWS dashboard and click `Services` in the top-left menu. Then find `Simple Email Service` from the dropdown:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-20-04.png)

Then click the `Domains` link on the left menu:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-26-24.png)

Then click `Verify a New Domain`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-32-53.png)

For us, the email address from which we want to send a welcome email to newly signed-up users is `team@builderbook.org`. So we had to verify the `builderbook.org` domain. Fill out the form using **your** domain and check the `Generate DKIM Settings` box:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-33-38.png)

You will receive instructions on what DNS records to create in order to verify your domain. If your domain's DNS records are hosted at AWS Route 53, then simply click `Use Route 53` to create all necessesary DNS records:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-37-29.png)

Since DNS records need time to propagate, AWS SES may take time to verify your domain.

Once verified, your domain will appear on the list of verified domains:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-39-35.png)

Next, after your domain is successfully verified, verify your email address. Click the `Email Addresses` link on the left menu:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-26-24.png)

Then click the `Verify a New Email Address` button and add **your** value to the form - the email address you intend to use for `Source` in your web application. In our case, this value is `team@builderbook.org`. Click `Verify This Email Address` and follow the instructions:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-44-21.png)

You will receive a verification email at the email address you intend to verify. Open the verification email and click the verification link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-48-44.png)

Once verified, your email address will appear on the list of verified email addresses:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-23+12-50-09.png)

Open `book/6-begin/api/.env` and add the new environmental variable:

```
EMAIL_SUPPORT_FROM_ADDRESS=team@builderbook.org
```

Remember to use the email address that **you** actually verified.

___

#### Testing AWS SES API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-aws-ses-api)

We are ready to test the entire AWS SES API infrastructure in our web application.

Since our web application sends a welcome email to newly signed-up users, you have to delete the `User` document from the `test.users` collection. Then, after starting both `APP` and `API`, you have to log in to your web application to execute the static method `signInOrSignUpViaGoogle`. This method will, in turn, execute the `getEmailTemplate` and `sendEmail` methods.

To properly test AWS SES API infrastructure:

-   Start both `APP` and `API` with `yarn dev`.
-   Make sure you are logged out.
-   Go to your MongoDB Atlas dashboard. Navigate to the `test.users` collection and delete the existing `User` document.
-   On your browser, go to `http://localhost:3000/login`.
-   Log in with your Google account.
-   Check your Gmail inbox.

Within a few seconds, you will receive an email with proper `subject`, `from`, and `message`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-24+12-57-54.png)

If you click the dropdown icon on Gmail's interface, you can see more details. For example, `mailed-by` has the value `amazonses.com` and `signed-by` has the value `builderbook.org`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-24+13-02-46.png)

That means the AWS SES server sent the email, and the email is signed by our website that we verified earlier.

Good job on integrating SaaS boilerplate with AWS SES service! You are welcome to change the email's subject and message to fit your business goals.

Page component At AWS dashboard if truthy then on server only show notification MongoDB database in this book list of posts You already learned request was sent. New Express route API method end user subsection in this book AWS dashboard cookie. On server only withAuth HOC You already learned Google OAuth API in production triggers method on the client open this file At AWS dashboard Put it all together data model API infrastructure. Email and name Remember to add import withAuth HOC compiles Put it all together it works as expected list of posts. S3 bucket request new Express route request if truthy then this chapter Next.js web application. Put it all together discussion Click on the button server-side rendering MongoDB database Team Leader subsection on the client open this file Google OAuth API At AWS dashboard API method calls corresponding store method open this file in production request was sent. Send this response Put it all together Click on the button send this response server-side rendering send this response send this response new Express route API method new Express route on the client show notification We will discuss team members. End user MongoDB database MongoDB database in a browser page component server-side rendering decorate method with action send this response MongoDB database. In a browser in a browser if truthy then store method calls Put it all together MongoDB database this chapter Put it all together. Add environmental variable if truthy then email and name response S3 bucket response Material-UI team members data model server-side rendering.

In the next section, we will introduce our second and last authentication method - passwordless.

___

## Passwordless OAuth API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#passwordless-oauth-api)

Our SaaS boilerplate already has an authentication method via Google OAuth API. We implemented this method in Chapter 5. Outsourcing authentication to Google is a no-brainer. You, as a developer, have a secure authentication method for your web application. Google has implementation for security features such as Google 2-Step Verification (also called two-step authentication in other services):

[https://www.google.com/landing/2step/](https://www.google.com/landing/2step/)

On the other hand, an end user of your web application has an easy way to sign up or log in to your web application.

As your business grows, you may want to make your SaaS product more independent and therefore implement a standalone authentication method with no participation of third-party servers such Google OAuth. In our SaaS product, Async, we initially offered authentication via Github but later switched to a standalone Passwordless method. We also relied more heavily on third-party [npm packages](https://www.npmjs.com/), but since Async's launch, we've been replacing some packages with our own code.

The Passwordless authentication method is not a perfect authentication method. An end user must ensure the security of their email account. In addition, Passwordless requires an end user to access their own email inbox, open the login email, and click the login link. This is easy to do on a desktop browser, but it's more work on a mobile browser. We also rely on two packages to implement Passwordless authentication in our SaaS boilerplate: `passwordless` and `passwordless-token`. You are welcome to study code in these packages and write your own code. For your business goals, these listed downsides may be acceptable; after all, your product gains a standalone authentication method.

As with any non-trivial API infrastructure in this book, we go through the following steps:

-   Describe infrastructure in English
-   Draw a diagram of the main req-res cycles
-   Use our description in English and our diagram to implement the infrastructure using TypeScript

This is how we want our Passwordless API to work, described in English:

-   An end user on our `Login` page enters their email address and clicks the `LOG IN WITH EMAIL` button (`action 1`).
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-04-28+09-57-45.png)
    
    Our `APP` code on the browser sends a request, `req1`, with the method POST and `email` to the `API` server at the Express route `/auth/email-login-link`.
    
-   Our `API` server uses `passwordless` and `passwordless-token` packages to do multiple things. Our `API` server generates a unique `token` and saves a `PasswordlessToken` MongoDB document to our database. This MongoDB document contains a hashed value for `token`. Our `API` server uses a popular `bcrypt` package to hash the `token` value. This `PasswordlessToken` MongoDB document will exist in our database until either the end user clicks the login link inside login email or 1 hour passes - whichever comes first.
    
-   Our`API` server, after creating the `token` and `PasswordlessToken` MongoDB document, generates a login link. The server also sends a request, `req3`, to the AWS SES server to send the login email to the end user's email address. The login email contains a login link thatthe end user has to click (`action 2`) to log in to our web application. The login link will expire in 1 hour (this is the default value in the `passwordless` package; you can modify it).
    
-   An end user receives the login email and clicks the login link inside the email. This sends a request, `req4`, with the `GET` method to our `API` server at the Express route `/auth/logged_in`. This request contains a unique `token` and `uid` - both values are part of the login link and were previously generated by our `API` server. The `uid` value is simply the id of the `PasswordlessToken` MongoDB document in our database.
    
-   Our `API` server uses the received `uid` to find a `PasswordlessToken` MongoDB document in our database. This document contains a hashed value for `token`. Our `API` server uses `bcrypt` again to hash the value of `token` received from `req4`. Our `API` server compares the hashed `token` value from our database with the hashed `token` value from `req4`. If they match, authentication succeeds, and `res4` redirects to `YourSettings` page. If they don't match, authentication fails, and `res4` has an error message (the end user stays on the `Login` page).
    

Now, let's put the main req-res cycles into one diagram:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Passwordless+API.png)

In the next subsections, we will "translate" the above English description to TypeScript. Our steps will be:

-   Configure passwordless
-   Define all required methods for `MongoStore` of `PasswordlessToken`
-   Create all necessary Express routes
-   Create a static method called `signUpByPasswordless` for our `User` model

___

#### Configure passwordless [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#configure-passwordless)

Similar to Google OAuth API, where the `passport` package does most of the heavy lifting for us, the `passwordless` package will do similar work for us in Passwordless API. In Chapter 5, you configured `passport` for Google OAuth API. In some ways, configuring `passwordless` is similar to configuring `passport`. Let's look at the official docs for `passwordless`:

[https://github.com/florianheinemann/passwordless](https://github.com/florianheinemann/passwordless)

And look at our configuration of `passport` from `book/6-begin/api/server/google-auth.ts`:

```
if (!process.env.GOOGLE_CLIENTID) {
  return;
}

// definition for verify function

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
```

So what's similar between `passwordless` and `passport`?

We have to initiate both of them.

`passport` with:

```
server.use(passport.initialize());
```

And `passwordless` with:

[https://github.com/florianheinemann/passwordless#4-initialize-passwordless](https://github.com/florianheinemann/passwordless#4-initialize-passwordless)

```
passwordless.init(mongoStore);
```

Another similarity - we have to make sure that the corresponding `session` object gets saved to the database. The saved `Session` MongoDB document should contain a user id (or any other unique identifier for the `User` document).

In Chapter 5, we discussed `session` and `cookie` concepts in detail. We learned that, in our setup, saving a `session` object to the database requires us to modify that `session` object. At the beginning of Chapter 5, we achieved this with a simple change:

```
//@ts-ignore
req.session.foo = 'bar';
```

The corresponding `Session` document had a `session` parameter with the value:

```
{"cookie":{"originalMaxAge":1209600000,"expires":"2020-04-15T20:00:43.967Z","secure":false,"httpOnly":true,"path":"/"},"foo":"bar"}
```

After we integrated `passport` with Express `session` in Chapter 5:

```
server.use(passport.session());
```

The corresponding `Session` document had a `session` parameter with the value:

```
{"cookie":{"originalMaxAge":1209600000,"expires":"2020-04-15T20:00:43.967Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"5e8b6b2f30802000170ef3a0"}}
```

In the above example, the value of `session.passport.user` is `5e8b6b2f30802000170ef3a0`, and it corresponds to the user id. `passport` uses this user id to find a specific `User` document and populate `req.user` with the corresponding `user` object on the `API` server.

Similar to `passport`, we can integrate `passwordless` with Express `session` with just one line of code:

[https://github.com/florianheinemann/passwordless#6-setup-the-middleware-for-express](https://github.com/florianheinemann/passwordless#6-setup-the-middleware-for-express)

```
server.use(passwordless.sessionSupport());
```

Later when we test the entire Passwordless API, you will see that the corresponding `Session` document in our database will have the `session` parameter with the value:

```
{"cookie":{"originalMaxAge":1209600000,"expires":"2020-04-15T20:00:43.967Z","secure":false,"httpOnly":true,"path":"/"},"passwordless":"5e90937855fb6c00172215f8"}
```

In the above example, the value of `session.passwordless` is `5e90937855fb6c00172215f8`, and it corresponds to the user id. `passwordless` uses this user id to populate `req.user` with the same value as user id.

One more similarity - `passport` and `passwordless` both populate `req.user` after an end user successfully authenticates. But, `passport` populates `req.user` with the `user` object and `passwordless` populates `req.user` with the `user.id` string.

In the case of `passport`, populating `req.user` with the `user` object is done with:

```
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

In the case of `passwordless`, in order to simplify our codebase, we should convert `req.user` with `user.id` to `req.user` with a `user` object. If we don't do this, we will have to write two versions of `getUserApiMethod` and many other methods that use `req.user` to accesss a user's data. We achieve this conversion with the following middleware:

```
server.use((req, __, next) => {
  if (req.user && typeof req.user === 'string') {
    User.findById(req.user, User.publicFields())
      .then((user) => {
        req.user = user;
        console.log('passwordless middleware');
        next();
      })
      .catch((err) => {
        next(err);
      });
  } else {
    next();
  }
});
```

After a successful authentication event with the passwordless method, the following statement `req.user && typeof req.user === 'string'` is `true` . This is because `passwordless` populates `req.user` with the user id:

[https://github.com/florianheinemann/passwordless#10-who-is-logged-in](https://github.com/florianheinemann/passwordless#10-who-is-logged-in)

As you can see, we used the Mongoose API method `findById` to find a `User` document in the database, get public fields, and populate `req.user` with a `user` object. We discussed the Mongoose API method `findById` and static method `publicFields` for our `User` model in Chapter 5, so you already know how these methods work.

Both

```
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

and

```
server.use((req, __, next) => {
  if (req.user && typeof req.user === 'string') {
    User.findById(req.user, User.publicFields())
      .then((user) => {
        req.user = user;
        console.log('passwordless middleware');
        next();
      })
      .catch((err) => {
        next(err);
      });
  } else {
    next();
  }
});
```

will run for every request after successful authentication via Google OAuth API or Passwordless API.

Besides `req.user`, there is one more difference between the configurations of `passport` and `passwordless`. In Passwordless API, our web application has to generate a unique login link and email this link to an end user. This login link, `loginURL`, contains a unique `token` and `uid`. The official docs for `paswordless` ask us, as developers, to define a `passwordless.addDelivery` method. This is where we add code that sends a login email to an end user. Since we just imlemented AWS SES API, we will use our `getEmailTemplate` and `sendEmail` methods. But instead of specifying a `welcome` email template, we will specify a `login` email template:

```
passwordless.addDelivery(async (tokenToSend, uidToSend, recipient, callback) => {
  try {
    const template = await getEmailTemplate('login', {
      loginURL: `${
        process.env.URL_API
      }/auth/logged_in?token=${tokenToSend}&uid=${encodeURIComponent(uidToSend)}`,
    });

    await sendEmail({
      from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
      to: [recipient],
      subject: template.subject,
      body: template.message,
    });

    callback();
  } catch (err) {
    console.error('Email sending error:', err);
    callback(err);
  }
});
```

Since we haven't specified a `ttl` value, the login link will expire in 1 hour:

[https://github.com/florianheinemann/passwordless#modify-lifetime-of-a-token](https://github.com/florianheinemann/passwordless#modify-lifetime-of-a-token)

Next, let's add a `login` template to our `templates` array. Open `book/6-begin/api/server/models/EmailTemplate.ts` and update the `templates` array to become:

```
const templates = [
  {
    name: 'welcome',
    subject: 'Welcome to SaaS boilerplate by Async',
    message: `Welcome <%= userName %>,
      <p>
        Thanks for signing up on our <a href="https://github.com/async-labs/saas" target="blank">SaaS boilerplate</a>!
      </p>
      <p>
        If you are learning how to build a SaaS web app, check out our 2 books:
          <a href="https://builderbook.org" target="blank">Builder Book</a>
          and
          <a href="https://builderbook.org/book" target="blank">SaaS Boilerplate</a>.
      </p>
      <p>
        Also check out
        <a href="https://async-await.com" target="blank"> Async</a>
        , our communication tool for small teams of software developers.
      </p>
      Kelly & Timur, Team Async
    `,
  },
  {
    name: 'login',
    subject: 'Login link for saas-app.async-await.com',
    message: `
      <p>Log into your account by clicking on this link: <a href="<%= loginURL %>"><%= loginURL %></a>.</p>`,
  },
];
```

As you know from Chapter 5, in the actual email message, `<%= loginURL %>` will be replaced with an actual login link. It will look something like this:

```
http://localhost:3000/auth/logged_in?token=BTL9i2Q8o73qUMtfzABaC6&uid=5df94063e810dc277f7e54ea
```

You may wonder why we have these differences in how `req.user` is populated and in initiation (`server.use(passport.initialize())` vs `passwordless.init(mongoStore)`). Both are due to the fact that `passport` and `passwordless` have different authors. And we, as developers, have to use these packages in accordance with official documentation. Later in this section, when we work on `MongoStore` for the `PasswordlessToken` model, we will have to use older ES (ECMAScript) syntax to make `passwordless` work properly.

Create a new file, `book/6-begin/api/server/passwordless-auth.ts`, and add all the code we discussed in this section so far:

```
import * as passwordless from 'passwordless';

import sendEmail from './aws-ses';
import getEmailTemplate from './models/EmailTemplate';
import User from './models/User';
import PasswordlessMongoStore from './passwordless-token-mongostore';

function setupPasswordless({ server }) {
  const mongoStore = new PasswordlessMongoStore();

  passwordless.addDelivery(async (tokenToSend, uidToSend, recipient, callback) => {
    try {
      const template = await getEmailTemplate('login', {
        loginURL: `${
          process.env.URL_API
        }/auth/logged_in?token=${tokenToSend}&uid=${encodeURIComponent(uidToSend)}`,
      });

      await sendEmail({
        from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [recipient],
        subject: template.subject,
        body: template.message,
      });

      callback();
    } catch (err) {
      console.error('Email sending error:', err);
      callback(err);
    }
  });

  passwordless.init(mongoStore);
  server.use(passwordless.sessionSupport());

  server.use((req, __, next) => {
    if (req.user && typeof req.user === 'string') {
      User.findById(req.user, User.publicFields())
        .then((user) => {
          req.user = user;
          console.log('passwordless middleware');
          next();
        })
        .catch((err) => {
          next(err);
        });
    } else {
      next();
    }
  });

  // Express routes
}

export { setupPasswordless };
```

The only part that we have not discussed is:

```
import PasswordlessMongoStore from './passwordless-token-mongostore';

// some code

const mongoStore = new PasswordlessMongoStore();

// some code

passwordless.init(mongoStore);
```

What is this `mongoStore`?

When our `API` server sends a login email with a unique login link to an end user, the `API` server has to store a `token` value until the end user clicks the link. After the end user clicks the link, our `API` server compares the stored `token` value with the `token` value received from the browser (when the end user clicks the link, the browser sends a request that contains a `token` value as a part of the `req.query`). If these values match, then our `API` server knows that the user is not an imposter and grants successful authentication.

Where does our `API` server store `token` values? Storing a `token` value in the server's memory is unreliable, as the server may get restarted or clogged with requests. Since our `API` server is already connected to our MongoDB database, our `API` server can save `token` and other relevant information to the connected database. The database is a much more reliable store for `token` than the server's memory.

Cookie subsection discussion production-ready Next.js web application store method calls Team Leader HTTP if truthy then cookie compiles on the client. Email and name store method calls production-ready Put it all together session MongoDB database server-side rendering open this file Click on the button page component new Express route API method calls corresponding store method. We will discuss compiles request was sent HTTP API method calls corresponding store method withAuth HOC request was sent end user session. Production-ready At AWS dashboard conditional operator if truthy then in this book email and name if truthy then on server only Click on the button check if value is truthy send this response subsection. Add environmental variable data model in production discussion HTTP on server only Material-UI request was sent conditional operator send this response request API method data model. Material-UI response mount middleware response new Express route team members in a browser. On server only At AWS dashboard Material-UI Click on the button this chapter new Express route new Express route API infrastructure request was sent Google OAuth API Google OAuth API email and name HTTP. API method if truthy then store method calls compiles store method calls static method calls HTTP cookie. Decorate method with action Put it all together S3 bucket if truthy then on server only Next.js web application check if value is truthy server-side rendering check if value is truthy. API method new Express route Remember to add import triggers method if truthy then Navigate to request.

In the next subsection, we will define `MongoStore` for the `PasswordlessToken` model - a set of methods that CRUD (create, read, update and delete) the `PasswordlessToken` document in our MongoDB database. We have to define these methods for the `passwordless` package to work properly. For example, `passwordless` needs to save a `PasswordlessToken` document to our database after sending an email and then delete this document either after an end user clicks on the login link or after 1 hour, whatever comes first.

___

#### Configure passwordless token [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#configure-passwordless-token)

As mentioned a bit earlier, storing `token` in your MongoDB database is way more reliable than storing it in the server's memory.

The `passwordless` package does almost all heavy lifting in our Passwordless API, but we still have to:

-   Configure `passwordless` (done)
-   Define all required methods for CRUDing the `PasswordlessToken` document in our MongoDB database
-   Define the static method `signUpByPasswordless` for our User model

`passwordless` requires us to define a set of methods that `passwordless` uses to CRUD the `PasswordlessToken` document in our MongoDB database. Here is a list and description of these methods:

[https://github.com/florianheinemann/passwordless-tokenstore/blob/master/lib/tokenstore.js](https://github.com/florianheinemann/passwordless-tokenstore/blob/master/lib/tokenstore.js)

Here is the code from the above page:

```
'use strict';

function TokenStore() {

}

/**
 * Checks if the provided token / user id combination exists and is
 * valid in terms of time-to-live. If yes, the method provides the 
 * the stored referrer URL if any. 
 * @param  {String}   token to be authenticated
 * @param  {String}   uid Unique identifier of an user
 * @param  {Function} callback in the format (error, valid, referrer).
 * In case of error, error will provide details, valid will be false and
 * referrer will be null. If the token / uid combination was not found 
 * found, valid will be false and all else null. Otherwise, valid will 
 * be true, referrer will (if provided when the token was stored) the 
 * original URL requested and error will be null.
 */
TokenStore.prototype.authenticate = function(token, uid, callback) {
    throw new Error('TokenStore shall never be called in its abstract form');
}

/**
 * Stores a new token / user ID combination or updates the token of an
 * existing user ID if that ID already exists. Hence, a user can only
 * have one valid token at a time
 * @param  {String}   token Token that allows authentication of _uid_
 * @param  {String}   uid Unique identifier of an user
 * @param  {Number}   msToLive Validity of the token in ms
 * @param  {String}   originUrl Originally requested URL or null
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
TokenStore.prototype.storeOrUpdate = function(token, uid, msToLive, originUrl, callback) {
    throw new Error('TokenStore shall never be called in its abstract form');
}

/**
 * Invalidates and removes a user and the linked token
 * @param  {String}   uid User ID for which the record shall be removed
 * @param  {Function} callback called with callback(error) in case of an
 * error or as callback() if the uid was successully invalidated
 */
TokenStore.prototype.invalidateUser = function(uid, callback) {
    throw new Error('TokenStore shall never be called in its abstract form');
}

/**
 * Removes and invalidates all token
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() otherwise
 */
TokenStore.prototype.clear = function(callback) {
    throw new Error('TokenStore shall never be called in its abstract form');
}

/**
 * Number of tokens stored (no matter the validity)
 * @param  {Function} callback Called with callback(null, count) in case
 * of success or with callback(error) in case of an error
 */
TokenStore.prototype.length = function(callback) {
    throw new Error('TokenStore shall never be called in its abstract form');
}

module.exports = TokenStore;
```

So, as you can see, we have to define at least five methods:

-   `authenticate`
-   `storeOrUpdate`
-   `invalidateUser`
-   `clear`
-   `length`

The same author also provides an example of how to define these methods for our MongoDB case:

[https://github.com/florianheinemann/passwordless-mongostore/blob/master/lib/mongostore.js](https://github.com/florianheinemann/passwordless-mongostore/blob/master/lib/mongostore.js)

Code from the example:

```
'use strict';

var util = require('util');
var bcrypt = require('bcrypt');
var TokenStore = require('passwordless-tokenstore');
var MongoClient = require('mongodb').MongoClient;

/**
 * Constructor of MongoStore
 * @param {String} connection URI as defined by the MongoDB specification. Please 
 * check the documentation for details: 
 * http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html 
 * @param {Object} [options] Combines both the options for the MongoClient as well
 * as the options for MongoStore. For the MongoClient options please refer back to
 * the documentation. MongoStore understands the following options: 
 * (1) { mongostore: { collection: string }} to change the name of the collection
 * being used. Defaults to: 'passwordless-token'
 * @constructor
 */
function MongoStore(connection, options) {
    if(arguments.length === 0 || typeof arguments[0] !== 'string') {
        throw new Error('A valid connection string has to be provided');
    }

    TokenStore.call(this);

    this._options = options || {};
    this._collectionName = 'passwordless-token';
    if(this._options.mongostore) {
        if(this._options.mongostore.collection) {
            this._collectionName = this._options.mongostore.collection;
        }
        delete this._options.mongostore;
    }

    this._uri = connection;
    this._db = null;
    this._collection = null;
}

util.inherits(MongoStore, TokenStore);

/**
 * Checks if the provided token / user id combination exists and is
 * valid in terms of time-to-live. If yes, the method provides the 
 * the stored referrer URL if any. 
 * @param  {String}   token to be authenticated
 * @param  {String}   uid Unique identifier of an user
 * @param  {Function} callback in the format (error, valid, referrer).
 * In case of error, error will provide details, valid will be false and
 * referrer will be null. If the token / uid combination was not found 
 * found, valid will be false and all else null. Otherwise, valid will 
 * be true, referrer will (if provided when the token was stored) the 
 * original URL requested and error will be null.
 */
MongoStore.prototype.authenticate = function(token, uid, callback) {
    if(!token || !uid || !callback) {
        throw new Error('TokenStore:authenticate called with invalid parameters');
    }

    this._get_collection(function(collection) {
        collection.findOne({ uid: uid, ttl: { $gt: new Date() }}, 
            function(err, item) {
                if(err) {
                    callback(err, false, null);
                } else if(item) {
                    bcrypt.compare(token, item.hashedToken, function(err, res) {
                        if(err) {
                            callback(err, false, null);
                        } else if(res) {
                            callback(null, true, item.originUrl || "");
                        } else {
                            callback(null, false, null);
                        }
                    });

                } else {
                    callback(null, false, null);
                }
            }
        );
    });
};

/**
 * Stores a new token / user ID combination or updates the token of an
 * existing user ID if that ID already exists. Hence, a user can only
 * have one valid token at a time
 * @param  {String}   token Token that allows authentication of _uid_
 * @param  {String}   uid Unique identifier of an user
 * @param  {Number}   msToLive Validity of the token in ms
 * @param  {String}   originUrl Originally requested URL or null
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
MongoStore.prototype.storeOrUpdate = function(token, uid, msToLive, originUrl, callback) {
    if(!token || !uid || !msToLive || !callback) {
        throw new Error('TokenStore:storeOrUpdate called with invalid parameters');
    }
    this._get_collection(function(collection) {
        bcrypt.hash(token, 10, function(err, hashedToken) {
            if(err) {
                return callback(err);
            }

            var newRecord = {
                'hashedToken': hashedToken,
                'uid': uid,
                'ttl': new Date(Date.now() + msToLive),
                'originUrl': originUrl
            }

            // Insert or update
            collection.update( { 'uid': uid}, newRecord, {w:1, upsert:true}, function(err, result) {
                if(err) {
                    callback(err);
                } else {
                    callback();
                }
            });
        });
    });
}

/**
 * Invalidates and removes a user and the linked token
 * @param  {String}   user ID
 * @param  {Function} callback called with callback(error) in case of an
 * error or as callback() if the uid was successully invalidated
 */
MongoStore.prototype.invalidateUser = function(uid, callback) {
    if(!uid || !callback) {
        throw new Error('TokenStore:invalidateUser called with invalid parameters');
    }
    this._get_collection(function(collection) {
        collection.remove( { 'uid': uid}, {w:1}, function(err, result) {
            if(err) {
                callback(err);
            } else {
                callback();
            }
        });
    });
}

/**
 * Removes and invalidates all token
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
MongoStore.prototype.clear = function(callback) {
    if(!callback) {
        throw new Error('TokenStore:clear called with invalid parameters');
    }
    this._get_collection(function(collection) {
        collection.remove( {}, {w:1}, function(err, result) {
            if(err) {
                callback(err);
            } else {
                callback();
            }
        });
    });
}

/**
 * Number of tokens stored (no matter the validity)
 * @param  {Function} callback Called with callback(null, count) in case
 * of success or with callback(error) in case of an error
 */
MongoStore.prototype.length = function(callback) {
    this._get_collection(function(collection) {
        collection.count(callback);
    });
}

// some other methods that are used earlier and have to be defined

module.exports = MongoStore;
```

As you can see from the above example, we have to use older ES syntax:

```
function MongoStore(options = {}) {
  TokenStore.call(this);

  this._options = options || {};
}

util.inherits(MongoStore, TokenStore);
```

Instead of the newer ES6 syntax `class...extends` that you learned earlier when working on the `User` model:

[https://nodejs.org/api/util.html#util\_util\_inherits\_constructor\_superconstructor](https://nodejs.org/api/util.html#util_util_inherits_constructor_superconstructor)

```
class PasswordlessTokenClass extends mongoose.Model 
```

We also have to use older syntax for defining methods:

```
MongoStore.prototype.authenticate = async function()
```

Instead of the newer syntax:

```
public static async authenticate()
```

Below, let's define the five required methods:

1.  `authenticate`
2.  `storeOrUpdate`
3.  `invalidateUser`
4.  `clear`
5.  `length`

___

1.  The purpose of the `authenticate` method from the docs: "Checks if the provided token / user id combination exists and is valid in terms of time-to-live". Here is our definition for `authenticate`:
    
    ```
     MongoStore.prototype.authenticate = async function(token, uid, callback) {
       if (!token || !uid || !callback) {
         throw new Error('TokenStore:authenticate called with invalid parameters');
       }
    
       try {
         const tokenDoc = await PasswordlessToken.findOne({ uid, ttl: { $gt: new Date() } }).setOptions({
           lean: true,
         });
    
         if (tokenDoc) {
           const isMatch = await bcrypt.compare(token, tokenDoc.hashedToken);
           if (isMatch) {
             if (tokenDoc.email) {
               await User.signInOrSignUpByPasswordless({ uid, email: tokenDoc.email });
             }
    
             callback(null, true, tokenDoc.originUrl);
           } else {
             callback(null, false, null);
           }
         } else {
           callback(null, false, null);
         }
       } catch (error) {
         callback(error, false, null);
       }
     };
    ```
    
    Similar to the offical example for the `authenticate` method, we check if this method gets all necessary arguments. Then, we search our database for the `PasswordlessToken` document with matching `uid` and `ttl` that has not expired (the value of `ttl` must be greater than the current date):
    
    [https://docs.mongodb.com/manual/reference/operator/query/gt/](https://docs.mongodb.com/manual/reference/operator/query/gt/)
    
    If the `PasswordlessToken` document exists and contains the parameter `email` (for MongoDB, the exact term is `field`; for a JavaScript object, the exact term is `property`), then we call `User.signInOrSignUpByPasswordless` to create a new `User` document. Later, when we define Express routes for our Passwordless API, you will learn that when the `PasswordlessToken` document contains an `email` parameter, it means that the end user is signing up and **not** signing in. Official docs advise us to call `callback(null, true, tokenDoc.originUrl)` when the `PasswordlessToken` document exists and the token received from the browser (after an end user clicks the login link) matches the token stored in the `PasswordlessToken` document in our database. Technically speaking, we are not comparing tokens themselves but their corresponding hashed values, hashed by the `bcrypt` package.
    
    If the `PasswordlessToken` document does not exists, we have to call `callback(null, false, null)` as per documentation.
    
    If there is an error, we have to call `callback(null, false, null)` as per documentation.
    

2.  The purpose of the `storeOrUpdate` method: "Stores a new token / user ID combination or updates the token of an existing user ID if that ID already exists". We define it like so:
    
    ```
     MongoStore.prototype.storeOrUpdate = async function storeOrUpdate(
       token,
       uid,
       msToLive,
       originUrl,
       callback,
     ) {
       if (!token || !uid || !msToLive || !callback) {
         throw new Error('TokenStore:storeOrUpdate called with invalid parameters');
       }
    
       const saltRounds = 10;
    
       try {
         const hashedToken = await bcrypt.hash(token, saltRounds);
         const newRecord = { hashedToken, uid, ttl: new Date(Date.now() + msToLive), originUrl };
    
         await PasswordlessToken.updateOne(
           { uid },
           { $set: newRecord },
           { upsert: true, runValidators: true },
         );
         callback();
       } catch (error) {
         callback(error);
       }
     };
    ```
    
    `saltRounds` is an argument that the `bcrypt.hash` method takes. `saltRounds` represents the number of calculations done to hash the `token` value. 10 means that the calculation is done 2^10 times. This is approximately 1000 times. The higher the number of calculations - the harder to brute-force the hashed value. Official docs recommend using 10 for `saltRounds`:
    
    [https://www.npmjs.com/package/bcrypt#usage](https://www.npmjs.com/package/bcrypt#usage)
    
    You already know about the `updateOne` Mongoose API method and the `runValidators: true` option that validates data types against a model's schema. The new option is `upsert: true`. This option creates a new document if the document does not exist. If the document exists, the specified fields get updated.
    

3.  Purpose of `invalideteUser` method: "Invalidates and removes a user and the linked token". Here we will simply search for `PasswordlessToken` document by `uid` and delete it:
    
    ```
     MongoStore.prototype.invalidateUser = async function invalidateUser(uid, callback) {
       if (!uid || !callback) {
         throw new Error('TokenStore:invalidateUser called with invalid parameters');
       }
    
       try {
         await PasswordlessToken.deleteOne({ uid });
         callback();
       } catch (error) {
         callback(error);
       }
     };
    ```
    
    We deleted document by using Mongoose API method `deleteOne`:
    
    [https://mongoosejs.com/docs/api/model.html#model\_Model.deleteOne](https://mongoosejs.com/docs/api/model.html#model_Model.deleteOne)
    

4.  The purpose of the `clear` method: "Removes and invalidates all token". We use the Mongoose API method `deleteMany`:
    
    [https://mongoosejs.com/docs/api/model.html#model\_Model.deleteMany](https://mongoosejs.com/docs/api/model.html#model_Model.deleteMany)
    
    Our definition:
    
    ```
     MongoStore.prototype.clear = async function clear(callback) {
       if (!callback) {
         throw new Error('TokenStore:clear called with invalid parameters');
       }
    
       try {
         await PasswordlessToken.deleteMany({});
         callback();
       } catch (error) {
         callback(error);
       }
     };
    ```
    
5.  The `length` method defined by docs: "Number of tokens stored (no matter the validity)". To count the number of MongoDB documents in our MongoDB database, Mongoose has a `countDocuments` method that does just what we need:
    
    [https://mongoosejs.com/docs/api/model.html#model\_Model.countDocuments](https://mongoosejs.com/docs/api/model.html#model_Model.countDocuments)
    
    We define `length` method as:
    
    ```
     MongoStore.prototype.length = function length(callback) {
       PasswordlessToken.countDocuments(callback);
     };
    ```
    

Create a new file, `book/6-begin/api/server/passwordless-token.ts`. Define scheme, document and model, similar to how you defined schema for `User` and `EmailTemplate`:

```
import * as mongoose from 'mongoose';


interface TokenDocument extends mongoose.Document {
  hashedToken: string;
  uid: string;
  ttl: Date;
  originUrl: string;
  email: string;
}

const mongoSchema = new mongoose.Schema({
  hashedToken: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  ttl: {
    type: Date,
    required: true,
    expires: 0,
  },
  originUrl: String,
  email: String,
});

const PasswordlessToken = mongoose.model<TokenDocument>(
  'PasswordlessToken',
  mongoSchema,
  'passwordless-token',
);
```

Note that we passed a third argument to `mongoose.model`. It's an optional parameter. If you specified it, then the value you provided will become a collection's name in your MongoDB database.

Add the above five methods we just defined:

```
import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import * as TokenStore from 'passwordless-tokenstore';
import * as util from 'util';

import User from './models/User';

interface TokenDocument extends mongoose.Document {
  hashedToken: string;
  uid: string;
  ttl: Date;
  originUrl: string;
  email: string;
}

const mongoSchema = new mongoose.Schema({
  hashedToken: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  ttl: {
    type: Date,
    required: true,
    expires: 0,
  },
  originUrl: String,
  email: String,
});

const PasswordlessToken = mongoose.model<TokenDocument>(
  'PasswordlessToken',
  mongoSchema,
  'passwordless-token',
);

function MongoStore(options = {}) {
  TokenStore.call(this);

  this._options = options || {};
}

util.inherits(MongoStore, TokenStore);

MongoStore.prototype.authenticate = async function(token, uid, callback) {
  if (!token || !uid || !callback) {
    throw new Error('TokenStore:authenticate called with invalid parameters');
  }

  try {
    const item = await PasswordlessToken.findOne({ uid, ttl: { $gt: new Date() } });

    if (item) {
      const res = await bcrypt.compare(token, item.hashedToken);
      if (res) {
        if (item.email) {
          await User.signInOrSignUpByPasswordless({ uid, email: item.email });
        }

        callback(null, true, item.originUrl);
      } else {
        callback(null, false, null);
      }
    } else {
      callback(null, false, null);
    }
  } catch (error) {
    callback(error, false, null);
  }
};

MongoStore.prototype.storeOrUpdate = async function(token, uid, msToLive, originUrl, callback) {
  if (!token || !uid || !msToLive || !callback) {
    throw new Error('TokenStore:storeOrUpdate called with invalid parameters');
  }

  const saltRounds = 10;

  try {
    const hashedToken = await bcrypt.hash(token, saltRounds);
    const newRecord = { hashedToken, uid, ttl: new Date(Date.now() + msToLive), originUrl };

    await PasswordlessToken.updateOne(
      { uid },
      { $set: newRecord },
      { upsert: true, runValidators: true },
    );
    callback();
  } catch (error) {
    callback(error);
  }
};

MongoStore.prototype.invalidateUser = async function(uid, callback) {
  if (!uid || !callback) {
    throw new Error('TokenStore:invalidateUser called with invalid parameters');
  }

  try {
    await PasswordlessToken.deleteOne({ uid });
    callback();
  } catch (error) {
    callback(error);
  }
};

MongoStore.prototype.clear = async function(callback) {
  if (!callback) {
    throw new Error('TokenStore:clear called with invalid parameters');
  }

  try {
    await PasswordlessToken.deleteMany({});
    callback();
  } catch (error) {
    callback(error);
  }
};

MongoStore.prototype.length = function(callback) {
  PasswordlessToken.countDocuments(callback);
};

export default MongoStore;
```

___

#### Express routes for Passwordless API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-for-passwordless-api)

At this point, we have configured `passwordless` and defined all required methods for CRUDing the `PasswordlessToken` MongoDB document. Next is our last big task for Passwordless API - defining Express routes.

Similar to Google OAuth API, we will have three Express routes, with one of them for the `/logout` API endpoint.

The first two Express routes correspond to two actions the end user takes:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Passwordless+API.png)

The first action, `action 1`, is submitting a form with an email address. This action makes the browser send a request with the `POST` method to the `API` server at the Express route `/auth/email-login-link`. We chose the API endpoint to be `/auth/email-login-link`, but you can make it whatever you want. We recommend writing informative API endpoints.

Check if value is truthy decorate method with action withAuth HOC production-ready API method API method calls corresponding store method withAuth HOC Navigate to in a browser At AWS dashboard. AWS dashboard decorate method with action API method on the client this chapter page component Google OAuth API MongoDB database on server only send this response list of posts team members. Navigate to discussion withAuth HOC this chapter discussion open this file team members email and name. Click on the button it works as expected S3 bucket it works as expected team members At AWS dashboard API method compiles You already learned open this file on the client. Redirect to checkout API infrastructure in this book Google OAuth API send this response Remember to add import cookie it works as expected show notification Next.js web application Navigate to cookie if truthy then Material-UI new Express route. Navigate to show notification this chapter compiles add environmental variable static method calls request in a browser page component cookie API infrastructure open this file S3 bucket mount middleware production-ready. Subsection open this file server-side rendering email and name check if value is truthy data model on server only. Page component Remember to add import redirect to checkout if truthy then request production-ready. New Express route open this file API method static method calls new Express route Next.js web application request was sent cookie compiles in production Google OAuth API Click on the button request was sent conditional operator. Data model end user triggers method team members At AWS dashboard end user store method calls send this response withAuth HOC request on server only show notification cookie.

Before we define a handler function for the Express route `/auth/email-login-link`, let's check up the official docs for setting up routes:

[https://github.com/florianheinemann/passwordless#7-the-router](https://github.com/florianheinemann/passwordless#7-the-router)

Example code from the official docs:

```
router.post('/sendtoken', 
    passwordless.requestToken(
        // Turn the email address into an user ID
        function(user, delivery, callback, req) {
            // usually you would want something like:
            User.find({email: user}, callback(ret) {
               if(ret)
                  callback(null, ret.id)
               else
                  callback(null, null)
          })
          // but you could also do the following 
          // if you want to allow anyone:
          // callback(null, user);
        }),
    function(req, res) {
       // success!
          res.render('sent');
});
```

Inside the Express route `/sendtoken`, we have to achieve the following:

-   Call the `passwordless.requestToken` method
    
-   Check if a `User` document exists for the `email` that was submitted by the end user on the `Login` page form
    
-   If the `User` document exists, that means the event is sign in, not sign up. We indicate success by calling `callback(null, user._id)`. Calling `callback(null, user._id)` results in creating a `PasswordlessToken` document in our database. If this `PasswordlessToken` already exists in the database, calling `callback(null, user._id)` will result in updating the `PasswordlessToken` document's fields `{ hashedToken, uid, ttl: new Date(Date.now() + msToLive), originUrl }`.
    
-   If the `User` document does **not** exist, that means the event is sign up, not sign in. Official docs suggest calling `callback(null, null)`, which does not create a `PasswordlessToken` document in our database and sends an error to the browser:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/null.png)
    

-   If the error occurs in the `try` block, then we call `callback(error, null)`. This part is not in the above example but mentioned in the official docs.

If we adapt the above example, we get:

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
  (_, res) => {
    res.json({ done: 1 });
  },
);
```

Our version of the route is pretty much the same as the example from docs, except the `else` block. Instead of calling `callback(null, null)` inside the `else` block, we call:

```
await mongoStore.storeOrUpdateByEmail(email);
```

Why do we do this?

When an end user submits their email address on the `Login` page, our `API` server uses this email address to search our database for a corresponding `User` document. Then:

-   If the `User` document exists, we call `callback(null, user._id)`. Calling this method creates a `PasswordlessToken` document in our database with a `uid` field with the value `user._id`. In other words, with the way that `passwordless` works, the `_id` of the `User` document and `uid` of the corresponding `PasswordlessToken` document have the same value.
    
    This default behavior for when a `User` document exists is what we want for our SaaS boilerplate.
    
-   If the `User` document does not exist, then code inside the `else` block runs. Official docs suggest calling `callback(null, null)` which **does not** create a `PasswordlessToken` document in our database and sends an error to the browser:
    

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/null.png)

```
This default behavior for when the `User` document does not exist is **not** we want for our SaaS boilerplate. 

We want `PasswordlessToken` to be created for both sign in and sign up events. And for a sign up event (when the `User` document does not exist in our database), we want to save the email address submitted by the end user to the `PasswordlessToken` document as an `email` field.
```

Side note, in this book we use `parameter` or `property` interchangeably for a JavaScript object. For a MongoDB document, we use the term `field`.

What does the `storeOrUpdateByEmail` method do?

`storeOrUpdateByEmail` checks if the `PasswordlessToken` document, which contains an `email` field, already exists. If it does exist, the method returns the value of the `uid` field in the found document:

```
const obj = await PasswordlessToken.findOne({ email }).select('uid').setOptions({ lean: true });

if (obj) {
  return obj.uid;
}
```

If such `PasswordlessToken` document does **not** exist, then our method will add an `email` field to the `PasswordlessToken` document that has no `email` field OR create a completely new `PasswordlessToken` document. Then the method will return the `uid` value for this updated or created `PasswordlessToken` document:

```
await PasswordlessToken.updateOne({ uid }, { email }, { upsert: true });

return uid;
```

Let's put the above two code blocks together:

```
MongoStore.prototype.storeOrUpdateByEmail = async function addEmail(email: string) {
  if (!email) {
    throw new Error('TokenStore:addEmail called with invalid parameters');
  }

  const obj = await PasswordlessToken.findOne({ email }).select('uid').setOptions({ lean: true });

  if (obj) {
    return obj.uid;
  }

  const uid = new mongoose.Types.ObjectId().toHexString();
  await PasswordlessToken.updateOne({ uid }, { email }, { upsert: true });

  return uid;
};
```

It's worth noting that the `mongoose.Types.ObjectId()` method generates a random value for the `_id` field for a MongoDB document. Also, the method `mongoose.Types.ObjectId().toHexString()` generates a random value for the `uid` field.

Another thing worth noting is usage of the `upsert: true` option. You are already familiar with the Mongoose API method `updateOne` from working on `User` and `EmailTemplate` models. When you set `upsert` to `true` when calling the `updateOne` Mongoose API method, it either adds a new field to the existing MongoDB document (in this case, `email` field) or creates a new MongoDB document using fields from both `filter` and `update` arguments:

[https://mongoosejs.com/docs/tutorials/findoneandupdate.html#upsert](https://mongoosejs.com/docs/tutorials/findoneandupdate.html#upsert)

Why do we need to call `callback(null, id)` after calling `storeOrUpdateByEmail()`? Calling `callback(null, id)` not only creates a `PasswordlessToken` document but it also updates the `{ hashedToken, uid, ttl: new Date(Date.now() + msToLive), originUrl }` field for an **existing** `PasswordlessToken` document.

```
const id = await mongoStore.storeOrUpdateByEmail(email);
callback(null, id);
```

So when we call `callback(null, id)` after calling `storeOrUpdateByEmail` - we ensure that the `PasswordlessToken` document has all required fields, since `storeOrUpdateByEmail` only creates a `PasswordlessToken` document with three fields: `_id`, `uid`, and `email`. In addition, `callback(null, id)` ensures that the values of `_id` and `uid` match.

Let's summarize what happens when an end user submits their email address on the `Login` page of our web application:

-   If the event is sign in (`User` document does exist) - our code on the `API` server creates a `PasswordlessToken` document with the following fields: `_id`, `hashedToken`, `uid`, `ttl`.
-   If the event is sign up (`User` document does **not** exist) - our code on the `API` server creates a `PasswordlessToken` document with the following fields: `_id`, `hashedToken`, `uid`, `ttl` plus `email`.
-   Once the end user clicks the login link inside the login email - our code at the `API` server deletes the `PasswordlessToken` document from our database. If the end user does not click the link within 1 hour of submitting their email address, our code at the `API` server deletes the `PasswordlessToken` document.

Remember to add the `storeOrUpdateByEmail` method to `book/6-begin/api/server/passwordless-token-mongostore.ts`. Add the above definition of `storeOrUpdateByEmail` under the definition of `length`.

___

Alright, we are done with our first Express route, `/auth/email-login-link`.

The second Express route is optional according to the official docs:

[https://github.com/florianheinemann/passwordless#6-setup-the-middleware-for-express](https://github.com/florianheinemann/passwordless#6-setup-the-middleware-for-express)

If we want any route to accept `token` and `uid` values, we can simply add:

```
app.use(passwordless.acceptToken({ successRedirect: '/'}));
```

In our case, it would be:

```
server.use(passwordless.acceptToken({ successRedirect: '/your-settings'}));
```

But we think accepting `token` and `uid` on any route is not a good idea. We want to accept these values only on one API endpoint: `/auth/logged_in`. Thus, the second Express route: `/auth/logged_in`. The official docs provide the following example:

```
router.get('/logged_in', passwordless.acceptToken(), 
    function(req, res) {
        res.render('homepage');
});
```

Adapted to our circumstances:

```
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
  (_, res) => {
    res.redirect(`${process.env.URL_APP}/your-settings`);
  },
);
```

The only two differences from the above example:

-   We want `req.user` to be `user` object, not user id
-   Our redirect URL for successful authentication is `${process.env.URL_APP}/your-settings`

Finally, the official docs provide an example for the Express route `/logout`:

[https://github.com/florianheinemann/passwordless#logout](https://github.com/florianheinemann/passwordless#logout)

```
router.get('/logout', passwordless.logout(),
    function(req, res) {
        res.redirect('/');
});
```

Let's adapt to our particular case:

```
server.get('/logout', (req, res, next) => {
  req.logout((err) => {
      if (err) {
        next(err);
      }
      res.redirect(`${process.env.URL_APP}/login`);
    });
  });
}
```

Again, only two main differences from the official example:

-   We called `req.logout()` to clear `req.user`
-   Our redirect URL for a logged-out end user is `${process.env.URL_APP}/login`

Since we called `req.logout()` in the above Express route, `/logout`, remember to delete or comment out the duplicate Express route inside `book/6-begin/api/server/google-auth.ts`.

Add all three new Express routes to `book/6-begin/api/server/passwordless-auth.ts` and you will get:

```
import * as passwordless from 'passwordless';

import sendEmail from './aws-ses';
import getEmailTemplate from './models/EmailTemplate';
import User from './models/User';
import PasswordlessMongoStore from './passwordless-token-mongostore';

function setupPasswordless({ server }) {
  const mongoStore = new PasswordlessMongoStore();

  passwordless.addDelivery(async (tokenToSend, uidToSend, recipient, callback) => {
    try {
      const template = await getEmailTemplate('login', {
        loginURL: `${
          process.env.URL_API
        }/auth/logged_in?token=${tokenToSend}&uid=${encodeURIComponent(uidToSend)}`,
      });

      await sendEmail({
        from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [recipient],
        subject: template.subject,
        body: template.message,
      });

      callback();
    } catch (err) {
      console.error('Email sending error:', err);
      callback(err);
    }
  });

  passwordless.init(mongoStore);
  server.use(passwordless.sessionSupport());

  server.use((req, __, next) => {
    if (req.user && typeof req.user === 'string') {
      User.findById(req.user, User.publicFields())
        .then((user) => {
          req.user = user;
          console.log('passwordless middleware');
          next();
        })
        .catch((err) => {
          next(err);
        });
    } else {
      next();
    }
  });

  server.post(
    '/auth/email-login-link',
    passwordless.requestToken(
      async (email, __, callback) => {
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
      },
    ),
    (_, res) => {
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
    (_, res) => {
      res.redirect(`${process.env.URL_APP}/your-settings`);
    },
  );

  server.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        next(err);
      }
      res.redirect(`${process.env.URL_APP}/login`);
    });
  });
}

export { setupPasswordless };
```

Let's mount `passwordless` and Express routes to our Express server. Open `book/6-begin/api/server/server.ts` and import `setupPasswordless` like so:

```
// other imports 

import api from './api';
import { setupGoogle } from './google-auth';
import { setupPasswordless } from './passwordless-auth';

// some code
```

Also call the `setupPasswordless` method like so:

```
// some code

setupGoogle({ server });
setupPasswordless({ server });

api(server);

// some code
```

___

#### signInOrSignUpByPasswordless method for User model [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#signinorsignupbypasswordless-method-for-user-model)

When `passwordless` calls the `authenticate` method of the `PasswordlessToken` model, a static method `signInOrSignUpByPasswordless` get called as a result. Check up `book/6-begin/api/server/passwordless-token-mongostore.ts`. Look at the block that starts with `MongoStore.prototype.authenticate`.

We haven't defined the static method `signInOrSignUpByPasswordless` for our `User` model.

Let's do it.

Open the `book/6-begin/api/server/models/User.ts` file.

Under:

```
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

Add:

```
signInOrSignUpByPasswordless({ uid, email }: { uid: string; email: string }): Promise<UserDocument>;
```

Since we know that logic inside the static method `signInOrSignUpByPasswordless` will be very similar to the logic of the static method `signInOrSignUpViaGoogle`, let's look at the definition of the latter:

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

  return _.pick(newUser, this.publicFields());
}
```

Let's translate the above logic inside the `signInOrSignUpViaGoogle` method from TypeScript to English:

-   The method looks for a `User` document by `email`.
-   If a `User` document exists, the method updates the `googleId` and `googleToken` fields and returns an updated user object.
-   If a `User` document does not exist, the method generates `slug`, creates a new `User` document, looks for the welcome email template, sends the welcome email to the new user, returns a newly created user object.

The `signInOrSignUpViaGoogle` method pretty much does the same thing. There is no `googleId` and `googleToken` but there is `uid`

```
public static async signInOrSignUpByPasswordless({ uid, email }) {
  const user = await this.findOne({ email }).select(this.publicFields().join(' ')).setOptions({ lean: true });

  if (user) {
    throw Error('User already exists');
  }

  const slug = await generateSlug(this, email);

  const newUser = await this.create({
    _id: uid,
    createdAt: new Date(),
    email,
    slug,
  });

  const emailTemplate = await getEmailTemplate('welcome', { userName: email });

  if (!emailTemplate) {
    throw new Error('Email template "welcome" not found in database.');
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

  return _.pick(newUser, this.publicFields());
}
```

Add the above definition of `signInOrSignUpByPasswordless` **under** the block that starts with:

```
public static async signInOrSignUpViaGoogle
```

In the next subsection, we will add all missing code to our `APP` project and test out the entire Passwordless API.

___

#### Testing Passwordless OAuth API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-passwordless-oauth-api)

Alrighty, we are done with Passwordless API infrastructure at `API` server. We need to add some missing code at `APP` project.

We need to:

1.  add form to `LoginButton` comnponent
2.  define `onSubmit` for that form
3.  define `emailLoginLinkApiMethod` API method that sends request `req1` to Express route `/auth/email-login-link` at `API` server

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Passwordless+API.png)

Add environmental variable API method add environmental variable compiles on server only cookie triggers method response server-side rendering You already learned decorate method with action decorate method with action. Mount middleware HTTP add environmental variable AWS dashboard AWS dashboard this chapter on server only request was sent compiles on server only. End user team members withAuth HOC team members Next.js web application static method calls. Server-side rendering Click on the button on the client production-ready in a browser cookie subsection data model S3 bucket. Compiles if truthy then API method team members static method calls Click on the button add environmental variable store method calls in this book withAuth HOC AWS dashboard in a browser on the client check if value is truthy. Email and name server-side rendering redirect to checkout Team Leader list of posts You already learned request mount middleware MongoDB database subsection Put it all together. You already learned in a browser check if value is truthy subsection API method calls corresponding store method in production check if value is truthy on the client Material-UI this chapter HTTP. HTTP compiles Click on the button Put it all together API method calls corresponding store method Next.js web application. End user send this response session this chapter request HTTP request was sent Material-UI AWS dashboard server-side rendering mount middleware open this file decorate method with action. End user in production production-ready Team Leader Next.js web application Next.js web application.

Since you already successfully used HTML element `form` and corresponding `onSubmit` method in `YourSettings` page. That's why we are not going into detailed implementation here. If you want to see how we implemented `form` and `onSubmit` earlier in this book, check up `book/6-begin/app/pages/your-settings.tsx` file and Chapter 4.

`form` element for submitting email address:

```
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
```

Inside `onSubmit` we call `emailLoginLinkApiMethod` API method:

```
private onSubmit = async (event) => {
  event.preventDefault();
  const { email } = this.state;

  if (!email) {
    notify('Email is required');
  }

  try {
    await emailLoginLinkApiMethod({ email });
    this.setState({ email: '' });
    notify('Async emailed you a login link.');
  } catch (error) {
    notify(error);
  }
};
```

After you add the above code to `LoginButton` component, you should get:

```
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import React from 'react';

import { emailLoginLinkApiMethod } from '../../lib/api/public';
import notify from '../../lib/notify';

type State = { email: string };

class LoginButton extends React.PureComponent<any, State> {
  constructor(props) {
    super(props);

    this.state = { email: '' };
  }

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

    if (!email) {
      notify('Email is required');
    }

    try {
      await emailLoginLinkApiMethod({ email });
      this.setState({ email: '' });
      notify('SaaS boilerplate emailed you a login link.');
    } catch (error) {
      notify(error);
    }
  };
}

export default LoginButton;
```

Next, we have to define `emailLoginLinkApiMethod` API method. Open `book/6-begin/app/lib/api/public.ts` and the below definition at the end of the file:

```
export const emailLoginLinkApiMethod = ({ email }: { email: string }) =>
  sendRequestAndGetResponse('/auth/email-login-link', {
    body: JSON.stringify({ user: email }),
  });
```

You may have noticed that inside Express route `/auth/email-login-link` we have not used line like:

```
const { email } = req.body;
```

Inside `passwordless` package's code, you can find lines:

```
var userField = (options.userField) ? options.userField : 'user';

// some other code

user = req.body[userField];
```

Location of the above lines of code:

[https://github.com/florianheinemann/passwordless/blob/c80d3a3cd6ad72823f4775fe532f369602a0246f/docs/passwordless.js.html#L441](https://github.com/florianheinemann/passwordless/blob/c80d3a3cd6ad72823f4775fe532f369602a0246f/docs/passwordless.js.html#L441)

This means, that if we don't pass `userField` option to `passwordless.requestToken` method inside Express route `/auth/email-login-link` then `passwordless` will look into `req,body.user` for email address. Thus this line inside `emailLoginLinkApiMethod` API method:

```
body: JSON.stringify({ user: email })
```

We are ready to test!

Since we are not using any third-party API, there are no new environmental variables to add.

Start both `APP` and `API` with `yarn dev`.

Go to MongoDB Atlas dashboard, navigate to the page that shows collections for `test` database.

Confirm two things on your MongoDB Atlas dashboard:

-   `test.emailtemplates` collection has two documents, one with name `welcome` and second with name `login`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-14-56.png)
    
-   `test.passwordless-token` collection exists but it is empty:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-16-44.png)
    

Navigate to `Login` page (`http://localhost:3000/login`). The page should look like:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-19-22.png)

If you are logged-in, find `Log out` link inside `MenuWithLinks` dropdown and log out. Then navigate to `Login` page.

Since we already have `User` document with `email: "team@builderbook.org"`, when we test `Passwordless API` - we test case `sign in` case, not `sign up` case.

Let's test `sign in` case (`User` document already exists in database).

On `Login` page, add email address of existing `User` document. In our case, email address is `team@builderbook.org`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-29-03.png)

Click `LOG IN WITH EMAIL` button.

You will see a `Notifier` component with success message:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-38-09.png)

Go to your email inbox, in our case it is Gmail inbox for `team@builderbook.org` account:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-31-32.png)

Open a newly arrived login email, it contains login link.

Note how login link contains two queries, one is `token` and another one is `uid`, as it should.

Before you click on login link, go MongoDB Atlas dashboard and check up newly created `PasswordlessToken` document inside `test.passwordless-token` collection:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-39-01.png)

Check if `ttl` is indeed 1 hour from when you submitted email address on `Login` page.

Note that value of `uid` field of `PasswordlessToken` document matches value of `_id` filed of `User` document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-39-33.png)

Click on login link inside login email:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-45-26.png)

You are now successfully logged-in and can see properly rendered `YourSettings` page!

Check up `test.passwordless-token` collection at MongoDB Atlas dashboard:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-50-23.png)

The collection is empty again! As it should!

You already learned in a browser discussion server-side rendering conditional operator cookie mount middleware API infrastructure production-ready. Server-side rendering Remember to add import S3 bucket Google OAuth API withAuth HOC MongoDB database. Put it all together cookie data model withAuth HOC team members request was sent MongoDB database Google OAuth API. HTTP S3 bucket cookie response Remember to add import API infrastructure API infrastructure. Check if value is truthy show notification Material-UI page component We will discuss on server only decorate method with action AWS dashboard mount middleware request Navigate to compiles static method calls. Redirect to checkout discussion subsection in production decorate method with action check if value is truthy email and name Next.js web application AWS dashboard You already learned MongoDB database Team Leader You already learned. In production You already learned mount middleware in production request. In a browser it works as expected At AWS dashboard Navigate to compiles list of posts. Server-side rendering team members add environmental variable it works as expected it works as expected triggers method API method. Compiles API method calls corresponding store method this chapter Next.js web application in this book in production response.

___

As a bonus task, test `sign up` case by yourself. All you need to do is to use different email address. Any email address will do that has no corresponding `User` document in your database.

As another bonus task, you can add `console.log` statement anywhere in iur new code to see that our API infrastructure indeed works as we intented it to work. For example, you can `console.log` statements to Express routes of Passwordless API, then go to browser, log in using passwordless method and watch logs for `API` server. You are welcome to add `console.log` to Express routes `/auth/email-login-link` and `/auth/logged_in`.

Alternatively, you can add `console.log` statement to middleware we created earlier:

```
server.use((req, __, next) => {
  if (req.user && typeof req.user === 'string') {
    User.findById(req.user, User.publicFields())
      .then((user) => {
        req.user = user;
        console.log('passwordless middleware');
        next();
      })
      .catch((err) => {
        next(err);
      });
  } else {
    next();
  }
});
```

Function that populates `req.user` inside this middleware runs on every request from browser to `API` server.

While you are logged-in using passwordless method, you can simply reload `YourSettings` page on the browser. For every request from browser to `API` server for every page loading event), the above code inside middleware will run and you will see `passwordless middleware` printed in logs for `API` server.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-05+09-48-01.png)

You will see `passwordless middleware` printed on logs of `API` server.

Good job!

Before we move on to the section, let's make an improvement. In Chapter 5, we created `withAuth` higher-roder component, that checks if `user` object exists on the browser and if it does not, does not load pages that require authentication and redirects end user to `Login` page. It's a neat feature. An end user on the browser does not have access to pages such as `YourSettings` page if not authenticated.

It's important to remember that some users can attempt to use our web application's API without using browser. Some other server or application like [Postman](https://www.postman.com/) can send requests to `API` server. In other words, we want to protect our web application's non-public API endpoints.

If we want to protect API endpoints that have `/api/v1/team-member/*` in the route, then we can update `book/6-begin/api/server/api/team-member.ts` file with new middleware like this:

```
import * as express from 'express';

import { signRequestForUpload } from '../aws-s3';

const router = express.Router();

router.use((req, res, next) => {
  console.log('team member API', req.path);
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});

// Get signed request from AWS S3 server
router.post('/aws/get-signed-request-for-upload-to-s3', async (req, res, next) => {
  try {
    const { fileName, fileType, prefix, bucket } = req.body;

    const returnData = await signRequestForUpload({
      fileName,
      fileType,
      prefix,
      bucket,
    });

    console.log(returnData);

    res.json(returnData);
  } catch (err) {
    next(err);
  }
});

export default router;
```

As you can see we check if `req.user` exists upstream of Express routes. If it does not, `API` server responds with error status code. `req.user` will only exist if cookie from browser matches session, session matches user and our code (`passport` or `passwordless`) populated `req.user`. Adding middleware that checks for some permissions upstream of Express route is the way to set permissions for non-public API endpoints.

Note that we want user to be logged-in to be able to send requests to Express routes inside the `book/6-begin/api/server/api/team-member.ts` file:

```
router.use((req, res, next) => {
  console.log('team member API', req.path);
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});
```

If someone sends request to our `api` server at API endpoints `http://localhost:8000/api/v1/team-member` or `http://localhost:8000/api/v1/team-member/*` and `req.user` is falsy then our `api` server will respond with:

![Builder Book](https://user-images.githubusercontent.com/10218864/107122198-17703e80-684b-11eb-9d8a-92a81efeefc5.png)

That's why we added above logic that checks if user is logged-in (`req.user` is not `undefined`). We added this check upstream of all Express routes. So this check runs before any of handler functions from downstream Express routes get called.

Passwordless API is relatively complex infrastructure in this book. Good job if you followed through entire implementation of Passwordless API!

In the next and final section of this chapter, we will work on Mailchimp API.

___

## Mailchimp API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#mailchimp-api)

Our SaaS boilerplate now has two authentication methods, Google OAuth and Passwordless. Also, our SaaS boilerplate sends emails via AWS SES service. So far, we have two types of email: welcome and login.

Another popular feature of SaaS products is adding email addresses to Mailchimp lists (recently renamed from `lists` to `audiences`). You, as a developer and business owner, are building a relationship with your customers. On occasion, you may have to communicate with your customers. The only way to do it for most SaaS businesses is via email. Thus, your web application should have the ability to save customers' email addresses to Mailchimp lists.

In this book, we will show you how to save the email address of every newly signed-up end user to Mailchimp using Mailchimp API. You can expand this feature to satisfy the needs of your SaaS business. For example, you may create a separate Mailchimp list for customers - end users who not only signed up but also became paying customers. If your SaaS product has a trial period, you may want a Mailchimp list for this category of end users as well.

It's important that you, as a business owner, specify in your business's terms of service that your business reserves the right to send an occasional communication to signed-up users and/or paying customers. It's also common to specify that your business will not share or sell email addresses. You should also add two features that make your app compliant with [GDPR regulation](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation):

-   allow end users to download all associated data with their accounts
-   allow end users to delete their accounts and all associated data

Mailchimp API is relatively easy to implement at this point in our book. Here are the reasons why it is relatively simple API infrastructure:

-   All code is on our `API` server, there is no code on our `APP` project. In other words, Mailchimp API is server-only infrastructure.
-   We will use the `fetch` method that we learned about in Chapter 3. In Chapter 3, we used `fetch` to define `sendRequestAndGetResponse` that sends requests and receives responses. For server-side rendered pages, `fetch` deals with a req-res cycle between the `APP` server and `API` server. For client-side rendered pages, `fetch` deals with a req-res cycle between the `APP` browser and `API` server. In Mailchimp API, we will use `fetch` to send a request with the `POST` method from our `API` server to the Mailchimp server.
-   Once we define a server-side `addToMailchimp` method, we simply add it to two static methods for our `User` model: `signInOrSignUpViaGoogle` and `signInOrSignUpByPasswordless`.

___

#### callAPI method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#callapi-method)

In this subsection, we will define a `callAPI` method that accepts `path`, `method`, and `data` arguments and sends a request to the Mailchimp server. We will use `callAPI` to define an `addToMailchimp` method that we will eventually call inside the `signInOrSignUpViaGoogle` and `signInOrSignUpByPasswordless` static methods of our `User` model.

From `book/6-begin/app/lib/api/sendRequestAndGetResponse.ts`, you may remember that `fetch` takes `path`, `method`, `headers`, and `opts` (for example, `body`) as arguments:

```
const response = await fetch(
  opts.externalServer ? `${path}${qs}` : `${process.env.NEXT_PUBLIC_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);
```

Mailchimp API requires us to include an `Authorization` header with a Base64-encoded API key. Base64 encoding:

[https://en.wikipedia.org/wiki/Base64](https://en.wikipedia.org/wiki/Base64)

Example of encoding:

[https://stackoverflow.com/questions/31324649/access-mailchimp-api-3-0-get](https://stackoverflow.com/questions/31324649/access-mailchimp-api-3-0-get)

Encoded value from StackOverlow issue:

```
new Buffer(`anything:${MailChimpKey}`).toString('base64')
```

We can use Node's method `Buffer.from(string[, encoding])`:

[https://nodejs.org/docs/latest/api/buffer.html#buffer\_class\_method\_buffer\_from\_string\_encoding](https://nodejs.org/docs/latest/api/buffer.html#buffer_class_method_buffer_from_string_encoding)

Example of encoded value from Node's docs:

```
Buffer.from('7468697320697320612074c3a97374', 'hex')
```

In our case, the encoded value will look like:

```
Buffer.from(`apikey:${process.env.MAILCHIMP_API_KEY}`).toString('base64')
```

We omitted the second argument `'base64'` of the `Buffer.from` method and used `toString('base64')`.

Our definition for the `callAPI` method will be:

```
function callAPI({ path, method, data }): Promise<Response> {
  const ROOT_URI = `https://${process.env.MAILCHIMP_REGION}.api.mailchimp.com/3.0`;

  return fetch(`${ROOT_URI}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`apikey:${process.env.MAILCHIMP_API_KEY}`).toString(
        'base64',
      )}`,
    },
    body: JSON.stringify(data),
  });
}
```

We will discuss arguments `path`, `method`, and `data` in the next subsection.

___

#### addToMailchimp method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#addtomailchimp-method)

As you can see, `callAPI` needs a `path` argument that basically specifies which particular API we want to access on the Mailchimp server. For example, in order to save an email address to Mailchimp's list, we will use the `Add a new list member` Mailchimp API:

[https://mailchimp.com/developer/reference/lists/list-members/](https://mailchimp.com/developer/reference/lists/list-members/)

List of posts conditional operator Click on the button on server only request page component on server only open this file email and name decorate method with action check if value is truthy triggers method redirect to checkout. Request was sent Click on the button Google OAuth API HTTP At AWS dashboard HTTP compiles in a browser triggers method if truthy then conditional operator API method calls corresponding store method in a browser list of posts API method calls corresponding store method. Remember to add import on the client subsection end user API method email and name redirect to checkout decorate method with action Google OAuth API Put it all together in this book Material-UI email and name S3 bucket. Request was sent request was sent Team Leader Team Leader check if value is truthy session if truthy then S3 bucket new Express route. Team members Click on the button in this book request redirect to checkout You already learned Material-UI redirect to checkout AWS dashboard Team Leader Click on the button. Mount middleware team members it works as expected discussion At AWS dashboard add environmental variable Material-UI check if value is truthy API method send this response withAuth HOC. Discussion in this book team members response end user API infrastructure on server only conditional operator on server only conditional operator We will discuss page component check if value is truthy request. At AWS dashboard check if value is truthy show notification production-ready cookie Team Leader subsection API method calls corresponding store method on server only Material-UI server-side rendering Put it all together AWS dashboard. Team Leader Navigate to Remember to add import request mount middleware add environmental variable request subsection store method calls Navigate to subsection Navigate to. Next.js web application in a browser decorate method with action Click on the button You already learned in this book add environmental variable Next.js web application Put it all together production-ready request was sent Material-UI team members.

That has `path`:

```
/lists/${LIST_IDS[listName]}/members/
```

And requires us to send a request with the `POST` method.

`addToMailchimp` simply passes all necessary parameters to the `callAPI` method and then calls it:

```
async function addToMailchimp({ email, listName }) {
  const data = {
    // eslint-disable-next-line
    email_address: email,
    status: 'subscribed',
  };

  const path = `/lists/${LIST_IDS[listName]}/members/`;

  await callAPI({ path, method: 'POST', data });
}
```

The `data` object, which is basically a `body` object, must have `email_address` and `status` parameters. You can find the list of possible parameters here:

[https://mailchimp.com/developer/reference/lists/list-members/](https://mailchimp.com/developer/reference/lists/list-members/)

`email_address` - Email address for a subscriber.

`status` - Subscriber's current status. Possible Values: subscribed, unsubscribed, cleaned, pending, transactional.

We also added a line to supress a warning from `eslint@typescript-eslint/camelcase`:

```
// eslint-disable-next-line
```

This warning suggests renaming `email_address` into something like `emailAddress`. But we cannot do this, since we are working with a third-party API and have to follow that API's constraints.

Create a new file, `book/6-begin/api/server/mailchimp.ts`, and put the definitions of `callAPI` and `addToMailchimp` methods into the file like so:

```
import fetch, { Response } from 'node-fetch';

// eslint-disable-next-line
require('dotenv').config();

const LIST_IDS = {
  signups: process.env.MAILCHIMP_SAAS_ALL_LIST_ID,
};

function callAPI({ path, method, data }): Promise<Response> {
  const ROOT_URI = `https://${process.env.MAILCHIMP_REGION}.api.mailchimp.com/3.0`;

  return fetch(`${ROOT_URI}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`apikey:${process.env.MAILCHIMP_API_KEY}`).toString(
        'base64',
      )}`,
    },
    body: JSON.stringify(data),
  });
}

async function addToMailchimp({ email, listName }) {
  const data = {
    // eslint-disable-next-line
    email_address: email,
    status: 'subscribed',
  };

  const path = `/lists/${LIST_IDS[listName]}/members/`;

  await callAPI({ path, method: 'POST', data });
}

export { addToMailchimp };
```

Later, when we use the `addToMailchimp` method, we will call it like this:

```
addToMailchimp({ email, listName: 'signups' })
```

There was no strong reason to define `LIST_IDS` as an array, but this way, you can simply add more lists to the existing array when you work on your own SaaS product.

___

#### Adding addToMailchimp to signInOrSignUpViaGoogle and signInOrSignUpByPasswordless [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#adding-addtomailchimp-to-signinorsignupviagoogle-and-signinorsignupbypasswordless)

In this subsection, we import and call our `addToMailchimp` method with two static methods in the `User` model, `signInOrSignUpViaGoogle` and `signInOrSignUpByPasswordless`.

Open file `book/6-begin/api/server/models/User.ts` and import `addToMailchimp`:

```
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import sendEmail from '../aws-ses';
import { addToMailchimp } from '../mailchimp';
import { generateSlug } from '../utils/slugify';
import getEmailTemplate from './EmailTemplate';
```

Then find the definition of `signInOrSignUpViaGoogle` and add the following block of code to it:

```
try {
  await addToMailchimp({ email, listName: 'signups' });
} catch (error) {
  console.error('Mailchimp error:', error);
}
```

Add it like this:

```
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
```

Add to `signInOrSignUpByPasswordless` in the exact same location:

```
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
```

Note we add an email address to Mailchimp only for a successful `sign up` event, not for a `sign in` event.

___

#### Environmental variables for Mailchimp API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#environmental-variables-for-mailchimp-api)

We are almost ready to test Mailchimp API.

Since we are using a third-party API, we need to add new environmental variables to our `API` project.

We have to add:

-   MAILCHIMP\_API\_KEY
-   MAILCHIMP\_REGION
-   MAILCHIMP\_SAAS\_ALL\_LIST\_ID

Create a Mailchimp account if you haven't done so already.

Navigate to your `Account` page. For us, the URL for the `Account` page is:

[https://us17.admin.mailchimp.com/account/](https://us17.admin.mailchimp.com/account/)

Click on `Extras`. Then in the dropdown menu, click on `API keys`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-06+13-09-04.png)

If you have no existing API keys, simply click on `Create A Key`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-06+13-11-53.png)

The value of the created API key is the value for your `MAILCHIMP_API_KEY` environmental variable.

The ending of your API key will have dash `-` and some string after the dash. For us, `MAILCHIMP_API_KEY` looks like:

```
xxxxxx-us17
```

The string after the dash (`us17` in our case) is the value of your `MAILCHIMP_REGION` environmental variable.

Navigate to the page with all lists (audiences). For us, the URL for this page is:

[https://us17.admin.mailchimp.com/lists/](https://us17.admin.mailchimp.com/lists/)

Click on `Create Audience`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-06+13-18-35.png)

On the list of all audiences, click on the audience that you just created.

Then click on `Settings`. On the dropdown menu, click on `Audience name and defaults`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-06+13-23-50.png)

The value in the section `Audience ID` is the value for your `MAILCHIMP_SAAS_ALL_LIST_ID` environmental variable:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-06+13-25-10.png)

Add these three new environmental variables to `book/6-begin/api/.env`.

___

#### Testing Mailchimp API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-mailchimp-api)

We are ready to test the entire Mailchimp API infrastructure in our application!

Remember that `addToMailchimp` will only run for a successful `sign up` event, not a `sign in` event. That means that when you sign up in our SaaS boilerplate, you either have to:

-   Manually delete an existing `User` document from the database, if you want to use the email address associated with this existing `User` document
-   Or, use some other email address

We will manually delete our `User` document that has `team@builderbook.org` in the `email` field.

Start both `APP` and `API` projects with `yarn dev`.

Make sure you are logged-out. If you can't find the `Log out` link, you can simply paste and load `http://localhost:8000/logout` in your browser tab.

Go to the `Login` page and sign up. We will sign up using Google OAuth, and we will choose our `team@builderbook.org` Google account.

Check up your MongoDB Atlas dashboard and confirm that `sign up` indeed resulted in creation of a new `User` document. If so, then the `sign up` event was successful.

Since the `sign up` event did not throw any error, the `addToMailchimp` method executed without errors. Go to the list of all subscribers for the audience that you created in the previous subsection. You will find a new email address with `Subscribed` status:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-6/Screenshot+from+2020-05-06+13-40-41.png)

___

In the next chapter, Chapter 7, we will introduce concepts of our application's state and data stores.

If you followed the instructions in this chapter closely, your codebase should match the codebase located at `book/6-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___