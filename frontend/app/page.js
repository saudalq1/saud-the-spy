'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('spyUsername');
    if (savedName) setUsername(savedName);
  }, []);

  const handleCreate = () => {
    if (!username.trim()) return alert('Identify yourself, Enter Your Name.');
    localStorage.setItem('spyUsername', username.trim());
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room/${generatedId}`);
  };

  const handleJoin = () => {
    if (!username.trim() || !roomId.trim()) return alert('Room code and Name required!');
    localStorage.setItem('spyUsername', username.trim());
    router.push(`/room/${roomId.trim().toUpperCase()}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden">

      {/* Decorative Neon Grid Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Retro/Cartoon Spy Badge Container */}
      <div className="relative w-full max-w-lg bg-slate-900/85 backdrop-blur-xl border-4 border-slate-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-cyan-400 border-b-rose-500 transform transition-transform duration-300 hover:scale-[1.01]">

        {/* Neon Light Bars */}
        <div className="absolute -top-1 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        <div className="absolute -bottom-1 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>

        {/* Top Header Badge */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] tracking-widest font-mono text-cyan-400 uppercase bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-800/40">CLASSIFIED</span>
          <span className="text-[10px] tracking-widest font-mono text-rose-400 uppercase bg-rose-950/50 px-3 py-1 rounded-full border border-rose-800/40">SECURE CHANNEL</span>
        </div>

        {/* Main Logo */}
        <div className="text-center mb-8 relative">
          <div className="inline-block relative">
            <span className="absolute -top-8 -left-8 text-4xl transform -rotate-12 animate-bounce">🕵️‍♂️</span>
            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400 uppercase select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
              Saud <span className="text-cyan-400 font-extrabold relative">The Spy</span>
            </h1>
            <span className="absolute -bottom-6 -right-6 text-3xl transform rotate-12">🎨</span>
          </div>
          <p className="mt-4 text-slate-400 text-sm font-medium tracking-wide">
            Codenames meets Sketchy Dedution. Draw & decode target intelligence.
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          <div className="relative">
            <label className="block text-xs uppercase font-mono text-slate-500 mb-1.5 ml-1">Name</label>
            <input
              type="text"
              maxLength={15}
              placeholder="Enter your spy handle..."
              className="w-full p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl focus:border-cyan-400 outline-none transition text-white placeholder-slate-600 font-semibold focus:shadow-[0_0_15px_rgba(0,229,255,0.15)]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreate}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-lg p-4 rounded-2xl shadow-[0_4px_12px_rgba(244,63,94,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              💼 Create Game Room
            </button>
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t-2 border-dashed border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-600 text-xs font-mono font-bold">OR JOIN EXISTING ROOM</span>
            <div className="flex-grow border-t-2 border-dashed border-slate-800"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Room Code"
                maxLength={6}
                className="w-full p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl focus:border-rose-400 outline-none transition uppercase text-white font-mono placeholder-slate-600 text-center tracking-widest focus:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <button
              onClick={handleJoin}
              className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 font-extrabold p-4 rounded-2xl border-2 border-cyan-400/40 hover:border-cyan-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Join ⚡
            </button>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="mt-8 text-center text-[11px] font-mono text-slate-600">
          SECURE CONNECTION ENCRYPTED
        </div>
      </div>
    </div>
  );
}