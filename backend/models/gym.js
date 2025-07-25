const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  gymName: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'GymAdmin', required: false },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  passwordResetOTP: { type: String },
passwordResetOTPExpiry: { type: Date },
   
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    lat: { type: Number }, // Latitude coordinate
    lng: { type: Number }  // Longitude coordinate
  },

  description: { type: String, required: true },
  gymPhotos: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  logoUrl: { type: String },

  equipment: [{
    id: { type: String, default: () => new Date().getTime().toString() },
    name: { type: String, required: false }, // Made optional for backward compatibility
    brand: { type: String },
    category: { type: String, enum: ['cardio', 'strength', 'functional', 'flexibility', 'accessories', 'other'], default: 'other' },
    model: { type: String },
    quantity: { type: Number, default: 1 },
    status: { type: String, enum: ['available', 'maintenance', 'out-of-order'], default: 'available' },
    purchaseDate: { type: Date },
    price: { type: Number },
    warranty: { type: Number }, // warranty period in months
    location: { type: String }, // location within gym
    description: { type: String },
    specifications: { type: String },
    photos: [{ type: String }], // Array of photo URLs
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  activities: [{
    name: { type: String, required: true },
    icon: { type: String, default: 'fa-dumbbell' }, // FontAwesome icon class
    description: { type: String, default: '' }
  }],

  membershipPlans: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      discountMonths: { type: Number, default: 0 },
      benefits: [{ type: String }],
      note: { type: String },
      icon: { type: String, default: 'fa-leaf' },
      color: { type: String, default: '#38b000' }
    }
  ],

  contactPerson: { type: String, required: true },  // Use contactPerson for the owner's name
  supportEmail: { type: String, required: true },
  supportPhone: { type: String, required: true },
  openingTime: { type: String, required: true },
  closingTime: { type: String, required: true },

  membersCount: { type: Number, required: true, default: 0 }, // added new field
  status: { type: String, default: 'pending' },
  rejectionReason: { type: String },

  lastLogin: { type: Date }, // Track last login for dashboard usage

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  approvedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date
  }
});

// Automatically update `updatedAt` on save
gymSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  
  // Convert old string equipment format to new object format
  if (this.equipment && this.equipment.length > 0) {
    this.equipment = this.equipment.map(item => {
      // If item is a string, convert to object
      if (typeof item === 'string') {
        return {
          id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
          name: item,
          category: 'other',
          quantity: 1,
          status: 'available',
          photos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      // If item is already an object but missing required fields, add them
      if (typeof item === 'object' && item !== null) {
        if (!item.name && typeof item === 'string') {
          item.name = item.toString();
        }
        if (!item.id) {
          item.id = new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);
        }
        if (!item.category) {
          item.category = 'other';
        }
        if (!item.quantity) {
          item.quantity = 1;
        }
        if (!item.status) {
          item.status = 'available';
        }
        if (!item.photos) {
          item.photos = [];
        }
        if (!item.createdAt) {
          item.createdAt = new Date();
        }
        item.updatedAt = new Date();
      }
      return item;
    });
  }
  
  next();
});

module.exports = mongoose.models.Gym || mongoose.model('Gym', gymSchema);
