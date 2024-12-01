import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { HTTP_STATUS, ApiError, config } from '../utils.js';
import jwt from 'jsonwebtoken';
import { email, phone, username, password } from '../middleware/index.js';

// ====== User Model ======
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    validate: {
      validator: (v) => username(v).isValid,
      message: (props) => username(props.value).message
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => email(v).isValid,
      message: (props) => email(props.value).message
    }
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: (v) => phone(v).isValid,
      message: (props) => phone(props.value).message
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: (v) => {
        if (v.startsWith('$2a$')) return true;
        return password(v).isValid;
      },
      message: (props) => password(props.value).message
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  newsletterSubscribed: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords:', {
    candidatePassword,
    storedPassword: this.password
  });
  const isMatch = await bcryptjs.compare(candidatePassword, this.password);
  console.log('Password match result:', isMatch);
  return isMatch;
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

export const User = mongoose.model('User', userSchema);

// ====== Event Model ======
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true
  },
  images: [{
    original: {
      filename: String,
      path: String,
      width: Number,
      height: Number
    },
    thumbnails: {
      small: { filename: String, path: String },
      medium: { filename: String, path: String },
      large: { filename: String, path: String }
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Event = mongoose.model('Event', eventSchema);

// ====== Contact Model ======
const contactSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Contact type is required'],
    enum: ['information', 'callback', 'review']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => email(v).isValid,
      message: (props) => email(props.value).message
    }
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: (v) => !v || phone(v).isValid,
      message: (props) => phone(props.value).message
    }
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    required: function() { return this.type === 'review'; },
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Contact = mongoose.model('Contact', contactSchema);

// Export all models
export default {
  User,
  Event,
  Contact
};
