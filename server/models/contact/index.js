import mongoose from 'mongoose';
import { baseValidators } from '../../validators/schemas/base.js';

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
    validate: {
      validator: (v) => baseValidators.name(v).isValid,
      message: (props) => baseValidators.name(props.value).message
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
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
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    validate: {
      validator: (v) => v.length >= 10 && v.length <= 500,
      message: 'Message must be between 10 and 500 characters'
    }
  },
  rating: {
    type: Number,
    required: function() { return this.type === 'review'; },
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
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
export default Contact;
