# SaaS Boilerplate Project

This repository contains a full-stack SaaS application built with a modern technology stack. It's structured as a monorepo with three main projects: `api`, `app`, and `lambda`.

## Projects

### 1. `api` (API Server)

- **Description**: A Node.js and Express server that provides the backend API for the application.
- **Features**:
  - User authentication (Google OAuth, passwordless)
  - Team and discussion management
  - Real-time communication with WebSockets
  - Payment integration with Stripe
  - File uploads to AWS S3
  - Email sending with AWS SES
- **Technology Stack**: Node.js, Express, TypeScript, MongoDB, Mongoose, Socket.IO, Stripe
- **See also**: `api/README.md` for more details.

### 2. `app` (Client-side Application)

- **Description**: A Next.js and React application that provides the user interface for the SaaS product.
- **Features**:
  - Server-side rendering
  - A rich set of UI components built with Material-UI
  - Client-side state management with MobX
  - Protected routes and authentication handling
- **Technology Stack**: Next.js, React, TypeScript, Material-UI, MobX
- **See also**: `app/README.md` for more details.

### 3. `lambda` (Serverless Function)

- **Description**: A serverless lambda function, likely for use with AWS Lambda.
- **Technology Stack**: Node.js, TypeScript, Serverless Framework
- **See also**: `lambda/README.md` for more details.

## Documentation

The `docs` directory contains detailed documentation for the project, with each file representing a chapter that explains a specific part of the application's development and architecture. See `docs/README.md` for more details.

## Getting Started

To get started with this project, you will need to:

1.  **Install dependencies**: Run `yarn` in the root directory, as well as in the `api`, `app`, and `lambda` directories.
2.  **Set up environment variables**: Each project (`api`, `app`) requires a `.env` file with the necessary configuration. Refer to the documentation and source code to see which variables are required.
3.  **Start the development servers**: Run `yarn dev` in the `api` and `app` directories to start the API server and the client-side application. 