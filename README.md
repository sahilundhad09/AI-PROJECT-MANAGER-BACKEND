# AI Project Manager - Backend

Backend API for the AI Project Manager SaaS application built with Node.js, Express, PostgreSQL, and Redis.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 16
- **ORM:** Sequelize
- **Cache:** Redis
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Zod
- **Security:** Helmet, CORS, bcrypt, Rate Limiting

## Features

- ✅ **Authentication System** - JWT-based auth with refresh tokens
- ✅ **User Management** - Registration, login, profile management
- ✅ **Security** - Password hashing, token revocation, rate limiting
- 🚧 **Workspace Management** - Multi-tenant workspace support (coming soon)
- 🚧 **Project Management** - Project CRUD with member management (coming soon)
- 🚧 **Task Management** - Kanban board with drag-and-drop (coming soon)
- 🚧 **AI Integration** - OpenAI-powered task generation and chatbot (coming soon)

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose (optional)

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Environment
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ai_project_manager

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI API (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@aiprojectmanager.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

```bash
# Install dependencies
npm install

# Run database migrations
npx sequelize-cli db:migrate

# Start development server
npm run dev
```

## Using Docker

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Run migrations
npm run migrate

# Start server
npm run dev
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

#### Get Profile (Protected)
```http
GET /api/v1/auth/profile
Authorization: Bearer {accessToken}
```

#### Update Profile (Protected)
```http
PUT /api/v1/auth/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890"
}
```

#### Change Password (Protected)
```http
POST /api/v1/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── jwt.js
│   ├── database/
│   │   ├── models/       # Sequelize models
│   │   └── migrations/   # Database migrations
│   ├── modules/          # Feature modules
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── project/
│   │   ├── task/
│   │   ├── collaboration/
│   │   ├── ai/
│   │   └── reporting/
│   ├── shared/           # Shared utilities
│   │   ├── middleware/
│   │   └── utils/
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── .env.example
├── .gitignore
├── .sequelizerc
├── Dockerfile
├── package.json
└── README.md
```

## Database Models

- **User** - User accounts and authentication
- **RefreshToken** - JWT refresh token management
- **Workspace** - Multi-tenant workspaces
- **WorkspaceMember** - Workspace membership with RBAC
- **WorkspaceInvitation** - Workspace invitations
- **Project** - Projects within workspaces
- **ProjectMember** - Project membership
- **Task** - Tasks with Kanban support
- **TaskStatus** - Custom Kanban columns
- **Comment** - Task comments
- **Attachment** - File attachments
- **ActivityLog** - Audit trail
- **Notification** - In-app notifications
- **AIChatSession** - AI chat conversations
- **AIChatMessage** - AI chat messages

## Scripts

```bash
# Development
npm run dev          # Start dev server with nodemon

# Database
npm run migrate      # Run migrations
npm run migrate:undo # Rollback last migration

# Production
npm start           # Start production server
```

## Security Features

- Password hashing with bcrypt
- JWT access & refresh tokens
- Token revocation on password change
- Rate limiting to prevent brute force
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection protection (Sequelize ORM)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

Sahil Undhad

## Support

For support, email sahilundhad09@gmail.com
