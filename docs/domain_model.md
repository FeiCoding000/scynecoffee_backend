# Domain Model

## 1. Overview

This document defines the core business entities and relationships within the ScyneCoffee system.

The purpose of the domain model is to establish a clear understanding of the business concepts and separate them from the current technical implementation.

The domain model provides the foundation for:

- Backend service design
- API design
- Database migration
- Future system extensions

The domain model focuses on business responsibilities and relationships rather than database implementation details.

## 2. Domain Boundary

The ScyneCoffee system contains the following major domains:

- User Management
- Authentication and Authorization
- Drink Preference Management
- Order Management

High-level relationship:

```txt
                 Role
                  |
                  |
                User
        +---------+---------+
        |                   |
        |                   |
 Preferred Drink          Order
        |
        |
 Drink Configuration
```

## 3. User Domain

### Purpose

The User domain represents a person who can access and interact with the coffee ordering system.

The User entity represents application identity and business information.

Authentication provider details are separated from user profile information.

A user's profile name is represented by a display name. The display name is user-visible, may be duplicated across users, and does not need to be split into first name and last name.

Application email is optional and represents an email address the user may bind for future email/password login. Google provider email is stored separately because it comes from the external authentication provider and may not be the same as the application email.

User activation is represented directly on the User entity. `isActivated` indicates whether the account has completed activation, and `activatedAt` records when activation occurred.

### Responsibilities

The User domain manages:

- User profile information, including display name
- Optional application email binding
- Google provider email from Firebase Authentication
- User account status
- User activation state
- User role assignment
- Connection between external identity providers and application users

### Relationships

A User:

- Has one Role
- Can have multiple Preferred Drinks
- Can create multiple Orders

### Example

```txt
User

Display Name:
Felix

Google Email:
felix@example.com

Application Email:
Not bound

Role:
Staff

Status:
ACTIVE

Activated:
true

Preferred Drinks:
- Morning Coffee
- Afternoon Coffee
```

## 4. Authentication Domain

### Purpose

The Authentication domain manages user identity verification.

The system currently relies on Google Authentication through Firebase.

The backend will become responsible for validating user identity before accessing protected resources.

### Responsibilities

The Authentication domain manages:

- Verifying authentication tokens
- Identifying application users
- Looking up existing Firebase identity/profile data during onboarding
- Mapping external identity fields, such as Firebase UID and Google provider email, to the application user when available
- Establishing authenticated user context

### Relationship

```txt
External Identity Provider
(Google / Firebase)
        |
        |
Authentication Identity
        |
        |
Application User
```

## 5. Authorization Domain

### Purpose

The Authorization domain controls what actions users can perform.

### Role Concept

A user receives permissions based on assigned roles.

Initial roles:

- Admin
- Barista
- Staff

### Example Permissions

Admin:

- Manage users
- Manage activation codes
- Access all orders

Barista:

- View orders
- Update order status

Staff:

- Create orders
- View personal orders

## 6. Activation Code Domain

### Purpose

The Activation Code domain supports controlled user onboarding.

The system requires authorised users to activate their account before accessing application functionality.

### Responsibilities

The Activation Code domain manages:

- Generating activation codes
- Validating activation codes
- Tracking activation status
- Preventing code reuse

### Lifecycle

```txt
Generated
    ↓
Available
    ↓
Claimed
    ↓
Disabled
```

### Relationship

```txt
Activation Code
        |
        |
      User
```

## 7. Drink Configuration Domain

### Purpose

The Drink Configuration domain represents reusable drink definitions.

Drink settings are separated from users because multiple users may share identical drink configurations.

### Responsibilities

The Drink Configuration domain manages:

- Storing standard drink options
- Providing reusable drink definitions
- Avoiding duplicated drink configuration data

### Example

```txt
Drink Configuration

Flat White

Milk:
Full Cream

Strength:
1

Sugar:
0
```

### Relationship

```txt
Drink Configuration
          |
          |
          *
Preferred Drink
```

## 8. Preferred Drink Domain

### Purpose

The Preferred Drink domain represents a user's saved drink preferences.

The domain separates:

- Shared drink configuration
- User-specific preference

### Example

```txt
Drink Configuration:
Flat White
Full Cream Milk

Preferred Drink:
User: Felix
Display Name: Morning Coffee
```

### Responsibilities

The Preferred Drink domain manages:

- Linking users with preferred drinks
- Allowing users to customise drink names
- Storing personal drink preferences

### Relationship

```txt
User
 1
 |
 *
Preferred Drink
 *
 |
 1
Drink Configuration
```

## 9. Order Domain

### Purpose

The Order domain represents coffee ordering workflow.

### Responsibilities

The Order domain manages:

- Creating orders
- Tracking order lifecycle
- Managing order status transitions

### Order Lifecycle

```txt
Pending
   ↓
Accepted
   ↓
Making
   ↓
Completed
```

Alternative state:

```txt
Pending
   ↓
Cancelled
```

### Relationship

```txt
User
 1
 |
 *
Order
```

## 10. Domain Model Summary

The target domain model separates responsibilities:

```txt
Authentication
        |
        |
       User
        |
        +------------------------+
        |                        |
        |                        |
        Preferred Drink         Order
        |
        |
        Drink Configuration

       User
        |
        |
       Role
```

This separation provides:

- Clear business boundaries
- Reduced data coupling
- Better backend architecture
- Easier migration from Firebase to future database systems
