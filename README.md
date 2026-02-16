# Chariot Connect Admin Backend

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure the following:
   - `DATABASE_URL`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `GMAIL_USER`: Gmail address for sending emails
   - `GMAIL_PASSWORD`: Gmail app password
   - `SERVER_PORT`: Server port (default: 5000)

3. **Generate Prisma client**

   ```bash
   npm run prisma:generate
   ```

4. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```

## Running the Server

**Development**

```bash
npm run dev
```

**Production**

```bash
npm run build
npm run start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/change-password` - Change password

### User Management

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status
- `PATCH /api/users/:id/reset-password` - Reset user password
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/activity-logs` - Get user activity logs

## API Documentation

Once the server is running, access the interactive API documentation:

**Swagger UI**: `http://localhost:5000/api-docs`

## Roles & Permissions

### Roles

- **SUPER_ADMIN**: Full access to all features
- **ADMIN**: Administrative access with limited permissions
- **STAFF**: Basic staff access

### Key Permissions

- `activity_log:read`
- `user:manage`

## Database Schema

The application uses MongoDB with Prisma ORM. Key models:

- **User**: Authentication and user information
- **OTPVerification**: OTP records for 2FA
- **ActivityLog**: User activity tracking

## Error Handling

All API responses follow a consistent format:

**Success Response**

```json
{
  "success": true,
  "data": {}
}
```

**Error Response**

```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Features

- JWT token expiration
- OTP-based 2FA
- Password hashing with bcryptjs
- Role-based access control
- Activity logging
- Input validation
- CORS support

## Development

### Project Structure

```
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── lib/
│   ├── utils/
│   ├── types/
│   └── config/
├── prisma/
│   └── schema.prisma
├── dist/
├── tsconfig.json
└── package.json
```

### Code Quality

- TypeScript for type safety
- Service-Controller-Router pattern
- Async/await for promise handling
- Comprehensive error handling
- Activity logging middleware

## Environment Variables

See `.env.example` for all required environment variables:

- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRE
- OTP_EXPIRE
- GMAIL_USER
- GMAIL_PASSWORD
- SMTP_HOST
- SMTP_PORT
- SERVER_PORT
- NODE_ENV
