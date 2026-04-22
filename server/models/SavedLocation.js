import mongoose from '../db/mongooseShim.js';

const savedLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      default: 'Без адреса',
    },
    emoji: {
      type: String,
      default: '📍',
      enum: ['🏠', '💼', '☕', '🏥', '🏫', '🏋️', '🎮', '🍽️', '⛪', '🏞️', '📍'],
    },
    color: {
      type: String,
      default: '#63b4ff',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index для быстрого поиска по юзеру
savedLocationSchema.index({ userId: 1 });

export default mongoose.model('SavedLocation', savedLocationSchema);
