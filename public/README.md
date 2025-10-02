# Public Directory

This directory contains the static assets for the portal. Files here are served directly by the web server and are not processed by the application's build pipeline.

## Key Files

-   `index.html`: The main HTML file that serves as the entry point for the single-page application (SPA). The compiled JavaScript and CSS bundles are typically injected into this file automatically during the build process.
-   `favicon.ico`: The icon displayed in the browser's tab.
-   `robots.txt`: Provides instructions to web crawlers and bots.

## Usage

Place any static assets that do not require processing, such as images, fonts, or third-party libraries, in this directory. They can be referenced from `index.html` using an absolute path from the root.
