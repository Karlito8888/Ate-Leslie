import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  images: [{
    original: {
      path: String,
      filename: String,
      width: Number,
      height: Number
    },
    thumbnails: {
      small: {
        path: String,
        filename: String,
        width: Number,
        height: Number
      },
      medium: {
        path: String,
        filename: String,
        width: Number,
        height: Number
      },
      large: {
        path: String,
        filename: String,
        width: Number,
        height: Number
      }
    }
  }],
  startDate: {
    type: Date,
    required: [true, 'Event start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Event end date is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Assurez-vous que la date de fin est après la date de début
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
