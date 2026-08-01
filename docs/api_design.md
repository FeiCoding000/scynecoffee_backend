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


### Request

    {
      "token": "firebase-auth-token"
    }


### Process

    Frontend

    ↓

    Google Authentication

    ↓

    Firebase Token

    ↓

    Backend Verification

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
        "isActive": true
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


### Response

    {
      "id": "123",
      "displayName": "Felix",
      "email": null,
      "googleEmail": "user@example.com",
      "role": "staff",
      "isActive": true
    }


---

## 4.2 User Activation


### Endpoint

    POST /users/activate


### Purpose

Activate a user account through an activation code.

This process links an external authentication identity with an application user when an authenticated Firebase identity is available.

If a matching Firebase identity or legacy Firebase profile exists, the backend maps Firebase UID, Google provider email and available name data into the application user.

If no matching Firebase user exists, the backend may create an application user manually using a user-visible display name. Display names are not unique.


### Request

    {
      "activationCode": "ABC123",
      "displayName": "Felix"
    }

`displayName` is required only when the backend cannot derive a display name from Firebase or existing profile data.


### Process

    User Login

    ↓

    Identity Verification

    ↓

    Firebase Identity / Profile Lookup

    ↓

    Map Existing User or Create Manual User

    ↓

    Activation Code Validation

    ↓

    User Activation

    ↓

    Application Access Enabled


### Response

    {
      "status": "activated"
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
        "name": "Flat White",
        "milk": "Full Cream",
        "strength": 1,
        "sugar": 0
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


### Request

    {
      "drinkConfigurationId": "001",
      "displayName": "Morning Coffee"
    }


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