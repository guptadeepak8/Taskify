
# AGENTS.md

## Project
PadosiPro — Full-stack native mobile application
take-home assignment.

## Architecture
- Client: React Native, Expo, TypeScript.
- Server: Node.js, Express, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Validation: Zod.
- Authentication: JWT.
- Email: Nodemailer with Mailpit for local testing.
- Package manager: pnpm.
- Local environment: Docker Compose.

## General Instructions
- Inspect existing files before modifying anything.
- Follow the current project architecture and conventions.
- Use TypeScript with strict typing.
- Prefer simple, maintainable solutions over unnecessary abstraction.
- Do not introduce additional frameworks or dependencies
  without a clear requirement.
- Do not use WebViews; the mobile app must be native.
- Do not add microservices, Kubernetes or Redis.
- Do not hardcode secrets, credentials or API keys.
- Never commit .env files or real user data.
- Do not claim a feature is complete without testing it.

## Client
- Use React Native and Expo.
- Use reusable components and consistent styling.
- Implement loading, empty and error states for network screens.
- Keep API requests in a dedicated API layer.
- Handle authentication and session expiry properly.
- Support Android emulator and document device configuration.

## Server
- Use Express with TypeScript.
- Organize routes, controllers, services, schemas and database
  access into clear modules.
- Validate all incoming request data using Zod.
- Use consistent API response and error formats.
- Keep business logic separate from HTTP handlers.
- Use parameterized database queries.
- Use database migrations for schema changes.
- Avoid exposing sensitive information in errors or logs.


## Authentication and Security
- Only verified users can log in.
- OTPs must be securely generated and stored as hashes.
- OTPs expire after 10 minutes and are single-use.
- Limit incorrect OTP attempts to 5.
- Apply a resend cooldown of approximately 30 seconds.
- Use secure password hashing.
- Validate JWTs and enforce authentication on protected routes.
- Never log passwords, OTPs, JWTs or secrets.

## Testing
- Add tests for OTP generation, expiry and attempt limits.
- Test login restrictions for unverified users.
- Test important API validation and failure cases.
- Run tests and TypeScript checks after meaningful changes.

## Assignment Requirements
- Support registration and email verification.
- Support login and profile setup.
- Collect name, Indian mobile number and address.
- Business name is optional.
- Provide at least 20 tasks across at least 4 categories.
- Support task search, multi-selection and confirmation.
- Persist selected tasks and show them on the home screen.
- Support logout.
- Include README.md and DESIGN.md documentation.

## Workflow
1. Inspect relevant source files.
2. Identify the smallest implementation that meets the requirement.
3. Implement the change.
4. Run relevant tests and type checks.
5. Report files changed, checks performed and known issues.
6. Do not silently omit failing tests or validation errors