# Wedora

Wedora is a modern, minimalist, all-in-one wedding management platform built to simplify wedding planning. The platform is completely free with no advertisements, subscriptions, premium tiers, or paywalled features.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Linting:** [ESLint](https://eslint.org/)
- **Package Manager:** npm

## Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js:** `v20.x` or later (LTS recommended)
- **npm:** `v10.x` or later

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Available Scripts

### Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

### Linting

Run ESLint to check for code quality and formatting issues:

```bash
npm run lint
```

### Production Build

Create an optimized production build:

```bash
npm run build
```

Run the built production application locally:

```bash
npm run start
```

## Project Structure

```text
src/
├── app/                  # Next.js App Router (pages, layouts, route handlers)
│   ├── globals.css       # Core design tokens, neutral palette, and base styles
│   ├── layout.tsx        # Root HTML layout and font configurations
│   └── page.tsx          # Minimal foundation placeholder
├── components/           # Shared, reusable UI and layout components
├── features/             # Feature-driven domain modules
├── lib/                  # Shared utilities and helper functions
│   └── utils.ts
└── types/                # Shared TypeScript interfaces and type declarations
    └── index.ts
```

## Design Philosophy

- **Minimalist Aesthetic:** Black and white foundation with neutral grey tones.
- **Accessible & Mobile-First:** Responsive layouts with intuitive typography and touch targets.
- **Uncluttered:** Focus on whitespace, clean typography, and subtle borders.
