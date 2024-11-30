# Event Platform MERN Project

## Project Overview
- **Name**: Event Platform
- **Stack**: MERN (MongoDB, Express, React, Node.js)
- **Primary Goal**: Create a modern, scalable event and merchandise platform

## Technical Architecture

### Frontend
- **Framework**: React with Vite
- **Styling**: SCSS (with specific guidelines)
  - No use of `darken()` and `lighten()` functions
  - Modular SCSS structure
- **State Management**: Context API (potentially)
- **Language**: JavaScript (ES Modules)

### Backend
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based
- **Module System**: ES Modules
- **Error Handling**: Centralized error management
- **CORS**: Configured with environment variables

## Project Structure
```
project-root/
├── client/          # Frontend React/Vite
└── server/
    ├── config/      # Configuration files
    ├── controllers/ # Request handlers
    ├── middleware/  # Express middlewares
    ├── models/      # Mongoose models
    ├── public/      # Static files
    ├── routes/      # API routes
    ├── services/    # Business logic
    ├── utils/       # Helpers & constants
    ├── .env         # Environment variables
    └── index.js     # Entry point
```

## Configuration

### Environment (.env)
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ateleslie
NODE_ENV=development
JWT_SECRET=votre_secret_jwt
CLIENT_URL=http://localhost:5173
```

### Development Scripts
- `npm run dev`: Start entire project (concurrent client & server)
- `npm run client`: Start frontend (Vite)
- `npm run server`: Start backend (Nodemon)
- `npm run install-all`: Install all dependencies

## API Structure

### Current Endpoints
- `GET /`: API health check
- `POST /api/v1/tests`: Test endpoint for database initialization

### Planned Endpoints
- Authentication routes
- Event management
- Merchandise management
- User management

## Database Structure

### Current Collections
- `tests`: Initial test collection

### Planned Collections
- Users
- Events
- Products
- Orders

## Development Standards

### Code Guidelines
- Comments in French
- Variable/function names in English
- ES Modules syntax
- Modular and minimalist approach
- Native solutions preferred over external libraries
- Single `.gitignore` at root level
- ESLint and Prettier configuration

### Security Measures
- CORS configuration with environment variables
- JWT for authentication (planned)
- Secure cookie handling
- Environment variable management
- Error handling that doesn't expose internals
- Input validation (planned)

## Current Status
- ✅ Basic server setup with Express
- ✅ MongoDB connection & models
- ✅ Routes & controllers organization
- ✅ Error handling & CORS
- ✅ Service layer implementation
- ✅ Static files configuration

## Next Development Steps
1. Implement authentication system
2. Create main data models (Users, Events, Products)
3. Develop API routes for core functionality
4. Create frontend components
5. Implement state management
6. Add validation middleware
7. Set up file upload system

---
Note : Ce document sera mis à jour au fur et à mesure du développement du projet.
