# `app/lib` Directory

This directory contains a collection of modules that provide various functionalities for the client-side application, including API communication, state management, and utility functions.

### Structure

- **`api/`**: This subdirectory contains modules for making API requests to the server. The structure mirrors the server's API routes (`public`, `team-leader`, `team-member`), making it easy to find the corresponding client-side API methods.
  - `sendRequestAndGetResponse.ts`: A generic function for sending HTTP requests to the API.
- **`store/`**: This subdirectory contains the client-side state management logic, implemented using MobX. Each file corresponds to a different part of the application's state (e.g., `user`, `team`, `discussion`).
  - `index.ts`: The main store file that combines all the individual stores.
- **`__tests__/`**: Contains tests for the library modules.
- **`confirm.ts`**: A simple helper function to trigger the global confirmation dialog.
- **`gtag.ts`**: Contains functions for interacting with Google Analytics.
- **`isMobile.ts`**: A utility function to detect if the user is on a mobile device.
- **`notify.ts`**: A simple helper function to trigger the global notification component.
- **`resizeImage.ts`**: A utility function for resizing images on the client-side.
- **`sharedStyles.ts`**: Contains shared styling rules, likely used with Material-UI's styling solution.
- **`theme.ts`**: Defines the application's color theme for both light and dark modes.
- **`withAuth.tsx`**: A higher-order component (HOC) used to protect pages and components that require authentication. It checks for a valid user session and redirects to the login page if necessary.

### Important Notes

- **State Management**: The application uses MobX for state management, which allows for a reactive and observable state.
- **API Communication**: The `api` modules provide a clean and organized way to interact with the backend API.
- **Authentication**: The `withAuth` HOC is a critical piece of the application's security, ensuring that only authenticated users can access protected content. 