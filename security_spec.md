# Security Specification: GriyaStay Indonesia

This document details the security model, access control invariants, and test specifications for the GriyaStay database in Firestore.

## 1. Data Invariants & Access Control Matrix

| Collection | Document ID | Read Permission | Write (Create) Permission | Write (Update) Permission | Write (Delete) Permission |
|------------|-------------|-----------------|---------------------------|---------------------------|---------------------------|
| `users` | `{userId}` | Owner Only | Owner Only | Owner Only (restricted fields) | Prohibited |
| `properties` | `{propertyId}` | Anyone (Public) | Authenticated, Verified Users | Owner Only (restricted fields) | Owner Only |

### Critical System Rules:
1. **User Ownership**: A user document at `/users/{userId}` can only be read or written by the authenticated user whose `uid` strictly matches `{userId}`.
2. **Identity Mutabilty**: The `email` field in `/users/{userId}` must match `request.auth.token.email`.
3. **Property Author Verification**: Properties listed at `/properties/{propertyId}` require a valid token with a verified email (`request.auth.token.email_verified == true`).
4. **Owner Safeguard**: Property lists must have `ownerId` matching `request.auth.uid` on creation, and this field is immutable on update.
5. **Temporal Integrity**: `createdAt` must match `request.time` exactly.
6. **No Phantom Keys**: Updates to properties are limited to attributes like `title`, `description`, `price`, `location`, `type`, `image`, `bedrooms`, `bathrooms`, `sqft`, `amenities`, `isPromo`, `vrImage`, or `features`.

---

## 2. The "Dirty Dozen" Hack Payloads

These 12 malicious operations representing identity spoofing, state poisoning, and access bypass will be tested and strictly blocked by security rules:

1. **User Identity Spoofing**: Attempt to write user profile `/users/alice_id` with credentials of `bob_id`.
2. **PII Data Extraction**: Attempt to read user profile of `/users/eve_id` as authenticated user `charlie_id`.
3. **Unauthenticated Property Creation**: Attempt to add a property document to `/properties/new_home_id` without an auth token.
4. **Property Ownership Hijacking**: User `alice_id` attempts to create a property listing with `ownerId` set to `bob_id`.
5. **Immutable Field Poisoning**: Owner `alice_id` attempts to update `ownerId` of `/properties/prop_123` to `bob_id` after creation.
6. **Impersonator Listing Deletion**: User `malicious_user` attempts to delete a property listing owned by `innocent_owner`.
7. **Temporal Poisoning**: Listing creator attempts to set a custom future timestamp for `createdAt` instead of using the server-time constant.
8. **Malicious ID Injection**: Attempting to create a property with a massive 10KB junk ID or path injection (Poison ID guard).
9. **Blank / Invalid Property State**: Attempting to set `price` as a negative number or `rating` as a string type.
10. **Shadow Field Injection**: Attempting to add an unmapped admin field (e.g., `isAdmin: true` or `role: 'admin'`) into `/users/{userId}`.
11. **Email Verification Bypass**: Attempting to create a listing while `email_verified` is false in the auth token.
12. **Blanket Query Scraping**: Attempting to read all user directories without specifying individual target document ids.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

A test framework placeholder representing the rigorous test environment checking permission denials:

```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// Verification testing schema definitions:
// - ensures Alice cannot write Bob's user collection
// - ensures unauthorized users cannot rewrite metadata coordinates
// - guarantees all Dirty Dozen payloads return PERMISSION_DENIED.
```
