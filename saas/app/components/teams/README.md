# `app/components/teams` Directory

This directory contains React components that are specific to team management.

### Structure

- **`InviteMember.tsx`**: A component that provides a form for inviting new members to a team. It likely includes a field for the user's email address and a button to send the invitation.

### Important Notes

- This component is used on the team settings page (`/team-settings`) to allow team leaders to manage their team.
- It interacts with the MobX store to call the API for sending invitations. 