// src/lib/models.js
import mongoose from 'mongoose'

// ─── USER ─────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  totalSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
})

// ─── PROJECT ──────────────────────────────────────────────────────────────────
const ChapterSchema = new mongoose.Schema({
  number: Number,
  title: String,
  text: String,
  wordCount: Number,
  generatedAt: { type: Date, default: Date.now },
})

const CharacterSchema = new mongoose.Schema({
  name: String,
  role: String,
  description: String,
})

const OutlineSchema = new mongoose.Schema({
  title: String,
  genre: String,
  logline: String,
  mainCharacters: [CharacterSchema],
  background: String,
  chapterOutlines: [{ chapter: Number, title: String, summary: String }],
  themes: [String],
})

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled Novel' },
  genre: { type: String, required: true },
  idea: { type: String, default: '' },
  paid: { type: Boolean, default: false },
  maxChapters: { type: Number, default: 0 },
  outline: OutlineSchema,
  chapters: [ChapterSchema],
  paymentId: { type: String, default: null },
  totalWords: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'generating', 'complete'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reference: { type: String, unique: true },
  provider: { type: String, enum: ['paystack', 'flutterwave'], required: true },
  chapters: Number,
  originalPrice: Number,
  discount: Number,
  finalPrice: Number,
  couponCode: { type: String, default: null },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
})

// ─── COUPON ───────────────────────────────────────────────────────────────────
const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true },
  discount: Number,
  active: { type: Boolean, default: true },
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema)
export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema)
