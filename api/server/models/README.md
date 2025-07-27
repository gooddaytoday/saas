# `api/server/models` Directory

This directory contains all the Mongoose models for the application's database schema. Each file defines a schema, an interface for the document, a model interface with static methods, and a class with static methods for interacting with the data.

### Structure

- **`User.ts`**: Defines the `User` schema, which stores information about users, including their profile details, authentication information (Google OAuth and passwordless), and Stripe customer data. It includes methods for signing up, signing in, updating profiles, and managing Stripe information.
- **`Team.ts`**: Defines the `Team` schema. A team has a leader and multiple members. This model includes methods for creating and updating teams, managing members, and handling Stripe subscriptions for the team.
- **`Discussion.ts`**: Defines the `Discussion` schema. Discussions belong to a team and have multiple members. This model includes methods for creating, editing, and deleting discussions, as well as managing discussion members.
- **`Post.ts`**: Defines the `Post` schema. Posts belong to a discussion and are created by users. It includes logic for converting Markdown content to HTML and methods for creating, editing, and deleting posts.
- **`Invitation.ts`**: Defines the `Invitation` schema. Team leaders can invite new members to their team via email. This model handles the creation of invitation tokens, sending invitation emails, and adding users to a team once they accept an invitation.
- **`EmailTemplate.ts`**: Defines the `EmailTemplate` schema and manages email templates used throughout the application. It includes a function to insert and update predefined templates in the database and a function to retrieve and render them with dynamic data.

### Important Notes

- **Static Methods**: All models use static methods on the class to encapsulate database logic. This keeps the API route handlers clean and focused on handling requests and responses.
- **Permissions**: Many of the static methods include permission checks to ensure that a user is authorized to perform a certain action (e.g., checking if a user is a team leader or a member of a specific team).
- **Data Integrity**: The models use Mongoose's schema validation to enforce data integrity. 