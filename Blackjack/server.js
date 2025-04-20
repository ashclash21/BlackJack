const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Game state
let players = {}; // Stores player info with their socket ids
let gameRooms = {}; // Stores game state per room
let balances = {}; // Stores player balances

// Serve static files (e.g., HTML, CSS, JS) from the 'public' folder
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle player connection
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // Player joins a room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room: ${room}`);

    // Initialize player balance
    if (!balances[socket.id]) balances[socket.id] = 100;

    // Send initial game state (room state, player balances)
    io.to(socket.id).emit('gameState', gameRooms[room] || {});

    // Broadcast when a player joins
    io.to(room).emit('playerJoined', socket.id);
  });

  // Handle making a move (e.g., hit, stand)
  socket.on('playerMove', (room, move) => {
    const gameState = gameRooms[room] || {};
    // Implement game logic here based on move (hit, stand)
    // Update game state and broadcast to other players in the room
    io.to(room).emit('gameState', gameState);
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    // Remove player from game state
    for (let room in gameRooms) {
      const playersInRoom = gameRooms[room].players;
      if (playersInRoom.includes(socket.id)) {
        gameRooms[room].players = playersInRoom.filter(player => player !== socket.id);
        io.to(room).emit('playerLeft', socket.id);
      }
    }
    delete balances[socket.id];
  });
});

// Set up the server to listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
