# `api/server/api` Directory

This directory contains all the API route definitions for the server, organized by user roles and access levels.

### Structure

- **`index.ts`**: This file is the entry point for the API routes. It combines all the other route modules and registers them with the Express server under the `/api/v1` path. It also includes error handling middleware.
- **`public.ts`**: Defines all the public-facing API endpoints that do not require authentication. These are typically used for fetching public information like user profiles or team details for invitations.
- **`team-leader.ts`**: Contains all the API endpoints that are only accessible to team leaders. This includes actions like creating teams, inviting members, managing team settings, and handling billing information via Stripe.
- **`team-member.ts`**: This is the largest route file and contains all the API endpoints for authenticated users who are team members. This includes fetching initial app data, updating user profiles, managing discussions and posts, and getting signed URLs for file uploads to S3.

### API Endpoint Prefixes

- **/api/v1/public**: Routes defined in `public.ts`.
- **/api/v1/team-leader**: Routes defined in `team-leader.ts`.
- **/api/v1/team-member**: Routes defined in `team-member.ts`.

### Important Notes

- **Authentication**: All routes except for those in `public.ts` require the user to be authenticated. A middleware in each route file checks for `req.user`.
- **Error Handling**: A centralized error handler in `index.ts` catches and logs any errors that occur within the API routes.
- **Real-time Communication**: The `team-member.ts` routes for discussions and posts are integrated with the WebSocket service (`sockets.ts`) to provide real-time updates to connected clients. 