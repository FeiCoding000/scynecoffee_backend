# Implementation Roadmap

## 1. Overview

This document defines the implementation roadmap for the ScyneCoffee backend modernisation project.

The implementation will follow the solution design and migration strategy.

Development will be completed incrementally to reduce risk and maintain system availability.


# 2. Development Approach


The implementation follows these principles:

- Deliver functionality incrementally.
- Maintain existing system operation.
- Introduce backend capabilities gradually.
- Validate each migration step before proceeding.


# 3. Phase 0 - Project Foundation


## Objective

Establish backend project structure and development environment.


## Tasks

- Create backend project.
- Configure development environment.
- Define project structure.
- Setup environment variables.
- Setup logging.
- Setup testing framework.


## Deliverables

- Running backend application.
- Development workflow.
- Initial project documentation.


# 4. Phase 1 - Authentication Foundation


## Objective

Introduce backend-controlled authentication.


## Tasks

- Integrate Firebase Admin SDK.
- Verify Firebase authentication tokens.
- Create authentication module.
- Create authenticated user context.
- Provide current user API.


## Deliverables

- Backend can verify user identity.
- Frontend can communicate with backend authentication service.


# 5. Phase 2 - User Management


## Objective

Introduce application user management.


## Tasks

- Create User domain.
- Create Role domain.
- Create activation code mechanism.
- Implement user activation flow.
- Bind Firebase UID and Google provider email to application users during activation.
- Store user activation state with `isActivated` and `activatedAt`.
- Claim activation codes after successful activation.


## Deliverables

- Users can activate accounts.
- User identity is managed by backend.
- User activation does not depend on legacy Firebase profile migration.


# 6. Phase 3 - Authorization


## Objective

Introduce role-based access control.


## Tasks

- Implement role validation.
- Create authorization guards.
- Protect backend APIs.
- Define role permissions.


## Deliverables

Users can only access resources allowed by their role.


# 7. Phase 4 - Backend Business APIs


## Objective

Move business operations behind backend APIs.


## Tasks

### Preferred Drink API

- Create drink configuration model.
- Create preferred drink model.
- Create preferred drink endpoints.
- Separate drink configuration.


### Legacy Profile Import

- Query legacy Firebase / Firestore profile after user activation.
- Return legacy profile data for user confirmation.
- Map legacy preferred drink data into drink configurations and preferred drinks.
- Allow users without legacy profile data to create preferred drinks manually.


### Order API

- Create order endpoints.
- Implement order status workflow.
- Add permission validation.


## Deliverables

Frontend no longer requires direct Firebase access for migrated features.


# 8. Phase 5 - Data Model Migration


## Objective

Adopt the new domain model.


## Tasks

- Migrate legacy profile data for activated users.
- Extract drink configurations.
- Create preferred drink relationships.
- Validate migrated data.


## Deliverables

New domain model is populated and operational.


# 9. Phase 6 - Firebase Client Access Removal


## Objective

Complete backend transition.


## Tasks

- Remove frontend Firebase database access.
- Update Firebase security rules.
- Verify backend-only access.


## Deliverables

Backend becomes the only application data access layer.


# 10. Phase 7 - Future Improvements


Possible future enhancements:

- PostgreSQL migration.
- Analytics APIs.
- Reporting system.
- Automated testing expansion.
- Additional authentication providers.