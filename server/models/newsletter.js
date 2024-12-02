import mongoose from 'mongoose';
import { INTERESTS } from '../validators/schemas/user.js';

const newsletterSchema = new mongoose.Schema({
  // Informations de base
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  interests: [{
    type: String,
    enum: INTERESTS
  }],
  
  // Préférences d'abonnement
  preferences: {
    events: {
      type: Boolean,
      default: true
    },
    news: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: false
    }
  },
  
  // Métadonnées d'abonnement
  source: {
    type: String,
    enum: ['website', 'event', 'social_media'],
    default: 'website'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Modèle de bulletin d'information
  title: {
    type: String,
    required: function() { return this.type === 'newsletter'; },
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: function() { return this.type === 'newsletter'; }
  },
  category: {
    type: String,
    enum: INTERESTS
  },
  tags: [{
    type: String
  }],
  
  // Métadonnées de publication
  type: {
    type: String,
    enum: ['subscriber', 'newsletter'],
    default: 'subscriber'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  
  // Statistiques
  openRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  clickRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches rapides
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ interests: 1 });
newsletterSchema.index({ status: 1, scheduledDate: 1 });

// Méthode virtuelle pour vérifier si le bulletin est programmé
newsletterSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled' && this.scheduledDate > new Date();
});

// Méthode pour désabonner
newsletterSchema.methods.unsubscribe = function() {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

// Hook pour mettre à jour le statut lors de l'envoi
newsletterSchema.pre('save', function(next) {
  if (this.type === 'newsletter' && this.status === 'sent') {
    this.sentAt = new Date();
  }
  next();
});

export const Newsletter = mongoose.model('Newsletter', newsletterSchema);
