import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">

        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-7">

          {/* Logo */}
          <Link
            to="/dashboard"
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 transition-transform duration-200 group-hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <span className="hidden bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:block">
              StudyBoard
            </span>

            <span className="text-lg font-extrabold tracking-tight text-indigo-600 sm:hidden">
              SB
            </span>
          </Link>

          {/* Navigation */}
          {user && (
            <Link
              to="/history"
              className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5"
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

              <span className="hidden sm:inline">
                My sessions
              </span>

              <span className="sm:hidden">
                Sessions
              </span>
            </Link>
          )}
        </div>

        {/* Right Section */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">

            {/* User Profile */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 sm:px-3">
              
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold uppercase text-white shadow-sm">
                {user.name?.charAt(0)}
              </div>

              {/* Name */}
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-slate-700">
                  {user.name}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Student
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md sm:px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12H3m0 0l4-4m-4 4l4 4m8-9V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 6v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2"
                />
              </svg>

              <span className="hidden sm:inline">
                Log out
              </span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}