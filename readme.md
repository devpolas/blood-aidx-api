# 🩸 Blood AIDX — Backend API

> A production-oriented blood donation and emergency blood request backend built with **Node.js, Express, TypeScript, PostgreSQL, Prisma, REST API, Socket.IO, and Redis**.

Blood AIDX provides the backend infrastructure for connecting blood donors, recipients, volunteers, hospitals, blood banks, and platform administrators through a secure and scalable API.

---

## 📌 Overview

Blood AIDX is a backend platform designed to manage the complete blood-donation workflow:

- User authentication and account management
- Donor management
- Blood requests
- Blood request responses
- Donation records
- Organizations and blood banks
- Locations
- Donation milestones
- Certificates
- Reports
- Reviews
- Conversations
- Realtime messaging
- Realtime notifications
- Administrative user management

The backend follows a layered architecture where HTTP APIs and realtime Socket.IO events share the same business services and authorization rules.

---

## 🏗️ Architecture

```text
                         Blood AIDX Backend
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
          REST API                            Socket.IO
              │                                   │
              └─────────────────┬─────────────────┘
                                │
                           Controllers
                                │
                             Services
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
           Prisma                              Redis
              │
          PostgreSQL
```

### Backend layers

```text
HTTP Request
     │
     ▼
   Router
     │
     ▼
 Middleware
     │
     ▼
 Controller
     │
     ▼
 Service
     │
     ▼
 Prisma
     │
     ▼
 PostgreSQL
```

Realtime operations follow the same business layer:

```text
Socket.IO Event
      │
      ▼
Socket Authentication
      │
      ▼
Event Handler
      │
      ▼
Service Layer
      │
      ▼
Prisma / PostgreSQL
      │
      ▼
Socket.IO Broadcast
```

Socket.IO is treated as a **realtime transport layer**, not as a separate business-logic layer.

---

# 🚀 Core Features

## Authentication

- Email/password authentication
- Database-backed sessions
- Session cookie authentication
- Google OAuth
- Email verification
- Active-user validation
- Account banning support
- Session management

Primary session cookie:

```text
session_token
```

The backend uses the database-backed session as the source of truth instead of relying on JWT as the primary authentication mechanism.

---

## 🔐 Authorization

Blood AIDX uses multiple authorization levels:

```text
1. Global User Role
        ↓
2. Organization Member Role
        ↓
3. Resource Ownership
```

Global roles:

```text
DONOR
RECIPIENT
VOLUNTEER
HOSPITAL
BLOOD_BANK
MODERATOR
ADMIN
```

Authorization is resource-aware.

Administrative privileges are not automatically applied to every resource. Moderator/admin permissions are explicitly required for moderation and administrative operations.

---

# 🩸 Blood Donation Domain

The backend manages the complete donation workflow.

```text
Donor
  │
  ▼
Blood Request
  │
  ▼
Blood Request Response
  │
  ▼
Donation
  │
  ▼
Milestone
  │
  ▼
Certificate
```

Supported domain modules include:

- Donors
- Blood requests
- Blood request responses
- Donations
- Milestones
- Certificates
- Organizations
- Locations
- Reports
- Reviews

---

# 💬 Realtime Communication

Blood AIDX uses **Socket.IO** for realtime communication.

The Socket.IO server runs on the same HTTP server as Express.

```text
HTTP Server
     │
     ├── Express REST API
     │
     └── Socket.IO
```

There is no separate Socket.IO port in the current architecture.

---

## 🔑 Socket Authentication

Socket.IO uses the same database-backed session system as REST authentication.

The server extracts:

```text
session_token
```

from the Socket.IO handshake cookie and validates it through the existing session service.

```ts
getSessionByToken(token);
```

After successful authentication:

```ts
socket.data.user = {
  id: auth.user.id,
  role: auth.user.role,
};
```

The authenticated socket identity is authoritative.

Client-provided `userId` values are never trusted for identity-sensitive operations.

---

# 🏠 Socket Rooms

Blood AIDX uses two primary room types.

### User room

```text
user:<userId>
```

Used for private realtime notifications.

### Conversation room

```text
conversation:<conversationId>
```

Used for:

- Messages
- Message updates
- Message deletion
- Typing indicators
- Read status

---

# 📡 Socket Events

## Client → Server

```text
conversation:join
conversation:leave

message:send
message:update
message:delete

conversation:read

typing:start
typing:stop
```

## Server → Client

```text
message:new
message:updated
message:deleted

conversation:read

typing:start
typing:stop

notification:new

socket:error
```

---

# 💬 Messaging Architecture

Conversation membership is validated through the existing conversation service:

```ts
ConversationService.getConversationForUser(conversationId, userId);
```

This same authorization logic is reused by Socket.IO.

### Message permissions

| Operation         | Permission               |
| ----------------- | ------------------------ |
| Send message      | Conversation participant |
| Read messages     | Conversation participant |
| Mark as read      | Conversation participant |
| Edit message      | Message sender           |
| Delete message    | Message sender           |
| Moderation delete | Moderator/Admin          |

Normal conversation access still requires conversation membership even when the user has a moderator/admin role.

---

# 🔔 Notifications

Notifications use a persistent-first architecture.

```text
Business Service
      │
      ▼
NotificationService
      │
      ├── PostgreSQL
      │      │
      │      └── Persistent notification
      │
      └── Socket.IO
             │
             └── notification:new
```

The database remains the source of truth.

If a user is offline:

```text
Notification → PostgreSQL
```

When the user reconnects, notifications remain available through the REST API.

Realtime delivery is an additional transport layer rather than the persistence mechanism.

---

# ⚡ Redis

Redis is used by the backend for application-level caching and can later be used for distributed Socket.IO synchronization.

Current architecture:

```text
Application
    │
    ├── PostgreSQL
    │
    └── Redis
```

For a single backend instance, Socket.IO does not require Redis.

For multiple Socket.IO instances behind a load balancer:

```text
                Load Balancer
                     │
          ┌──────────┴──────────┐
          │                     │
     API Instance 1        API Instance 2
          │                     │
          └──────────┬──────────┘
                     │
                  Redis
```

The Socket.IO Redis adapter can then synchronize events between instances.

---

# 🛣️ API Routes

Base URL:

```text
/api/v1
```

## Authentication

```text
/api/v1/auth
```

Handles:

- Signup
- Signin
- Logout
- Session management
- Google OAuth
- Email verification
- Authentication-related operations

---

## Users

```text
/api/v1/users
```

User account management.

---

## Profiles

```text
/api/v1/profiles
```

User profile management.

---

## Donors

```text
/api/v1/donors
```

Donor-specific operations and donation eligibility information.

---

## Blood Requests

```text
/api/v1/blood-requests
```

Blood request creation and management.

---

## Blood Request Responses

```text
/api/v1/blood-request-responses
```

Donor responses to blood requests.

---

## Donations

```text
/api/v1/donations
```

Donation records and donation lifecycle operations.

---

## Administrative Users

```text
/api/v1/admin/users
```

Administrative user management.

---

## Organizations

```text
/api/v1/organizations
```

Organization and blood-bank related operations.

---

## Locations

```text
/api/v1/locations
```

Location management.

---

## Milestones

```text
/api/v1/milestones
```

Donation and user milestone management.

---

## Certificates

```text
/api/v1/certificates
```

Certificate management and generation-related operations.

---

## Reports

```text
/api/v1/reports
```

Reporting and platform data operations.

---

## Reviews

```text
/api/v1/reviews
```

Review and feedback management.

---

## Conversations

```text
/api/v1/conversations
```

Conversation creation and participant management.

Current conversation operations include:

```text
GET    /
POST   /

POST   /:conversationId/participants
DELETE /:conversationId/participants/:userId
POST   /:conversationId/leave

GET    /:conversationId
```

Conversation routes are protected by:

```ts
protect;
requireActiveUser;
requireVerifiedEmail;
```

---

## Messages

```text
/api/v1/messages
```

Current message operations:

```text
POST   /
GET    /conversation/:conversationId

PATCH  /conversation/:conversationId/read
GET    /conversation/:conversationId/unread-count

GET    /:messageId
PATCH  /:messageId
DELETE /:messageId

PATCH  /:messageId/read
```

Recommended explicit moderation endpoint:

```text
DELETE /:messageId/moderate
```

protected by:

```ts
requireRole("moderator", "admin");
```

---

## Notifications

```text
/api/v1/notifications
```

Current operations:

```text
GET    /
GET    /unread
GET    /unread-count

PATCH  /:notificationId/read
PATCH  /read-all

DELETE /:notificationId
DELETE /read
```

---

# 🔒 Protected API Pattern

Protected modules generally use:

```ts
router.use(protect, requireActiveUser, requireVerifiedEmail);
```

This establishes the common authentication boundary before resource-specific authorization is applied.

---

# 🧱 Backend Project Structure

```text
src/
├── app.ts
├── server.ts
│
├── config/
│
├── lib/
│   ├── db/
│   └── redis/
│
├── middleware/
│
├── modules/
│   ├── auth/
│   ├── user/
│   ├── profile/
│   ├── donor/
│   ├── blood-request/
│   ├── blood-request-response/
│   ├── donation/
│   ├── user-admin/
│   ├── organization/
│   ├── location/
│   ├── milestone/
│   ├── certificate/
│   ├── report/
│   ├── review/
│   ├── conversation/
│   ├── message/
│   └── notification/
│
├── socket/
│   ├── socket.server.ts
│   ├── socket.auth.ts
│   ├── socket.types.ts
│   ├── socket.rooms.ts
│   ├── socket.events.ts
│   └── socket.emitter.ts
│
├── utils/
│
└── ...
```

Each module follows a separation of responsibilities:

```text
module/
├── module.route.ts
├── module.controller.ts
├── module.service.ts
├── module.schema.ts
└── module.validation.ts
```

---

# 🗄️ Database

Blood AIDX uses:

```text
PostgreSQL
     │
   Prisma
     │
 TypeScript
```

Prisma provides:

- Type-safe database access
- Schema management
- Relations
- Query abstraction
- Database migrations

---

# ✅ Validation

Request validation is handled with **Zod**.

Example:

```ts
const CreateMessageSchema = z
  .object({
    conversationId: z.uuid(),
    content: z.string().trim().min(1).max(5000),
  })
  .strict();
```

The same validation principles are applied to HTTP and realtime message operations.

---

# 🍪 Session-Based Authentication

The backend uses database-backed sessions.

```text
Client
  │
  │ session_token cookie
  ▼
Express / Socket.IO
  │
  ▼
Session Service
  │
  ▼
PostgreSQL
  │
  ▼
Authenticated User
```

The same session mechanism is shared between:

```text
REST API
+
Socket.IO
```

This keeps authentication behavior consistent across HTTP and realtime communication.

---

# 🔐 Google OAuth

Google OAuth uses:

```text
openid
email
profile
```

OAuth state is stored in the server session:

```ts
req.session.googleOAuthState;
```

The callback validates the OAuth flow before establishing the authenticated application session.

---

# 📧 Email

The backend supports email-related workflows through the mail service, including authentication and verification-related communication.

---

# ☁️ Media

Cloudinary is used where backend workflows require managed media storage and delivery.

---

# 💳 Payments

The backend supports payment integrations required by Blood AIDX business workflows.

Supported payment infrastructure includes:

```text
Stripe
SSLCommerz
```

---

# 🌐 CORS

Allowed frontend/client origins are configured through:

```env
ORIGIN_URLS=https://blood-aidx.vercel.app,https://blood-aidx-api.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174
```

The same origin policy is applied to:

```text
Express
Socket.IO
```

Credentials are enabled because authentication relies on cookies.

---

# 🔌 Shared HTTP + Socket.IO Server

Express and Socket.IO run on the same Node HTTP server.

```ts
const server = http.createServer(app);

initializeSocket(server);

server.listen(config.port);
```

This provides:

```text
HTTP
  +
REST API
  +
Socket.IO
```

through the same server instance and port.

---

# 🛡️ Graceful Shutdown

The backend handles:

```text
SIGTERM
SIGINT
```

During shutdown:

```text
Stop accepting connections
        ↓
Close HTTP + Socket.IO server
        ↓
Close Redis
        ↓
Close PostgreSQL
        ↓
Exit process
```

Startup failures also trigger database and Redis cleanup.

---

# 🚀 Environment Variables

Typical backend configuration:

```env
NODE_ENV=
PORT=

DATABASE_URL=

REDIS_URL=

ORIGIN_URLS=

SESSION_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=

SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
```

Actual environment configuration depends on the deployment environment.

---

# 📦 Installation

```bash
git clone <repository-url>

cd blood-aidx-api

npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

---

# 🗃️ Prisma

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

For production deployments:

```bash
npx prisma migrate deploy
```

---

# 🏃 Development

Start the development server:

```bash
npm run dev
```

Build the backend:

```bash
npm run build
```

Start the production build:

```bash
npm start
```

---

# 🧪 Testing

The backend should be tested across multiple layers:

```text
Unit Tests
    ↓
Service Tests
    ↓
API Integration Tests
    ↓
Authentication Tests
    ↓
Authorization Tests
    ↓
Socket.IO Tests
```

Important security cases include:

- Unauthorized requests
- Expired sessions
- Unverified users
- Banned users
- Resource ownership violations
- Conversation membership violations
- Message ownership violations
- Moderator/admin authorization

---

# 📡 Realtime Message Flow

```text
Authenticated Socket
        │
        ▼
conversation:join
        │
        ▼
Verify conversation membership
        │
        ▼
Join conversation room
        │
        ▼
message:send
        │
        ▼
Validate payload
        │
        ▼
MessageService
        │
        ▼
PostgreSQL
        │
        ▼
message:new
        │
        ▼
Conversation Room
```

The important principle is:

> **Socket.IO does not bypass the service layer.**

REST and Socket.IO use the same business rules.

---

# 🔔 Realtime Notification Flow

```text
Business Event
      │
      ▼
NotificationService
      │
      ├───────────────┐
      ▼               ▼
PostgreSQL        Socket.IO
      │               │
      │               ▼
      │        user:<userId>
      │               │
      │               ▼
      │       notification:new
      │
      ▼
Persistent Notification
```

This guarantees that realtime delivery does not replace persistence.

---

# 📈 Scaling Strategy

### Current

```text
Single Node.js Instance
        │
   ┌────┴────┐
   │         │
Express   Socket.IO
   │         │
   └────┬────┘
        │
   PostgreSQL
        │
      Redis
```

### Future multi-instance architecture

```text
                  Load Balancer
                       │
            ┌──────────┴──────────┐
            │                     │
       Backend #1            Backend #2
            │                     │
            └──────────┬──────────┘
                       │
                     Redis
                       │
                Socket.IO Adapter
                       │
                  PostgreSQL
```

When multiple Socket.IO instances are introduced, use:

```bash
npm install @socket.io/redis-adapter
```

with dedicated Redis publisher/subscriber connections.

---

# ☁️ Deployment

The backend is designed to be deployable as a Node.js application and currently supports Vercel deployment.

The production server exposes:

```text
HTTP API
+
Socket.IO
```

from the same application server.

Production configuration must provide the appropriate:

- Database URL
- Redis URL
- OAuth credentials
- Session secret
- CORS origins
- Cloudinary credentials
- Payment credentials
- Email configuration

---

# 🧭 API Domain Map

```text
Auth
 │
 ├── Users
 │    └── Profiles
 │
 ├── Donors
 │
 ├── Blood Requests
 │    └── Request Responses
 │
 ├── Donations
 │    ├── Milestones
 │    └── Certificates
 │
 ├── Organizations
 │    └── Locations
 │
 ├── Reports
 │
 ├── Reviews
 │
 ├── Conversations
 │    └── Messages
 │
 └── Notifications
```

Administrative operations:

```text
Admin
 └── User Management
```

Realtime layer:

```text
Socket.IO
 ├── Conversations
 ├── Messages
 ├── Typing
 ├── Read Status
 └── Notifications
```

---

# 🧠 Engineering Principles

Blood AIDX follows these backend principles:

### 1. Service-first business logic

Business rules belong in services rather than controllers or Socket.IO handlers.

### 2. Shared authorization

REST and Socket.IO use the same authorization services.

### 3. Persistent-first notifications

PostgreSQL remains the source of truth for notifications.

### 4. Session-based identity

The authenticated session determines the current user.

### 5. Never trust client identity

User identity comes from:

```ts
socket.data.user.id;
```

not from client-provided `userId`.

### 6. Resource-level authorization

Access is determined by:

```text
Global Role
+
Organization Role
+
Resource Ownership
```

where applicable.

### 7. Realtime is an additional transport

Socket.IO enhances the REST backend rather than replacing it.

### 8. Production-oriented architecture

The backend is structured to support:

- Secure authentication
- Realtime communication
- Persistent notifications
- Horizontal scaling
- Redis-based coordination
- PostgreSQL persistence
- Graceful shutdown
- Cloud deployment

---

# 📄 API Versioning

The current API is versioned under:

```text
/api/v1
```

This provides a stable namespace for future API evolution.

---

# 🏁 Current Backend Stack

| Category       | Technology                   |
| -------------- | ---------------------------- |
| Runtime        | Node.js                      |
| Language       | TypeScript                   |
| Framework      | Express                      |
| API            | REST                         |
| Realtime       | Socket.IO                    |
| Database       | PostgreSQL                   |
| ORM            | Prisma                       |
| Validation     | Zod                          |
| Cache          | Redis                        |
| Authentication | Database-backed Sessions     |
| OAuth          | Google OAuth                 |
| Email          | NodeMailer                   |
| Media          | Cloudinary                   |
| Payments       | Stripe / SSLCommerz          |
| Deployment     | Vercel / Node.js             |
| Architecture   | Modular Service Architecture |

---

# 🎯 Backend Mission

Blood AIDX is designed around one core goal:

> **Build a reliable backend infrastructure that makes blood donation, emergency blood requests, donor coordination, communication, and donation tracking easier to manage through secure APIs and realtime services.**

The backend is intentionally structured so that REST APIs, realtime communication, authentication, authorization, persistence, and business logic remain independently maintainable while working together as one platform.
