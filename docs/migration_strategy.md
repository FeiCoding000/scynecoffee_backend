# Migration Strategy

## 1. Overview

This document defines the migration strategy for modernising the ScyneCoffee system.

The migration approach focuses on incremental transformation rather than replacing the existing system at once.

The objective is to introduce backend services while maintaining system availability and reducing migration risks.

The migration strategy will gradually move responsibilities from the frontend application into backend services.


# 2. Migration Principles


## Incremental Migration

The system will be migrated step by step.

Each migration phase should provide a working system before moving to the next phase.


## Minimise Business Disruption

Existing users should continue to use the coffee ordering system during migration.


## Maintain Data Availability

Existing Firebase data will continue to be used during the transition period.


## Establish Backend as Security Boundary

The backend will gradually become the only trusted layer between users and data resources.


# 3. Current Architecture


The current system architecture:


    Frontend Application

            |

            |

      Firebase SDK

            |

            |

        Firebase


Characteristics:

- Frontend directly communicates with Firebase.
- Authentication logic exists mainly in frontend.
- Business logic is distributed in frontend services.
- Firebase security rules provide resource protection.


# 4. Target Architecture


The target architecture:


    Frontend Application

            |

            |

       Backend API

            |

            |

     Backend Service Layer

            |

            |

       Data Access Layer

            |

            |

   Firebase / PostgreSQL


Characteristics:

- Backend controls authentication.
- Backend controls authorization.
- Frontend communicates through APIs.
- Database implementation is hidden behind backend services.


# 5. Migration Phases


# Phase 1 - Backend Authentication Introduction


## Objective

Move identity verification responsibility from frontend to backend.


## Changes

Introduce:

- Backend authentication verification.
- Application user model.
- User authentication context.


## Migration Flow


    User

      |

      |

 Google Authentication

      |

      |

 Firebase ID Token

      |

      |

 Backend Verification

      |

      |

 Application User


## Existing Functionality

Frontend Firebase operations remain unchanged during this phase.


## Result

The system has backend-controlled identity verification while maintaining existing functionality.


---

# Phase 2 - User Management Introduction


## Objective

Introduce application user management and activation workflow.


## Changes

Introduce:

- User entity.
- Role entity.
- Activation code mechanism.


## User Activation Process


    User Google Login

          |

          |

 Firebase ID Token

          |

          |

 Backend Token Verification

          |

          |

 Activation Code Verification

          |

          |

 Create Application User
 Firebase UID
 Google Provider Email
 Display Name
 Role from Activation Code
 Status = ACTIVE
 isActivated = true
 activatedAt = current time

          |

          |

 Claim Activation Code

          |

          |

 Activate User


User activation is completed before legacy profile migration. A user should not be blocked from activation when no legacy Firebase profile exists.

Activation state is stored on the User record with `isActivated` and `activatedAt`, while activation code usage is tracked separately on the Activation Code record.


## Legacy Profile Migration

Existing Firebase user information will be reviewed and mapped after the application user has been activated.

The migration process should:

- Require an already activated application user.
- Query Firebase / Firestore legacy profile data by Firebase UID or Google provider email.
- Return legacy profile and preferred drink data for user confirmation before import.
- Preserve user preferences when legacy data exists.
- Map available legacy name fields into the user's display name only when the user confirms the import.
- Map legacy drink options into `DrinkConfiguration` and `PreferredDrink` records.
- Reuse existing drink configurations where repeated drink settings already exist.
- Allow users with no legacy profile to manually create preferred drinks after activation.


---

# Phase 3 - Backend API Migration


## Objective

Move business operations from frontend services into backend APIs.


## Before


    Frontend

        |

        |

     Firebase


## After


    Frontend

        |

        |

     Backend API

        |

        |

     Firebase


## Migration Targets

- User operations.
- Preferred drink operations.
- Order operations.


The frontend will gradually replace direct Firebase calls with backend API requests.


---

# Phase 4 - Domain Data Migration


## Objective

Transform existing Firebase data structures into the new domain model.


## User Migration


Current:


    User Profile

          +

    Drink Options


Target:


    User

    - Display Name
    - Optional Application Email
    - Optional Firebase UID
    - Optional Google Provider Email

          |

          |

    Preferred Drink

          |

          |

    Drink Configuration


## Drink Configuration Migration

Repeated drink settings should be extracted into reusable configurations.

Example:


Current:


    User A

    Flat White

    Full Cream

    Strength 1


    User B

    Flat White

    Full Cream

    Strength 1


Target:


    Drink Configuration

    Flat White

    Full Cream

    Strength 1


          |

          |

    Multiple Preferred Drinks


---

# Phase 5 - Firebase Access Restriction


## Objective

Remove direct frontend access to Firebase resources.


Final architecture:


    Frontend

        |

        |

     Backend API

        |

        |

      Database


Firebase security rules will be updated to restrict client-side access.

Only backend services using server-side credentials will access protected resources.


# 6. Future Database Migration


After backend services and domain models are stable, the system can migrate from Firebase to PostgreSQL.


Target:


    Backend Service

          |

          |

    Repository Layer

          |

          |

    PostgreSQL


The business layer should remain unchanged during database migration.