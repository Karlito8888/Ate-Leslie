export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
};

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENT: ['application/pdf'],
};

export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
};

export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
};
