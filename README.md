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
- ✅ **Workspace Management** - Multi-tenant workspace support with RBAC
- ✅ **Project Management** - Project CRUD with member management and custom labels
- ✅ **Task Management** - Kanban board support, subtasks, dependencies, and tags
- ✅ **AI Integration** - Groq-powered task generation, summaries, and smart assistant
- ✅ **Collaboration** - Real-time comments, file attachments, and activity logs
- ✅ **Notifications** - Integrated in-app and email notification system
- ✅ **Analytics** - Comprehensive project, workspace, and user performance reporting

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose (optional)

## Configuration

The backend requires several environment variables for database connection, JWT, AI services, and email. 

Copy the example environment file and fill in your values:
```bash
cp ../.env.example .env
```

Refer to the root `.env.example` for the full list of required variables.

## Installation & Running

```bash
# Install dependencies
npm install

# Run database migrations
npx sequelize-cli db:migrate

# Start development server
npm run dev
```

## API Documentation

For a complete list of all 80+ API endpoints, including request/response examples and Postman guide, please refer to:

👉 **[COMPLETE_API_GUIDE.md](../COMPLETE_API_GUIDE.md)**

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── database/
│   │   ├── models/       # Sequelize models
│   │   └── migrations/   # Database migrations
│   ├── modules/          # Feature modules (Auth, Workspace, Project, Task, AI, etc.)
│   ├── shared/           # Shared utilities & middleware
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── .gitignore
├── .sequelizerc
├── Dockerfile
├── package.json
└── README.md
```

## Database Models

The system uses a comprehensive schema with 23+ tables including `Users`, `Workspaces`, `Projects`, `Tasks`, `ActivityLogs`, `Notifications`, and `AI` related tables.

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
- Role-based access control (RBAC)
- Rate limiting & CORS protection
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

---

## Author

**Sahil Undhad**
[sahilundhad09@gmail.com](mailto:sahilundhad09@gmail.com)
