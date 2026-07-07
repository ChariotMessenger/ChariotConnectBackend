# Rider Real-Time Metrics & Earnings Integration Guide

This guide explains how to connect to the Socket.IO server from the frontend (Web or Mobile) to receive real-time updates about a rider's daily earnings and completed delivery jobs.

---

# 1. Establishing Connection & Authentication

To receive rider-specific metric updates, the frontend must first establish a Socket.IO connection and register the authenticated rider as online. This allows the backend to associate the socket connection with the rider's private room (`user:${userId}`).

```javascript
import { io } from "socket.io-client";

const socket = io("YOUR_BACKEND_URL");

socket.on("connect", () => {
  socket.emit("user:online", {
    userId: "RIDER_MONGO_ID",
    userType: "RIDER",
  });
});
```

---

# 2. Real-Time Events

## Outgoing Event (Frontend → Backend)

### `rider:get-today-stats`

Requests the rider's current day's statistics from the server.

This can be called:

- When the dashboard first loads.
- During pull-to-refresh.
- Whenever the rider wants to manually refresh their earnings.

### Payload

```json
{
  "riderId": "64bbf392fa1d2c0012345678"
}
```

### Example

```javascript
function refreshDashboardMetrics(riderId) {
  socket.emit("rider:get-today-stats", {
    riderId,
  });
}
```

---

## Incoming Event (Backend → Frontend)

### `rider:today-stats-updated`

This event is emitted by the backend whenever:

- A delivery is successfully completed.
- The frontend requests fresh statistics using `rider:get-today-stats`.

The frontend should always listen for this event and update the dashboard accordingly.

### Response Payload

```json
{
  "totalMoneyEarned": 12500,
  "totalJobsDone": 5,
  "currency": "NGN",
  "date": "2026-07-07"
}
```

### Example

```javascript
socket.on("rider:today-stats-updated", (data) => {
  const { totalMoneyEarned, totalJobsDone, currency, date } = data;

  updateUiDashboard({
    earnings: `${currency} ${totalMoneyEarned.toLocaleString()}`,
    trips: totalJobsDone,
    date,
  });
});
```

---

# 3. Event Flow

```text
Frontend Connects
        │
        ▼
socket.emit("user:online")
        │
        ▼
Backend maps socket to:
user:{riderId}
        │
        ├───────────────────────────────┐
        │                               │
        ▼                               ▼
Delivery Completed          Frontend requests refresh
        │                               │
        └──────────────┬────────────────┘
                       ▼
Backend calculates:
• Today's Earnings
• Total Jobs Completed
                       │
                       ▼
socket.emit("rider:today-stats-updated")
                       │
                       ▼
Frontend Dashboard Updates Instantly
```

---

# 4. Event Summary

| Event                       | Direction          | Description                                                      |
| --------------------------- | ------------------ | ---------------------------------------------------------------- |
| `user:online`               | Frontend → Backend | Registers the rider's socket connection.                         |
| `rider:get-today-stats`     | Frontend → Backend | Requests the latest daily rider statistics.                      |
| `rider:today-stats-updated` | Backend → Frontend | Returns updated earnings and completed jobs for the current day. |

---

# 5. Sample Response

```json
{
  "totalMoneyEarned": 12500,
  "totalJobsDone": 5,
  "currency": "NGN",
  "date": "2026-07-07"
}
```

---

# 6. Recommended Frontend Flow

1. Connect to the Socket.IO server.
2. Emit `user:online`.
3. Listen for `rider:today-stats-updated`.
4. Request metrics using `rider:get-today-stats` when the dashboard opens.
5. Update the dashboard whenever `rider:today-stats-updated` is received.

This ensures the rider's earnings and completed jobs remain synchronized in real time without requiring repeated REST API polling.
