# GearUp API Documentation

Base URL: `https://gearup-seven-lilac.vercel.app/api/v1`

Interactive docs: `https://gearup-seven-lilac.vercel.app/api-docs`

---

## Authentication

Most endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

### Rate Limits
- Global: 100 requests / 15 minutes
- Auth routes (`/auth/*`): 10 requests / 15 minutes

---

## Auth

### POST `/auth/register`
Register a new user.

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| name | string | Yes | 2-100 characters |
| email | string | Yes | Valid email |
| password | string | Yes | 8+ chars, uppercase, lowercase, number, special char |
| phone | string | No | |
| role | string | No | `CUSTOMER` (default), `PROVIDER` |

**Response 201:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "CUSTOMER", "status": "ACTIVE", "createdAt": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST `/auth/login`
Login with email and password.

**Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "...", "status": "ACTIVE", "createdAt": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST `/auth/refresh-token`
Get a new access token using a refresh token.

**Body:**
| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | Yes |

**Response 200:**
```json
{
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST `/auth/change-password`
Change password. **Requires authentication.**

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| currentPassword | string | Yes | |
| newPassword | string | Yes | 8+ chars, uppercase, lowercase, number, special char |

**Response 200:**
```json
{
  "message": "Password changed successfully"
}
```

---

## User

### GET `/users/profile`
Get current user's profile. **Requires authentication.**

**Response 200:**
```json
{
  "data": {
    "id": "...", "name": "...", "email": "...", "phone": null,
    "role": "CUSTOMER", "status": "ACTIVE", "isVerified": false,
    "address": null, "city": null, "country": "Bangladesh",
    "avatar": null, "createdAt": "..."
  }
}
```

---

### PATCH `/users/profile`
Update current user's profile. **Requires authentication.**

**Body (all optional):**
| Field | Type | Rules |
|-------|------|-------|
| name | string | 2-100 characters |
| phone | string | Valid phone format |
| address | string | Max 500 chars, nullable |
| city | string | Max 100 chars, nullable |
| country | string | Max 100 chars, nullable |
| avatar | string | Valid URL, nullable |

---

## Categories

### GET `/categories`
Get all active categories. **Public.**

**Response 200:**
```json
{
  "data": [
    { "id": "...", "name": "Tents", "slug": "tents", "description": "...", "icon": "...", "isActive": true }
  ]
}
```

---

### GET `/categories/:id`
Get category by ID. **Public.**

---

### GET `/categories/admin`
Get all categories including inactive. **Requires ADMIN.**

---

### POST `/categories`
Create a new category. **Requires ADMIN.**

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| name | string | Yes | 2-100 characters |
| description | string | No | Max 500 chars |
| icon | string | No | Valid URL |

---

### PATCH `/categories/:id`
Update a category. **Requires ADMIN.**

**Body (all optional):** name, description, icon, isActive

---

### DELETE `/categories/:id`
Delete a category. **Requires ADMIN.** Fails if category has associated gear.

---

## Providers

### GET `/providers/me`
Get provider's own profile. **Requires PROVIDER.**

**Response 200:**
```json
{
  "data": {
    "id": "...", "userId": "...", "shopName": "...", "shopLogo": null,
    "tradeLicense": null, "description": null, "rating": 0, "totalReviews": 0,
    "createdAt": "..."
  }
}
```

---

### PATCH `/providers/me`
Update provider profile. **Requires PROVIDER.**

**Body (all optional):**
| Field | Type | Rules |
|-------|------|-------|
| shopName | string | 2-200 characters |
| shopLogo | string | Valid URL, nullable |
| tradeLicense | string | Max 100 chars, nullable |
| description | string | Max 2000 chars, nullable |

---

### GET `/providers/dashboard`
Provider dashboard with earnings and order stats. **Requires PROVIDER.**

**Response 200:**
```json
{
  "data": {
    "totalEarnings": "...",
    "earningsThisMonth": "...",
    "totalOrders": 5,
    "activeOrders": 2,
    "completedOrders": 3,
    "totalGearItems": 4,
    "averageRating": 4.5
  }
}
```

---

### GET `/providers/:id`
Get provider's public profile. **Public.**

---

## Gear

### GET `/gear`
Browse available gear items. **Public.**

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 10, max: 100) |
| search | string | Search in title, brand, description |
| categoryId | UUID | Filter by category |
| providerId | UUID | Filter by provider |
| minPrice | number | Minimum daily rent price |
| maxPrice | number | Maximum daily rent price |
| condition | string | `NEW`, `GOOD`, or `USED` |
| isAvailable | boolean | Filter by availability |
| sort | string | `price_asc`, `price_desc`, `newest`, `rating` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "...", "title": "Mountain Tent", "slug": "mountain-tent",
      "brand": "North Face", "model": "VE-25",
      "description": "...", "dailyRentPrice": "500.00", "securityDeposit": "2000.00",
      "stockQuantity": 5, "availableQuantity": 3, "condition": "GOOD",
      "weight": "3.50", "location": "Dhaka", "imageCover": null,
      "isAvailable": true, "approvalStatus": "APPROVED",
      "averageRating": 4.5, "reviewCount": 12,
      "provider": { "id": "...", "name": "Jane", "shopName": "Gear Shop" },
      "category": { "id": "...", "name": "Tents" }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

---

### GET `/gear/:id`
Get gear details by ID. **Public.** Includes reviews and average rating.

---

### GET `/gear/provider/mine`
Get provider's own gear items. **Requires PROVIDER.**

---

### POST `/gear`
Create a new gear item. **Requires PROVIDER.**

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| title | string | Yes | 2-200 characters |
| categoryId | UUID | Yes | Must exist |
| brand | string | Yes | 2-100 characters |
| model | string | No | Max 100 characters |
| description | string | Yes | 10-5000 characters |
| dailyRentPrice | number | Yes | Positive |
| securityDeposit | number | Yes | Positive |
| stockQuantity | integer | Yes | Positive |
| condition | string | Yes | `NEW`, `GOOD`, or `USED` |
| weight | number | No | Positive, max 9999.99 |
| location | string | No | Max 150 characters |
| imageCover | string | No | Valid URL |

**Response 201:** Created gear item (approvalStatus starts as `PENDING`).

---

### PATCH `/gear/:id`
Update a gear item. **Requires PROVIDER** (owner only). **Body (all optional):** title, categoryId, brand, model, description, dailyRentPrice, securityDeposit, stockQuantity, condition, weight, location, imageCover

---

### DELETE `/gear/:id`
Soft-delete a gear item. **Requires PROVIDER** (owner only). Sets `deletedAt`.

---

### PATCH `/gear/:id/stock`
Update available quantity. **Requires PROVIDER** (owner only).

**Body:**
| Field | Type | Required |
|-------|------|----------|
| availableQuantity | integer | Yes (min: 0) |

---

### GET `/gear/admin/all`
Get all gear items including pending and soft-deleted. **Requires ADMIN.**

---

### PATCH `/gear/:id/moderate`
Approve or reject a gear item. **Requires ADMIN.**

**Body:**
| Field | Type | Required | Values |
|-------|------|----------|--------|
| approvalStatus | string | Yes | `PENDING`, `APPROVED`, `REJECTED` |

---

## Rentals / Orders

### POST `/rentals`
Place a new rental order. **Requires CUSTOMER.**

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| items | array | Yes | At least 1 item |
| items[].gearId | UUID | Yes | Must exist and be available |
| items[].quantity | integer | Yes | Positive, must not exceed available stock |
| rentalStartDate | date | Yes | Must be in the future |
| rentalEndDate | date | Yes | Must be after start date |
| notes | string | No | Max 500 characters |

**Cost calculation:** `(dailyRentPrice * quantity * days) + tax(10%) + securityDeposit`

**Response 201:**
```json
{
  "data": {
    "id": "...", "orderNumber": "ORD-XXX-XXXXX", "status": "PLACED",
    "subtotal": "1000.00", "discount": "0.00", "tax": "100.00",
    "securityDeposit": "500.00", "total": "1600.00",
    "rentalStartDate": "...", "rentalEndDate": "...",
    "paymentStatus": "PENDING",
    "items": [{ "gearId": "...", "quantity": 1, "dailyPrice": "500.00", "days": 1, "subtotal": "500.00" }]
  }
}
```

---

### GET `/rentals/my-orders`
Get current customer's orders. **Requires CUSTOMER.**

**Query:** page, limit, status (`PLACED`, `CONFIRMED`, `PAID`, `PICKED_UP`, `RETURNED`, `CANCELLED`, `REJECTED`)

---

### PATCH `/rentals/:id/cancel`
Cancel an order. **Requires CUSTOMER** (owner). Only allowed when status is `PLACED`. Restores gear stock.

---

### GET `/rentals/provider/orders`
Get provider's orders. **Requires PROVIDER.**

**Query:** page, limit, status

---

### PATCH `/rentals/:id/confirm`
Confirm an order. **Requires PROVIDER** (order's provider). Only when status is `PLACED`. Decrements gear stock.

---

### PATCH `/rentals/:id/reject`
Reject an order. **Requires PROVIDER** (order's provider). Only when status is `PLACED`. Restores gear stock.

---

### PATCH `/rentals/:id/pickup`
Mark order as picked up. **Requires PROVIDER** (order's provider). Only when status is `PAID`.

---

### PATCH `/rentals/:id/return`
Mark order as returned. **Requires PROVIDER** (order's provider). Only when status is `PICKED_UP`. Restores gear stock.

---

### GET `/rentals/admin/all`
Get all orders. **Requires ADMIN.**

**Query:** page, limit, status, customerId (UUID), providerId (UUID)

---

### GET `/rentals/:id`
Get order details. **Requires authentication.** Includes items, gear details, and payments.

---

## Order Lifecycle

```
PLACED → CONFIRMED → PAID → PICKED_UP → RETURNED
   ↓          ↓
CANCELLED  REJECTED
```

| From | To | Allowed For |
|------|----|-------------|
| PLACED | CONFIRMED | Provider (confirm) |
| PLACED | REJECTED | Provider (reject) |
| PLACED | CANCELLED | Customer (cancel) |
| CONFIRMED | PAID | Stripe webhook |
| PAID | PICKED_UP | Provider |
| PICKED_UP | RETURNED | Provider |

---

## Payments

### POST `/payments/create-intent`
Create a Stripe payment intent. **Requires authentication.**

**Body:**
| Field | Type | Required |
|-------|------|----------|
| orderId | UUID | Yes |

**Response 200:**
```json
{
  "data": {
    "paymentId": "...",
    "clientSecret": "pi_xxx_secret_xxx",
    "amount": 160000,
    "currency": "bdt"
  }
}
```

---

### POST `/payments/webhook/stripe`
Stripe webhook endpoint. Called by Stripe automatically. **No authentication required** (verified via Stripe signature). Handles `payment_intent.succeeded` events.

---

### GET `/payments/verify/:id`
Verify payment status. **Requires authentication.**

---

### GET `/payments/order/:orderId`
Get all payments for an order. **Requires authentication.**

---

### GET `/payments/receipt/:id`
Generate a payment receipt. **Requires authentication.**

**Response 200:**
```json
{
  "data": {
    "receiptNumber": "RCP-XXX-XXXXX",
    "paymentId": "...",
    "orderId": "...",
    "amount": "1600.00",
    "method": "STRIPE",
    "paidAt": "...",
    "customer": { "name": "...", "email": "..." },
    "provider": { "shopName": "..." },
    "items": [{ "title": "...", "days": 2, "subtotal": "1000.00" }]
  }
}
```

---

## Reviews

### GET `/reviews/gear/:gearId`
Get reviews for a gear item. **Public.**

**Query:** page, limit

**Response 200:**
```json
{
  "data": {
    "reviews": [
      {
        "id": "...", "rating": 5, "comment": "Excellent!",
        "createdAt": "...", "updatedAt": "...",
        "customer": { "id": "...", "name": "John", "avatar": null },
        "gear": { "id": "...", "title": "Mountain Tent", "slug": "mountain-tent", "imageCover": null }
      }
    ],
    "averageRating": 4.5
  },
  "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
}
```

---

### POST `/reviews`
Create a review. **Requires CUSTOMER.** Order must be `RETURNED`.

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| orderId | UUID | Yes | Must be a RETURNED order owned by customer |
| gearId | UUID | Yes | Must be an item in the order |
| rating | integer | Yes | 1-5 |
| comment | string | No | Max 1000 characters |

**Business rules:**
- One review per (gearId, customerId) pair per gear
- One review per order
- Order must have status `RETURNED`
- Creating a review recalculates the provider's average rating

---

### GET `/reviews/my-reviews`
Get current user's reviews. **Requires authentication.**

---

### DELETE `/reviews/:id`
Delete own review. **Requires authentication.** Provider's average rating is recalculated.

---

## Admin

All admin routes require the `ADMIN` role.

### GET `/admin/dashboard`
Get dashboard statistics.

**Query (all optional):** from (date), to (date)

**Response 200:**
```json
{
  "data": {
    "users": { "total": 100, "customers": 80, "providers": 18, "admins": 2, "active": 95, "suspended": 5 },
    "gear": { "total": 200, "pending": 12, "active": 180 },
    "orders": { "total": 500 },
    "revenue": { "total": "250000.00", "tax": "25000.00" },
    "recentOrders": [ ... ]
  }
}
```

---

### GET `/admin/users`
List users with filters.

**Query:**
| Param | Type | Description |
|-------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| role | string | `CUSTOMER`, `PROVIDER`, or `ADMIN` |
| status | string | `ACTIVE`, `SUSPENDED`, or `PENDING` |
| search | string | Search by name or email |

---

### GET `/admin/users/:id`
Get user details with counts (gear items, orders).

---

### PATCH `/admin/users/:id/role`
Update a user's role.

**Body:**
| Field | Type | Required | Values |
|-------|------|----------|--------|
| role | string | Yes | `CUSTOMER`, `PROVIDER`, `ADMIN` |

---

### PATCH `/admin/users/:id/status`
Suspend or activate a user.

**Body:**
| Field | Type | Required | Values |
|-------|------|----------|--------|
| status | string | Yes | `ACTIVE`, `SUSPENDED`, `PENDING` |

---

### GET `/admin/gear`
List all gear items.

**Query:** page, limit, approvalStatus (`PENDING`, `APPROVED`, `REJECTED`)

---

### GET `/admin/gear/:id`
Get gear details with provider and category info.

---

### GET `/admin/rentals`
List all orders.

**Query:** page, limit, status, customerId (UUID), providerId (UUID)

---

### GET `/admin/rentals/:id`
Get full order details including items, gear, and payments.

---

## Upload

### POST `/upload/image`
Upload an image. **Requires PROVIDER or ADMIN.**

**Request:** `multipart/form-data` with field `file` (JPEG, PNG, GIF, WebP; max 5MB)

**Response 201:**
```json
{
  "data": {
    "url": "https://res.cloudinary.com/xxx/image/upload/...",
    "publicId": "gearup/filename",
    "width": 800,
    "height": 600,
    "format": "jpg"
  }
}
```

---

### DELETE `/upload/image`
Delete an image from Cloudinary. **Requires PROVIDER or ADMIN.**

**Body:**
| Field | Type | Required |
|-------|------|----------|
| publicId | string | Yes |

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no token, invalid token, suspended account) |
| 403 | Forbidden (wrong role) |
| 404 | Resource Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 422 | Validation Failed (Zod schema error) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Enums

| Enum | Values |
|------|--------|
| UserRole | `CUSTOMER`, `PROVIDER`, `ADMIN` |
| UserStatus | `ACTIVE`, `SUSPENDED`, `PENDING` |
| GearCondition | `NEW`, `GOOD`, `USED` |
| ApprovalStatus | `PENDING`, `APPROVED`, `REJECTED` |
| RentalStatus | `PLACED`, `CONFIRMED`, `PAID`, `PICKED_UP`, `RETURNED`, `CANCELLED`, `REJECTED` |
| PaymentStatus | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |
| PaymentProvider | `STRIPE`, `SSLCOMMERZ` |
