# Lihatin-UI

Frontend application for Lihatin, built with Next.js App Router.  
This project provides the user interface for authentication, short link creation and management, analytics views, and account flows.

## Project Status

- Active development
- Public repository
- Issues and pull requests are welcome

## Features

- Email/password authentication flows
- Google OAuth login flow integration
- OTP verification flow (email and TOTP-related screens)
- Short link dashboard and management UI
- API-key based authenticated API consumption
- Responsive layout for desktop and mobile

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Query (TanStack)
- Zod + React Hook Form

## Repository Links

- Frontend: [github.com/adehusnim37/Lihatin-UI](https://github.com/adehusnim37/Lihatin-UI)
- Backend API: [github.com/adehusnim37/Lihatin-Go](https://github.com/adehusnim37/Lihatin-Go)

## Getting Started

### Prerequisites

- Node.js 20+ (or Bun)
- Backend API running (default expected at `http://localhost:8080/v1`)

### Installation

1. Clone repository

```bash
git clone https://github.com/adehusnim37/Lihatin-UI.git
cd Lihatin-UI
```

2. Install dependencies

```bash
npm install
```

3. Create local env file

```bash
cp .env.example .env.local
```

4. Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Key variables commonly used in local and production setups:

- `NEXT_PUBLIC_API_URL` (required, include `/v1`)
- `NEXT_PUBLIC_FRONTEND_URL` (public app URL for generated links)
- `NEXT_PUBLIC_BRAND_URL` (brand/home URL used in auth pages)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (optional)
- `JWT_SECRET` (optional server-side guard verification)

See `.env.example` for full list and defaults.

## Available Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```text
app/          # App Router routes and pages
components/   # Shared UI components
lib/          # Utilities and API helpers
hooks/        # Reusable React hooks
public/       # Static assets
deploy/       # Deployment-related files
```

## Deployment

The app can be deployed with Docker or any Node-compatible platform.

- Dockerfile is available at repository root.
- For CI/CD reference, see `.github/workflows`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

This project is licensed under the Unlicense.  
See [LICENSE](LICENSE).
