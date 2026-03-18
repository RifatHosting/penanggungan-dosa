const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Leaderboard = require('../models/Leaderboard');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get leaderboard by category and difficulty
router.get('/:category/:difficulty', async (req, res) => {
  try {
    const { category, difficulty } = req.params;
    
    let leaderboard = await Leaderboard.findOne({ category, difficulty });
    
    if (!leaderboard) {
      return res.json({
        category,
        difficulty,
        entries: []
      });
    }

    res.json({
      category,
      difficulty,
      entries: leaderboard.getTopEntries(20)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit score
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { category, difficulty, score, playTime, stats } = req.body;

    let leaderboard = await Leaderboard.findOne({ category, difficulty });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        category,
        difficulty,
        entries: []
      });
    }

    const entry = {
      userId: req.userId,
      username: req.username,
      score,
      playTime,
      stats,
      completionDate: new Date()
    };

    await leaderboard.addEntry(entry);

    const rank = leaderboard.entries.findIndex(e => 
      e.userId.toString() === req.userId && e.score === score
    ) + 1;

    res.json({
      message: 'Score submitted successfully',
      rank,
      topEntries: leaderboard.getTopEntries(10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user rank
router.get('/rank/:category/:difficulty', authenticate, async (req, res) => {
  try {
    const { category, difficulty } = req.params;
    
    const leaderboard = await Leaderboard.findOne({ category, difficulty });
    
    if (!leaderboard) {
      return res.json({ rank: null, score: null });
    }

    const userEntry = leaderboard.entries.find(e => 
      e.userId.toString() === req.userId
    );

    if (!userEntry) {
      return res.json({ rank: null, score: null });
    }

    const rank = leaderboard.entries.findIndex(e => 
      e.userId.toString() === req.userId && e.score === userEntry.score
    ) + 1;

    res.json({ rank, score: userEntry.score, entry: userEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Leaderboard.distinct('category');
    const difficulties = await Leaderboard.distinct('difficulty');
    
    res.json({ categories, difficulties });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
