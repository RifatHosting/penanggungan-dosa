const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['speedrun', 'survival', 'collectibles', 'completion', 'coop']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'normal', 'hard', 'nightmare']
  },
  entries: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    score: { type: Number, required: true },
    playTime: { type: Number, required: true },
    completionDate: { type: Date, default: Date.now },
    stats: {
      deaths: { type: Number, default: 0 },
      collectiblesFound: { type: Number, default: 0 },
      enemiesDefeated: { type: Number, default: 0 },
      puzzlesSolved: { type: Number, default: 0 }
    },
    replay: {
      hasReplay: { type: Boolean, default: false },
      replayData: mongoose.Schema.Types.Mixed
    }
  }]
}, { timestamps: true });

leaderboardSchema.index({ category: 1, difficulty: 1 });
leaderboardSchema.index({ 'entries.score': -1 });

leaderboardSchema.methods.addEntry = async function(entry) {
  this.entries.push(entry);
  this.entries.sort((a, b) => b.score - a.score);
  
  if (this.entries.length > 100) {
    this.entries = this.entries.slice(0, 100);
  }
  
  return await this.save();
};

leaderboardSchema.methods.getTopEntries = function(limit = 10) {
  return this.entries.slice(0, limit);
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
