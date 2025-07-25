# `app/components/discussions` Directory

This directory contains React components that are specific to the discussion feature of the application.

### Structure

- **`CreateDiscussionForm.tsx`**: A form component for creating a new discussion. It likely includes fields for the discussion name and for selecting members to invite.
- **`DiscussionActionMenu.tsx`**: A menu component that provides actions for a discussion, such as editing or deleting it.
- **`DiscussionList.tsx`**: A component that displays a list of discussions for the current team.
- **`DiscussionListItem.tsx`**: A component that represents a single item in the discussion list.
- **`EditDiscussionForm.tsx`**: A form component for editing an existing discussion.

### Important Notes

- These components are responsible for the user interface of the discussion feature.
- They interact with the MobX store to get data and to perform actions (e.g., creating, updating, deleting discussions).
- These components are likely used on the main discussion page (`/discussion`). 