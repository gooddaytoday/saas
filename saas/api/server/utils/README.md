# `api/server/utils` Directory

This directory contains utility functions that are used across the server application.

### Structure

- **`slugify.ts`**: This file contains functions for generating URL-friendly slugs from strings.
  - `generateSlug`: Creates a unique slug for a given model and name. If a slug already exists, it appends a number to make it unique.
  - `generateRandomSlug`: Generates a random and unique slug.
- **`sum.ts`**: A simple utility function that returns the sum of two numbers. This is likely used for testing purposes.

### Important Notes

- The `slugify` utility is crucial for creating user-friendly and SEO-friendly URLs for users, teams, and discussions.
- The functions in this directory are designed to be pure and reusable. 