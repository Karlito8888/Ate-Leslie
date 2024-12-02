import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const EMAIL_CONFIG = {
  // General configuration
  HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  PORT: parseInt(process.env.EMAIL_PORT || '587'),
  SECURE: process.env.EMAIL_SECURE === 'true',
  
  // Authentication
  USER: process.env.EMAIL_USER,
  PASS: process.env.EMAIL_PASS,
  
  // Sender
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'Your Application',
  FROM_EMAIL: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  
  // URLs
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // Email templates
  TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    NEWSLETTER: 'newsletter'
  },
  
  // Advanced configuration
  MAX_EMAILS_PER_BATCH: 100,
  RETRY_ATTEMPTS: 3
};
