import mongoose from 'mongoose';
import { baseValidators } from '../../validators/schemas/base.js';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    validate: {
      validator: (v) => baseValidators.name(v).isValid,
      message: (props) => baseValidators.name(props.value).message
    }
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    validate: {
      validator: (v) => v.length >= 10 && v.length <= 1000,
      message: 'Description must be between 10 and 1000 characters'
    }
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: (v) => v > new Date(),
      message: 'Event date must be in the future'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  maxParticipants: {
    type: Number,
    min: [1, 'Max participants must be at least 1'],
    max: [1000, 'Max participants cannot exceed 1000']
  },
  registrationDeadline: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v < this.date;
      },
      message: 'Registration deadline must be before the event date'
    }
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Mise à jour automatique de updatedAt
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Event = mongoose.model('Event', eventSchema);
export default Event;
