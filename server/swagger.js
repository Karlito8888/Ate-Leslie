import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './utils.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ate Leslie API',
    version: '1.0.0',
    description: 'API documentation for Ate Leslie platform',
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // ====== User Schemas ======
      User: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 8 },
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
          isVerified: { type: 'boolean', default: false },
          avatar: { type: 'string' },
        },
      },
      LoginCredentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },

      // ====== Event Schemas ======
      Event: {
        type: 'object',
        required: ['title', 'description', 'date'],
        properties: {
          title: { type: 'string', minLength: 3 },
          description: { type: 'string', minLength: 10 },
          date: { type: 'string', format: 'date-time' },
          location: { type: 'string' },
          image: { type: 'string' },
          isPublished: { type: 'boolean', default: false },
        },
      },

      // ====== Contact Schemas ======
      Contact: {
        type: 'object',
        required: ['name', 'email', 'message'],
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          message: { type: 'string', minLength: 10 },
          status: { type: 'string', enum: ['pending', 'responded'], default: 'pending' },
        },
      },

      // ====== Newsletter Schemas ======
      Newsletter: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          isSubscribed: { type: 'boolean', default: true },
        },
      },

      // ====== Response Schemas ======
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          message: { type: 'string' },
          error: { type: 'object' },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

// ====== Path Definitions ======
const paths = {
  // Auth Routes
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginCredentials' },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },

  // User Routes
  '/api/users/profile': {
    get: {
      tags: ['Users'],
      summary: 'Get user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update user profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },

  // Event Routes
  '/api/events': {
    get: {
      tags: ['Events'],
      summary: 'Get all events',
      responses: {
        200: {
          description: 'Events retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
      },
    },
    post: {
      tags: ['Events'],
      summary: 'Create new event',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Event' },
          },
        },
      },
      responses: {
        201: {
          description: 'Event created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },

  // Contact Routes
  '/api/contact': {
    post: {
      tags: ['Contact'],
      summary: 'Submit contact form',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Contact' },
          },
        },
      },
      responses: {
        201: {
          description: 'Contact form submitted successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
      },
    },
  },

  // Newsletter Routes
  '/api/newsletter/subscribe': {
    post: {
      tags: ['Newsletter'],
      summary: 'Subscribe to newsletter',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Newsletter' },
          },
        },
      },
      responses: {
        201: {
          description: 'Subscribed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
      },
    },
  },
};

// ====== Response Definitions ======
const responses = {
  BadRequest: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  Unauthorized: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  NotFound: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  ServerError: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
};

// Add responses to swagger definition
swaggerDefinition.components.responses = responses;
// Add paths to swagger definition
swaggerDefinition.paths = paths;

// Configure Swagger
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
