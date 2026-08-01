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
      "id": "123",
      "displayName": "Felix",
      "email": null,
      "googleEmail": "user@example.com",
      "role": "staff",
      "status": "ACTIVE",
      "isActivated": true
    }


---

## 4.2 User Activation


### Endpoint

    POST /users/activate


### Purpose

Activate a user account through an activation code.

This process verifies the Firebase ID token, links the authenticated Firebase identity with an application user, and claims the activation code.

User activation does not depend on legacy Firebase profile migration. Once the Firebase identity and activation code are valid, the backend creates and activates the application user using Firebase UID, Google provider email, display name and role from the activation code.

The user record stores activation explicitly with `isActivated = true` and `activatedAt` set to the activation time.

Legacy Firebase profile lookup and preferred drink migration happen after activation.


### Headers

    Authorization: Bearer <firebase-id-token>

### Request

    {
      "activationCode": "ABC123",
      "displayName": "Felix"
    }

`displayName` is the user-visible name for the application user. It is not unique and can be changed later.


### Process

    User Login

    ↓

    Identity Verification

    ↓

    Activation Code Validation

    ↓

    Create Application User

    ↓

    Set isActivated and activatedAt

    ↓

    Claim Activation Code

    ↓

    User Activation

    ↓

    Application Access Enabled


### Response

    {
      "status": "activated",
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


---

## 4.3 Preview Legacy Profile


### Endpoint

    GET /users/me/legacy-profile


### Purpose

Retrieve existing Firebase / Firestore profile data for the activated user so the frontend can show it for confirmation before import.

This endpoint does not create or update preferred drinks. It only returns legacy data when available.


### Authentication

Required.

    Authorization: Bearer <firebase-id-token>


### Response When Legacy Profile Exists

    {
      "status": "found",
      "profile": {
        "displayName": "Felix Deng",
        "googleEmail": "user@example.com"
      },
      "preferredDrinks": [
        {
          "displayName": "Morning Coffee",
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
        }
      ]
    }


### Response When No Legacy Profile Exists

    {
      "status": "not_found"
    }


---

## 4.4 Import Legacy Profile


### Endpoint

    POST /users/me/legacy-profile/import


### Purpose

Import confirmed legacy Firebase / Firestore profile data for the activated user.

The import process maps legacy preferred drink data into the new domain model:

    Legacy drink option
    → DrinkConfiguration
    → PreferredDrink

Repeated drink settings should reuse existing drink configurations where possible.


### Authentication

Required.

    Authorization: Bearer <firebase-id-token>


### Response

    {
      "status": "imported",
      "preferredDrinkCount": 2
    }


# 5. Role and Permission API


## 5.1 Get Current User Permissions


### Endpoint

    GET /users/me/permissions


### Purpose

Return available actions for the current user based on their role.


### Response

    {
      "role": "staff",
      "permissions": [
        "ORDER_CREATE",
        "ORDER_VIEW"
      ]
    }


# 6. Drink Configuration API


## 6.1 Get Drink Configurations


### Endpoint

    GET /drink-configurations


### Purpose

Retrieve available drink configurations.


### Response

    [
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


# 7. Preferred Drink API


## 7.1 Get User Preferred Drinks


### Endpoint

    GET /users/me/preferences


### Purpose

Retrieve saved drinks for the current user.


### Response

    [
      {
        "id": "001",
        "displayName": "Morning Coffee",
        "drinkConfigurationId": "001"
      }
    ]


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
      "orderId": "123",
      "status": "Pending"
    }


---

## 8.2 Get Orders


### Endpoint

    GET /orders


### Purpose

Retrieve orders according to user permissions.


### Access Rules

| Role | Access |
|---|---|
| Admin | All orders |
| Barista | Orders required for preparation |
| Staff | Own orders |


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