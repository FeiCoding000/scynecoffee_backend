# Domain Model
## 1. Overview

This document defines the core business entities and relationships within the ScyneCoffee system.

The purpose of the domain model is to establish a clear understanding of the business concepts and separate them from the current technical implementation.

The domain model provides the foundation for:

Backend service design.
API design.
Database migration.
Future system extensions.

The domain model focuses on business responsibilities and relationships rather than database implementation details.

## 2. Domain Boundary

The ScyneCoffee system contains the following major domains:

User Management
Authentication and Authorization
Drink Preference Management
Order Management

High-level relationship:

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
## 3. User Domain
Purpose

The User domain represents a person who can access and interact with the coffee ordering system.

The User entity represents application identity and business information.

Authentication provider details are separated from user profile information.

A user's profile name is represented by a display name. The display name is user-visible, may be duplicated across users, and does not need to be split into first name and last name.

Application email is optional and represents an email address the user may bind for future email/password login. Google provider email is stored separately because it comes from the external authentication provider and may not be the same as the application email.

Responsibilities

The User domain manages:

User profile information, including display name.
Optional application email binding.
User account status.
User role assignment.
Connection between external identity providers and application users.
Relationship

A User:

Has one Role.
Can have multiple Preferred Drinks.
Can create multiple Orders.

Example:

User

Display Name:
Felix

Role:
Staff

Preferred Drinks:
- Morning Coffee
- Afternoon Coffee
## 4. Authentication Domain
Purpose

The Authentication domain manages user identity verification.

The system currently relies on Google Authentication through Firebase.

The backend will become responsible for validating user identity before accessing protected resources.

Responsibilities
Verify authentication tokens.
Identify application users.
Look up existing Firebase identity/profile data during onboarding.
Map external identity fields, such as Firebase UID and Google provider email, to the application user when available.
Establish authenticated user context.

Relationship:

External Identity Provider

(Google / Firebase)

        |

        |

Authentication Identity

        |

        |

Application User
## 5. Authorization Domain
Purpose

The Authorization domain controls what actions users can perform.

Role Concept

A user receives permissions based on assigned roles.

Initial roles:

Admin

Barista

Staff

Example:

Admin

- Manage users
- Manage activation codes
- Access all orders


Barista

- View orders
- Update order status


Staff

- Create orders
- View personal orders
## 6. Activation Code Domain
Purpose

The Activation Code domain supports controlled user onboarding.

The system requires authorised users to activate their account before accessing application functionality.

Responsibilities
Generate activation codes.
Validate activation codes.
Track activation status.
Prevent code reuse.

Lifecycle:

Generated

↓

Available

↓

Claimed

↓

Disabled

Relationship:

Activation Code

        |

        |

      User
## 7. Drink Configuration Domain
Purpose

The Drink Configuration domain represents reusable drink definitions.

Drink settings are separated from users because multiple users may share identical drink configurations.

Responsibilities
Store standard drink options.
Provide reusable drink definitions.
Avoid duplicated drink configuration data.

Example:

Drink Configuration

Flat White

Milk:
Full Cream

Strength:
1

Sugar:
0

Relationship:

Drink Configuration

          |

          |

          *

Preferred Drink
## 8. Preferred Drink Domain
Purpose

The Preferred Drink domain represents a user's saved drink preferences.

The domain separates:

Shared drink configuration.
User-specific preference.

Example:

Drink Configuration:

Flat White

Full Cream Milk


Preferred Drink:

User:
Felix

Display Name:
Morning Coffee
Responsibilities
Link users with preferred drinks.
Allow users to customise drink names.
Store personal drink preferences.

Relationship:

User

 1

 |

 *

Preferred Drink

 *

 |

 1

Drink Configuration
## 9. Order Domain
Purpose

The Order domain represents coffee ordering workflow.

Responsibilities
Create orders.
Track order lifecycle.
Manage order status transitions.

Order lifecycle:

Pending

↓

Accepted

↓

Making

↓

Completed

Alternative state:

Cancelled

Relationship:

User

 1

 |

 *

Order
## 10. Domain Model Summary

The target domain model separates responsibilities:

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

This separation provides:

Clear business boundaries.
Reduced data coupling.
Better backend architecture.
Easier migration from Firebase to future database systems.