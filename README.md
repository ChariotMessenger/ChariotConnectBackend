# Chariot Connect - Multi-Platform Backend API

A comprehensive Node.js/Express backend for managing Customers, Vendors, and Riders in the Chariot Connect ecosystem.

## Features

- **Multi-User Architecture**: Separate authentication flows for Customers, Vendors, and Riders
- **Real-Time Messaging**: Socket.IO integration for real-time vendor-customer communication
- **OTP Authentication**: Secure email-based OTP verification
- **File Upload Management**: Cloudinary integration for profile photos and documents
- **Order Management**: Complete order lifecycle (create, accept, reject, complete)
- **Review & Rating System**: Customers can review and rate vendors
- **Favorites System**: Customers can mark vendors as favorites
- **Swagger Documentation**: Complete API documentation
- **Comprehensive Logging**: Winston logger with file and console output
- **Security**: Helmet middleware, password hashing, JWT tokens
- **Database**: MongoDB with Prisma ORM

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Prisma ORM
- **Authentication**: JWT + OTP
- **Real-Time**: Socket.IO
- **File Upload**: Cloudinary
- **Email**: Nodemailer (Gmail SMTP)
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, bcryptjs

## Project Structure

```
src/
├── app.ts                 # Main Express app setup
├── server.ts             # Server entry point
├── config/               # Configuration files
│   ├── database.ts      # Prisma client
│   ├── socket.ts        # Socket.IO setup
│   └── swagger.ts       # Swagger configuration
├── middlewares/         # Express middlewares
│   ├── auth.ts         # JWT authentication
│   ├── errorHandler.ts # Global error handling
│   ├── requestLogger.ts # Request logging
│   └── validate.ts     # Request validation
├── routes/              # API routes
│   ├── customer.routes.ts
│   ├── vendor.routes.ts
│   ├── rider.routes.ts
│   └── health.routes.ts
├── controllers/        # Route handlers
│   ├── customer.controller.ts
│   ├── vendor.controller.ts
│   └── rider.controller.ts
├── services/           # Business logic
│   ├── customer.service.ts
│   ├── vendor.service.ts
│   ├── rider.service.ts
│   ├── catalog.service.ts
│   ├── order.service.ts
│   ├── message.service.ts
│   ├── review-favorite.service.ts
│   ├── email.service.ts
│   └── upload.service.ts
└── utils/             # Utility functions
    ├── logger.ts      # Winston logger
    ├── jwt.ts         # JWT utilities
    ├── otp.ts         # OTP utilities
    └── password.ts    # Password utilities
```

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd chariot-connect-backend
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Update `.env` with your credentials:

- MongoDB connection string
- JWT secret
- Nodemailer Gmail credentials
- Cloudinary credentials

4. **Generate Prisma Client**

```bash
pnpm prisma:generate
```

5. **Push database schema**

```bash
pnpm prisma:push
```

6. **Start development server**

```bash
pnpm dev
```

Server will run on `http://localhost:3000`

## Environment Variables

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/chariot-connect

# Server
PORT=3000
NODE_ENV=development
API_VERSION=v1

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# Email (Gmail SMTP)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
FRONTEND_URL=http://localhost:3001
SOCKET_IO_CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Customer Endpoints

- `POST /api/v1/customers/register/step-1` - Start registration
- `POST /api/v1/customers/register/step-2` - Complete registration
- `POST /api/v1/customers/login/step-1` - Request OTP
- `POST /api/v1/customers/login/step-2` - Verify OTP and login
- `GET /api/v1/customers/profile` - Get profile
- `PUT /api/v1/customers/profile` - Update profile
- `POST /api/v1/customers/profile/photo` - Upload profile photo
- `POST /api/v1/customers/vendors/by-location` - Find vendors by location
- `POST /api/v1/customers/favorites` - Add to favorites
- `DELETE /api/v1/customers/favorites` - Remove from favorites
- `GET /api/v1/customers/favorites` - Get favorites
- `POST /api/v1/customers/reviews` - Create review
- `POST /api/v1/customers/messages/vendor` - Message vendor
- `GET /api/v1/customers/messages/conversations` - Get conversations
- `GET /api/v1/customers/messages/:roomId` - Get room messages

### Vendor Endpoints

- `POST /api/v1/vendors/register/step-1` - Register step 1
- `POST /api/v1/vendors/register/step-2` - Register step 2
- `POST /api/v1/vendors/register/step-3` - Register step 3
- `POST /api/v1/vendors/login/with-otp` - Login with OTP
- `POST /api/v1/vendors/login/verify-otp` - Verify OTP
- `POST /api/v1/vendors/login/with-password` - Login with password
- `GET /api/v1/vendors/profile` - Get profile
- `PUT /api/v1/vendors/profile` - Update profile
- `POST /api/v1/vendors/profile/photo` - Upload profile photo
- `POST /api/v1/vendors/catalog` - Create catalog item
- `PUT /api/v1/vendors/catalog/:itemId` - Update catalog item
- `DELETE /api/v1/vendors/catalog/:itemId` - Delete catalog item
- `GET /api/v1/vendors/catalog` - Get catalog
- `GET /api/v1/vendors/orders` - Get orders
- `POST /api/v1/vendors/orders/:orderId/accept` - Accept order
- `POST /api/v1/vendors/orders/:orderId/reject` - Reject order
- `POST /api/v1/vendors/orders/:orderId/complete` - Complete order
- `GET /api/v1/vendors/messages` - Get messages
- `GET /api/v1/vendors/messages/:roomId` - Get room messages
- `GET /api/v1/vendors/reviews` - Get reviews

### Rider Endpoints

- `POST /api/v1/riders/register` - Register rider
- `POST /api/v1/riders/login/step-1` - Request OTP
- `POST /api/v1/riders/login/step-2` - Verify OTP and login
- `GET /api/v1/riders/profile` - Get profile
- `PUT /api/v1/riders/profile` - Update profile
- `POST /api/v1/riders/profile/photo` - Upload profile photo
- `POST /api/v1/riders/go-online` - Go online
- `POST /api/v1/riders/go-offline` - Go offline
- `GET /api/v1/riders/online` - Get online riders

## Socket.IO Events

### Client to Server

- `user:online` - User comes online
- `message:join-room` - Join a message room
- `message:send` - Send a message
- `message:read` - Mark message as read
- `message:typing` - User is typing
- `message:stop-typing` - User stopped typing

### Server to Client

- `message:received` - New message received
- `message:status-updated` - Message status changed
- `message:user-typing` - User is typing
- `message:user-stop-typing` - User stopped typing

## Database Schema

### User Models

- **Customer**: Basic user profile with location
- **Vendor**: Business profile with verification status
- **Rider**: Driver profile with verification and online status

### Business Models

- **CatalogItem**: Vendor's products/services
- **Order**: Customer orders to vendors
- **Review**: Customer reviews for vendors
- **FavoriteVendor**: Customer's favorite vendors

### Messaging Models

- **MessageRoom**: Conversation between customer and vendor
- **Message**: Individual messages with delivery status

### Authentication

- **OTPVerification**: OTP records for verification

## Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Production
pnpm build           # Compile TypeScript
pnpm start           # Run compiled code

# Database
pnpm prisma:generate # Generate Prisma client
pnpm prisma:migrate  # Push schema to database
pnpm prisma:push     # Push schema to database
pnpm prisma:studio   # Open Prisma Studio GUI

# Linting
pnpm lint            # Check code quality
pnpm lint:fix        # Fix code issues
pnpm type-check      # Check TypeScript types
```

## Authentication Flow

### Customer Authentication

1. **Registration**: Basic info → OTP verification → Create account → Auto login
2. **Login**: Email → OTP request → OTP verification → Login

### Vendor Authentication

1. **Registration**: Business info → Personal info → OTP verification → Login
2. **Login**: Email + OTP → Verify → Login OR Email + Password → Login

### Rider Authentication

1. **Registration**: All documents → Create account (Pending verification)
2. **Login**: Email → OTP verification → Login (if verified)

## Email Templates

- **OTP Verification**: 4-digit code with 15-minute expiry
- **Welcome Email**: Account creation confirmation
- **Verification Status**: Account approval/rejection notification
- **Order Notification**: New order alert for vendor

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **OTP Expiry**: 15-minute validity period
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Rate Limiting**: Available for implementation
- **Input Validation**: Joi schema validation

## Error Handling

Global error handler catches all errors and returns:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "path": "/api/v1/..."
}
```

## Logging

Winston logger outputs to:

- **Console**: Real-time development logs
- **Files**:
  - `logs/error.log`: Error logs only
  - `logs/combined.log`: All logs

## API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`

All endpoints are fully documented with:

- Request body schemas
- Response examples
- Parameter descriptions
- Authentication requirements

## Development Tips

1. **Debugging**: Use Winston logger with `[v0]` prefix for debug statements
2. **Testing**: Use Postman or Swagger UI for API testing
3. **Database**: Use Prisma Studio for database exploration: `pnpm prisma:studio`
4. **Hot Reload**: Changes automatically reload with `ts-node-dev`

## Best Practices

- All services use descriptive logging
- Custom errors with status codes and error codes
- Async/await error handling throughout
- Transaction support for multi-step operations
- Validation at controller and service levels
- Separation of concerns (routes → controllers → services)

## Future Enhancements

- Rate limiting per IP/user
- Payment gateway integration (Stripe)
- Admin dashboard endpoints
- Advanced geolocation features
- Notification system (Push notifications)
- Analytics and reporting
- Two-factor authentication
- Social login integration

## Support

For issues or questions, please contact: support@chariotconnect.com

## License

ISC
