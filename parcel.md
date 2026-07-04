# Parcel Delivery Socket Documentation

This document describes all Socket.IO events used by the Parcel Delivery module.

---

## Connection

Connect to the socket server after the user has authenticated.

```ts
import { io } from "socket.io-client";

const socket = io("https://your-api-url.com", {
  auth: {
    token: accessToken,
  },
});
```

---

# Joining a Parcel Room

To receive live updates for a specific parcel, join its room.

Event

```
parcel:join
```

Payload

```json
{
  "parcelId": "3b2e8e12d3c54f6a9b22efab"
}
```

Example

```ts
socket.emit("parcel:join", {
  parcelId,
});
```

---

# Customer Events

These events are sent only to the customer that owns the parcel.

---

## Payment Confirmed

Event

```
parcel:payment-confirmed
```

Description

Sent after payment has been successfully verified.

Payload

```ts
{
  id: string;
  status: "WAITING_FOR_RIDER_TO_ACCEPT";
  ...
}
```

Example

```ts
socket.on("parcel:payment-confirmed", (parcel) => {
  console.log(parcel);
});
```

---

## Rider Accepted Delivery

Event

```
parcel:accepted
```

Description

Sent when a rider accepts the parcel.

Payload

```ts
{
  id: string;
  riderId: string;
  status: "ACCEPTED";
}
```

Example

```ts
socket.on("parcel:accepted", (parcel) => {
  console.log(parcel);
});
```

---

## Delivery Started

Event

```
parcel:journey-started
```

Description

Sent after the rider confirms pickup using the pickup secret key.

Payload

```ts
{
  id: string;
  status: "DELIVERY_IN_PROGRESS";
}
```

Example

```ts
socket.on("parcel:journey-started", (parcel) => {
  console.log(parcel);
});
```

---

## Delivery Stop Completed

Event

```
parcel:stop-confirmed
```

Description

Sent whenever one delivery stop has been completed.

Payload

```ts
{
  label: string;
  parcel: {
    id: string;
    status: string;
    deliveryStops: [];
  }
}
```

Example

```ts
socket.on("parcel:stop-confirmed", (data) => {
  console.log(data);
});
```

---

# Rider Events

These events are sent to riders.

---

## New Available Job

Event

```
parcel:available-job
```

Description

Broadcast to all connected riders whenever a customer completes payment and a new delivery becomes available.

Payload

```ts
{
  id: string;
  pickupSummary: {
  }
  deliveryStops: [];
}
```

Example

```ts
socket.on("parcel:available-job", (job) => {
  console.log(job);
});
```

---

# Parcel Room Events

These events are received by everyone who joined a parcel room.

---

## Parcel Status Updated

Event

```
parcel:status-updated
```

Description

Sent whenever the parcel status changes.

Possible status values

- ACCEPTED
- DELIVERY_IN_PROGRESS
- ALL_PACKAGE_DELIVERED

Payload

```ts
{
  id: string;
  status: string;
}
```

Example

```ts
socket.on("parcel:status-updated", (parcel) => {
  console.log(parcel.status);
});
```

---

# Leaving a Parcel Room

Event

```
parcel:leave
```

Payload

```json
{
  "parcelId": "3b2e8e12d3c54f6a9b22efab"
}
```

Example

```ts
socket.emit("parcel:leave", {
  parcelId,
});
```

# Rider Location Updated

Event

```
parcel:rider-location-updated
```

Description

Broadcast continuously as the rider streams their live structural coordinate positioning metrics. Use this payload stream to transition layout map markers in real time.

Payload

```json
{
  "id": "67f3a2bc91...",
  "customerId": "67f1b2...",
  "riderId": "67f2c4...",
  "status": "DELIVERY_IN_PROGRESS",
  "currency": "NGN",
  "avgDistanceKm": "5.4",
  "note": "Handle with care",
  "pickupSummary": {
    "expectedPickupTime": "2026-07-04T15:00:00.000Z",
    "deliveryFee": 1200,
    "protectionFee": 150,
    "customerName": "Jane Doe",
    "customerProfilePhotoUrl": "https://...",
    "customerPhoneNumber": "+234..."
  },
  "deliveryStops": [
    {
      "label": "Stop 1",
      "stopInfo": {
        "receiverName": "John Smith",
        "receiverPhoneNumber": "+234...",
        "isDelivered": false,
        "stopLocation": { "latitude": 6.5244, "longitude": 3.3792 }
      }
    }
  ],
  "rider": {
    "firstName": "Alex",
    "lastName": "Rider",
    "phone": "+234...",
    "profilePhotoUrl": "https://...",
    "currentLocation": {
      "latitude": 6.5312,
      "longitude": 3.3815
    }
  }
}
```

---

# Event Summary

| Event                         | Recipient   | Description                 |
| ----------------------------- | ----------- | --------------------------- |
| parcel:payment-confirmed      | Customer    | Payment has been verified   |
| parcel:available-job          | Riders      | New delivery available      |
| parcel:accepted               | Customer    | Rider accepted the delivery |
| parcel:journey-started        | Customer    | Rider picked up parcel      |
| parcel:stop-confirmed         | Customer    | One delivery stop completed |
| parcel:status-updated         | Parcel Room | Parcel status changed       |
| parcel:rider-location-updated | Parcel Room | Parcel status changed       |

---

# Recommended Frontend Flow

1. Connect to the socket server.
2. Authenticate the socket connection.
3. Customers should listen for:
   - `parcel:payment-confirmed`
   - `parcel:accepted`
   - `parcel:journey-started`
   - `parcel:stop-confirmed`
4. Riders should listen for:
   - `parcel:available-job`
5. Both customer and rider should join the parcel room immediately after obtaining the parcel ID.
6. Listen for `parcel:rider-location-updated` to project live positioning layout markers onto maps.
7. Listen for `parcel:status-updated` to keep the tracking screen synchronized in real time.
