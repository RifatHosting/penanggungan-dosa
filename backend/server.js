const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/penanggungan_dosa', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/multiplayer', require('./routes/multiplayer'));

// Socket.io for Multiplayer
const multiplayerRooms = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join-room', (roomId, playerData) => {
    socket.join(roomId);
    
    if (!multiplayerRooms.has(roomId)) {
      multiplayerRooms.set(roomId, {
        players: new Map(),
        gameState: 'waiting'
      });
    }
    
    const room = multiplayerRooms.get(roomId);
    room.players.set(socket.id, {
      id: socket.id,
      ...playerData,
      position: { x: 0, y: 1.7, z: 18 },
      rotation: { x: 0, y: 0, z: 0 },
      health: 100,
      sanity: 100
    });

    socket.to(roomId).emit('player-joined', {
      playerId: socket.id,
      playerData: room.players.get(socket.id)
    });

    socket.emit('room-players', Array.from(room.players.values()));
  });

  socket.on('player-update', (roomId, data) => {
    const room = multiplayerRooms.get(roomId);
    if (room && room.players.has(socket.id)) {
      const player = room.players.get(socket.id);
      Object.assign(player, data);
      socket.to(roomId).emit('player-moved', {
        playerId: socket.id,
        ...data
      });
    }
  });

  socket.on('game-event', (roomId, eventData) => {
    socket.to(roomId).emit('game-event', {
      playerId: socket.id,
      ...eventData
    });
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    multiplayerRooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomId).emit('player-left', socket.id);
        if (room.players.size === 0) {
          multiplayerRooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io, multiplayerRooms };
