import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { HTTP_STATUS, ApiError, validate } from '../utils/index.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    validate: {
      validator: (v) => validate.username(v).isValid,
      message: 'Username must start with a letter and contain only letters, numbers, and underscores (3-30 characters)'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => validate.email(v).isValid,
      message: 'Please provide a valid email address'
    }
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        // Valide les numéros de téléphone internationaux (format E.164)
        // Exemple: +33612345678
        return !v || /^\+[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} n'est pas un numéro de téléphone international valide! Format attendu: +33612345678`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: (v) => validate.password(v).isValid,
      message: 'Password must contain uppercase, lowercase, number, and special character'
    },
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'Role {VALUE} is not valid'
    },
    default: 'user'
  },
  newsletterSubscribed: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for optimizing queries
userSchema.index({ email: 1, username: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error hashing password'));
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error comparing passwords');
  }
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
