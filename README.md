# PENANGGUNGAN DOSA - APOCALYPSE EDITION

![Version](https://img.shields.io/badge/version-1.0.0-red)
![Three.js](https://img.shields.io/badge/Three.js-r150-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

A **TRIPLE A QUALITY** horror survival game built with React, Three.js, and Node.js. Full-stack implementation with multiplayer support, save system, and advanced AI.

## Features

### Core Gameplay
- First-person horror survival experience
- Advanced AI enemies with behavior trees (Patrol, Chase, Attack, Investigate)
- Dynamic sanity system affecting gameplay and visuals
- Flashlight with battery management
- Inventory system with crafting
- Multiple difficulty levels (Easy, Normal, Hard, Nightmare)

### Technical Features
- **3D Graphics**: Three.js with React Three Fiber
- **Physics**: Realistic collision detection and movement
- **Post-Processing**: Bloom, vignette, chromatic aberration, noise
- **Particle Systems**: Dust, embers, mist, spirit particles
- **Audio**: Spatial 3D audio with dynamic mixing
- **AI**: State machine-based enemy behavior
- **Multiplayer**: Socket.io real-time co-op
- **Save System**: MongoDB with auto-save functionality

### Backend Features
- **Authentication**: JWT-based user auth
- **Database**: MongoDB with Mongoose
- **API**: RESTful endpoints for game data
- **Multiplayer**: Real-time socket connections
- **Leaderboard**: Global rankings by category

## Project Structure

```
penanggungan-dosa-apocalypse/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── server.js        # Express server
│   └── ...
├── src/
│   ├── game/
│   │   ├── components/  # 3D game components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── systems/     # Game systems
│   │   └── types/       # TypeScript types
│   ├── store/           # Zustand state management
│   ├── ui/              # UI components
│   └── ...
├── public/              # Static assets
└── ...
```

## Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd penanggungan-dosa-apocalypse
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

4. Start the development servers:
```bash
# Start both frontend and backend
npm run fullstack

# Or start separately:
npm run server:dev  # Backend
npm run dev         # Frontend
```

5. Open http://localhost:5173 in your browser

## Game Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Movement |
| Shift | Sprint |
| Ctrl | Crouch |
| E | Interact |
| F | Toggle Flashlight |
| I | Inventory |
| ESC | Pause Menu |
| Mouse | Look Around |
| Click | Lock Cursor |

## Game Mechanics

### Sanity System
- Sanity decreases when near enemies or in dark areas
- Low sanity causes visual distortions and hallucinations
- Can be restored with specific items

### Enemy AI
- **Ghost**: Fast, can pass through walls, drains sanity
- **Demon**: High health, powerful attacks
- **Shadow**: Very fast, hard to see
- **Boss**: Massive health, special attacks

### Flashlight
- Battery drains over time
- Flickers when battery is low
- Can be recharged with batteries

### Inventory
- Collect items throughout the game
- Use consumables to restore health/sanity
- Keys to unlock doors
- Documents reveal the story

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Game
- `GET /api/game/saves` - Get all saves
- `POST /api/game/saves` - Create new save
- `PUT /api/game/saves/:id` - Update save
- `DELETE /api/game/saves/:id` - Delete save
- `POST /api/game/autosave` - Auto save

### Leaderboard
- `GET /api/leaderboard/:category/:difficulty` - Get leaderboard
- `POST /api/leaderboard/submit` - Submit score

### Multiplayer
- `GET /api/multiplayer/rooms` - Get active rooms
- `POST /api/multiplayer/rooms` - Create room

## Technologies Used

### Frontend
- React 18
- TypeScript 5
- Three.js / React Three Fiber
- Zustand (State Management)
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- MongoDB / Mongoose
- Socket.io
- JWT Authentication
- bcryptjs

### 3D Assets
- Free PBR textures from Three.js examples
- Procedural geometry
- Custom shaders

## Performance

### Optimizations
- Frustum culling
- LOD (Level of Detail)
- Texture compression
- Shadow map optimization
- Particle pooling

### Quality Settings
- **Low**: Reduced shadows, no post-processing
- **Medium**: Basic shadows, minimal post-processing
- **High**: Full shadows, all post-processing
- **Ultra**: Maximum quality, 2K shadows

## Development

### Adding New Enemies
1. Create enemy type in `src/game/types/index.ts`
2. Add configuration in `EnemyManager.tsx`
3. Implement AI behavior in behavior tree

### Adding New Levels
1. Create level component in `World.tsx`
2. Add spawn points and objects
3. Update level transition logic

### Adding New Items
1. Define item type in types
2. Add to inventory system
3. Create 3D model or icon
4. Implement use effect

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Credits

- **Game Design**: Inspired by classic horror games
- **3D Assets**: Three.js examples, free PBR textures
- **Audio**: Pixabay free sound effects
- **Fonts**: Cinzel Decorative, IM Fell English

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**WARNING**: This game contains horror themes, jump scares, and disturbing imagery. Player discretion is advised.
