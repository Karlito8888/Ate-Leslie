export const ROLES = {
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superAdmin'
};

export const PERMISSIONS = {
  // Utilisateur
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',

  // Événement
  EVENT_READ: 'event:read',
  EVENT_CREATE: 'event:create',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',
  EVENT_MANAGE: 'event:manage',

  // Contact
  CONTACT_READ: 'contact:read',
  CONTACT_WRITE: 'contact:write',
  CONTACT_MANAGE: 'contact:manage',

  // Newsletter
  NEWSLETTER_SUBSCRIBE: 'newsletter:subscribe',
  NEWSLETTER_SEND: 'newsletter:send'
};

// Définir d'abord les permissions de base pour chaque rôle
const GUEST_PERMISSIONS = [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.NEWSLETTER_SUBSCRIBE
];

const USER_PERMISSIONS = [
  ...GUEST_PERMISSIONS,
  PERMISSIONS.USER_READ,
  PERMISSIONS.EVENT_CREATE,
  PERMISSIONS.CONTACT_WRITE
];

const ADMIN_PERMISSIONS = [
  ...USER_PERMISSIONS,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.EVENT_UPDATE,
  PERMISSIONS.EVENT_DELETE,
  PERMISSIONS.CONTACT_READ,
  PERMISSIONS.CONTACT_MANAGE,
  PERMISSIONS.NEWSLETTER_SEND
];

const SUPER_ADMIN_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.USER_DELETE
];

// Ensuite, créer l'objet ROLE_PERMISSIONS
export const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: GUEST_PERMISSIONS,
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.SUPER_ADMIN]: SUPER_ADMIN_PERMISSIONS
};

export const checkPermission = (userRole, requiredPermission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
};
