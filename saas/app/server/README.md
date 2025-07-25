# `app/server` Directory

This directory contains a custom Express server for the Next.js application. While Next.js has its own built-in server, a custom server is used here to implement more advanced features like custom routing, server-side caching, and dynamic generation of `sitemap.xml` and `robots.txt`.

### Structure

- **`server.ts`**: The main entry point for the custom Express server. It initializes Next.js, sets up custom routes, and starts the server.
- **`routesWithCache.ts`**: This module defines which routes should be cached on the server-side. It uses a caching strategy (likely LRU cache) to store the rendered HTML of certain pages, which can significantly improve performance for frequently accessed pages.
- **`setupSitemapAndRobots.ts`**: This module is responsible for dynamically generating the `sitemap.xml` and `robots.txt` files. This is important for SEO, as it allows search engines to discover and index the application's pages more effectively.
- **`robots.txt`**: A static `robots.txt` file that is likely used as a fallback or for development.

### Important Notes

- **Custom Routing**: The custom server allows for more flexible routing than what's provided by Next.js's file-system based router. For example, it's used to create cleaner URLs like `/teams/:teamSlug/your-settings` that map to the `/your-settings` page.
- **Server-side Caching**: Caching pages on the server can provide a significant performance boost by reducing the need to re-render pages on every request. This is particularly useful for pages that are not highly dynamic.
- **SEO**: The dynamic generation of `sitemap.xml` and `robots.txt` is a key feature for improving the application's search engine optimization. 