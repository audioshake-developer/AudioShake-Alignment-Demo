# AudioShake Alignment Demo - Developer Guide

## Overview
The AudioShake Alignment Demo is a reference implementation designed to showcase the AudioShake Alignment API. It serves as both a functional demo tool and a code resource for developers integrating AudioShake's alignment capabilities into their own applications.

This client-side web application provides a complete workflow: authenticating with the API, managing audio assets, creating alignment tasks, and visualizing the synchronized results.

## Key Features

### 1. Flexible Asset Management
The application supports multiple ways to bring audio content into the workflow:
-   **Demo Assets**: Quick access to pre-loaded tracks to demonstrate stem separation and alignment without needing user files.
-   **Direct URL Loading**: Users can create assets from any publicly accessible audio URL.
-   **Bulk Operations**: Supports uploading a `demo-assets.json` file to populate the asset library in bulk.
-   **Intelligent Validation**: The system validates asset files upon load, hiding irrelevant UI sections until a valid asset is successfully selected.

### 2. Alignment Visualization & Playback
-   **Dual Media Support**: Handles both Audio and Video assets, dynamically switching the player interface.
-   **Synchronized Lyrics**: Visualizes alignment data by highlighting the current word in sync with playback.
-   **Interactive Timeline**: Clicking on words in the transcript seeks the player to that specific timestamp.

### 3. Smart Task Management
-   **Automatic Filtering**: To ensure link validity, the application automatically filters out alignment tasks that are older than 72 hours (the lifespan of the signed download links).
-   **Fuzzy Search**: The alignment list includes a robust, case-insensitive, fuzzy search that ignores special characters, making it easy to find tasks even with file naming variations (e.g., matching "My Song" with "My-Song_v2.wav").

### 4. Developer Tools
-   **Live Code Examples**: A built-in "View Code" modal provides context-aware code snippets in JavaScript, Node.js, Python, Swift, and cURL. These snippets are dynamically updated with the user's current API key and selected asset URL.
-   **API Console**: An integrated debug console logs all API interactions, responses, and errors in real-time, aiding in understanding the request/response cycle.

## Content Management System
The application uses a lightweight, Markdown-based content system. This allows non-technical team members to update text content without modifying the application code.

-   **Intro Text** (`intro.md`): The main dashboard introduction.
-   **FAQs** (`faq.md`): Content for the Frequently Asked Questions modal.
-   **Code Templates** (`code/*.md`): The source templates for the code snippets. Variables like `${api_key}` and `${asset_url}` are protected placeholders that are injected at runtime.

**Updating Content**: Simply edit the corresponding `.md` file and refresh the application.

## Technical Architecture

The project is built with vanilla web technologies to ensure maximum portability and ease of understanding.

### Core Components
-   **`index.html`**: The semantic HTML structure of the application.
-   **`styles.css`**: A comprehensive Vanilla CSS stylesheet handling layout, theming (including dark mode support), and responsive design.

### Logic Layer
-   **`app.js`**: The main application controller. It handles:
    -   Application state management.
    -   UI event listeners and DOM manipulation.
    -   Media player synchronization logic.
    -   Asset loading and validation routines.
-   **`api.js`**: A dedicated API wrapper module. It encapsulates all HTTP communication with the AudioShake API using the native `fetch` API. It handles authentication, request signing, and response parsing.
-   **`code.js`**: A utility module responsible for fetching Markdown templates and injecting dynamic runtime data for the code examples.

### Dependencies
-   **`Showdown.js`**: A robust Markdown-to-HTML converter used to render the content files (`intro.md`, `faq.md`) within the application UI.

## Project Structure
```
/
├── index.html          # Main entry point
├── styles.css          # Global styles
├── app.js              # Main application logic
├── api.js              # API client wrapper
├── code.js             # Code example generation
├── intro.md            # Editable intro content
├── faq.md              # Editable FAQ content
├── code/               # Code snippet templates
│   ├── javascript.md
│   ├── python.md
│   └── ...
└── release-notes.md    # This documentation
```

## Getting Started
1.  **Installation**: Run `npm install` to set up the development environment.
2.  **Development**: Run `npm run dev` to launch the local Vite server.
3.  **Deployment**: The app is static and can be deployed to any static site host (Netlify, Vercel, S3, etc.).
