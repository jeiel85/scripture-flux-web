# GitHub Deployment Guide

## Repository name suggestions

Current repository:

```txt
scripture-flux-web
```

Alternatives:

```txt
bible-cross-reference-map
scripture-network-visualizer
crossref-scripture-map
```

## Initial repository setup

```bash
npm create vite@latest scriptureflux -- --template react-ts
cd scriptureflux
npm install
npm install d3 framer-motion
npm install -D tailwindcss @tailwindcss/vite
```

Follow the current Tailwind + Vite setup instructions for the installed Tailwind version.

## Suggested package scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "prepare:data": "tsx scripts/prepare-data.ts"
  }
}
```

## GitHub Pages deployment

Create:

```txt
.github/workflows/deploy.yml
```

Suggested workflow:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

## Vite base path

If deploying to the current GitHub Pages site:

```txt
https://jeiel85.github.io/scripture-flux-web/
```

configure:

```ts
// vite.config.ts
export default defineConfig({
  base: '/scripture-flux-web/',
  plugins: [react()]
});
```

If deploying to a custom domain or user root page, use:

```ts
base: '/'
```

## Documentation files

Add:

```txt
README.md
DATA_SOURCES.md
ATTRIBUTION.md
LICENSE
```

## README outline

```md
# ScriptureFlux

A modern Bible cross-reference visualization.

## Features

## Demo

## Data sources

## Local development

## Build

## Deployment

## License and attribution
```

## Release process

1. Confirm dataset license.
2. Confirm Bible text license.
3. Run build.
4. Deploy to GitHub Pages.
5. Tag release:

```bash
git tag v0.1.0
git push origin v0.1.0
```
