# Problem Statement

## 1. Purpose

This document identifies the key architectural and operational challenges discovered during the Current State Assessment.

The objective is not to criticise the existing system, but to explain the limitations that impact future development and justify the need for system improvements.

---

# 2. Problem 1 – Tight Coupling Between Frontend and Data Layer

## Finding

The frontend application communicates directly with Firebase using the Firebase SDK.

Business operations such as user management and order processing are executed from client-side services.

## Impact

This architecture creates a strong dependency between the frontend application and the underlying data platform.

Consequences include:

- Business logic is difficult to centralise.
- Data storage cannot be replaced without frontend changes.
- Security policies depend heavily on client implementation.

## Business Need

Introduce a backend service layer to decouple business logic from the frontend application.

---

# 3. Problem 2 – Authentication Is Not Application Controlled

## Finding

User authentication is currently handled by Firebase Authentication.

The backend does not participate in user identity verification.

## Impact

The application cannot centrally manage authenticated users.

Consequences include:

- Limited control over application users.
- Difficult to introduce application-specific user management.
- User lifecycle is tightly coupled to Firebase Authentication.

## Business Need

Introduce backend-controlled user identity management.

---

# 4. Problem 3 – Authorization Is Distributed

## Finding

Authorization is enforced through a combination of frontend logic and Firebase Security Rules.

## Impact

Business permissions are implemented across multiple locations.

Consequences include:

- Permission management becomes difficult to maintain.
- Security logic is duplicated.
- Future role expansion becomes increasingly complex.

## Business Need

Centralise authorization within backend services.

---

# 5. Problem 4 – User Data Model Is Tightly Coupled

## Finding

User profile information and preferred drink configurations are stored within the same document.

## Impact

The user entity contains multiple unrelated responsibilities.

Consequences include:

- Difficult to extend user functionality.
- Preference management cannot evolve independently.
- Data migration becomes more complicated.

## Business Need

Separate user identity from user preference data.

---

# 6. Problem 5 – Business Workflow Is Simplified

## Finding

Order management currently supports only basic completion tracking.

## Impact

The order lifecycle cannot accurately represent the coffee preparation process.

Consequences include:

- Limited workflow visibility.
- Difficult to support future operational improvements.
- Business rules remain embedded in frontend logic.

## Business Need

Introduce backend-managed order lifecycle management.

---

# 7. Problem 6 – Backend Services Do Not Exist

## Finding

The application currently operates without a dedicated backend service layer.

## Impact

The frontend application is responsible for:

- Authentication flow
- Business logic
- Data access
- Communication with Firebase

This increases frontend complexity and reduces maintainability.

## Business Need

Introduce a dedicated backend application responsible for:

- Authentication
- Authorization
- Business logic
- API management
- Data access abstraction

---

# 8. Summary

The assessment identified several architectural limitations that affect maintainability, scalability and future system evolution.

The primary challenges are:

- Tight frontend-to-database coupling
- Decentralised authentication and authorization
- Tightly coupled user data model
- Simplified business workflow
- Absence of a backend service layer

These findings form the basis for the functional and non-functional requirements defined in the next phase.