'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function Room() {
  const { id: roomId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState('Anonymous');

  const [gameState, setGameState] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [team, setTeam] = useState('spectator');
  const [isSpymaster, setIsSpymaster] = useState(false);
  const [clueInput, setClueInput] = useState('');
  const [countInput, setCountInput] = useState(1);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Custom canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#00E5FF'); // Electric blue by default
  const [lineWidth, setLineWidth] = useState(4);

  // Dev tools state
  const [showSpymasterOverlay, setShowSpymasterOverlay] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('spyUsername') || searchParams.get('user') || 'Anonymous';
    setUsername(savedName);

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');
    socket.emit('join-room', { roomId, username: savedName, team, isSpymaster });

    socket.on('room-update', (updatedRoom) => setGameState(updatedRoom));
    socket.on('game-prompt', (assignedPrompt) => setPrompt(assignedPrompt));
    socket.on('kicked', () => { alert('You were kicked by the host.'); router.push('/'); });

    return () => socket.disconnect();
  }, [roomId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const openNameModal = () => {
    setNameInput(username);
    setShowNameModal(true);
  };

  const handleNameSave = () => {
    if (nameInput && nameInput.trim()) {
      const trimmed = nameInput.trim();
      setUsername(trimmed);
      localStorage.setItem('spyUsername', trimmed);
      socket.emit('join-room', { roomId, username: trimmed, team, isSpymaster });
    }
    setShowNameModal(false);
  };

  useEffect(() => {
    if (gameState?.phase === 'SKETCH' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Fill canvas background to avoid transparent submissions
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [gameState?.phase]);

  // Adjust color and brush size
  const updateBrush = (color, size) => {
    setCurrentColor(color);
    if (size) setLineWidth(size);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = color;
      if (size) ctx.lineWidth = size;
    }
  };

  const updateRole = (newTeam, spyStatus) => {
    setTeam(newTeam);
    setIsSpymaster(spyStatus);
    socket.emit('join-room', { roomId, username, team: newTeam, isSpymaster: spyStatus });
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    e.preventDefault();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const submitCanvas = () => {
    const dataUrl = canvasRef.current.toDataURL();
    socket.emit('submit-sketch', { roomId, drawingData: dataUrl });
  };

  const handleCardClick = (idx, card) => {
    if (gameState.phase !== 'PLAYING') return;
    const myPlayer = gameState.players[socket.id];

    if (myPlayer?.isSpymaster) return;

    const isMyTurn = gameState.turn === myPlayer?.team;
    if (isMyTurn && gameState.turnPhase === 'guessing' && !card.isRevealed) {
      socket.emit('toggle-sus', { roomId, cardIndex: idx });
    }
  };



  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center font-mono space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Game...</p>
      </div>
    );
  }

  const localPlayer = gameState.players[socket.id];

  // Helper stats
  const redCardsRemaining = gameState.grid ? gameState.grid.filter(c => c.type === 'red' && !c.isRevealed).length : 8;
  const blueCardsRemaining = gameState.grid ? gameState.grid.filter(c => c.type === 'blue' && !c.isRevealed).length : 7;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">

      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition" onClick={() => router.push('/')} title="Return to Main Menu">
              <span className="text-4xl">🕵️‍♂️</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-none">
                Saud <br /><span className="text-cyan-400">The Spy</span>
              </h1>
            </div>

            <div
              className="flex flex-col items-start cursor-pointer group"
              onClick={() => { navigator.clipboard.writeText(roomId); showToast('Room code copied!'); }}
              title="Click to copy Room Code"
            >
              <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase mb-1 group-hover:text-cyan-400 transition">Room Code</span>
              <span className="text-2xl sm:text-4xl font-black text-white bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 group-hover:border-cyan-400 transition shadow-inner">{roomId}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMembersModal(true)}
              className="text-xs font-mono font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
            >
              👥 Members
            </button>
            <button
              onClick={openNameModal}
              className="text-xs font-mono font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
            >
              ⚙️ Change Name
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-xs font-mono font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
            >
              Leave Room 🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Phase 1: LOBBY */}
        {gameState.phase === 'LOBBY' && (
          <div className="space-y-8">
            {/* Team Selection Panels Style from screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

              {/* RED TEAM Column */}
              <div className="flex flex-col items-center space-y-4">
                {/* Team Header capsule */}
                <div className="w-full text-center bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 py-2.5 rounded-full font-black text-sm uppercase tracking-widest text-[#FF4A4A] shadow-md">
                  RED TEAM
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Operatives Card */}
                  <div className="relative bg-gradient-to-b from-rose-500 to-rose-600 border-2 border-rose-450 rounded-3xl p-5 h-64 flex flex-col justify-between items-center overflow-hidden shadow-2xl">
                    <svg viewBox="0 0 100 100" className="absolute bottom-0 left-2 w-32 h-32 opacity-20 text-rose-950 pointer-events-none fill-current">
                      <path d="M10 95C10 75 30 70 50 70s40 5 40 25v5H10v-5z" />
                      <circle cx="50" cy="40" r="18" />
                      <rect x="42" y="38" width="16" height="5" rx="2" />
                    </svg>

                    <div className="text-center z-10 w-full">
                      <h4 className="text-white font-black tracking-widest uppercase text-base drop-shadow-md">OPERATIVES</h4>
                      {/* Active roster inside the card */}
                      <div className="mt-2 text-xs font-bold text-rose-100 line-clamp-3">
                        {Object.values(gameState.players).filter(p => p.team === 'red' && !p.isSpymaster).map(p => p.username).join(', ') || 'Awaiting agents...'}
                      </div>
                    </div>

                    {localPlayer?.team === 'red' && !localPlayer?.isSpymaster ? (
                      <button onClick={() => updateRole('spectator', false)} className="z-10 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-md transition">LEAVE TEAM</button>
                    ) : (
                      <button onClick={() => updateRole('red', false)} className="z-10 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 border-2 border-green-400 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-[0_4px_10px_rgba(40,167,69,0.3)] transition transform hover:scale-105 active:scale-95">JOIN TEAM</button>
                    )}
                  </div>

                  {/* Spymasters Card */}
                  <div className="relative bg-gradient-to-b from-rose-500 to-rose-600 border-2 border-rose-455 rounded-3xl p-5 h-64 flex flex-col justify-between items-center overflow-hidden shadow-2xl">
                    <svg viewBox="0 0 100 100" className="absolute bottom-0 left-2 w-32 h-32 opacity-20 text-rose-950 pointer-events-none fill-current">
                      <path d="M10 95C10 75 30 70 50 70s40 5 40 25v5H10v-5z" />
                      <circle cx="50" cy="40" r="18" />
                      <path d="M30 40c0-10 10-15 20-15s20 5 20 15v10H30V40z" />
                    </svg>

                    <div className="text-center z-10 w-full">
                      <h4 className="text-white font-black tracking-widest uppercase text-base drop-shadow-md">SPYMASTERS</h4>
                      <div className="mt-2 text-xs font-bold text-rose-100 line-clamp-3">
                        {Object.values(gameState.players).filter(p => p.team === 'red' && p.isSpymaster).map(p => p.username).join(', ') || 'No Spymaster'}
                      </div>
                    </div>

                    {localPlayer?.team === 'red' && localPlayer?.isSpymaster ? (
                      <button onClick={() => updateRole('spectator', false)} className="z-10 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-md transition">LEAVE TEAM</button>
                    ) : (
                      <button onClick={() => updateRole('red', true)} className="z-10 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 border-2 border-green-400 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-[0_4px_10px_rgba(40,167,69,0.3)] transition transform hover:scale-105 active:scale-95">JOIN TEAM</button>
                    )}
                  </div>
                </div>

              </div>

              {/* BLUE TEAM Column */}
              <div className="flex flex-col items-center space-y-4">
                {/* Team Header capsule */}
                <div className="w-full text-center bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 py-2.5 rounded-full font-black text-sm uppercase tracking-widest text-[#00E5FF] shadow-md">
                  BLUE TEAM
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Operatives Card */}
                  <div className="relative bg-gradient-to-b from-cyan-500 to-cyan-600 border-2 border-cyan-400 rounded-3xl p-5 h-64 flex flex-col justify-between items-center overflow-hidden shadow-2xl">
                    <svg viewBox="0 0 100 100" className="absolute bottom-0 left-2 w-32 h-32 opacity-20 text-cyan-950 pointer-events-none fill-current">
                      <path d="M10 95C10 75 30 70 50 70s40 5 40 25v5H10v-5z" />
                      <circle cx="50" cy="40" r="18" />
                      <rect x="42" y="38" width="16" height="5" rx="2" />
                    </svg>

                    <div className="text-center z-10 w-full">
                      <h4 className="text-white font-black tracking-widest uppercase text-base drop-shadow-md">OPERATIVES</h4>
                      <div className="mt-2 text-xs font-bold text-cyan-100 line-clamp-3">
                        {Object.values(gameState.players).filter(p => p.team === 'blue' && !p.isSpymaster).map(p => p.username).join(', ') || 'Awaiting agents...'}
                      </div>
                    </div>

                    {localPlayer?.team === 'blue' && !localPlayer?.isSpymaster ? (
                      <button onClick={() => updateRole('spectator', false)} className="z-10 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-md transition">LEAVE TEAM</button>
                    ) : (
                      <button onClick={() => updateRole('blue', false)} className="z-10 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 border-2 border-green-400 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-[0_4px_10px_rgba(40,167,69,0.3)] transition transform hover:scale-105 active:scale-95">JOIN TEAM</button>
                    )}
                  </div>

                  {/* Spymasters Card */}
                  <div className="relative bg-gradient-to-b from-cyan-500 to-cyan-600 border-2 border-cyan-400 rounded-3xl p-5 h-64 flex flex-col justify-between items-center overflow-hidden shadow-2xl">
                    <svg viewBox="0 0 100 100" className="absolute bottom-0 left-2 w-32 h-32 opacity-20 text-cyan-950 pointer-events-none fill-current">
                      <path d="M10 95C10 75 30 70 50 70s40 5 40 25v5H10v-5z" />
                      <circle cx="50" cy="40" r="18" />
                      <path d="M30 40c0-10 10-15 20-15s20 5 20 15v10H30V40z" />
                    </svg>

                    <div className="text-center z-10 w-full">
                      <h4 className="text-white font-black tracking-widest uppercase text-base drop-shadow-md">SPYMASTERS</h4>
                      <div className="mt-2 text-xs font-bold text-cyan-100 line-clamp-3">
                        {Object.values(gameState.players).filter(p => p.team === 'blue' && p.isSpymaster).map(p => p.username).join(', ') || 'No Spymaster'}
                      </div>
                    </div>

                    {localPlayer?.team === 'blue' && localPlayer?.isSpymaster ? (
                      <button onClick={() => updateRole('spectator', false)} className="z-10 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-md transition">LEAVE TEAM</button>
                    ) : (
                      <button onClick={() => updateRole('blue', true)} className="z-10 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 border-2 border-green-400 text-white font-black text-xs uppercase px-8 py-2.5 rounded-full shadow-[0_4px_10px_rgba(40,167,69,0.3)] transition transform hover:scale-105 active:scale-95">JOIN TEAM</button>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Spectators Section */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold font-mono tracking-wider text-slate-300">SPECTATORS</h3>
                <button
                  onClick={() => updateRole('spectator', false)}
                  className="text-xs font-mono font-bold bg-slate-850 border border-slate-750 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white"
                >
                  🍿 Join Spectators
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.values(gameState.players).filter(p => p.team === 'spectator').map(p => (
                  <div key={p.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center text-xs">
                    <span className="font-semibold truncate">
                      {gameState.host === p.id && <span className="mr-1">👑</span>}{p.username}
                    </span>
                  </div>
                ))}
                {Object.values(gameState.players).filter(p => p.team === 'spectator').length === 0 && (
                  <div className="col-span-4 text-center text-slate-600 text-xs py-3 font-mono">No spectators</div>
                )}
              </div>

              {/* Trigger start */}
              <div className="flex justify-end items-center pt-4 border-t border-slate-850 gap-4">
                {gameState.host === socket.id && (
                  <button
                    onClick={() => socket.emit('start-game', { roomId })}
                    className="flex-1 max-w-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm py-3 rounded-2xl shadow-md transition active:scale-95"
                  >
                    Start Game 📡
                  </button>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Phase 3: PLAYING GRID */}
        {gameState.phase === 'PLAYING' && (
          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-160px)] min-h-[500px]">

            {/* Left: Red Team */}
            <div className="w-full lg:w-48 xl:w-56 flex-shrink-0 bg-slate-900/80 border-2 border-rose-900/50 rounded-3xl p-4 flex flex-col shadow-xl">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-rose-500 uppercase tracking-widest text-lg">RED TEAM</h3>
                {localPlayer?.team === 'red' && (
                  <button onClick={() => updateRole('spectator', false)} className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-700">Leave</button>
                )}
              </div>
              <div className="text-center text-5xl font-black text-rose-400 mb-4">{redCardsRemaining}</div>

              <div className="flex-grow overflow-y-auto space-y-3 pb-2 pr-1">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Spymasters</h4>
                    {localPlayer?.team === 'spectator' && <button onClick={() => updateRole('red', true)} className="text-[8px] bg-green-600 hover:bg-green-500 text-white px-1.5 py-0.5 rounded uppercase font-bold transition">+</button>}
                  </div>
                  {Object.values(gameState.players).filter(p => p.team === 'red' && p.isSpymaster).map(p => (
                    <div key={p.id} className="text-xs font-bold text-rose-200 bg-rose-950/40 rounded px-2 py-1 mb-1 border border-rose-900/30 truncate text-center">{p.username}</div>
                  ))}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Operatives</h4>
                    {localPlayer?.team === 'spectator' && <button onClick={() => updateRole('red', false)} className="text-[8px] bg-green-600 hover:bg-green-500 text-white px-1.5 py-0.5 rounded uppercase font-bold transition">+</button>}
                  </div>
                  {Object.values(gameState.players).filter(p => p.team === 'red' && !p.isSpymaster).map(p => (
                    <div key={p.id} className="text-xs font-bold text-rose-200 bg-rose-950/40 rounded px-2 py-1 mb-1 border border-rose-900/30 truncate text-center">{p.username}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Game Board */}
            <div className="flex-grow flex flex-col space-y-4">
              {/* Clue Broadcast Console */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 flex justify-between items-center shadow-lg">
                <div className="flex flex-col px-2 flex-grow">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-tight">
                    {gameState.turnPhase === 'assigning' ? 'AWAITING TARGET ASSIGNMENT' : gameState.turnPhase === 'drawing' ? 'CLUE DRAWING IN PROGRESS' : 'ACTIVE CLUE PAYLOAD'}
                  </span>

                  <div className="flex items-center space-x-2 mt-0.5">
                    {gameState.turnPhase === 'assigning' && (
                      <h3 className="text-sm sm:text-lg font-black text-slate-400">
                        {gameState.turn === 'red' ? 'Blue' : 'Red'} Spymaster is choosing a target word...
                      </h3>
                    )}

                    {gameState.turnPhase === 'drawing' && (
                      <h3 className="text-sm sm:text-lg font-black text-amber-400 animate-pulse">
                        {gameState.turn.toUpperCase()} Spymaster is drawing...
                      </h3>
                    )}

                    {gameState.turnPhase === 'guessing' && gameState.currentClue && (
                      <div className="bg-[#020617] border border-slate-800 p-1 rounded-lg shadow-inner">
                        <img src={gameState.currentClue} alt="Spymaster Clue" className="h-16 rounded object-contain bg-slate-950" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Spymaster Drawing Form */}
                {localPlayer?.isSpymaster && gameState.turn === localPlayer.team && gameState.turnPhase === 'drawing' && (
                  <div className="flex flex-col gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-850">
                    <div className="text-[10px] text-amber-400 font-bold uppercase text-center tracking-widest">
                      DRAW THIS: <span className="text-white">{gameState.grid[gameState.assignedCardIndex].prompt}</span>
                    </div>
                    <div className="relative border-2 border-slate-800 rounded overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        width={200}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="bg-[#020617] cursor-crosshair w-[200px] h-[120px] block"
                      />
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <button onClick={clearCanvas} className="text-[10px] font-bold text-rose-400 hover:text-rose-300">Clear</button>
                    </div>
                    <button
                      onClick={() => {
                        const dataUrl = canvasRef.current.toDataURL();
                        socket.emit('submit-clue', { roomId, clue: dataUrl });
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-1.5 rounded-lg text-[10px] shadow-[0_2px_8px_rgba(16,185,129,0.4)] transition hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
                    >
                      Broadcast
                    </button>
                  </div>
                )}

                <div
                  className="px-4 py-2 rounded-2xl border-2 font-black uppercase text-xs sm:text-sm tracking-wider"
                  style={{
                    borderColor: gameState.turn === 'red' ? '#FF4A4A' : '#00E5FF',
                    color: gameState.turn === 'red' ? '#FF4A4A' : '#00E5FF',
                    backgroundColor: gameState.turn === 'red' ? '#EF444411' : '#22D3EE11'
                  }}
                >
                  {gameState.turn}'s turn
                </div>
              </div>

              {/* 5x5 Grid Styled like Codenames words */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-grow">
                {gameState.grid.map((card, idx) => {
                  const showIdentity = localPlayer?.isSpymaster || showSpymasterOverlay || card.isRevealed;

                  let revealBorderClass = 'border-[#2c3e50] bg-[#1a252f]';
                  if (showIdentity) {
                    if (card.type === 'red') {
                      revealBorderClass = 'border-rose-600 bg-rose-500/20';
                    } else if (card.type === 'blue') {
                      revealBorderClass = 'border-cyan-600 bg-cyan-500/20';
                    } else if (card.type === 'neutral') {
                      revealBorderClass = 'border-amber-700 bg-amber-500/20';
                    } else if (card.type === 'assassin') {
                      revealBorderClass = 'border-purple-600 bg-purple-500/20';
                    }
                  }

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(idx, card)}
                      className={`relative flex flex-col justify-end rounded-xl cursor-pointer overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-lg ${showIdentity ? revealBorderClass : 'bg-[#FBE3CC] border-2 border-[#EAD2B8]'} ${card.isRevealed ? 'opacity-40' : ''}`}
                    >
                      {card.susList && card.susList.length > 0 && (
                        <div className="absolute top-7 left-1 flex flex-col gap-0.5 z-10 p-0.5 max-w-[55%] pointer-events-none">
                          {card.susList.map((susName, i) => (
                            <span
                              key={i}
                              className="bg-yellow-500 text-slate-950 px-0.5 py-px rounded font-black uppercase shadow-sm leading-none"
                              style={{ fontSize: card.susList.length > 2 ? '6px' : '7px' }}
                            >
                              {susName} 🔍
                            </span>
                          ))}
                        </div>
                      )}

                      {card.isRevealed && (
                        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] z-10">
                          <span className="text-4xl filter drop-shadow-lg">
                            {card.type === 'red' ? '🔴' : card.type === 'blue' ? '🔵' : card.type === 'neutral' ? '🟡' : '💀'}
                          </span>
                        </div>
                      )}

                      {card.susList && card.susList.length > 0 && !card.isRevealed && !showIdentity && gameState.turnPhase === 'guessing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            socket.emit('reveal-card', { roomId, cardIndex: idx });
                          }}
                          className="absolute top-1 right-1 z-20 bg-green-500 hover:bg-green-400 text-white font-black text-[8px] sm:text-[9px] px-2 py-1 rounded shadow-md transform transition hover:scale-110 active:scale-95 border border-green-300 flex items-center gap-1"
                        >
                          <span>✅</span>
                          <span>SUBMIT</span>
                        </button>
                      )}

                      {/* ASSIGN target word button */}
                      {gameState.turnPhase === 'assigning' && localPlayer?.isSpymaster && localPlayer.team !== gameState.turn && card.type === gameState.turn && !card.isRevealed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            socket.emit('assign-word', { roomId, cardIndex: idx });
                          }}
                          className="absolute top-1 right-1 z-30 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[8px] sm:text-[9px] px-2 py-1 rounded shadow-md transform transition hover:scale-110 active:scale-95 border border-indigo-300 flex items-center gap-1"
                        >
                          <span>🎯</span>
                          <span>ASSIGN</span>
                        </button>
                      )}

                      {/* Card design: empty top, word bottom */}
                      {showIdentity ? (
                        <div className="h-full w-full flex items-center justify-center p-2">
                          <span className={`text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-wider uppercase text-center break-words ${card.type === 'red' ? 'text-rose-400' : card.type === 'blue' ? 'text-cyan-400' : card.type === 'neutral' ? 'text-amber-200' : 'text-purple-400'}`}>
                            {card.prompt}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex-grow"></div>
                          <div className="h-[2px] bg-[#A58265] mx-1"></div>
                          <div className="bg-[#B08A6C] h-[50%] min-h-[42px] flex items-center justify-center px-1.5 mb-1 mx-1 rounded-b border border-[#9A785D]">
                            <span className="text-[9px] sm:text-[11px] md:text-xs font-black tracking-wide text-white uppercase text-center break-all leading-tight drop-shadow-sm">
                              {card.prompt}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Blue Team & Logs */}
            <div className="w-full lg:w-48 xl:w-56 flex-shrink-0 bg-slate-900/80 border-2 border-cyan-900/50 rounded-3xl p-4 flex flex-col shadow-xl">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-cyan-400 uppercase tracking-widest text-lg">BLUE TEAM</h3>
                {localPlayer?.team === 'blue' && (
                  <button onClick={() => updateRole('spectator', false)} className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-700">Leave</button>
                )}
              </div>
              <div className="text-center text-5xl font-black text-cyan-400 mb-4">{blueCardsRemaining}</div>

              <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-1">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Spymasters</h4>
                    {localPlayer?.team === 'spectator' && <button onClick={() => updateRole('blue', true)} className="text-[8px] bg-green-600 hover:bg-green-500 text-white px-1.5 py-0.5 rounded uppercase font-bold transition">+</button>}
                  </div>
                  {Object.values(gameState.players).filter(p => p.team === 'blue' && p.isSpymaster).map(p => (
                    <div key={p.id} className="text-xs font-bold text-cyan-200 bg-cyan-950/40 rounded px-2 py-1 mb-1 border border-cyan-900/30 truncate text-center">{p.username}</div>
                  ))}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Operatives</h4>
                    {localPlayer?.team === 'spectator' && <button onClick={() => updateRole('blue', false)} className="text-[8px] bg-green-600 hover:bg-green-500 text-white px-1.5 py-0.5 rounded uppercase font-bold transition">+</button>}
                  </div>
                  {Object.values(gameState.players).filter(p => p.team === 'blue' && !p.isSpymaster).map(p => (
                    <div key={p.id} className="text-xs font-bold text-cyan-200 bg-cyan-950/40 rounded px-2 py-1 mb-1 border border-cyan-900/30 truncate text-center">{p.username}</div>
                  ))}
                </div>
              </div>
              <div className="h-40 shrink-0 bg-slate-950 rounded-2xl p-2 overflow-y-auto border border-slate-800 text-[10px] font-mono text-slate-400 shadow-inner">
                <div className="font-bold text-slate-500 mb-1 border-b border-slate-800 pb-1">ROOM LOGS</div>
                {gameState.logs && gameState.logs.slice().reverse().map((log, index) => (
                  <div key={index} className="mb-1"><span className="text-cyan-600">›</span> {log}</div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Phase 4: MISSION OVER */}
        {gameState.phase === 'END' && (
          <div className="max-w-xl mx-auto text-center bg-slate-900 border-4 border-cyan-400/30 p-10 rounded-3xl mt-12 space-y-6 shadow-2xl relative">
            <div className="absolute -top-6 -left-6 text-5xl">🏆</div>
            <div className="absolute -bottom-6 -right-6 text-5xl">🏆</div>

            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">OPERATION BRIEFING COMPLETE</p>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300 uppercase">
              {gameState.winner} TEAM WINS
            </h2>
            <p className="text-slate-400 text-sm">All identities decrypted. Target code objectives acquired successfully.</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black text-base px-8 py-3.5 rounded-2xl hover:text-white transition"
            >
              🔄 Start New Room
            </button>
          </div>
        )}


      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 border-2 border-cyan-400 text-cyan-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(34,211,238,0.3)] z-50 text-sm font-black uppercase tracking-wider animate-bounce flex items-center gap-2">
          <span>📋</span> {toastMessage}
        </div>
      )}

      {/* Name Change Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-widest text-center">Change Name</h3>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-800 px-4 py-3 rounded-xl text-cyan-400 outline-none text-sm font-bold focus:border-cyan-400 transition text-center tracking-wider placeholder-slate-700"
              placeholder="New name..."
              maxLength={15}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNameModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider">Cancel</button>
              <button onClick={handleNameSave} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-2.5 rounded-xl transition text-xs uppercase tracking-wider shadow-md active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowMembersModal(false)}>
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-black text-white uppercase tracking-widest">👥 Members ({Object.values(gameState.players).length})</h3>
              <button onClick={() => setShowMembersModal(false)} className="text-slate-500 hover:text-white text-xl font-bold transition">×</button>
            </div>
            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {Object.values(gameState.players).map(p => {
                const isHost = gameState.host === p.id;
                const isSelf = p.id === socket.id;
                const amHost = gameState.host === socket.id;
                return (
                  <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5">
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isHost && <span title="Room Owner">👑</span>}
                        <span className="font-bold text-sm text-white truncate">{p.username}</span>
                        {isSelf && <span className="text-[9px] bg-cyan-900 text-cyan-400 px-1.5 py-0.5 rounded font-bold uppercase">You</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {p.team === 'spectator' ? 'Spectator' : `${p.isSpymaster ? 'Spymaster' : 'Operative'} • ${p.team.toUpperCase()} TEAM`}
                      </div>
                    </div>
                    {/* Host Controls */}
                    {amHost && !isSelf && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {/* Role Picker */}
                        <select
                          defaultValue={`${p.team}:${p.isSpymaster}`}
                          onChange={(e) => {
                            const [t, s] = e.target.value.split(':');
                            socket.emit('set-player-role', { roomId, targetId: p.id, team: t, isSpymaster: s === 'true' });
                          }}
                          className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 rounded px-1 py-0.5 outline-none cursor-pointer font-bold uppercase"
                        >
                          <option value="spectator:false">Spectator</option>
                          <option value="red:false">Red Operative</option>
                          <option value="red:true">Red Spymaster</option>
                          <option value="blue:false">Blue Operative</option>
                          <option value="blue:true">Blue Spymaster</option>
                        </select>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { if (window.confirm(`Promote ${p.username} to room owner?`)) socket.emit('promote-owner', { roomId, targetId: p.id }); }}
                            className="flex-1 text-[9px] bg-amber-900/40 hover:bg-amber-900/70 text-amber-400 border border-amber-800/50 rounded px-1.5 py-0.5 font-bold uppercase transition"
                            title="Make room owner"
                          >
                            👑 Promote
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Kick ${p.username}?`)) socket.emit('kick-player', { roomId, targetId: p.id }); }}
                            className="flex-1 text-[9px] bg-rose-900/40 hover:bg-rose-900/70 text-rose-400 border border-rose-800/50 rounded px-1.5 py-0.5 font-bold uppercase transition"
                            title="Kick player"
                          >
                            🚪 Kick
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}