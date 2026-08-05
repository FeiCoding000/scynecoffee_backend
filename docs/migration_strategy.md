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
Temporary Display Name
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
Preferred Drinks = empty

User activation creates the new application user and claims the activation code. At this point the user has no preferred drinks in PostgreSQL. Legacy preferred drink migration is a separate profile setup step after activation.

Activation state is stored on the User record with `isActivated` and `activatedAt`, while activation code usage is tracked separately on the Activation Code record.

## Profile Setup and Legacy Preferred Drink Migration

Existing Firestore user documents contain coupled profile data and drink `options`. After activation, the frontend asks the user to enter their name and searches legacy Firestore customer by that submitted display name.

Legacy user search is intentionally separate from application profile updates. The search endpoint only returns matching legacy candidates and does not update `users.displayName`, import `options`, or create preferred drinks.

Legacy preferred drink import must be user-confirmed. The backend must not automatically import legacy `options` when a matching legacy profile is found. The frontend displays the search results and the user selects the correct legacy profile before import.

The migration process should:

- Require an already activated application user for profile updates and legacy import.
- Use submitted `displayName` as the legacy Firestore customer lookup key in the search endpoint.
- Return `legacyUsers: []` when no legacy users match.
- Return a candidate list when one or more legacy users match, and do not import `options` yet.
- Update the application user's `displayName` through a separate current-user profile update endpoint after the user confirms the name.
- Import legacy drink `options` only after the user selects a specific legacy customer candidate.
- Reject legacy import when the current user already has preferred drinks, preventing duplicate imports and mixed manual/imported setup.
- Map selected legacy drink options into `DrinkConfiguration` and `PreferredDrink` records.
- Reuse existing drink configurations where repeated drink settings already exist.
- Allow users to skip legacy import and create preferred drinks manually later.

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
