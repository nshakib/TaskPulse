# Project Plan: Todo App Backend

## 1. Problem - What problem are we solving?

Many people need a simple and reliable way to organize daily tasks, track progress, and manage their personal work.

This project aims to build a secure and maintainable Todo management backend that exposes RESTful APIs for users to create, organize, update, complete, and delete their tasks.

The primary goal is to develop a well-structured backend application that demonstrates practical software engineering principles, scalable architecture, secure authentication, and reliable data management.

## 2. Users - Who is this for?

- Individuals who want to manage their personal tasks and daily activities.
- Students organizing academic assignments and study schedules.
- Professionals managing personal work and responsibilities.
- Developers who want to integrate Todo functionality into frontend applications.

Each registered user manages their own tasks. Users must not access or modify another user's private tasks.

## 3. Features - What does the MVP need?

- User registration with email and password.
- User login and authentication.
- Secure password hashing.
- JWT-based authentication and authorization.
- User profile retrieval and management.
- Create, retrieve, update, and delete todos.
- Mark todos as completed or pending.
- Todo priority management (LOW, MEDIUM, HIGH).
- Todo due dates and descriptions.
- Filter todos by status and priority.
- Search todos by title.
- Sort todos by creation date and due date.
- Pagination for todo listing.
- Input validation and centralized error handling.
- API documentation with Swagger/OpenAPI.
- Automated unit and integration tests.

## 4. Data - What are we storing?

### User
- id (UUID)
- name
- email (unique)
- password (hashed)
- createdAt
- updatedAt

### Todo
- id (UUID)
- title
- description (optional)
- status (PENDING, COMPLETED)
- priority (LOW, MEDIUM, HIGH)
- dueDate (optional)
- userId (foreign key)
- createdAt
- updatedAt

### Authentication
- JWT access tokens.
- Refresh tokens only if refresh-token authentication is included in the approved implementation scope.

No plaintext passwords or sensitive authentication credentials should be stored.

## 5. Tech - What stack are we using?

### Backend
- Node.js
- Express.js
- TypeScript

### Database and ORM
- PostgreSQL
- Prisma ORM

### Authentication and Security
- JWT (JSON Web Token)
- bcrypt for password hashing
- Zod for request validation
- Helmet for HTTP security headers
- CORS configuration
- Rate limiting for authentication endpoints

### Development Tools
- Bun or npm as the package manager (use the existing project configuration).
- Git and GitHub for version control.
- Postman for API testing.
- Swagger/OpenAPI for API documentation.
- ESLint and Prettier for code quality.
- Vitest or Jest for automated testing.

### Architecture
- Modular architecture with separation of concerns.
- Route, controller, service, and repository responsibilities.
- Centralized middleware and error handling.
- Reusable validation schemas and utility functions.
- Environment-based configuration.

## 6. Monetize - How will this make money?

This MVP is primarily an educational and portfolio project. There is no monetization requirement.

Potential future monetization options:
- Freemium subscription plans.
- Premium productivity features.
- Team collaboration features.
- Third-party integrations.

These are explicitly outside the MVP scope.

## 7. UI/UX - How should this look and feel?

This project is a backend-only application. It does not include a frontend UI.

The API should provide:
- Consistent JSON response structures.
- Predictable HTTP status codes.
- Clear and descriptive error messages.
- Consistent endpoint naming and REST conventions.
- Useful pagination metadata.
- Clear API documentation through Swagger UI.

Example API response:

    {
      "success": true,
      "message": "Todo created successfully",
      "data": {
        "id": "uuid",
        "title": "Learn TypeScript",
        "status": "PENDING",
        "priority": "HIGH"
      }
    }

The API should be straightforward to integrate with React, Next.js, mobile applications, or other API clients.

## 8. Deployment - Where and how will this ship?

### Target deployment
- Backend hosting: Render.
- Database hosting: Render PostgreSQL or another managed PostgreSQL provider.
- Source code: GitHub.

### Application type
- Node.js REST API.
- Production environment using compiled TypeScript JavaScript output.

### Build command
    bun run build

### Start command
    bun run start

Use the existing package scripts and adapt them if necessary.

### Environment variables

- NODE_ENV
- PORT
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- CORS_ORIGIN

Add refresh-token environment variables only if that functionality is approved.

### Infrastructure requirements
- Managed PostgreSQL database.
- Database migrations during deployment.
- HTTPS-enabled API endpoint.
- Health check endpoint: GET /api/v1/health
- No background workers or cron jobs required for the MVP.

### Domain
- Use the hosting provider's default domain initially.
- A custom domain can be configured later.

## 9. Usage model and constraints

### Known requirements
- Backend-only application.
- Internet-facing REST API after deployment.
- Multiple registered users.
- Each user has access only to their own todos.
- Authentication is required for protected endpoints.
- User ownership must be enforced on the server side.
- Database relationships and constraints must maintain data integrity.

### Security requirements
- Passwords must be hashed before storage.
- Protected endpoints must validate authentication.
- Users must not access another user's data by changing resource IDs.
- Request bodies and query parameters must be validated.
- Secrets must be stored in environment variables.
- Authentication endpoints should have rate limiting.
- Errors must not expose stack traces or sensitive internal information in production.

### Explicit exclusions
- Frontend application.
- Social features and public todo sharing.
- Team collaboration.
- Real-time notifications.
- File uploads and attachments.
- Payment integration.
- AI-powered task management.
- Microservices architecture.

### Engineering constraints
- Use TypeScript with strict type checking.
- Avoid `any` unless absolutely necessary and justified.
- Prefer arrow functions and camelCase naming.
- Follow modular architecture and separation of concerns.
- Use database indexes where they support actual query patterns.
- Avoid unnecessary abstractions and premature optimization.
- Keep the implementation testable and maintainable.