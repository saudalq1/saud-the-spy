const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = {};

const PROMPTS = require('./words.json');


// 25+ Beautiful Secret Agent SVG cartoon doodles
const SPY_SVG_LIBRARY = [
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2300E5FF" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="45" cy="45" r="18"/><line x1="58" y1="58" x2="85" y2="85"/><line x1="72" y1="80" x2="80" y2="72"/></svg>`, // Magnifying Glass
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FF4A4A" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="50" cy="55" r="22"/><path d="M50 33v-10h8"/><circle cx="58" cy="23" r="4" fill="%23FF4A4A"/></svg>`, // Bomb
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23A78BFA" stroke-width="4" fill="none" stroke-linecap="round"><path d="M15 45h70M25 45v-20h50v20M10 55s10-10 40-10 40 10 40 10"/></svg>`, // Fedora Spy Hat
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2334D399" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="35" cy="50" r="12"/><circle cx="65" cy="50" r="12"/><path d="M47 50h6M20 50C20 38 30 35 50 35s30 3 30 15"/></svg>`, // Sunglasses
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FBBF24" stroke-width="4" fill="none" stroke-linecap="round"><rect x="25" y="35" width="50" height="40" rx="4"/><path d="M40 35V25h20v10M35 55h30"/></svg>`, // Briefcase
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FB7185" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="30" cy="50" r="12"/><line x1="42" y1="50" x2="80" y2="50"/><line x1="65" y1="50" x2="65" y2="65"/><line x1="75" y1="50" x2="75" y2="65"/></svg>`, // Key
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2338BDF8" stroke-width="4" fill="none" stroke-linecap="round"><path d="M25 25h50L50 55z"/><line x1="50" y1="55" x2="50" y2="80"/><line x1="35" y1="80" x2="65" y2="80"/><circle cx="50" cy="35" r="4" fill="%2338BDF8"/></svg>`, // Cocktail Shaken Martini
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23A78BFA" stroke-width="4" fill="none" stroke-linecap="round"><path d="M30 65C30 50 40 40 50 40s20 10 20 25M50 40V20M42 20h16"/></svg>`, // Umbrella
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FF4A4A" stroke-width="4" fill="none" stroke-linecap="round"><path d="M25 35h50v40H25z"/><circle cx="50" cy="55" r="10"/><path d="M45 45l10 10M55 45l-10 10"/></svg>`, // Safe/Vault Lock
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2300E5FF" stroke-width="4" fill="none" stroke-linecap="round"><path d="M40 30h20v45H40z"/><path d="M45 40h10M45 50h10M45 60h10"/></svg>`, // Agent Cipher Notebook
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FB7185" stroke-width="4" fill="none" stroke-linecap="round"><path d="M50 20c-15 0-25 10-25 25 0 20 25 35 25 35s25-15 25-35c0-15-10-25-25-25z"/><circle cx="50" cy="45" r="8"/></svg>`, // Target Location Badge
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FBBF24" stroke-width="4" fill="none" stroke-linecap="round"><path d="M30 35c10-10 30-10 40 0s10 30 0 40-30 10-40 0"/><path d="M40 45a8 8 0 1 1 16 0 8 8 0 0 1-16 0z"/></svg>`, // Fingerprint Spiral
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2334D399" stroke-width="4" fill="none" stroke-linecap="round"><path d="M50 25v50M25 50h50M35 35l30 30M35 65l30-30"/></svg>`, // Crosshair
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2300E5FF" stroke-width="4" fill="none" stroke-linecap="round"><rect x="35" y="20" width="30" height="60" rx="6"/><circle cx="50" cy="35" r="6"/><circle cx="50" cy="65" r="4"/></svg>`, // Walkie Talkie
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FF4A4A" stroke-width="4" fill="none" stroke-linecap="round"><path d="M30 45V30c0-10 15-15 20-5s20 5 20 20v15M30 55v15c0 10 15 15 20 5s20-5 20-20V50"/></svg>`, // Secret Handcuffs
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23A78BFA" stroke-width="4" fill="none" stroke-linecap="round"><path d="M30 30c5-5 15-5 20 0s15 5 20 0l-5 40H35z"/></svg>`, // Spy Camera Lens
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2338BDF8" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="50" cy="50" r="25"/><path d="M50 15v10M50 75v10M15 50h10M75 50h10"/></svg>`, // Laser Wristwatch
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FBBF24" stroke-width="4" fill="none" stroke-linecap="round"><path d="M40 70V50a10 10 0 0 1 20 0v20M50 30v10"/></svg>`, // Poison Vial / Flask
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2334D399" stroke-width="4" fill="none" stroke-linecap="round"><rect x="30" y="25" width="40" height="50" rx="5"/><circle cx="50" cy="40" r="8"/><path d="M42 63h16"/></svg>`, // Cyber USB Intercept
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FB7185" stroke-width="4" fill="none" stroke-linecap="round"><path d="M25 40h50M25 50h50M25 60h50M35 30h30v40H35z"/></svg>`, // Classified Dossier
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2300E5FF" stroke-width="4" fill="none" stroke-linecap="round"><path d="M30 65l20-30 20 30zm20-30v15M50 58h.01"/></svg>`, // Classified Warning Alert
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23A78BFA" stroke-width="4" fill="none" stroke-linecap="round"><path d="M20 50a30 30 0 0 1 60 0M25 55c0 15 15 20 25 20s25-5 25-20"/></svg>`, // Audio Eavesdropping Radar
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%2334D399" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="15"/><line x1="20" y1="50" x2="80" y2="50"/></svg>`, // Microfilm Reel
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FF4A4A" stroke-width="4" fill="none" stroke-linecap="round"><path d="M20 35c10-5 20-5 30 0s20 5 30 0v35c-10 5-20 5-30 0s-20-5-30 0zM50 30v45"/></svg>`, // Secret Map Route
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="%23FBBF24" stroke-width="4" fill="none" stroke-linecap="round"><circle cx="50" cy="50" r="25"/><path d="M38 45h24M38 55h24"/></svg>`  // Enigma Encryption Cog
];

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, username, team = 'spectator', isSpymaster = false }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        host: socket.id,
        phase: 'LOBBY',
        players: {},
        drawings: [],
        grid: [],
        turn: 'red',
        currentClue: null,
        currentCount: 0,
        guessesLeft: 0,
        winner: null,
        logs: []
      };
    }

    rooms[roomId].players[socket.id] = { id: socket.id, username, team, isSpymaster, isBot: false };
    io.to(roomId).emit('room-update', rooms[roomId]);
  });

  socket.on('add-mock-players', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const mockBots = [
      { id: 'bot-alpha', username: 'Agent Alpha 🕵️', team: 'red', isSpymaster: false },
      { id: 'bot-bravo', username: 'Agent Bravo 🕶️', team: 'blue', isSpymaster: false },
      { id: 'bot-charlie', username: 'Agent Charlie 📡', team: 'blue', isSpymaster: true }
    ];

    mockBots.forEach(bot => {
      room.players[bot.id] = {
        id: bot.id,
        username: bot.username,
        team: bot.team,
        isSpymaster: bot.isSpymaster,
        isBot: true
      };
    });

    room.logs.push("Mock agents deployed to room manifest.");
    io.to(roomId).emit('room-update', room);
  });

  socket.on('start-game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.host !== socket.id) return;

    room.logs = ["Room briefings distributed. Target grid acquired."];
    setupCodenamesGrid(room);
  });

  socket.on('assign-word', ({ roomId, cardIndex }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'PLAYING' || room.turnPhase !== 'assigning') return;

    room.assignedCardIndex = cardIndex;
    room.turnPhase = 'drawing';

    const player = room.players[socket.id] || { username: 'Spymaster' };
    room.logs.push(`${player.username} assigned a target word to the enemy Spymaster.`);
    io.to(roomId).emit('room-update', room);
  });

  socket.on('submit-clue', ({ roomId, clue }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'PLAYING' || room.turnPhase !== 'drawing') return;

    room.currentClue = clue;
    room.guessesLeft = 1;
    room.turnPhase = 'guessing';

    const player = room.players[socket.id] || { username: 'Spymaster' };
    room.logs.push(`${player.username} broadcasted their drawn clue.`);
    io.to(roomId).emit('room-update', room);
  });

  socket.on('toggle-sus', ({ roomId, cardIndex }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'PLAYING') return;

    const card = room.grid[cardIndex];
    if (!card || card.isRevealed) return;

    const player = room.players[socket.id] || { username: 'Operative' };
    if (!card.susList) card.susList = [];

    if (card.susList.includes(player.username)) {
      card.susList = card.susList.filter(name => name !== player.username);
      room.logs.push(`${player.username} removed SUS 🔍 from Card #${cardIndex + 1}`);
    } else {
      card.susList.push(player.username);
      room.logs.push(`${player.username} marked Card #${cardIndex + 1} as SUSPICIOUS 🔍`);
    }

    io.to(roomId).emit('room-update', room);
  });

  socket.on('reveal-card', ({ roomId, cardIndex }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'PLAYING') return;

    const card = room.grid[cardIndex];
    if (card.isRevealed) return;

    card.isRevealed = true;
    card.susList = []; // clear sus marker on reveal
    room.guessesLeft--;

    const player = room.players[socket.id] || { username: 'Operative' };
    room.logs.push(`${player.username} DECRYPTED card #${cardIndex + 1} -> Found: ${card.type.toUpperCase()}`);

    if (card.type === 'assassin') {
      room.winner = room.turn === 'red' ? 'blue' : 'red';
      room.phase = 'END';
      room.logs.push(`⚠️ ASSASSIN CRITICAL COMPROMISE! Game Over. Winner: ${room.winner.toUpperCase()} TEAM`);
    } else if (card.type === room.turn) {
      const unrevealedTeamCards = room.grid.filter(c => c.type === room.turn && !c.isRevealed).length;
      if (unrevealedTeamCards === 0) {
        room.winner = room.turn;
        room.phase = 'END';
        room.logs.push(`🏆 Operation complete. All team objectives acquired. Winner: ${room.winner.toUpperCase()} TEAM`);
      } else if (room.guessesLeft <= 0) {
        room.turn = room.turn === 'red' ? 'blue' : 'red';
        room.turnPhase = 'assigning';
        room.currentClue = null;
        room.assignedCardIndex = null;
        room.logs.push(`Turn ended. Switched to ${room.turn.toUpperCase()} turn.`);
      }
    } else {
      room.turn = room.turn === 'red' ? 'blue' : 'red';
      room.turnPhase = 'assigning';
      room.currentClue = null;
      room.assignedCardIndex = null;
      room.logs.push(`Wrong guess! Turn ended. Switched to ${room.turn.toUpperCase()} turn.`);

      const redLeft = room.grid.filter(c => c.type === 'red' && !c.isRevealed).length;
      const blueLeft = room.grid.filter(c => c.type === 'blue' && !c.isRevealed).length;
      if (redLeft === 0) { room.winner = 'red'; room.phase = 'END'; room.logs.push(`Winner: RED TEAM!`); }
      if (blueLeft === 0) { room.winner = 'blue'; room.phase = 'END'; room.logs.push(`Winner: BLUE TEAM!`); }
    }

    io.to(roomId).emit('room-update', room);
  });

  socket.on('kick-player', ({ roomId, targetId }) => {
    const room = rooms[roomId];
    if (!room || room.host !== socket.id) return;
    if (!room.players[targetId]) return;
    delete room.players[targetId];
    io.to(targetId).emit('kicked');
    room.logs.push(`A player was kicked by the host.`);
    io.to(roomId).emit('room-update', room);
  });

  socket.on('promote-owner', ({ roomId, targetId }) => {
    const room = rooms[roomId];
    if (!room || room.host !== socket.id) return;
    if (!room.players[targetId]) return;
    room.host = targetId;
    room.logs.push(`${room.players[targetId].username} is now the room owner.`);
    io.to(roomId).emit('room-update', room);
  });

  socket.on('set-player-role', ({ roomId, targetId, team, isSpymaster }) => {
    const room = rooms[roomId];
    if (!room || room.host !== socket.id) return;
    if (!room.players[targetId]) return;
    room.players[targetId].team = team;
    room.players[targetId].isSpymaster = isSpymaster;
    room.logs.push(`Host assigned ${room.players[targetId].username} to ${team === 'spectator' ? 'Spectators' : (isSpymaster ? 'Spymaster' : 'Operative') + ' of ' + team.toUpperCase() + ' TEAM'}.`);
    io.to(roomId).emit('room-update', room);
  });

  socket.on('disconnect', () => {
    Object.keys(rooms).forEach((roomId) => {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        const hasRealPlayers = Object.values(rooms[roomId].players).some(p => !p.isBot);
        if (!hasRealPlayers) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('room-update', rooms[roomId]);
        }
      }
    });
  });
});

function setupCodenamesGrid(room) {
  // Identities: 8 Red, 7 Blue, 9 Neutral, 1 Assassin
  let types = [...Array(8).fill('red'), ...Array(7).fill('blue'), ...Array(9).fill('neutral'), 'assassin'];
  types = types.sort(() => Math.random() - 0.5);

  let allPrompts = [...PROMPTS].sort(() => Math.random() - 0.5);

  room.grid = types.map((type, idx) => ({
    id: idx,
    type: type,
    isRevealed: false,
    susList: [],
    prompt: allPrompts[idx % allPrompts.length]
  }));

  room.phase = 'PLAYING';
  room.turn = 'red';
  room.turnPhase = 'assigning';
  room.currentClue = null;
  room.assignedCardIndex = null;
  room.guessesLeft = 0;
  io.to(room.id).emit('room-update', room);
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));