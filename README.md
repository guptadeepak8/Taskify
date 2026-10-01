# Taskify

A full-stack native mobile application built with React Native (Expo) and a modular Node.js/Express backend API.

---

## Prerequisites

- **Node.js**: LTS version (v20+ recommended)
- **Package Manager**: `pnpm` (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker Desktop**: For running local PostgreSQL and Mailpit services
- **Android Development**: Android Studio with Android SDK (API 34+), Android SDK Platform-Tools, and Java JDK 17 (for emulator or local APK builds)

---

## Backend Setup

### 1. Start Local Database & Email Services
Run the PostgreSQL database and Mailpit SMTP server in the background:

```bash
docker compose up -d
```

- **PostgreSQL**: `localhost:5433` (mapped from container 5432 to avoid local port conflicts)
- **Mailpit SMTP**: `localhost:1025`
- **Mailpit Web UI**: `http://localhost:8025` (view OTP verification emails in browser)

### 2. Configure Environment Variables
Navigate to the `server/` directory and create `.env` from the provided example template:

```bash
cd server
copy .env.example .env     # On Windows (cmd)
# cp .env.example .env     # On macOS / Linux
```

### 3. Install Dependencies & Setup Database (Prisma)
```bash
pnpm install
pnpm prisma:generate
pnpm prisma:push
pnpm migrate
```

This ensures the database schema is synchronized:
- `users`: User profiles with Indian phone and address fields.
- `otps`: OTP tracking with bcrypt hashing and attempt limits.
- `tasks` & `user_tasks`: 24 tasks seeded across 4 categories and user selections.

### 4. Start the Backend Server
```bash
pnpm dev
```
The API is available at `http://localhost:3000/api/v1`.

### 5. Run Automated Tests
```bash
pnpm test
```
Runs the full Vitest suite covering OTP generation, expiry, brute-force attempt lockout, login rules, profile validation, and task selection.

---

## Environment Variables

Pre-configured `.env.example` files with safe local defaults are provided in both `server/` and `client/`. Simply copy and paste them as `.env`:

```bash
# Server
cd server && copy .env.example .env

# Client
cd client && copy .env.example .env
```
*(On macOS / Linux, use `cp .env.example .env`).*

Never commit `.env` files or real secrets to version control.

---

## Running the Mobile App (Two Options)

### Option 1: Run with Expo (Development)

1. **Install dependencies and setup environment**:
   ```bash
   cd client
   pnpm install
   copy .env.example .env     # On Windows (cmd)
   # cp .env.example .env     # On macOS / Linux
   ```

2. **Start the Expo development server**:
   ```bash
   pnpm start
   ```

3. **Launch the app**:
   - **On Android Emulator**: Press **`a`** in the terminal to launch automatically on your running emulator.
   - **On Physical Device (Expo Go)**:
     1. Install the free **Expo Go** app from the Google Play Store (Android) or App Store (iOS).
     2. Ensure your phone and computer are on the same Wi-Fi network.
     3. Scan the QR code displayed in your terminal with your phone camera or Expo Go.

---

### Option 2: Standalone Android APK

If you prefer testing the standalone native app without Expo CLI:

1. **Install Pre-built APK**:
   - Download the submitted `taskify.apk` (from GitHub Releases / submission link).
   - Install directly on an Android device or drag-and-drop into an Android emulator.

2. **Build Your Own APK (EAS Cloud Build)**:
   - Install the EAS CLI:
     ```bash
     npm install -g eas-cli
     ```
   - Build the standalone `.apk`:
     ```bash
     cd client
     eas build --platform android --profile preview
     ```
   - EAS will generate a direct download link and QR code to install the `.apk` on any device.

---

## Documentation

See [`DESIGN.md`](./DESIGN.md) for the one-page overview of architecture, trade-offs, scope omissions, and future improvements.