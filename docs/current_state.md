# Current State Assessment

## 1. Overview

The current ScyneCoffee system is a frontend-centric application that uses Firebase Authentication and Firestore as its primary identity and data platform.

The application is currently stable and operational for daily coffee ordering. However, several architectural limitations reduce maintainability, scalability and long-term extensibility.

This document describes the current implementation without proposing solutions.

---

# 2. System Architecture

## Current Architecture

```
+-------------+
|  Frontend   |
| (React/Vite)|
+------+------+
       |
       | Firebase SDK
       |
+------+-------+
| Firebase Auth|
+------+-------+
       |
       |
 +-----+-----+
 | Firestore |
 +-----------+
```

### Characteristics

- The frontend communicates directly with Firebase.
- Firebase Authentication manages user authentication.
- Firestore stores business data.
- No backend service layer exists.
- Business logic is primarily implemented in frontend services.

---

# 3. Authentication

## Current State

Users authenticate using Google Sign-In through Firebase Authentication.

After authentication:

- Firebase returns the authenticated user.
- The frontend stores user information in React Context.
- Frontend services communicate directly with Firestore.

### Observations

- User identity is verified by Firebase.
- Backend-controlled authentication does not exist.
- Session management is entirely frontend-driven.

---

# 4. Authorization

## Current State

Access control is primarily enforced through Firebase Security Rules.

Frontend components also perform client-side permission checks to determine available UI functionality.

### Observations

- Authorization logic is distributed between frontend code and Firebase Rules.
- Business permissions are not centrally managed.
- No application-level role management exists.

---

# 5. Data Access

## Current State

Frontend services communicate directly with Firestore using the Firebase SDK.

Typical request flow:

```
React Component
        │
        ▼
Frontend Service
        │
        ▼
Firebase SDK
        │
        ▼
Firestore
```

### Observations

- Business operations execute from the client.
- Database implementation is exposed to frontend applications.
- Data access is tightly coupled to Firebase.

---

# 6. User Data Model

## Current State

User profile information and drink preferences are stored within the same document.

Example:

```json
{
  "firstName": "Abc",
  "lastName": "Def",
  "options": [
    {
      "title": "Flat White",
      "milk": "Full Cream",
      "strength": 1
    }
  ]
}
```

During migration, legacy `firstName` and `lastName` values can be combined or transformed into the new application user's `displayName`.

### Observations

The user entity currently contains:

- Personal information
- Preferred drinks
- Ordering statistics

These responsibilities are tightly coupled within a single document.

---

# 7. Order Management

## Current State

Orders are stored in Firestore and managed directly by frontend services.

Current order workflow supports only basic completion tracking.

### Observations

- Order lifecycle is simplified.
- Workflow states cannot accurately represent the coffee preparation process.
- Business rules are implemented in frontend services.

---

# 8. Security

## Current State

Firebase Security Rules protect Firestore resources.

The frontend application contains Firebase configuration and communicates directly with Firestore.

### Observations

- Security depends heavily on Firebase Rules.
- No centralized backend security boundary exists.
- Client applications can directly request business resources.

---

# 9. Testing

## Current State

The existing application focuses primarily on functional implementation.

### Observations

- Limited automated testing.
- Business logic is coupled with frontend implementation.
- Independent backend testing is not possible.

---

# 10. Summary

The current system successfully delivers the required business functionality.

However, the assessment identified several architectural characteristics that may affect future development.

Key observations include:

- Frontend directly communicates with Firebase.
- Business logic is implemented in frontend services.
- Authentication is frontend-driven.
- Authorization is distributed between frontend and Firebase Rules.
- User profile and drink preferences are tightly coupled.
- The application currently has no backend service layer.