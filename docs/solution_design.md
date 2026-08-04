# Solution Design

## 1. Overview

This document describes the proposed solution design for the ScyneCoffee Backend modernisation project.

The proposed solution introduces a backend service layer between frontend applications and data storage.

The purpose of this solution is to:

- Centralise authentication and authorization.
- Separate business logic from frontend applications.
- Provide stable backend APIs.
- Reduce direct dependency between frontend and Firebase.
- Enable future database migration.

The solution adopts an incremental migration approach to minimise disruption to the existing system.

## 2. Solution Objectives

### 2.1 Introduce Backend Service Layer

The system will introduce a backend application responsible for:

- Authentication verification.
- Authorization enforcement.
- Business logic processing.
- API management.
- Data access abstraction.

### 2.2 Improve Security Boundary

The backend will become the security boundary between client applications and data resources.

Responsibilities include:

- Verify user identity.
- Validate user permissions.
- Control access to protected resources.

### 2.3 Improve System Maintainability

The solution separates:

- Presentation layer.
- Business logic layer.
- Data access layer.

This allows independent evolution of each layer.

# 3. Target Architecture

## 3.1 Current Architecture

The current system allows the frontend application to directly communicate with Firebase.

Frontend Application

    |
    |

Firebase SDK

    |
    |

Firestore

Characteristics:

- Frontend directly accesses Firebase.
- Business logic exists mainly in frontend services.
- Firebase Rules provide data protection.

## 3.2 Target Architecture

Frontend Application

    |
    |

HTTP API

    |
    v

+----------------------+
| Backend Service |
| Authentication |
| Authorization |
| Business Logic |
+----------------------+

    |
    v

+------------------+
| Repository Layer |
+------------------+

    |
    v

Firebase / PostgreSQL

The backend becomes responsible for all business operations and data access.

# 4. Backend Layer Design

## 4.1 Controller Layer

### Responsibility

The Controller layer handles communication between frontend applications and backend services.

Responsibilities:

- Receive HTTP requests.
- Validate request input.
- Return API responses.

The Controller layer should not contain:

- Business rules.
- Database operations.

Flow:

HTTP Request

↓

Controller

↓

Service

---

## 4.2 Service Layer

### Responsibility

The Service layer contains business logic and application workflows.

Responsibilities:

- Execute business rules.
- Coordinate different operations.
- Manage application workflows.

Examples:

- User activation.
- Firebase identity binding during activation.
- Profile update after activation.
- Legacy Firestore user search by submitted display name.
- User-confirmed legacy preferred drink import from coupled Firestore `options`.
- Manual preferred drink creation when no matching legacy profile exists.
- Order status transition.
- Permission validation.

Flow:

Controller

↓

Service

↓

Repository

---

## 4.3 Repository Layer

### Responsibility

The Repository layer abstracts data access implementation.

Responsibilities:

- Communicate with data sources.
- Hide database-specific logic.
- Provide consistent data access interfaces.

Example:

Service

↓

Repository Interface

↓

+----------------------------+
| |
Firebase PostgreSQL Repository Repository

Benefits:

- Business logic does not depend on database implementation.
- Supports future database migration.
- Improves testability.

# 5. Authentication Design

## Current State

Authentication is handled mainly by Firebase Authentication on the frontend.

## Target State

Backend verifies user identity before allowing access to protected resources.

Authentication flow:

User

↓

Google Authentication

↓

Firebase ID Token

↓

Backend API

The frontend sends the Firebase ID token in the standard HTTP Authorization header:

    Authorization: Bearer <firebase-id-token>

For normal protected API requests, the backend verifies the Firebase ID token using Firebase Admin SDK standard verification. This validates the token signature, expiry, issuer and audience. The backend does not need to perform Firebase token revocation checking on every request.

For sensitive operations, such as account security changes or high-risk administrative actions, the backend may use stricter verification with token revocation checking.

↓

Token Verification

↓

Application User Lookup or Activation Binding

↓

Authenticated User Context

Legacy Firestore profile lookup is part of the post-activation profile setup workflow when migrating existing preferred drinks. The frontend submits a display name to a legacy-user search endpoint, and the backend uses that value only to search the legacy Firestore user collection. Saving the application user's `displayName` is handled by a separate current-user profile update endpoint. If no matching legacy profile exists, search returns `legacyUsers: []`; the user can then confirm the display name and add drinks manually through the preferred-drink endpoints.

↓

Business Operation

# 6. Authorization Design

## Objective

Centralise authorization within backend services.

Authorization flow:

API Request

↓

Authentication Guard

↓

Identify User

↓

Retrieve User Role

↓

Permission Validation

↓

Execute Operation

Examples:

- Admin manages users.
- Barista updates order status.
- Staff creates orders.

# 7. Data Access Strategy

## Migration Stage

During migration, backend services will access existing Firebase data.

The migration will not immediately replace Firebase.

Migration architecture:

Frontend

↓

Backend API

↓

Firebase

## Future State

After migration:

Frontend

↓

Backend API

↓

Repository Layer

↓

PostgreSQL

The frontend will no longer directly access data storage.

# 8. Migration Strategy Overview

## Phase 1 - Backend Authentication Introduction

Objective:

Move identity verification from frontend to backend.

Changes:

- Backend verifies authentication tokens.
- Introduce application user management.
- Bind Firebase UID and Google provider email to application users during activation.
- Activate users through activation codes before profile setup and legacy preferred drink migration.
- Store activation state directly on the User record using `isActivated` and `activatedAt`.
- Keep application email optional and separate from Google provider email.
- Existing Firebase operations continue.

## Phase 2 - Business API Migration

Objective:

Move business operations behind backend APIs.

Before:

Frontend

↓

Firebase

After:

Frontend

↓

Backend API

↓

Firebase

## Phase 3 - Domain Migration

Objective:

Migrate existing Firebase data structures into the new domain model.

Migration areas:

- User.
- Legacy Firestore user search by submitted display name.
- Preferred Drinks.
- Drink Configurations.
- Orders.
- Menu data.

## Phase 4 - Restrict Direct Firebase Access

Objective:

Make backend the only application access path.

Final architecture:

Frontend

↓

Backend

↓

Database

Firebase client access will be removed through security rules.

# 9. Design Principles

## Separation of Concerns

Each layer has a clear responsibility.

Frontend

Presentation Layer

↓

Controller

API Layer

↓

Service

Business Logic Layer

↓

Repository

Data Access Layer

↓

Database

Persistence Layer

## Incremental Migration

The system will evolve gradually without interrupting existing operations.

## Database Independence

Business logic should not depend on a specific storage technology.

The system should support future migration from Firebase to PostgreSQL.

# 10. Expected Benefits

## Security Improvement

- Centralised authentication.
- Backend-controlled authorization.
- Reduced direct client access.

## Maintainability Improvement

- Clear layer separation.
- Easier testing.
- Easier feature development.

## Scalability Improvement

- Support future business capabilities.
- Support additional clients.
- Support database migration.
