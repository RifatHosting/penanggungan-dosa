const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SaveGame = require('../models/SaveGame');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all saves for user
router.get('/saves', authenticate, async (req, res) => {
  try {
    const saves = await SaveGame.find({ userId: req.userId })
      .sort({ saveDate: -1 })
      .limit(10);
    res.json(saves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific save
router.get('/saves/:id', authenticate, async (req, res) => {
  try {
    const save = await SaveGame.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }
    
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new save
router.post('/saves', authenticate, async (req, res) => {
  try {
    const saveData = {
      userId: req.userId,
      ...req.body
    };

    const save = new SaveGame(saveData);
    await save.save();

    res.status(201).json(save);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update save
router.put('/saves/:id', authenticate, async (req, res) => {
  try {
    const save = await SaveGame.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, saveDate: new Date() },
      { new: true }
    );

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json(save);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete save
router.delete('/saves/:id', authenticate, async (req, res) => {
  try {
    const save = await SaveGame.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ message: 'Save deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto save
router.post('/autosave', authenticate, async (req, res) => {
  try {
    let autoSave = await SaveGame.findOne({
      userId: req.userId,
      isAutoSave: true
    });

    if (autoSave) {
      Object.assign(autoSave, { ...req.body, saveDate: new Date() });
      await autoSave.save();
    } else {
      autoSave = new SaveGame({
        userId: req.userId,
        isAutoSave: true,
        saveName: 'Auto Save',
        ...req.body
      });
      await autoSave.save();
    }

    res.json(autoSave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update play time
router.post('/playtime', authenticate, async (req, res) => {
  try {
    const { minutes } = req.body;
    
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'profile.totalPlayTime': minutes }
    });

    res.json({ message: 'Play time updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get game statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const saves = await SaveGame.find({ userId: req.userId });
    const user = await User.findById(req.userId);

    const stats = {
      totalSaves: saves.length,
      totalPlayTime: user.profile.totalPlayTime,
      gamesCompleted: user.profile.gamesCompleted,
      deaths: user.profile.deaths,
      collectiblesFound: user.profile.collectiblesFound,
      achievements: user.achievements.length,
      completionRate: saves.length > 0 
        ? (saves.filter(s => s.gameState.storyProgress >= 100).length / saves.length * 100).toFixed(2)
        : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
