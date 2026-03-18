const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: { type: String, enum: ['weapon', 'consumable', 'key', 'document', 'tool', 'misc'] },
  quantity: { type: Number, default: 1 },
  icon: String,
  description: String,
  usable: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed
});

const saveGameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  saveName: {
    type: String,
    required: true
  },
  gameState: {
    currentLevel: { type: String, default: 'church_entrance' },
    checkpoint: { type: String, default: 'start' },
    objective: { type: String, default: 'Masuk ke Gereja Tua' },
    storyProgress: { type: Number, default: 0 },
    unlockedAreas: [{ type: String }],
    completedPuzzles: [{ type: String }],
    triggeredEvents: [{ type: String }]
  },
  playerStats: {
    health: { type: Number, default: 100 },
    sanity: { type: Number, default: 100 },
    stamina: { type: Number, default: 100 },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 1.7 },
      z: { type: Number, default: 18 }
    },
    rotation: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 }
    }
  },
  inventory: [inventoryItemSchema],
  equipment: {
    flashlight: {
      has: { type: Boolean, default: true },
      battery: { type: Number, default: 100 },
      enabled: { type: Boolean, default: true }
    },
    weapon: {
      id: String,
      ammo: { type: Number, default: 0 }
    }
  },
  collectibles: {
    documents: [{ id: String, title: String, content: String, foundAt: Date }],
    photos: [{ id: String, url: String, caption: String }],
    artifacts: [{ id: String, name: String, description: String }]
  },
  worldState: {
    enemyPositions: [{
      enemyId: String,
      type: String,
      position: { x: Number, y: Number, z: Number },
      health: Number,
      state: String
    }],
    interactableStates: [{
      objectId: String,
      interacted: { type: Boolean, default: false },
      state: mongoose.Schema.Types.Mixed
    }],
    doorStates: [{
      doorId: String,
      isOpen: { type: Boolean, default: false },
      isLocked: { type: Boolean, default: true },
      requiredKey: String
    }]
  },
  difficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'nightmare'],
    default: 'normal'
  },
  playTime: { type: Number, default: 0 },
  saveDate: { type: Date, default: Date.now },
  isAutoSave: { type: Boolean, default: false },
  thumbnail: String
});

saveGameSchema.index({ userId: 1, saveDate: -1 });

module.exports = mongoose.model('SaveGame', saveGameSchema);
