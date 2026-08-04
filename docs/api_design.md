# API Design

## 1. Overview

This document defines the API design for the ScyneCoffee backend system.

The API layer provides communication between frontend applications and backend services.

The purpose of introducing backend APIs is to:

- Remove direct frontend dependency on Firebase.
- Provide stable interfaces for frontend applications.
- Centralise authentication and authorization.
- Encapsulate business logic.
- Support future database migration.

The API follows RESTful design principles and communicates using JSON format.

The backend exposes Swagger/OpenAPI documentation for development and API testing:

    http://localhost:3000/api/docs

Swagger should include the available endpoints, request/response schemas and Bearer token authentication support.

# 2. API Design Principles

## Separation of Concerns

The API layer is responsible for:

- Receiving requests.
- Validating input.
- Returning responses.

Business logic should remain inside backend services.

## Security Boundary

All protected operations must pass through backend authentication and authorization checks.

The frontend should not directly access protected resources.

Authenticated requests should send the Firebase ID token using the standard HTTP Authorization header:

    Authorization: Bearer <firebase-id-token>

The token is the Firebase Authentication ID token obtained by the frontend after Google sign-in, for example by calling `currentUser.getIdToken()`. It is not the raw Google OAuth access token.

For normal protected API requests, the backend verifies the token with Firebase Admin SDK using standard ID token verification. Revocation checking is not required for every request. Sensitive operations may perform stricter verification with token revocation checking when needed.

## Database Independence

API consumers should not depend on:

- Firebase structure.
- PostgreSQL structure.
- Internal storage implementation.

The API represents business capabilities rather than database operations.

## Swagger / OpenAPI

The backend should generate Swagger/OpenAPI documentation from the NestJS application.

Swagger UI is available at:

    /api/docs

Protected endpoints should use Bearer authentication in Swagger so developers can test APIs with a Firebase ID token.

## Response Envelope

All successful API responses should use a consistent response envelope:

    {
      "data": {}
    }

For list responses:

    {
      "data": []
    }

For empty successful responses:

    {
      "data": null
    }

Business response examples in this document are returned inside the `data` field unless explicitly stated otherwise.

All API errors should use a consistent error envelope:

    {
      "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message"
      }
    }

The frontend should read business payloads from `response.data` and handle failures from `response.error`.

# 3. Authentication API

## 3.1 Verify Authentication Token

### Endpoint

    POST /auth/verify

### Purpose

Verify the user's authentication token and establish an authenticated application user context.

### Headers

    Authorization: Bearer <firebase-id-token>

### Request Body

No request body is required.

The `<firebase-id-token>` value is the Firebase Authentication ID token obtained by the frontend after Google sign-in, for example by calling `currentUser.getIdToken()`.

Normal verification uses Firebase Admin SDK ID token verification without revocation checking. APIs that perform sensitive account or administrative actions may additionally check whether the token has been revoked.

### Process

    Frontend

    ↓

    Google Authentication

    ↓

    Firebase ID Token

    ↓

    Backend Verification via Authorization Bearer Token

    ↓

    Application User Lookup

    ↓

    Authenticated Context

### Response

    {
      "data": {
        "user": {
          "id": "123",
          "displayName": "Felix",
          "email": null,
          "googleEmail": "user@example.com",
          "role": "staff",
          "status": "ACTIVE",
          "isActivated": true
        }
      }
    }

# 4. User API

## 4.1 Get Current User

### Endpoint

    GET /users/me

### Purpose

Retrieve information about the currently authenticated user.

### Authentication

Required.

    Authorization: Bearer <firebase-id-token>

### Response

    {
      "data": {
        "id": "123",
        "displayName": "Felix",
        "email": null,
        "googleEmail": "user@example.com",
        "role": "staff",
        "status": "ACTIVE",
        "isActivated": true
      }
    }

---

## 4.2 User Activation

### Endpoint

    POST /users/activate

### Purpose

Activate a user account through an activation code and create the new application user.

This process verifies the Firebase ID token, validates the activation code, creates the application user with the currently known identity information, sets the activation state, and claims the activation code.

Preferred drinks are not migrated during this step. The newly activated user's preferred drink list starts empty. Legacy Firestore profile lookup and drink option mapping happen in the profile setup step after activation.

### Headers

    Authorization: Bearer <firebase-id-token>

### Request

    {
      "activationCode": "ABC123"
    }

Identity fields such as Firebase UID, Google email and role are not accepted from the request body. The backend derives them from the verified Firebase token and the activation code. The user-facing `displayName` is saved later through the current-user profile update endpoint.

### Process

    User Login

    ↓

    Identity Verification

    ↓

    Activation Code Validation

    ↓

    Create Application User
    Firebase UID
    Google Provider Email
    Temporary Display Name
    Role from Activation Code
    Status = ACTIVE
    isActivated = true
    activatedAt = current time

    ↓

    Claim Activation Code

    ↓

    User Activation Complete

### Response

    {
      "data": {
        "status": "activated",
        "user": {
          "id": "123",
          "displayName": "Firebase User",
          "email": null,
          "googleEmail": "user@example.com",
          "role": "staff",
          "status": "ACTIVE",
          "isActivated": true
        }
      }
    }

---

## 4.3 Generate Activation Codes

### Endpoint

    POST /activation-codes/generate

### Purpose

Generate activation codes for onboarding users. Only activated admin users can call this endpoint.

Generated codes use this format:

    AAA000

That means three uppercase letters followed by three digits.

This endpoint only generates `STAFF` activation codes. `ADMIN` and `BARISTA` activation codes are not generated by this endpoint. Admin and barista accounts are managed manually by backend/development operations for now.

### Authentication

Required. Current application user must have role `ADMIN` and be activated.

    Authorization: Bearer <firebase-id-token>

### Request

    {
      "count": 10
    }

Fields:

- `count` is optional, defaults to `1`, minimum `1`, maximum `100`.
- Generated activation codes always have role `STAFF`.

### Response

    {
      "data": {
        "activationCodes": [
          {
            "id": "activation-code-1",
            "code": "ABC123",
            "role": "STAFF",
            "status": "AVAILABLE",
            "createdAt": "2026-08-04T00:00:00.000Z"
          }
        ]
      }
    }

### Errors

- `403 Forbidden` when the current user is not an activated admin.
- `400 Bad Request` when `count` is outside `1..100`.

---

## 4.4 Search Legacy Users by Display Name

### Endpoint

    POST /legacy-users/search

### Purpose

Search legacy Firestore customer profiles by a submitted display name.

After activation, the frontend asks the user to enter their name. Clicking search/confirm calls this endpoint. This endpoint only searches legacy Firestore customer. It does not update the application user's `displayName`, does not import preferred drinks, and does not create preferred drinks.

### Authentication

Required.

    Authorization: Bearer <firebase-id-token>

### Request

    {
      "displayName": "Felix"
    }

### Process

    Submit displayName

    ↓

    Search Legacy Firestore users by displayName

    ↓

    Return matching Legacy User Candidates

### Response When Legacy Profiles Exist

    {
      "data": {
        "legacyUsers": [
          {
            "legacyUserId": "legacy-user-1",
            "displayName": "Felix",
            "firstName": "Felix",
            "lastName": "Zhang",
            "preferredDrinkCount": 2
          },
          {
            "legacyUserId": "legacy-user-2",
            "displayName": "Felix",
            "firstName": "Felix",
            "lastName": "Wang",
            "preferredDrinkCount": 1
          }
        ]
      }
    }

### Response When No Legacy Profile Exists

    {
      "data": {
        "legacyUsers": []
      }
    }

The frontend decides the next step from `legacyUsers.length`. If the list is empty, show a no-match result and let the user confirm continuing to manual profile setup. If the list has items, display the candidates and let the user select one for import.

## 4.5 Update Current User Profile

### Endpoint

    PATCH /users/me/profile

### Purpose

Update the current application user's profile fields, including `displayName`.

This endpoint is used after the user confirms the display name. For the no-match path, the frontend calls this endpoint after showing the no-match result and before navigating to manual preferred-drink setup. For the legacy-import path, the frontend should also save the confirmed display name before or after importing the selected legacy profile.

### Authentication

Required.

    Authorization: Bearer <firebase-id-token>

### Request

    {
      "displayName": "Felix"
    }

### Response

    {
      "data": {
        "user": {
          "id": "123",
          "displayName": "Felix",
          "email": null,
          "googleEmail": "user@example.com",
          "role": "staff",
          "status": "ACTIVE",
          "isActivated": true
        }
      }
    }

## 4.6 Import Selected Legacy Profile

### Endpoint

    POST /users/me/profile/import-legacy

### Purpose

Import preferred drinks from a user-selected legacy Firestore profile.

This endpoint is called after legacy customer search returns candidates and the user selects the correct legacy profile. It uses the selected `legacyUserId` to load the legacy Firestore customer document, maps the selected legacy `options`, and writes new preferred drinks into PostgreSQL.

This endpoint does not search by display name and does not update the application user's `displayName`.

### Authentication

Required.

    Authorization: Bearer <firebase-id-token>

### Request

    {
      "legacyUserId": "legacy-user-1"
    }

### Process

    Activated User

    ↓

    Submit selected legacyUserId

    ↓

    Load Legacy Firestore user document

    ↓

    Map selected legacy options to DrinkConfiguration and PreferredDrink

    ↓

    Return Import Result

### Response

    {
      "data": {
        "status": "legacy_profile_imported",
        "user": {
          "id": "123",
          "displayName": "Felix",
          "email": null,
          "googleEmail": "user@example.com",
          "role": "staff",
          "status": "ACTIVE",
          "isActivated": true
        },
        "importedPreferredDrinkCount": 2
      }
    }

The backend should reuse existing drink configurations where possible. If the selected legacy customer has no importable `options`, the endpoint should succeed with `importedPreferredDrinkCount` set to `0`.

Legacy import is a one-time profile setup action. If the current user already has any preferred drinks, the backend rejects legacy import with `409 Conflict` to prevent duplicate imports or mixing manual drinks with imported legacy drinks.

---

# 5. Role and Permission API

## 5.1 Get Current User Permissions

### Endpoint

    GET /users/me/permissions

### Purpose

Return available actions for the current user based on their role.

### Response

    {
      "data": {
        "role": "staff",
        "permissions": [
          "ORDER_CREATE",
          "ORDER_VIEW"
        ]
      }
    }

# 6. Drink Configuration API

## 6.1 Get Drink Configurations

### Endpoint

    GET /drink-configurations

### Purpose

Retrieve available drink configurations.

### Response

    {
      "data": [
        {
          "id": "001",
          "category": "COFFEE",
          "drinkType": "Flat White",
          "milk": "FULL",
          "strength": "ONE",
          "sugar": "ZERO",
          "sweetener": "ZERO",
          "teaBagCount": null,
          "powderScoops": null,
          "iced": false,
          "xhot": false,
          "decaf": false
        },
        {
          "id": "002",
          "category": "CHOCOLATE",
          "drinkType": "Hot Chocolate",
          "milk": "FULL",
          "strength": null,
          "sugar": "ZERO",
          "sweetener": "ZERO",
          "teaBagCount": null,
          "powderScoops": "TWO",
          "iced": false,
          "xhot": false,
          "decaf": false
        }
      ]
    }

# 7. Preferred Drink API

## 7.1 Get User Preferred Drinks

### Endpoint

    GET /users/me/preferences

### Purpose

Retrieve saved drinks for the current user.

### Response

    {
      "data": [
        {
          "id": "001",
          "displayName": "Morning Coffee",
          "drinkConfigurationId": "001"
        }
      ]
    }

---

## 7.2 Create Preferred Drink

### Endpoint

    POST /users/me/preferences

### Purpose

Create a saved drink preference.

### Request With Existing Drink Configuration

    {
      "drinkConfigurationId": "001",
      "displayName": "Morning Coffee"
    }

### Request With New Drink Configuration

    {
      "displayName": "Morning Coffee",
      "drinkConfiguration": {
        "category": "COFFEE",
        "drinkType": "Flat White",
        "milk": "FULL",
        "strength": "ONE",
        "sugar": "ZERO",
        "sweetener": "ZERO",
        "iced": false,
        "xhot": false,
        "decaf": false
      }
    }

The backend should reuse an existing matching `DrinkConfiguration` when one already exists.

# 8. Order API

## 8.1 Create Order

### Endpoint

    POST /orders

### Purpose

Create a new coffee order.

### Request

    {
      "items": [
        {
          "drinkConfigurationId": "001"
        }
      ]
    }

### Response

    {
      "data": {
        "orderId": "123",
        "status": "Pending"
      }
    }

---

## 8.2 Get Orders

### Endpoint

    GET /orders

### Purpose

Retrieve orders according to user permissions.

### Access Rules

| Role    | Access                          |
| ------- | ------------------------------- |
| Admin   | All orders                      |
| Barista | Orders required for preparation |
| Staff   | Own orders                      |

---

## 8.3 Update Order Status

### Endpoint

    PATCH /orders/{id}/status

### Purpose

Update order workflow status.

### Request

    {
      "status": "Making"
    }

### Allowed Status Flow

    Pending

    ↓

    Accepted

    ↓

    Making

    ↓

    Completed

Cancelled orders:

    Pending

    ↓

    Cancelled

# 9. Authorization Rules

The backend must validate permissions before executing protected operations.

## Admin

Permissions:

    USER_MANAGEMENT

    ACTIVATION_CODE_GENERATE

    ROLE_MANAGEMENT

    ORDER_VIEW_ALL

## Barista

Permissions:

    ORDER_VIEW

    ORDER_UPDATE_STATUS

## Staff

Permissions:

    ORDER_CREATE

    ORDER_VIEW_OWN

# 10. API Error Handling

All API errors should follow a consistent response structure.

Example:

    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Invalid authentication token"
      }
    }

## Common Error Codes

### 400 Bad Request

Invalid request data.

### 401 Unauthorized

User authentication failed.

### 403 Forbidden

User does not have permission.

### 404 Not Found

Requested resource does not exist.

### 500 Internal Server Error

Unexpected server failure.

# 11. Future Extension

The API design should allow future expansion including:

- Reporting APIs.
- Analytics APIs.
- Menu management APIs.
- Notification services.
- Additional authentication providers.

The API layer should remain stable while internal implementation evolves.
