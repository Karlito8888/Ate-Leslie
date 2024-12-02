import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/index.js';

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
  // Health Check Route
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Checks if the server is running',
      responses: {
        '200': {
          description: 'Server is running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  // Auth Routes
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user account',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string', minLength: 2 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password', minLength: 8 },
                confirmPassword: { type: 'string', format: 'password', minLength: 8 },
                newsletterSubscribed: { type: 'boolean', default: true }
              },
              required: ['username', 'email', 'password', 'confirmPassword']
            }
          }
        }
      },
      responses: {
        '201': { description: 'User registered successfully' },
        '400': { description: 'Bad request, validation error' }
      }
    }
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password' }
              },
              required: ['email', 'password']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Login successful' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'User logout',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Logout successful' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/auth/password/forgot': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' }
              },
              required: ['email']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Password reset link sent' },
        '404': { description: 'Email not found' }
      }
    }
  },
  '/api/auth/password/reset/{token}': {
    put: {
      tags: ['Authentication'],
      summary: 'Reset password using token',
      parameters: [
        {
          name: 'token',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                password: { type: 'string', format: 'password', minLength: 8 },
                confirmPassword: { type: 'string', format: 'password', minLength: 8 }
              },
              required: ['password', 'confirmPassword']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Password reset successful' },
        '400': { description: 'Invalid or expired token' }
      }
    }
  },
  '/api/auth/password/change': {
    put: {
      tags: ['Authentication'],
      summary: 'Change user password',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                currentPassword: { type: 'string', format: 'password' },
                newPassword: { type: 'string', format: 'password', minLength: 8 },
                confirmPassword: { type: 'string', format: 'password', minLength: 8 }
              },
              required: ['currentPassword', 'newPassword', 'confirmPassword']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Password changed successfully' },
        '400': { description: 'Invalid current password or validation error' }
      }
    }
  },
  '/api/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { 
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    put: {
      tags: ['Authentication'],
      summary: 'Update user profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Profile updated successfully' },
        '400': { description: 'Validation error' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  // User Management Routes (Admin Only)
  '/api/users/admins': {
    get: {
      tags: ['Users'],
      summary: 'Get list of admin users',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { 
          description: 'Successfully retrieved admin users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' }
      }
    }
  },
  '/api/users/users': {
    get: {
      tags: ['Users'],
      summary: 'Get list of all users',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { 
          description: 'Successfully retrieved users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['user', 'admin'] }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' }
      }
    }
  },
  '/api/users/admin/{id}': {
    put: {
      tags: ['Users'],
      summary: 'Update admin user details',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Admin user updated successfully' },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Admin user not found' }
      }
    }
  },
  '/api/users/admin/{id}/password': {
    put: {
      tags: ['Users'],
      summary: 'Change admin user password',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                newPassword: { 
                  type: 'string', 
                  format: 'password', 
                  minLength: 8 
                }
              },
              required: ['newPassword']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Admin password changed successfully' },
        '400': { description: 'Invalid password' },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Admin user not found' }
      }
    }
  },
  // Event Routes
  '/api/events/events': {
    get: {
      tags: ['Events'],
      summary: 'Get list of events',
      responses: {
        '200': { 
          description: 'Successfully retrieved events',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    location: { type: 'string' },
                    images: { 
                      type: 'array', 
                      items: { type: 'string' } 
                    }
                  }
                }
              }
            }
          }
        },
        '500': { description: 'Internal server error' }
      }
    },
    post: {
      tags: ['Events'],
      summary: 'Create a new event',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 3 },
                description: { type: 'string', minLength: 10 },
                date: { type: 'string', format: 'date-time' },
                location: { type: 'string' },
                images: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary'
                  },
                  maxItems: 5
                }
              },
              required: ['title', 'description', 'date']
            }
          }
        }
      },
      responses: {
        '201': { description: 'Event created successfully' },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' }
      }
    }
  },
  '/api/events/events/{id}': {
    get: {
      tags: ['Events'],
      summary: 'Get a specific event by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': { 
          description: 'Successfully retrieved event',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  location: { type: 'string' },
                  images: { 
                    type: 'array', 
                    items: { type: 'string' } 
                  }
                }
              }
            }
          }
        },
        '404': { description: 'Event not found' },
        '500': { description: 'Internal server error' }
      }
    },
    put: {
      tags: ['Events'],
      summary: 'Update an existing event',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 3 },
                description: { type: 'string', minLength: 10 },
                date: { type: 'string', format: 'date-time' },
                location: { type: 'string' },
                images: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary'
                  },
                  maxItems: 5
                }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Event updated successfully' },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Event not found' }
      }
    },
    delete: {
      tags: ['Events'],
      summary: 'Delete an event',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': { description: 'Event deleted successfully' },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Event not found' }
      }
    }
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
            schema: {
              type: 'object',
              properties: {
                email: { 
                  type: 'string', 
                  format: 'email',
                  description: 'Email address to subscribe' 
                }
              },
              required: ['email']
            }
          }
        }
      },
      responses: {
        '201': { description: 'Successfully subscribed to newsletter' },
        '400': { description: 'Invalid email or already subscribed' },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/newsletter/unsubscribe': {
    post: {
      tags: ['Newsletter'],
      summary: 'Unsubscribe from newsletter',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { 
                  type: 'string', 
                  format: 'email',
                  description: 'Email address to unsubscribe' 
                }
              },
              required: ['email']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Successfully unsubscribed from newsletter' },
        '400': { description: 'Invalid email or not subscribed' },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/newsletter/subscribers': {
    get: {
      tags: ['Newsletter'],
      summary: 'Get list of newsletter subscribers',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { 
          description: 'Successfully retrieved subscribers',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    email: { 
                      type: 'string', 
                      format: 'email' 
                    },
                    subscribedAt: { 
                      type: 'string', 
                      format: 'date-time' 
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/newsletter/send': {
    post: {
      tags: ['Newsletter'],
      summary: 'Send newsletter',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                content: { type: 'string' }
              },
              required: ['subject', 'content']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Newsletter sent successfully' },
        '403': { description: 'Forbidden - Admin access required' }
      }
    }
  },

  // Contact Routes
  '/api/contact/send': {
    post: {
      tags: ['Contact'],
      summary: 'Send a contact message',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { 
                  type: 'string', 
                  minLength: 2,
                  description: 'Full name of the sender' 
                },
                email: { 
                  type: 'string', 
                  format: 'email',
                  description: 'Email address of the sender' 
                },
                phone: { 
                  type: 'string', 
                  description: 'Phone number of the sender (optional)' 
                },
                message: { 
                  type: 'string', 
                  minLength: 10,
                  description: 'Message content' 
                }
              },
              required: ['name', 'email', 'message']
            }
          }
        }
      },
      responses: {
        '201': { description: 'Contact message sent successfully' },
        '400': { description: 'Invalid input or validation error' },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/contact/messages': {
    get: {
      tags: ['Contact'],
      summary: 'Get list of contact messages',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { 
          description: 'Successfully retrieved contact messages',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { 
                      type: 'string', 
                      description: 'Unique identifier of the message' 
                    },
                    name: { 
                      type: 'string', 
                      description: 'Full name of the sender' 
                    },
                    email: { 
                      type: 'string', 
                      format: 'email',
                      description: 'Email address of the sender' 
                    },
                    phone: { 
                      type: 'string', 
                      description: 'Phone number of the sender (optional)' 
                    },
                    message: { 
                      type: 'string', 
                      description: 'Message content' 
                    },
                    createdAt: { 
                      type: 'string', 
                      format: 'date-time',
                      description: 'Timestamp of message creation' 
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/contact/messages/{id}': {
    delete: {
      tags: ['Contact'],
      summary: 'Delete a contact message',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': { description: 'Contact message deleted successfully' },
        '401': { description: 'Unauthorized, admin access required' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Contact message not found' }
      }
    }
  }
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
