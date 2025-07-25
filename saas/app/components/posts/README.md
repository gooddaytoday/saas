# `app/components/posts` Directory

This directory contains React components that are specific to the post feature of the application, used for displaying and managing posts within a discussion.

### Structure

- **`PostContent.tsx`**: A component for displaying the content of a single post, likely rendering the HTML that was converted from Markdown.
- **`PostDetail.tsx`**: A component that displays the full details of a post, including the author's information, the post content, and any actions that can be performed on the post (e.g., edit, delete).
- **`PostEditor.tsx`**: A rich text editor component for creating and editing posts. It likely uses a library like CodeMirror or Monaco Editor to provide a good editing experience with Markdown support.
- **`PostForm.tsx`**: A form component that wraps the `PostEditor` and handles the logic for submitting new posts or updating existing ones.

### Important Notes

- These components are the building blocks for the discussion view, where users interact with posts.
- They interact with the MobX store to manage the state of posts and to perform actions.
- The `PostEditor` is a key component that enables the rich formatting of posts using Markdown. 