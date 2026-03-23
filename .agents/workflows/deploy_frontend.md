---
description: Deploy the hush-web application to Firebase Hosting
---

This workflow automates the deployment of the Vite + React frontend to Firebase Hosting.
The step below builds the project and deploys the `dist` directory.

// turbo-all

1. Build the frontend and deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```
