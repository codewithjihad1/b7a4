# Payment API Documentation

Base URL: `/api/v1/payments`

---

## Authentication

All endpoints (except webhook) require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Create Payment Intent

Creates a Stripe PaymentIntent for a confirmed rental order.

**`POST /api/v1/payments/create-intent`**

**Auth:** Customer

**Request Body:**

```json
{
    "orderId": "uuid"
}
```

| Field     | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `orderId` | string | Yes      | UUID of the confirmed order |

**Success Response (200):**

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Payment intent created",
    "data": {
        "paymentId": "uuid",
        "clientSecret": "pi_..._secret_...",
        "amount": "2700.00",
        "currency": "usd"
    }
}
```

**Use `clientSecret` with Stripe.js on the frontend:**

```js
const stripe = Stripe("pk_test_...");
const { error } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement },
});
```

**Error Responses:**

| Status | Message                                            |
| ------ | -------------------------------------------------- |
| 400    | Order must be confirmed before payment              |
| 400    | Order is already paid                               |
| 403    | This order belongs to another customer              |
| 404    | Order not found                                     |

---

### 2. Stripe Webhook

Receives payment event notifications from Stripe. This endpoint uses **raw body** (not JSON-parsed) for signature verification.

**`POST /api/v1/payments/webhook/stripe`**

**Auth:** None (Stripe signature verified)

**Headers:**

```
Stripe-Signature: t=...,v1=...
Content-Type: application/json
```

**Request Body:** Raw Stripe event JSON

**Handled Events:**

| Event                            | Action                                          |
| -------------------------------- | ----------------------------------------------- |
| `payment_intent.succeeded`       | Updates payment → SUCCESS, order → PAID          |
| `payment_intent.payment_failed`  | Updates payment → FAILED                         |

**Success Response (200):**

```json
{
    "received": true
}
```

**Error Response:**

| Status | Message                                    |
| ------ | ------------------------------------------ |
| 400    | Webhook signature verification failed      |

**Stripe Dashboard Setup:**

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/v1/payments/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` env var

---

### 3. Verify Payment

Manually verifies a pending payment's status with Stripe. Useful when webhook is delayed or missed.

**`GET /api/v1/payments/verify/:id`**

**Auth:** Customer (must be the order owner)

**Path Parameters:**

| Parameter | Type   | Description          |
| --------- | ------ | -------------------- |
| `id`      | string | UUID of the payment  |

**Success Response (200):**

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": {
        "id": "uuid",
        "customerId": "uuid",
        "transactionId": "pi_abc123",
        "provider": "STRIPE",
        "method": "card",
        "amount": "2700.00",
        "currency": "USD",
        "status": "SUCCESS",
        "paidAt": "2026-07-20T10:30:00.000Z",
        "createdAt": "2026-07-20T10:00:00.000Z"
    }
}
```

**Error Responses:**

| Status | Message       |
| ------ | ------------- |
| 403    | Access denied |
| 404    | Payment not found |

---

### 4. Get Payments by Order

Returns all payment records for a given order.

**`GET /api/v1/payments/order/:orderId`**

**Auth:** Any authenticated user

**Path Parameters:**

| Parameter | Type   | Description          |
| --------- | ------ | -------------------- |
| `orderId` | string | UUID of the order    |

**Success Response (200):**

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": [
        {
            "id": "uuid",
            "transactionId": "pi_abc123",
            "provider": "STRIPE",
            "method": "card",
            "amount": "2700.00",
            "currency": "USD",
            "status": "SUCCESS",
            "paidAt": "2026-07-20T10:30:00.000Z",
            "createdAt": "2026-07-20T10:00:00.000Z"
        }
    ]
}
```

**Error Response:**

| Status | Message                              |
| ------ | ------------------------------------ |
| 404    | No payments found for this order     |

---

### 5. Generate Receipt

Returns a full receipt for a successful payment.

**`GET /api/v1/payments/receipt/:id`**

**Auth:** Customer (must be the order owner)

**Path Parameters:**

| Parameter | Type   | Description          |
| --------- | ------ | -------------------- |
| `id`      | string | UUID of the payment  |

**Success Response (200):**

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Receipt generated",
    "data": {
        "receipt": {
            "paymentId": "uuid",
            "transactionId": "pi_abc123",
            "method": "card",
            "amount": "2700.00",
            "currency": "USD",
            "paidAt": "2026-07-20T10:30:00.000Z",
            "order": {
                "orderNumber": "ORD-MRS5LG3D-DJUC",
                "rentalStartDate": "2026-07-25T00:00:00.000Z",
                "rentalEndDate": "2026-07-27T00:00:00.000Z",
                "subtotal": "1000.00",
                "tax": "100.00",
                "securityDeposit": "1600.00",
                "discount": "0.00",
                "total": "2700.00",
                "customer": {
                    "name": "John Doe",
                    "email": "john@example.com"
                },
                "provider": {
                    "name": "Jane Smith",
                    "shopName": "Jane Sports Gear"
                },
                "items": [
                    {
                        "quantity": 2,
                        "dailyPrice": "500.00",
                        "days": 2,
                        "subtotal": "1000.00",
                        "gear": {
                            "title": "Tent 4-Person"
                        }
                    }
                ]
            }
        }
    }
}
```

**Error Responses:**

| Status | Message                                                   |
| ------ | --------------------------------------------------------- |
| 400    | Receipt available only for successful payments             |
| 403    | Access denied                                              |
| 404    | Payment not found                                          |

---

## Payment Status Flow

```
PENDING  →  SUCCESS    (webhook or verify confirms payment)
PENDING  →  FAILED     (webhook reports failure)
```

## Order Status Updates

When payment succeeds, the order status transitions:

```
CONFIRMED  →  PAID    (paymentStatus: SUCCESS)
```

## Frontend Integration

### Complete Payment Flow

```
1. POST /payments/create-intent  →  get clientSecret
2. Use Stripe.js to confirm payment:
     stripe.confirmCardPayment(clientSecret, { payment_method: ... })
3. Stripe processes the card
4. Webhook fires → server updates DB
5. GET /payments/verify/:id  →  poll until status = SUCCESS
6. GET /payments/receipt/:id  →  download receipt
```

### Example Frontend (React + Stripe.js)

```jsx
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_...");

function CheckoutForm({ clientSecret }) {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-success`,
            },
        });
        if (error) console.error(error.message);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={!stripe}>Pay Now</button>
        </form>
    );
}

// Usage
<Elements stripe={stripePromise} options={{ clientSecret }}>
    <CheckoutForm clientSecret={clientSecret} />
</Elements>
```

## Environment Variables

| Variable              | Required | Description                       |
| --------------------- | -------- | --------------------------------- |
| `STRIPE_SECRET_KEY`   | Yes      | Stripe API secret key             |
| `STRIPE_WEBHOOK_SECRET` | Yes    | Stripe webhook signing secret     |

## Error Format

All errors follow a standard format:

```json
{
    "success": false,
    "statusCode": 400,
    "message": "Error description"
}
```
