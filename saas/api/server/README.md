# `api/server` Directory

This directory is the core of the API server. It contains the main server setup, WebSocket handling, payment integration, authentication, and other critical components.

### Structure

- **`api/`**: Sub-directory containing the API route definitions.
- **`models/`**: Contains all the Mongoose models for the database schema.
- **`utils/`**: A collection of utility functions used across the server.
- **`aws-s3.ts`**: Manages file uploads to Amazon S3.
- **`aws-ses.ts`**: Handles sending emails using Amazon SES.
- **`google-auth.ts`**: Implements Google OAuth for user authentication.
- **`logger.ts`**: A simple logger configuration.
- **`mailchimp.ts`**: Integration with Mailchimp for mailing lists.
- **`passwordless-auth.ts`**: Implements passwordless authentication using email links.
- **`passwordless-token-mongostore.ts`**: A custom token store for passwordless authentication using MongoDB.
- **`server.ts`**: The main entry point for the Express server. It sets up middleware, connects to the database, and initializes all the services.
- **`sockets.ts`**: Configures and manages WebSocket communication using `socket.io`. It handles real-time events for discussions and posts.
- **`stripe.ts`**: Integrates Stripe for handling subscriptions and payments. It includes functions for creating checkout sessions, managing subscriptions, and handling webhooks.

### Important Notes

- **Authentication**: The server supports both Google OAuth and passwordless email-based authentication. The `google-auth.ts` and `passwordless-auth.ts` files contain the respective implementations.
- **Real-time features**: WebSockets are used for real-time updates within teams and discussions. The `sockets.ts` file defines the different rooms and events that the clients can subscribe to.
- **Payments**: Stripe is used for handling all payment-related functionality. `stripe.ts` is a critical file that communicates with the Stripe API.
- **Environment Variables**: The server relies heavily on environment variables for configuration. Make sure to have a `.env` file with all the necessary variables defined. 