const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    avatar: { type: String, default: 'default-avatar.png' },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 },
    gamesCompleted: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    collectiblesFound: { type: Number, default: 0 }
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    unlockedAt: { type: Date, default: Date.now },
    icon: String
  }],
  settings: {
    graphics: {
      quality: { type: String, default: 'high' },
      shadows: { type: Boolean, default: true },
      postProcessing: { type: Boolean, default: true },
      fov: { type: Number, default: 70 }
    },
    audio: {
      masterVolume: { type: Number, default: 1.0 },
      musicVolume: { type: Number, default: 0.7 },
      sfxVolume: { type: Number, default: 1.0 },
      voiceVolume: { type: Number, default: 1.0 }
    },
    controls: {
      mouseSensitivity: { type: Number, default: 0.0022 },
      invertY: { type: Boolean, default: false },
      keybindings: {
        forward: { type: String, default: 'KeyW' },
        backward: { type: String, default: 'KeyS' },
        left: { type: String, default: 'KeyA' },
        right: { type: String, default: 'KeyD' },
        sprint: { type: String, default: 'ShiftLeft' },
        interact: { type: String, default: 'KeyE' },
        flashlight: { type: String, default: 'KeyF' },
        inventory: { type: String, default: 'KeyI' },
        pause: { type: String, default: 'Escape' }
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
