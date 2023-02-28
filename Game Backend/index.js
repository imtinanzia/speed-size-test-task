const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
const PORT = 8888;

let players = [];
let round = 0;
let rooms = [];

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on('join-game', (username) => {
    console.log('username', username);
    players.push({
      id: socket.id,
      username,
      score: 0,
      alltime: [],
      time: 0,
    });
    round = 1;

    ////////////////////////////////
    if (rooms.length < 1) {
      rooms.push({
        roomId: socket.id,
        player1: username,
        player2: '',
        waiting: true,
      });
      socket.emit(`waitingforplayer`, rooms[rooms.length - 1]);
    } else {
      rooms.forEach((x) => {
        if (x.player2 === '') {
          x.player2 = username;
          (x.waiting = false),
            socket
              .to(x.roomId)
              .emit(`waitingforplayer`, rooms[rooms.length - 1]);
          startGame(username, round);
        } else if (
          rooms[rooms.length - 1].player1 !== '' &&
          rooms[rooms.length - 1].player2 !== ''
        ) {
          rooms.push({
            roomId: socket.id,
            player1: username,
            player2: '',
            waiting: true,
          });
          socket.emit(`waitingforplayer`, rooms[rooms.length - 1]);
        }
      });
    }
    console.log('<== rooms ==>', rooms);
    ////////////////////////////////
  });

  socket.on('round-started', ({ round }) => {
    console.log(`Round ${round} started`);
    io.emit('green-ball-index', getGreenBallIndex());
  });

  socket.on('green-ball-clicked', ({ username, time }) => {
    console.log(`${username} clicked the green ball`);
    const player = players.find((p) => p.username === username);
    player.score += 1;
    player.time = time;
    player.alltime.push(time);
    round += 1;

    if (round < 5) {
      socket.emit('round-ended', { player, round });
      socket.broadcast.emit('round-ended', { player, round });
    } else {
      socket.emit('game-ended', { player });
      socket.broadcast.emit('game-ended', { player });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
    const index = players.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      players.splice(index, 1);
    }
  });
});

function startGame(username, round) {
  io.emit('game-started', { username, round });
  players.forEach((player) => {
    player.score = 0;
    player.time = 0;
  });
}

function getGreenBallIndex() {
  return Math.floor(Math.random() * 9);
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
