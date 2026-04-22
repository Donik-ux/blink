import mongoose from '../db/mongooseShim.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Некорректный email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Пароль обязателен'],
      minlength: 6,
    },
    color: {
      type: String,
      default: '#7c3aed', // Случайный при создании
    },
    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },
    ghostMode: {
      type: Boolean,
      default: false,
    },
    privacyMode: {
      type: String,
      enum: ['friends', 'everyone'],
      default: 'friends',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
