
# PadosiPro

A native mobile application with a custom backend API,
developed as a full-stack take-home assignment.

## Tech Stack

- React Native
- Expo
- TypeScript
- Node.js
- Express
- PostgreSQL
- Kysely
- Zod
- Docker Compose
- pnpm

## Project Structure

- `client/` — React Native mobile application
- `server/` — Express backend API
- `AGENTS.md` — AI coding agent instructions
- `DESIGN.md` — Architecture and design decisions
- `docker-compose.yml` — Local services

## Prerequisites

- Node.js LTS
- pnpm
- Docker Desktop
- Android Studio and Android SDK

## Installation

Clone the repository:

    git clone <repository-url>
    cd padosipro

Install client dependencies:

    cd client
    pnpm install

Install server dependencies:

    cd ../server
    pnpm install

Configure the server environment:

    Copy .env.example to .env
    Configure the required variables.

## Running Locally

Start local services:

    docker compose up --build

Start the backend separately if it is not started
by Docker Compose:

    cd server
    pnpm dev

Start the mobile application:

    cd client
    pnpm start

Press `a` in the Expo terminal to launch the Android
emulator.

## Testing

Backend tests:

    cd server
    pnpm test

## Environment Variables

See `server/.env.example` for the required configuration.
Never commit actual credentials or secrets.

## Documentation

See `DESIGN.md` for architecture, trade-offs,
limitations and future improvements.