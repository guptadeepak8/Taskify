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

### 3. Install Dependencies & Run Database Migrations
```bash
pnpm install
pnpm migrate
```

This applies migrations:
- `001_create_users_table`: Creates user profiles with Indian phone and address fields.
- `002_create_otps_table`: Creates OTP tracking with bcrypt hashing and attempt limits.
- `003_create_tasks_tables`: Seeds 24 tasks across 4 categories.

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

## How to Run the Mobile App

1. Navigate to the `client/` folder and install dependencies:
   ```bash
   cd client
   pnpm install
   ```

2. Copy the environment configuration:
   ```bash
   copy .env.example .env     # On Windows
   # cp .env.example .env     # On macOS / Linux
   ```

3. Start the Expo development server:
   ```bash
   pnpm start
   ```

4. Press **`a`** in the terminal to launch the app inside the running Android emulator.

---

## How to Build the APK

### Method 1: Local Build (Gradle & Android SDK)
Requires Android Studio and Java JDK 17 installed locally.

1. Generate the native Android project files:
   ```bash
   cd client
   npx expo prebuild --platform android
   ```

2. Build the standalone APK:
   - **Debug APK** (fast, unsigned, installable directly):
     ```bash
     cd android
     ./gradlew assembleDebug      # Linux / macOS
     gradlew assembleDebug        # Windows
     ```
     Output APK: `client/android/app/build/outputs/apk/debug/app-debug.apk`

   - **Release APK**:
     ```bash
     cd android
     ./gradlew assembleRelease    # Linux / macOS
     gradlew assembleRelease      # Windows
     ```
     Output APK: `client/android/app/build/outputs/apk/release/app-release.apk`

3. Install on a connected Android device or emulator:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 2: Cloud Build (EAS CLI)
Builds an installable APK in the cloud without needing local Android SDK:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Run the preview build:
   ```bash
   cd client
   eas build --platform android --profile preview
   ```
   EAS will generate a direct download link and QR code for the `.apk`.

---

## Documentation

See [`DESIGN.md`](./DESIGN.md) for the one-page overview of architecture, trade-offs, scope omissions, and future improvements.