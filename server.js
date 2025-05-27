const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // serve frontend files

const users = new Map(); // socket.id -> username
const userColors = new Map(); // username -> color

const colors = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

function getColor(username) {
  if (userColors.has(username)) return userColors.get(username);
  const color = colors[Math.floor(Math.random() * colors.length)];
  userColors.set(username, color);
  return color;
}

io.on('connection', (socket) => {
  console.log('A user connected');

  // Receive username from client
  socket.on('set username', (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit('user joined', username);
  });

  socket.on('chat message', (msg) => {
    const username = users.get(socket.id) || 'Anonymous';
    const color = getColor(username);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    io.emit('chat message', { username, msg, color, timestamp });
  });

  socket.on('typing', (isTyping) => {
    const username = users.get(socket.id);
    socket.broadcast.emit('typing', { username, isTyping });
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    socket.broadcast.emit('user left', username);
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

