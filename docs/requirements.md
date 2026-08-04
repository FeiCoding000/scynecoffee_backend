# Software Requirements Specification (SRS)

## 1. Purpose

This document defines the functional and non-functional requirements for the ScyneCoffee Backend project.

The requirements are derived from the findings identified during the Discovery, Current State Assessment and Problem Statement phases.

The objective of this project is to introduce a backend service layer that improves security, maintainability and scalability while supporting a gradual migration from the existing frontend-centric architecture.

---

# 2. Scope

The backend system will provide centralized authentication, authorization and business APIs for the ScyneCoffee application.

The project will progressively replace direct frontend communication with Firebase without disrupting existing business operations.

---

# 3. Functional Requirements

## FR-01 Authentication

The system shall:

- authenticate users before granting access to protected resources.
- verify user identity on the backend.
- maintain authenticated user sessions.
- support multiple authentication providers.
- associate authenticated identities with application users.

---

## FR-02 User Management

The system shall:

- maintain application user records.
- support controlled user onboarding.
- support user activation.
- store user activation state directly on the application user record.
- maintain user profile information using a user-visible display name.
- allow display names to be non-unique.
- support optional application email binding for future email/password login.
- store Google provider email separately from optional application email.
- store external provider identity details separately from application profile data.
- support user lifecycle management.

---

## FR-03 Role-Based Authorization

The system shall:

- assign one or more roles to each user.
- enforce role-based access control.
- validate user permissions before protected operations.
- prevent unauthorized access to business resources.

---

## FR-04 Order Management

The system shall:

- provide backend APIs for order operations.
- support backend-controlled order processing.
- maintain order lifecycle states.

The order lifecycle shall support:

- Pending
- Accepted
- Making
- Completed
- Cancelled

---

## FR-05 Preferred Drink Management

The system shall:

- manage preferred drink configurations independently from user identity.
- allow users to maintain multiple preferred drinks.
- support reusable drink configurations.
- support coffee, tea, chai, chocolate, milk and other drink categories.
- support standardised options for milk, strength, sugar, sweetener, tea bag count, powder scoops, iced, extra hot and decaf.
- support manual preferred drink creation when no legacy Firebase profile exists.

---

## FR-06 Business APIs

The system shall:

- expose RESTful APIs for frontend applications.
- provide stable API contracts.
- validate request data before processing.
- return consistent response structures.

---

## FR-07 Legacy Data Support

The system shall:

- support migration of existing user information.
- support migration of existing preferred drink information.
- support coexistence with legacy Firebase data during migration.
- support binding Firebase identities to application users during activation.
- support setting the application user's activation state when activation succeeds.
- create an activated application user after successful Firebase identity and activation code verification.
- allow activated admin users to generate STAFF activation codes in `AAA000` format, with a maximum of 100 codes per request.
- start newly activated users with an empty preferred drink list.
- support updating the current application user's display name after activation.
- support searching legacy Firestore customer by a submitted display name without updating the application user.
- return matching legacy Firebase customer profiles as search candidates.
- allow users with no matching legacy Firebase profile to continue to manual preferred drink setup.
- require user confirmation of a selected legacy profile before importing legacy `options` into the new preferred drink model.

---

# 4. Non-Functional Requirements

## NFR-01 Security

The system shall:

- centralize authentication and authorization within backend services.
- prevent unauthorized access to protected resources.
- minimise direct client access to business data.

---

## NFR-02 Maintainability

The system shall:

- separate presentation, business and data access responsibilities.
- isolate business logic from persistence implementation.
- support modular application architecture.

---

## NFR-03 Scalability

The system shall:

- support additional user roles.
- support future business capabilities.
- allow replacement of the underlying data storage with minimal impact to business logic.

---

## NFR-04 Reliability

The system shall:

- support incremental migration without interrupting normal business operations.
- maintain compatibility with existing frontend functionality during migration.

---

## NFR-05 Performance

The system should:

- provide responsive API endpoints suitable for daily coffee ordering operations.
- minimise unnecessary data transfer between client and server.

---

# 5. Constraints

The project shall:

- integrate with the existing Firebase platform during the migration phase.
- preserve existing business functionality throughout the migration.
- support gradual adoption by existing users.

---

# 6. Assumptions

The following assumptions apply:

- Existing Firebase Authentication remains available during migration.
- Existing Firestore data remains accessible during migration.
- Existing frontend applications continue operating while backend capabilities are introduced incrementally.
- Google authentication normally provides a provider email, but the application user email remains optional to support future non-Google login options.

---

# 7. Out of Scope

The following items are outside the scope of the initial implementation:

- Full replacement of Firebase.
- Advanced reporting and analytics.
- Mobile application development.
- Multi-tenant support.
- High availability or multi-region deployment.
- Administrative dashboard enhancements unrelated to backend migration.

---

# 8. Requirements Traceability

| Problem ID                     | Requirement           |
| ------------------------------ | --------------------- |
| P-01 Frontend/Data Coupling    | FR-06, NFR-02         |
| P-02 Backend Authentication    | FR-01                 |
| P-03 Distributed Authorization | FR-03, NFR-01         |
| P-04 Coupled User Model        | FR-02, FR-05          |
| P-05 Simplified Order Workflow | FR-04                 |
| P-06 Lack of Backend Services  | FR-06, NFR-02, NFR-03 |
