1. Connection Initialization
   Upon connecting, the socket instance must authenticate and explicitly register its presence state to start routing packets.

Event: user:online (Emit immediately on connection)
JSON
{
"userId": "65f1aaaa1234567890abcdef",
"userType": "CUSTOMER"
}
Options for userType: "CUSTOMER" | "VENDOR"

Event: message:join-room (Emit when entering an active screen)
If you already possess a valid room identifier, announce presence in that room context so targeted payloads broadcast straight to your screen layer.

JSON
{
"roomId": "65f1abcd1234567890abcdef"
} 2. Bidirectional Messaging Flow
Event: message:send (Client → Server)
Used to deliver an outbound chat bubble down the pipe.

JSON
{
"roomId": "65f1abcd1234567890abcdef",
"recipientId": "65f1bbbb1234567890abcdef",
"senderId": "65f1aaaa1234567890abcdef",
"senderType": "CUSTOMER",
"content": "Is this product still available for pickup in Ikeja?",
"sentByAi": false
}
💡 First-Time Contact Tip: If you have never messaged this vendor before, drop the "roomId" attribute entirely from the payload and provide only the target vendor's user ID inside "recipientId".

Event: message:received (Server → Room Clients)
Listen for this event inside your global listener configurations or individual chat controllers to append structural bubbles to the screen viewport in real time.

JSON
{
"id": "65f1eeff1234567890abcdef",
"roomId": "65f1abcd1234567890abcdef",
"senderId": "65f1aaaa1234567890abcdef",
"senderType": "CUSTOMER",
"content": "Is this product still available for pickup in Ikeja?",
"sentByAi": false,
"status": "SENT",
"createdAt": "2026-05-19T18:00:00.000Z"
} 3. Presence, Deletion & Typing State Tracking
Event: message:typing (Client → Server)
Fire this when a user begins typing input to update the interface remotely.

JSON
{
"roomId": "65f1abcd1234567890abcdef",
"userId": "65f1aaaa1234567890abcdef"
}
Event: message:user-typing (Server → Room Clients)
Listen for this to render an active animated typing bubble state indicator.

JSON
{
"userId": "65f1aaaa1234567890abcdef"
}
Event: message:stop-typing (Client → Server)
Fire this when the keyboard clears or input stalls for more than 3 seconds.

JSON
{
"roomId": "65f1abcd1234567890abcdef",
"userId": "65f1aaaa1234567890abcdef"
}
Event: message:user-stop-typing (Server → Room Clients)
Listen for this to clear layout activity indicators.

JSON
{
"userId": "65f1aaaa1234567890abcdef"
}
Event: message:read (Client → Server)
Fire this whenever a chat window opens or a new message scrolls into view.

JSON
{
"roomId": "65f1abcd1234567890abcdef",
"userId": "65f1aaaa1234567890abcdef"
}
Event: message:status-updated (Server → Room Clients)
Listen for this event to switch double checkmarks from gray to blue inside the conversation list or chat log view.

JSON
{
"roomId": "65f1abcd1234567890abcdef",
"status": "READ",
"readAt": "2026-05-19T18:01:05.000Z",
"messageIds": ["65f1eeff1234567890abcdef"]
}
Event: message:deleted (Server → Room Clients)
Listen for this event to wipe a single matching entry container out of the view layout state when a sender recalls a message.

JSON
{
"messageId": "65f1eeff1234567890abcdef"
}
🌐 HTTP REST API Reference
All requests must supply the following authentication headers:

Authorization: Bearer <JWT_TOKEN>

Base URL Path Configuration: /api/v1/messages (or your configured API_VERSION)

1. Send / Initialize Message
   URL: /api/v1/messages/message

Method: POST

Payload Schema:

JSON
{
"roomId": "65f1abcd1234567890abcdef",
"recipientId": "65f1bbbb1234567890abcdef",
"senderType": "CUSTOMER",
"content": "Hello, can I negotiate this order?",
"sentByAi": false
}
(Note: Omit roomId entirely if initializing a brand-new conversation).

Success Response (201 Created):

JSON
{
"success": true,
"data": {
"id": "65f1eeff1234567890abcdef",
"roomId": "65f1abcd1234567890abcdef",
"senderId": "65f1aaaa1234567890abcdef",
"senderType": "CUSTOMER",
"content": "Hello, can I negotiate this order?",
"sentByAi": false,
"createdAt": "2026-05-19T18:00:00.000Z"
}
}
```

#### 2. Fetch Active Inbox Conversations (Customer Context)

Retrieves the list of all chat rooms where the user is acting as a **Customer**. Returns metadata and a preview snippet of the single most recent text to populate the main inbox list view.

- **URL:** `/api/v1/messages/customer/conversations`
- **Method:** `GET`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "roomId": "65f1abcd1234567890abcdef",
        "vendorInfo": {
          "id": "65f1bbbb1234567890abcdef",
          "businessName": "Gadget Hub Lagos"
        },
        "lastMessage": {
          "content": "Hello, can I negotiate this order?",
          "createdAt": "2026-05-19T18:00:00.000Z",
          "status": "SENT"
        },
        "unreadCount": 0
      }
    ]
  }
  ```

#### 3. Fetch Active Inbox Conversations (Vendor Context)

Retrieves the list of all chat rooms where the user acts as the **Vendor**. Use this when the user switches profiles to their merchant panel.

- **URL:** `/api/v1/messages/vendor/conversations`
- **Method:** `GET`
- **Success Response (200 OK):** Same layout format as customer context, with individual metadata fields mapped to customer profile schemas instead.

#### 4. Fetch Deep Room Historical Message Logs

Provides a historical log of messages exchanged inside a specific room, featuring backward infinite scrolling support.

- **URL:** `/api/v1/messages/room/:roomId/messages`
- **Method:** `GET`
- **Query Parameters:**
  - `limit` _(integer, default=50)_ — Maximum items returned in the request block.
  - `offset` _(integer, default=0)_ — Index step count for pagination processing offsets.
- **Success Response (200 OK):**

````json
    {
      "success": true,
      "data": [
        {
          "id": "65f1eeff1234567890abcdef",
          "senderId": "65f1aaaa1234567890abcdef",
          "senderType": "CUSTOMER",
          "content": "Hello, can I negotiate this order?",
          "sentByAi": false,
          "status": "READ",
          "createdAt": "2026-05-19T18:00:00.000Z"
        }
      ]
    }
    ```

#### 5. Unsend / Delete Message Document
Permanently removes a target message reference from database listings.
*   **URL:** `/api/v1/messages/message/:messageId`
*   **Method:** `DELETE`
*   **Success Response (200 OK):**

```json
    {
      "success": true,
      "message": "Message deleted successfully"
    }
    ```
*   **Error Response (403 Forbidden):**

```json
    {
      "success": false,
      "message": "Unauthorized to delete this message"
    }
    ```

#### 6. Get Vendor Feedback & Reviews Matrix
Extracts a summary of operational evaluations and text feedback metrics linked directly to vendor activities.
*   **URL:** `/api/v1/messages/vendor/reviews`
*   **Method:** `GET`
*   **Success Response (200 OK):**

```json
    {
      "success": true,
      "data": {
        "averageRating": 4.8,
        "totalReviewsCount": 124,
        "reviews": [
          {
            "id": "65f199991234567890abcdef",
            "rating": 5,
            "comment": "Fast shipping, item crisp as expected!",
            "reviewerName": "Chukwuma"
          }
        ]
      }
    }
    ```

```</JWT_TOKEN>
````
