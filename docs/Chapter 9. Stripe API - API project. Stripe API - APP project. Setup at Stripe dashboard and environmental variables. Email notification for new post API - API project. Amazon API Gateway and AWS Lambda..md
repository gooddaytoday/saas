In Chapter 9, you will start with the codebase in the [9-begin folder](https://github.com/async-labs/saas/tree/master/book/9-begin) of our [saas repo](https://github.com/async-labs/saas) and end up with the codebase in the [9-end folder](https://github.com/async-labs/saas/tree/master/book/9-end).

We will cover the following topics in this chapter:

-   Stripe API - API project  
    
    -   Stripe setup - API
    -   Stripe methods - API
    -   Stripe checkout callback - API
    -   Stripe webhook - API
    -   Team Model - API
    -   User Model - API
    -   Team Leader Express routes - API
-   Stripe API - APP project  
    
    -   Team Leader API methods - APP
    -   Team data store - APP
    -   User data store - APP
    -   Billing page and testing - APP
    -   TeamSettings page and testing - APP
-   Setup at Stripe dashboard and environmental variables  
    
    -   Testing Stripe API
-   Email notification for new post API - API project  
    
    -   Discussion and EmailTemplate Models - API
    -   Express routes for adding and editing Discussion - API
    -   sendDataToLambdaApiMethod API method - APP
    -   Discussion data store - APP
    -   CreateDiscussionForm, EditDiscussionForm and PostForm - APP
    -   Testing updates to internal API infrastructure
-   Amazon API Gateway and AWS Lambda  
    
    -   Amazon API Gateway
    -   AWS Lambda
    -   Testing entire Email notification for new post API

___

As you read this chapter, we encourage you to report any bugs, typos, or explanations that were confusing on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

___

## Stripe API - API project [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#stripe-api-api-project)

In this section, we will discuss subscriptions and how to implement them using Stripe API. We will outline the entire Stripe API infrastructure for our application. Any SaaS product has to have a way to charge customers. Most non-enterprise SaaS businesses charge customers on a monthly basis, somewhere in the $25-$500 range. In this book, we will show you how to implement the following features in our SaaS boilerplate, so that a Team Leader end user can:

-   buy a subscription (subscribe to a monthly plan)
-   unsubscribe (stop a subscription)
-   update card information
-   see a list of all invoices for subscription payments

In your real world SaaS product, you are the decision maker for what features to provide to your customers in terms of billing. In this section, we will build a simple `Billing` page that allows an end user to do the above list of actions:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-21-45.png)

Besides figuring out what billing features to add to your SaaS product, you should decide when to ask customers to buy a monthly plan. Your particular SaaS product may offer a trial period or require all customers to become paying customers right away. For a trial period, you should decide whether you want to collect card information and whether customers are automatically charged at the end of the trial period. By knowing your customers well, you can decide what works best for them and for your business.

In this book, we are showing you a less aggressive approach of offering customers to pay for your SaaS product. We let any end user use our boilerplate, but we set a limit to the number of team members that a Team Leader can invite to their team. By this point in the book, you have two accounts, one for a Team Leader and one for a Team Member. We will set up a limit of two team members including the Team Leader. In other words, the Team Leader has to become a paying customer in order to add a third team member to team:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-27-12.png)

Team Leader Potato has to go to the `Billing` page and buy a subscription in order to add a third member to the Team Builder Book team.

We will be using a newer Stripe API that prescribes using Stripe Checkout, which redirects a potential customer to a Stripe-hosted checkout page to add payment information and confirm payment. This newer API also prescribes creating a Stripe session object that contains information about the customer, subscription, and redirect URLs for different outcomes, among other data. There are three possible outcomes with different redirect URLs. A Team Leader in our application will click the `Buy Subscription` button and be redirected to Stripe's Checkout Website. Then, this end user can either cancel or proceed with payment. If the end user cancels, he/she gets redirected to the `Billing` page and sees a cancel message. If the end user proceeds and an error is caught, he/she gets redirected back to the `Billing` page and sees an error message. Finally, if the end user proceeds and payment is successful, he/she gets redirected to the `Billing` page and sees an updated UI that shows (1) that this end user is indeed a paying customer, (2) that our application has saved this end user's card information, and (2) a list of invoices with a first invoice.

We can summarize Stripe API infrastructure in our application like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Stripe+API.png)

___

#### Stripe setup - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#stripe-setup-api)

As we mentioned a bit earlier, we will be using the most recent Stripe API approach as of August 2020. The older approach was using a Stripe popup within your application. The newer approach prescribes us to use a checkout page hosted by Stripe, Stripe Checkout:

[https://stripe.com/docs/payments/checkout](https://stripe.com/docs/payments/checkout)

Checkout is a checkout page that works across devices, including mobile browsers. Our application has to redirect a potential customer to Checkout and then back to our application.

For every attempt to manually pay in our application, Stripe prescribes creating and retrieving a Session object:

[https://stripe.com/docs/api/checkout/sessions](https://stripe.com/docs/api/checkout/sessions)

Stripe Session should be created for single payments and first subscription payments. In our case, we use it for first subscription payments. We need to create a Session object on our `API` server, then pass the Session's id, `sessionId`, to our `APP` project on the browser and call `redirectToCheckout({ sessionId })` to redirect an end user from our `Billing` page to Stripe's Checkout page.

[https://stripe.com/docs/js/checkout/redirect\_to\_checkout](https://stripe.com/docs/js/checkout/redirect_to_checkout)

When our `API` server gets a request from Stripe's server - `API` has to run some code to update the corresponding `Team` and `User` MongoDB documents. For example, we want to set the field `isSubscriptionActive` to `true` for the `Team` document and save a `stripeCard` object as a field to the `User` document. How do we find the correct `Team` and `User` to update? We retrieve a Session object that contains all necessary information to find the correct `Team` and `User` documents.

Here is a visual explanation of when we need to create and retrieve a Session. We need to create a Session before redirecting to Checkout. We need to retrieve a Session after getting a request from Stripe's server:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Stripe+API.png)

Go to Stripe's API documentation and find the API method for creating a Session:

[https://stripe.com/docs/api/checkout/sessions/create](https://stripe.com/docs/api/checkout/sessions/create)

Select `Node.js` in the `Select library` dropdown:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-03+10-55-06.png)

As you can see, the Stripe API method we are looking for is `stripe.checkout.sessions.create`.

Go to Stripe's API documentation and find the API method to retrieve a Session:

[https://stripe.com/docs/api/checkout/sessions/retrieve](https://stripe.com/docs/api/checkout/sessions/retrieve)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-03+10-57-07.png)

The Stripe API method we are looking for is `stripe.checkout.sessions.retrieve`.

Let's define `createSession` on our `API` server. We, as developers, can specify the shape of a Session object; however, some properties are required. For example, `payment_method_types`, `success_url`, and `cancel_url` are required properties of any Session object. We want to save `userId` and `teamId` to be able to find `User` and `Team` documents later and update them.

`createSession` Stripe method:

```
const dev = process.env.NODE_ENV !== 'production';

const stripeInstance = new Stripe(
  dev ? process.env.STRIPE_TEST_SECRETKEY : process.env.STRIPE_LIVE_SECRETKEY,
  { apiVersion: '2023-10-16' },
);

function createSession({ userId, teamId, teamSlug, customerId, subscriptionId, userEmail, mode }) {
  const params: Stripe.Checkout.SessionCreateParams = {
    customer_email: customerId ? undefined : userEmail,
    customer: customerId,
    payment_method_types: ['card'],
    mode,
    success_url: `${process.env.URL_API}/stripe/checkout-completed/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL_APP}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled`,
    metadata: { userId, teamId },
  };

  if (mode === 'subscription') {
    params.line_items = [
      {
        price: dev ? process.env.STRIPE_TEST_PRICEID : process.env.STRIPE_LIVE_PRICEID,
        quantity: 1,
      },
    ];
  } else if (mode === 'setup') {
    if (!customerId || !subscriptionId) {
      throw new Error('customerId and subscriptionId required');
    }

    params.setup_intent_data = {
      metadata: { customer_id: customerId, subscription_id: subscriptionId },
    };
  }

  return stripeInstance.checkout.sessions.create(params);
}
```

Once we defined `params`, we called the Stripe API method `stripeInstance.checkout.sessions.create(params)`. We should discuss a few parts of method in more detail:

-   The type of `params` is `Stripe.Checkout.SessionCreateParams`. You should have the `stripe` package already installed, so `Stripe.Checkout.SessionCreateParams` is available.
-   `success_url` has an API endpoint, meaning we have to define a matching Express route, `/stripe/checkout-completed/:sessionId`. Then we access `sessionId` as `req.params.sessionId` and retrieve a Session object, update `Team` and `User` documents, and send `res.redirect` to the browser to redirect an end user from Checkout back to our application - either the `Billing` page with success UI or the `Billing` page with an error message via the `redirectMessage` prop and `notify`.
-   `cancel_url` is straightforward to understand. `req.query.redirectMessage` is accessed by our code inside `App.getInitialProps` and populated as the `redirectMessage` prop in all pages. We need to call `notify` on the `Billing` page to show a cancel message to an end user.
-   `mode` can have two values in our application. For making the first subscription payment and becoming a subscriber, the value for `mode` is `subscription`. For updating card information, the value of `mode` is `setup`: [https://stripe.com/docs/payments/checkout/subscriptions/update-payment-details#create-checkout-session](https://stripe.com/docs/payments/checkout/subscriptions/update-payment-details#create-checkout-session).
-   When the `mode` value is `setup`, we have to check for `customerId` and `subscriptionId` to make sure a Stripe customer exists and a Stripe Subscription exists. Otherwise, it makes no sense to let a user edit their payment method.

The Stripe method `retrieveSession` takes one argument and expands properties of the Session object it retrieves with the Stripe API method `stripeInstance.checkout.sessions.retrieve`:

```
function retrieveSession({ sessionId }: { sessionId: string }) {
  return stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: [
      'setup_intent',
      'setup_intent.payment_method',
      'customer',
      'subscription',
      'subscription.default_payment_method',
    ],
  });
}
```

Expanding a response in Stripe API means getting additional data - in this case, an object's properties:

[https://stripe.com/docs/api/expanding\_objects](https://stripe.com/docs/api/expanding_objects)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-03+13-02-11.png)

Place the above code into a new file, `book/9-begin/api/server/stripe.ts`. At the top of the file, add imports and a line that disables the camelcase rule (for example, the `success_url` parameter is not camelcase):

```
/* eslint-disable @typescript-eslint/camelcase */

import * as bodyParser from 'body-parser';
import Stripe from 'stripe';

import Team from './models/Team';
import User from './models/User';

const dev = process.env.NODE_ENV !== 'production';

const stripeInstance = new Stripe(
  dev ? process.env.STRIPE_TEST_SECRETKEY : process.env.STRIPE_LIVE_SECRETKEY,
  { apiVersion: '2023-10-16' },
);

function createSession({ userId, teamId, teamSlug, customerId, subscriptionId, userEmail, mode }) {
  const params: Stripe.Checkout.SessionCreateParams = {
    customer_email: customerId ? undefined : userEmail,
    customer: customerId,
    payment_method_types: ['card'],
    mode,
    success_url: `${process.env.URL_API}/stripe/checkout-completed/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL_APP}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled`,
    metadata: { userId, teamId },
  };

  if (mode === 'subscription') {
    params.line_items = [
      {
        price: dev ? process.env.STRIPE_TEST_PRICEID : process.env.STRIPE_LIVE_PRICEID,
        quantity: 1,
      },
    ];
  } else if (mode === 'setup') {
    if (!customerId || !subscriptionId) {
      throw new Error('customerId and subscriptionId required');
    }

    params.setup_intent_data = {
      metadata: { customer_id: customerId, subscription_id: subscriptionId },
    };
  }

  return stripeInstance.checkout.sessions.create(params);
}

function retrieveSession({ sessionId }: { sessionId: string }) {
  return stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: [
      'setup_intent',
      'setup_intent.payment_method',
      'customer',
      'subscription',
      'subscription.default_payment_method',
    ],
  });
}
```

As you can see from the above code, we added `redirectMessage` query when redirecting to the `Billing` page:

```
${process.env.URL_APP}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled
```

Here we have choice of either defining `Billing.getInitialProps` method where we can read value of `ctx.query.redirectMessage` or reading `ctx.query.redirectMessage` inside `MyApp.getInitialProps`. In both cases we need to remember to pass read value to the page's props. Here we choose second approach - updating `MyApp.getInitialProps`.

Open the file `book/9-begin/app/pages/_app.tsx` and update the following lines.

Line:

```
const { teamSlug } = ctx.query;
```

Becomes:

```
const { teamSlug, discussionSlug, redirectMessage } = ctx.query;
```

Block:

```
const pageProps = { 
  isMobile: isMobile({ req: ctx.req }), 
  firstGridItem, 
  teamRequired, 
  teamSlug,
  discussionSlug,
};
```

Becomes:

```
const pageProps = { 
  isMobile: isMobile({ req: ctx.req }), 
  firstGridItem, 
  teamRequired, 
  teamSlug,
  discussionSlug,
  redirectMessage,
};
```

Later in this chapter we will update `Billing` page so it does show `redirectMessage` value with `notify` if `redirectMessage` value is truthy.

___

#### Stripe methods - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#stripe-methods-api)

In this subsection, we will define four Stripe methods:

-   The `updateCustomer` and `updateSubscription` Stripe methods will be used inside the Express route `/stripe/checkout-completed/:sessionId`, which we have yet to define.
-   The `cancelSubscription` Stripe method will be used inside the static methods `cancelSubscription` and `cancelSubscriptionAfterFailedPayment` of the `Team` model.
-   The `getListOfInvoices` Stripe method will be used inside the static method `getListOfInvoicesForCustomer` of the `User` model.

In the previous subsection, you familiarized yourself with Stripe API documentation. Inside the Express route `/stripe/checkout-completed/:sessionId`, we want to use the `updateCustomer` and `updateSubscription` Stripe methods to **update** Stripe Customer and Stripe Subscription `default_payment_method` parameter. After checking Stripe's API docs:

[https://stripe.com/docs/api/customers/update](https://stripe.com/docs/api/customers/update)

[https://stripe.com/docs/api/subscriptions/update](https://stripe.com/docs/api/subscriptions/update)

you can find that the Stripe API methods we should use are `stripeInstance.customers.update` and `stripeInstance.subscriptions.update`.

Inside `cancelSubscription`, we want to cancel Subscription:

[https://stripe.com/docs/api/subscriptions/cancel](https://stripe.com/docs/api/subscriptions/cancel)

Thus, we use the `stripeInstance.subscriptions.cancel` Stripe API method.

And we want `getListOfInvoices` to return a list of invoices:

[https://stripe.com/docs/api/invoices/list](https://stripe.com/docs/api/invoices/list)

Thus, we use the `stripeInstance.invoices.list` Stripe API method.

End user API method calls corresponding store method MongoDB database list of posts API infrastructure it works as expected Put it all together. In production this chapter end user redirect to checkout Next.js web application triggers method add environmental variable in production if truthy then API method calls corresponding store method in a browser Material-UI check if value is truthy. AWS dashboard show notification add environmental variable MongoDB database server-side rendering Team Leader email and name S3 bucket At AWS dashboard redirect to checkout add environmental variable static method calls page component cookie. Compiles Team Leader Next.js web application At AWS dashboard check if value is truthy store method calls check if value is truthy in production. API method API method mount middleware Team Leader redirect to checkout this chapter new Express route API method calls corresponding store method on the client show notification mount middleware on the client. If truthy then Material-UI Next.js web application on server only Navigate to API infrastructure team members. In a browser API infrastructure production-ready add environmental variable subsection new Express route if truthy then Click on the button API method calls corresponding store method discussion triggers method. HTTP compiles Click on the button API infrastructure compiles You already learned session MongoDB database We will discuss Next.js web application end user production-ready cookie API infrastructure. HTTP store method calls add environmental variable it works as expected team members HTTP if truthy then decorate method with action it works as expected email and name on the client API method calls corresponding store method redirect to checkout in a browser data model. It works as expected send this response mount middleware show notification API infrastructure You already learned triggers method Google OAuth API show notification add environmental variable.

Add these four new Stripe methods to `book/9-begin/api/server/stripe.ts` under the `retrieveSession` method:

```
function updateCustomer(customerId, params: Stripe.CustomerUpdateParams) {
  console.log('updating customer', customerId);
  return stripeInstance.customers.update(customerId, params);
}

function updateSubscription(subscriptionId: string, params: Stripe.SubscriptionUpdateParams) {
  console.log('updating subscription', subscriptionId);
  return stripeInstance.subscriptions.update(subscriptionId, params);
}

function cancelSubscription({ subscriptionId }) {
  console.log('cancel subscription', subscriptionId);
  return stripeInstance.subscriptions.cancel(subscriptionId);
}

function getListOfInvoices({ customerId }) {
  console.log('getting list of invoices for customer', customerId);
  return stripeInstance.invoices.list({ customer: customerId, limit: 100 });
}
```

___

#### Stripe checkout callback - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#stripe-checkout-callback-api)

Once an end user adds a payment method and confirms payment at Checkout, Stripe's server sends a request to our `API` server. We need to process this request with an Express route, since `API` is an Express server. As we discussed in the [Stripe setup - API](https://builderbook.org/books/saas-boilerplate/stripe-api-api-project-stripe-api-app-project-setup-at-stripe-dashboard-and-environmental-variables-email-notification-for-new-post-api-api-project-amazon-api-gateway-and-aws-lambda#stripe-setup-api) subsection, we neeed to extract `sessionid` from the API endpoint:

```
const { sessionId } = req.params;
```

Then we call the `retrieveSession({ sessionId })` method that we defined in the [Stripe setup - API](https://builderbook.org/books/saas-boilerplate/stripe-api-api-project-stripe-api-app-project-setup-at-stripe-dashboard-and-environmental-variables-email-notification-for-new-post-api-api-project-amazon-api-gateway-and-aws-lambda#stripe-setup-api) subsection as well.

The retrieved Session object has all necessary information to update the `User` document. `userId` and `teamId` are accessed as `session.metadata.userId` and `session.metadata.teamId`, respectively. We make all necessary checks (checking that parameters are not `null` or `undefined`), then:

-   we either call `updateCustomer`/`updateSubscription`/`User.changeStripeCard` methods for when a Team Leader edits their payment method (`mode: 'setup'`)
-   or we call `User.saveStripeCustomerAndCard`/`Team.subscribeTeam`/`User.getListOfInvoicesForCustomer` methods for when a Team Leader buys a subscription (`mode: 'subscription'`)

If all is successful, we redirect a Team Leader to the `Billing` page:

```
`${process.env.URL_APP}/team/${team.slug}/billing`
```

where we show this Team Leader a UI that indicates the Team Leader successfully bought a subscription.

If our code catches an error, we redirect the Team Leader to the `Billing` page and show an error message:

```
${process.env.URL_APP}/team/${team.slug}/billing?redirectMessage=${err.message ||
        err.toString()}
```

To summarize the above explanation, review the Express route `/stripe/checkout-completed/:sessionId`:

```
server.get('/stripe/checkout-completed/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  const session = await retrieveSession({ sessionId });
  if (!session || !session.metadata || !session.metadata.userId || !session.metadata.teamId) {
    throw new Error('Wrong session.');
  }

  const user = await User.findById(
    session.metadata.userId,
    '_id stripeCustomer email displayName isSubscriptionActive stripeSubscription',
  ).setOptions({ lean: true });

  const team = await Team.findById(
    session.metadata.teamId,
    'isSubscriptionActive stripeSubscription teamLeaderId slug',
  ).setOptions({ lean: true });

  if (!user) {
    throw new Error('User not found.');
  }

  if (!team) {
    throw new Error('Team not found.');
  }

  if (team.teamLeaderId !== user._id.toString()) {
    throw new Error('Permission denied');
  }

  try {
    if (session.mode === 'setup' && session.setup_intent) {
      const si: Stripe.SetupIntent = session.setup_intent as Stripe.SetupIntent;
      const pm: Stripe.PaymentMethod = si.payment_method as Stripe.PaymentMethod;

      if (user.stripeCustomer) {
        await updateCustomer(user.stripeCustomer.id, {
          invoice_settings: { default_payment_method: pm.id },
        });
      }

      if (team.stripeSubscription) {
        await updateSubscription(team.stripeSubscription.id, { default_payment_method: pm.id });
      }

      await User.changeStripeCard({ session, user });
    } else if (session.mode === 'subscription') {
      await User.saveStripeCustomerAndCard({ session, user });
      await Team.subscribeTeam({ session, team });
      await User.getListOfInvoicesForCustomer({ userId: user._id });
    } else {
      throw new Error('Wrong session.');
    }

    res.redirect(`${process.env.URL_APP}/team/${team.slug}/billing`);
  } catch (err) {
    console.error(err);

    res.redirect(
      `${process.env.URL_APP}/team/${team.slug}/billing?redirectMessage=${err.message ||
        err.toString()}`,
    );
  }
});
```

Unlike other Express routes in our application that are hosted at `book/9-begin/api/server/api/*`, the above Express route is more similar to Express routes for Google OAuth API or Passwordless API. The Express route `/stripe/checkout-completed/:sessionId` does not get mounted on our Express server automatically. You can add the above code to your `book/9-begin/api/server/stripe.ts` file, but eventually, we need to wrap it with some function and then import/use this function in our Express server at `book/9-begin/api/server/server.ts` to properly mount the Express route.

___

#### Stripe webhook - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#stripe-webhook-api)

Let's say a Team Leader successfully bought a subscription and became a paying customer. At some point, the Team Leader's card may expire or may have no funds. Stripe will automatically generate an Invoice object for every upcoming recurring payment and attempt to charge the card (default payment method in our application), but it will fail. How does our application know that Stripe encountered a failed payment event?

Stripe's server needs to send a request to our `API` server at a predefined API endpoint to notify the `API` server that payment for the invoice has failed. In other words, we need to create a new Express route to process a request sent by Stripe's server to our `API` server's webhook endpoint. A webhook is a way for third-party service, for example a server, to send real time updates to our server. In our case, we are interested in a real time update for when a paying customer's card fails to charge.

Stripe's server detects a failed payment for an invoice and creates a corresponding Event object. This object may have a very different shape. The shape of the Event object is defined by its type. For us, the event is `invoice.payment_failed`:

[https://stripe.com/docs/api/events/types#event\_types-invoice.payment\_failed](https://stripe.com/docs/api/events/types#event_types-invoice.payment_failed)

That means `event.data.object` has the shape of an Invoice object:

[https://stripe.com/docs/api/invoices/object](https://stripe.com/docs/api/invoices/object)

From the above link to Stripe's API docs:

```
{
  "id": "in_1HCG1u2eZvKYlo2CKiWn3TJ4",
  "object": "invoice",
  "account_country": "US",
  "account_name": "Stripe.com",
  "amount_due": 0,
  "amount_paid": 0,
  "amount_remaining": 0,
  "application_fee_amount": null,
  "attempt_count": 0,
  "attempted": false,
  "auto_advance": true,
  "billing_reason": "manual",
  "charge": null,
  "collection_method": "charge_automatically",
  "created": 1596508650,
  "currency": "usd",
  "custom_fields": null,
  "customer": "cus_Hlndw8KX3FClEe",
  "customer_address": null,
  "customer_email": null,
  "customer_name": null,
  "customer_phone": null,
  "customer_shipping": null,
  "customer_tax_exempt": "none",
  "customer_tax_ids": [],
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [],
  "description": null,
  "discount": null,
  "discounts": [],
  "due_date": null,
  "ending_balance": null,
  "footer": null,
  "hosted_invoice_url": null,
  "invoice_pdf": null,
  "lines": {
    "data": [
      {
        "id": "il_tmp_8ea2b494b23cd5",
        "object": "line_item",
        "amount": 2999,
        "currency": "usd",
        "description": "1 × INAI Direct (at $29.99 / month)",
        "discount_amounts": [],
        "discountable": true,
        "discounts": [],
        "livemode": false,
        "metadata": {},
        "period": {
          "end": 1599187050,
          "start": 1596508650
        },
        "plan": {
          "id": "price_1HBw0d2eZvKYlo2Cf82wSjoJ",
          "object": "plan",
          "active": true,
          "aggregate_usage": null,
          "amount": 2999,
          "amount_decimal": "2999",
          "billing_scheme": "per_unit",
          "created": 1596431691,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": null,
          "product": "prod_HlSwy9jxi7yjQf",
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1HBw0d2eZvKYlo2Cf82wSjoJ",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1596431691,
          "currency": "usd",
          "livemode": false,
          "lookup_key": null,
          "metadata": {},
          "nickname": null,
          "product": "prod_HlSwy9jxi7yjQf",
          "recurring": {
            "aggregate_usage": null,
            "interval": "month",
            "interval_count": 1,
            "usage_type": "licensed"
          },
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 2999,
          "unit_amount_decimal": "2999"
        },
        "proration": false,
        "quantity": 1,
        "subscription": "sub_Hlndzd6SlBbmxZ",
        "subscription_item": "si_HlndHiuhbOZ6SZ",
        "tax_amounts": [],
        "tax_rates": [],
        "type": "subscription"
      }
    ],
    "has_more": false,
    "object": "list",
    "url": "/v1/invoices/in_1HCG1u2eZvKYlo2CKiWn3TJ4/lines"
  },
  "livemode": false,
  "metadata": {},
  "next_payment_attempt": 1596512250,
  "number": "82C5F47-DRAFT",
  "paid": false,
  "payment_intent": null,
  "period_end": 1596508650,
  "period_start": 1596508650,
  "post_payment_credit_notes_amount": 0,
  "pre_payment_credit_notes_amount": 0,
  "receipt_number": null,
  "starting_balance": 0,
  "statement_descriptor": null,
  "status": "draft",
  "status_transitions": {
    "finalized_at": null,
    "marked_uncollectible_at": null,
    "paid_at": null,
    "voided_at": null
  },
  "subscription": null,
  "subtotal": 0,
  "tax": null,
  "tax_percent": null,
  "total": 0,
  "total_discount_amounts": [],
  "total_tax_amounts": [],
  "transfer_data": null,
  "webhooks_delivered_at": null
}
```

Once the Express route `API` server gets triggered, we are interested in cancelling a subscription in our application by updating the corresponding `Team` MongoDB document. Once this is done, the Team Leader will see proper UI at the `Billing` page and have the same usage restriction as other non-paying end users. Look at the above shape of the Invoice object - we can access a subscription's id as `event.data.object.subscription`.

Subsection decorate method with action in this book request was sent triggers method if truthy then production-ready add environmental variable Material-UI page component in production data model on the client request Click on the button. AWS dashboard in a browser response redirect to checkout open this file. You already learned decorate method with action Google OAuth API API method calls corresponding store method show notification show notification Material-UI response. API method calls corresponding store method mount middleware on the client send this response At AWS dashboard Navigate to check if value is truthy server-side rendering session subsection session Put it all together withAuth HOC request. Production-ready Put it all together in production in a browser At AWS dashboard HTTP request withAuth HOC new Express route server-side rendering check if value is truthy API method calls corresponding store method API method request server-side rendering. Click on the button compiles server-side rendering new Express route redirect to checkout response data model open this file on server only Click on the button MongoDB database subsection Material-UI. Session session Team Leader subsection API infrastructure store method calls API method add environmental variable HTTP. HTTP Put it all together add environmental variable compiles list of posts in this book in this book data model You already learned. Data model static method calls response show notification MongoDB database request was sent HTTP request production-ready decorate method with action. S3 bucket discussion S3 bucket production-ready in production MongoDB database request response it works as expected.

The method `stripeWebhook`, similar to `setupGoole` from `book/9-begin/api/server/google-auth.ts`, mounts an Express route that accepts a request with the `POST` method on our Express server:

```
function stripeWebhook({ server }) {
  server.post(
    '/api/v1/public/stripe-invoice-payment-failed',
    async (req, res, next) => {
      // some content
    },
  );
}
```

As for any other Express route, we, as developers, compose an API endpoint. In this case, it is `/api/v1/public/stripe-invoice-payment-failed`. Later in this section, we will need to add this API endpoint toa webhook that we create manually at Stripe's dashboard.

Before we proceed further, let's look at the official example of setting up a webhook endpoint on a Node.js server:

[https://stripe.com/docs/webhooks/signatures#verify-official-libraries](https://stripe.com/docs/webhooks/signatures#verify-official-libraries)

```
app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!');
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod was attached to a Customer!');
      break;
    // ... handle other event types
    default:
      // Unexpected event type
      return response.status(400).end();
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});
```

A few important notes from the above example:

-   The Stripe API method to construct an Event is `stripe.webhooks.constructEvent`
    
-   Stripe requires us to retrieve raw body to construct an Event object
    
-   `bodyParser.raw({type: 'application/json'})` middleware is route-specific middleware:
    
    [http://expressjs.com/en/guide/using-middleware.html](http://expressjs.com/en/guide/using-middleware.html)
    
    So far, we only used application-level middleware, for example:
    
    ```
      server.use(cors({ origin: process.env.URL_APP, credentials: true }));
    
      server.use(express.json());
    ```
    
    Here, we use middleware for one route only by specifying it between an API endpoint and the route's handler function.
    
-   If we construct an Event object with `stripe.webhooks.constructEvent(request.body, sig, endpointSecret)` instead of defining it as `JSON.parse(request.body)` - our server automatically verifies that the request was indeed sent from Stripe's server. That's because we manually retrieve the value for the `STRIPE_TEST_ENDPOINTSECRET`/`STRIPE_LIVE_ENDPOINTSECRET` environmental variable from Stripe's dashboard and add it to our application, where it is used to construct an event and verify that the event was indeed sent from Stripe's server.
    

In addition to what the official example shows, we want to do two more things:

-   Access a subscription's id as `event.data.object.subscription`. We should use `JSON.stringify` to convert an Event object's property to a string.
-   Call the static method `Team.cancelSubscriptionAfterFailedPayment` with a subscription's id as argument, so we can modify the corresponding `Team` document to reflect a cancelled subscription.

`stripeWebhook` Stripe method:

```
function stripeWebhook({ server }) {
  server.post(
    '/api/v1/public/stripe-invoice-payment-failed',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res, next) => {
      try {
        const event = stripeInstance.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          dev ? process.env.STRIPE_TEST_ENDPOINTSECRET : process.env.STRIPE_LIVE_ENDPOINTSECRET,
        );

        console.log(`${event.id}, ${event.type}`);

        // invoice.payment_failed
        // data.object is an invoice
        // Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method.

        if (event.type === 'invoice.payment_failed') {
          // @ts-expect-error subscription does not exist on type Object
          const { subscription } = event.data.object;
          console.log(JSON.stringify(subscription));

          await Team.cancelSubscriptionAfterFailedPayment({
            subscriptionId: JSON.stringify(subscription),
          });
        }

        res.sendStatus(200);
      } catch (err) {
        console.error(`Webhook error: ${err.message}`);
        next(err);
      }
    },
  );
}
```

The `stripe` package supplies types for most cases - there is no need for `@types/stripe`. But we had to use `// @ts-expect-error` to suppress a TypeScript error in this instance. If there is no TypeScript error in future versions of the `stripe` package, then `// @ts-expect-error` will report that `// @ts-expect-error` is not necessary:

[https://devblogs.microsoft.com/typescript/announcing-typescript-3-9-beta/#ts-expect-error-comments](https://devblogs.microsoft.com/typescript/announcing-typescript-3-9-beta/#ts-expect-error-comments)

Since `stripeWebhook` will mount the Express route `/api/v1/public/stripe-invoice-payment-failed`, let's the add Express route `/stripe/checkout-completed/:sessionId` to it as well. After doing so, let's rename the method from `stripeWebhook` to `stripeWebhookAndCheckoutCallback`.

Put together all the code that we discussed so far in this section. Remember to export methods that we plan to use elsewhere in our application. You should get the following content for `book/9-begin/api/server/stripe.ts`:

```
/* eslint-disable @typescript-eslint/camelcase */

import * as bodyParser from 'body-parser';
import Stripe from 'stripe';

import Team from './models/Team';
import User from './models/User';

const dev = process.env.NODE_ENV !== 'production';

const stripeInstance = new Stripe(
  dev ? process.env.STRIPE_TEST_SECRETKEY : process.env.STRIPE_LIVE_SECRETKEY,
  { apiVersion: '2023-10-16' },
);

function createSession({ userId, teamId, teamSlug, customerId, subscriptionId, userEmail, mode }) {
  const params: Stripe.Checkout.SessionCreateParams = {
    customer_email: customerId ? undefined : userEmail,
    customer: customerId,
    payment_method_types: ['card'],
    mode,
    success_url: `${process.env.URL_API}/stripe/checkout-completed/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL_APP}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled`,
    metadata: { userId, teamId },
  };

  if (mode === 'subscription') {
    params.line_items = [
      {
        price: dev ? process.env.STRIPE_TEST_PRICEID : process.env.STRIPE_LIVE_PRICEID,
        quantity: 1,
      },
    ];
  } else if (mode === 'setup') {
    if (!customerId || !subscriptionId) {
      throw new Error('customerId and subscriptionId required');
    }

    params.setup_intent_data = {
      metadata: { customer_id: customerId, subscription_id: subscriptionId },
    };
  }

  return stripeInstance.checkout.sessions.create(params);
}

function retrieveSession({ sessionId }: { sessionId: string }) {
  return stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: [
      'setup_intent',
      'setup_intent.payment_method',
      'customer',
      'subscription',
      'subscription.default_payment_method',
    ],
  });
}

function updateCustomer(customerId, params: Stripe.CustomerUpdateParams) {
  console.log('updating customer', customerId);
  return stripeInstance.customers.update(customerId, params);
}

function updateSubscription(subscriptionId: string, params: Stripe.SubscriptionUpdateParams) {
  console.log('updating subscription', subscriptionId);
  return stripeInstance.subscriptions.update(subscriptionId, params);
}

function cancelSubscription({ subscriptionId }) {
  console.log('cancel subscription', subscriptionId);
  return stripeInstance.subscriptions.cancel(subscriptionId);
}

function getListOfInvoices({ customerId }) {
  console.log('getting list of invoices for customer', customerId);
  return stripeInstance.invoices.list({ customer: customerId, limit: 100 });
}

function stripeWebhookAndCheckoutCallback({ server }) {
  server.post(
    '/api/v1/public/stripe-invoice-payment-failed',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res, next) => {
      try {
        const event = stripeInstance.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          dev ? process.env.STRIPE_TEST_ENDPOINTSECRET : process.env.STRIPE_LIVE_ENDPOINTSECRET,
        );

        console.log(`${event.id}, ${event.type}`);

        // invoice.payment_failed
        // data.object is an invoice
        // Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method.

        if (event.type === 'invoice.payment_failed') {
          // @ts-expect-error subscription does not exist on type Object
          const { subscription } = event.data.object;
          console.log(JSON.stringify(subscription));

          await Team.cancelSubscriptionAfterFailedPayment({
            subscriptionId: JSON.stringify(subscription),
          });
        }

        res.sendStatus(200);
      } catch (err) {
        console.error(`Webhook error: ${err.message}`);
        next(err);
      }
    },
  );

  server.get('/stripe/checkout-completed/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    const session = await retrieveSession({ sessionId });
    if (!session || !session.metadata || !session.metadata.userId || !session.metadata.teamId) {
      throw new Error('Wrong session.');
    }

    const user = await User.findById(
      session.metadata.userId,
      '_id stripeCustomer email displayName isSubscriptionActive stripeSubscription',
    ).setOptions({ lean: true });

    const team = await Team.findById(
      session.metadata.teamId,
      'isSubscriptionActive stripeSubscription teamLeaderId slug',
    ).setOptions({ lean: true });

    if (!user) {
      throw new Error('User not found.');
    }

    if (!team) {
      throw new Error('Team not found.');
    }

    if (team.teamLeaderId !== user._id.toString()) {
      throw new Error('Permission denied');
    }

    try {
      if (session.mode === 'setup' && session.setup_intent) {
        const si: Stripe.SetupIntent = session.setup_intent as Stripe.SetupIntent;
        const pm: Stripe.PaymentMethod = si.payment_method as Stripe.PaymentMethod;

        if (user.stripeCustomer) {
          await updateCustomer(user.stripeCustomer.id, {
            invoice_settings: { default_payment_method: pm.id },
          });
        }

        if (team.stripeSubscription) {
          await updateSubscription(team.stripeSubscription.id, { default_payment_method: pm.id });
        }

        await User.changeStripeCard({ session, user });
      } else if (session.mode === 'subscription') {
        await User.saveStripeCustomerAndCard({ session, user });
        await Team.subscribeTeam({ session, team });
        await User.getListOfInvoicesForCustomer({ userId: user._id });
      } else {
        throw new Error('Wrong session.');
      }

      res.redirect(`${process.env.URL_APP}/team/${team.slug}/billing`);
    } catch (err) {
      console.error(err);

      res.redirect(
        `${process.env.URL_APP}/team/${team.slug}/billing?redirectMessage=${err.message ||
          err.toString()}`,
      );
    }
  });
}

export { createSession, cancelSubscription, getListOfInvoices, stripeWebhookAndCheckoutCallback };
```

Let's mount two Express routes for our Stripe API infrastructure. Open the file `book/9-begin/api/server/server.ts` and import `stripeWebhookAndCheckoutCallback`:

```
import { stripeWebhookAndCheckoutCallback } from './stripe';
```

Use it like this:

```
stripeWebhookAndCheckoutCallback({ server });

server.use(express.json());
```

It's important that you mount these two Express routes above application-level middleware, `express.json()`. The Express route `/stripe/checkout-completed/:sessionId` does **not** have to be above `server.use(express.json());` middleware, but since the route does not read and parse a request's body, it's ok to place it above. The Express route `/api/v1/public/stripe-invoice-payment-failed` has to be above `server.use(express.json());` middleware.

___

#### Team Model - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#team-model-api)

As you have learned by now, Stripe has concepts that include Customer, Subscription, Invoice, PaymentMethod, and more. Once a Team Leader in our application goes through Checkout successfully, Stripe will keep creating an Invoice object for every upcoming recurring payment and then attempt to charge the default PaymentMethod, which is the saved card for our application.

This means Stripe will charge until a payment for an invoice fails. Once a payment fails, we need to reflect it in our application. In addition to reflecting a cancelled subscription, we want to display an active subscription, saved card, and list of paid invoices to a paying customer. In other words, we need to save some data from Stripe to our data models and write new static methods to update such data.

List of posts subsection list of posts server-side rendering At AWS dashboard this chapter new Express route subsection We will discuss. Redirect to checkout discussion it works as expected subsection add environmental variable production-ready subsection it works as expected cookie on the client. S3 bucket list of posts if truthy then if truthy then decorate method with action You already learned. List of posts static method calls email and name triggers method session cookie show notification discussion Navigate to MongoDB database. Session MongoDB database data model discussion it works as expected. End user conditional operator store method calls redirect to checkout Team Leader on server only API infrastructure S3 bucket triggers method it works as expected conditional operator server-side rendering Put it all together S3 bucket. Cookie cookie redirect to checkout triggers method subsection store method calls email and name. In this book conditional operator We will discuss store method calls triggers method Remember to add import cookie end user add environmental variable team members HTTP AWS dashboard Google OAuth API static method calls API infrastructure. You already learned static method calls decorate method with action Google OAuth API decorate method with action Put it all together in production page component show notification check if value is truthy show notification send this response this chapter Google OAuth API You already learned. Response HTTP session API method calls corresponding store method triggers method compiles redirect to checkout.

Here is our architectural decision. We will add the following new fields to our `Team` data model:

```
stripeSubscription: {
  id: String,
  object: String,
  application_fee_percent: Number,
  billing: String,
  cancel_at_period_end: Boolean,
  billing_cycle_anchor: Number,
  canceled_at: Number,
  created: Number,
},
isSubscriptionActive: {
  type: Boolean,
  default: false,
},
isPaymentFailed: {
  type: Boolean,
  default: false,
},
```

Add the above new fields to the `Team` Schema in your `book/9-begin/api/server/models/Team.ts` file.

Since some parameters from Stripe's server are not camelcase, add this line at the beginning of the file:

```
/* eslint-disable @typescript-eslint/camelcase */
```

Update the interface of `TeamDocument` by adding:

```
stripeSubscription: {
  id: string;
  object: string;
  application_fee_percent: number;
  billing: string;
  cancel_at_period_end: boolean;
  billing_cycle_anchor: number;
  canceled_at: number;
  created: number;
};
isSubscriptionActive: boolean;
isPaymentFailed: boolean;
```

Define types for new static methods' arguments and return values:

```
subscribeTeam({
  session,
  team,
}: {
  session: Stripe.Checkout.Session;
  team: TeamDocument;
}): Promise<void>;

cancelSubscription({
  teamLeaderId,
  teamId,
}: {
  teamLeaderId: string;
  teamId: string;
}): Promise<TeamDocument>;

cancelSubscriptionAfterFailedPayment({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<TeamDocument>;
```

As you may recall, we run `Team.subscribeTeam` inside the Express route `/stripe/checkout-completed/:sessionId` if a Team Leader successfully completes Checkout. We run `Team.cancelSubscription` when a Team Leader manually cancels a subscription by clicking on the `Unsubscribe Team` button at the `Billing` page. And we run `Team.cancelSubscriptionAfterFailedPayment` inside the webhook Express route `/api/v1/public/stripe-invoice-payment-failed` when Stripe's server sends our `API` server a failed payment event.

As you remember, we called `Team.subscribeTeam` with two arguments, `Team.subscribeTeam({ session, team })`, inside the Express route `/stripe/checkout-completed/:sessionId`. We use `session` to access a Stripe Subscription object as `session.subscription`. Then we take `session.subscription` and assign its value to a `Team` document's field `stripeSubscription`. We also set the boolean field for `isSubscriptionActive` to `true`:

```
public static async subscribeTeam({
  session,
  team,
}: {
  session: Stripe.Checkout.Session;
  team: TeamDocument;
}) {
  if (!session.subscription) {
    throw new Error('Not subscribed');
  }

  if (!team) {
    throw new Error('User not found.');
  }

  if (team.isSubscriptionActive) {
    throw new Error('Team is already subscribed.');
  }

  const stripeSubscription = session.subscription as Stripe.Subscription;
  if (stripeSubscription.canceled_at) {
    throw new Error('Unsubscribed');
  }

  await this.updateOne({ _id: team._id }, { stripeSubscription, isSubscriptionActive: true });
}
```

The static method `cancelSubscription` finds a `Team` document, checks that relevant values are truthy (not `null` or `undefined`), then calls the Stripe method `cancelSubscription` from `book/9-begin/api/server/server.ts`, gets the `cancelledSubscriptionObj` object, and updates two fields in the found `Team` document - `stripeSubscription: cancelledSubscriptionObj` and `isSubscriptionActive: false` - and returns an updated document:

```
public static async cancelSubscription({ teamLeaderId, teamId }) {
  const team = await this.findById(teamId).select(
    'teamLeaderId isSubscriptionActive stripeSubscription',
  );

  if (team.teamLeaderId !== teamLeaderId) {
    throw new Error('You do not have permission to subscribe Team.');
  }

  if (!team.isSubscriptionActive) {
    throw new Error('Team is already unsubscribed.');
  }

  const cancelledSubscriptionObj = await cancelSubscription({
    subscriptionId: team.stripeSubscription.id,
  });

  return this.findByIdAndUpdate(
    teamId,
    {
      stripeSubscription: cancelledSubscriptionObj,
      isSubscriptionActive: false,
    },
    { new: true, runValidators: true },
  )
    .select('isSubscriptionActive stripeSubscription')
    .setOptions({ lean: true });
}
```

The static method `cancelSubscriptionAfterFailedPayment` finds a `Team` document, makes all necessary checks, calls the Stripe method `cancelSubscription`, gets `cancelledSubscriptionObj`, updates three fields - `stripeSubscription: cancelledSubscriptionObj`, `isSubscriptionActive: false`, `isPaymentFailed: true` - and finally returns an updated document:

```
public static async cancelSubscriptionAfterFailedPayment({ subscriptionId }) {
  const team: any = await this.find({ 'stripeSubscription.id': subscriptionId })
    .select('teamLeaderId isSubscriptionActive stripeSubscription isPaymentFailed')
    .setOptions({ lean: true });

  if (!team.isSubscriptionActive) {
    throw new Error('Team is already unsubscribed.');
  }

  if (team.isPaymentFailed) {
    throw new Error('Team is already unsubscribed after failed payment.');
  }

  const cancelledSubscriptionObj = await cancelSubscription({
    subscriptionId,
  });

  return this.findByIdAndUpdate(
    team._id,
    {
      stripeSubscription: cancelledSubscriptionObj,
      isSubscriptionActive: false,
      isPaymentFailed: true,
    },
    { new: true, runValidators: true },
  )
    .select('isSubscriptionActive stripeSubscription isPaymentFailed')
    .setOptions({ lean: true });
}
```

Please remember:

-   To add these three new static methods at the end of the section that defines the `TeamClass` class.
    
-   To update the imports section and disable the camelcase rule:
    
    ```
      /* eslint-disable @typescript-eslint/camelcase */
    
      import * as mongoose from 'mongoose';
      import Stripe from 'stripe';
    
      import { cancelSubscription } from '../stripe';
      import { generateNumberSlug } from '../utils/slugify';
      import User from './User';
    ```
    

___

#### User Model - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#user-model-api)

We added three new fields and three new static methods to our `Team` document. Here, we will add four new fields and three new static methods to our `User` document.

Session conditional operator new Express route send this response redirect to checkout cookie withAuth HOC withAuth HOC send this response redirect to checkout MongoDB database subsection response API method calls corresponding store method Click on the button. It works as expected mount middleware request send this response Team Leader S3 bucket response this chapter request was sent API infrastructure API method calls corresponding store method data model decorate method with action. This chapter send this response compiles AWS dashboard in this book in this book in a browser Click on the button response response production-ready end user request was sent compiles in a browser. Data model list of posts triggers method redirect to checkout We will discuss redirect to checkout it works as expected Next.js web application request conditional operator S3 bucket. API method calls corresponding store method mount middleware add environmental variable in production send this response. Check if value is truthy server-side rendering list of posts Material-UI response new Express route withAuth HOC. Material-UI response server-side rendering in this book Put it all together At AWS dashboard Next.js web application API method calls corresponding store method cookie on the client Navigate to open this file. Team members API method calls corresponding store method send this response redirect to checkout list of posts data model server-side rendering show notification triggers method. Triggers method Team Leader discussion check if value is truthy At AWS dashboard store method calls Google OAuth API Remember to add import response API method calls corresponding store method page component Click on the button. Data model Put it all together You already learned subsection list of posts on the client.

Open your `book/9-begin/api/server/models/User.ts` file and add new fields to the `User` Schema:

```
stripeCustomer: {
  id: String,
  object: String,
  created: Number,
  currency: String,
  default_source: String,
  description: String,
},
stripeCard: {
  id: String,
  object: String,
  brand: String,
  funding: String,
  country: String,
  last4: String,
  exp_month: Number,
  exp_year: Number,
},
hasCardInformation: {
  type: Boolean,
  default: false,
},
stripeListOfInvoices: {
  object: String,
  has_more: Boolean,
  data: [
    {
      id: String,
      object: String,
      amount_paid: Number,
      created: Number,
      customer: String,
      subscription: String,
      hosted_invoice_url: String,
      billing: String,
      paid: Boolean,
      number: String,
      teamId: String,
      teamName: String,
    },
  ],
},
```

Add types to the interface of `UserDocument` by adding:

```
stripeCustomer: {
  id: string;
  default_source: string;
  created: number;
  object: string;
  description: string;
};
stripeCard: {
  id: string;
  object: string;
  brand: string;
  country: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  funding: string;
};
hasCardInformation: boolean;
stripeListOfInvoices: {
  object: string;
  has_more: boolean;
  data: [
    {
      id: string;
      object: string;
      amount_paid: number;
      date: number;
      customer: string;
      subscription: string;
      hosted_invoice_url: string;
      billing: string;
      paid: boolean;
      number: string;
      teamId: string;
      teamName: string;
    },
  ];
};
```

Add `stripeCard`, `hasCardInformation`, and `stripeListOfInvoices`, because we want to make these properties available on the browser:

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
    'stripeCard',
    'hasCardInformation',
    'stripeListOfInvoices',
  ];
}
```

Define types for new static methods' arguments and return values:

```
saveStripeCustomerAndCard({
  user,
  session,
}: {
  session: Stripe.Checkout.Session;
  user: UserDocument;
}): Promise<void>;

changeStripeCard({
  session,
  user,
}: {
  session: Stripe.Checkout.Session;
  user: UserDocument;
}): Promise<void>;

getListOfInvoicesForCustomer({ userId }: { userId: string }): Promise<UserDocument>;
```

We call `User.saveStripeCustomerAndCard` with the arguments `user` and `session` inside the Express route `/stripe/checkout-completed/:sessionId` when `session.mode === 'subscription'`. The static method `saveStripeCustomerAndCard` uses the `user` argument to find a `User` document in our database, makes all checks, and updates three fields - `stripeCustomer` with `session.customer`, `stripeCard` with `stripeSubscription.default_payment_method.card`, and `hasCardInformation` with `true` or `false` depending on thevalue of `stripeCard`:

```
public static async saveStripeCustomerAndCard({
  user,
  session,
}: {
  session: Stripe.Checkout.Session;
  user: UserDocument;
}) {
  if (!user) {
    throw new Error('User not found.');
  }

  const stripeSubscription = session.subscription as Stripe.Subscription;

  const stripeCard =
    (stripeSubscription.default_payment_method &&
      (stripeSubscription.default_payment_method as Stripe.PaymentMethod).card) ||
    undefined;

  const hasCardInformation = !!stripeCard;

  await this.updateOne(
    { _id: user._id },
    {
      stripeCustomer: session.customer,
      stripeCard,
      hasCardInformation,
    },
  );
}
```

We call `User.changeStripeCard` with the arguments `user` and `session` inside the Express route `/stripe/checkout-completed/:sessionId` when `session.mode === 'setup'` (not `'subscription'`). The static method `changeStripeCard` uses `user` to find a matching `User` document, checks if `session.setup_intent.payment_method.card` is truthy, and if so, updates the field `stripeCard` with it and sets `hasCardInformation` to `true`:

```
public static async changeStripeCard({
  session,
  user,
}: {
  session: Stripe.Checkout.Session;
  user: UserDocument;
}): Promise<void> {
  if (!user) {
    throw new Error('User not found.');
  }

  const si: Stripe.SetupIntent = session.setup_intent as Stripe.SetupIntent;
  const pm: Stripe.PaymentMethod = si.payment_method as Stripe.PaymentMethod;

  if (!pm.card) {
    throw new Error('No card found.');
  }
  await this.updateOne({ _id: user._id }, { stripeCard: pm.card, hasCardInformation: true });
}
```

We will use `User.getListOfInvoicesForCustomer` inside the Express route `/get-list-of-invoices-for-customer`, which we will define in the next subsection. A Team Leader triggers the Express route `/get-list-of-invoices-for-customer` on our `API` server when this Team Leader clicks on the `Show payment history` button on the `Billing` page. The static method `getListOfInvoicesForCustomer` takes one argument, `userId`, finds a `User` document with this `userId`, accesses a customer's id as `user.stripeCustomer.id`, calls the Stripe method `getListOfInvoices` with the customer's id as an argument, receives an array of Invoice objects from `getListOfInvoices`, saves this array as a value for the `stripeListOfInvoices` field of the `User` document, and finally returns an updated `User` document/object:

```
public static async getListOfInvoicesForCustomer({ userId }) {
  const user = await this.findById(userId, 'stripeCustomer');

  if (!user.stripeCustomer.id) {
    throw new Error('You are not a customer and you have no payment history.');
  }

  const newListOfInvoices = await getListOfInvoices({
    customerId: user.stripeCustomer.id,
  });

  if (newListOfInvoices.data === undefined || newListOfInvoices.data.length === 0) {
    throw new Error('You are a customer. But there is no payment history.');
  }

  const modifier = {
    stripeListOfInvoices: newListOfInvoices,
  };

  return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
    .select('stripeListOfInvoices')
    .setOptions({ lean: true });
}
```

Please remember:

-   To add these three new static methods at the end of the section that defines the `UserClass` class.
    
-   To update the imports section by importing `getListOfInvoices` and to disable the camelcase rule:
    
    ```
      /* eslint-disable @typescript-eslint/camelcase */
    
      import * as _ from 'lodash';
      import * as mongoose from 'mongoose';
      import Stripe from 'stripe';
    
      import sendEmail from '../aws-ses';
      import { addToMailchimp } from '../mailchimp';
      import { generateSlug } from '../utils/slugify';
      import getEmailTemplate from './EmailTemplate';
      import Team, { TeamDocument } from './Team';
    
      import { getListOfInvoices } from '../stripe';
    ```
    

___

#### Team Leader Express routes - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#team-leader-express-routes-api)

In our typical internal API infrastructure, we create 1 API method for 1 Express route for 1 static method on the Model. For example, 3 Express routes to add, update, and delete posts - each has a corresponding static method in the `Post` model of our `API` project and a corresponding API method in the `APP` project. Same for our Discussion API infrastructure. In our Stripe API infrastructure, that's not the case, because we already have 2 Express routes - one webhook and one for Checkout callback - that do not require API methods in the `APP` project.

The only three Express routes that will have API methods are those that will be used when an end user makes the following actions on the browser:

-   Clicks the `Buy Subscription` button. This ultimately triggers the handler function of the Express route `/stripe/fetch-checkout-session`.
-   Clicks the `Unsubscribe Team` button. This ultimately triggers the handler function of the Express route `/cancel-subscription`.
-   Clicks the `Show payment history` button. This ultimately triggers the handler function of the Express route `/get-list-of-invoices-for-customer`.

Where do we put these new Express routes? Since all three of them are exclusive to a Team Leader and cannot be used by a Team Member or public user (logged-out end users), we must put them into `book/9-begin/api/server/api/team-leader.ts`.

When a Team Leader clicks on the `Buy Subscription` button - in accordance with Stripe API docs - our server has to create a Session object, and our code on the browser has to receive a `sessionId` with a value of `session.id` in order to call the `redirectToCheckout({ sessionId })` method to redirect a Team Leader to the Checkout page hosted by Stripe. To create a Session object, our application calls the API method `fetchCheckoutSessionApiMethod` after detecting a click on the `Buy Subscription` button. `fetchCheckoutSessionApiMethod`, in turn, sends a request to the Express route `/stripe/fetch-checkout-session`. The Express route `/stripe/fetch-checkout-session` finds `User` and `Team` documents, checks if they are truthy, checks if an end user is indeed the proper Team Leader, creates a Session object using the `createSession` Stripe method from `book/9-begin/api/server/stripe.ts` and returns `sessionId` back to `fetchCheckoutSessionApiMethod` located at the browser:

```
router.post('/stripe/fetch-checkout-session', async (req: any, res, next) => {
  try {
    const { mode, teamId } = req.body;

    const user = await User.findById(req.user.id)
      .select(['stripeCustomer', 'email'])
      .setOptions({ lean: true });

    const team = await Team.findById(teamId)
      .select(['stripeSubscription', 'slug', 'teamLeaderId'])
      .setOptions({ lean: true });

    if (!user || !team || team.teamLeaderId !== req.user.id) {
      throw new Error('Permission denied');
    }

    const session = await createSession({
      mode,
      userId: user._id.toString(),
      userEmail: user.email,
      teamId,
      teamSlug: team.slug,
      customerId: (user.stripeCustomer && user.stripeCustomer.id) || undefined,
      subscriptionId: (team.stripeSubscription && team.stripeSubscription.id) || undefined,
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    next(err);
  }
});
```

When a Team Leader decides to cancel a subscription, the Team Leader clicks the `Unsubscribe Team` button on the `Billing` page. After clicking, our application will call the API method `cancelSubscriptionApiMethod`, which will send a request to the Express route `/cancel-subscription`. The Express route `/cancel-subscription` calls `Team.cancelSubscription` that we defined in the [Team Model - API](https://builderbook.org/books/saas-boilerplate/stripe-api-api-project-stripe-api-app-project-setup-at-stripe-dashboard-and-environmental-variables-email-notification-for-new-post-api-api-project-amazon-api-gateway-and-aws-lambda#team-model-api) subsection and returns `isSubscriptionActive` to the `cancelSubscriptionApiMethod` API method at the browser:

```
router.post('/cancel-subscription', async (req: any, res, next) => {
  const { teamId } = req.body;

  try {
    const { isSubscriptionActive } = await Team.cancelSubscription({
      teamLeaderId: req.user.id,
      teamId,
    });

    res.json({ isSubscriptionActive });
  } catch (err) {
    next(err);
  }
});
```

When a Team Leader wants to see a list of recurring payments made to date, the Team Leader clicks on the `Show payment history` button on the `Billing` page. Our application triggers the `getListOfInvoicesApiMethod` API method that sends a request to the Express route `get-list-of-invoices-for-customer`. Inside this Express route, we call `User.getListOfInvoicesForCustomer`, which we defined in the [User Model - API](https://builderbook.org/books/saas-boilerplate/stripe-api-api-project-stripe-api-app-project-setup-at-stripe-dashboard-and-environmental-variables-email-notification-for-new-post-api-api-project-amazon-api-gateway-and-aws-lambda#user-model-api) subsection. The handler function of this Express route receives an array of invoices and sends it back to the browser, to the `getListOfInvoicesApiMethod` API method:

```
router.get('/get-list-of-invoices-for-customer', async (req: any, res, next) => {
  try {
    const { stripeListOfInvoices } = await User.getListOfInvoicesForCustomer({
      userId: req.user.id,
    });
    res.json({ stripeListOfInvoices });
  } catch (err) {
    next(err);
  }
});
```

Remember to add the above three new Express routes at the end of the `book/9-begin/api/server/api/team-leader.ts` file. Remember to import `createSession` to `book/9-begin/api/server/api/team-leader.ts` like this:

```
import * as express from 'express';

import Invitation from '../models/Invitation';
import Team from '../models/Team';
import User from '../models/User';
import { createSession } from '../stripe';
```

We are done with the `API` part of our Stripe API infrastructure!

Discussion session API infrastructure mount middleware team members in this book Put it all together discussion compiles S3 bucket request was sent list of posts Team Leader redirect to checkout. Team Leader send this response mount middleware withAuth HOC AWS dashboard withAuth HOC subsection this chapter server-side rendering Material-UI session store method calls production-ready open this file At AWS dashboard. Send this response in this book request was sent Click on the button this chapter request was sent team members Put it all together mount middleware new Express route. Mount middleware decorate method with action data model redirect to checkout Put it all together MongoDB database Team Leader subsection. Team Leader server-side rendering team members At AWS dashboard it works as expected. Discussion withAuth HOC We will discuss mount middleware store method calls if truthy then open this file open this file in a browser At AWS dashboard At AWS dashboard if truthy then. Request check if value is truthy Material-UI send this response Navigate to conditional operator request was sent session. Data model in production AWS dashboard request was sent on the client discussion cookie request was sent session MongoDB database this chapter. Session new Express route in a browser in this book production-ready request. Navigate to add environmental variable email and name data model add environmental variable data model subsection page component request team members subsection in production store method calls.

___

## Stripe API - APP project [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#stripe-api-app-project)

In our `API` project, we've built Stripe methods, built an Express route for webhook, built an Express route for Checkout callback, and mounted these two Express routes on our Express server. We also updated our `Team` and `User` models with all necessary fields/properties and static methods. Finally, we added three new Express routes - each corresponds to a button click by a Team Leader on the `Billing` page.

What will we do in this section? We will build part of our Stripe API infrastructure located in the `APP` project. We need to:

-   Add three new API methods that correspond to three new Express routes located at `book/9-begin/api/server/api/team-leader.ts`.
-   Update `Team` and `User` data stores.
-   Build a brand new `Billing` page.
-   Update the `TeamSettings` page so that a non-paying Team Leader cannot add a third team member to their team.

#### Team Leader API methods - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#team-leader-api-methods-app)

This subsection has a relatively easy task. We already discussed the relationship between a Team Leader's clicks on different buttons of the `Billing` page, API methods, and Express routes. Here, we simply define three new API methods that we discussed earlier. The first two send requests with the `POST` method and attach necessary data to a request's body. The last one sends a request with the `GET` method and sends no additional data to the `API` server, since we can always access `req.user.id` on our `API` server to identify a current user. Open your `book/9-begin/app/lib/api/team-leader.ts` file and add new API methods at the end of it:

```
export const fetchCheckoutSessionApiMethod = ({ mode, teamId }: { mode: string; teamId: string }) =>
  sendRequestAndGetResponse(`${BASE_PATH}/stripe/fetch-checkout-session`, {
    body: JSON.stringify({ mode, teamId }),
  });

export const cancelSubscriptionApiMethod = ({ teamId }: { teamId: string }) =>
  sendRequestAndGetResponse(`${BASE_PATH}/cancel-subscription`, {
    body: JSON.stringify({ teamId }),
  });

export const getListOfInvoicesApiMethod = () =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-list-of-invoices-for-customer`, {
    method: 'GET',
  });
```

___

#### Team data store - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#team-data-store-app)

We are done with API methods. As usual, our next task is to update data stores. For the `Team` data store, we need to add three new properties that will have the same values and names as the `Team` MongoDB document's fields: `stripeSubscription`, `isSubscriptionActive`, and `isPaymentFailed`. Open `book/9-begin/app/lib/store/team.ts` and add these three new properties like so:

```
public isLoadingDiscussions = false;

public stripeSubscription: {
  id: string;
  object: string;
  application_fee_percent: number;
  billing: string;
  cancel_at_period_end: boolean;
  billing_cycle_anchor: number;
  canceled_at: number;
  created: number;
};
public isSubscriptionActive: boolean;
public isPaymentFailed: boolean;
```

Assign initial values to these three new properties inside the `constructor` method like this:

```
this.currentDiscussionSlug = params.currentDiscussionSlug || null;

this.stripeSubscription = params.stripeSubscription;
this.isSubscriptionActive = params.isSubscriptionActive;
this.isPaymentFailed = params.isPaymentFailed;

this.store = params.store;
```

All of the above three properties of the `Team` data store will be used on the `Billing` page.

We need to define only one new store method, `checkIfTeamLeaderMustBeCustomer`. We will use it like `currentTeam.checkIfTeamLeaderMustBeCustomer()` inside the `TeamSettings` page to check if a Team Leader can add a new team member to team. `checkIfTeamLeaderMustBeCustomer` uses the value for the current number of team members and value for `isSubscriptionActive` to decide if a Team Leader can add a new team member:

```
public async checkIfTeamLeaderMustBeCustomer() {
  let ifTeamLeaderMustBeCustomerOnClient: boolean;

  if (this && this.memberIds.length < 2) {
    ifTeamLeaderMustBeCustomerOnClient = false;
  } else if (this && this.memberIds.length >= 2 && this.isSubscriptionActive) {
    ifTeamLeaderMustBeCustomerOnClient = false;
  } else if (this && this.memberIds.length >= 2 && !this.isSubscriptionActive) {
    ifTeamLeaderMustBeCustomerOnClient = true;
  }

  return ifTeamLeaderMustBeCustomerOnClient;
}

get orderedDiscussions() {
  return this.discussions.slice().sort();
}
```

Since `checkIfTeamLeaderMustBeCustomer` does not change observable data, we don't decorate it with the `action` decorator.

___

#### User data store - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#user-data-store-app)

We plan to use `stripeCard`, `hasCardInformation`, and `stripeListOfInvoices` of our `User` data store on the `Billing` page. There is no use for the `stripeCustomer` property. So new properties of the `User` data store will match all new fields of the `User` document, except `stripeCustomer`. Open `book/9-begin/app/lib/store/user.ts` and add three new properties in this location:

```
public defaultTeamSlug: string;

public stripeCard: {
  brand: string;
  funding: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};
public hasCardInformation: boolean;
public stripeListOfInvoices: {
  object: string;
  data: [
    {
      amount_paid: number;
      teamName: string;
      created: number;
      hosted_invoice_url: string;
    },
  ];
  has_more: boolean;
};
```

Inside the `constructor` method, assign initial values at this location:

```
this.defaultTeamSlug = params.defaultTeamSlug;

this.stripeCard = params.stripeCard;
this.hasCardInformation = params.hasCardInformation;
this.stripeListOfInvoices = params.stripeListOfInvoices;
```

On the `Billing` page, we plan to call one store method from the `User` data store - `currentUser.getListOfInvoices()`. This store method calls the API method `getListOfInvoicesApiMethod` to get an array of invoices and updates local data with it:

```
public async getListOfInvoices() {
  try {
    const { stripeListOfInvoices } = await getListOfInvoicesApiMethod();
    runInAction(() => {
      this.stripeListOfInvoices = stripeListOfInvoices;
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

Remember to decorate three new properties with `observable`:

```
defaultTeamSlug: observable,
stripeCard: observable,
stripeListOfInvoices: observable,
```

Please also decorate `getListOfInvoices` with `action` at the end of the `decorate` section of `book/9-begin/app/lib/store/user.ts`.

___

#### Billing page and testing - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#billing-page-and-testing-app)

We want `Billing` to look like this before a Team Leader becomes a paying customer:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-21-45.png)

And look like this after a Team Leader becomes a paying customer:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+10-34-57.png)

As you can see, after a Team Leader buys a subscription, the UI changes a lot. The Team Leader sees a status message and new button `Unsubscribe Team`. The Team Leader also sees partial card information and a new button, `Update Card`. Clicking on `Show Payment History` shows one paid invoice instead of the notification message `You are not a customer and you have no payment history.`.

Important note on SEO - since the `Billing` page is only for logged-in users, the values for name and content do not matter much. You may even choose to not provide the meta tag at all. It makes little sense to index the `Billing` page - most users who would see this page on search results will be redirected to the `Login` page or see an error, since the URL will contain a team's slug. In Chapter 10, we will add instructions to `robots.txt` so that the `Billing` page is not indexed by search engine bots. Also, we will not include this page's route in our `sitemap.xml` file.

The same is true for `TeamSettings`, `YourSettings`, and `DiscussionPageComp` pages, so go ahead and remove the following meta tag from these pages:

```
<meta name="some name" content="some content" />
```

Our below implementation of the `Billing` page won't have this meta tag. Since we are building the `Billing` page from scratch, let's employ our blueprint for pages, minus the meta tag:

```
// imports

// type Props = ...

// type State = ...

class Billing extends React.Component<Props, State> {
  // public static async getInitialProps

  // constructor(props)

  public render() {
    // access some values from props or state

    return (
      <Layout {...this.props}>
        <Head>
          <title>Billing</title>
        </Head>
        // interface code for page
      </Layout>
    );
  }

  // page's public methods

  // page's private methods
}

export default SomeHOCs(Billing);
```

Let's implement every part:

-   **imports**. In this section we import all of the usual suspects, such as `Layout` and `notify`. In addition, we need to import `loadStripe` from `@stripe/stripe-js` and `fetchCheckoutSessionApiMethod` from `book/9-begin/app/lib/api/team-leader.ts`:
    
    ```
      import { observer } from 'mobx-react';
      import moment from 'moment';
      import Head from 'next/head';
      import * as React from 'react';
      import { loadStripe } from '@stripe/stripe-js';
      import Button from '@material-ui/core/Button';
      import NProgress from 'nprogress';
    
      import Layout from '../components/layout';
      import notify from '../lib/notify';
      import { Store } from '../lib/store';
      import withAuth from '../lib/withAuth';
      import { fetchCheckoutSessionApiMethod } from '../lib/api/team-leader';
    ```
    
    The `@stripe/stripe-js` package prescribes creating a Stripe instance like this:
    
    [https://github.com/stripe/stripe-js#loadstripe](https://github.com/stripe/stripe-js#loadstripe)
    
    Code from the above link:
    
    ```
      import {loadStripe} from '@stripe/stripe-js';
    
      const stripe = await loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
    ```
    
    We will use it like this:
    
    ```
      const dev = process.env.NODE_ENV && process.env.NODE_ENV !== 'production';
    
      const stripePromise = loadStripe(
        dev ? process.env.NEXT_PUBLC_STRIPE_TEST_PUBLISHABLEKEY : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY,
      );
    ```
    
    Later, inside the page's method `handleCheckoutClick`, we will define a `stripe` instance as `await stripePromise`.
    
-   **type Props = ...**. Since we used `redirectMessage` as a query inside `cancel_url` and redirect URL inside the Express route `/stripe/checkout-completed/:sessionId`, we have to add `redirectMessage` to `Props` to use it inside the the `Billing` page:
    
    ```
      type Props = {
        store: Store;
        isMobile: boolean;
        teamSlug: string;
        redirectMessage?: string;
      };
    ```
    
-   **type State = ...**. We previously used the `disabled` property of the `state` object to prevent accidental double clicking on a button. Double clicking is especially important to prevent for payment-related clicks. We will use `showInvoices` to control visibility of the list of paid invoices.
    
    ```
      type State = { disabled: boolean; showInvoices: boolean };
    ```
    
-   **constructor(props)**. Here we simply assign initial values to proeprties of the `state` object. It's worth noting that our application does not show a list of paid invoices by default - it requires a Team Leader to click the button to see the list. We chose this UX, but you may choose not to use it in your own SaaS application:
    
    ```
      constructor(props) {
        super(props);
    
        this.state = { disabled: false, showInvoices: false };
      }
    ```
    
-   **access some values from props or state**. In this section, we want define `isTeamLeader` and perform two checks. The first check is whether `currentTeam` is truthy. The second check is whether `isTeamLeader` is truthy. If not, we need to show an informative UI to end users, so they know what went wrong. We don't need to reinvent code here - we simply borrow it from `book/9-begin/app/pages/team-settings.tsx`:
    
    ```
      const { store, isMobile } = this.props;
      const { currentTeam, currentUser } = store;
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
    
-   **interface code for page**. The UI for the `Billing` page is straightforward to code. Since you already built `YourSettings` and `TeamSettings` pages successfully, we will not go into detail on the implementation here. We display some data, plus a few buttons.
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-21-45.png)
    
    The most interesting part of this UI code is its conditionality. We show different UIs to subscribed and non-subscribed Team Leaders. We show different UIs to Team Leaders with and without a saved payment method. Finally, we show conditional UI for when a list of paid invoices is empty or not. We will discuss these conditions when we define the page's private methods. For now, we simply use three private methods, each returning UI code for a corresponding section of the `Billing` page:
    
    ```
      <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
        <h3>Your Billing</h3>
        <p />
        <h4 style={{ marginTop: '40px' }}>Paid plan</h4>
        {this.renderSubscriptionButton()}
        <p />
        <br />
        <h4>Card information</h4>
        {this.renderCardInfo()}
        <p />
        <br />
        <h4>Payment history</h4>
        <Button variant="outlined" color="primary" onClick={this.showListOfInvoicesOnClick}>
          Show payment history
        </Button>
        {this.renderInvoices()}
        <p />
        <br />
      </div>
    ```
    
-   **page's public methods**. Since we pass a message using `redirectMessage` query and two redirects - `${process.env.URL_APP}/team/${teamSlug}/billing?redirectMessage=Checkout%20canceled` and `${process.env.URL_APP}/team/${team.slug}/billing?redirectMessage=${err.message || err.toString()}` - then we need to display it. `App.getInitialProps` populates the `redirectMessage` prop of all pages, so we need to check if it is truthy and then show an informational message to an end user with `notify`:
    
    ```
      public async componentDidMount() {
        if (this.props.redirectMessage) {
          notify(this.props.redirectMessage);
        }
      }
    ```
    
-   **page's private methods**. Look at the UI code of `Billing` page. You see that we need to define three page methods that return UI code:
    
    -   `renderSubscriptionButton`
        
    -   `renderCardInfo`
        
    -   `renderInvoices`
        
        Plus one method that gets called upon clicking the `Show payment history` button, `showListOfInvoicesOnClick`.
        
        `renderSubscriptionButton` displays three UIs conditionally, based on the values of `currentTeam.isSubscriptionActive` and `currentTeam.isPaymentFailed`.
        
        When `currentTeam.isSubscriptionActive` is `false` and `currentTeam.isPaymentFailed` is `true`, our application tells a Team Leader that they are not paying a customer and that their subscription was cancelled automatically due to a failed payment.
        
        When `currentTeam.isSubscriptionActive` is `false` and `currentTeam.isPaymentFailed` is `false`, a Team Leader has no active subscription but not because of a failed payment. It could be that the Team Leader never bought a subscription or manually cancelled a subscription in the past.
        
        Otherwise, our application will show a Team Leader that they are a paying customer, how much that Team Leader will be charged, and on what date they will be charged:
        
        ```
        private renderSubscriptionButton() {
        const { currentTeam } = this.props.store;
        
        let subscriptionDate;
        let billingDay;
        if (currentTeam && currentTeam.stripeSubscription) {
          subscriptionDate = moment(currentTeam.stripeSubscription.billing_cycle_anchor * 1000).format(
            'MMM Do YYYY',
          );
          billingDay = moment(currentTeam.stripeSubscription.billing_cycle_anchor * 1000).format('Do');
        }
        
        if (currentTeam && !currentTeam.isSubscriptionActive && currentTeam.isPaymentFailed) {
          return (
            <>
              <p>You are not a paying customer.</p>
              <Button
                variant="contained"
                color="primary"
                onClick={() => this.handleCheckoutClick('subscription')}
                disabled={this.state.disabled}
              >
                Buy subscription
              </Button>
              <p />
              <p>
                Team was automatically unsubscribed due to failed payment. You will be prompt to update
                card information if you choose to re-subscribe Team.
              </p>
            </>
          );
        } else if (currentTeam && !currentTeam.isSubscriptionActive && !currentTeam.isPaymentFailed) {
          return (
            <React.Fragment>
              <p>You are not a paying customer.</p>
              <p>
                Buy subscription using your current card, see below section for current card
                information.
              </p>
              <Button
                variant="contained"
                color="primary"
                onClick={() => this.handleCheckoutClick('subscription')}
                disabled={this.state.disabled}
              >
                Buy subscription
              </Button>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment>
              <span>
                {' '}
                <i className="material-icons" color="action" style={{ verticalAlign: 'text-bottom' }}>
                  done
                </i>{' '}
                Subscription is active.
                <p>
                  You subscribed <b>{currentTeam.name}</b> on <b>{subscriptionDate}</b>.
                </p>
                <p>
                  You will be billed $50 on <b>{billingDay} day</b> of each month unless you cancel
                  subscription or subscription is cancelled automatically due to failed payment.
                </p>
              </span>
              <p />
              <Button variant="outlined" color="primary" onClick={this.cancelSubscriptionOnClick}>
                Unsubscribe Team
              </Button>
              <br />
            </React.Fragment>
          );
        }
        }
        ```
        
        As you can see from the above code, we need to define `handleCheckoutClick` (click on the `Buy subscription` button) and `cancelSubscriptionOnClick` (click on the `Unsubscribe Team` button).
        
        Inside `handleCheckoutClick`, as per the Stripe docs, we call the API method `fetchCheckoutSessionApiMethod` to send a request to the server and create a Session object on the server. If successful, `fetchCheckoutSessionApiMethod` returns a Session object's id. We then call `stripePromise.redirectToCheckout({ sessionId })`, which will either show an error or redirect a Team Leader to the Checkout page (hosted by Stripe).
        
        ```
        private handleCheckoutClick = async (mode: 'subscription' | 'setup') => {
        try {
          const { currentTeam } = this.props.store;
        
          NProgress.start();
          this.setState({ disabled: true });
        
          const { sessionId } = await fetchCheckoutSessionApiMethod({ mode, teamId: currentTeam._id });
        
          // When the customer clicks on the button, redirect them to Checkout.
          const stripe = await stripePromise;
          const { error } = await stripe.redirectToCheckout({ sessionId });
        
          if (error) {
            notify(error);
            console.error(error);
          }
        } catch (err) {
          notify(err);
          console.error(err);
        }
        };
        ```
        
        Inside `cancelSubscriptionOnClick`, we simply call the store method `cancelSubscription`, which will in turn call the corresponding API method, Express route, static method for `Team` Model, and finally Stripe method that will use the corresponding Stripe API method:
        
        ```
        private cancelSubscriptionOnClick = async () => {
        const { currentTeam } = this.props.store;
        
        NProgress.start();
        this.setState({ disabled: true });
        
        try {
          await currentTeam.cancelSubscription({ teamId: currentTeam._id });
          notify('Success!');
        } catch (err) {
          notify(err);
        } finally {
          this.setState({ disabled: false });
          NProgress.done();
        }
        };
        ```
        
        The second method that returns UI code and that we need to define is `renderCardInfo`. Here, we check if the `currentUser && currentUser.hasCardInformation` condition is truthy. If so, our application displays a card's information (truncated, of course). If falsy, our application shows the text `You have not added a card.`:
        
        ```
        private renderCardInfo() {
        const { currentUser } = this.props.store;
        
        if (currentUser && currentUser.hasCardInformation) {
          return (
            <span>
              {' '}
              <i className="material-icons" color="action" style={{ verticalAlign: 'text-bottom' }}>
                done
              </i>{' '}
              Your default payment method:
              <li>
                {currentUser.stripeCard.brand}, {currentUser.stripeCard.funding} card
              </li>
              <li>Last 4 digits: *{currentUser.stripeCard.last4}</li>
              <li>
                Expiration: {currentUser.stripeCard.exp_month}/{currentUser.stripeCard.exp_year}
              </li>
              <p />
              <Button
                variant="outlined"
                color="primary"
                onClick={() => this.handleCheckoutClick('setup')}
              >
                Update card
              </Button>
            </span>
          );
        } else {
          return 'You have not added a card.';
        }
        }
        ```
        
        The last page method that returns UI code and that we need to define is `renderInvoices`. `renderInvoices` is very similar in structure to `renderCardInfo`. Instead of `currentUser && currentUser.hasCardInformation`, the condition is `currentUser && currentUser.stripeListOfInvoices`. Instead of card information, the data is a list of paid invoices. Instead of `You have not added a card.`, the text is `'You have no history of payments.'`:
        
        ```
        private renderInvoices() {
        const { currentUser } = this.props.store;
        const { showInvoices } = this.state;
        
        if (!showInvoices) {
          return null;
        }
        
        if (currentUser && currentUser.stripeListOfInvoices) {
          return (
            <React.Fragment>
              {currentUser.stripeListOfInvoices.data.map((invoice, i) => (
                <React.Fragment key={i}>
                  <p>Your history of payments:</p>
                  <li>
                    ${invoice.amount_paid / 100} was paid on{' '}
                    {moment(invoice.created * 1000).format('MMM Do YYYY')} for Team '{invoice.teamName}'
                    -{' '}
                    <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                      See invoice
                    </a>
                  </li>
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        } else {
          return 'You have no history of payments.';
        }
        }
        ```
        
        Finally, `showListOfInvoicesOnClick` calls the store method `currentUser.getListOfInvoices`, which will in turn call the corresponding API method, Express route, static method for the `User` Model, and finally Stripe method that will use the corresponding Stripe API method. If all is successful, `currentUser.stripeListOfInvoices` gets populated with an array of invoice objects:
        
        ```
        private showListOfInvoicesOnClick = async () => {
        const { currentUser } = this.props.store;
        NProgress.start();
        this.setState({ disabled: true });
        try {
          await currentUser.getListOfInvoices();
          this.setState({ showInvoices: true });
        } catch (err) {
          notify(err);
        } finally {
          this.setState({ disabled: false });
          NProgress.done();
        }
        };
        ```
        

Create a new file, `book/9-begin/app/pages/billing.tsx`, with the above content:

```
import { observer } from 'mobx-react';
import moment from 'moment';
import Head from 'next/head';
import * as React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Button from '@material-ui/core/Button';
import NProgress from 'nprogress';

import Layout from '../components/layout';
import notify from '../lib/notify';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';
import { fetchCheckoutSessionApiMethod } from '../lib/api/team-leader';

const dev = process.env.NODE_ENV && process.env.NODE_ENV !== 'production';

const stripePromise = loadStripe(
  dev ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY,
);

type Props = {
  store: Store;
  isMobile: boolean;
  teamSlug: string;
  redirectMessage?: string;
};

type State = { disabled: boolean; showInvoices: boolean };

class Billing extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = { disabled: false, showInvoices: false };
  }

  public render() {
    const { store, isMobile } = this.props;
    const { currentTeam, currentUser } = store;
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
          <title>Your Billing</title>
        </Head>
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <h3>Your Billing</h3>
          <p />
          <h4 style={{ marginTop: '40px' }}>Paid plan</h4>
          {this.renderSubscriptionButton()}
          <p />
          <br />
          <h4>Card information</h4>
          {this.renderCardInfo()}
          <p />
          <br />
          <h4>Payment history</h4>
          <Button
            variant="outlined"
            color="primary"
            onClick={this.showListOfInvoicesOnClick}
            disabled={this.state.disabled}
          >
            Show payment history
          </Button>
          {this.renderInvoices()}
          <p />
          <br />
        </div>
      </Layout>
    );
  }

  public async componentDidMount() {
    if (this.props.redirectMessage) {
      notify(this.props.redirectMessage);
    }
  }

  private renderSubscriptionButton() {
    const { currentTeam } = this.props.store;

    let subscriptionDate;
    let billingDay;
    if (currentTeam && currentTeam.stripeSubscription) {
      subscriptionDate = moment(currentTeam.stripeSubscription.billing_cycle_anchor * 1000).format(
        'MMM Do YYYY',
      );
      billingDay = moment(currentTeam.stripeSubscription.billing_cycle_anchor * 1000).format('Do');
    }

    if (currentTeam && !currentTeam.isSubscriptionActive && currentTeam.isPaymentFailed) {
      return (
        <>
          <p>You are not a paying customer.</p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.handleCheckoutClick('subscription')}
            disabled={this.state.disabled}
          >
            Buy subscription
          </Button>
          <p />
          <p>
            Team was automatically unsubscribed due to failed payment. You will be prompt to update
            card information if you choose to re-subscribe Team.
          </p>
        </>
      );
    } else if (currentTeam && !currentTeam.isSubscriptionActive && !currentTeam.isPaymentFailed) {
      return (
        <React.Fragment>
          <p>You are not a paying customer.</p>
          <p>
            Buy subscription using your current card, see below section for current card
            information.
          </p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.handleCheckoutClick('subscription')}
            disabled={this.state.disabled}
          >
            Buy subscription
          </Button>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <span>
            {' '}
            <i className="material-icons" color="action" style={{ verticalAlign: 'text-bottom' }}>
              done
            </i>{' '}
            Subscription is active.
            <p>
              You subscribed <b>{currentTeam.name}</b> on <b>{subscriptionDate}</b>.
            </p>
            <p>
              You will be billed $50 on <b>{billingDay} day</b> of each month unless you cancel
              subscription or subscription is cancelled automatically due to failed payment.
            </p>
          </span>
          <p />
          <Button variant="outlined" color="primary" onClick={this.cancelSubscriptionOnClick}>
            Unsubscribe Team
          </Button>
          <br />
        </React.Fragment>
      );
    }
  }

  private handleCheckoutClick = async (mode: 'subscription' | 'setup') => {
    try {
      const { currentTeam } = this.props.store;
      const { sessionId } = await fetchCheckoutSessionApiMethod({ mode, teamId: currentTeam._id });

      // When the customer clicks on the button, redirect them to Checkout.
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        notify(error);
        console.error(error);
      }
    } catch (err) {
      notify(err);
      console.error(err);
    }
  };

  private cancelSubscriptionOnClick = async () => {
    const { currentTeam } = this.props.store;

    NProgress.start();
    this.setState({ disabled: true });

    try {
      await currentTeam.cancelSubscription({ teamId: currentTeam._id });
      notify('Success!');
    } catch (err) {
      notify(err);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };

  private renderCardInfo() {
    const { currentUser } = this.props.store;

    if (currentUser && currentUser.hasCardInformation) {
      return (
        <span>
          {' '}
          <i className="material-icons" color="action" style={{ verticalAlign: 'text-bottom' }}>
            done
          </i>{' '}
          Your default payment method:
          <li>
            {currentUser.stripeCard.brand}, {currentUser.stripeCard.funding} card
          </li>
          <li>Last 4 digits: *{currentUser.stripeCard.last4}</li>
          <li>
            Expiration: {currentUser.stripeCard.exp_month}/{currentUser.stripeCard.exp_year}
          </li>
          <p />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => this.handleCheckoutClick('setup')}
          >
            Update card
          </Button>
        </span>
      );
    } else {
      return 'You have not added a card.';
    }
  }

  private renderInvoices() {
    const { currentUser } = this.props.store;
    const { showInvoices } = this.state;

    if (!showInvoices) {
      return null;
    }

    if (currentUser && currentUser.stripeCard) {
      return (
        <React.Fragment>
          {currentUser.stripeListOfInvoices.data.map((invoice, i) => (
            <React.Fragment key={i}>
              <p>Your history of payments:</p>
              <li>
                ${invoice.amount_paid / 100} was paid on{' '}
                {moment(invoice.created * 1000).format('MMM Do YYYY')} for Team '{invoice.teamName}'
                -{' '}
                <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                  See invoice
                </a>
              </li>
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    } else {
      return 'You have no history of payments.';
    }
  }

  private showListOfInvoicesOnClick = async () => {
    const { currentUser } = this.props.store;
    NProgress.start();
    this.setState({ disabled: true });
    try {
      await currentUser.getListOfInvoices();
      this.setState({ showInvoices: true });
    } catch (err) {
      notify(err);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
    }
  };
}

export default withAuth(observer(Billing));
```

As you can see, for the `Billing` page component, we made most of the page methods `private`. As we mentioned in Chapter 4, we suggest following the principle of least privilege and using `private` whenever possible. In some other pages and components of our application, you can swap `public` for `private` with no loss in functionality. But do watch out for the following cases, where you have to use `public`:

-   `render` and life cycle methods
-   `getInitialProps`
-   store methods decorated as actions

List of posts API method calls corresponding store method cookie request was sent MongoDB database request. Show notification conditional operator triggers method cookie email and name check if value is truthy list of posts subsection API method calls corresponding store method in a browser Put it all together. Team members Put it all together show notification Next.js web application page component HTTP in production in production decorate method with action static method calls API infrastructure We will discuss. End user API method calls corresponding store method Team Leader it works as expected in this book HTTP show notification Click on the button Put it all together Material-UI in this book on server only. Page component Team Leader server-side rendering Click on the button conditional operator session new Express route request on the client mount middleware on server only in production Remember to add import. Data model static method calls Team Leader HTTP static method calls list of posts HTTP on the client. Send this response open this file Click on the button this chapter Remember to add import redirect to checkout server-side rendering this chapter team members end user HTTP in a browser production-ready production-ready You already learned. Click on the button Put it all together team members S3 bucket in a browser this chapter response mount middleware cookie cookie. We will discuss in a browser response in production page component check if value is truthy. Store method calls API method calls corresponding store method request was sent At AWS dashboard request Click on the button email and name session list of posts on the client open this file email and name Put it all together S3 bucket production-ready.

One more thing before we can move on to the next subsection - since end users access the `Billing` page at the route `/team/:teamSlug/billing` instead of `/billing`, add the corresponding Express route to `book/9-begin/app/server/server.ts` at this location:

```
server.get('/team/:teamSlug/discussions', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/discussion', { teamSlug });
});

server.get('/team/:teamSlug/billing', (req, res) => {
  const { teamSlug } = req.params;
  app.render(req, res, '/billing', { teamSlug, ...(req.query || {}) });
});

server.all('*', (req, res) => {
  handle(req, res);
});
```

___

#### TeamSettings page and testing - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#teamsettings-page-and-testing-app)

When a Team Leader is not a paying customer and attempts to add a third team member to the team, we want to inform the Team Leader:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-27-12.png)

We already wrote the store method `currentTeam.checkIfTeamLeaderMustBeCustomer`, which takes the number of team members and value of `isSubscriptionActive` and outputs `ifTeamLeaderMustBeCustomer` - a verdict on whether a Team Leader can or cannot add additional team members. We just need to use this store method inside the `TeamSettings` page. Open `book/9-begin/app/pages/team-settings.tsx` and find the page method `openInviteMember`

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

Update it to become:

```
private openInviteMember = async () => {
  const { currentTeam } = this.props.store;
  if (!currentTeam) {
    notify('You have not selected a Team.');
    return;
  }

  const ifTeamLeaderMustBeCustomer = await currentTeam.checkIfTeamLeaderMustBeCustomer();

  if (ifTeamLeaderMustBeCustomer) {
    notify(
      'To add a third team member, you have to become a paid customer.' +
        '<p />' +
        ' To become a paid customer,' +
        ' navigate to Billing page.',
    );
    return;
  }

  this.setState({ inviteMemberOpen: true });
};
```

Done!

We are done with the `APP` part of our Stripe API infrastructure.

___

## Setup at Stripe dashboard and environmental variables [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#setup-at-stripe-dashboard-and-environmental-variables)

Alrighty! We have implemented the `API` part and `APP` part of our Stripe API infrastructure. Are we ready to test it? Not yet, because we still need to get values for multiple environmental variables from Stripe's dashboard. We need paste these values to both `book/9-begin/app/.env` and `book/9-begin/api/.env` files.

Let's make a list of all environmental variables we used while building out our Stripe API infrastructure.

In our `APP` project (used in `book/9-begin/app/pages/billing.tsx`):

-   `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY` and `NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY`

In our `API` project (all used in `book/9-begin/api/server/stripe.ts`):

-   `STRIPE_TEST_SECRETKEY` and `STRIPE_LIVE_SECRETKEY`
-   `STRIPE_TEST_PRICEID` and `STRIPE_LIVE_PRICEID`
-   `STRIPE_TEST_ENDPOINTSECRET` and `STRIPE_LIVE_ENDPOINTSECRET`

It's important to note that publishable key is not a secret key and it can be used on the browser or other client. The secret key is indeed secret and should be used on the server only.

Stripe's dashboard has two modes for keys and data - Test and Live. In this chapter, we will test Stripe API infrastructure locally, so we will only use the Test API keys. In the next chapter, Chapter 10, we will deploy our application. Once deployed, our application will use Live API keys. In this subsection, we create both Test and Live API keys.

Go to Stripe's dashboard (create a Stripe account if you don't have one already). Click `Developers > API keys` on the main menu and select Test mode.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+19-13-53.png)

-   Create a Publishable key and save its value to `book/9-begin/app/.env` as `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY`.
    
-   Create a Secret key and save its value to `book/9-begin/api/.env` as `STRIPE_TEST_SECRETKEY`.
    
-   Switch to Live mode. Create a Publishable key and Secret key. Save the former to `book/9-begin/app/.env` as `NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY` and the latter to `book/9-begin/api/.env` as `STRIPE_LIVE_SECRETKEY`.
    
-   Switch back to Test mode and click `Developers > Webhooks` on the main menu. Then click `+ Add endpoint`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+19-39-29.png)
    
-   Fill out the form. For Test mode, use `http://localhost:8000/api/v1/public/stripe-invoice-payment-failed` with API version `2023-10-16` and select the `invoice.payment_failed` event. Click `Add endpoint`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+10-54-14.png)
    
    You will see that Stripe's dashboard does not allow you to create a webhook endpoint for localhost. We can either install Stripe CLI or only test the production webhook after we deploy our application in Chapter 10. We will go with the latter.
    
-   Switch to Live mode. Create a new webhook with the endpoint `https://saas-api.builderbook.org/api/v1/public/stripe-invoice-payment-failed` and API version `2023-10-16`, then select the `invoice.payment_failed` event:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+19-41-43.png)
    
-   Click the newly created endpoint on the list of all endpoints. Then click the `Click to reveal` button in the `Signing secret` section:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+19-51-47.png)
    
    Add the revealed value as `STRIPE_LIVE_ENDPOINTSECRET` to your `book/9-begin/api/.env` file.
    
-   Switch back to Test mode and click on `Products` in the main menu. Then click `+ Add Product`:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+19-29-46.png)
    
-   Fill out the form. Click the `Save product` button:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+20-10-02.png)
    
-   Inside the `Pricing` section of your new product's page, find Price id:
    
    ![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-05+20-12-46.png)
    
    Use this value as `STRIPE_TEST_PRICEID` and add it to the `book/9-begin/api/.env` file.
    
-   Switch to Live mode and repeat all steps to acquire the value for `STRIPE_LIVE_PRICEID` and add it to your `book/9-begin/api/.env` file. Make sure to give your product a real name and logo if you plan to have real customers in your application in production.
    

In the next subsection, we will test Stripe API infrastructure locally.

#### Testing Stripe API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-stripe-api)

Alrighty, we are ready to start testing our Stripe API infrastructure!

Here is an outline for testing:

-   `TeamSettings` page - attempt to add a third team member
-   `Billing` page - buy a subscription, edit a card, check the list of paid invoices
-   `TeamSettings` page - add a third member
-   Stripe dashboard - check data, compare to our database
-   MongoDB database - check data, compare to Stripe's dashboard
-   `Billing` page - cancel a subscription

We will test our webhook in Chapter 10 after deploying our application to Heroku.

Start both `APP` and `API` with `yarn dev`.

Log in with your Team Leader account.

Data model new Express route in this book on server only Navigate to team members open this file static method calls Click on the button data model Team Leader. Production-ready Put it all together subsection Material-UI API infrastructure it works as expected Team Leader. Team members in this book Material-UI in this book Put it all together list of posts list of posts new Express route. Cookie subsection new Express route production-ready new Express route add environmental variable. API method compiles response withAuth HOC mount middleware API infrastructure API method calls corresponding store method it works as expected AWS dashboard Next.js web application production-ready Click on the button on server only. Subsection mount middleware Navigate to Navigate to server-side rendering API method add environmental variable open this file HTTP AWS dashboard on the client Material-UI. Store method calls on the client subsection redirect to checkout cookie check if value is truthy on server only Next.js web application static method calls Team Leader new Express route this chapter Material-UI team members. Remember to add import compiles API method calls corresponding store method request response Google OAuth API new Express route API infrastructure list of posts You already learned discussion API method team members new Express route. Material-UI Team Leader send this response MongoDB database You already learned discussion. Compiles it works as expected server-side rendering triggers method Team Leader At AWS dashboard request At AWS dashboard S3 bucket mount middleware API infrastructure on the client email and name list of posts.

Navigate to the `/team/1/team-settings` page. Click the `Invite member` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+07-59-59.png)

You won't be able to see the `InviteMember` component to add new team member. Instead, you will see a message by `notify` that suggests you need to become a paying customer at the `Billing` page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+08-03-05.png)

Go to `/team/1/billing` and check that all conditional UI is as it should be for a non-paying customer. Click `Show payment history` to see the text `You have no history of payments.`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+08-15-41.png)

Next, let's test buying a subscription!

Click on the `Buy subscription` button. You will be redirected to a Checkout page hosted by Stripe (`https://checkout.stripe.com/*`):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+08-27-57.png)

You can use the test card number `4242 4242 4242 4242` with any CVC code and any future date ([https://stripe.com/docs/testing](https://stripe.com/docs/testing)), then click the `Subscribe` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+08-36-01.png)

After clicking the `Subscribe` button, you will be redirected back to the `Billing` page that will have an updated UI:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+08-59-34.png)

Check that the payment information matches the one you entered on the Checkout page. Click on the `Update card` button. You will be redirected to the Checkout page again, but this time only to update your payment method:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+09-49-20.png)

Enter info for another test card - `4000 0566 5566 5556`, any CVC, any future date. Click the `Save card` button. You will be redirected back to the `Billing` page, and you will see updated card information:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+09-55-05.png)

Make sure that the updated card information is indeed what you entered at the Checkout page.

Next, let's test fetching a list of invoices. Click the `Show payment history` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+09-39-56.png)

Click the `See invoice` link, and you will redirect to `https://pay.stripe.com/invoice/*`, which has detailed information for an invoice:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+09-40-42.png)

Note that the status is paid. Also note the business name and product name.

Your Team Leader user is a paying customer now. Go to the `TeamSettings` page (`/team/1/team-settings`) and click the `Invite member` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+10-13-12.png)

You are able to add an additional team member as expected!

The last feature to test is clicking the `Unsubscribe Team` button at the `Billing` page:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+10-28-57.png)

You will see updated UI on the `Billing` page to indicate that your subscription was cancelled:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+10-37-32.png)

Go to the `TeamSettings` page and attempt to add new member to your team. You won't be able to add new member, since you cancelled your subscription:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+10-37-50.png)

All features that we tested so far do work as we designed them!

The next step is to check up data in our Stripe dashboard and MongoDB database - to make sure that this data indeed matches.

Go to your Stripe dashboard and click `Customers` in the main menu:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+09-59-38.png)

Click on the new customer in the list of customers. You can see, among other data, payment methods (cards) and Price id:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+10-04-34.png)

Note the Customer's id. The Price's id matches the one we added to `book/9-begin/api/.env` as `STRIPE_TEST_PRICEID`, and both cards are the ones we added earlier.

Scroll down a bit, and you will see data related to Subscription (Product) and Invoice:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+10-05-43.png)

If you click on the `SaaS test` Subscription, you can find the subscription's id.

Navigate to your MongoDB Atlas dashboard. Click on the `test.users` collection and find the MongoDB document that corresponds to your Team Leader. Click on the `stripeCard`, `stripeCustomer`, and `stripeListOfInvoices` fields to see nested data:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-06+10-17-42.png)

Find values for the Customer id, Subscription id, ad Invoice id - they should match values you found in your Stripe dashboard.

We are now officially done implementing our Stripe API infrastructure in our SaaS boilerplate!

___

## Email notification for new post API - API project [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#email-notification-for-new-post-api-api-project)

In this section and the next section of this chapter, we will work on our last API infrastructure in the book. Our application will send an email to all of a discussion's participants, minus the post's creator, about a new post. A post's creator can create a new discussion with a first post in it or can create a post in an already-existing discussion. All of a discussion's participants, minus user who created a post, will receive an email with the post's content and a link to the discussion. We will call this API infrastructure "Email notification for new post API".

Since you've already built many API infrastructures in your SaaS boilerplate - this API infrastructure may not look too challenging. You can create a new static method for the `Discussion` data model, email template inside the `EmailTemplate` data model, Express route, API method, store method, and page or component method. However, we are not going to show you how to build this API infrastructure as an internal API with participation of the `API` server. In fact, we want to keep the `API` server out of this API infrastructure.

We want our `APP` project on the browser to send a request to Amazon API Gateway, which in turn triggers a method hosted on AWS Lambda. That method will call an AWS SES API method to send out an email about a new post to all of a discussion's participants (minus the post's creator).

Why do we need such infrastructure? For the same reason why our application sends uploaded files from our `APP` project browser directly to AWS S3's server without involving `API` - to keep our `API` server less busy. The single-threaded and blocking nature of a Node server is its blessing and curse. You can try to write code and run multiple threads in parallel, but that gets messy very soon. Eventually, you will have to run many nodes in parallel (thus the name, node) as our application gets more requests. You can practice being mindful of API infrastructures that can be easily outsourced so that the `API` server is not invloved at all.

Once you learn how to use the combo of Amazon API Gateway and AWS Lambda, you can theoretically outsource many API infrastructures and keep your `API` server less busy. You, as a developer, decide if some infrastructure should be implemented without the `API` server. For example, uploading files, sending frequent emails, and performing scheduled tasks are good candidates for outsourcing. In our particular case of sending an email for a new post, outsourcing may not be justified if the event itself is infrequent. However, if the event is frequent, it may start blocking the single-threaded `API` server and thus should be implemented as `APP` -> `Amazon Gateway` -> `AWS Lambda` -> `AWS SES`, without involving the `API` server:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Email+notification+for+new+post+API.png)

On our application's UI, we want to give a discussion's creator a choice. A user can create a discussion with two notification types, `default` or `email`. If `default` is selected, there is no email sent, but the discussion appears on other browsers in real time. If `email` is selected, in addition to real time updating, all of a discussion's participants will receive an email for every new post within the discussion (minus each post's creator):

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-58-35.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-58-18.png)

___

#### Discussion and EmailTemplate Models - API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#discussion-and-emailtemplate-models-api)

Although the request that sends an email notification to a the participants of a discussion does not go to the `API` server, we still modify our `Discussion` Model so that its Schema has the property `notificationType`. Once our `Discussion` document has the field `notificationType`, along with the API to update its value, an end user will be able to properly set and update the notification type for a discussion.

Open `book/9-begin/api/server/models/Discussion.ts` and add `notificationType` to Schema in the interface of `DiscussionDocument`:

```
// other properties/fields
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
notificationType: {
  type: String,
  enum: ['default', 'email'],
  required: true,
  default: 'default',
},
```

```
// other properties fields
memberIds: string[];
createdAt: Date;
notificationType: string;
```

Scroll down and find type definitions for the static methods `add` and `edit`. Add `notificationType` to the current arguments and define type:

```
add({
  name,
  userId,
  teamId,
  memberIds,
  notificationType,
}: {
  name: string;
  userId: string;
  teamId: string;
  memberIds: string[];
  notificationType: string;
}): Promise<DiscussionDocument>;

edit({
  userId,
  id,
  name,
  memberIds,
  notificationType,
}: {
  userId: string;
  id: string;
  name: string;
  memberIds: string[];
  notificationType: string;
}): Promise<DiscussionDocument>;
```

Scroll down and find actual definition of the static methods `add` and `edit`. Make sure that `notificationType` is passed as an argument and that it is used as an argument inside the corresponding Mongoose API method. `notificationType` should be used inside `create` and `findOneAndUpdate` Mongoose API methods:

```
public static async add({ name, userId, teamId, memberIds = [], notificationType }) {
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
    notificationType,
  });
}

public static async edit({ userId, id, name, memberIds = [], notificationType }) {
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
      notificationType,
    },
    { runValidators: true, new: true },
  );

  return updatedObj;
}
```

Those are all the changes we needed for our `Discussion` Model!

Next, open `book/9-begin/api/server/models/EmailTemplate.ts` and add a new email template to it:

```
// other templates
{
  name: 'newPost',
  subject: 'New Post was created in Discussion: <%= discussionName %>',
  message: `<p>New Post in Discussion: "<%= discussionName%>" by <%= authorName%></p>
    New Post: "<%= postContent %>"
    <p>---</p>
    <p>View it at <a href="<%= discussionLink %>"><%= discussionLink %></a>.</p>
  `,
},
```

Our the Lambda function `sendEmailForNewPost`, which we will define in the next section, will call the `getEmailTemplate` method defined inside `book/9-begin/api/server/models/EmailTemplate.ts` and replace names of variables (`discussionName`, `authorName`, `postContent`, `discussionLink`) with their respective values.

In this book list of posts MongoDB database conditional operator API method static method calls Remember to add import API infrastructure. List of posts response conditional operator discussion HTTP email and name Google OAuth API response Next.js web application Next.js web application We will discuss show notification triggers method. Remember to add import API method calls corresponding store method At AWS dashboard server-side rendering Put it all together in production triggers method triggers method Put it all together S3 bucket Material-UI Next.js web application. Triggers method production-ready data model server-side rendering store method calls Material-UI this chapter server-side rendering page component session open this file Click on the button. Click on the button You already learned You already learned Click on the button if truthy then redirect to checkout AWS dashboard show notification At AWS dashboard Remember to add import request was sent. You already learned discussion session You already learned Remember to add import AWS dashboard in a browser We will discuss S3 bucket show notification static method calls end user. Response API infrastructure data model server-side rendering end user HTTP in production on the client request was sent data model check if value is truthy withAuth HOC Remember to add import conditional operator Click on the button. Show notification request Google OAuth API open this file show notification discussion API method send this response cookie this chapter end user Material-UI You already learned API method mount middleware. At AWS dashboard AWS dashboard open this file if truthy then mount middleware if truthy then compiles. Compiles S3 bucket check if value is truthy in a browser Put it all together Next.js web application API method API method.

#### Express routes for adding and editing Discussion [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#express-routes-for-adding-and-editing-discussion)

Since we added `notificationType` as an argument in the static methods of our `Discussion` data model, we have to update Express routes so that we indeed extract the value of `notificationType` from a request's body and pass this value as argument to the corresponding static methods. Open `book/9-begin/api/server/api/team-member.ts` and make the following updates to two Express routes:

```
router.post('/discussions/add', async (req: any, res, next) => {
  try {
    const { name, teamId, memberIds = [], socketId, notificationType } = req.body;

    const discussion = await Discussion.add({
      userId: req.user.id,
      name,
      teamId,
      memberIds,
      notificationType,
    });

    discussionAdded({ socketId, discussion });

    res.json({ discussion });
  } catch (err) {
    next(err);
  }
});

router.post('/discussions/edit', async (req: any, res, next) => {
  try {
    const { name, id, memberIds = [], socketId, notificationType } = req.body;

    const updatedDiscussion = await Discussion.edit({
      userId: req.user.id,
      name,
      id,
      memberIds,
      notificationType,
    });

    discussionEdited({ socketId, discussion: updatedDiscussion });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});
```

___

#### sendDataToLambdaApiMethod API method - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#senddatatolambdaapimethod-api-method-app)

We are done with updates to the code in our `API` project. In this and the next few subsections, we will work on code in our `APP` project. First, we will define an API method that sends a request to Amazon API Gateway.

Since sending an email notification is not exclusive to a Team Leader and not public, we will put this new API method together with all other Team Member API methods in `book/9-begin/app/lib/api/team-member.ts`. Open this file and add the `sendDataToLambdaApiMethod` API method at the end of it:

```
export const sendDataToLambdaApiMethod = (data) =>
  sendRequestAndGetResponse(`${process.env.NEXT_PUBLIC_API_GATEWAY_ENDPOINT}/`, {
    externalServer: true,
    body: JSON.stringify(data),
  });
```

Note that we used `externalServer` with a value of `true`. We already sent a request with `externalServer: true` in our SaaS boilerplate. The first time was when we sent a request with an uploaded file to an external server, S3 server, directly from `APP` on the browser. If you still have `book/9-begin/app/lib/api/team-member.ts`open, find this API method:

```
export const uploadFileUsingSignedPutRequestApiMethod = (file, signedRequest, headers = {}) =>
  sendRequestAndGetResponse(signedRequest, {
    externalServer: true,
    method: 'PUT',
    body: file,
    headers,
  });
```

Basically, we use `externalServer: true` whenever we want `APP` to deviate from the default choice of sending a request to the `API` server and instead send a request to an external server. Open `book/9-begin/app/lib/api/sendRequestAndGetResponse.ts` and check how `externalServer` works if you forgot (we did!):

```
const response = await fetch(
  opts.externalServer ? `${path}${qs}` : `${process.env.NEXT_PUBLIC_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);
```

`NEXT_PUBLIC_API_GATEWAY_ENDPOINT` will have a value with format `https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/production`. We will add this value to our AWS dashboard after we create our first API inside Amazon API Gateway's service.

___

#### Discussion data store - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#discussion-data-store-app)

In our application, the normal flow of data is: a page component or non-page component method calls a store method, this store method calls an API method, this API method typically sends a request to our `API` server (but in the current case, the API method sends a request to an external server, Amazon API Gateway's server).

We defined the API method `sendDataToLambdaApiMethod`. Our next step is to define the store method `sendDataToLambda` inside the `Discussion` data store. Open `book/9-begin/app/lib/store/discussion.ts` and add this code at the end of it:

```
public async sendDataToLambda({
  discussionName,
  discussionLink,
  postContent,
  authorName,
  userIds,
}) {
  console.log(discussionName, discussionLink, authorName, postContent, userIds);
  try {
    await sendDataToLambdaApiMethod({
      discussionName,
      discussionLink,
      postContent,
      authorName,
      userIds,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

Since the store method `sendDataToLambda` does not update any observable data, no need to decorate this method with `action`.

___

#### CreateDiscussionForm, EditDiscussionForm and PostForm - APP [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#creatediscussionform-editdiscussionform-and-postform-app)

Here is the UX and UI we want for the element that allows an end user to select the notification type for a discussion:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-58-35.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-02+12-58-18.png)

To implement such element, we use Material-UI's component `Select` and Material-UI's exact example from the `Simple Select` section:

[https://material-ui.com/components/selects/](https://material-ui.com/components/selects/)

[https://material-ui.com/components/selects/#simple-select](https://material-ui.com/components/selects/#simple-select)

```
<FormControl className={classes.formControl}>
  <InputLabel id="demo-simple-select-label">Age</InputLabel>
  <Select
    labelId="demo-simple-select-label"
    id="demo-simple-select"
    value={age}
    onChange={handleChange}
  >
    <MenuItem value={10}>Ten</MenuItem>
    <MenuItem value={20}>Twenty</MenuItem>
    <MenuItem value={30}>Thirty</MenuItem>
  </Select>
</FormControl>
```

Open `book/9-begin/app/components/discussions/CreateDiscussionForm.tsx` and add the following UI code block under `MemberChooser` like this:

```
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
```

Rememeber to add the `notificationType` property to the component's `state` object and set an initial value for it:

```
type State = {
  name: string;
  memberIds: string[];
  disabled: boolean;
  content: string;
  notificationType: string;
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
    notificationType: 'default',
  };
}
```

Access `this.state.notificationType` inside the `onSubmit` method:

```
const { name, memberIds, content, notificationType } = this.state;
```

Add a falsy check:

```
if (!notificationType) {
  notify('Please select notification type.');
  return;
}
```

Remember to pass `notificationType` to the store method `currentTeam.addDiscussion`:

```
const discussion = await currentTeam.addDiscussion({
  name,
  memberIds,
  notificationType,
});
```

Replace line:

```
const post = await discussion.addPost(content);
```

With:

```
const post = await discussion.addPost(content);

if (discussion.notificationType === 'email') {
  const userIdsForLambda = discussion.memberIds.filter((m) => m !== store.currentUser._id);

  await discussion.sendDataToLambda({
    discussionName: discussion.name,
    discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
    postContent: post.content,
    authorName: post.user.displayName,
    userIds: userIdsForLambda,
  });
}

this.setState({ name: '', memberIds: [], disabled: false, notificationType: 'default' });
```

Finally, though less important, find all places where `state` gets set. Add initial values and `notificationType` to them:

```
public handleClose = () => {
  this.setState({
    name: '',
    memberIds: [],
    disabled: false,
    content: '',
    notificationType: 'default',
  });
  this.props.onClose();
};
```

```
this.setState({ name: '', memberIds: [], content: '', notificationType: 'default' });

notify('You successfully added new Discussion.');

Router.push(
  `/discussion?teamSlug=${currentTeam.slug}&discussionSlug=${discussion.slug}`,
  `/team/${currentTeam.slug}/discussions/${discussion.slug}`,
);
```

Here, we called a store method that we defined in a previous subsection and made sure we passed all necessary information that our Lambda function needs to successfully send an email with the email template `newPost` to all of a discussion's participants.

Next, open `book/9-begin/app/components/discussions/EditDiscussionForm.tsx`. Make the same changes to `EditDiscussionForm` with two exceptions:

-   Define the `notificationType` value as `this.props.discussion.notificationType` inside the `getDerivedStateFromProps` method. For `EditDiscussionForm`, unlike for `CreateDiscussionForm`, the value for `notificationType` should ultimately be retrieved from our database:
    
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
          notificationType: discussion.notificationType || 'default',
        };
      }
    ```
    
-   We should not call `sendDataToLambda` inside `EditDiscussionForm`. Changing notification type for a discussion or editing a discussion in any way should not result in sending a notification email. Replace:
    
    ```
      await discussion.editDiscussion({ name, memberIds });
    
      this.setState({ name: '', memberIds: [], disabled: false });
    ```
    
    With:
    
    ```
      await discussion.editDiscussion({ name, memberIds, notificationType });
    
      this.setState({ name: '', memberIds: [], disabled: false, notificationType: 'default' });
    ```
    

Remember to add `notificationType: 'default'` to all instance of `this.setState` when `state` gets set to initial.

Finally, open `book/9-begin/app/components/posts/PostForm.tsx` and replace following line:

```
await discussion.addPost(content);
```

With:

```
const post = await discussion.addPost(content);

if (discussion.notificationType === 'email') {
  const userIdsForLambda = discussion.memberIds.filter((m) => m !== store.currentUser._id);

  await discussion.sendDataToLambda({
    discussionName: discussion.name,
    discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
    postContent: post.content,
    authorName: post.user.displayName,
    userIds: userIdsForLambda,
  });

}

this.setState({ content: '' });
```

This is because we want our application to send a notification email when a new post is created and the discussion's notification type has the value `'email'`.

___

#### Testing updates to internal API infrastructure [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-updates-to-internal-api-infrastructure)

Alright, let's understand where are we in our implementation.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Email+notification+for+new+post+API.png)

We wrote all code that will send a request from `APP` on the browser to API Gateway at the API endpoint `NEXT_PUBLIC_API_GATEWAY_ENDPOINT`. But we did not set up API at Amazon API Gateway, and we did not define any AWS Lambda function that calls Amazon SES to send out a notification email.

We also updated internal API infrastructure so that our `Discussion` data model and data store have a `notificationType` property:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Email+notification+for+new+post+API.png)

In this subsection, we test if our update to our internal API infrastructure indeed works properly.

Start both `APP` and `API` projects with `yarn dev`.

Navigate to any existing page and log in with any account.

Create a new discussion by clicking on the plus icon in the `DiscussionList` component:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+12-42-40.png)

Most importantly, make sure the discussion has at least one more participant in addition to the discussion's creator, and make sure that you select `Default + Email` as the notification type.  
. Fill out form like this:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+12-45-28.png)

Click the `Create Discussion` button to create a new discussion:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+12-50-26.png)

Go to your MongoDB Atlas dashboard, navigate to `test.discussions` database, and find the MongoDB document that corresponds to the new discussion you just created.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+13-05-52.png)

This MongoDB document will have a new field, `notificationType`, with the value `"email"`. As it should!

Click on the three dots icon next to `third discussion - email notification` in our application. Then click the `Edit` menu item:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+13-12-52.png)

If the notification type has a value of `Default + Email`, then our application, indeed, fetches a value from our MongoDB database. That means our changes to our internal API infrastructure are a success.

___

## Amazon API Gateway and AWS Lambda [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#amazon-api-gateway-and-aws-lambda)

To complete our Email notification for the new post API infrastructure, we need to (in either order):

-   Manually set up a new API using Amazon API Gateway and add a value for the environmental variable `NEXT_PUBLIC_API_GATEWAY_ENDPOINT` to `book/9-begin/app/.env`.
-   Define an AWS Lambda function that will call the Amazon SES method `sendEmail` and utility method `getEmailTemplate` to send an email. Make sure that the Lambda function gets triggered by API from Amazon API Gateway.

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Email+notification+for+new+post+API.png)

Why don't we need to do any extra work on setting up Amazon SES infrastructure? Because we already did in Chapter 6. We already defined the Amazon SES method `sendEmail` and utility method `getEmailTemplate` in Chapter 6, and we will reuse them in our Email notification for new post API. In other words, the AWS Lambda function that we will define in the next subsection will call already-defined methods.

After we are done with our AWS Lambda function and API at Amazon API Gateway, we will test the entire feature of sending an email notification for a new post.

___

#### Amazon API Gateway [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#amazon-api-gateway)

Since our main goal is to offload some tasks from our `API` server, we decided to host some server-side code inside our AWS Lambda function. However, `APP` code on the browser has to send a request to our AWS Lambda function to trigger execution of all downstream methods that culminate in a notification email sent to a discussion's participants for a new post. AWS Lambda is a serverless environment and has no support for API endpoints, soo there is no way to send a request directly to an AWS Lambda function.

The good news is that we can trigger AWS Lambda execution and pass data to it, indirectly, by sending a request to an API endpoint, or using AWS's terminology, API, at Amazon API Gateway. We can create such API on our AWS dashboard. Then, after we define our AWS Lambda function, we can associate API with the AWS Lambda function.

In this book, we already worked with AWS's dashboard. This time, select `Amazon API Gateway` from the section `Networking & Content Delivery` inside the main menu of `Services`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-choose.png)

If you haven't created any APIs yet, click the `Build` button next to `REST API`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-build.png)

Send this response We will discuss request We will discuss session subsection list of posts Team Leader discussion static method calls. It works as expected team members Google OAuth API API method API method calls corresponding store method. Next.js web application discussion subsection if truthy then on the client. HTTP triggers method withAuth HOC response new Express route triggers method We will discuss in production discussion in this book if truthy then. Cookie API method At AWS dashboard triggers method new Express route triggers method team members add environmental variable Google OAuth API send this response open this file. HTTP store method calls check if value is truthy show notification At AWS dashboard You already learned Put it all together. Server-side rendering triggers method API infrastructure page component discussion production-ready compiles subsection add environmental variable. You already learned in this book Remember to add import request was sent new Express route API method email and name withAuth HOC email and name if truthy then end user Remember to add import. Static method calls this chapter list of posts data model team members data model triggers method triggers method Google OAuth API data model. List of posts Material-UI list of posts conditional operator in this book MongoDB database You already learned open this file At AWS dashboard triggers method redirect to checkout Team Leader Google OAuth API triggers method.

If you have at least one API already, first click the `Create API` button and then click the `Build` button next to `REST API`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+16-27-15.png)

Generally, make sure that you are creating AWS services in the same region. In this book, we created all of our resources in the same region, `us-east-1`. Although some services may work together in different regions, some don't. API from Amazon API Gateway can work with a Lambda function from AWS Lambda interregionally.

On the next page, give an informative name to API. We named it `sendEmailNotification-Lambda-API`. The name of the Lambda function will be `sendEmailNotification`, so we included it into our API's name:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-create-api.png)

Click the `Create API` button at the end of the form.

You will be redirected to the next page, where you can set up your newly created API:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-create-method.png)

Since we did not deploy our Lambda function yet, We cannot proceed further in our setup of API at Amazon API Gateway:

There are a few more steps remaining, but we will return to them after we deploy our Lambda function. These steps are:

-   Deploy API
-   Create development and production stages
-   Generate API key

___

#### AWS Lambda [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#aws-lambda)

To deploy our Lambda function to AWS Lambda, we will be using a popular `serverless` library:

[https://www.npmjs.com/package/serverless](https://www.npmjs.com/package/serverless)

First, you need to install `serverless` to your local machine:

[https://www.serverless.com/framework/docs/providers/aws/guide/installation/](https://www.serverless.com/framework/docs/providers/aws/guide/installation/)

You can run:

```
npm install -g serverless
```

And confirm successfull installation with:

```
serverless --version
```

As of writing this book, the versions are:

```
Framework Core: 3.21.0
Plugin: 6.2.2
SDK: 4.3.2
```

Then you need to add your AWS credentials to `serverless`:

[https://www.serverless.com/framework/docs/providers/aws/guide/credentials/](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)

To do so, you can run:

```
serverless config credentials --provider aws --key AKIAIOSFODNN7EXAMPLE --secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Before running the command, replace the example key and secret key with your actual values for `AWS_ACCESSKEYID` and `AWS_SECRETACCESSKEY`. You can find them in your `book/9-begin/api/.env` file.

To successfully deploy our Lambda function, we need at least two files:

-   `book/9-begin/lambda/serverless.yml`
-   `book/9-begin/lambda/handler.ts`

We already created a `lambda` folder in the `book/9-begin` folder. `lambda` has some utility files that we need in our Node project written with TypeScript. For example, it has `package.json`, `.eslintrc.js`, `tsconfig.json` - all files you are familiar with. Since our Lambda function will reuse a lot of code from our `API` project, we simply copied all packages from `book/9-begin/api/package.json` to `book/9-begin/lambda/package.json`. Once we define the Lambda function `sendEmailForNewPost`, you can trace back the imported modules and see what packages we actually need. But it is a time-consuming task, and you may import more modules from the `API` project in the future, so it is easier to simply "mirror" all packages of the `API` project (`book/9-begin/api`) into the `LAMBDA` project (`book/9-begin/lambda`).

How can we use modules from our `API` project without copying them into `LAMBDA`? Because if we copy them, we need to manually update them to stay in sync with code inside the `API` project. The simple solution is called a shortcut or, technically speaking, if you are using Ubuntu or a Linux-based OS, symbolic link. If we create a symbolic link that points to `book/9-begin/api`, then we have only one version of `API` code and don't worry about syncing code between two different versions.

To create a symbolic link, navigate to the `book/9-begin/lambda` folder on your terminal. Then run in your terminal:

```
ln -s /home/tima/apps/saas/book/9-begin/api
```

Use your own value for root directory! You should replace `/home/tima/apps/` with your actual value.

Please make sure you use your actual value for destination of `api` folder.

Check if a symbolic was successfully created. Open `Files` on Ubuntu and open your `book/9-begin/lambda` folder. There, you will see a `folder with arrow` icon for a symbolic link:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-09+21-59-30.png)

Another way to check on VS Code editor is to mouseover `book/9-begin/lambda/api`. A tooltip will pop up. This tooltip will contain `Symbolic Link` text.

Ok, we have some files that are needed for a Node application written with TypeScript, and we have a symbolic link to our `API` project. To successfully deploy our Lambda function, we need two more files:

[https://www.serverless.com/framework/docs/providers/aws/guide/services/](https://www.serverless.com/framework/docs/providers/aws/guide/services/)

-   `book/9-begin/lambda/serverless.yml`
-   `book/9-begin/lambda/handler.ts`

From the above link, this is what you can specify in your `serverless.yml` file:

```
# serverless.yml

service: users

provider:
  name: aws
  runtime: nodejs14.x
  stage: dev # Set the default stage used. Default is dev
  region: us-east-1 # Overwrite the default region used. Default is us-east-1
  stackName: my-custom-stack-name-${opt:stage, self:provider.stage, 'dev'} # Overwrite default CloudFormation stack name. Default is ${self:service}-${opt:stage, self:provider.stage, 'dev'}
  apiName: my-custom-api-gateway-name-${opt:stage, self:provider.stage, 'dev'} # Overwrite default API Gateway name. Default is ${opt:stage, self:provider.stage, 'dev'}-${self:service}
  profile: production # The default profile to use with this service
  memorySize: 512 # Overwrite the default memory size. Default is 1024
  deploymentBucket:
    name: com.serverless.${self:provider.region}.deploys # Overwrite the default deployment bucket
    serverSideEncryption: AES256 # when using server-side encryption
    tags: # Tags that will be added to each of the deployment resources
      key1: value1
      key2: value2
  deploymentPrefix: serverless # Overwrite the default S3 prefix under which deployed artifacts should be stored. Default is serverless
  versionFunctions: false # Optional function versioning
  stackTags: # Optional CF stack tags
    key: value
  stackPolicy: # Optional CF stack policy. The example below allows updates to all resources except deleting/replacing EC2 instances (use with caution!)
    - Effect: Allow
      Principal: '*'
      Action: 'Update:*'
      Resource: '*'
    - Effect: Deny
      Principal: '*'
      Action:
        - Update:Replace
        - Update:Delete
      Resource: '*'
      Condition:
        StringEquals:
          ResourceType:
            - AWS::EC2::Instance

functions:
  usersCreate: # A Function
    handler: users.create
    events: # The Events that trigger this Function
      - http: post users/create
  usersDelete: # A Function
    handler: users.delete
    events: # The Events that trigger this Function
      - http: delete users/delete

# The "Resources" your "Functions" use.  Raw AWS CloudFormation goes in here.
resources:
  Resources:
    usersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: usersTable
        AttributeDefinitions:
          - AttributeName: email
            AttributeType: S
        KeySchema:
          - AttributeName: email
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
```

Our `serverless.yml` will be much shorter. Inside the `provider` property, we specified the sub-properties `name`, `runtime`, `stage`, and `region`. We also specified two optional sub-properties: `memorySize` and `timeOut`. You can modify these two properties after you deploy your Lambda function `sendEmailForNewPost` to AWS Lambda:

```
provider:
  name: aws
  runtime: nodejs16.x
  stage: production
  region: us-east-1
  memorySize: 2048 # optional, in MB, default is 1024
  timeout: 30 # optional, in seconds, default is 6
```

We also want to use two popular `serverless` plugins: `serverless-plugin-typescript` and `serverless-dotenv-plugin`:

[https://www.serverless.com/plugins/serverless-plugin-typescript](https://www.serverless.com/plugins/serverless-plugin-typescript)

[https://www.serverless.com/plugins/serverless-dotenv-plugin/](https://www.serverless.com/plugins/serverless-dotenv-plugin/)

The plugin `serverless-plugin-typescript` compiles our code before it gets uploaded to AWS Lambda. The plugin `serverless-dotenv-plugin` loads values from `book/9-begin/lambda/.env` to `book/9-begin/lambda/serverless.yml`. Create a new file, `book/9-begin/lambda/.env`, and add the following environmental variables to it:

```
MONGO_URL=
AWS_ACCESSKEYID=
AWS_SECRETACCESSKEY=
EMAIL_SUPPORT_FROM_ADDRESS=
```

Look for values for the above environmental variables in the `book/9-begin/api/.env` file.

To use the `serverless-plugin-typescript` and `serverless-dotenv-plugin` plugins on our `serverless` service:

-   Install them to your `LAMBDA` project. On your terminal, navigate to `book/9-begin/lambda` and run:
    
    ```
      yarn add --dev serverless-plugin-typescript
      yarn add --dev serverless-dotenv-plugin
    ```
    
-   Add the property `plugins` to your `serverless.yml` file:
    
    ```
      plugins:
        - serverless-plugin-typescript
        - serverless-dotenv-plugin
    ```
    

The last property is `functions` (required). Here, you specify a function's name and `file.module` location:

[https://www.serverless.com/framework/docs/providers/aws/guide/functions/](https://www.serverless.com/framework/docs/providers/aws/guide/functions/)

For us, the `functions` property is:

```
functions:
  sendEmailForNewPost:
    handler: handler.sendEmailForNewPost
```

Put it all together in a newly created file, `book/9-begin/lambda/serverless.yml`:

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

We added the `PRODUCTION_URL_APP` env variable now, but we will introduce and discuss it in the next chapter (Chapter 10) when we deploy code to AWS.

It's important to note that you can also manually add environmental variables to a Lambda function **after** you deploy it. But here we showed how to add necessary environmental variables before deploying.

The next task is to create a `handler.ts` file, and within this file, define our `sendEmailForNewPost` Lambda function and export it. When our application, `APP`, sends a request to API at Amazon API Gateway, this API triggers our Lambda function synchronously with an event. This `event` object is a JSON representation of the original request from `APP` to API at Amazon API Gateway. Here is an official example on how to access information using an `event` object:

[https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html)

Lambda function example from the above link:

```
'use strict';
console.log('Loading hello world function');

exports.handler = async (event) => {
    let name = "you";
    let city = 'World';
    let time = 'day';
    let day = '';
    let responseCode = 200;
    console.log("request: " + JSON.stringify(event));

    if (event.queryStringParameters && event.queryStringParameters.name) {
        console.log("Received name: " + event.queryStringParameters.name);
        name = event.queryStringParameters.name;
    }

    if (event.queryStringParameters && event.queryStringParameters.city) {
        console.log("Received city: " + event.queryStringParameters.city);
        city = event.queryStringParameters.city;
    }

    if (event.headers && event.headers['day']) {
        console.log("Received day: " + event.headers.day);
        day = event.headers.day;
    }

    if (event.body) {
        let body = JSON.parse(event.body)
        if (body.time) 
            time = body.time;
    }

    let greeting = `Good ${time}, ${name} of ${city}.`;
    if (day) greeting += ` Happy ${day}!`;

    let responseBody = {
        message: greeting,
        input: event
    };

    // The output from a Lambda proxy integration must be 
    // in the following JSON object. The 'headers' property 
    // is for custom response headers in addition to standard 
    // ones. The 'body' property  must be a JSON string. For 
    // base64-encoded payload, you must also set the 'isBase64Encoded'
    // property to 'true'.
    let response = {
        statusCode: responseCode,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: JSON.stringify(responseBody)
    };
    console.log("response: " + JSON.stringify(response))
    return response;
};
```

Open `book/9-begin/app/components/discussions/CreateDiscussionForm.tsx` and find:

```
const userIdsForLambda = discussion.memberIds.filter((m) => m !== store.currentUser._id);

await discussion.sendDataToLambda({
  discussionName: discussion.name,
  discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
  postContent: post.content,
  authorName: post.user.displayName,
  userIds: userIdsForLambda,
});
```

As you can see from the first line, the `userIds` array already does not contain a post's creator because of `m !== store.currentUser._id`, as we want it to be.

These parameters, which our application sends to API at Amazon API Gateway, can be accessed inside our Lambda function `sendEmailForNewPost` via an `event` object. Based on the above official example from AWS docs, it will look like this:

```
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import sendEmail from './api/server/aws-ses';
import getEmailTemplate from './api/server/models/EmailTemplate';
import User from './api/server/models/User';


export const sendEmailForNewPost = async (event) => {
  console.log('Received event (request representation):', JSON.stringify(event));

  const reqBody = JSON.parse(event.body)

  const { discussionName, discussionLink, postContent, authorName, userIds } = reqBody;

  // send email

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Email notification was sent!',
      input: event,
    }),
  };

  return response;
};
```

How do we send an email? In the same we send any email in our application:

-   First, we retrieve an email template and replace variables (such as `<%= discussionName %>`) with their values using the `getEmailTemplate` method from `book/9-begin/lambda/api/server/models/EmailTemplate.ts`:
    
    ```
      const emailTemplate = await getEmailTemplate('newPost',{
        discussionName,
        discussionLink,
        postContent,
        authorName,
      });
    
      if (!emailTemplate) {
        throw new Error('newPost Email template not found');
      }
    ```
    
-   Second, we call the `sendEmail` AWS SES method from `book/9-begin/lambda/api/server/aws-ses.ts`:
    
    ```
      try {
        await sendEmail({
          from: `From async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
          to: [user.email],
          subject: emailTemplate.subject,
          body: emailTemplate.message,
        });
        console.log('email is sent');
      } catch (err) {
        console.error(err.stack);
      }
    ```
    

But there are a few obstacles in the way:

-   Unlike our `API` server, there is no established connection to our MongoDB database to retrieve an email template and the email addresses of users who we need to notify. So before we call the `getEmailTemplate` method, let's connect to our MongoDB database:
    
    ```
      await mongoose.connect(process.env.MONGO_URL_TEST, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      });
    ```
    
-   We need to call `sendEmail` not once but N times, where N is the number of users to notify. Let's say we have an array of user objects, `usersToNotify`. Each object has `_id` and `email` properties. Sending a notification email to all users who have a truthy value for the `email` property can be achieved with:
    
    ```
      const jobs = usersToNotify
        .filter((user) => !!user.email)
        .map(async (user) => {
          try {
            await sendEmail({
              from: `From async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
              to: [user.email],
              subject: emailTemplate.subject,
              body: emailTemplate.message,
            });
            console.log('email is sent');
          } catch (err) {
            console.error(err.stack);
          }
        });
    
      await Promise.all(jobs);
    ```
    

Now all you need to do is put everything together and to remember to disconnect from MongoDB database with `mongoose.disconnect()`:

```
import * as mongoose from 'mongoose';

import sendEmail from './api/server/aws-ses';
import getEmailTemplate from './api/server/models/EmailTemplate';
import User from './api/server/models/User';

export const sendEmailForNewPost = async (event) => {
  console.log('Received event (request representation):', JSON.stringify(event));

  const reqBody = JSON.parse(event.body);

  const { discussionName, discussionLink, postContent, authorName, userIds } = reqBody;

  if (
    discussionName === undefined ||
    discussionLink === undefined ||
    postContent === undefined ||
    authorName === undefined ||
    userIds === undefined
  ) {
    throw new Error('Missing data');
  }

  console.log(discussionName, discussionLink, postContent, authorName, userIds);

  await mongoose.connect(process.env.MONGO_URL_TEST, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });

  try {
    const emailTemplate = await getEmailTemplate('newPost', {
      discussionName,
      discussionLink,
      postContent,
      authorName,
    });

    if (!emailTemplate) {
      throw new Error('newPost Email template not found');
    }

    const usersToNotify = await User.find({ _id: { $in: userIds } })
      .select('email')
      .setOptions({ lean: true });

    console.log('usersToNotify', usersToNotify);

    const jobs = usersToNotify
      .filter((user) => !!user.email)
      .map(async (user) => {
        try {
          await sendEmail({
            from: `From async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
            to: [user.email],
            subject: emailTemplate.subject,
            body: emailTemplate.message,
          });
          console.log('email is sent');
        } catch (err) {
          console.error(err.stack);
        }
      });

    await Promise.all(jobs);
  } catch (error) {
    console.error(error.stack);
    return { error: error.message, event };
  } finally {
    await mongoose.disconnect();
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Email notification was sent!',
      input: event,
    }),
  };

  return response;
};
```

Finally, we need to enable CORS by adding a CORS headers to our response:

[https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

Code from the above link:

```
exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
```

Replace block:

```
const response = {
  statusCode: 200,
  body: JSON.stringify({
    message: 'Email notification was sent!',
    input: event,
  }),
};
```

With:

```
const response = {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({
    message: 'Email notification was sent!',
    input: event,
  }),
};
```

We added an extra header `Access-Control-Allow-Credentials` with the value `true`, because the original request we send from `APP` to API Gateway has `credentials` with the value `include` (`book/9-begin/app/lib/api/sendRequestAndGetResponse.ts`):

```
const response = await fetch(
  opts.externalServer ? `${path}${qs}` : `${process.env.NEXT_PUBLIC_URL_API}${path}${qs}`,
  Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
);
```

Create a new file, `book/9-begin/lambda/handler.ts`, and add the above content into it.

We are ready to deploy our Lambda function `sendEmailForNewPost` to AWS Lambda. Navigate to the `book/9-begin/lambda` folder and run the following command to deploy the service defined in `book/9-begin/lambda/serverless.yml`:

```
serverless deploy
```

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-12-07.png)

After you deploy this service, you can re-deploy each function individually. For example, to re-deploy `sendEmailForNewPost`, you can run:

```
NODE_ENV=production serverless deploy function --function sendEmailForNewPost
```

Go to your AWS dashboard and click `Services`. Under the section `Compute`, find `Lambda` and click on it:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-14-16.png)

On the list of all Lambda functions, find the one you just deployed and click on it:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-17-07.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-23-41.png)

Scroll down. In the section `Environmental variables`, you will find a list of environmental variables and their values from `book/9-begin/lambda/.env` and `book/9-begin/lambda/serverless.yml`:

![Builder Book](https://user-images.githubusercontent.com/10218864/146270656-b46f04d7-c704-4250-9b37-270edd398ff5.png)

We will introduce `URL_APP` and `PRODUCTION_URL_APP` environmental variables in the next chapter, Chapter 10.

In the section `Basic settings`, you will see some properties that we specified in `book/9-begin/lambda/serverless.yml`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-18-54.png)

List of posts We will discuss withAuth HOC Next.js web application store method calls email and name Remember to add import Click on the button API method calls corresponding store method withAuth HOC API method calls corresponding store method if truthy then Google OAuth API static method calls S3 bucket. Team Leader store method calls add environmental variable email and name on the client. API infrastructure You already learned mount middleware send this response decorate method with action withAuth HOC in this book if truthy then in production. Remember to add import send this response AWS dashboard list of posts if truthy then page component cookie team members At AWS dashboard Click on the button Put it all together page component production-ready We will discuss email and name. Show notification discussion store method calls this chapter conditional operator Material-UI HTTP We will discuss Put it all together this chapter. S3 bucket in production store method calls end user Click on the button We will discuss send this response in production At AWS dashboard check if value is truthy production-ready in production compiles in production. Cookie redirect to checkout redirect to checkout list of posts open this file compiles. Page component Click on the button in this book triggers method withAuth HOC. Material-UI it works as expected request was sent Click on the button in this book on the client Google OAuth API this chapter redirect to checkout S3 bucket AWS dashboard request. Google OAuth API Put it all together Next.js web application API infrastructure data model redirect to checkout We will discuss API method store method calls Click on the button if truthy then.

We are one step closer to testing our entire API infrastructure for Email notification. All we need to do is to pair up API at Amazon API Gateway with our deployed Lambda function `sendEmailForNewPost` so that the request from `APP` to API at Amazon API Gateway triggers the Lambda function `sendEmailForNewPost`.

If you would like to test and invoke your lambda function locally, use following command:

```
serverless invoke local --function functionName
```

The above command comes handy since deploying a lambda function takes time and you can run lambda locally with a different set of environmental variables (other than production env vars).

___

#### Testing entire Email notification for new post API [link](https://builderbook.org/books/saas-boilerplate/introduction-project-structure#testing-entire-email-notification-for-new-post-api)

To pair up API at Amazon API Gateway with the Lambda function `sendEmailForNewPost`, navigate to Amazon API Gateway on your AWS dashboard:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-choose.png)

Then click on API that we created earlier:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-35-15.png)

Click `Create method`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-create-method.png)

Select `Integration type` to be `Lambda Function`. Check the box next to `Use Lambda Proxy integration` and select our Lambda function `saas-boilerplate-production-sendEmailForNewPost`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-create-post.png)

Click the `Create method` button.

Optional task - if you navigate back to AWS Lambda and click on our Lambda function, you will find our API from Amazon API Gateway is indeed on the list of triggers for the Lambda function:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-42-41.png)

Click the `Deploy API` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-deploy-api.png)

On the popup, select `[New Stage]`. Give a name to the newly created stage and click the `Deploy` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+14-49-22.png)

You will be redirected to a page that displays `Invoke URL`, which is the value for your environmental variable `NEXT_PUBLIC_API_GATEWAY_ENDPOINT` inside the `APP` project:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/api-gateway-invoke-url.png)

Open `book/9-begin/app/.env` and add this new environmental variable and its value.

___

If we test our entire API infrastructure now, our infrastructure will fail to send a notification email. You will have to check your Lambda function's logs to figure out the cause of failure. Navigate to your Lambda function and click the `Monitoring` tab. Then click the `View logs in CloudWatch` button and select the latest log stream:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+17-23-08.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+17-23-20.png)

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+17-26-15.png)

On the log stream, you will see an output printed by:

```
console.log(discussionName, discussionLink, postContent, authorName, userIds);
```

This is good! This means that we read data from the `event` object correctly.

But you will also see an error:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+17-27-37.png)

The text of the error will be similar to this:

```
ERROR    AccessDenied: User `arn:aws:sts::199171476185:assumed-role/saas-boilerplate-production-us-east-1-lambdaRole/saas-boilerplate-production-sendEmailForNewPost' is not authorized to perform `ses:SendEmail'
```

This means that our Lambda function cannot call `ses:SendEmail` to send an email. We have to add `ses:SendEmail` and Amazon SES service to our Lambda function's policy. On your AWS dashboard, navigate to your Lambda function and click on the `Configuration` then click on `Permissions` tab:

![Builder Book](https://user-images.githubusercontent.com/10218864/146271076-7315b3d9-1917-4fa2-9011-b6057c1bb023.png)

Click on the role name link:

![Builder Book](https://user-images.githubusercontent.com/10218864/146271671-047e77c4-5af8-4562-ad93-25e6332df77b.png)

Then click on the policy's name to see details. Click the `Edit policy` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+21-12-27.png)

First, let's edit permissions for `CloudWatch Logs` service. If we do so, our deployed lambda function will save logs and we can access them later. This is useful for debugging your code. Add 3 write permissions for `CloudWatch Logs` service like so:

![Builder Book](https://user-images.githubusercontent.com/10218864/146272436-fbaea4ca-0cd2-4a0d-8cba-d902d09cd8a2.png)

Next, click on `+ Add additional permissions`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+21-16-20.png)

Select Service `SES`, Action `SendEmail`, and Resources `All resources`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+21-24-52.png)

Click the `Review policy` button and `Save changes` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+21-26-54.png)

Done!

Let's test our entire infrastructure. Start both `APP` and `API` with `yarn dev`. Navigate to the `third discussion - email notification` discussion. Click on the three dots icon, then the `Edit` menu item. Make sure that the notification type is `Default + Email` and that the discussion has at least one participant in addition to the discussion's creator:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+15-20-44.png)

In our above example, the discussion's creator is `Team Leader Potato` with email address `team@builderbook.org`. `Team Leader Potato` will create a new post and `Team Member Async` will receive an email notification sent to `team@async-await.com`.

Create a new post with your Team Leader account, using this content:

```
We have an urgent matter to discuss. Can you get online when you see this email notification?
```

Click the `Publish Post` button:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+21-33-56.png)

The very fact that you see `You successfully published new Post.` with `notify` means that our `APP` on the browser successfully received a response from our Lambda function via API Gateway. This is because of the way we ordered the code. `await discussion.sendDataToLambda` precedes `notify` (`book/9-begin/app/components/posts/PostForm.tsx`):

```
await discussion.sendDataToLambda({
  discussionName: discussion.name,
  discussionLink: `${process.env.NEXT_PUBLIC_URL_APP}/team/${discussion.team.slug}/discussions/${discussion.slug}`,
  postContent: post.content,
  authorName: post.user.displayName,
  userIds: userIdsForLambda,
});

this.setState({ content: '' });

notify('You successfully published new Post.');
```

Check the email inbox of your user who should receive an email notification. In our case, it is the inbox for `team@async-await.com`:

![Builder Book](https://d2w0479rccr6dx.cloudfront.net/4P4efVnhYMqB6amzbMKQVkd2cEvwxdHw/chapter-9/Screenshot+from+2020-08-10+21-39-43.png)

Indeed, the inbox for `team@async-await.com` received a new email with all expected data!

Finally, use the instructions we provided earlier in this subsection to access the latest log stream at CloudWatch.

This statement:

```
console.log('Received event (request representation):', JSON.stringify(event));
```

logs:

```
Received event (request representation): 
{
    "resource": "/",
    "path": "/",
    "httpMethod": "POST",
    "headers": {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,de;q=0.7,la;q=0.6",
        "cache-control": "no-cache",
        "content-type": "text/plain;charset=UTF-8",
        "dnt": "1",
        "Host": "e40o30lxa9.execute-api.us-east-1.amazonaws.com",
        "origin": "http://localhost:3000",
        "pragma": "no-cache",
        "referer": "http://localhost:3000/team/1/discussions/3",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.68 Safari/537.36",
        "X-Amzn-Trace-Id": "Root=1-5f31dbd1-1576b4324ba1b4d406c1495a",
        "X-Forwarded-For": "174.246.16.94",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders": {
        "accept": [
            "*/*"
        ],
        "accept-encoding": [
            "gzip, deflate, br"
        ],
        "accept-language": [
            "en-US,en;q=0.9,ru;q=0.8,de;q=0.7,la;q=0.6"
        ],
        "cache-control": [
            "no-cache"
        ],
        "content-type": [
            "text/plain;charset=UTF-8"
        ],
        "dnt": [
            "1"
        ],
        "Host": [
            "e40o30lxa9.execute-api.us-east-1.amazonaws.com"
        ],
        "origin": [
            "http://localhost:3000"
        ],
        "pragma": [
            "no-cache"
        ],
        "referer": [
            "http://localhost:3000/team/1/discussions/3"
        ],
        "sec-fetch-dest": [
            "empty"
        ],
        "sec-fetch-mode": [
            "cors"
        ],
        "sec-fetch-site": [
            "cross-site"
        ],
        "User-Agent": [
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.68 Safari/537.36"
        ],
        "X-Amzn-Trace-Id": [
            "Root=1-5f31dbd1-1576b4324ba1b4d406c1495a"
        ],
        "X-Forwarded-For": [
            "174.246.16.94"
        ],
        "X-Forwarded-Port": [
            "443"
        ],
        "X-Forwarded-Proto": [
            "https"
        ]
    },
    "queryStringParameters": null,
    "multiValueQueryStringParameters": null,
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
        "resourceId": "anzlbsmemf",
        "resourcePath": "/",
        "httpMethod": "POST",
        "extendedRequestId": "RE9IzFeZIAMFg3Q=",
        "requestTime": "10/Aug/2020:23:44:17 +0000",
        "path": "/production/",
        "accountId": "199171476185",
        "protocol": "HTTP/1.1",
        "stage": "production",
        "domainPrefix": "e40o30lxa9",
        "requestTimeEpoch": 1597103057806,
        "requestId": "225e5651-27c0-44d3-a207-7363a686abf2",
        "identity": {
            "cognitoIdentityPoolId": null,
            "accountId": null,
            "cognitoIdentityId": null,
            "caller": null,
            "sourceIp": "174.246.16.94",
            "principalOrgId": null,
            "accessKey": null,
            "cognitoAuthenticationType": null,
            "cognitoAuthenticationProvider": null,
            "userArn": null,
            "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.68 Safari/537.36",
            "user": null
        },
        "domainName": "e40o30lxa9.execute-api.us-east-1.amazonaws.com",
        "apiId": "e40o30lxa9"
    },
    "body": "{\"discussionName\":\"third discussion - email notification\",\"discussionLink\":\"http://localhost:3000/team/1/discussions/3\",\"postContent\":\"[`@#Team Member Async`](https://lh3.googleusercontent.com/a-/AOh14GhoWgGFpVNI23YCQVilvy-T3IDVG7GDHZHew6Og)  We have an urgent matter to discuss. Can you get online when you see this email notification?\",\"authorName\":\"Team Leader Potato\",\"userIds\":[\"5ef7bca9e1410c382de1164f\"]}",
    "isBase64Encoded": false
}
```

This statement:

```
console.log(discussionName, discussionLink, postContent, authorName, userIds);
```

logs:

```
third discussion - email notification http://localhost:3000/team/1/discussions/3 We have an urgent matter to discuss. Can you get online when you see this email notification? Team Leader Potato [ '5ef7bca9e1410c382de1164f' ]
```

This statement:

```
console.log('usersToNotify', usersToNotify);
```

logs:

```
usersToNotify [ { _id: 5ef7bca9e1410c382de1164f, email: 'team@async-await.com' } ]
```

Our Email notification for new post API infrastructure works as expected!

Good job on getting this far!

This is the end of Chapter 9.

___

If you followed the instructions in this chapter closely, your codebase should match the codebase located at `book/9-end`.

Compare your codebase and make edits if needed.

If you found any bugs, typos, or explanations that were confusing, please report on our GitHub repo: [https://github.com/async-labs/saas/issues/new](https://github.com/async-labs/saas/issues/new)

If you're learning a lot from the book, please share a review. You can email your review to [team@builderbook.org](mailto:team@builderbook.org)

Thank you.

___

If you are part of a small team and looking for an open source team communication tool, check up [Async](https://async-await.com/).

If you need help with your SaaS web application, check out [Async Labs](https://async-labs.com/).

___