import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

function DocumentsList({ roomId }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/api/export/${roomId}`)
      .then(({ data }) => setDocs(data))
      .catch(() => setError('Could not load documents for this session.'));
  }, [roomId]);

  if (error) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
          !
        </div>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  if (docs === null) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        <p className="text-xs text-slate-400">Loading documents…</p>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 3v6h5"
            />
          </svg>
        </div>

        <p className="text-xs text-slate-400">
          No exported documents yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {docs.map((d) => (
        <li
          key={d.id}
          className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition-all duration-200 hover:border-indigo-100 hover:bg-indigo-50/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="text-sm">
                {d.type === 'WHITEBOARD' ? '🖊️' : '📝'}
              </span>
            </div>

            <span className="truncate text-sm font-medium text-slate-700">
              {d.fileName}
            </span>
          </div>

          <a
            href={d.url}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100 hover:text-indigo-700"
          >
            Open

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-7-7h7m0 0v7m0-7L10 14"
              />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api
      .get('/api/rooms/mine')
      .then(({ data }) => setRooms(data))
      .catch(() => setError('Could not load your session history.'));
  }, []);

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

      {/* Background Decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute -right-32 top-64 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-300/10 blur-3xl" />
      </div>

      <main className="relative">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm backdrop-blur-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              Session History
            </div>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  My sessions
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Rooms you've created or joined, along with their exported
                  documents.
                </p>
              </div>

              {rooms && rooms.length > 0 && (
                <div className="flex w-fit items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-md">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                    {rooms.length}
                  </div>

                  <span className="text-xs font-medium text-slate-500">
                    {rooms.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 shadow-sm backdrop-blur-md">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-red-600">
                !
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to load sessions
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {rooms === null && !error && (
            <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] backdrop-blur-xl">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-600">
                  Loading your sessions…
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait a moment.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {rooms?.length === 0 && (
            <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-12">
              <div className="mx-auto flex max-w-md flex-col items-center text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
                    />
                  </svg>
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-900">
                  No sessions yet
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create or join a study room to get started. Your rooms and
                  exported documents will appear here.
                </p>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Go to dashboard

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
                </button>
              </div>
            </div>
          )}

          {/* Sessions List */}
          {rooms && rooms.length > 0 && (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="group overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_15px_45px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_-20px_rgba(79,70,229,0.20)]"
                >
                  {/* Room Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      {/* Room Info */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                              />
                            </svg>
                          </div>

                          <h2 className="min-w-0 truncate text-base font-bold text-slate-800 sm:text-lg">
                            {room.name}
                          </h2>

                          {room.owner && (
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                              Creator
                            </span>
                          )}
                        </div>

                        {/* Room Meta */}
                        <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-400">
                              Code
                            </span>

                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-semibold tracking-wider text-slate-600">
                              {room.joinCode}
                            </span>
                          </span>

                          <span className="hidden text-slate-300 sm:inline">
                            •
                          </span>

                          <span>
                            Last joined{' '}
                            <span className="font-medium text-slate-500">
                              {new Date(room.lastJoinedAt).toLocaleDateString()}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => navigate(`/room/${room.id}`)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:flex-none"
                        >
                          Open

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
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
                        </button>

                        <button
                          onClick={() =>
                            setExpanded(
                              expanded === room.id ? null : room.id
                            )
                          }
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 sm:flex-none ${
                            expanded === room.id
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              expanded === room.id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>

                          <span className="hidden sm:inline">
                            {expanded === room.id
                              ? 'Hide docs'
                              : 'Documents'}
                          </span>

                          <span className="sm:hidden">
                            {expanded === room.id ? 'Hide' : 'Docs'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {expanded === room.id && (
                    <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14 3v6h5"
                            />
                          </svg>
                        </div>

                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Exported Documents
                        </h3>
                      </div>

                      <DocumentsList roomId={room.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}