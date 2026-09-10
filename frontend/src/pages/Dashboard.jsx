import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/api/rooms', { name: roomName.trim() });
      navigate(`/room/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create room.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/api/rooms/join', {
        joinCode: joinCode.trim().toUpperCase()
      });
      navigate(`/room/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{
        backgroundImage: `
          radial-gradient(
            circle at 50% 0%,
            rgba(99, 102, 241, 0.10),
            transparent 35%
          ),
          linear-gradient(
            to right,
            rgba(148, 163, 184, 0.12) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(148, 163, 184, 0.12) 1px,
            transparent 1px
          )
        `,
        backgroundSize: 'auto, 32px 32px, 32px 32px'
      }}
    >
      <Navbar />

      {/* Decorative Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute -right-32 top-64 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-300/10 blur-3xl" />
      </div>

      <main className="relative">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">

          {/* Hero Section */}
          <section className="mx-auto max-w-3xl text-center">

            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>

              Collaborative Learning
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Learn together.
              <span className="mt-1 block bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                Grow together.
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
              Create a study room with your friends or join an existing room
              and make learning more collaborative, focused and productive.
            </p>
          </section>

          {/* Error Message */}
          {error && (
            <div className="mx-auto mt-8 flex max-w-4xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 shadow-sm backdrop-blur-md">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-red-600">
                !
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 break-words text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Main Cards */}
          <section className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">

            {/* Create Room Card */}
            <form
              onSubmit={handleCreate}
              className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_-20px_rgba(79,70,229,0.25)] sm:p-8"
            >
              {/* Card Glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-100/70 blur-2xl transition-all duration-500 group-hover:bg-indigo-200/80" />

              {/* Top Border Glow */}
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

              <div className="relative">

                {/* Icon */}
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform duration-300 group-hover:scale-105">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>

                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                    New Room
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Start a new room
                </h2>

                <p className="mt-2 min-h-[52px] text-sm leading-6 text-slate-500">
                  Create a focused study room and invite your friends with a
                  unique join code.
                </p>

                {/* Input */}
                <div className="mt-7">
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700">
                    Room name
                  </label>

                  <div className="relative">
                    <input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g. Java DSA Study Group"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create room

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Join Room Card */}
            <form
              onSubmit={handleJoin}
              className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_-20px_rgba(15,23,42,0.22)] sm:p-8"
            >
              {/* Card Glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-slate-200/70 blur-2xl transition-all duration-500 group-hover:bg-slate-300/80" />

              {/* Top Border Glow */}
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/60 to-transparent" />

              <div className="relative">

                {/* Icon */}
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-300 transition-transform duration-300 group-hover:scale-105">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>

                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Join Room
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Join a room
                </h2>

                <p className="mt-2 min-h-[52px] text-sm leading-6 text-slate-500">
                  Have a join code? Enter it below and start learning with
                  your study group.
                </p>

                {/* Input */}
                <div className="mt-7">
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700">
                    Join code
                  </label>

                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter your room code"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm font-semibold tracking-[0.18em] text-slate-800 uppercase outline-none transition-all duration-200 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join room

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Bottom Info */}
          <section className="mx-auto mt-8 max-w-4xl">
            <div className="rounded-2xl border border-white/80 bg-white/60 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6">
              <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-500 sm:flex-row sm:gap-4">

                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>

                  Collaborative learning
                </span>

                <span className="hidden text-slate-300 sm:block">
                  •
                </span>

                <span>
                  Share your room code with trusted friends
                </span>

                <span className="hidden text-slate-300 sm:block">
                  •
                </span>

                <span>
                  Learn together
                </span>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}