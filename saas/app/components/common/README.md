# `app/components/common` Directory

This directory contains a set of reusable, general-purpose React components that are used throughout the application.

### Structure

- **`Confirmer.tsx`**: A component that provides a confirmation dialog. It can be triggered from anywhere in the application by calling the exported `openConfirmDialogExternal` function.
- **`LoginButton.tsx`**: A component that provides login buttons for both Google OAuth and passwordless email login. It also handles logic for invitation tokens.
- **`MemberChooser.tsx`**: A component for selecting members from a list, likely used in forms for adding members to teams or discussions.
- **`MenuWithLinks.tsx`**: A generic menu component that displays a list of links.
- **`MenuWithMenuItems.tsx`**: A generic menu component that displays a list of clickable menu items and handles their `onClick` events.
- **`Notifier.tsx`**: A component for displaying snackbar-style notifications. It can be triggered from anywhere in the application.
- **`__tests__/`**: Contains tests for the common components.

### Important Notes

- These components are designed to be highly reusable and configurable through props.
- Some components, like `Confirmer` and `Notifier`, export functions that allow them to be controlled from outside their own scope, which is a useful pattern for global UI elements.
- The components make use of the Material-UI library. 