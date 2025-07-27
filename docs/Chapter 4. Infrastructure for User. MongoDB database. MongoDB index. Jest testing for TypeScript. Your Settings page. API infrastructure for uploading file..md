In Chapter 4, you start with the codebase in the [4-begin folder](https://github.com/async-labs/saas/tree/master/book/4-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [4-end folder](https://github.com/async-labs/saas/tree/master/book/4-end).

We will cover the following topics in this chapter:

-   Infrastructure for User  
    
    -   User Schema and Model. Type interface.
    -   Static methods and Mongoose methods
    -   Express routes, router and API methods
-   MongoDB database  
    
    -   MongoDB Atlas
    -   Creating MongoDB document
    -   Connecting database
    -   Testing connection
-   MongoDB index  
    
-   Jest testing for TypeScript  
    
    -   generateSlug method
    -   Testing generateSlug method
-   Your Settings page  
    
    -   Form and input
    -   API infrastructure for updating profile
-   Uploading file API  
    
    -   Page method uploadFile
    -   Getting signed request API
    -   Env variables and CORS settings for uploading file
    -   Uploading file using signed request API
    -   Testing file upload
    -   resizeImage

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

In Chapter 3, you learned and built "two-app" architecture. You learned new key concepts such as "API method" and "Express route". Here in Chapter 4, we will update our two-project architecture by adding a MongoDB database:

[https://docs.atlas.mongodb.com/](https://docs.atlas.mongodb.com/)

In Chapter 3, we harcoded a user object inside an Express route at the `api` server

```
server.get('/api/v1/public/get-user', (_, res) => {
  res.json({ user: { email: 'team@builderbook.org' } });
});
```

In Chapter 4, instead of hardcoding a user object, we will actually retrieve data from the database.

After we connect our `api` server to a MongoDB database, the basic data flow (key request-response cycles) will look like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/complete.png)

In addition to connecting a database, you will learn about the testing framework called Jest:

[https://jestjs.io/](https://jestjs.io/)

We will discuss when and why you would write tests for your code.

We will create a new page called `YourSettings`. This page shows basic information about your account and allows you to edit your name and avatar:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-10+12-53-37.png)

Finally, you will learn about building external, or third-party, API infrastructure. In Chapter 3, you built so-called internal API infrastructure that displayed a user's email address on the `Index` page.

An internal API infrastructure only invloves the `api` server and our database. An external API infrastructure involves an external, third-party server (and database). In this chapter, for example, we will build our first external API infrastructure - we will build infrastructure that uploads a file from our web application to the external AWS S3 service.

___

## Infrastructure for User [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#infrastructure-for-user)

Connecting a MongoDB database to our `api` server is not enough for CRUDing (create, read, update, delete) data. We have to write methods that use MongoDB's API methods to CRUD (create, read, update, delete) data. In other words, we have to learn and implement MongoDB CRUD API:

[https://docs.mongodb.com/manual/crud/](https://docs.mongodb.com/manual/crud/)

In this book, instead of using MongoDB CRUD API, we will use an abstraction layer for it, called `mongoose`:

[https://mongoosejs.com/](https://mongoosejs.com/)

In this section, we will get familiar with Mongoose API methds and use some of them for our firtst data model, User.

We will call a method that acts on a data model and uses a Mongoose API method internally, a static method.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/User.png)

In this section, we will work on the part colored red: Express routes, Static methods, and Mongoose methods.

In the next section, we will work on the part colored black: connecting `api` server to database.

___

#### User Schema and Model. Type interface. [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#user-schema-and-model-type-interface-)

As we just mentioned, we need to get familiar with Mongoose API since, in this book, we chose not to work with a native Node.js driver for MongoDB:

[https://mongoosejs.com/docs/guide.html](https://mongoosejs.com/docs/guide.html)

The `mongoose` library is an abstraction layer built on top of a MongoDB native driver. This means that whenever you call a Mongoose API method, you call a corresponding MongoDB method.

You might ask why you should learn a MongoDB abstraction instead of the native MongoDB driver. A good abstraction library delivers some value on top of the native library. If your data has no well-defined structure and you plan to write your own code to validate data types, then you can use MongoDB driver. However, if your data has well-defined structure (shape), then you should go with Mongoose. The native driver also has higher performance for Mongoose and provides you with a so-called Schema and Model in addition to MongoDB's Document:

[https://developer.mongodb.com/article/mongoose-versus-nodejs-driver](https://developer.mongodb.com/article/mongoose-versus-nodejs-driver)

The native driver can be significantly faster for some types of queries:

[https://medium.com/@bugwheels94/performance-difference-in-mongoose-vs-mongodb-60be831c69ad](https://medium.com/@bugwheels94/performance-difference-in-mongoose-vs-mongodb-60be831c69ad)

In this book, we use Mongoose to work with MongoDB.

MongoDB database stores data as a so-called Document. The format of the Document is BSON. BSON is a binary representation of JSON data:

[https://docs.mongodb.com/manual/core/document/](https://docs.mongodb.com/manual/core/document/)

Mongoose Schema allows you to define the shape of the MongoDB Document:

[https://mongoosejs.com/docs/guide.html#definition](https://mongoosejs.com/docs/guide.html#definition)

Simple example of Schema from the above link:

```
  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var blogSchema = new Schema({
    title:  String, // String is shorthand for {type: String}
    author: String,
    body:   String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
      votes: Number,
      favs:  Number
    }
  });
```

In Mongoose, a Model is a `class`:

[https://mongoosejs.com/docs/api.html#model\_Model](https://mongoosejs.com/docs/api.html#model_Model)

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

`Class` is a special type function (built-in in JavaScript). You can assign parameters and methods to the `class`. In the below example, `height` and `width` are parameters (also called properties), and `calcArea` is a method:

```
class Rectangle {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  // Method
  calcArea() {
    return this.height * this.width;
  }
}

const square = new Rectangle(10, 10);

console.log(square.height);
console.log(square.calcArea());
```

On your browser, open `Chrome Developer Tools`, navigate to the `Console` tab, and paste the above code:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-15+11-17-16.png)

You should see `10` and `100` printed in the browser console.

Besides parameters and methods that you define, `class` has special built-in methods - for example, the `constructor` method. A `constructor` is a special method that creates an object with some initial parameters or initial methods:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor)

In the above example, we defined the parameters `height` and `width`.

List of posts triggers method in a browser team members Navigate to end user triggers method new Express route in this book production-ready. Triggers method static method calls new Express route it works as expected discussion Google OAuth API Material-UI. Page component conditional operator store method calls S3 bucket check if value is truthy MongoDB database. Cookie withAuth HOC redirect to checkout MongoDB database triggers method list of posts At AWS dashboard mount middleware show notification We will discuss At AWS dashboard triggers method discussion in production. We will discuss this chapter new Express route decorate method with action if truthy then. Server-side rendering MongoDB database subsection mount middleware request was sent this chapter You already learned add environmental variable Remember to add import. Triggers method Material-UI on the client email and name At AWS dashboard on the client API infrastructure Google OAuth API it works as expected on server only At AWS dashboard new Express route on the client. Response HTTP show notification Team Leader S3 bucket Click on the button. Mount middleware team members data model Remember to add import email and name new Express route redirect to checkout. On the client cookie request was sent subsection cookie.

In the below example, we defined the parameter `name` (example from Mozilla docs):

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

You created an object `poly1` that has the parameter `poly1.name` with initial value of `"Polygon"`.

You might use the `constructor` method if you are familiar with React. In React, if you need to set the initial state or bind some methods to `this` of a component or page component, you would use `constructor`:

```
constructor(props) {
  super(props);
  this.state = { counter: 0 };
  this.handleClick = this.handleClick.bind(this);
}
```

In fact, we used the `constructor` method when we defined the `Notifier` component inside our `app` project. Open `book/4-start/app/components/common/Notifier.tsx` and find this block:

```
constructor(props) {
  super(props);
  openSnackbarExternal = this.openSnackbar;
}
```

As you can see, we used `constructor` to bind (assign) the method `openSnackbar` to `this`, an instance of the component `Notifier`.

So a Mongoose Model is a `class`. How do we create it and extend it with Schema?

In Mongoose, we call the `mongoose.model` method to create a subclass of a Mongoose Model:

```
const User = mongoose.model('User', mongoSchema);
```

In Mongoose, the `mongoose.model` method creates a Model subclass using schema.

An instance of the `User` Model is a Mongoose Document, which is also a class. A Mongoose Document represents a one-to-one mapping to documents as stored in a MongoDB database:

[https://mongoosejs.com/docs/documents.html](https://mongoosejs.com/docs/documents.html)

In the below example, `user` is an instance of the `User` Model, thus a Document:

```
const User = mongoose.model('User', mongoSchema);
const user = new User();
```

Since we are using TypeScript, we have to pass data types - we can use `interface` - to the above definition of `User`:

```
const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);
```

`UserDocument` and `UserModel` are `interfaces`:

[https://www.typescriptlang.org/docs/handbook/interfaces.html](https://www.typescriptlang.org/docs/handbook/interfaces.html)

TypeScript uses `interface` to define data structure, parameters (also called properties), and functions (also called methods).

For example:

```
interface LabeledValue {
    label: string;
}

function printLabel(labeledObj: LabeledValue) {
    console.log(labeledObj.label);
}

let myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
// expected output: "Size 10 Object"
```

`LabeledValue` interface defines the shape of the object `labeledObj`.

When TypeScript compiles code, it will check if `labeledObj`, an argument that is passed to the function `printLabel`, has the parameter `label` of type `string`.

In our case, we use two interfaces: `UserDocument` and `UserModel`. We use them to define the shape of Document and Model, because when we call the `mongoose.model` method, we want to check that all parameters are present and are of the proper data type.

Let's define these two interfaces:

```
interface UserDocument extends mongoose.Document {
  slug: string;
  createdAt: Date;
  email: string;
  displayName: string;
  avatarUrl: string;
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
}
```

Note that we used `extends` that used earlier in this book to define ES6 class:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)

Also note that we used the `UserDocument` interface inside `mongoose.Model<UserDocument>`. In other words, we used one `interface` inside definition of another `interface`.

We defined the `UserDocument` interface as an object with 5 parameters: `slug`, `createdAt`, `email`, `displayName`, and `avatarUrl`. As we progress through this book, we will add more parameters when needed.

We defined the `UserModel` interface as an object with two methods. The first method is called `getUserBySlug`. This method takes the argument `slug`, finds a User Document by this `slug`, and then returns that User Document. The second method is called `updateProfile`. This method takes 3 arguments (`userId` ,`name`, `avatarUrl`), finds a User Document by id, updates this User Document, and then returns the updated User Document. As you learned from Chapter 3, a function or method that returns a Promise is an asynchronous function.

Response AWS dashboard Navigate to team members MongoDB database mount middleware server-side rendering. API method compiles decorate method with action in production HTTP Team Leader static method calls new Express route add environmental variable S3 bucket email and name. Server-side rendering response S3 bucket Click on the button request response decorate method with action S3 bucket on server only Google OAuth API add environmental variable in this book decorate method with action Navigate to Put it all together. Request was sent API infrastructure data model decorate method with action subsection email and name Material-UI response on server only. Next.js web application response data model in production store method calls Next.js web application cookie Remember to add import MongoDB database S3 bucket request You already learned Material-UI this chapter. In production redirect to checkout Google OAuth API At AWS dashboard API method calls corresponding store method API method. Team members end user API infrastructure compiles new Express route on server only API infrastructure page component decorate method with action list of posts. Show notification production-ready static method calls cookie data model redirect to checkout triggers method in production check if value is truthy cookie production-ready. Email and name open this file on server only MongoDB database check if value is truthy Put it all together check if value is truthy subsection API method S3 bucket. Production-ready API method session in production end user Google OAuth API in a browser open this file session compiles.

Finally, the only missing definition inside the following line of code is `mongoSchema`:

```
const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);
```

Let's define `mongoSchema`:

```
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
});
```

Now let's put everything together. Create a new file `User.ts` inside your `api` project. Place it at `book/4-begin/api/server/models/User.ts`. The content of the file is what we just discussed above:

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
});

interface UserDocument extends mongoose.Document {
  slug: string;
  createdAt: Date;
  email: string;
  displayName: string;
  avatarUrl: string;
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
}

const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);

export default User;
```

Done.

You successfully defined your first Mongoose Schema and Model!

In the next session, we will define the static methods `getUserBySlug` and `updateProfile`.

___

#### Static methods and Mongoose methods [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#static-methods-and-mongoose-methods)

We just defined data types for arguments (input) and result (output) for the static methods `getUserBySlug` and `updateProfile`. But why are these methods called static? A static method is a function that is assigned to the class and not the instance of the class. The nice thing about a static method is that it is available via the class's API.

Earlier we wrote:

```
const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);

export default User;
```

After we define the static methods `getUserBySlug` and `updateProfile`, you can import `User` model to any server-side file and simply call `User.getUserBySlug` or `User.updateProfile` methods in that file. This is what we mean by saying that a static method is "available via the class's API". This will come handy when we need to call model's static methods inside Express routes of our Express server `api`.

See this example of defining static methods:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static)

It is as easy as adding the word `static` in front of a function's name:

```
class ClassWithStaticMethod {
  static staticMethod() {
    return 'static method has been called.';
  }
}

console.log(ClassWithStaticMethod.staticMethod());
// expected output: "static method has been called."
```

In `mongoose`, you attach static methods to a data model by defining a new `class` with static methods and then attaching this class to model by calling the `mongoSchema.loadClass(class)` method:

[https://mongoosejs.com/docs/advanced\_schemas.html#creating-from-es6-classes-using-loadclass](https://mongoosejs.com/docs/advanced_schemas.html#creating-from-es6-classes-using-loadclass)

Let's define our static methods `getUserBySlug` and `updateProfile` for the class `UserClass`. The `UserClass` and its static methods:

```
class UserClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    const userDoc = await this.findOne({ slug }, 'email displayName').setOptions({ lean: true });

    return userDoc;
  }

  public static async updateProfile({ userId, name, avatarUrl }) {
    const user = await this.findById(userId, 'slug displayName');

    const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };

    if (name !== user.displayName) {
      modifier.displayName = name;
      modifier.slug = name;
    }

    return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
      .select('displayName avatarUrl slug')
      .setOptions({ lean: true });
  }
}
```

The `UserClass` and its static methods get attached to model `User` via `mongoSchema` like this:

```
mongoSchema.loadClass(UserClass);

const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);
```

We will define the `getUserBySlug` static method. In Chapter 6, when we are done implementing user authentication, we will remove or comment out the `getUserBySlug` static method as unnecessary. We introduce this method for educational purpose only. It is a simple method that calls one of the basic Mongoose API methods, `findOne`:

[https://mongoosejs.com/docs/api/model.html#model\_Model.findOne](https://mongoosejs.com/docs/api/model.html#model_Model.findOne)

The Mongoose API method `findOne` returns one document that satisfies a search condition. That's why earlier, inside the definition of `interface UserModel`, we wrote that the `getUserBySlug` static method returns value with shape of `UserDocument` document: `Promise<UserDocument>`. And for the `updateProfile` static, we wrote that it returns an array of documents: `Promise<UserDocument[]>`.

`findOne` accepts:

-   Condition, which is used for search. In our case, we pass `slug` as a condition.
-   Projection, which is used to decide which parameters of the MongoDB document to return.
-   Options. In our case the option is `setOptions({ lean: true })`. The `setOptions({ lean: true })` option of Mongoose increases performance for find-related Mongoose queries. When set, this option makes sure that we receive a plain JavaScript object instead of a MongoDB document that is burdened with a lot of metadata. We do so to make our queries to the database faster:

[https://mongoosejs.com/docs/api/query.html#query\_Query-setOptions](https://mongoosejs.com/docs/api/query.html#query_Query-setOptions)

According to official Mongoose docs, following queries can be used with `lean` option to increase performance: `find`, `findOne`, `findById`, `findOneAndUpdate`, and `findByIdAndUpdate`.

A side note on syntax - the code below:

```
const userDoc = await this.findOne({ slug }, 'email displayName').setOptions({ lean: true });
```

is a short version for:

```
const userDoc = await this.findOne({ slug: slug }, 'email displayName').setOptions({ lean: true });
```

We are not discussing how `async/await` works here, since we discussed `async/await` in depth in the previous chapter, Chapter 3.

`getUserBySlug` method returns a `User` MongoDB document inside corresponding Express route `/api/v1/public/get-user`. Since Mongoose API method `findOne` inside `getUserBySlug` method returns Promise, we can use `await` in front of it and `getUserBySlug` method should be asynchronous.

The second static method, `updateProfile`, is also an asynchronous method. Inside this method, two Mongoose API methods, `findById` and `findByIdAndUpdate`, both return Promise. Read about these two Mongoose API methods in official docs:

[https://mongoosejs.com/docs/api.html#model\_Model.findById](https://mongoosejs.com/docs/api.html#model_Model.findById)

[https://mongoosejs.com/docs/api/model.html#model\_Model.findByIdAndUpdate](https://mongoosejs.com/docs/api/model.html#model_Model.findByIdAndUpdate)

Inside `updateProfile` static method we will have `await` in front of `findById` but not `findByIdAndUpdate`. We do need to await for a result from the corresponding Promise. That's because of the usage of `updateProfile`, when we create an Express route later in this chapter, we will call the `updateProfile` method with the prepended `await`, like this:

```
const { updatedUser } = await updateProfile({ some argument });
```

If we did not have `await` in front of `updateProfile` inside the Express route, then we would have added `await` in front of `findByIdAndUpdate`, like so:

```
const result = return await this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
  .select('displayName avatarUrl slug')
  .setOptions({ lean: true });

return result;
```

Instead of simpler:

```
return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
  .select('displayName avatarUrl slug')
  .setOptions({ lean: true });
```

When using the `findByIdAndUpdate` Mongoose API method, we passed two optional parameters. We passed a `new: true` option that ensures that we return an updated document. We also passed a `runValidators: true` to validate `modifier.slug` and `modifier.displayName` against the User's schema, to make sure values are of `string` type. For example, if `modifier.displayName` is a `number` type instead of a `string`, Mongoose will throw an error. Running validators is one of the reasons why we decided to use Mongoose. Later in this chapter, we will test how validation of data types works on the client and on the server.

Store method calls Material-UI session request was sent HTTP team members request request was sent AWS dashboard this chapter new Express route HTTP team members redirect to checkout show notification. In production server-side rendering this chapter server-side rendering end user Material-UI triggers method AWS dashboard conditional operator production-ready Next.js web application. Send this response Team Leader it works as expected Remember to add import conditional operator static method calls. You already learned API method discussion if truthy then Google OAuth API Put it all together data model Put it all together S3 bucket MongoDB database Material-UI new Express route redirect to checkout withAuth HOC static method calls. Show notification Team Leader You already learned server-side rendering session check if value is truthy Put it all together check if value is truthy API method calls corresponding store method session We will discuss. In a browser check if value is truthy response production-ready on the client Navigate to Next.js web application Navigate to API infrastructure add environmental variable add environmental variable. Server-side rendering request end user this chapter Put it all together store method calls list of posts. In production Remember to add import decorate method with action We will discuss Team Leader MongoDB database API infrastructure Remember to add import in production response session request was sent this chapter. Request API method calls corresponding store method S3 bucket static method calls this chapter page component send this response email and name email and name Navigate to Next.js web application server-side rendering. End user on server only MongoDB database S3 bucket team members server-side rendering on the client AWS dashboard.

Let's define `getUserBySlug` and `updateProfile` methods, and add them to `./book/4-begin/api/server/models/User.ts` file, so the content becomes:

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
  darkTheme: Boolean,
});

export interface UserDocument extends mongoose.Document {
  slug: string;
  createdAt: Date;
  email: string;
  displayName: string;
  avatarUrl: string;
  darkTheme: boolean;
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
}

class UserClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    const userDoc = await this.findOne({ slug }, 'email displayName').setOptions({ lean: true });

    return userDoc;
  }

  public static async updateProfile({ userId, name, avatarUrl }) {
    const user = await this.findById(userId, 'slug displayName');

    const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };

    if (name !== user.displayName) {
      modifier.displayName = name;
      modifier.slug = name;
    }

    return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
      .select('displayName avatarUrl slug')
      .setOptions({ lean: true });
  }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model<UserDocument, UserModel>('User', mongoSchema);

export default User;
```

Here's a good exercise - look at definition of `updateProfile` method and try to simplify our definition of `getUserBySlug`.

Do you see how?

Inside the `updateProfile` - we wrote `return this.findByIdAndUpdate`. We can do the same inside `getUserBySlug`. The current definition is:

```
public static async getUserBySlug({ slug }) {
  const userDoc = await this.findOne({ slug }, 'email displayName').setOptions({ lean: true });

  return userDoc;
}
```

To make it simpler:

```
public static async getUserBySlug({ slug }) {
  return this.findOne({ slug }, 'email displayName').setOptions({ lean: true });
}
```

We are able to simplify like this because we will use `await` in front of `getUserBySlug` inside the corresponding Express route, Express route `/api/v1/public/get-user`. We define this Express route in the next section.

Let's also add a `console.log` statement to check that `getUserBySlug` does get executed:

```
public static async getUserBySlug({ slug }) {
  console.log('Static method');
  return this.findOne({ slug }, 'email displayName').setOptions({ lean: true });
}
```

We will discuss the usage of `public/private` in front of a class's method later in this chapter when we work on page's methods for `YourSettings` page.

___

#### Express routes, router and API methods [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-router-and-api-methods)

In this subsection, we will get one step closer to testing our database connection. Look at the below diagram. It is helpful for understanding what else we need to implement:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/User.png)

You already defined `User` data model and two static methods for it. You used Mongoose API methods to define these static methods.

In our `api` project, we already have the Express route `/api/v1/public/get-user` (see Chapter 3), but we do not have these Express routes: `/api/v1/public/get-user-by-slug` and `/api/v1/public/user/update-profile`.

In our `app` project, we already have the API method `getUserApiMethod` but we do not have these API methods: `getUserBySlugApiMethod` and `updateProfileApiMethod`.

Let's start with missing Express routes (also called Express handlers). Open `book/4-begin/api/server/server.ts`. There, you can find our very first Express route, which we defined in Chapter 3:

```
server.get('/api/v1/public/get-user', (_, res) => {
  res.json({ user: { email: 'team@builderbook.org' } });
});
```

`user` object has hardcoded value for now. We will modify this Express route when we are done with user authentication, in Chapter 5.

Let's define new Express route `/get-user-by-slug` that calls the static method `User.getUserBySlug` like this:

```
server.post('/get-user-by-slug', async (req, res, next) => {
  console.log('Express route');
  try {
    const { slug } = req.body;

    const user = await User.getUserBySlug({ slug });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
```

A few important points about the above definition:

-   First, we used `await` prepended to the `User.getUserBySlug` static method because it returns Promise (via corresponding Mongoose API method). Because we used `await` here, earlier in `book/4-begin/api/server/models/User.ts` we wrote `return this.findOne` instead of `return await this.findOne`.
    
-   Second, we changed the request method from `GET` to `POST`. This is purely optional. We could have kept request's method `GET` and passed `slug` value as `req.query.slug`. But for educational reason, we passed `slug` value as `req.body.slug` and made request's method `POST`. The `GET` request should not have body.
    
-   Third, Express framework suggests calling `next(err)` in each Express route if we want to catch errors from any Express route by "error-handling middleware":
    
    [http://expressjs.com/en/guide/error-handling.html](http://expressjs.com/en/guide/error-handling.html)
    
    We will define error-handling middleware `handleError` in a bit, later in this subsection.
    

The second Express route, `/api/v1/public/user/update-profile`, is very similar to `/api/v1/public/get-user-by-slug`:

```
server.post('/user/update-profile', async (req, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    const userId = 'someString';

    const updatedUser = await User.updateProfile({
      userId,
      name,
      avatarUrl,
    });

    res.json({ updatedUser });
  } catch (err) {
    next(err);
  }
});
```

In previous chapters, we discussed `try/catch` and `async/await`. So we will not discuss these concepts in detail here. Please do note that we used `await` in front of `User.updateProfile`. By having this `await` statement, we were able to **not have** `await` in front of `this.findByIdAndUpdate` inside:

```
return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
  .select('displayName avatarUrl slug')
  .setOptions({ lean: true });
```

It's important to point out that for both of Express routes, we did not include `/api/v1/public/` part of API endpoint. We discuss why just belows.

We need to add these two Express routes (`/api/v1/public/get-user-by-slug` and `/api/v1/public/user/update-profile`) to the server code of our `api` server located at `./book/4-begin/api/server/server.ts`. Our final SaaS boilerplate will have over two dozen Express routes, which would have resulted in massive and hard-to-read server code. The creators and maintainers of Express thought about this organizational challenge and thus introduced Express router:

[http://expressjs.com/en/guide/routing.html#express-router](http://expressjs.com/en/guide/routing.html#express-router)

Express router allows you to organize all of your Express routes into modules and then mount these modules as an Express middleware on your Express server. We talked about middleware and mounting it on the server in Chapter 3. For example, we mounted JSON parser middleware by simply adding this line to the server code upstream of Express route:

```
server.use(express.json());
```

Let's see how Express router achieves modularity:

-   Create a new folder and new file: `./book/4-begin/api/server/api/public.ts`. Note, we created a new folder called `api` and a new file called `public.ts` inside of `server` folder. The content of this new file is as follows:
    
    ```
      import * as express from 'express';
    
      import User from '../models/User';
    
      const router = express.Router();
    
      // router.get('/get-user', (req, res) => {
      //   res.json({ user: { email: 'team@builderbook.org' } });
      // });
    
      router.post('/get-user-by-slug', async (req, res, next) => {
        console.log('Express route');
        try {
          const { slug } = req.body;
    
          const user = await User.getUserBySlug({ slug });
    
          res.json({ user });
        } catch (err) {
          next(err);
        }
      });
    
      router.post('/user/update-profile', async (req: any, res, next) => {
        try {
          const { name, avatarUrl } = req.body;
    
          // define userId
    
          const userId = 'someString';
    
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
    
      export default router;
    ```
    
    Remember to open and delete Express route `/api/v1/public/get-user` from the `book/4-begin/api/server/server.ts` file. Note that `server.get` became `router.get`, also API endpoint's value `/api/v1/public/get-user` became `/get-user`. We will explain why we were able to make such changes below.
    
    A few important notes:
    
    We imported the `User` model to be able to call the static method `User.updateProfile`.
    
    We created an Express router with `const router = express.Router();`.
    
    We commented out the very first Express route, since `req.user` does not exist and until we introduce user authentication in future chapters.
    
    The data that we send from `app` project to `api` project is saved inside request's body. We have to extract data from body with:
    
    ```
      const { slug } = req.body;
    ```
    
    and
    
    ```
      const { name, avatarUrl, userId } = req.body;
    ```
    
-   Create a new file `./book/4-begin/api/server/api/index.ts`. This is the file where we will import all Express routers in our `api` project. The content of this file is:
    
    ```
      import * as express from 'express';
    
      import publicExpressRoutes from './public';
      import teamMemberExpressRoutes from './team-member';
    
      function handleError(err, _, res, __) {
        console.error(err.stack);
    
        res.json({ error: err.message || err.toString() });
      }
    
      export default function api(server: express.Express) {
        server.use('/api/v1/public', publicExpressRoutes, handleError);
        server.use('/api/v1/team-member', teamMemberExpressRoutes, handleError);
      }
    ```
    
    What happens here? We exported `router` from `./book/4-begin/api/server/api/public.ts` and we imported it **as** `publicExpressRoutes` to the `book/4-begin/api/server/api/index.ts` file. In this `book/4-begin/api/server/api/index.ts` file, we created a function called `api`. This function takes our Express server as an argument and mounts two Express middlewares (eventually three). For each middleware, we prepend the path with a string and mount `handleError` middleware. `handleError` prints error to server logs and sends response (from `api` to `app`) with body that contains `error` object.
    
    This is how we achieved modularity! All Public Express routes inside `public.ts` file, all Team Member Express routes inside `team-member.ts` file. Eventually we will put all Team Leader Express routes inside `team-leader.ts` file. We will talk about differences between these three groups of Express routes later in the book.
    
    You saw that we prepend `/api/v1/public` string to all Public Express routes - now you know why removed `/api/v1/public` from Express routes. It is easier to write and read this way. And prepend only in one place, in `book/4-begin/api/server/api/index.ts` file.
    
-   We exported the function called `api`. Now we need to import this function and call it inside the Express server of `api` project. Open `book/4-begin/api/server/server.ts` and update like this:
    
    ```
      import './env';
      import * as express from 'express';
    
      import api from './api';
    
      const server = express();
    
      server.use(express.json());
    
      api(server);
    
      server.get('*', (_, res) => {
        res.sendStatus(403);
      });
    
      server.listen(process.env.PORT_API, () => {
        console.log(`> Ready on ${process.env.URL_API}`);
      });
    ```
    
    Note that we imported the `api` function using `import api from './api';` instead of `import api from './api/index.ts';`. Both statement achieve the same but the former might be faster to write and read.
    
    As long as you import and call `api` function in our `api` server, all Express routes from `./book/4-begin/api/server/api/index.ts` will mounted on `api` server.
    

We are done with Express routes for now!

Our next stop is API methods. Express routes are in our `api` project, and API methods are in our `app` project:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/User.png)

As you already guessed. For each group of Express routes (Public, Team Member, Team Leader), we will have a corresponding group of API methods. We will store `getUserBySlugApiMethod` and `updateProfileApiMethod` API methods inside Public API methods, at the `./book/4-begin/app/lib/api/public.ts` file. And although `updateProfileApiMethod` is not technically Public API method, we will put in `public.ts` and move it to `team-member.ts` file **after** we introduce user authentication in our web application.

Open `./book/4-begin/app/lib/api/public.ts` file and make following changes:

```
import sendRequestAndGetResponse from './sendRequestAndGetResponse';

const BASE_PATH = '/api/v1/public';

// export const getUserApiMethod = (request) =>
//   sendRequestAndGetResponse(`${BASE_PATH}/get-user`, {
//     request,
//     method: 'GET',
//   });

export const getUserBySlugApiMethod = (slug) =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-user-by-slug`, {
    body: JSON.stringify({ slug }),
  });

export const updateProfileApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/user/update-profile`, {
    body: JSON.stringify(data),
  });
```

Note that we did not specify a method, because the default request's method is `POST`. For requests with method `POST` we pass data using request's body, `req.body`. If in doubt, check up the definition of our `sendRequestAndGetResponse` method inside `./book/4-begin/app/lib/api/sendRequestAndGetResponse.ts`.

Put it all together You already learned API method triggers method send this response this chapter AWS dashboard AWS dashboard end user compiles data model end user API method AWS dashboard. Remember to add import AWS dashboard discussion server-side rendering HTTP send this response withAuth HOC it works as expected in production add environmental variable request Remember to add import. Cookie in a browser Next.js web application in production in a browser cookie S3 bucket Put it all together Click on the button store method calls cookie triggers method withAuth HOC triggers method. Store method calls Next.js web application request was sent it works as expected check if value is truthy. Send this response in this book withAuth HOC if truthy then MongoDB database check if value is truthy. API infrastructure production-ready production-ready request if truthy then in production add environmental variable on the client send this response HTTP data model You already learned team members response We will discuss. Click on the button MongoDB database session send this response mount middleware email and name. Data model add environmental variable add environmental variable static method calls data model S3 bucket open this file Navigate to subsection Click on the button static method calls server-side rendering Material-UI page component store method calls. Google OAuth API page component cookie We will discuss S3 bucket in this book At AWS dashboard. Material-UI redirect to checkout S3 bucket withAuth HOC withAuth HOC.

Remember that methods we created inside `app` project's are so-called API methods. They send request from `app` project (browser or server) to `api` project and should not be confused with static methods for data models. Static method for data models are located in `api` project and call corresponding Mongoose API methods to CRUD data in our database.

Generally, we encourage you to be as descriptive as possible in naming methods inside your web applications. Thus we appended `ApiMethod` to the name of each API method. That way, these API methods are not confused with their corresponding static methods in our `User` data model. If you like, you can append `StaticMethod` if you like to each static method.

We commented out the method `getUserApiMethod`, since we don't use it for now, we will use it after we add user authentication.

Let's review the API infrastructure for for retrieving user data from database using `api` project and displaying it on some page of `app` project:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/User.png)

We are almost done. In the following section, we will create a hosted MongoDB database at MongoDB Atlas. We will then connect our `api` server to this database and finally test out entire infrastructure.

___

## MongoDB database [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#mongodb-database)

In the previous section, we wrote a lot of code for our new API infrastructure: API methods at `app` project, Express routes at `api` project, static methods for `User` data model at `api` project.

In this section we will:

-   Create a new MongoDB database at MongoDB Atlas.
-   Connect our `api` server to this database.
-   Test out the above infrastructure by calling the `getUserBySlugApiMethod` API method when `Index` page is requested.

___

#### MongoDB Atlas [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#mongodb-atlas)

We recommend creating a **free tier** database cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Sign up for MongoDB Atlas and follow this simple tutorial to create a free cluster:

[https://docs.atlas.mongodb.com/getting-started/#b-create-an-service-free-tier-cluster](https://docs.atlas.mongodb.com/getting-started/#b-create-an-service-free-tier-cluster)

Redirect to checkout on the client Material-UI send this response Click on the button API method calls corresponding store method Next.js web application open this file production-ready redirect to checkout page component HTTP mount middleware. Page component discussion team members it works as expected Google OAuth API API infrastructure triggers method new Express route triggers method Click on the button team members open this file. WithAuth HOC withAuth HOC compiles data model Material-UI At AWS dashboard this chapter on server only. Google OAuth API on the client page component Google OAuth API it works as expected response You already learned cookie mount middleware in production Click on the button end user MongoDB database. Show notification You already learned redirect to checkout API infrastructure conditional operator list of posts on server only server-side rendering withAuth HOC withAuth HOC static method calls mount middleware You already learned data model in a browser. Request was sent team members in a browser Navigate to compiles show notification. Remember to add import end user At AWS dashboard request Put it all together HTTP. Page component email and name this chapter AWS dashboard We will discuss response cookie subsection At AWS dashboard server-side rendering Put it all together subsection Navigate to. Material-UI Remember to add import production-ready open this file compiles static method calls static method calls. Decorate method with action end user in a browser Click on the button MongoDB database subsection check if value is truthy S3 bucket it works as expected production-ready Team Leader Google OAuth API Navigate to Put it all together.

Before you create your database on MongoDB Atlas dashboard, you need to create Project and then Cluster. Hierarchy is Project > Cluster > Database > Collection > MongoDB Document. In other words, Project can contain multiple Clusters, Cluster can contain multiple Databases and etc.

Below are screenshots to help you create your free database cluster at MongoDB Atlas. After signup, while at your dashboard, find and click the green `Build a New Cluster` button on the right:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/image.png)

On the above screenshot, you see an existing cluster. That's because we already created one.

Fill out and submit a form to create a new cluster. We suggest setting up a provider region and name, then choosing a free cluster tier `M0 tier`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/image2.png)

We chose `AWS` as our provider, `us-east-1` as the region, `M0` as the cluster (if you are starting out and have no real customers, select `M0` cluster, it has shared resources but it is free), and `Cluster0` as the cluster's name. At the bottom of the form, click the green button `Create Cluster`.

After clicking the button, you will be redirected to the main view of the dashboard. While your free cluster is being deployed, you will see a blue progress bar that indicates the status.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/image3.png)

After your cluster is successfully deployed, the progress bar disappears and the created cluster appears on the list of all of your clusters at the main view of your dashboard. The cluster that you just created can contain multiple MongoDB databases. If you created a free cluster, please keep in mind that the free cluster has relatively limited resources (CPU and memory). All of your databases within a cluster share these limited resources. We named our cluster `Cluster0`. You can name your cluster anything you like. We recommend keeping the cluster's name informative and including some random string into it to make guessing database's URL harder. For testing purposes, short and informative name for cluster will suffice.

If you just created a new MongoDB Atlas account, then you should create your first database user. Click the `Security > Database Access` link on the left menu:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-20+16-08-20.png)

You create Database User per Project on MongoDB Atlas dashboard. In other words, all Clusters and their Databases within Project can be accessed by Database User you about to create. Click the green `+ ADD NEW USER` button on the right. A form to create a new database user will appear. No need to modify any of the selected options. But do fill out `username` and `password` and click the green `Add User` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-20+16-16-20.png)

You need to save these `username` and `password` values somewhere safe. You will need these values later to construct a `MONGO_URL` environmental variable, which we will use to connect our API server to the database.

Since the form's default settings may change over time, make sure that the authentication method is `PASSWORD` and that the user privileges are `Read and write to any database`.

Alright, you created a new cluster and a new database user. This database user has read and write access to any database **in this cluster**.

We created a database user that will have permission to read/write from all databases in our cluster. To access the database from anywhere, we need to whitelist the `0.0.0.0/0` IP address in the `Network access` tab of our cluster:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-11+09-19-10.png)

Whitelisting the `0.0.0.0/0` IP address allows anyone on the web to access the databases in the cluster, providing that they possess `MONGO_URL` value that contains the proper username and password for the database user.

Finally, let's create a new database in our cluster. Click on the `Collections` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-20+16-25-59.png)

Then click on the `+ Create Database` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-20+16-24-21.png)

Let's call this database `test` and the first collection `users`. Keep the `Capped Collection` option unchecked. Click `Create`.

Done!

___

#### Creating MongoDB document [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#creating-mongodb-document)

To summarize, in the previous subsection, you created:

-   New Project.
-   New Cluster within this Project.
-   New Database User with read/write privileges within this Project.
-   New Database `test` within this Cluster.
-   And, finally, new collection `users` within the `test` Database.

In this subsection, we create a new MongoDB document inside the `users` collection of the `test` database.

Our goal is to create a dummy `User` MongoDB document within the `users` collection. Then we will display data from this `User` MongoDB document on the `Index` page of our `app` project. If we see proper data, then we successfully connected our `api` server to the `test` database and successfully connected `app` project to `api` project.

Go to the list of your clusters at MongoDB Atlas. Find your cluster and click `Collections` on the cluster's item. You will see a list of available databases within the cluster. Click on the `users` collection inside the `test` database. Since we did not write any code that creates dummy `User` MongoDB document, let's manually create a new document in the `users` collection. After clicking on the `users` collection inside your `test` database, click on the green `+ INSERT DOCUMENT` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-20+17-55-32.png)

Add the following parameters and value pairs to the new MongoDB document:

```
createdAt: 2017-12-17T02:05:57.426+00:00
email: team@builderbook.org
displayName: Team Builder Book
avatarUrl: "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=128"
slug: team-builder-book
```

MongoDB Atlas will automatically generate `id` for a new MongoDB document, so your task is to add `createdAt` (type `Date`), `email` (type `String`), `displayName` (type `String`), `avatarUrl` (type `String`), and `slug` (type `String`) to the document. After you are done adding these parameters and their values, click the green `Insert` button. You will see a newly created `User` MongoDB document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-20+18-15-06.png)

___

#### Connecting database [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#connecting-database)

At this point, we created a Project, free Cluster, Database User, Database, Collection, and MongoDB document.

Although our database exists, we still did not connect it to our `api` server.

Connecting our Express server (`api` project is practically Express server) to the MongoDB is straightforward. Import `mongoose` to the `book/4-begin/api/server/server.ts` file and then call the `mongoose.connect` method with two arguments: `process.env.MONGO_URL_TEST` and `options`. Here is a link to the official docs:

[https://mongoosejs.com/docs/connections.html](https://mongoosejs.com/docs/connections.html)

Example from official docs:

```
mongoose.connect('mongodb://localhost:27017/myapp', {useNewUrlParser: true});
```

Updated file `book/4-begin/api/server/server.ts` will look like this:

```
import './env';
import * as express from 'express';
import * as mongoose from 'mongoose';

import api from './api';

import logger from './logs';

mongoose.connect(process.env.MONGO_URL_TEST);

const server = express();

server.use(express.json());

api(server);

server.get('*', (_, res) => {
  res.sendStatus(403);
});

server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

In the previous subsection, we created a free cluster at MongoDB Atlas. Now let's construct our `MONGO_URL_TEST` string, since we need it as an argument for the `mongoose.connect` method.

To make this string, click **Connect** on your free cluster (**Cluster0**) on the list of clusters:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/image4.png)

On the next screen, select the option **Connect Your Application**:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/image5.png)

For us, `MONGO_URL_TEST` looks like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-24+15-51-42.png)

Note that we replaced `username` with `xxxxxx` for security reasons. In the previous subsection where you created a database user, this database user has `username` and `password`. Take these two values and plug them into the `MONGO_URL_TEST` string that has this value:

```
mongodb+srv://<username>:<password>@cluster0-eoobe.mongodb.net/<db>?retryWrites=true&w=majority
```

`db` is the name of the database that we created earlier. For us, the value is `test`.

Replace `<username>`, `<password>`, and `<db>` with your actual values:

```
mongodb+srv://<username>:<password>@cluster0-eoobe.mongodb.net/<db>?retryWrites=true&w=majority
```

It's important that you use a string that MongoDB Atlas shows **you**, since this string is unique to a cluster's name and other parameters.

Remember to add the resulting string as a value for the environmental variable `MONGO_URL_TEST` inside the `.env` file at the root of `api` project.

___

#### Testing connection [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-connection)

We are ready for testing. Let's go over our check list:

-   (done) API infrastructure at `app` and `api` projects.
-   (done) Project, Cluster, Database User, Database, Collection, and MongoDB document.
-   (done) `MONGO_URL_TEST` is added and `mongoose.connect` is called on `api` Express server.

The only thing left is to make sure that `getUserApiMethod` API method gets called when the `Index` page gets requested.

We need to pass `slug` value to the `getUserApiMethod` API method, get result from it then display `email` and `displayName` data that came all the way from our database.

If we successfully fetch data from our database, then we will prove that connection of `app` to `api` and connection of `api` to MongoDB database work as expected.

Open `book/4-begin/app/pages/index.tsx`, import `getUserApiMethod` API method and call it inside `Index.getInitialProps` method like this:

```
import Button from '@material-ui/core/Button';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '../components/layout';
import NProgress from 'nprogress';

import confirm from '../lib/confirm';
import notify from '../lib/notify';
import { getUserBySlugApiMethod } from '../lib/api/public';

type Props = { user: { email: string; displayName: string } };

class Index extends React.Component<Props> {
  public static async getInitialProps() {
    const slug = 'team-builder-book';

    const user = await getUserBySlugApiMethod(slug);

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
          <p>Your email: {this.props.user.email}</p>
          <p>Your name: {this.props.user.displayName}</p>
        </div>
      </Layout>
    );
  }
}

export default Index;
```

To summarize, here are the changes we made to the `Index` page:

-   We imported and called `getUserBySlugApiMethod` API method instead of `getUserApiMethod` API method inside `Index.getInitialProps` method.
    
-   We did not pass `ctx` as an argument for `Index.getInitialProps`, since we don't need to access `ctx`.
    
-   We added an extra property to the `user` prop:
    
    ```
      type Props = { user: { email: string; displayName: string } };
    ```
    
-   We hardcoded value for `slug` variable:
    
    ```
      const slug = 'team-builder-book';
    ```
    
-   We passed `slug` as an argument to `getUserBySlugApiMethod` API method:
    
    ```
      const user = await getUserBySlugApiMethod(slug);
    ```
    
-   We displayed values for `email` and `displayName` on the `Index` page:
    
    ```
      <p>Your email: {this.props.user.email}</p>
      <p>Your name: {this.props.user.displayName}</p>
    ```
    

We are ready to test!

We need both project running, start `app` and `api`, each with `yarn dev`.

On your VS editor, open two terminal windows by clicking the `Split Terminal` icon:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+11-49-53.png)

On the left terminal window, navigate to the `app` folder.

On the right terminal window, navigate to the `api` folder.

In each terminal window, simply run the command `yarn dev`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+13-18-03.png)

We wrote a lot of code in this chapter! Thus as a reminder, we are currently testing whether we properly built the following infrastructure:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/User.png)

When we load the `Index` page on the browser by navigating to `http://localhost:3000`, we will call the API method `getUserBySluApiMethod`. If the code we wrote in this chapter works as expected, then:

-   The left terminal window will print the API endpoint from `book/4-begin/app/lib/api/sendRequestAndGetResponse.ts`
    
    ```
      console.log(`${process.env.URL_API}${path}${qs}`);
    ```
    
-   The left terminal will also print the `user` object with two parameters, `email` and `displayName`, from `book/4-begin/app/pages/index.tsx`:
    
    ```
      console.log(user);
    ```
    
-   The right terminal window will print `Static method` from `book/4-begin/api/server/models/User.ts`:
    
    ```
      console.log('Static method');
    ```
    
-   The right terminal window will also print `Express route` from `book/4-begin/api/server/api/public.ts`:
    
    ```
      console.log('Express route');
    ```
    

Let's do it. While both servers are running, navigate to `http://localhost:3000/` on your browser:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+13-23-11.png)

Nice! The `Index` page displays data that we manually added to the database at MongoDB Atlas!

Terminal outputs:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+13-23-43.png)

The left terminal window:

```
http://localhost:8000/api/v1/public/get-user-by-slug
{
  user: {
    _id: '5c8edb6477846b4659f5f736',
    email: 'team@builderbook.org',
    displayName: 'Team Builder Book'
  }
}
```

The `findOne` method with `setOptions({ lean: true })` returns a plain JS object instead of object that represents MongoDB document, such object is stripped of a lot of unnecessary metadata and some methods:

[https://mongoosejs.com/docs/api/query.html#query\_Query-setOptions](https://mongoosejs.com/docs/api/query.html#query_Query-setOptions)

Such object can be 10x or more smaller than object that represents entire MongoDB document. We recommend using `lean: true` option for read-only Mongoose API methods, such as `findOne` or `findById` and other find-related queries (see above link to official docs).

The right terminal window:

```
Express route
Static method
```

The data on the `Index` page and outputs from the terminal windows prove that the infrastructure we built so far in this chapter behaves as it should. Thus good job! You just built your first "two-project with database" API infrastructure in this book.

___

## MongoDB index [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#mongodb-index)

In this section, you will learn about MongoDB index, various types of indexes, and their purposes.

Log in to your MongoDB Atlas dashboard. Go to the new cluster you created earlier in this chapter. Navigate to the `test` database and `users` collection. Click on the `users` collection, then click on the `Indexes` tab on the right:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-04+11-46-29.png)

On the `Indexes` tab, you a see a list of 3 indexes on the `test.users` collection. You may notice that the two indexes `slug_1` and `email_1` are unique. In fact, when you start your `api` server, it checks for the presence of these indexes. If they don't exist, the `api` server creates them.

Go ahead and click the `Drop Index` button next to the `email_1` index. Then, on your terminal, navigate to `book/4-begin/api` and run `yarn dev`.

Reload the page while you are on the `Indexes` tab of the `test.users` collection. You will see that `email_1` was indeed recreated automatically.

Although the `_id_` index is not labeled as a unique index on the MongoDB Atlas dashboard, it is indeed a unique index. You cannot delete it, and MongoDB automatically creates a `unique` index `_id_` for every collection.

So what is a MongoDB index? What is the reason to have index for collection? What is `unique` index?

In MongoDB, a collection contains documents (for example, `users` collection contains `User` MongoDB documents). When you want to find one document in a database by, say, the `_id` parameter - the database has to scan each MongoDB document, which may have many fields, within the entire collection, this procedure is called collection scan. A collection scan can take a long time if collection is large and each document has many fields. An index is a data structure that stores values for only one or a few fields - so our database saves time by scanning an index (think of it as index collection) instead of performing a collection scan:

[https://docs.mongodb.com/manual/indexes/#index-types](https://docs.mongodb.com/manual/indexes/#index-types)

However, we have to configure MongoDB to create an index for fields we need. Since finding by `_id` is a popular query, MongoDB database automatically creates a unique index for `_id` field. As a result of it, search by `_id` is faster than if it was a full collection scan.

A `unique` index is just one type of index:

[https://docs.mongodb.com/manual/core/index-unique/](https://docs.mongodb.com/manual/core/index-unique/)

A `unique` index, such as `email_1`, serves two purposes:

-   It allows the database to search for a document by email much faster.
-   It ensures that a collection does not contain two documents with the same value for the `email` field. This is also true for other unique indexes, for example, `slug_1` and `_id_`. If we try to create a document with `email: "abc@example.com"`, and the collection already has a document with `email: "abc@example.com"`, then we will see an error from MongoDB. The error will contain:
    
    ```
    E11000 duplicate key error index
    ```
    

We can create a `unique` index `email_1` by adding a single line to our `book/4-begin/api/server/models/User.ts` file:

```
mongoSchema.index({ email: 1 }, { unique: true } )
```

But we already chose an alternative way to create a `unique` index:

```
email: {
  type: String,
  required: true,
  unique: true,
}
```

That's why if you delete index on MongoDB Atlas dashboard and restart `api` server, `email_1` index gets automatically recreated.

How is this `email_1` index useful? For example, you can use a simple Mongoose API method `findOne({ email: "some value" })` to search for one unique document within a collection. You query will be faster than full collection scan and you don't need to worry that there may be more than one document that satisfies the search condition.

If you made an index for just one parameter, it is called a `single field` index:

[https://docs.mongodb.com/manual/core/index-single/](https://docs.mongodb.com/manual/core/index-single/)

So technically speaking, the above 3 `unique` indexes that we discussed (`email_1`, `slug_1`, `_id_`) are `unique single field` indexes.

An index that has two or more parameters is called a `compound` index:

[https://docs.mongodb.com/manual/core/index-compound/](https://docs.mongodb.com/manual/core/index-compound/)

A compound index has the same purpose as a single field index. For example, later in this book we introduce a new collection called `invitations`. We will create a compound index for the `invitations` collection with:

```
mongoSchema.index({ teamId: 1, email: 1 });
```

So how does it benefit us to have the above compound index? Same as a single index - better search performance. Searching within a collection will be faster than the full colelction scan in the following 3 cases:

-   When you perform a search by `teamId`
-   When you perform a search by `email`
-   When you perform a search by by both `teamId` and `email`

It's faster for the same reason as the single field index. The database will spend less time searching by not performing a collection scan. The database will instead use a smaller data structure, a `compound` index.

Put it all together Next.js web application new Express route request was sent Material-UI server-side rendering response triggers method S3 bucket MongoDB database Team Leader request Google OAuth API in a browser redirect to checkout. Click on the button mount middleware withAuth HOC send this response show notification HTTP team members cookie on the client S3 bucket AWS dashboard on server only API method calls corresponding store method Navigate to redirect to checkout. Compiles Remember to add import in this book production-ready Google OAuth API send this response. API method triggers method request was sent open this file if truthy then We will discuss discussion on server only API infrastructure We will discuss. Conditional operator this chapter We will discuss page component AWS dashboard subsection Remember to add import data model Next.js web application request was sent. Production-ready open this file if truthy then on server only send this response in production. End user S3 bucket discussion on the client discussion You already learned add environmental variable cookie. Team Leader team members on server only decorate method with action conditional operator compiles server-side rendering server-side rendering team members response on the client response in a browser. Click on the button withAuth HOC AWS dashboard send this response response. End user Next.js web application request was sent decorate method with action on the client.

As you may guess, a `compound` index can be also `unique`. And yes, it's name is a `unique compound` index:

[https://docs.mongodb.com/manual/core/index-unique/#unique-compound-index](https://docs.mongodb.com/manual/core/index-unique/#unique-compound-index)

In fact, for the `invitations` collection, we indeed need to create a `unique compound` index. We will do it later in this book with one line of code:

```
mongoSchema.index({ teamId: 1, email: 1 }, { unique: true });
```

Again, the above `unique compound` index will have all the benefits of a `compound` index, plus one more benefit. MongoDB will prevent the collection from having two documents with an identical **combination** of `teamId` and `email` values. This is actually very handy for the business logic of invitations. Think of your web application's end users. When you send someone an invitation to join a team, you want the following to be true:

-   There can be invitations with same `teamId`, but the `email` value must be unique (all people invited to the same Team must have unique emails).
-   There can be invitations with same `email`, but the `teamId` value must be unique (the same person can have multiple Invitations to multiple Teams but cannot have more than 1 Invitation to the same Team).

Now you know about `single field`, `unique single field`, `compound`, and `unique compound` indexes.

You can always add indexes later on in your web application once you know which queries your project uses. Indexes improve search performance within a collection and ensure the uniqueness of values for one or more fields.

___

## Jest testing for TypeScript [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#jest-testing-for-typescript)

If you build a small software project as a single developer, chances are you don't need to create too many automated tests for your code. On the other hand, imagine that your project is large and requires multiple people working on it. Perhaps someone makes a change to some method you initially wrote without thinking through all consequences of such change. Your team member or you can test this method manually and, in addition, you can run an automated test.

If you are in early stages of your software business, we recommend that you don't obsess over automated testing. Typically, you write tests when your team is large and your codebase is built by more than one person. That usually happens later in your business lifetime.

However, the SaaS boilerplate you are building in this book is not a small project (> 20,000 lines of code), we will briefly discuss automated testing of one method code using Jest library:

[https://jestjs.io/](https://jestjs.io/)

Below, we will create a method called `generateSlug`. Then we will create an automated test to see whether this method works as expected.

___

#### generateSlug method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#generateslug-method)

In this section, you will learn to create an automated test for one method of your web application. Once you learn it, you can create automated tests for any number of methods or even entire API infrastructures. In particular, we will create 1 test suite that contains 3 tests for a `generateSlug` method. Before we create these tests, we have to define our `generateSlug` method.

The purpose of `generateSlug` is to generate a `slug` out of a `name` (in the case of our `User` data model, out of a `displayName`). But this method should not just generate any `slug` - it should generate a **unique** `slug`.

To generate a unique `slug`:

-   Let's define `slugify` method that takes `text` as an argument and calls `kebabCase` method from the Lodash library to generate `slug`
    
    [https://devdocs.io/lodash~4/index#kebabCase](https://devdocs.io/lodash~4/index#kebabCase)
    
    We define our `slugify` method as:
    
    ```
      const _ = require('lodash');
    
      const slugify = text => _.kebabCase(text);
    ```
    
    To learn more about `kebabCase`, check up the above link to official docs. Here are examples of how `kebabCase()` works:
    
    ```
      _.kebabCase('Foo Bar');
      // => 'foo-bar'
    
      _.kebabCase('fooBar');
      // => 'foo-bar'
    
      _.kebabCase('__FOO_BAR__');
      // => 'foo-bar'
    ```
    
    As you can see, `kebabCase` internally uses a combination of JavaScript's methods such as `.toString()`, `.toLowerCase()`, `.trim()`, and `.replace`. This is exactly what we need to convert `name` into `slug`.
    
    However, this `slug` value is not `unique`. To check if value is indeed unique, we have to check our database.
    
-   Next, let's define `generateSlug` that generates `slug` by calling `slugify` **and** checking database to ensure uniqueness. Before `generateSlug` returns unique value, it has to search our database for a document with `slug: origSlug`:
    
    -   If such document does not exist, then the method will deem the originally generated `origSlug` as a unique value.
        
    -   If such document exists, then `origSlug` value is not unique, `generateSlug` will call the `createUniqueSlug` method to generate unique value.
        
        Here is JavaScript version of the above description:
        
        ```
        async function generateSlug(Model, name, filter = {}) {
        const origSlug = slugify(name);
        
        const obj = await Model.findOne({ slug: origSlug, ...filter })
          .select('_id')
          .setOptions({ lean: true });
        
        if (!obj) {
          return origSlug;
        }
        
        return createUniqueSlug(Model, origSlug, 1, filter);
        }
        ```
        
-   `createUniqueSlug` will take `origSlug` generated by `generateSlug` and **modify it** by appending `-1` to it. `createUniqueSlug` will then search the database for a document with `slug: origSlug-1`
    
    -   If such document does not exist, then `origSlug-1` is a unique `slug` and it will be returned as unique value.
        
    -   If such document does exist, then `createUniqueSlug` will try searching for a document using `slug: origSlug-2` and so forth...
        
        After translating English version to JavaScript:
        
        ```
        async function createUniqueSlug(Model, slug, count, filter) {
        const obj = await Model.findOne({ slug: `${slug}-${count}`, ...filter })
          .select('_id')
          .setOptions({ lean: true });
        
        if (!obj) {
          return `${slug}-${count}`;
        }
        
        return createUniqueSlug(Model, slug, count + 1, filter);
        }
        ```
        

Create a new file `book/4-begin/api/server/utils/slugify.ts` and put definitions of `slugify`, `generateSlug`, `createUniqueSlug` together:

```
import * as _ from 'lodash';

const slugify = (text) => _.kebabCase(text);

async function createUniqueSlug(Model, slug, count, filter) {
  const obj = await Model.findOne({ slug: `${slug}-${count}`, ...filter })
    .select('_id')
    .setOptions({ lean: true });

  if (!obj) {
    return `${slug}-${count}`;
  }

  return createUniqueSlug(Model, slug, count + 1, filter);
}

async function generateSlug(Model, name, filter = {}) {
  const origSlug = slugify(name);

  const obj = await Model.findOne({ slug: origSlug, ...filter })
    .select('_id')
    .setOptions({ lean: true });

  if (!obj) {
    return origSlug;
  }

  return createUniqueSlug(Model, origSlug, 1, filter);
}

export { generateSlug };
```

___

#### Testing generateSlug method [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-generateslug-method)

We defined our `generateSlug` method. In this subsection, we will create a testing suite that contains 3 tests for `generateSlug`. This testing suite automatically tests if `generateSlug` method works as expected. The goal of this testing suite is to test whether out `generateSlug` method indeed generates a unique `slug` under different conditions.

Let's look at Jest's official example of usage:

[https://jestjs.io/docs/en/getting-started](https://jestjs.io/docs/en/getting-started)

Since we are using TypeScript, we can use newer export/import syntax, `export` instead of `module.exports`; `import` instead of `require`.

Look at this function below called `sum`:

```
function sum(a, b) {
  return a + b;
}

export { sum };
```

Add the above code to a new file `book/4-begin/api/server/utils/sum.ts`.

The automated test for `sum` will be:

```
import { sum } from '../../../server/utils/sum';

console.log(sum(1, 2));

describe('testing sum function', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

Add the above code to a new file `book/4-begin/api/test/server/utils/sum.test.ts`. Please create all missing folder before creating `sum.test.ts` file.

Next, open your `package.json` file located `book/4-begin/api/package.json`. Add a new script `test` section and add new section `jest`, like so:

```
...
"scripts": {
  "dev": "nodemon server/server.ts",
  "lint": "eslint . --ext .ts,.tsx",
  "test": "jest"
},
"jest": {
  "preset": "ts-jest",
  "testPathIgnorePatterns": [
    "production-server"
  ]
},
...
```

You already know how `scripts` work - later on when you can run `yarn test`, it will execute the `jest` command.

As for `jest` section, we simply followed official documentation on how to configure Jest:

[https://jestjs.io/docs/en/configuration](https://jestjs.io/docs/en/configuration)

As your tests get more complicated, you can use different Jest configuration options. We simply used one option called `testPathIgnorePatterns`. This option allows us to _not_ execute automated tests (in other words, ignore) located inside the `book/4-begin/api/production-server` folder. This folder will contain a compiled code that we will use to deploy our `api` project to cloud, and we only interested in testing local code.

We also used the `ts-jest` preset that allows us to use Jest for TypeScript code:

[https://kulshekhar.github.io/ts-jest/user/config/](https://kulshekhar.github.io/ts-jest/user/config/)

Navigate to `book/4-begin/api` on your terminal and run `yarn test`. Your terminal should output:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-03+08-17-43.png)

```
$ jest
 PASS  test/server/utils/sum.test.ts
  testing sum function
    ✓ adds 1 + 2 to equal 3 (2ms)

  console.log test/server/utils/sum.test.ts:3
    3

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        4.948s
Ran all test suites.
Done in 5.59s.
```

You can see that our simple function passed the test suite, because Jest printed `PASS`. You also see the destination of the test suite, name of test suite `testing sum function`, name of test `adds 1 + 2 to equal 3`. We also see the location and results of the `console.log` statement. Finally, we get an entire summary table.

If you see the above output in your terminal - congrats! You successfully created your first automated test (in this book) in Jest for simple function written with TypeScript.

Now, let's see what happens to the output if the test fails. The easiest way to fail test is to introduce a problem into the function `sum`. Open `book/4-begin/api/server/utils/sum.ts` and make this change:

```
function sum(a, b) {
  return a - b;
}

export { sum };
```

Imagine that you or developer on your team mistyped one symbol. Instead of `a + b`, it is `a + a` or `a - b`.

Navigate to `book/4-begin/api` on your terminal and run `yarn test`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-03+08-47-46.png)

```
$ jest
 FAIL  test/server/utils/sum.test.ts
  testing sum function
    ✕ adds 1 + 2 to equal 3 (4ms)

  ● testing sum function › adds 1 + 2 to equal 3

    expect(received).toBe(expected) // Object.is equality

    Expected: 3
    Received: -1
us
       5 | describe('testing sum function', () => {
       6 |   test('adds 1 + 2 to equal 3', () => {
    >  7 |     expect(sum(1, 2)).toBe(3);
         |                       ^
       8 |   });
       9 | });
      10 | 

      at Object.<anonymous> (test/server/utils/sum.test.ts:7:23)

  console.log test/server/utils/sum.test.ts:3
    -1

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        5.127s
Ran all test suites.
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

Jest shows you exactly which test inside the test suite has failed. Jest shows you the test's name, the test's location and, most importantly, the expected (`3`) and received results (`-1`). This comes handy when debugging.

Another neat feature is that Jest autodetects all test suits. We did not have to specify the location of our `sum.test.ts` file anywhere in our configuration.

Go ahead and change the `sum` function to return `a + b` instead of `a - b`. Also, let's skip the test suite `testing sum function` completely when we run the `yarn test` command. To skip a test suite, open `book/4-begin/api/test/server/utils/sum.test.ts` and replace `describe` with `describe.skip`. Next time you run `yarn test`, this test suite inside `sum.test.ts` file will be skipped.

Now that you are familiar with a basic Jest testing, let's take it to the next level and create a test suite with 3 tests for our `generateSlug` method.

Create a new file `book/4-begin/api/test/server/utils/slugify.test.ts`. This is where we will place code for our new test suite. Our goal is to test our `generateSlug` method in 3 different situations:

-   (1) Generate slug when database has no user with the same `slug` value.
-   (2) Generate slug when database has one user with the same `slug` value.
-   (3) Generate slug when database has two users with the same `slug` value.

For each of these 3 cases, we will write one test.

Our test suite will look like this:

```
import * as mongoose from 'mongoose';
import User from '../../../server/models/User';
import { generateSlug } from '../../../server/utils/slugify';

// eslint-disable-next-line
require('dotenv').config();

describe('slugify', () => {
  beforeAll(async (done) => {
    // connect to database

    // define 3 mock users us

    // insert 3 mock users to database

    done();
  });

  // test 1

  // test 2

  // test 3

  afterAll(async (done) => {
    // delete previously inserted 3 mock users from database

    // disconnect from database

    done();
  });
});
```

Look at the above code carcass, and let's understand it.

There is a `beforeAll(fn, timeout)` method that runs **before** any of the tests run. Jest starts running tests only after the `done` callback function has been called, meaning that all logic inside `beforeAll` has completed. If your tests require connection to the database, this is the place where you can connect to the database:

[https://jestjs.io/docs/en/api#beforeallfn-timeout](https://jestjs.io/docs/en/api#beforeallfn-timeout)

As you can see, `beforeAll` is asynchronous. You guessed it right if you think that we will use `await` in front of some Mongoose API method to insert mock users to the database. Remember, we need to use `await` since Mongoose API method return Promise (see Chapter 3).

Let's connect to our database, define an array with 3 objects for 3 mock users, and insert these mock users to our database:

```
beforeAll(async (done) => {
  await mongoose.connect(process.env.MONGO_URL_TEST);

  const mockUsers = [
    {
      slug: 'john',
      email: 'john@example.com',
      createdAt: new Date(),
      displayName: 'abc',
      avatarUrl: 'def',
    },
    {
      slug: 'john-johnson',
      email: 'john-johnson@example.com',
      createdAt: new Date(),
      displayName: 'abc',
      avatarUrl: 'def',
    },
    {
      slug: 'john-johnson-1',
      email: 'john-johnson-1@example.com',
      createdAt: new Date(),
      displayName: 'abc',
      avatarUrl: 'def',
    },
  ];

  await User.insertMany(mockUsers);

  done();
});
```

You can read about Mongoose API method `insertMany` in official docs:

[https://mongoosejs.com/docs/api/model.html#model\_Model.insertMany](https://mongoosejs.com/docs/api/model.html#model_Model.insertMany)

Now you know why we have `import '../../../server/env';` - because we need the environmental variable `MONGO_URL` to connect to our database.

In our unfinished carcass, you can also see `afterAll(fn, timeout)`. This method runs **after** all tests have completed. This method is also asynchronous. We will use `await` in front of the `deleteMany` Mongoose API method to delete mock users from the database. Once all logic inside `afterAll` has run, we know because `done()` callback gets called at the very end:

[https://jestjs.io/docs/en/api#afterallfn-timeout](https://jestjs.io/docs/en/api#afterallfn-timeout)

Delete mock users and disconnect from the database:

```
afterAll(async (done) => {
  await User.deleteMany({ slug: { $in: ['john', 'john-johnson', 'john-johnson-1'] } });
  await mongoose.disconnect();

  done();
  });
```

Another reason why `beforeAll` and `afterAll` are asynchronous is because we cannot make Jest tests asynchronous:

[https://jestjs.io/docs/en/troubleshooting#defining-tests](https://jestjs.io/docs/en/troubleshooting#defining-tests)

The reason we use `describe` is because, by default in Jest, `beforeAll` and `afterAll` get called for every test inside the file. But we only want to call `beforeAll` once before all tests and `afterAll` once after all tests. In our current setup, by using `describe`, we achieve desired behavior:

[https://jestjs.io/docs/en/setup-teardown#order-of-execution-of-describe-and-test-blocks](https://jestjs.io/docs/en/setup-teardown#order-of-execution-of-describe-and-test-blocks)

Time to write actual tests for our `generateSlug` method.

Here is an example of how to evaluate result of asynchronous method, in our case `generateSlug` is asynchronous method:

[https://jestjs.io/docs/en/tutorial-async#asyncawait](https://jestjs.io/docs/en/tutorial-async#asyncawait)

The code from the above link:

```
it('works with async/await and resolves', async () => {
  expect.assertions(1);
  await expect(user.getUserName(5)).resolves.toEqual('Paul');
});
```

In our case, we need to replace `user.getUserName` with `generateSlug`. And. of course, change value for argument and expected output.

-   Test 1. Test if `generateSlug` will generate a `slug` with value `john-j-jonhson`. Our database has **no** user with a `slug` value of `john-j-jonhson`:
    
    ```
      test('not duplicated', async () => {
        expect.assertions(1);
    
        await expect(generateSlug(User, 'John J Johnson@#$')).resolves.toEqual('john-j-johnson');
      });
    ```
    
-   Test 2. Test if `generateSlug` will generate a `slug` with value `john-1`. Our database has one user with a `slug` value of `john`:
    
    ```
      test('one time duplicated', async () => {
        expect.assertions(1);
    
        await expect(generateSlug(User, ' John@#$')).resolves.toEqual('john-1');
      });
    ```
    
-   Test 3. Test if `generateSlug` will generate a `slug` with value `john-jonhson-2`. Our database has one user with a `slug` value of `john-johnson` and one user with a `slug` value of `john-johnson-1`:
    
    ```
      test('multiple duplicated', async () => {
        expect.assertions(1);
    
        await expect(generateSlug(User, 'John & Johnson@#$')).resolves.toEqual('john-johnson-2');
      });
    ```
    

You may have noticed that every test from the above has:

```
expect.assertions(1);
```

This is a useful feature of Jest. You can specify how many assertions you have in your test. Each test from the above has one assertion, which looks like:

```
expect(generateSlug(User, 'John J Johnson@#$')).resolves.toEqual('john-j-johnson')
```

When you test your code, you have one assertion. If the assertion code `expect(generateSlug(User, 'John J Johnson@#$')).resolves.toEqual('john-j-johnson')` did not run and you specified `expect.assertions(1)`, then you will see a warning from Jest. More on assertions number:

[https://jestjs.io/docs/en/expect#expectassertionsnumber](https://jestjs.io/docs/en/expect#expectassertionsnumber)

We've discussed all blocks in detail. Plug all blocks together into the carcass, and the content of `book/4-begin/api/test/server/utils/slugify.test.ts` file becomes:

```
import * as mongoose from 'mongoose';
import User from '../../../server/models/User';
import { generateSlug } from '../../../server/utils/slugify';

// eslint-disable-next-line
require('dotenv').config();

describe('slugify', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL_TEST);

    const mockUsers = [
      {
        slug: 'john',
        email: 'john@example.com',
        createdAt: new Date(),
        displayName: 'abc',
        avatarUrl: 'def',
      },
      {
        slug: 'john-johnson',
        email: 'john-johnson@example.com',
        createdAt: new Date(),
        displayName: 'abc',
        avatarUrl: 'def',
      },
      {
        slug: 'john-johnson-1',
        email: 'john-johnson-1@example.com',
        createdAt: new Date(),
        displayName: 'abc',
        avatarUrl: 'def',
      },
    ];

    await User.insertMany(mockUsers);
  });

  test('not duplicated', async () => {
    expect.assertions(1);

    await expect(generateSlug(User, 'John J Johnson@#$')).resolves.toEqual('john-j-johnson');
  });

  test('one time duplicated', async () => {
    expect.assertions(1);

    await expect(generateSlug(User, ' John@#$')).resolves.toEqual('john-1');
  });

  test('multiple duplicated', async () => {
    expect.assertions(1);

    await expect(generateSlug(User, 'John & Johnson@#$')).resolves.toEqual('john-johnson-2');
  });

  afterAll(async () => {
    await User.deleteMany({ slug: { $in: ['john', 'john-johnson', 'john-johnson-1'] } });
    await mongoose.disconnect();
  });
});
```

Inside the `book/4-begin/api` folder, run `yarn test`:

![Builder Book](https://user-images.githubusercontent.com/10218864/106313792-9f3bc480-621d-11eb-925e-b4d19fbbe360.png)

All tests for `generateSlug` passed!

1 skipped test suit is `testing sum function` test suit that has `describe.skip`.

Say you hired a new developer who was making updates to the code and inadvertently opened `book/4-begin/api/server/utils/slugify.ts` file and changed this line:

```
return createUniqueSlug(Model, origSlug, 1, filter);
```

To become:

```
return createUniqueSlug(Model, origSlug, 2, filter);
```

Inside `book/4-begin/api` folder, run `yarn test`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-04+09-33-24.png)

Our second test failed! Generated `slug` was supposed to be `john-1`, not `john-2`! And that's how automated testing can be useful. Especially if your codebase is massive and multiple collaborators work on it.

Remember to change the edited line back to:

```
return createUniqueSlug(Model, origSlug, 1, filter);
```

How do you know if our test indeed uses our MongoDB database? You can open the `book/4-begin/api/test/server/utils/slugify.test.ts` file and comment out this line:

```
// await User.deleteMany({ slug: { $in: ['john', 'john-johnson', 'john-johnson-1'] } });
```

Inside the `book/4-begin/api` folder, run `yarn test`. Then go to your MongoDB dashboard, access the `users` collection of the `test` database. You will see that our code indeed inserted 3 mock users to the database but did not delete them:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-04+09-43-23.png)

Good job if you got this far!

The code we wrote in this section requires a few dependencies: `jest`, `@types/jest`, `ts-jest`. As with any chapter of this book, if you cloned the `saas` repository and ran `yarn` inside `book/4-begin/*` at the start of this chapter, then you already have these dependencies installed.

___

## Your Settings page [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#your-settings-page)

In this section, we will create a new page - `YourSettings`. This page will serve the following purpose:

-   Show logged-in user `displayName`, `email`and `avatarUrl` values.
-   Allow user to edit `displayName` value and `avatarUrl` value by uploading new avatar file.

Open this file MongoDB database list of posts conditional operator on server only Google OAuth API decorate method with action You already learned subsection Put it all together API method list of posts list of posts Click on the button on the client. Subsection add environmental variable You already learned list of posts compiles MongoDB database send this response it works as expected open this file Team Leader on the client API method API method. Server-side rendering You already learned list of posts request was sent it works as expected session triggers method S3 bucket AWS dashboard API infrastructure session API method. Production-ready on the client response in this book check if value is truthy new Express route on the client AWS dashboard S3 bucket We will discuss add environmental variable store method calls check if value is truthy page component conditional operator. Material-UI S3 bucket AWS dashboard triggers method decorate method with action API method calls corresponding store method At AWS dashboard Put it all together end user. It works as expected compiles this chapter request was sent team members compiles response withAuth HOC subsection Team Leader production-ready. Data model AWS dashboard request new Express route At AWS dashboard decorate method with action this chapter send this response Remember to add import. Check if value is truthy S3 bucket if truthy then team members MongoDB database open this file response Navigate to Google OAuth API data model data model email and name Remember to add import on the client. Response open this file open this file Put it all together store method calls mount middleware this chapter. Store method calls redirect to checkout Put it all together on server only session open this file You already learned Team Leader S3 bucket show notification Material-UI.

At the end of this chapter, `YourSettings` page will look like:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-10+12-53-37.png)

As you may guess, the way we pass user data from the database will change, since we have not introduced user authentication yet. We add user authentication in Chapter 5. After our web application has our first user authentication method, Google OAuth API, we will retrieve user information from our database using `cookie` and `session` (discussed in Chapter 5). For now, however, we will get user data using the `getUserBySlugApiMethod` API method that we created earlier in this chapter, `getUserBySlugApiMethod` requires `slug` value which we harcoded for now.

We already have `Index` page in our `app` project. Let's capitalize on the knowledge you gained when you build and modified `Index` page. and build `YourSettings` page in the image of the `Index` page.

Open `book/4-begin/app/pages/index.tsx` file and look at how we:

-   Defined types for the page component's props.
-   Defined page component as ES6 class.
-   Imported and used `Layout` component.
-   Defined `Index.getInitialProps` method that populates page component's props.
-   Imported and user `getUserBySlugApiMethod` API method inside `Index.getInitialProps` method.

Let's use the above knowledge to define `YourSettings` page. Create a new file `book/4-begin/app/pages/your-settings.tsx` with following content:

```
import Head from 'next/head';
import * as React from 'react';

import Layout from '../components/layout';

import { getUserBySlugApiMethod } from '../lib/api/public';

type Props = {
  isMobile: boolean;
  user: { email: string; displayName: string; slug: string; avatarUrl: string };
};

class YourSettings extends React.Component<Props> {
  public static async getInitialProps() {
    const slug = 'team-builder-book';

    const user = await getUserBySlugApiMethod(slug);

    console.log(user);

    return { ...user };
  }

  public render() {
    const { user } = this.props;

    return (
      <Layout {...this.props}>
        <Head>
          <title>Your Settings page</title>
          <meta name="description" content="description for Your Settings page" />
        </Head>
        <div
          style={{
            padding: this.props.isMobile ? '0px' : '0px 30px',
            height: '100%',
          }}
        >
          <h3>Your Settings</h3>
          <h4 style={{ marginTop: '40px' }}>Your account</h4>
            <li>
              Your email: <b>{user.email}</b>
            </li>
            <li>
              Your name: <b>{user.displayName}</b>
            </li>
          <p />
          <br />
        </div>
      </Layout>
    );
  }
}

export default YourSettings;
```

You may notice that instead of using `this.props.user.email`, we use `user.email`. We are able to do this because we used so-called `object destructuring`:

```
const { user } = this.props;
```

More on object destructuring in the official Mozilla docs:

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring\_assignment#Object\_destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Object_destructuring)

Simply put, in our case, we assigned the value of `user` property inside `this.props` to the value of variable `user`. After that, we can access this value by accessing the value of `user` variable.

You can see that at this point, `YourSettings` page is pretty much the same as the `Index` page.

A quick note on `title` and `description`: These two parameters are used for SEO (search engine optimization). As you know from the description of `YourSettings` page, this page is for a logged-in user. Thus, this page should not be indexed by search engines. In Chapter 10, we will make sure that `robots.txt` and `sitemap.xml` are set up so the `/your-settings` path is not indexed by search engines. Thus the content of meta tag `description` does not matter at all, but `title` should be informative since title appears on the browser's tab. You want `title` to be informative, since it is visible to end user of your web application though this page is not indexed by search engine bots.

As for the `Index` page's SEO - no need to worry about `title` or `description`. Eventually we will delete the `Index` page as we progress through the book, as this page is unnecessary. We used the `Index` page to learn a lot of concepts, but we don't need it in our final SaaS boilerplate.

As you learned earlier in this chapter, we have to start **both** `app` and `api` projects to run our "two-project" web application. We recommend a split-screen set up with two terminal windows inside VS Editor:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+11-49-53.png)

On the left terminal window, navigate to the `app` folder. On the right terminal window, navigate to the `api` folder.

In **each** terminal window, simply run `yarn dev`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+13-18-03.png)

Navigate to `http://localhost:3000/your-settings`.

If you see this error:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-07+14-53-16.png)

You may get this error if `User` MongoDB document with `slug: "team-builder-book"` is missing in our database. If so, go ahead and manually create a missing document (discussed earlier in this chapter). Here are the parameters for this new MongoDB document:

```
createdAt: 2017-12-17T02:05:57.426+00:00
email: "team@builderbook.org"
displayName: "Team Builder Book"
avatarUrl: "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=128"
slug: "team-builder-book"
```

Once this document is in place, navigate to `http://localhost:3000/your-settings` again:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-07+15-28-41.png)

Note that we are not done with `Your Settings` page. We only displayed `email` and `displayName`. We have not displayed an avatar using `avatarUrl`, and we have not added functionality to update `displayName` and `avatar`.

___

#### Form and input [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#form-and-input)

In this subsection, we will make the following changes to our current `YourSettings` page:

1.  Define `state` for the page component.
2.  Create a form that shows a user's current `displayName` and allows them to update its value.
3.  Define an `onSubmit` method for this form.
4.  Display an avatar using `avatarUrl`.
5.  Create an element that allows a user to upload a file that becomes a new avatar.

Let's discuss each task and implement it.

1.  Both `Index` and `YourSettings` pages are page components. You are already familiar with Next's `getInitialProps` method - this method populates a page component's props which later can be accessed inside page component's `render` method as `this.props`. We already defined `getInitialProps` for both `Index` and `YourSettings` page components. At this point in the book, you already used `this` keyword on multiple occasions:
    
    [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
    
    You used `this` to refer to the page component `Index` when accessing its `props` - for example, `this.props.user.email`. You used `this` to refer to a MongoDB Model when using Mongoose API methods - for example, `this.findById(userId, 'slug displayName');`. We discussed usage of `this` in detail in our first book, Builder Book, in Chapter 3.
    
    Similar to how you define page component's `props`, you can define and access `state`. The purpose of `state` for a page component is to store data that changes. In other words, `state` is temporary storage for dynamic data. You don't have to use `state` for static page or pages that have data but it does not change. You do need to use `state` if you need to store some data that changes. One of situations where you need to store such data is when an end user of your web application needs to fill out and submit a form. Your web application saves temporary input from the end user to a `this.state` object. When the user clicks a submit button on the form, your application executes `onSubmit` method, accesses the value from `this.state` and sends it to the `api` server via an API method and saves it to the MongoDB database.
    
    Let's define data type for `state` in the same way we defined them for `props`:
    
    ```
     import Head from 'next/head';
     import * as React from 'react';
    
     import Layout from '../components/layout';
    
     import { getUserBySlugApiMethod } from '../lib/api/public';
    
     type Props = {
       isMobile: boolean;
       user: { email: string; displayName: string; slug: string; avatarUrl: string };
     };
    
     type State = { newName: string; newAvatarUrl: string; disabled: boolean };
    
     class YourSettings extends React.Component<Props, State> {
       public static async getInitialProps({ query }) {
         const { error } = query;
    
         const slug = 'team-builder-book';
    
         const user = await getUserBySlugApiMethod(slug);
    
         console.log(user);
    
         return { ...user, error };
       }
    
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
         const { newName, newAvatarUrl, disabled } = this.state;
    
         console.log(newName, newAvatarUrl, disabled);
    
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
               <p>
                 <li>
                   Your email: <b>{user.email}</b>
                 </li>
                 <li>
                   Your name: <b>{user.displayName}</b>
                 </li>
               </p>
               <p />
               <br />
             </div>
           </Layout>
         );
       }
     }
    
     export default YourSettings;
    ```
    
    Note that we passed `State` types in the same way we passed `Props` types:
    
    ```
     React.Component<Props, State>
    ```
    
    Inside the `state` object, we have these parameters: `newName` (string), `newAvatarUrl` (string), and `disabled` (boolean). The first parameter, `newName`, saves a temporary value for new name that an end user types on the form. The second parameter, `newAvatarUrl`, will be generated using AWS S3 server later (third party API that we implement at the very end of this chapter). The third parameter, `disabled`, will be used to disable two buttons: one button for submitting a new name and a second button for uploading a new file for an avatar. We need to temporary disable these buttons so our end user does not submit API requests twice by clicking on the button twice by accident. Disabling buttons once clicked is a good UX.
    
    We discussed the `constructor` method in Chapter 2 when we built our `Notifier` component. You learned that `constructor` can be used to set initial values. You used it to bind calling of `openSnackbarExternal` to calling of `this.openSnackbar`. Here we can use to set initial `state`:
    
    ```
     constructor(props) {
       super(props);
    
       this.state = {
         newName: this.props.user.displayName,
         newAvatarUrl: this.props.user.avatarUrl,
         disabled: false,
       };
     }
    ```
    
    Why did we choose these initial values? Because when `YourSettings` page loads, we will use `this.state` to display current values, thus initial value for `this.state.newName` and `this.state.newAvatarUrl` are user's current values (values retrieved from our database). Also, without click, buttons should not be disabled thus `this.state.disabled` should have value of `false` initially.
    
2.  We introduced page component's `state`. Our next step is to create a form that displays the **current** value for `displayName` and allows an end user to submit a new `displayName`. For creating a new form, the best place to start is Mozilla docs (this is generally true when learning something new in web developement):
    
    [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
    
    HTML code for a typical form:
    
    ```
     <form action="" method="get" class="form-example">
       <div class="form-example">
         <label for="name">Enter your name: </label>
         <input type="text" name="name" id="name" required>
       </div>
       <div class="form-example">
         <label for="email">Enter your email: </label>
         <input type="email" name="email" id="email" required>
       </div>
       <div class="form-example">
         <input type="submit" value="Subscribe!">
       </div>
     </form>
    ```
    
    Since we are using Material-UI, we will use a `TextField` component instead of an `input type="text"` element and a `Button` component instead of `input type="submit"`:
    
    ```
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
    ```
    
    Material-UI's API docs for `TextField` and `Button` components:
    
    [https://material-ui.com/components/text-fields/](https://material-ui.com/components/text-fields/)  
    [https://material-ui.com/api/text-field/](https://material-ui.com/api/text-field/)
    
    [https://material-ui.com/components/buttons/](https://material-ui.com/components/buttons/)  
    [https://material-ui.com/api/button/](https://material-ui.com/api/button/)
    
    By styding these docs, you can learn how to use `TextField` and `Button` components and what props they accept. For example, you can find that `Button` component accepts prop `disabled` from [https://material-ui.com/api/button/](https://material-ui.com/api/button/)
    
    We also disabled autocomplete for `TextField`, since we don't want the browser to suggest values for this field.
    
    When an end user clicks on the `Button` component with `type="submit"`, the `onSubmit` method will get executed, because our form element has `onSubmit={this.onSubmit}`. We define the `onSubmit` min the next step.
    
3.  At this point, we have two methods of our page component that we did not define: `onSubmit` and `uploadFile`. Let's define `onSubmit` here and define `uploadFile` in the last section of the book.
    
    What do we want `onSubmit` to do? In other words, what do we want to happen when a user clicks on the `Update username` button of the form we just defined? First, we want `onSubmit` to process a submit event asynchronously. This is because we will send API request to our `api` server (and MongoDB database), and then we want to wait (keyword `await`) for data to return to `YourSetting` page of `app` project. You are already familiar with `async/await` construct from Chapter 3.
    
    Second, we want to prevent the form from assuming its default behaviors such as clearing the input field and sending HTTP request on its own. We achieve this with a simple line of code:
    
    ```
     event.preventDefault();
    ```
    
    Third, we want to access the `newName` value from the corresponding property inside `state`. We can do this with object destructuring, which we discussed earlier in this chapter:
    
    ```
     const { newName } = this.state;
    ```
    
    Fourth, we want to check if `newName` exists. If it does not exist, then we want to stop execution and return `undefined`:
    
    ```
     if (!newName) {
       notify('Name is required');
       return;
     }
    ```
    
    Fifth, we want to show an end user a progress bar. You are already familiar with the usage of `Nprogress` from Chapter 3. We will initiate a progress bar before we call the `updateProfileApiMethod` method, and we will complete the progress bar after `updateProfileApiMethod` returns either data or an error.
    
    Put it all together and you get:
    
    ```
     private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
       event.preventDefault();
    
       const { newName } = this.state;
    
       // const { newName, newAvatarUrl } = this.state;
    
       if (!newName) {
         notify('Name is required');
         return;
       }
    
       NProgress.start();
    
       try {
         this.setState({ disabled: true });
    
         // await updateProfileApiMethod({ name: newName, avatarUrl: newAvatarUrl });
         notify('You successfully updated your profile.');
       } catch (error) {
         notify(error);
       } finally {
         this.setState({ disabled: false });
         NProgress.done();
       }
     };
    ```
    
    At this point in the book, you are already familiar with the `try/catch/finally` block and `async/await`.
    
4.  We defined form. Now let's define an element that displays a current avatar.
    
    This task is relatively easy. Material-UI has a component `Avatar` that accepts the prop `src`. In our case, `src={newAvatarUrl}`:
    
    ```
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
    ```
    
    Here are example uses of the `Avatar` component:
    
    [https://material-ui.com/components/avatars/#avatar](https://material-ui.com/components/avatars/#avatar)
    
    And here is description of the props accepted by the `Avatar` component:
    
    [https://material-ui.com/api/avatar/](https://material-ui.com/api/avatar/)
    
    Remember that we use `newAvatarUrl: this.props.user.avatarUrl` so that when `YourSettings` page loads, an end user sees their **current** avatar (using `avatarUrl` saved to our database).
    
5.  Now we need an HTML element that allows an end user to upload a file. Let's search the Mozilla docs for the simplest example of such an element:
    
    [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)
    
    Code from the above link:
    
    ```
     <label for="avatar">Choose a profile picture:</label>
    
     <input type="file"
       id="avatar" name="avatar"
       accept="image/png, image/jpeg">
    ```
    
    On our element, we want to have a custom button. When an end user clicks this button, `uploadFile` executes:
    
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
    

Open the `book/4-begin/app/pages/your-settings.tsx` file and add code from the above five steps to it. You should get the following content:

```
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Head from 'next/head';
import NProgress from 'nprogress';
import * as React from 'react';

import Layout from '../components/layout';

import { getUserBySlugApiMethod } from '../lib/api/public';

import notify from '../lib/notify';

type Props = {
  isMobile: boolean;
  user: { email: string; displayName: string; slug: string; avatarUrl: string };
};

type State = { newName: string; newAvatarUrl: string; disabled: boolean };

class YourSettings extends React.Component<Props, State> {
  public static async getInitialProps() {
    const slug = 'team-builder-book';

    const user = await getUserBySlugApiMethod(slug);

    console.log(user);

    return { ...user };
  }

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
          <p>
            <li>
              Your email: <b>{user.email}</b>
            </li>
            <li>
              Your name: <b>{user.displayName}</b>
            </li>
          </p>
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
          <h4>Your avatar</h4>
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

    const { newName } = this.state;

    // const { newName, newAvatarUrl } = this.state;

    if (!newName) {
      notify('Name is required');
      return;
    }

    NProgress.start();
    this.setState({ disabled: true });

    try {
      // await updateProfileApiMethod({ name: newName, avatarUrl: newAvatarUrl });
      notify('You successfully updated your profile.');
    } catch (error) {
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };

  private uploadFile = async () => {
    // to be defined
  };
}

export default YourSettings;
```

Before we move to the next subsection, let's take a look at our page.

Split screen your terminal window (like you did earlier in this chapter). In **each** terminal window, simply run the command `yarn dev`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+13-18-03.png)

Navigate to `http://localhost:3000/your-settings`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-10+18-08-10.png)

Everything looks correct with one exception. Our avatar does not show up! Earlier in this chapter, we manually created a MongoDB document inside the `test.users` collection:

```
createdAt: 2017-12-17T02:05:57.426+00:00
email: "team@builderbook.org"
displayName: "Team Builder Book"
avatarUrl: "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=128"
slug: "team-builder-book"
```

Paste `https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=128` into a new tab of your browser and you will see:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-10+18-11-02.png)

We can see the image, but why doesn't this image show up on `YourSettings` page?

MongoDB database API method calls corresponding store method API infrastructure You already learned At AWS dashboard production-ready Team Leader AWS dashboard cookie Google OAuth API list of posts in this book. Decorate method with action Put it all together At AWS dashboard send this response in this book S3 bucket. Send this response in a browser it works as expected new Express route Next.js web application. Production-ready conditional operator cookie production-ready static method calls Next.js web application Material-UI S3 bucket withAuth HOC new Express route Put it all together team members decorate method with action. Page component Put it all together subsection discussion subsection show notification Remember to add import it works as expected At AWS dashboard new Express route it works as expected. S3 bucket in this book new Express route it works as expected You already learned production-ready team members. Request list of posts in production decorate method with action store method calls discussion data model Put it all together subsection it works as expected session Put it all together API method Navigate to. Team Leader in this book this chapter API method calls corresponding store method static method calls discussion Click on the button mount middleware in production API method calls corresponding store method subsection subsection Material-UI. Server-side rendering page component Navigate to Navigate to Navigate to new Express route cookie MongoDB database Remember to add import cookie. Material-UI response server-side rendering team members on the client discussion.

That's because we only retrieve `email` and `displayName` from the database. In order to retrieve `avatarUrl` as well, we need modify server-side static method `User.getUserBySlug`. Open `book/4-begin/api/server/models/User.ts` and find this line:

```
return this.findOne({ slug }, 'email displayName').setOptions({ lean: true });
```

Change the line to:

```
return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
```

Reload the tab for `http://localhost:3000/your-settings`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-10+18-18-25.png)

Boom! Now you should see a proper image for the user's avatar.

___

Before we move to the next subsection, we are going to work on our API infrastructure for updating a user profile. Let's discuss TypeScript's keywords `public`, `protected`, and `private`. These keywords set accessibility levels for classes in Typescript:

[https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers](https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers)

You are already familiar with the `class` concept from Chapter 2 and earlier in this chapter. In JavaScript and TypeScript, `class` is a special type of function. As you know, every function has a so-called scope. A scope is the context of execution. TypeScript's keywords `public`, `protected`, and `private` basically set the scope of accessibility for classes (special functions). If, say, a class is `public`, then the class is accessible throughout an entire context. This in turn means that a public class can be referenced (and later executed if called) anywhere in the project.

Let's try to understand these accessibility levels by looking at the code we just wrote. Open `book/4-begin/app/pages/your-settings.tsx` file and find the line with:

```
public static async getInitialProps
```

Also find the line with:

```
private onSubmit
```

Why did we use `public` in front of `getInitialProps` and `private` in front of `onSubmit`? That's because we want the `getIntialProps` method of our `YourSettings` page to be accessible from anywhere in the project. We want Next.js to be able to reference and execute `getInitialProps` of `YourSettings` page from anywhere in the code. That's a requirement in Next.js since HOCs should be able to call page's `getInitialProps` method.

At the same time, we want the `onSubmit` method to be accessible only from within our `YourSettings` class. We want `onSubmit` to be only "visible" from within `YourSettings`, and we want `onSubmit` to be called only when an end user clicks on the `Update username` button of a form, while on the `YourSettings` page. There is no other place in the project where we can reference and call `onSubmit` method of `YourSettings` page (class).

To decide on `public` vs `private`. Overall we recommend following this advice on using principle of least privilege:

[https://stackoverflow.com/questions/53153170/when-to-use-private-protected-methods-in-typescript-with-react](https://stackoverflow.com/questions/53153170/when-to-use-private-protected-methods-in-typescript-with-react)

There is some exceptions when you have to use `public` intstead of `private`:

-   `getInitialProps` should be `public`.
-   `render` and life cycle methods should be `public`.
-   Methods that are decorated as actions by MobX should be `public`.
-   Other methods that must be `public` to function properly because of how they are used.

If you define class ([https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)) in your file, for example when define page component in `APP` codebase or define model in `API` codebase, you will have to make choice of `public` vs `private` for class's methods. If you make method `private` but did not use this method inside class then VS code editor will show you an TypeScript error:

```
error TS6133: 'methodName' is declared but its value is never read.
```

Congrats if you got this far. We defined `YourSettings` page component but we haven't defined `updateProfileApiMethod` and underlying API infrastructure.

___

#### API infrastructure for updating profile [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#api-infrastructure-for-updating-profile)

In the previous subsection, we created a new page: `YourSettings`. We implemented the entire user interface, however, we did not define two methods: `updateProfileApiMethod` API method and page's `uploadFile` method.

In this subsection, we want implement the entire API infrastructure for updating a user's profile (`displayName` and `avatarUrl`), let's call it Updating profile API infrastructure. In the next section, we will discuss and build Uploading file API.

Every time we talk about internal API infrastructure in this book, we mean the following:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/typical+API.png)

Let's discuss this diagram in detail and understand what each part means for Updating profile API:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Updating+profile.png)

Let's discuss every method in detail.

-   In our `app` code on the browser, we have:
    
    -   A user click updates values for `displayName` and `avatarUrl`. Then this user clicks on either `Update username` or `Updat avatar` button.
    -   The page component's `onSubmit` or `uploadFile` gets executed.
    -   Ultimately, calling either `onSubmit` or `uploadFile` method results in execution of `updateProfileApiMethod` API method.
    -   `updateProfileApiMethod` API method sends a request from `app` browser to `api` server(`updateProfileApiMethod` method for updating profile). In fact, we already defined this method earlier in this chapter (but we haven't used it):
        
        ```
          export const updateProfileApiMethod = (data) =>
            sendRequestAndGetResponse(`${BASE_PATH}/user/update-profile`, {
              body: JSON.stringify(data),
            });
        ```
        
-   In our `api` server, we have:
    
    -   An Express route `/user/update-profile` that receives requests from `updateProfileApiMethod` API method. We already created this Express route earlier in this chapter (though we did not use it till this moment). Open `book/4-begin/api/server/api/public.ts` and find the Express route:
        
        ```
          router.post('/user/update-profile', async (req: any, res, next) => {
            try {
              const { name, avatarUrl } = req.body;
        
              // define userId
        
              const userId = 'someString';
        
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
        
    -   Inside this Express route, we will call static method `User.updateProfile`, and again we already defined `User.updateProfile` earlier in this chapter when we worked on the infrastructure for getting user by slug. Open `book/4-begin/api/server/models/User.ts` file and find following definition:
        
        ```
          public static async updateProfile({ userId, name, avatarUrl }) {
            const user = await this.findById(userId, 'slug displayName');
        
            const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };
        
            if (name !== user.displayName) {
              modifier.displayName = name;
              modifier.slug = await generateSlug(this, name);
            }
        
            return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
              .select('displayName avatarUrl slug')
              .setOptions({ lean: true });
          }
        ```
        
    -   Static method `User.updateProfile` calls `findById` and `findByIdAndUpdate` Mongoose API methods.
        

So you can see from the above analysis of the diagram, we already have all code for updating a user profile. The only obstacle that prevents us from testing the entire API infrastructure is the undefined `userId` from the Express route `/user/update-profile`:

```
router.post('/user/update-profile', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    // define userId

    const userId = 'someString';

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

`userId` is `undefined` inside this Express route, because we define `userId` later in Chapter 5 when we add user authentication to our web application. After implementing user authentication, a logged-in user will have `req.user` value available on the `api` server.

For us to be able to test our entire Updating profile API infrastructure - we have to use a hardcoded value for `userId`:

```
router.post('/user/update-profile', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    const userId = 'someString';

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

Go to MongoDB Atlas. Access your Project and Cluster, `test` Database and `users` Collection. Find the user document that we created earlier in this chapter. Copy the value of the `_id` parameter for this user document. For me, this value (which was autogenerated by MongoDB Atlas) is:

```
5e6427a51c9d440000c9ba6f
```

Inside the `book/4-begin/api/server/api/public.ts` file, replace `someString` with **your** unique value for the user's `_id`. Here is the line to edit:

```
const userId = 'someString';
```

We are ready to test!

Make sure to add `NEXT_PUBLIC_URL_API` environmental variable to your `app/.env` file:

```
NEXT_PUBLIC_BUCKET_FOR_AVATARS=
NEXT_PUBLIC_BUCKET_FOR_TEAM_LOGOS=
NEXT_PUBLIC_BUCKET_FOR_POSTS=

NEXT_PUBLIC_URL_APP=http://localhost:3000
NEXT_PUBLIC_URL_API=http://localhost:8000
NEXT_PUBLIC_PRODUCTION_URL_API=
NEXT_PUBLIC_PRODUCTION_URL_APP=
NEXT_PUBLIC_PORT_APP=3000
NEXT_PUBLIC_PORT_API=8000

NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY=
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY=

NEXT_PUBLIC_API_GATEWAY_ENDPOINT=

NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

By this point in the book, you should be comfortable starting `app` and `api` projects at the same time. Use the split screen feature of VS code editor to see two terminal windows at the same time. Start each server with `yarn dev`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-02-25+13-18-03.png)

On your browser, navigate to `http://localhost:3000/your-settings`. On the page, replace the name "Team Builder Book" with some other value, for example, "Sponge Bob", then click the `Update username` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+10-23-13.png)

Hmmm... `Notifier` shows us an error: `Failed to fetch`. So our new API infrastructure throws an error.

Reload the page to check if `displayName` was updated:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+10-23-48.png)

Nope. `displayName` did not change.

Check the database to confirm:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+10-23-48.png)

Also, the left terminal window that prints the output of our `APP` server shows only one API endpoint:

```
http://localhost:8000/api/v1/public/get-user-by-slug
```

It does not show:

```
http://localhost:8000/api/v1/public/user/update-profile
```

Where should we start our investigation? The code and infrastructure for getting a user by slug work as expected, but the code for Updating profile API throws an error. Both API infrastructures (Getting user by slug and Updating profile) are nearly identical. The only difference, which should not matter, is that the Getting user by slug API gets triggered upon page request and Uploading profile API gets triggered upon button click.

Let's check if our Express route and Static method get called for Updating profile API. Open `book/4-begin/api/server/api/public.ts` and add two `console.log` statements like so:

```
router.post('/get-user-by-slug', async (req, res, next) => {
  console.log('Express route: /get-user-by-slug');

  try {
    const { slug } = req.body;

    const user = await User.getUserBySlug({ slug });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/user/update-profile', async (req: any, res, next) => {
  console.log('Express route: /user/update-profile');

  try {
    const { name, avatarUrl } = req.body;

    const userId = '5e6427a51c9d440000c9ba6f';

    console.log(name);

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

After the above change, we clearly see which Express route's handler function executes.

Open `book/4-begin/api/server/models/User.ts` and add two `console.log` statements like so:

```
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
```

After this change, we can differentiate between the execution of `getUserBySlug` and `updateProfile` static methods.

Let's reload the tab with `http://localhost:3000/your-settings`. Click the `Update username` button and watch your right terminal window print the output of the `API` server:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+10-55-22.png)

The Express route and Static method for Updating profile API do not get called.

Ok, we know that no API code gets executed on the `api` server. We should investigate our `app` project more. Open `book/4-begin/app/lib/api/sendRequestAndGetResponse.ts` and add two `console.log` statements like this:

```
console.log(`before: ${process.env.URL_API}${path}${qs}`);

const response = await fetch(
  `${process.env.URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);

console.log(`after: ${process.env.URL_API}${path}${qs}`);
```

Also open `book/4-begin/app/pages/your-settings.tsx` and add one `console.log` statement like so:

```
const { newName, newAvatarUrl } = this.state;

console.log(newName);

if (!newName) {
  notify('Name is required');
  return;
}
```

On the `http://localhost:3000/your-settings` page, click the `Update username` button and watch the left terminal window print the output of the `app` project:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+11-03-24.png)

We do see an output related to Getting user by slug API:

```
before: http://localhost:8000/api/v1/public/get-user-by-slug
after: http://localhost:8000/api/v1/public/get-user-by-slug
```

But still no output related to Updating profile API.

What could cause the above behavior?

The answer is server-side rendering. When a user requests the `YourSettings` page by loading it into new browser tab, the API method `getUserBySlugApiMethod` executes on the server. The page's props are populated on the server as well. The page already has props and is completely rendered when it arrives to the browser. That's why you see the output from our `console.log` statements on the server logs of `app` project.

However, the API method `updateProfileApiMethod` executes on the browser after pages is loaded on the browser and after an end user clicks on the button. So we, as software developers, have to look at the browser's console for output from our `console.log` statements related to the Updating profile API.

Load `http://localhost:3000/your-settings`. Open Chrome Dev Tools by pressing `Ctrl + Shift + J` on the keyboard, then select the `Console` tab. Watch your browser console and press the `Update username` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+14-17-12.png)

You can see two outputs after clicking the button. One output from:

```
console.log(newName);
```

Another output from:

```
console.log(`before: ${process.env.URL_API}${path}${qs}`);
```

The first output `Team Builder Book` means that the `onSubmit` method indeed executes.

The second output `before: http://localhost:8000/api/v1/public/user/update-profile` means that `updateProfileApiMethod` executes as well.

The presence of `before: http://localhost:8000/api/v1/public/user/update-profile` and the absence of `after: http://localhost:8000/api/v1/public/user/update-profile` means that `fetch` executes. The rest of execution halts, and the error `Failed to fetch` is passed on to the page and displayed via `notify(error)`.

Why do we get `Failed to fetch` for `updateProfileApiMethod` and not for `getUserBySlugApiMethod`? What's the difference?

The difference, as we just mentioned, is:

-   `updateProfileApiMethod` sends a request to the `api` server from the `app` code on the browser
-   `getUserBySlugApiMethod` sends a request to the `api` server from the `app` server

The browser environment differs from the server environment. When the browser sends a request to the `api` server, the browser **requires** a response from the `api` server to contain a so-called `Access-Control-Allow-Origin` header:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)

Unlike the server-to-server req-res cycle, the browser-to-server req-res cycle requires `Access-Control-Allow-Origin` header in the response.

In our case, this header controls whether the browser with `http://localhost:3000` origin can access the rest of the response from the `API` server.

In our case, possible values for the `Access-Control-Allow-Origin` header for response are:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Origin: http://localhost:3000
```

-   In the first case, we would allow any origin (such as `http://localhost:3000` or `http://localhost:4000`) to access the response from the `api` server.
-   In the second case, we allow only one origin, `http://localhost:3000`, to access the response from the `api` server.

You may already see a security benefit for the `Access-Control-Allow-Origin` header. We, as developers, have control over which origin can access a response from our server. Let's do just that for our SaaS boilerplate. Open `book/4-begin/api/server/server.ts`, import `cors` library, and use it like so:

```
import './env';
import * as cors from 'cors';
import * as express from 'express';
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

api(server);

server.get('*', (_, res) => {
  res.sendStatus(403);
});

server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
```

When we add:

```
server.use(
  cors({
    origin: process.env.URL_APP,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }),
);
```

Before the line:

```
api(server);
```

We ensure that all API-related responses from the `api` server (`http://localhost:8000`) can be accessed by only one origin, `http://localhost:3000`:

```
Access-Control-Allow-Origin: http://localhost:3000
```

Remember to open `book/4-begin/api/.env` and add a new environmental variable:

```
URL_APP="http://localhost:3000"
```

If you ran `yarn` in the `book/4-begin/api` folder at the beginning of this chapter, then you already have the `cors` package installed.

We are ready to test again.

On your browser, navigate to `http://localhost:3000/your-settings`. On this page, replace the name "Team Builder Book" with "Sponge Bob", then click the `Update username` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+15-12-14.png)

This time `Notifier` showed us `You successfully updated your profile`. This means that our API infrastructure worked as expected. Go to the `test.users` collection of your MongoDB database and find the user document:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+15-16-17.png)

Indeed! Not only was `displayName` updated but `slug` was also updated because of this line

```
modifier.slug = await generateSlug(this, name);
```

This line is inside the definition of the `updateProfile` static method of our `User` data model at `book/4-begin/api/server/models/User.ts`.

Another way to know that our Updating profile API infrastructure works as expected is to look at the terminal window with output for the `api` server. There you can see the following output after clicking the `Update username` button:

```
Express route: /user/update-profile
Static method: updateProfile
```

Remember that when you reload `YourSettings` page, you are going to see an error:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-14+15-25-26.png)

That's because we hardcoded the slug inside `book/4-begin/app/pages/your-settings.tsx`:

```
const slug = 'team-builder-book';
```

So if you want to see a properly rendered page, change this line to:

```
const slug = 'sponge-bob';
```

Or change `displayName` and `slug` in the database to be `Team Builder Book` and `team-builder-book`, respectively.

Store method calls Put it all together check if value is truthy on server only API method Remember to add import discussion production-ready in a browser Material-UI decorate method with action We will discuss compiles check if value is truthy. This chapter on server only send this response S3 bucket request server-side rendering API method calls corresponding store method. This chapter Next.js web application Remember to add import decorate method with action You already learned Put it all together conditional operator. Request conditional operator subsection on server only it works as expected. Production-ready subsection MongoDB database check if value is truthy in a browser You already learned. Open this file open this file Material-UI MongoDB database open this file mount middleware static method calls data model At AWS dashboard if truthy then. At AWS dashboard in a browser conditional operator list of posts compiles discussion store method calls end user add environmental variable conditional operator API method calls corresponding store method new Express route Navigate to withAuth HOC. Triggers method static method calls We will discuss it works as expected AWS dashboard API method calls corresponding store method decorate method with action decorate method with action At AWS dashboard on the client session You already learned S3 bucket We will discuss. Triggers method it works as expected page component end user mount middleware Material-UI conditional operator it works as expected request was sent API method in this book in this book. HTTP Remember to add import API method triggers method on server only request was sent Google OAuth API conditional operator on the client server-side rendering data model page component session.

We will do the latter.

___

## Uploading file API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#uploading-file-api)

Every time we talk about internal API infrastructure in this book, we should imagine the following diagram of req-res cycles:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/typical+API.png)

Typical external API infrastructure will be more complicated than typical internal API infrastructure. For example, Google OAuth API (Chapter 5) is more complicated (with more req-res cycles) than Uploading file API.

Uploading a file in our web application will require us to build two smaller API infrastructures. Let's give names to these two API infrastructures. As mentioned earlier in this chapter, we use "API infrastructure" and "API" terms interchangeably in this book.

Let's call our first API:

```
Getting signed request API
```

Let's call our second API:

```
Uploading file using signed request API
```

As always, before we write any code, we should visualize the scope of the entire infrastructure we are about to build.

Getting signed request API:

![Builder Book](https://user-images.githubusercontent.com/10218864/106467944-296c6e80-6452-11eb-9fb6-b6cc93b3ef77.png)

Compare the above API to Updating profile API. Both APIs look very similar with one exception. The very last server is not MongoDB server but AWS S3 server, thus we can call Getting signed request API is an external API. As you may guess by now, an internal API only involves our `api` server and our MongoDB server (and database).

Let's look at Updating profile API and compare it in more detail to the above Getting signed request API:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Updating+profile.png)

Below, we summarize the difference between these two APIs.

Updating profile API:

-   Has static method `User.updateProfile`
-   Uses Mongoose API methods inside `User.updateProfile` to define this static method to send request to MongoDB server
-   Final req-res cycle is between `API` server and MongoDB server

Getting signed request API:

-   Has server-side API method `signRequestForUpload` method
-   Uses AWS S3 API method `getSignedUrl` inside `signRequestForUpload` method to send request to AWS S3 server
-   Final req-res cycle is between `API` server and AWS S3 server

Whenever you that API infrastructure is external - expect that an external (third-party) servers other than `api` and MongoDB server to be involved.

Why do we need to get this so-called "signed request"? Why can't we just upload the file to our `api` server? We could do this, but then we would need to properly store files in MongoDB. In addition, when end users add or retrieve files, we would need to temporarily keep these files in the RAM memory of our MongoDB Atlas server and `api` server (also in our `app` project's memory for server-side rendered pages). Besides consuming of resources of our `api` server, saving and retrieving files to/from database is slower than in file system. Also paying for hosting and backing of bloated database is more expensive than alternatives. Thus, we use faster and more affordable option to store and retrieve files - AWS S3 service ([https://aws.amazon.com/s3/](https://aws.amazon.com/s3/)). With this approach, our database can have a simple string-type value for `avatarUrl`:

```
https://saas-book-avatars.s3.amazonaws.com/team-builder-book/qw15gl5w3x5wzpzan3v2/potato-new.png
```

If we uploaded file directly to MongoDB database, value for `avatarUrl` would have been thousands of lines of Buffer type data:

```
<Buffer 25 50 44 46 2d 31 2e 34 0a 25 c3 a4 c3 bc c3 b6 c3 ...>
```

AWS S3 service requires us to generate a unique `signedRequest` by sending request and getting response to AWS S3 server. According to docs, we have to generate `signedRequest` **before** uploading a file to AWS S3:

[https://docs.aws.amazon.com/AmazonS3/latest/dev/PresignedUrlUploadObject.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/PresignedUrlUploadObject.html)

To send signed request to AWS API servers, we need values of `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` from our AWS account. Values for `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` parameters can be generated on your AWS dashboard. They are unique to your AWS account. Whenever you send an API request to AWS server, you have to use these two values so that AWS servers can identify you and verify permissions if necessary.

We generate signed request `signedRequest` by sending a request (that has all information for identification) from our `api` server to an AWS S3 server. This request is sent to the `https://${bucket}.s3.amazonaws.com/${prefix}/${randomStringForPrefix}/${fileName}` API endpoint, we will discuss this string later in this section). The AWS S3 server sends back a response that contains `signedRequest`.

Once our `api` server has `signedRequest`, we send `signedRequest` from `api` to `app`. Then we send a **second** request to AWS S3 server. But this time, for performance reasons, we skip `api` server - we send request using `signedRequest` from `app` code on the browser to the AWS S3 server. This second request, unlike first request between `api` server and AWS S3 server, contains file. The final destination for the uploaded file has value of `signedRequest.url`. After file is successfully uploaded to AWS S3 bucket, we save value of `signedRequest.url` as a new value of `avatarUrl` field of `User` MongoDB document.

Here is an outline of uploading a file using from `app` to AWS S3 server, which is outline of our second API infrastructure, Uploading file using signed request API:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Uploading+file+using+signed+request.png)

This API looks very different from APIs we already built in this book, because there is no `api` server involved in this API infrastructure. There is an API method `uploadFileUsingSignedPutRequestApiMethod` inside `app` code on the browser, and this method sends a request that second reqquest that contains a file **from the browser** to the AWS S3 server. It does not matter whether a page is client-side or server-side rendered - an end user always uploads a file from the browser. Thus, `uploadFileUsingSignedPutRequestApiMethod` always executes and sends file from the browser. By not sending file to `api` server, we make our entire architecture more performant.

In the next section, we will discuss and define `uploadFile` method for `YourSettings` page. After that, we will build the above two API infrastructures:

-   Getting signed request API
-   Uploading file using signed request API

___

#### Page method uploadFile [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#page-method-uploadfile)

We haven't defined `YourSetting` page component's `uploadFile` method. As you might remember, all we have in `book/4-begin/app/pages/your-settings.tsx` is:

```
private uploadFile = async () => {
  // to be defined
};
```

Let's refresh our memory, open file `book/4-begin/app/pages/your-settings.tsx` and find following code:

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

When an end user clicks on the `Update avatar` button, this user is offered to select a file from his or her local machine. Once a file is selected, the `uploadFile` method executes. Selection of file should already work as expected. Start both projects (`app` and `api`), navigate to `http://localhost:3000/your-settings`, and click the `Update avatar` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-15+16-24-46.png)

However, when a user actually selects a file, nothing happens. That's because we haven't defined `uploadFile` method yet.

What do we know about the `uploadFile` method? A lot, actually. It's similar to the `onSubmit` method of our page component:

```
private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const { newName, newAvatarUrl } = this.state;

  console.log(newName);

  if (!newName) {
    notify('Name is required');
    return;
  }

  NProgress.start();
  this.setState({ disabled: true });

  try {
    await updateProfileApiMethod({
      name: newName,
      avatarUrl: newAvatarUrl,
    });

    notify('You successfully updated your profile.');
  } catch (error) {
    notify(error);
  } finally {
    this.setState({ disabled: false });
    NProgress.done();
  }
};
```

How is `uploadFile` method similar to `onSubmit` method?

-   Both method are asynchronous. Both call API method and wait for result.
-   `onSubmit` calls `updateProfileApiMethod` API methods wait for result or error (`await updateProfileApiMethod`). `uploadFile` calls `getSignedRequestForUploadApiMethod` API method and waits for result/error (`await getSignedRequestForUploadApiMethod`), then when it has `signedRequest`, it calls `uploadFileUsingSignedPutRequestApiMethod` API method and waits for result/error (`await uploadFileUsingSignedPutRequestApiMethod`), finally, after uploading file, it calls `updateProfileApiMethod` API method and waits for result/error (`await updateProfileApiMethod`).
-   Both methods use `async/await` and `try/catch/finally` syntax to call corresponding API methods.
-   Both methods use `Nprogress` to show progress.
-   Both methods get data from `this.state`.
-   Both methods set `state` to disable a button from accidental double-clicking.
-   Both methods, regardless of outcome (getting result or error), enable a button and show completion progress.

Having these similarities in mind, we can create an unfinished carcass for the `uploadFile` method:

```
private uploadFile = async () => {
  const { newName, newAvatarUrl } = this.state;

  const fileElement = document.getElementById('upload-file') as HTMLFormElement;
  const file = fileElement.files[0];

  if (file == null) {
    notify('No file selected for upload.');
    return;
  }

  const fileName = file.name;
  const fileType = file.type;

  NProgress.start();
  this.setState({ disabled: true });

  const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_AVATARS;

  const prefix = 'team-builder-book';

  try {

    // call getSignedRequestForUploadApiMethod

    // call uploadFileUsingSignedPutRequestApiMethod

    // call updateProfileApiMethod

    notify('You successfully uploaded new avatar.');
  } catch (error) {
    notify(error);
  } finally {
    fileElement.value = '';
    this.setState({ disabled: false });
    NProgress.done();
  }
};
```

A few code blocks worth noting:

-   `document.getElementById('upload-file')` refers to this element:
    
    ```
      <input
        accept="image/*"
        name="upload-file"
        id="upload-file"
        type="file"
        style={{ display: 'none' }}
        onChange={this.uploadFile}
      />
    ```
    
    `getElementById` is a handy JavaScript method for returning an HTML element by id within an HTML document:
    
    [https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById)
    
-   If no file is selected by user, we want to abort execution and display an informative message using our `Notifier` component:
    
    ```
      if (file == null) {
        notify('No file selected for upload.');
        return;
      }
    ```
    
-   Inside the `finally` block of the `try/catch/finally` construct, we set the HTML element's value to an empty string, in other words, we unselect file:
    
    ```
      fileElement.value = '';
    ```
    
    API for `input` HTML element:
    
    [https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement)
    
    As you can guess, if don't clear the value of the element, then an end user may upload a file that was selected **before** and this is not a good UX.
    

In order to get a response that contains `signedRequest`, we need (1) `fileName`, (2) `prefix` (user's `slug`) to make a file's destination withing S3 bucket more unique, and (3) `bucket`, S3 bucket's name. We need to add `bucket` value as value for new environmental variable `NEXT_PUBLIC_BUCKET_FOR_AVATARS`, and add this env variable to the `.env` file of your `app` project. We also need to remember to create a new env variables `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY`, then add them and their values to `.env` file of `api` project. We will do so later in this section, for now let's get `signedRequest` by calling `getSignedRequestForUploadApiMethod` and waiting for result/error:

```
const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
  fileName,
  fileType,
  prefix,
  bucket,
});
```

We will use all four of the above parameters when we discuss server-side `signRequestForUpload` method defined on our `api` server. We will use these parameters to send first request to AWS S3 server. As you remember from the earlier discussion, this is request-response between `api` server and AWS S3 server. We haven't defined Express route `/aws/get-signed-request-for-upload-to-s3` (that calls the `signRequestForUpload` method) and we haven't defined server-side `signRequestForUpload` method. We do so later in this section.

After the browser gets a response from the AWS S3 server via `api` server, we can access `signedRequest` as `responseFromApiServerForUpload.signedRequest`. In order to upload a file to the AWS S3 bucket, we need a file itself `file`, signed request `responseFromApiServerForUpload.signedRequest`, and optionally provide value for `Cache-Control` header (in our case, the value is 30 days or 259000 seconds):

```
await uploadFileUsingSignedPutRequestApiMethod(
  file,
  responseFromApiServerForUpload.signedRequest,
  {
    'Cache-Control': 'max-age=2592000',
  },
);
```

`Cache-Control` header will control caching time of file on the browser:

[https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

By adding the `Cache-Control` header to our request sent to the AWS S3 server, we specify the caching behavior of the uploaded file. The uploaded file will stay cached **on the browser** for 30 days. Cached for 30 days means when the page requests a file, the browser will get this file from the browser's memory instead of sending a request to the AWS S3 server, thus increasing performance at the cost of not getting the latest version of the file. It's important to make files that we upload as avatars to AWS S3 have a unique destination URL. Because if two files have the same destination URL, and the browser already cached a file using its destination URL, we may end up in a situation where the new file was uploaded but the avatar image on the browser is still an old version. In the next subsection, we will define server-side `signRequestForUpload` method and discuss how to make destination URLs unique.

The file, if successfully uploaded, will have value of destination URL to be `responseFromApiServerForUpload.url`. We should save this value to our database, as value for `avatarUrl` field of the corresponding `User` MongoDB document. To do so, we call the `updateProfileMethod` API method:

```
await currentUser.updateProfileMethod({
  name: this.state.newName,
  avatarUrl: this.state.newAvatarUrl,
});
```

We also want a user who uploaded new avatar to see change in realtime on `YourSettings` page, thus:

```
this.setState({
  newAvatarUrl: responseFromApiServerForUpload.url,
});
```

Plug the above code blocks into unfinished carcass for `uploadFile` method, you should get:

```
private uploadFile = async () => {
  const fileElement = document.getElementById('upload-file') as HTMLFormElement;
  const file = fileElement.files[0];

  if (file == null) {
    notify('No file selected for upload.');
    return;
  }

  const fileName = file.name;
  const fileType = file.type;

  NProgress.start();
  this.setState({ disabled: true });

  const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_AVATARS;

  const prefix = 'team-builder-book';

  try {
    const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
      fileName,
      fileType,
      prefix,
      bucket,
    });

    await uploadFileUsingSignedPutRequestApiMethod(
      file,
      responseFromApiServerForUpload.signedRequest,
      {
        'Cache-Control': 'max-age=2592000',
      },
    );

    this.setState({
      newAvatarUrl: responseFromApiServerForUpload.url,
    });

    await updateProfileApiMethod({
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
```

___

#### Getting signed request API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#getting-signed-request-api)

Alright, we defined page component's method `uploadFile` for `YourSettings`. An end user clicks the `Upload avatar` button and the `uploadFile` method executes. Then `getSignedRequestForUploadApiMethod`, `uploadFileUsingSignedPutRequestApiMethod`, and `updateProfileApiMethod` API methods execute in a sequence.

In this section, let's discuss the getting-signed-request API:

![Builder Book](https://user-images.githubusercontent.com/10218864/106467944-296c6e80-6452-11eb-9fb6-b6cc93b3ef77.png)

Let's build the above API by simply following the above diagram. Our next step is defining `getSignedRequestForUploadApiMethod`:

```
export const getSignedRequestForUploadApiMethod = ({ fileName, fileType, prefix, bucket }) =>
  sendRequestAndGetResponse(`${BASE_PATH}/aws/get-signed-request-for-upload-to-s3`, {
    body: JSON.stringify({ fileName, fileType, prefix, bucket }),
  });
```

Place the above code into a new file `book/4-begin/app/lib/api/team-member.ts`. We place the code to a `team-member.ts` file instead of `public.ts`, because uploading files is allowed only for logged-in users. If a user is logged-in to our web application, we call this user a `Team Member`. If a user is logged in and has the parameter `isTeamLeader: true`, then we call this user a `Team Leader`. We will talk about the `Team` data model later in this book. For now, simply note that API methods exclusive to logged-in users who are not team leaders will be stored at `book/4-begin/app/lib/api/team-member.ts`. And you may guess, API methods for logged-out users will be stored in `public.ts` file. The same is true for file organization of Express routes at `api` project.

We won't go into the details of the above definition for `getSignedRequestForUploadApiMethod` API method, since you are already familiar with two similar API methods: `getUserBySlugApiMethod` and `updateProfileApiMethod`. Similar to these two methods, `getSignedRequestForUploadApiMethod` sends a request with the method `POST`from the `app` on the browser to `api` server. The request's `body` contains all information (`fileName`, `fileType`, `prefix`, `bucket`) required by the AWS S3 server to generate a signed request that we need to successfully upload a file.

On our `api` server, the Express route `/aws/get-signed-request-for-upload-to-s3` gets a request from `app` on the browser, passes `fileName`, `fileType`, `prefix`, and `bucket` values as arguments for the `signRequestForUpload` method, calls this method and waits for result/error. Create a new file `book/4-begin/api/server/api/team-member.ts` inside `api` project with following content:

```
router.post('/aws/get-signed-request-for-upload-to-s3', async (req, res, next) => {
  try {
    const { fileName, fileType, prefix, bucket } = req.body;

    const returnData = await signRequestForUpload({
      fileName,
      fileType,
      prefix,
      bucket,
    });

    res.json(returnData);
  } catch (err) {
    next(err);
  }
});
```

Add missing imports and export statements:

```
import * as express from 'express';

import { signRequestForUpload } from '../aws-s3';

const router = express.Router();

router.post('/aws/get-signed-request-for-upload-to-s3', async (req, res, next) => {
  try {
    const { fileName, fileType, prefix, bucket } = req.body;

    const returnData = await signRequestForUpload({
      fileName,
      fileType,
      prefix,
      bucket,
    });

    res.json(returnData);
  } catch (err) {
    next(err);
  }
});

export default router;
```

Similar to how we organized API methods related to a `Team Member` user in `book/4-begin/app/lib/api/team-member.ts`, we place Express routes related to a `Team Member` user in `book/4-begin/api/server/api/team-member.ts`.

At this point, you have already created multiple Express routes, so the above Express route should be straightforward to understand. The asynchronous handler function of the above Express route gets data from the request's `body` and passes it as arguments to the `signRequestForUpload` method. The `signRequestForUpload` method gets called and code waits for result or error to be returned.

The last part of Getting a signed request API infrastructure is to define the `signRequestForUpload` method.

What do we know about `signRequestForUpload`? As always, when deal with third-party API server, we need to study API documentation. Let's start with the requirements for this method:

-   For any AWS API service, be it S3 or SES, we have to configure AWS with two environmental variables (`AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY`) and a region. AWS services are per region, meaning that your AWS dashboard and API setup may look completely different for different regions. Creating `s3` instance and configuring can be found in S3 API docs:
    
    [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
    
    Simply following example from the above link to official documentation:
    
    ```
      const s3 = new aws.S3({
        apiVersion: 'latest',
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY,
      });
    ```
    
-   Define and collect all necessary parameters as `params`, we will pass `params` to pass to the `s3.getSignedUrl` AWS S3 API method:
    
    ```
      const randomStringForPrefix =
        Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    
      const key = `${prefix}/${randomStringForPrefix}/${fileName}`;
    
      const acl = 'public-read';
    
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: 60,
        ContentType: fileType,
        ACL: acl,
      };
    ```
    
    ACL stands for `Access Control List`, which is a setting that controls which AWS accounts or groups within these accounts have access to the S3 bucket:
    
    [https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html)
    
    The S3 bucket, as you may already know, is a cloud storage unit provided by the AWS S3 service. Think of it as a folder with files in the cloud. In the next subsection, we will create a new S3 bucket with the name `saas-book-avatars`. We will show you how to set up permissions for this bucket. Here we set `ACL` to `public-read`, which makes files available upon any public request providing the bucket allows public access as well. Typically, files and bucket should not allow public access but it depends on your particular use case. In this book, we will allow public access to `saas-book-avatars` database and files in it but we will make sure that guessing destination URL is very hard. We defined a random string as the `key` parameter's value? That's because every time an end user of our web application uploads a new avatar, we want to make sure that the destination URL has hard to guess value and also does not match an existing file's destination URL. `prefix` (which will get value of user's `slug`) and `fileName` contribute to making the `key` a unique string but they can be guessed. It's much harder to guess value of `randomStringForPrefix`. It becomes practically very hard for for someone to guess destination URL value or for us to overwrite an existing file inside the bucket.
    
-   Call `s3.getSignedUrl` AWS S3 API method, with all necessary parameters. Official example from documentation:
    
    [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property)
    
    Example's code:
    
    ```
      var params = {Bucket: 'bucket', Key: 'key'};
    
      s3.getSignedUrl('putObject', params, function (err, url) {
        console.log('The URL is', url);
      });
    ```
    
    In our case, we want the AWS S3 server to respond with `returnData`:
    
    ```
      const returnData = {
        signedRequest: data,
        url: `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`,
      };
    ```
    
    Later, we will send `returnData` from `api` server to `app` code at the browser. On the browser, inside the `uploadFile` method of `YourSettings` component, we access the above two parameters like so:
    
    ```
      responseFromApiServerForUpload.signedRequest
      responseFromApiServerForUpload.url
    ```
    
    We want the asynchronous method `signRequestForUpload` to return Promise. So we can call `signRequestForUpload` method with prepended `await` inside the corresponding Express route. Thus we have to define new Promise (see Chapter 3). If AWS S3 server responds with an error, we print error on our `api` server. If the AWS S3 server responds with a non-error object, `returnData`, we want to return `returnData`:
    
    ```
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
    
    If `if..else` syntax might be new to you, check up Mozilla docs:
    
    [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else)
    
    In general the `if..else` works like this:
    
    ```
      if (condition1)
        statement1
      else if (condition2)
        statement2
      else if (condition3)
        statement3
      ...
      else
        statementN
    ```
    
    As you already know, JS code executes from top to bottom. If `condition` inside parentheses is true then corresponding code `statement` executes. In the above case, if `err` object is not `undefined` or not `null` then `console.error(err);` and `reject(err);` execute. If `err` object is `undefined` or `null`.
    

Create a new file `book/4-begin/api/server/aws-s3.ts` and add the above code to it:

```
import * as url from 'url';
import * as aws from 'aws-sdk';

async function signRequestForUpload({ fileName, fileType, prefix, bucket }) {
  const randomStringForPrefix =
    Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);

  const key = `${prefix}/${randomStringForPrefix}/${fileName}`;

  const acl = 'public-read';

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: 60,
    ContentType: fileType,
    ACL: acl,
  };

  console.log(prefix);

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
}

export { signRequestForUpload };
```

Done.

___

#### Env variables and CORS settings for uploading file [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#env-variables-and-cors-settings-for-uploading-file)

You may have noticed that we have three new environmental variables to add to our project.

To the `app` project (server or browser, depending on type of page rendering), we need to add to `.env` and `next.config.js` file:

```
NEXT_PUBLIC_BUCKET_FOR_AVATARS=
```

We need `NEXT_PUBLIC_BUCKET_FOR_AVATARS` to send a request to the AWS S3 server and get back a response that contains the generated `signedRequest`.

You may ask why we are addinf `NEXT_PUBLIC_BUCKET_FOR_AVATARS` env variable in `app` project instead of `api` project? We could have added it to `api` project but we still need some parameter sent from the page to indicate to which bucket to upload file. As our web application grows, we suggest saving different files to different buckets (avatars to bucket for avatars, post images to bucket for posts, etc), it is the easiest to specify bucket's name on the page instead of `api` server.

Once you register on AWS, your dashboard may look like:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+12-19-43.png)

Remember that your services are per region, so your AWS dashboard may look very different per region. In this book, our region is `us-east-1`. You should see the currently selected region in your browser's address:

```
https://console.aws.amazon.com/console/home?region=us-east-1
```

Also, the AWS dashboard displays the selected region in the top right corner. The option `N.Virginia` corresponds to `us-east-1`. Open `.env` file and add our first AWS-related environmental variable `AWS_REGION` with value `us-east-1`. If you use another region, please use your actual value. We will use value of `AWS_REGION` in both AWS S3 and AWS SES infrastructures.

Let's go to our S3 dashboard and create a new S3 bucket. On your AWS dashboard, click `Services` in the top left menu. In dropdown list, click on `S3` under `Storage`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+13-52-55.png)

Click the `Create bucket` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+13-56-18.png)

Give a name to your bucket - we chose `saas-book-avatars`. Select ACLs enabled in Object Ownership. Scroll down then click the `Create bucket` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/create-bucket.png)  
![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/create-bucket-2.png)

The next step is to set up proper permissions. On your AWS S3 dashboard, you can see the name of your newly created bucket. Click on the name and then click the `Permissions` tab like so:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+14-04-17.png)

By default, the `Block public access` tab is selected. Click `Edit`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+14-06-43.png)

**Uncheck** the checkbox and click `Save`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+14-06-57.png)

You already learned triggers method this chapter response server-side rendering We will discuss. Redirect to checkout team members in production MongoDB database response discussion it works as expected session Click on the button Click on the button production-ready withAuth HOC Navigate to. You already learned We will discuss new Express route Team Leader S3 bucket S3 bucket Google OAuth API Remember to add import. Cookie triggers method show notification it works as expected in a browser MongoDB database team members withAuth HOC HTTP Next.js web application store method calls. Subsection production-ready new Express route new Express route in production show notification on the client At AWS dashboard add environmental variable HTTP mount middleware We will discuss Google OAuth API. Page component send this response production-ready team members new Express route show notification mount middleware decorate method with action Next.js web application API method calls corresponding store method Click on the button on server only it works as expected in this book. API method data model response it works as expected subsection email and name. Check if value is truthy subsection discussion MongoDB database Next.js web application response Google OAuth API new Express route compiles. Team Leader email and name open this file server-side rendering new Express route email and name Next.js web application response S3 bucket API method. Store method calls You already learned conditional operator MongoDB database Put it all together in this book At AWS dashboard session this chapter page component production-ready Remember to add import.

Since destination URL has hard-to-guess string, we made files in the bucket public.

Next, click on the `CORS configuration` tab. Paste the following content to the text area:

```
[
  {
    "AllowedHeaders":[
      "*"
    ],
    "AllowedMethods":[
      "PUT",
      "POST",
      "GET",
      "HEAD",
      "DELETE"
    ],
    "AllowedOrigins":[
      "http://localhost:3000",
      "https://saas-app.async-await.com"
    ],
    "ExposeHeaders":[
      "ETag",
      "x-amz-meta-custom-header"
    ]
  }
]
```

Like so:

![Builder Book](https://user-images.githubusercontent.com/26158226/128653156-42aea0c2-f878-409a-9e34-eaaf83537d73.png)

What does this setting do? We already set up `cors` middleware on our `api` server, so we know what specifying origins on the server does. It makes sure that response sent by AWS S3 server can be accessed by specified origins. In our case, we selected two origins: one for local development and one for deployed projects:

```
<AllowedOrigin>http://localhost:3000</AllowedOrigin>
<AllowedOrigin>https://saas-app.async-await.com</AllowedOrigin>
```

Remember to save the value for your `NEXT_PUBLIC_BUCKET_FOR_AVATARS` env variable (bucket's name) to `book/4-begin/app/.env`. For us, it is `saas-book-avatars`, but you may have chosen a different name when you created your new bucket.

Another two environmental variables are `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY`. These two env vars, as you learned in the previous section, are required to configure AWS S3 API service (or any AWS API service for that matter). Any particular API service, such as S3 or SES (that we introduce later in this book), requires a configured AWS API service to be able to send requests and be identified by AWS API servers.

AWS allows you to create multiple pairs of `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY`. You can make an `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` pair specific to just one AWS service, for example S3 only or SES only. Meaning whoever possesses this pair can only use one API service, for example, AWS S3 service. In this book, we generate one pair of `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` that can be used for all AWS API services. Please do remember that this is not a secure practice.

To find values for your `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` env variables, go to your AWS dashboard:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+12-19-43.png)

In the top right corner, click on your AWS account's name, then click on `My Security Credentials`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+12-25-40.png)

On the loaded page, select the tab that says `Access keys (access key ID and secret access key)`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+12-29-03.png)

If you already have an `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` pair, then you will see them in the table. If you don't, click `Create New Access Key`. Once clicked, you will see a new pair of values generated. Please save this value in a secure location. You will add these values to the `.env` file of `API`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-17+12-32-06.png)

You can't see `Secret Access Key` later, so you have to save it in some secure location now.

Remember to save your values for `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY` to `book/4-begin/api/.env`.

___

#### Uploading file using signed request API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#uploading-file-using-signed-request-api)

The second API method, that our page component's method `uploadFile` calls waits for, is `uploadFileUsingSignedPutRequestApiMethod`. This method actually uploads a file using a signed request. The API infrastructure for uploading a file using a signed request looks like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Uploading+file+using+signed+request.png)

It's a much shorter API infrastructure because the `api` server is not involved. That means there is no code on `api` server, which, in turn, means no Express route or any server-side method. We only to define `uploadFileUsingSignedPutRequestApiMethod` API method inside `app` project: Add the below API method to `book/4-begin/app/lib/api/team-member.ts` file:

```
export const uploadFileUsingSignedPutRequestApiMethod = (file, signedRequest, headers = {}) =>
  sendRequestAndGetResponse(signedRequest, {
    externalServer: true,
    method: 'PUT',
    body: file,
    headers,
  });
```

You see that we passed a new parameter `externalServer`. Most of request from `app` go to `api` server. In rare cases, `app` will communicate with external API server other than `api` server. We can control such dual behavior with bolean parameter `externalServer`. Let's modify `sendRequestAndGetResponse` method inside `book/4-begin/app/lib/api/sendRequestAndGetResponse.ts` file.

When `externalServer` has `true` value then `app` will not send a request to our `api` server. Let's convert this description into code.

Current code:

```
const response = await fetch(
    `${process.env.URL_API}${path}${qs}`,
    Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
  );
```

New code that only sends a request from `app` to `api` when `externalServer: false`. You already learned about conditional operator in Chapter 2 (`condition ? exprIfTrue : exprIfFalse`):

```
const response = await fetch(
  opts.externalServer ? `${path}${qs}` : `${process.env.NEXT_PUBLIC_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);
```

We need to make one more change to the `sendRequestAndGetResponse` method, `Content-type` type is JSON for for body of request between `app` and `api`. Thus our JSON parser middleware, `server.use(express.json())`, mounted on our Express server `api`.

Current code:

```
const headers = Object.assign({}, opts.headers || {}, {
  'Content-type': 'application/json; charset=UTF-8',
});
```

New code:

```
const headers = Object.assign(
  {},
  opts.headers || {},
  opts.externalServer
    ? {}
    : {
        'Content-type': 'application/json; charset=UTF-8',
      },
);
```

External API servers, for example the AWS S3 server to which `app` sends request, are not necessarily set up to parse and process JSON format data from incoming requests. Thus in the above change, when `externalServer: true`, our request will **not** include header `'Content-type': 'application/json; charset=UTF-8'`.

We are done with uploading a file using a signed request API! It's shorter than a typical API infrastructure, because `app` has a req-res cycle directly with the AWS S3 server.

Let's also comment out these two lines, since they will only add confusion for requests sent from `app` to the AWS S3 server:

```
// console.log(`before: ${process.env.URL_API}${path}${qs}`);

const response = await fetch(
  opts.externalServer ? `${path}${qs}` : `${process.env.NEXT_PUBLIC_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);

// console.log(`after: ${process.env.URL_API}${path}${qs}`);
```

Remember to add the new changes we made in this subsection to the `book/4-begin/app/lib/api/sendRequestAndGetResponse.ts` file.

We are ready to test our new APIs. In the next subsection, we will see if uploading a file works as we designed it.

___

#### Testing file upload [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-file-upload)

Aright, we implemented all parts of the API infrastructure to upload files in our SaaS boilerplate:

-   We created our page's `uploadFile` method.
-   We wrote all code related to "Getting signed request API".
-   We wrote all code related to "Uploading file using signed request API".
-   We added a new parameter to `sendRequestAndGetResponse` method (`externalServer`). And passed it to `uploadFileUsingSignedPutRequestApiMethod` API method with `true` value.
-   We created an S3 bucket in our AWS S3 dashboard and added all missing env variables to `app` and `api` projects.

We can finally test!

Before testing, check the value for `avatarUrl` in the user document of your `test.users` collection:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-18+15-04-05.png)

`avatarUrl`:

```
https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=128
```

Another item to check before testing file upload is the `saas-book-avatars` bucket:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-18+15-07-10.png)

Currently empty as it should be.

Start both `app` and `api` with `yarn dev`. Navigate to `http://localhost:3000/your-settings`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-18+15-13-00.png)

As you can see, the current avatar is a generic image that acts as a placeholder:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-18+15-16-54.png)

Press `Upload avatar` and select an image from your local machine. We selected an image titled `potato-new.png` from our local machine:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-18+15-17-58.png)

After selecting an image, you will get a `404` error. The `Notifier` component will show you this error. Check the bucket on your AWS S3 dashboard - no new files. Check your MongoDB database - `avatarUrl` has the same old value. Now check the outputs of both terminal windows (`app` and `api`).

No errors for `app`, but there is an error in `api`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-18+15-31-12.png)

The error reads:

```
MissingRequiredParameter: Missing required key 'Bucket' in params
```

It was a good idea to add `console.log(error)` in here:

```
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
```

Although we pass the `bucket` parameter properly from `app` to `api`, we have the above error.

Add `console.log(bucket)` to `book/4-begin/app/pages/your-settings.tsx` like this:

```
const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_AVATARS;

console.log(bucket);

const prefix = 'team-builder-book';
```

Go to `http://localhost:3000/your-settings` and try uploading your file again. This time, check the browser's console, not the terminal windows, since our `uploadFile` method runs on the browser. To check the browser console, click `Ctrl + Shift + J` and select the `Console` tab:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+11-56-05.png)

**Restart** your `app` project. Go to your browser and reload `http://localhost:3000/your-settings`. Try uploading a file now:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+12-01-22.png)

You can see:

-   `Notifier` shows a success message.
-   A new avatar replaces the old avatar.
-   The browser console prints the proper bucket name.

Let's check our AWS S3 dashboard:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+12-06-06.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+12-06-31.png)

Our S3 bucket indeed has the `potato-new.png` file inside the `team-builder-book/qw15gl5w3x5wzpzan3v2` folder. Surely enough, this folder inside the `team-builder-book` folder is our random string of 20 characters that we created in `book/4-begin/api/server/aws-s3.ts`.

Select your file (in our case, `potato-new.png`) and then click `Actions > Change metadata`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+12-08-09.png)

Surely enough, the uploaded file has the metadata that we passed to the AWS S3 server from our `api` server. We passed `ContentType` parameter when calling `s3.getSignedUrl` inside `signRequestForUpload` method of Getting signed request API infrastructure. And we passed `{ 'Cache-Control': 'max-age=2592000' }` when calling `uploadFileUsingSignedPutRequestApiMethod` API method inside `YourSettings.uploadFile` method.

Finally, let's check our MongoDB database. Find the only user document we have at this point in the `test.users` collection:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+12-22-27.png)

`updateProfileApiMethod` succeeded as well, as `avatarUrl` field, inside our database, has a new value:

```
https://saas-book-avatars.s3.amazonaws.com/team-builder-book/qw15gl5w3x5wzpzan3v2/potato-new.png
```

We have almost reached the end of Chapter 4. In the next and the last subsection of this chapter, we will make a small improvement to the file uploading process.

___

#### resizeImage [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#resizeimage)

Currently, we allow end users of our web application to upload files of any dimension and size. There is no place in our web application where we show a full-size avatar, there is no need for it. On `YourSettings` page, the size of the avatar is only 60x60 pixels:

```
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
```

So it would be nice if we had a way to resize the file before uploading it to our S3 bucket. If we can resize a file to be 128x128 pixels or at least 128 pixels in one dimension and less than 128 pixels in the second dimension, then this resizing will save a lot of space in our S3 bucket and significantly reduce upload time and our expenses.

Open `book/4-begin/app/pages/your-settings.tsx` and add it anywhere after `file` variable's definition :

```
console.log(file);
```

Comment out any unrelated `console.log` statements from `book/4-begin/app/pages/your-settings.tsx`, so you don't get overwhelemed by output.

Start both `app` and `api` projects with `yarn dev`. Go to `http://localhost:3000/your-settings`. Keep your browser console open. Click the `Upload avatar` button and select a file to upload:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+13-46-34.png)

The browser console prints `file`, which as you can see, is an `object`:

```
File {name: "potato-new.png", lastModified: 1584314639928, lastModifiedDate: Sun Mar 15 2020 16:23:59 GMT-0700 (Pacific Daylight Time), webkitRelativePath: "", size: 2066580, …}
```

If you click on this `object` inside the browser console, you will see parameters of the file-like `object`:

```
lastModified: 1584314639928
lastModifiedDate: Sun Mar 15 2020 16:23:59 GMT-0700 (Pacific Daylight Time) {}
name: "potato-new.png"
size: 2066580
type: "image/png"
webkitRelativePath: ""
__proto__: File
```

The file is represented by a file-like object called `blob`:

[https://developer.mozilla.org/en-US/docs/Web/API/Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

You can see that `blob` has parameters such as `type` and `size`. Our goal is to write code that will take this `blob` object as an argument and return another `blob` object but resized. We want to keep `type` the same but reduce size. Translating English to JavaScript - we basically want to define a `resizeFile` method that works like this:

```
const resizedFile = await resizeImage(file, 128, 128);
```

Check up the current value for the `size` parameter: it's 2066580.

The dimensions of `potato-new.png` file:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+13-56-25.png)

are 1277x1401=1789077. This is about 87% of 2066580. The remaining 13% is the file's metadata.

When we test our `resizeFile` method at the end of this subsection, we want our new `blob` to have a much smaller size.

As you can see from above, `resizeFile` should take three arguments: `file` (which is `blob`), `MAX_WIDTH`, and `MAX_HEIGHT`. The output is our resized `blob`, which we've named `resizedFile`. We set `MAX_WIDTH` and `MAX_HEIGHT` to be 128 and 128, respectively.

`resizedFile` replaces `file` as an argument for the `uploadFileUsingSignedPutRequestApiMethod` API method:

```
const resizedFile = await resizeImage(file, 128, 128);

console.log(file);
console.log(resizedFile);

await uploadFileUsingSignedPutRequestApiMethod(
  resizedFile,
  responseFromApiServerForUpload.signedRequest,
  {
    'Cache-Control': 'max-age=2592000',
  },
);
```

Add the above code to `YourSettings` page. Remember to import the `resizeFile` method using:

```
import { resizeImage } from '../lib/resizeImage';
```

We haven't defined `resizeFile` yet. Let's put it into new `book/4-begin/app/lib/resizeImage.ts` file.

To successfully resize an image, we need to learn more about API for image manipulation.

First, we need to understand if the file needs resizing, so let's create boolean parameter called `isResizeNeeded` with a default value of `false`:

```
let isResizeNeeded = false;
```

The original file has width and height. We have to compare `width` to `MAX_WIDTH` and `height` to `MAX_HEIGHT`:

```
let isResizeNeeded = false;
let width = img.width;
let height = img.height;

if (width > height) {
  if (width > MAX_WIDTH) {
    isResizeNeeded = true;
    height *= MAX_WIDTH / width;
    width = MAX_WIDTH;
  }
} else {
  if (height > MAX_HEIGHT) {
    isResizeNeeded = true;
    width *= MAX_HEIGHT / height;
    height = MAX_HEIGHT;
  }
}
```

This code will set `isResizeNeeded` to `true` even if just one dimension is larger than 128. For example, let's say we have file that is 256x100. What happens if you plug these values into this block of code?:

```
if (width > MAX_WIDTH) {
  isResizeNeeded = true;
  height *= MAX_WIDTH / width;
  width = MAX_WIDTH;
}
```

Let's replace some variables with their values:

```
256 > 100 (true)
256 > 128 (true)
isResizeNeeded = true;
height = 100 x (128/256) = 50
width = 128
```

What is the size of the new file? Answer: 128x50. So the original file was 256x100, and the resized file is 128x50. The above code we wrote allows us to keep the width/height ratio the same. This supports good user experience. It would not be good UX if our code distorted the dimensions of someone's avatar.

You can practice on your own and imagine what happens if `height > width`.

So far so good. What do we do when we know that resize is indeed needed, `isResizeNeeded = true`? We need to create a new `blob` object that has new, reduced dimensions.

In JavaScript, you can create a new `blob` from `canvas` using the `canvas.toBlob` method. Check up Mozilla's docs:

[https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

Code that new blob that corresponds to the original file will look like this:

```
const image = document.createElement('img');

if (isResizeNeeded) {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  canvas.toBlob((blob) => {
    resolve(blob);
  }, file.type);
} else {
  resolve(file);
}
```

We created new `canvas` using `document.createElement` method:

[https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)

```
const canvas = document.createElement('canvas');
```

`canvas` is an HTML element, and it is used to draw and manipulate graphics. In our case, we will draw in 2D image.

Without drawing anything on the created `canvas`, `canvas` is empty. In order to draw graphics, we have to access the canvas's rendering context, `ctx`, and call the context's method `drawImage` to draw 2D image on the `canvas`:

[https://developer.mozilla.org/en-US/docs/Web/API/Canvas\_API/Tutorial/Basic\_usage](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage)

[https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)

```
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, width, height);
```

Once our `canvas` has our 2D image, we can create a new blob with the `canvas.toBlob` method that we just earlier. Note that we need to:

-   Return the original `file` when `isResizeNeeded` has value of `false`.
-   Return a new `blob` with new dimensions when `isResizeNeeded` has value of `true`.

Let's create our `resize` method that 1) checks if resize event is needed, 2) if so, creates `canvas`, draws image with new dimensions on it and returns resized file `file`:

```
const image = document.createElement('img');

const resize = (resolve) => () => {
  let isResizeNeeded = false;
  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > MAX_WIDTH) {
      isResizeNeeded = true;
      height *= MAX_WIDTH / width;
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      isResizeNeeded = true;
      width *= MAX_HEIGHT / height;
      height = MAX_HEIGHT;
    }
  }

  if (isResizeNeeded) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => {
      resolve(blob);
    }, file.type);
  } else {
    resolve(file);
  }
};
```

We are almost done with the definition of our `resizeImage` method!

There is only one problem - currently, `image` is an empty image. We somehow need take returned resized `file` and populate `image.src` with data produced by the file reader:

[https://developer.mozilla.org/en-US/docs/Web/API/FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

`FileReader` reads a file's content asynchronously:

You can create new reader like this:

[https://developer.mozilla.org/en-US/docs/Web/API/FileReader/FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/FileReader)

From the above link:

```
var reader = new FileReader();
```

`FileReader.readAsDataURL` reads a file's content asynchronously and outputs data as `e.target.result`:

[https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL)

```
reader.readAsDataURL(file);
```

When `FileReader.readAsDataURL` finishes reading a file's content, `FileReader.onload` executes. The event handler, `FileReader.onload`, will only execute after the reader finishes reading the file's content:

[https://developer.mozilla.org/en-US/docs/Web/API/FileReader/onload](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/onload)

Inside this event handler, we can populate `image.src` with result of asynchronous reading of the `file`:

```
reader.onload = (e) => {
  image.src = e.target.result.toString();
};
```

Combine all the code we discussed and add three `console.log` statements to `book/4-begin/app/lib/resizeImage.ts`:

```
function resizeImage(file: File, MAX_WIDTH, MAX_HEIGHT) {
  const image = document.createElement('img');

  const resize = (resolve) => () => {
    let isResizeNeeded = false;
    let width = image.width;
    let height = image.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        isResizeNeeded = true;
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        isResizeNeeded = true;
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }

    if (isResizeNeeded) {
      const canvas = document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;

      console.log(width, height);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, file.type);
    } else {
      resolve(file);
    }
  };

  return new Promise((resolve) => {
    const reader = new FileReader();

    console.log(`before ${image.src}`);

    reader.readAsDataURL(file);

    reader.onload = (e) => {
      image.src = e.target.result.toString();

      image.onload = resize(resolve);

      console.log(`after ${image.src}`);
    };
  });
}

export { resizeImage };
```

Note that we called `resize` method inside `image.onload` event handler, meaning that `resize` runs immediately after image is loaded on the browser.

Please note the location of all three `console.log` statements.

We are ready to test!

Start both `app` and `api` with `yarn dev`. Navigate to `http://localhost:3000/your-settings`.

Keep your browser console open. Click the `Upload avatar` button. Select the same file as before - for us, it is `potato-new.png`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+16-25-49.png)

It worked as expected!

As you can see, `image.src` is indeed empty **before** `reader.readAsDataURL` finishes reading the file and populates it. The format of `img.src` is base64 string after it's populated.

The new dimensions for our resized file are:

```
116.67094932191291 128
```

The original file has size `2066580`, and the resized file is `38827`.

The original file's width/height ratio is `1277/1401 = 0.91`, and the resized file's ratio is `116.7/128 = 0.91`. The ratio did not change, and that's exactly how we designed our `resize` method to work.

Go to your AWS S3 dashboard and access the `saas-book-avatars` bucket. Click on the `team-builder-book` folder:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+16-37-13.png)

The second folder that was just created corresponds to uploading of a resized file.

Click on the `2nagqv8tva16du71i9sj` folder (remember that in your case, the folder will have a different name, since the folder's name is random). Then click on the file's name: `potato-new.png`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+16-41-06.png)

Click the `Download` button. On Ubuntu, go to your `Downloads` folder and find the downloaded file.

Right-click on the downloaded file, click `Properties` on the dropdown menu, and then select `Image`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-4/Screenshot+from+2020-03-19+16-43-58.png)

Nice!

The dimensions went from 1277x1401 to 116x128.

The file size went from 2.0 MB to 37.9 KB.

We saved a lot of storage space on S3 and reduced file upload and retrieval time in our web application.

___

This was a long chapter, but you learned many new skills!

This is the end of Chapter 4.

If you followed steps described in this chapter closely, your codebase should match the codebase located at `book/4-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___