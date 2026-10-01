# Taskify — System Design & Decisions

A concise overview of the backend architecture, trade-offs, scope boundaries, and future roadmap.

---

## 1. Architecture

Taskify uses a **layered, functional, modular monolith** designed for simplicity, type safety, and clean separation of concerns:

- **Runtime & Framework**: Node.js with Express and TypeScript (strict mode).
- **Database & ORM**: PostgreSQL with Prisma ORM for type-safe database access, automated schema management, and transactional integrity.
- **Validation**: Zod middleware validating incoming request bodies, queries, and params before reaching controllers.
- **Authentication**: Stateless JWTs using standard `Authorization: Bearer <token>` headers tailored for native mobile storage (`expo-secure-store`).
- **Email & OTP**: Nodemailer wired to Mailpit for local testing. 6-digit OTPs are cryptographically generated (`crypto.randomInt`) and stored exclusively as bcrypt hashes with single-use flags, 10-minute TTLs, and 5-attempt brute-force protection.
- **Data Flow**:
  $$\text{Request} \longrightarrow \text{Validation/Auth Middleware} \longrightarrow \text{Controller} \longrightarrow \text{Service Layer} \longrightarrow \text{Prisma Client (PostgreSQL)}$$

---

## 2. Main Trade-offs

1. **Bearer Token Headers vs. HttpOnly Cookies**:
   - *Choice*: Used Bearer tokens via `Authorization` header.
   - *Rationale*: Taskify is built specifically for a native mobile client (React Native / Expo). HttpOnly cookies complicate cross-origin native mobile networking, while Bearer tokens stored in device secure storage (`expo-secure-store`) provide seamless, native-friendly authentication.

2. **PostgreSQL-Backed State vs. Redis Cache**:
   - *Choice*: Stored OTP records, attempt limits, and resend cooldowns directly in PostgreSQL.
   - *Rationale*: Satisfied assignment constraints by eliminating unnecessary dependencies (Redis/memcached) while keeping Docker Compose footprint lightweight. Database indexes ensure sub-millisecond lookups at this scale.

3. **Atomic Task Replacement vs. Diff Patching**:
   - *Choice*: Replacing user task selections atomically within a database transaction (`DELETE` + `INSERT`).
   - *Rationale*: Eliminates race conditions and simplifies state synchronization between the mobile app and server.

---

## 3. What Was Left Out

- **Refresh Token Rotation**: Current implementation issues long-lived JWTs (`7d`). Separate short-lived access tokens and revocable refresh tokens were omitted to keep the auth flow simple.
- **Redis Rate Limiting**: Distributed rate limiting on public endpoints was omitted in favor of database-backed OTP cooldowns (30s) and attempt counters (max 5).
- **Full-Text Search Engine**: Task catalog search relies on PostgreSQL `ILIKE` rather than dedicated `tsvector`/Elasticsearch, which is optimal for catalogues under a few thousand items.
- **Automated DB Seed CLI**: Database seeding is baked directly into migration `003` rather than a standalone CLI script to guarantee deterministic initialization on container startup.

---

## 4. What I Would Do Next (With Another Week)

1. **Token Refresh & Revocation Flow**:
   - Implement short-lived access tokens (15m) paired with rotating refresh tokens stored in a `refresh_tokens` table with device fingerprinting and instant revocation on logout.
2. **Reverse Geocoding & Address Autocomplete**:
   - Integrate an Indian address verification API (e.g., MapmyIndia / Google Places) to autocomplete addresses and validate pin codes.
3. **Role-Based Access Control (RBAC)**:
   - Differentiate customer profiles from service professional accounts, allowing task providers to accept jobs and set pricing.
4. **Task Scheduling & Booking Engine**:
   - Extend selected tasks into concrete service requests with appointment time slots, location coordinates, and booking lifecycle states (`pending`, `confirmed`, `in-progress`, `completed`).
5. **Observability & Health Monitoring**:
   - Add structured JSON logging (Pino), request tracing correlation IDs, and Prometheus metrics for API latency and failure tracking.
