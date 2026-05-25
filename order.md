# Chariot Connect - Multi-Platform Backend API

A comprehensive Node.js/Express backend for managing Customers, Vendors, and Riders in the Chariot Connect ecosystem.

---

# Features

- Multi-User Architecture
- Hybrid Real-Time Order Management
- Real-Time Messaging with Socket.io
- OTP Authentication
- Payment Gateway Integrations
- File Upload Management
- Swagger Documentation
- Comprehensive Logging
- Secure JWT Authentication
- MongoDB + Prisma ORM Architecture

---

# Tech Stack

| Layer            | Technology               |
| ---------------- | ------------------------ |
| Runtime          | Node.js + TypeScript     |
| Framework        | Express.js               |
| Database         | MongoDB                  |
| ORM              | Prisma ORM               |
| Authentication   | JWT + OTP                |
| Real-Time Engine | Socket.io                |
| Payments         | Paystack + PawaPay       |
| Uploads          | Cloudinary               |
| Mail Service     | Nodemailer               |
| Logging          | Winston                  |
| Security         | Helmet + bcryptjs + CORS |
| Documentation    | Swagger/OpenAPI          |

---

# Real-Time Socket Architecture

## Shared Rooms

### `user:${userId}`

Private room for user-specific events.

### `order:${orderId}`

Shared tracking room for:

- Customers
- Vendors
- Riders

### Global Rider Broadcast

```ts
io.emit(...)
```

Used to notify all active riders about available delivery jobs.

---

# Socket Event Lifecycle

| Service Action          | Event Name                | Room Target          | Purpose                       |
| ----------------------- | ------------------------- | -------------------- | ----------------------------- |
| `createOrder`           | `order:new-incoming`      | `user:${vendorId}`   | Notify vendor about new order |
| `updateOrder`           | `order:modified`          | `order:${orderId}`   | Sync order updates            |
| `vendorUpdateStatus`    | `order:ready-for-payment` | `user:${customerId}` | Trigger checkout              |
| `verifyPayment`         | `delivery-job:available`  | Global Riders        | Broadcast delivery job        |
| `riderAcceptJob`        | `order:rider-assigned`    | `order:${orderId}`   | Attach rider                  |
| `riderConfirmPickup`    | `order:en-route`          | `order:${orderId}`   | Rider started trip            |
| `riderFinalizeDelivery` | `order:delivered`         | `order:${orderId}`   | Delivery completed            |

---

# API Documentation

# Base URL

```txt
/api/v1
```

---

# Order Management Routes

Base Route:

```txt
/orders
```

---

# 1. Create New Order

## Endpoint

```http
POST /orders
```

## Access

Protected (Customer)

## Description

Creates a new order and sends a real-time notification to the vendor.

## Request Body

```json
{
  "vendorId": "64bdf92231267a11c841ab41",
  "totalAmount": 12500,
  "notes": "Please pack separately",
  "deliveryLocation": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "locationName": "12 Allen Avenue, Ikeja"
  },
  "packsList": [
    {
      "packLabel": "Office Lunch Group",
      "itemList": [
        {
          "productId": "64bdf9df31267a11c841ab45",
          "itemName": "Jollof Rice",
          "productImageUrl": "https://res.cloudinary.com/chariot/image/upload/v1/jollof.jpg",
          "price": 3500,
          "quantity": 2,
          "description": "Extra chicken"
        }
      ]
    }
  ]
}
```

## Response

```json
{
  "success": true,
  "message": "Order created successfully"
}
```

---

# 2. Update Pending Order

## Endpoint

```http
PUT /orders/:orderId
```

## Access

Protected (Customer)

## Description

Updates an order only if status is:

- `WAITING_FOR_APPROVAL`
- `AWAITING_PAYMENT`

## Request Body

```json
{
  "totalAmount": 16000,
  "notes": "Please deliver before 1PM",
  "deliveryLocation": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "locationName": "Allen Avenue"
  }
}
```

## Response

```json
{
  "success": true,
  "message": "Order updated successfully"
}
```

---

# 3. Update Order Status

## Endpoint

```http
PATCH /orders/:orderId/status
```

## Access

Protected (Vendor)

## Description

Updates vendor-side order workflow.

## Supported Status Values

```txt
AWAITING_PAYMENT
VENDOR_PACKING
AWAITING_PICK_UP
REJECTED
```

## Request Body

```json
{
  "status": "AWAITING_PAYMENT"
}
```

## Response

```json
{
  "success": true,
  "message": "Order status updated"
}
```

---

# 4. Initiate Payment

## Endpoint

```http
POST /orders/payment/initiate
```

## Access

Protected (Customer)

## Description

Initiates payment using:

- Paystack (NGN)
- PawaPay (RWF)

## Request Body

```json
{
  "orderId": "64bdfa5a31267a11c841ab60"
}
```

## Response

```json
{
  "success": true,
  "paymentUrl": "https://payment-link.com"
}
```

---

# 5. Verify Payment

## Endpoint

```http
GET /orders/payment/verify
```

## Access

Public

## Query Parameters

```txt
?reference=REF_STRING&provider=PAYSTACK
```

## Supported Providers

```txt
PAYSTACK
PAWAPAY
```

## Description

Verifies gateway payment and marks order as paid.

## Response

```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

# 6. Accept Delivery Job

## Endpoint

```http
POST /orders/:orderId/accept-job
```

## Access

Protected (Rider)

## Description

Assigns rider to order.

## Response

```json
{
  "success": true,
  "message": "Delivery job accepted"
}
```

---

# 7. Confirm Pickup

## Endpoint

```http
POST /orders/:orderId/pickup
```

## Access

Protected (Rider)

## Description

Marks order as picked up.

## Response

```json
{
  "success": true,
  "message": "Pickup confirmed"
}
```

---

# 8. Finalize Delivery

## Endpoint

```http
POST /orders/deliver
```

## Access

Protected (Rider)

## Request Body

```json
{
  "orderId": "64bdfa5a31267a11c841ab60"
}
```

## Description

Marks order as delivered.

## Response

```json
{
  "success": true,
  "message": "Order delivered successfully"
}
```

# License

MIT License
