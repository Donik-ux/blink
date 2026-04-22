import mongoose from '../db/mongooseShim.js';

const locationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: 'Неизвестное место',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
      // TTL индекс: документы удаляются через 24 часа
      expires: 86400,
    },
  },
  { timestamps: false }
);

export default mongoose.model('Location', locationSchema);
