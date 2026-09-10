import React, { useEffect, useState } from 'react';
import api from '../api/axios';

/**
 * Pings the backend /health endpoint on mount. Render free-tier web
 * services sleep after inactivity, so the first request can take
 * 20-30s while the container wakes up. This shows a friendly message
 * during that wait instead of leaving the UI looking frozen or broken.
 */
export default function ColdStartLoader({ children }) {
  const [status, setStatus] = useState('checking'); // checking | slow | ready | error

  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === 'checking' ? 'slow' : s));
    }, 2500);

    api
      .get('/health')
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  if (status === 'ready') return children;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Premium grid background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148,163,184,0.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Soft glow */}
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[100px]" />

        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[90px]" />

        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">
          {/* Logo / Brand */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-xl" />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white">
              StudyBoard
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              Collaborative learning workspace
            </p>
          </div>

          {/* Loader */}
          <div className="flex flex-col items-center text-center">
            {status !== 'error' ? (
              <>
                <div className="relative mb-6 h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />

                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-400 border-r-violet-400" />

                  <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-white/5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                  </div>
                </div>

                {status === 'slow' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />

                      <p className="text-sm font-semibold text-white">
                        Waking up the server…
                      </p>
                    </div>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                      The backend sleeps when idle on the free tier. The first
                      request can take up to 30 seconds.
                    </p>

                    <div className="mt-5 flex items-center gap-2 rounded-full border border-amber-400/10 bg-amber-400/5 px-3 py-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-amber-300"
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

                      <span className="text-[10px] font-medium text-amber-200/80">
                        Please wait
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white">
                      Connecting to StudyBoard
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      Checking server connection…
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Error icon */}
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/10 bg-red-500/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9.303 3.376L13.732 4.5a2 2 0 00-3.464 0L2.697 16.126A2 2 0 004.43 19h15.14a2 2 0 001.733-2.874zM12 17.25h.008v.008H12v-.008z"
                    />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-white">
                  Couldn't reach the server
                </p>

                <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                  Please check your internet connection and refresh the page.
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-400/10 bg-red-500/5 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

                  <span className="text-[10px] font-medium text-red-300">
                    Server unavailable
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Bottom status */}
          <div className="mt-8 border-t border-white/5 pt-5">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === 'error'
                    ? 'bg-red-400'
                    : status === 'slow'
                    ? 'bg-amber-400'
                    : 'bg-indigo-400 animate-pulse'
                }`}
              />

              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {status === 'error'
                  ? 'Connection failed'
                  : status === 'slow'
                  ? 'Server waking'
                  : 'Connecting securely'}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-slate-600">
          StudyBoard • Collaborative learning
        </p>
      </div>
    </div>
  );
}