I reviewed the previous README and the current repository metadata. The old README is comprehensive, but several sections are now outdated—especially the role model, Prisma commands, API authorization model, payment claims, and project scripts. The current package uses Node 24, Express 5, Prisma ORM 8 RC, Zod 4, Redis, Socket.IO, Stripe, Cloudinary, and the newer `user / moderator / admin` global role model.

Below is a **complete replacement README** that reflects the current architecture and recent API changes.

````md
# 🩸 Blood AidX API

> A production-oriented REST and realtime backend for blood donation, emergency blood requests, donor coordination, communication, organizations, and donation management.

Blood AidX provides the backend infrastructure for connecting people who need blood with eligible donors while supporting donation tracking, organizations, realtime communication, notifications, reporting, reviews, authentication, and administrative workflows.

---

## ✨ Overview

Blood AidX is a modular backend API built with modern Node.js and TypeScript technologies.

The platform is designed around a simple goal:

> **Make blood donation and emergency blood coordination easier, safer, and more reliable through a secure API and realtime communication layer.**

The backend provides:

- User authentication and account management
- Email verification
- Google OAuth
- Session-based authentication
- Donor profiles and eligibility
- Public donor discovery
- Blood request management
- Blood request responses
- Donation tracking
- Donation verification
- Organizations and organization members
- Locations
- Donation milestones
- Donation certificates
- Reviews
- Reports and moderation
- Conversations
- Realtime messaging
- Realtime notifications
- Media uploads
- Donor-support payments
- Administrative user management

---

# 🏗️ Architecture

Blood AidX follows a modular service-oriented backend architecture.

```text
                         Blood AidX API
                              │
              ┌───────────────┴───────────────┐
              │                               │
          REST API                         Socket.IO
              │                               │
              └───────────────┬───────────────┘
                              │
                         Middleware
                              │
                         Controllers
                              │
                           Services
                              │
                ┌─────────────┴─────────────┐
                │                           │
             Prisma                       Redis
                │
           PostgreSQL
```
````

### HTTP request flow

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

### Realtime flow

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

Socket.IO is a transport layer. Business rules remain inside services and are shared with the REST API.

---

# 🧰 Tech Stack

| Category         | Technology               |
| ---------------- | ------------------------ |
| Runtime          | Node.js 24               |
| Language         | TypeScript               |
| Framework        | Express 5                |
| API              | REST                     |
| Realtime         | Socket.IO                |
| Database         | PostgreSQL               |
| ORM              | Prisma ORM 8             |
| Validation       | Zod 4                    |
| Cache            | Redis                    |
| Authentication   | Database-backed sessions |
| OAuth            | Google OAuth             |
| Email            | Nodemailer               |
| Media            | Cloudinary               |
| Payments         | Stripe                   |
| Password Hashing | bcrypt                   |
| Build            | tsup                     |
| Runtime Dev      | tsx                      |
| Linting          | oxlint                   |
| Deployment       | Node.js / Vercel         |

The current package configuration targets Node.js 24 and uses Prisma ORM 8 RC, Express 5, Socket.IO, Redis, Stripe, Cloudinary, Zod, and related infrastructure.

---

# 📦 Core Modules

```text
src/
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
│   ├── notification/
│   ├── payment/
│   └── upload/
│
├── config/
├── lib/
│   ├── db/
│   └── redis/
│
├── middleware/
├── socket/
├── utils/
├── app.ts
└── server.ts
```

A typical module follows:

```text
module/
├── module.route.ts
├── module.controller.ts
├── module.service.ts
├── module.schema.ts
└── module.validation.ts
```

This keeps:

- HTTP routing in routers
- Request parsing in controllers
- Business rules in services
- Input validation in schemas
- Database access in services
- Authentication and authorization in middleware

---

# 🔐 Authentication

Blood AidX uses database-backed sessions instead of making JWT the primary authentication mechanism.

```text
Client
  │
  │ session cookie
  ▼
Express
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

The same authentication model is used by REST and Socket.IO.

## Supported authentication

- Email/password signup
- Email/password signin
- Email verification
- Resend verification code
- Forgot password
- Password reset
- Password change
- Logout
- Session management
- Google OAuth
- Banned-account protection
- Active-user validation

---

# 👤 User Roles

The current global user roles are:

```text
user
moderator
admin
```

### `user`

Regular platform users can:

- Maintain their profile
- Create donor profiles
- Search donors
- Create blood requests
- Respond to blood requests
- Manage their donations
- Participate in conversations
- Send messages
- Submit reports
- Write reviews
- Manage notifications

### `moderator`

Moderators can perform platform moderation operations such as:

- Review reports
- Moderate messages
- Moderate user-generated content
- Manage reported resources

### `admin`

Administrators have platform-level administrative capabilities including:

- User administration
- Moderation
- Report management
- Administrative workflows

---

# 🏢 Organization Roles

Organization membership is separate from the global user role.

A user remains:

```text
User.role = user
```

while their organization membership can have:

```text
admin
staff
verifier
```

This separation allows the same person to participate in organizations without turning organization membership into a global application role.

---

# 🩸 Blood Donation Workflow

The main domain workflow is:

```text
User
 │
 ├── Donor Profile
 │
 └── Blood Request
          │
          ▼
   Blood Request Response
          │
          ▼
       Donation
          │
          ├── Verification
          │
          ├── Milestone
          │
          └── Certificate
```

The backend supports:

- Donor profiles
- Blood groups
- Donor availability
- Eligibility tracking
- Donation history
- Blood requests
- Request responses
- Donation verification
- Donation cancellation
- Donation certificates
- Donation milestones

---

# 🧑‍🩸 Donors

Donor profiles contain information required for donor discovery and donation management.

Supported concepts include:

- Blood group
- Availability
- Donation history
- Total donations
- Eligibility
- Eligibility check timestamps
- Public donor profile
- Private donor management

Example blood groups:

```text
a_positive
a_negative
b_positive
b_negative
ab_positive
ab_negative
o_positive
o_negative
```

Donor availability:

```text
available
unavailable
temporarily_unavailable
```

---

# 🚨 Blood Requests

Blood requests allow users to request blood based on:

- Blood group
- Required units
- Priority
- Location
- Patient information
- Hospital information
- Required date
- Expiration date
- Description

Priority levels:

```text
low
high
urgent
```

Request lifecycle:

```text
open
  │
  ├── partially_fulfilled
  │
  ├── fulfilled
  │
  ├── cancelled
  │
  └── expired
```

---

# 🤝 Blood Request Responses

Donors can respond to blood requests.

Response lifecycle:

```text
pending
   │
   ├── accepted
   │      │
   │      └── completed
   │
   ├── declined
   │
   └── cancelled
```

Response access is protected by resource ownership and authorization rules.

A blood request owner can view responses to their request, while the responding donor can access their own response.

---

# 🩸 Donations

Donation records track actual blood donations.

A donation can contain:

- Donor
- Blood request
- Organization
- Location
- Donation number
- Blood group
- Units
- Donation date
- Status
- Verification information
- Rejection reason
- Notes

Donation lifecycle:

```text
pending
   │
   ├── verified
   │
   ├── rejected
   │
   └── cancelled
```

Verified donations can contribute to:

- Donation history
- Donation statistics
- Milestones
- Certificates

---

# 🏥 Organizations

Organizations represent entities such as:

```text
hospital
blood_bank
clinic
ngo
other
```

Organization status:

```text
pending
active
verified
suspended
rejected
```

Organizations support:

- Ownership
- Location
- Verification
- Members
- Organization roles
- Donations
- Reviews
- Public discovery

Organization members have:

```text
admin
staff
verifier
```

---

# 📍 Locations

Locations provide reusable location information for:

- Users
- Donors
- Blood requests
- Donations
- Organizations

Locations are also used by resource discovery and geographic workflows.

---

# 🏆 Milestones

Blood AidX supports donation milestones for recognizing donor activity.

Milestones can be based on donation counts and can be associated with users through milestone records.

Typical workflow:

```text
Verified Donation
       │
       ▼
Donation Count
       │
       ▼
Milestone Evaluation
       │
       ▼
User Milestone
```

---

# 📜 Certificates

Donation certificates provide recognition for completed and verified donations.

Certificates are associated with donation records and can be used to provide donors with formal donation recognition.

---

# ⭐ Reviews

Reviews allow users to provide feedback about:

- Users
- Organizations

Reviews support:

```text
pending
published
hidden
rejected
```

Public review queries only expose published reviews.

Reviews include:

- Rating
- Comment
- Reviewer
- Review target
- Organization
- Status
- Timestamps

---

# 🚩 Reports

Blood AidX includes a moderation/reporting system for platform resources.

Supported report types:

```text
user
blood_request
donation
organization
message
review
```

Report lifecycle:

```text
pending
   │
   ▼
reviewing
   │
   ├── resolved
   │
   └── rejected
```

## User report workflow

Authenticated and verified users can report eligible resources.

A user cannot report themselves.

## Message reports

Message reports require the reporter to belong to the message's conversation.

## Donation reports

A donation can be reported by:

- The donor
- The owner of the related blood request

## Duplicate active reports

The service prevents the same reporter from creating another active report for the same target while an earlier report is still:

```text
pending
```

or:

```text
reviewing
```

Once a report is finalized, another report can be submitted later if necessary.

## Report moderation

Moderators and administrators can transition reports through valid states:

```text
pending → reviewing

reviewing → resolved
reviewing → rejected
```

Finalized reports cannot be reopened through the normal status API.

---

# 💬 Conversations

Conversations provide persistent communication between users.

Supported conversation types include:

```text
direct
blood_request
organization
```

Conversation access is based on membership.

Typical endpoints:

```text
GET    /api/v1/conversations
POST   /api/v1/conversations

GET    /api/v1/conversations/:conversationId

POST   /api/v1/conversations/:conversationId/participants
DELETE /api/v1/conversations/:conversationId/participants/:userId

POST   /api/v1/conversations/:conversationId/leave
```

---

# 💬 Messages

Messages belong to conversations.

Supported operations include:

```text
POST   /api/v1/messages

GET    /api/v1/messages/conversation/:conversationId

GET    /api/v1/messages/:messageId

PATCH  /api/v1/messages/:messageId

DELETE /api/v1/messages/:messageId

PATCH  /api/v1/messages/:messageId/read

PATCH  /api/v1/messages/conversation/:conversationId/read

GET    /api/v1/messages/conversation/:conversationId/unread-count
```

Messages support:

- Editing
- Deletion
- Read state
- Conversation membership authorization
- Sender ownership authorization
- Moderation deletion

Message history uses cursor pagination.

---

# 🔔 Notifications

Notifications use a persistent-first architecture.

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
      │         notification:new
      │
      ▼
Persistent Notification
```

The database remains the source of truth.

Supported operations include:

```text
GET    /api/v1/notifications
GET    /api/v1/notifications/unread
GET    /api/v1/notifications/unread-count

PATCH  /api/v1/notifications/:notificationId/read
PATCH  /api/v1/notifications/read-all

DELETE /api/v1/notifications/:notificationId
DELETE /api/v1/notifications/read
```

This means offline users do not lose notifications.

---

# ⚡ Socket.IO

Socket.IO provides realtime communication on the same HTTP server as Express.

```text
Node HTTP Server
       │
       ├── Express REST API
       │
       └── Socket.IO
```

There is no separate Socket.IO application server in the current architecture.

---

# 🔑 Socket Authentication

Socket authentication uses the same database-backed session system.

The server authenticates the Socket.IO handshake using the session cookie.

After authentication:

```ts
socket.data.user = {
  id: user.id,
  role: user.role,
};
```

The authenticated socket identity is authoritative.

Client-provided identity values are never trusted for sensitive operations.

---

# 🚪 Socket Rooms

## User room

```text
user:<userId>
```

Used for private notifications.

## Conversation room

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

# 📬 Realtime Message Flow

```text
Authenticated Socket
        │
        ▼
conversation:join
        │
        ▼
Verify Conversation Membership
        │
        ▼
Join Conversation Room
        │
        ▼
message:send
        │
        ▼
Validate Payload
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

The key rule is:

> **Socket.IO never bypasses the service layer.**

REST and Socket.IO use the same business rules.

---

# 💳 Payments

Blood AidX supports payment workflows for donor support.

Current payment infrastructure includes Stripe.

The donor coffee workflow allows an authenticated user to make a payment associated with a donor.

Payment concepts include:

```text
Payment
 ├── payer
 ├── donor
 ├── amount
 ├── currency
 ├── message
 ├── provider
 ├── type
 └── status
```

Payment statuses include:

```text
pending
processing
succeeded
failed
cancelled
refunded
partially_refunded
```

Stripe webhook processing is handled separately from normal JSON request parsing so that Stripe signature verification can use the raw request body.

---

# ☁️ Media Uploads

Cloudinary is used for managed media storage and delivery.

The upload workflow supports managed assets such as:

- Profile images
- Organization images
- Other supported platform uploads

Uploaded media can be associated with Cloudinary public IDs so that assets can later be removed safely.

---

# 📧 Email

Nodemailer is used for transactional email workflows.

Email functionality supports authentication-related communication such as:

- Email verification
- Verification code delivery
- Password reset workflows

---

# 🔐 Authorization Model

Authorization is evaluated at multiple levels.

```text
Authenticated User
       │
       ▼
Verified / Active Account
       │
       ▼
Global Role
       │
       ▼
Organization Membership
       │
       ▼
Resource Ownership
```

Not every resource requires every level.

For example:

```text
Moderator/Admin
      │
      ▼
Report moderation
```

while:

```text
Conversation participant
      │
      ▼
Conversation messages
```

Resource ownership is checked independently where required.

---

# 🛡️ Protected API Pattern

Protected routes commonly use:

```ts
router.use(protect, requireActiveUser);
```

Operations that require a verified email additionally use:

```ts
requireVerifiedEmail;
```

Administrative operations use:

```ts
requireRole("moderator", "admin");
```

This creates a common authentication boundary before resource-specific authorization.

---

# 📡 API

All REST APIs are versioned under:

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
- Sessions
- Email verification
- Password reset
- Password change
- Google OAuth

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

Donor discovery and donor profile management.

---

## Blood Requests

```text
/api/v1/blood-requests
```

Blood request creation, discovery, and lifecycle management.

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

Donation records, history, cancellation, and verification.

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

Organizations, verification, members, and organization-related workflows.

---

## Locations

```text
/api/v1/locations
```

Location management and location-related operations.

---

## Milestones

```text
/api/v1/milestones
```

Donation milestones and user milestone records.

---

## Certificates

```text
/api/v1/certificates
```

Donation certificate management.

---

## Reports

```text
/api/v1/reports
```

Report submission and moderation.

### User report endpoints

```text
POST   /api/v1/reports
GET    /api/v1/reports/me
GET    /api/v1/reports/:reportId
DELETE /api/v1/reports/:reportId
```

### Moderator/Admin endpoints

```text
GET    /api/v1/reports
PATCH  /api/v1/reports/:reportId/status
```

---

## Reviews

```text
/api/v1/reviews
```

Review creation, discovery, moderation, and management.

---

## Conversations

```text
/api/v1/conversations
```

Conversation and participant management.

---

## Messages

```text
/api/v1/messages
```

Messaging and message moderation.

---

## Notifications

```text
/api/v1/notifications
```

Persistent and realtime notification management.

---

## Payments

```text
/api/v1/payments
```

Payment creation, history, and payment administration.

---

## Uploads

```text
/api/v1/uploads
```

Managed media upload operations.

---

# 📄 Pagination

Most list endpoints use offset pagination.

Typical query parameters:

```text
?page=1&limit=20
```

Typical response metadata:

```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPage": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

Message history uses cursor pagination because conversations can contain large numbers of messages.

---

# 🔎 Filtering and Sorting

Resource-specific list endpoints support appropriate filters and sorting.

Common parameters include:

```text
page
limit
sortBy
sortOrder
status
type
createdAtFrom
createdAtTo
```

The API validates query parameters using Zod before they reach the service layer.

---

# ✅ Validation

Request validation is implemented with Zod.

Example:

```ts
const CreateMessageSchema = z
  .object({
    conversationId: z.uuid(),
    content: z.string().trim().min(1).max(5000),
  })
  .strict();
```

The API validates:

- Request bodies
- Query parameters
- Route parameters
- Authentication inputs
- Resource-specific business input

Strict schemas help prevent unexpected fields from silently entering the application.

---

# 🗄️ Database

Blood AidX uses PostgreSQL with Prisma ORM.

```text
TypeScript
    │
    ▼
 Prisma ORM
    │
    ▼
PostgreSQL
```

The database contains entities for:

```text
Users
Profiles
Donors
Blood Requests
Request Responses
Donations
Organizations
Organization Members
Locations
Milestones
Certificates
Reviews
Reports
Conversations
Participants
Messages
Notifications
Payments
Sessions
Accounts
Audit Logs
```

---

# 🧬 Database Design Principles

The schema uses relational constraints and indexes for important access patterns.

Examples include:

- Unique user email
- Unique donor profile per user
- Unique request/donor response
- Unique organization slug
- Unique donation number
- Conversation membership uniqueness
- Indexed foreign keys
- Indexed status fields
- Indexed date fields
- Composite indexes for common discovery queries

Referential actions are used to preserve appropriate ownership semantics.

---

# 🧠 Prisma ORM 8

This project uses the Prisma ORM 8 toolchain.

Common project database commands are exposed through npm scripts.

```bash
npm run contract:emit
npm run db:update
npm run db:verify
npm run db:schema
npm run migration:plan
npm run migration:status
npm run db:migrate
```

The project intentionally uses the current Prisma ORM 8 workflow rather than relying on older Prisma Client patterns.

---

# 🌐 CORS

Frontend/client origins are configured through:

```env
ORIGIN_URLS=
```

Because authentication uses cookies, credentials are enabled for approved origins.

The same origin policy is applied to:

```text
Express
Socket.IO
```

Never use a wildcard origin when credentialed cookies are enabled.

---

# 🔧 Environment Variables

Create a local environment file and configure the required values.

Example:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=
REDIS_URL=

ORIGIN_URLS=http://localhost:3000

SESSION_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Additional variables may be required depending on the enabled deployment and integration configuration.

> Never commit `.env` files or production credentials to source control.

---

# 🚀 Getting Started

## Requirements

Recommended environment:

```text
Node.js 24.x
PostgreSQL
Redis
npm
```

Verify Node:

```bash
node --version
```

The project currently targets Node.js 24.x.

---

## 1. Clone the repository

```bash
git clone git@github.com:devpolas/blood-aidx-api.git
```

```bash
cd blood-aidx-api
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment

Create:

```text
.env
```

and configure:

```env
DATABASE_URL=
REDIS_URL=
SESSION_SECRET=
ORIGIN_URLS=
```

plus the credentials required for Google OAuth, Cloudinary, Stripe, and email services.

---

## 4. Prepare PostgreSQL

Create a PostgreSQL database and provide its connection string through:

```env
DATABASE_URL=
```

---

## 5. Prepare Redis

Start Redis locally or use a managed Redis provider.

Configure:

```env
REDIS_URL=
```

---

## 6. Prepare the database

Generate/emit the database contract:

```bash
npm run contract:emit
```

Then use the appropriate database workflow:

```bash
npm run db:update
```

You can inspect database status with:

```bash
npm run db:verify
```

---

# 🏃 Development

Start the development server:

```bash
npm run start:dev
```

The server runs using `tsx watch`.

---

# 🏗️ Build

Create the production build:

```bash
npm run build
```

The compiled entry point is:

```text
dist/server.js
```

---

# ▶️ Production

Start the compiled server:

```bash
npm start
```

or:

```bash
npm run start:prod
```

---

# 🧪 Verification

Run TypeScript checking:

```bash
npm run typecheck
```

Run linting:

```bash
npm run lint
```

Automatically fix supported lint issues:

```bash
npm run lint:fix
```

Run the complete verification pipeline:

```bash
npm run verify
```

The verification pipeline performs:

```text
Typecheck
   ↓
Lint
   ↓
Build
```

The current package scripts expose these commands directly.

---

# 🧪 Testing Strategy

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
Realtime Tests
```

Important security scenarios include:

- Unauthorized requests
- Invalid sessions
- Expired sessions
- Unverified accounts
- Banned users
- Resource ownership violations
- Conversation membership violations
- Message ownership violations
- Invalid report targets
- Invalid report status transitions
- Moderator/admin authorization
- Invalid payment/webhook requests

---

# 🛑 Graceful Shutdown

The server handles:

```text
SIGTERM
SIGINT
```

Shutdown flow:

```text
Stop accepting new connections
          ↓
Close HTTP server
          ↓
Close Socket.IO
          ↓
Close Redis
          ↓
Close PostgreSQL
          ↓
Exit process
```

Startup failures also attempt to clean up initialized resources.

---

# 📈 Scaling Strategy

## Current architecture

```text
             Node.js
                │
       ┌────────┴────────┐
       │                 │
    Express          Socket.IO
       │                 │
       └────────┬────────┘
                │
          PostgreSQL
                │
              Redis
```

This architecture is suitable for a single application instance.

---

## Multi-instance architecture

The system can evolve toward:

```text
                  Load Balancer
                       │
             ┌─────────┴─────────┐
             │                   │
        Backend #1          Backend #2
             │                   │
             └─────────┬─────────┘
                       │
                     Redis
                       │
              Socket.IO Adapter
                       │
                  PostgreSQL
```

For multiple Socket.IO instances, a Redis adapter can be introduced:

```bash
npm install @socket.io/redis-adapter
```

Redis publisher/subscriber connections can then synchronize realtime events between application instances.

---

# ☁️ Deployment

The application is designed to run as a Node.js backend and can be deployed to platforms capable of running the application server.

The current production deployment uses Vercel:

```text
https://blood-aidx-api.vercel.app
```

Production environments must provide the required:

- PostgreSQL connection
- Redis connection
- Session secret
- CORS origins
- Google OAuth credentials
- Cloudinary credentials
- Stripe credentials
- Email credentials

---

# 🔒 Security Principles

Blood AidX follows several important security principles.

### 1. Never trust client identity

Sensitive operations derive identity from the authenticated session.

```ts
socket.data.user.id;
```

rather than a client-provided `userId`.

### 2. Validate every request

Input passes through Zod schemas before entering business logic.

### 3. Check ownership

Resources are only accessible to users who have the required relationship with them.

### 4. Separate global and organization roles

Organization membership does not change a user's global application role.

### 5. Verify email where required

Sensitive workflows require an active and verified account.

### 6. Protect moderation endpoints

Moderation operations require:

```text
moderator
admin
```

authorization.

### 7. Persist important notifications

Realtime delivery never replaces database persistence.

---

# 🧭 API Domain Map

```text
                         Blood AidX
                             │
             ┌───────────────┼────────────────┐
             │               │                │
           Auth            Users          Profiles
             │
     ┌───────┴────────┐
     │                │
   Donors       Blood Requests
                      │
                      ▼
              Request Responses
                      │
                      ▼
                  Donations
                   │      │
                   │      ├── Milestones
                   │      └── Certificates
                   │
             Organizations
                   │
                Locations

     Reports ─── Reviews ─── Moderation

     Conversations
          │
       Messages
          │
      Socket.IO

     Notifications
          │
      Socket.IO

       Payments
          │
        Stripe
```

---

# 🧩 Engineering Principles

## 1. Service-first business logic

Business rules belong in services rather than controllers or Socket.IO event handlers.

---

## 2. Thin controllers

Controllers should primarily:

```text
Parse
Validate
Call Service
Send Response
```

---

## 3. Shared business rules

REST and Socket.IO use the same services and authorization logic.

---

## 4. Resource-level authorization

Access decisions consider the actual relationship between the authenticated user and the resource.

```text
Global Role
+
Organization Membership
+
Resource Ownership
```

where applicable.

---

## 5. Persistent-first notifications

PostgreSQL is the source of truth.

Socket.IO provides realtime delivery.

---

## 6. Session-based identity

The authenticated session determines the current user.

---

## 7. Realtime is an additional transport

Socket.IO enhances the REST backend rather than replacing it.

---

## 8. Explicit state transitions

Important resources use controlled lifecycle transitions.

For example:

```text
Report:

pending
  ↓
reviewing
  ↓
resolved / rejected
```

This prevents arbitrary state changes.

---

## 9. Resource-specific validation

Schemas remain focused on their own resource instead of relying on large generic validation systems.

---

# 📁 Repository Structure

```text
blood-aidx-api/
│
├── src/
│   ├── config/
│   │
│   ├── lib/
│   │   ├── db/
│   │   └── redis/
│   │
│   ├── middleware/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── profile/
│   │   ├── donor/
│   │   ├── blood-request/
│   │   ├── blood-request-response/
│   │   ├── donation/
│   │   ├── user-admin/
│   │   ├── organization/
│   │   ├── location/
│   │   ├── milestone/
│   │   ├── certificate/
│   │   ├── report/
│   │   ├── review/
│   │   ├── conversation/
│   │   ├── message/
│   │   ├── notification/
│   │   ├── payment/
│   │   └── upload/
│   │
│   ├── socket/
│   │   ├── socket.server.ts
│   │   ├── socket.auth.ts
│   │   ├── socket.types.ts
│   │   ├── socket.rooms.ts
│   │   ├── socket.events.ts
│   │   └── socket.emitter.ts
│   │
│   ├── utils/
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   └── contract.prisma
│
├── postman/
│   └── generate-postman.ts
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

# 🔌 API Base URL

Development:

```text
http://localhost:<PORT>/api/v1
```

Production:

```text
https://blood-aidx-api.vercel.app/api/v1
```

---

# 📚 API Documentation

The API is versioned under:

```text
/api/v1
```

The main resource groups are:

```text
/auth
/users
/profiles
/donors
/blood-requests
/blood-request-responses
/donations
/admin/users
/organizations
/locations
/milestones
/certificates
/reports
/reviews
/conversations
/messages
/notifications
/uploads
/payments
```

---

# 🧰 NPM Scripts

| Command                    | Purpose                         |
| -------------------------- | ------------------------------- |
| `npm run start:dev`        | Start development server        |
| `npm run build`            | Build production bundle         |
| `npm start`                | Start production server         |
| `npm run typecheck`        | TypeScript validation           |
| `npm run lint`             | Run oxlint                      |
| `npm run lint:fix`         | Fix supported lint issues       |
| `npm run check`            | Typecheck + lint                |
| `npm run verify`           | Typecheck + lint + build        |
| `npm run contract:emit`    | Emit database contract          |
| `npm run db:update`        | Update database                 |
| `npm run db:verify`        | Verify database                 |
| `npm run db:schema`        | Inspect database schema         |
| `npm run migration:plan`   | Plan migration changes          |
| `npm run migration:status` | Check migration status          |
| `npm run db:migrate`       | Run database migration workflow |
| `npm run generate:postman` | Generate Postman collection     |

---

# 🤝 Contributing

Contributions are welcome.

Before submitting changes:

```bash
npm install
npm run verify
```

Please keep changes:

- Focused
- Type-safe
- Validated
- Resource-specific
- Consistent with the existing service architecture
- Compatible with the current Prisma ORM API

For new API resources, follow the existing module structure:

```text
route
  ↓
controller
  ↓
schema
  ↓
service
  ↓
database
```

---

# 📝 Development Guidelines

When adding an endpoint:

1. Define the route.
2. Define request validation.
3. Add controller logic.
4. Implement business rules in the service.
5. Apply authentication middleware.
6. Apply authorization rules.
7. Add appropriate database indexes.
8. Return a consistent API response.
9. Add pagination for collection endpoints where appropriate.
10. Run:

```bash
npm run verify
```

---

# 📜 API Versioning

The current API version is:

```text
/api/v1
```

Versioning provides a stable namespace for future API evolution.

Future breaking API changes can be introduced under:

```text
/api/v2
```

without immediately breaking existing clients.

---

# 🎯 Project Mission

Blood AidX exists to provide reliable infrastructure for:

```text
Finding donors
      +
Managing blood requests
      +
Coordinating donations
      +
Connecting people
      +
Communicating in realtime
      +
Tracking donation history
      +
Supporting organizations
      +
Moderating the platform
```

The backend is intentionally designed so that authentication, authorization, business logic, persistence, REST APIs, realtime communication, notifications, and integrations remain independently maintainable while working together as one platform.

---

# 👨‍💻 Author

**Polas Chandra Barmon**

GitHub:

[https://github.com/devpolas](https://github.com/devpolas)

Project:

[https://github.com/devpolas/blood-aidx-api](https://github.com/devpolas/blood-aidx-api)

---

# 📄 License

This project is currently maintained as the Blood AidX backend project.

See the repository for the latest licensing and contribution information.

```

A couple of important corrections from the old README are intentional:

- **Roles are now `user`, `moderator`, `admin`**, rather than the old donor/recipient/volunteer/hospital/blood-bank global-role model.
- **Organization membership is separate** with `admin`, `staff`, and `verifier`.
- **Prisma commands use the project's current Prisma ORM 8 scripts**, rather than the old `prisma generate` / `prisma migrate dev` examples.
- **Reports now document the actual moderation lifecycle** and report types.
- **Messages use cursor pagination**, while normal collections use offset pagination.
- **Stripe is documented as the current payment integration** rather than presenting SSLCommerz as an implemented dependency—the current `package.json` explicitly includes Stripe but not an SSLCommerz package. :contentReference[oaicite:4]{index=4}
- The README keeps Socket.IO, Redis, persistent notifications, Cloudinary, OAuth, and the modular service architecture from the previous README because those are still part of the repository architecture. :contentReference[oaicite:5]{index=5}

The repository's current package metadata also confirms the project is `blood-aidx-api` version `0.1.0`, authored by Polas Chandra Barmon, with Node `24.x` as its engine. :contentReference[oaicite:6]{index=6}

If you're replacing the existing file, I'd use this as the new `README.md` rather than trying to incrementally patch the old 1,275-line README.
```
