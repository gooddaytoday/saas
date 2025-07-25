# `app/pages` Directory

This directory contains all the pages for the Next.js application. Each file in this directory corresponds to a route in the application.

### Structure

- **`_app.tsx`**: This is the custom App component that Next.js uses to initialize pages. It's used to wrap all pages in a common layout, provide the MobX store and Material-UI theme to all components, and fetch initial data for the application.
- **`_document.tsx`**: This is a custom Document component that's used to augment the application's `<html>` and `<body>` tags. It's used for server-side rendering of styles (specifically for Material-UI and Emotion), and to add meta tags and other head elements.
- **`billing.tsx`**: The page where users can manage their subscription and view their billing history.
- **`create-team.tsx`**: A page with a form for creating a new team.
- **`discussion.tsx`**: The page for viewing a single discussion, including all of its posts.
- **`invitation.tsx`**: The page that handles user invitations to a team. It validates the invitation token and allows the user to join the team.
- **`login.tsx`**: The main login page for the application.
- **`login-cached.tsx`**: A page that is shown briefly to the user after they log in, while the application is fetching their data in the background.
- **`team-settings.tsx`**: The page where team leaders can manage their team's settings, including inviting and removing members.
- **`your-settings.tsx`**: The page where users can update their personal settings, such as their display name and avatar.

### Important Notes

- **Routing**: Next.js uses a file-system based router. Any file in the `pages` directory becomes a route.
- **Data Fetching**: The `_app.tsx` component uses `getInitialProps` to fetch data that is required for all pages, such as the current user and their teams. Individual pages can also use `getInitialProps` to fetch data specific to that page.
- **Authentication**: Most pages are protected using the `withAuth` HOC from `app/lib/withAuth.tsx`, which ensures that only authenticated users can access them. 