import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { baseValidators } from '../../validators/schemas/base.js';
import { ROLES } from '../../config/permissions.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    validate: {
      validator: (v) => baseValidators.username(v).isValid,
      message: (props) => baseValidators.username(props.value).message
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => baseValidators.email(v).isValid,
      message: (props) => baseValidators.email(props.value).message
    }
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: (v) => !v || baseValidators.phone(v).isValid,
      message: (props) => baseValidators.phone(props.value).message
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: (v) => {
        if (v.startsWith('$2a$')) return true;
        return baseValidators.password(v).isValid;
      },
      message: (props) => baseValidators.password(props.value).message
    }
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER
  },
  interests: [{
    type: String,
    trim: true
  }],
  newsletterSubscribed: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

// Générer un token de réinitialisation de mot de passe
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Méthode pour vérifier les permissions
userSchema.methods.hasPermission = function(requiredPermission) {
  // Si c'est un super admin, il a toutes les permissions
  if (this.role === ROLES.SUPER_ADMIN) return true;

  // Vérifier les permissions explicites
  return this.permissions.includes(requiredPermission);
};

// Méthode pour mettre à jour les permissions basées sur le rôle
userSchema.methods.updatePermissionsBasedOnRole = function() {
  const { ROLE_PERMISSIONS } = require('../../config/permissions.js');
  this.permissions = ROLE_PERMISSIONS[this.role] || [];
};

export const User = mongoose.model('User', userSchema);
export default User;
