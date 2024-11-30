# Event Platform

A modern event platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- Event management
- Merchandise shop
- User authentication
- Responsive design

## Tech Stack

### Frontend
- React with Vite
- SCSS for styling
- Modern ES6+ JavaScript

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies
```bash
npm run install-all
```

3. Set up environment variables
```bash
# Copy example env files
cp server/.env.example server/.env
```

4. Start development servers
```bash
npm run dev
```

## Development

- Frontend runs on: http://localhost:5173
- Backend runs on: http://localhost:5000

## Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── assets/        # Images, fonts, etc.
│       ├── components/    # Reusable components
│       ├── contexts/      # React contexts
│       ├── hooks/         # Custom hooks
│       ├── layouts/       # Layout components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── styles/        # SCSS files
│       └── utils/         # Utility functions
│
└── server/                # Backend Express application
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── middleware/       # Custom middleware
    ├── models/          # Mongoose models
    ├── routes/          # Express routes
    ├── services/        # Business logic
    └── utils/           # Utility functions
```

## Scripts

- `npm run dev`: Start both frontend and backend in development mode
- `npm run client`: Start frontend only
- `npm run server`: Start backend only
- `npm run install-all`: Install dependencies for both frontend and backend
