const mongoose = require('mongoose');

const packSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  tagline: String,
  description: String,
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'XOF',
  },
  features: [String],
  // Fichiers PDF associés au pack
  documents: [{
    title: String,
    filename: String,       // Nom du fichier sur le serveur (jamais exposé)
    fileSize: Number,
    pageCount: Number,
    order: { type: Number, default: 0 },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  salesCount: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Pack', packSchema);
