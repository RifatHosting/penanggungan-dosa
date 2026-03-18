const express = require('express');
const router = express.Router();
const { multiplayerRooms } = require('../server');

// Get active rooms
router.get('/rooms', (req, res) => {
  const rooms = Array.from(multiplayerRooms.entries()).map(([id, data]) => ({
    id,
    playerCount: data.players.size,
    gameState: data.gameState,
    players: Array.from(data.players.values()).map(p => ({
      id: p.id,
      username: p.username,
      ready: p.ready || false
    }))
  }));

  res.json(rooms);
});

// Get room info
router.get('/rooms/:roomId', (req, res) => {
  const room = multiplayerRooms.get(req.params.roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    id: req.params.roomId,
    playerCount: room.players.size,
    gameState: room.gameState,
    players: Array.from(room.players.values())
  });
});

// Create room
router.post('/rooms', (req, res) => {
  const { roomId, hostData } = req.body;
  
  if (multiplayerRooms.has(roomId)) {
    return res.status(400).json({ error: 'Room already exists' });
  }

  multiplayerRooms.set(roomId, {
    players: new Map(),
    gameState: 'waiting',
    host: hostData.id,
    createdAt: new Date()
  });

  res.json({ message: 'Room created', roomId });
});

// Delete room
router.delete('/rooms/:roomId', (req, res) => {
  const room = multiplayerRooms.get(req.params.roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  multiplayerRooms.delete(req.params.roomId);
  res.json({ message: 'Room deleted' });
});

module.exports = router;
