import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/axios';
import Navbar from '../components/Navbar';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';

import { useAuth } from '../context/AuthContext';
import { useStompClient } from '../hooks/useStompClient';
import { useWebRTC } from '../hooks/useWebRTC';

const TABS = {
  BOARD: 'board',
  NOTES: 'notes',
  SUMMARY: 'summary'
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    connected,
    subscribe,
    publish
  } = useStompClient();

  /* =========================================================
     VIDEO CALL
  ========================================================= */

  const [inCall, setInCall] = useState(false);

  const {
    localStream,
    remoteStreams,
    mediaError
  } = useWebRTC({
    roomId,
    userId: user.id,
    connected,
    subscribe,
    publish,
    active: inCall
  });

  /* =========================================================
     ROOM
  ========================================================= */

  const [room, setRoom] = useState(null);
  const [roomError, setRoomError] = useState('');

  const [tab, setTab] = useState(TABS.BOARD);

  /*
    chat | video
    Only one is rendered at a time.
  */
  const [roomPanel, setRoomPanel] = useState('chat');

  /* =========================================================
     RENAME / DELETE
  ========================================================= */

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [deleting, setDeleting] = useState(false);

  /* =========================================================
     NOTES
  ========================================================= */

  const [notesTitle, setNotesTitle] = useState('Session Notes');
  const [notesContent, setNotesContent] = useState('');
  const [notesExporting, setNotesExporting] = useState(false);

  const notesFileInputRef = useRef(null);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const [summaries, setSummaries] = useState([]);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  /* =========================================================
     LOAD ROOM
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/api/rooms/${roomId}`)
      .then(({ data }) => {
        if (cancelled) return;

        setRoom(data);
        setNameDraft(data.name || '');
      })
      .catch((err) => {
        if (cancelled) return;

        setRoomError(
          err.response?.data?.message ||
            'Could not load this room.'
        );
      });

    api
      .get(`/api/summary/${roomId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setSummaries(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummaries([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  /* =========================================================
     RENAME
  ========================================================= */

  const handleRename = async () => {
    const nextName = nameDraft.trim();

    if (!nextName || !room) {
      setRenaming(false);
      return;
    }

    if (nextName === room.name) {
      setRenaming(false);
      return;
    }

    try {
      const { data } = await api.put(
        `/api/rooms/${roomId}`,
        {
          name: nextName
        }
      );

      setRoom(data);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Could not rename room.'
      );
    } finally {
      setRenaming(false);
    }
  };

  /* =========================================================
     DELETE ROOM
  ========================================================= */

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Delete this session permanently? This removes chat, whiteboard, summaries and exported files for everyone.'
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(`/api/rooms/${roomId}`);

      navigate('/history');
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Could not delete room.'
      );

      setDeleting(false);
    }
  };

  /* =========================================================
     IMPORT NOTES
  ========================================================= */

  const handleImportNotes = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result =
        typeof reader.result === 'string'
          ? reader.result
          : '';

      setNotesContent(result);

      setNotesTitle(
        file.name.replace(/\.[^/.]+$/, '')
      );
    };

    reader.onerror = () => {
      alert('Could not read this file.');
    };

    reader.readAsText(file);

    /*
      Allows selecting the same file again.
    */
    e.target.value = '';
  };

  /* =========================================================
     EXPORT NOTES
  ========================================================= */

  const handleExportNotes = async () => {
    if (!notesContent.trim()) {
      return;
    }

    setNotesExporting(true);

    try {
      const { data } = await api.post(
        '/api/export/notes',
        {
          roomId,
          title: notesTitle || 'Session Notes',
          content: notesContent
        }
      );

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Export completed, but no file URL was returned.');
      }
    } catch (err) {
      console.error(
        'Notes export failed:',
        err
      );

      alert(
        err.response?.data?.message ||
          'Export failed. Please try again.'
      );
    } finally {
      setNotesExporting(false);
    }
  };

  /* =========================================================
     SUMMARY
  ========================================================= */

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError('');

    try {
      const { data } = await api.post(
        '/api/summary',
        {
          roomId
        }
      );

      setSummaries((prev) => [
        data,
        ...prev
      ]);
    } catch (err) {
      setSummaryError(
        err.response?.data?.message ||
          'Could not generate summary.'
      );
    } finally {
      setSummarizing(false);
    }
  };

  /* =========================================================
     ROOM ERROR
  ========================================================= */

  if (roomError) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50">

        {/* Navbar */}
        <div className="shrink-0">
          <Navbar />
        </div>

        {/* Error content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-md items-center px-4 py-8">

            <div className="w-full rounded-3xl border border-white/80 bg-white/95 p-8 text-center shadow-xl backdrop-blur-xl">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">

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
                    d="M12 9v4m0 4h.01M10.3 3.84L2.7 17a2 2 0 001.73 3h15.14a2 2 0 001.73-3L13.7 3.84a2 2 0 00-3.4 0z"
                  />
                </svg>

              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Unable to open session
              </h2>

              <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {roomError}
              </p>

              <button
                onClick={() => navigate('/dashboard')}
                className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
              >
                Back to dashboard
              </button>

            </div>

          </div>
        </main>

      </div>
    );
  }

  /* =========================================================
     MAIN ROOM
  ========================================================= */

  return (
    <div className="room-page flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <div className="shrink-0">
        <Navbar />
      </div>

      {/* =====================================================
          ROOM HEADER
      ===================================================== */}

      <header className="z-30 shrink-0 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex min-h-[64px] max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-5 lg:px-7">

          {/* =================================================
              ROOM IDENTITY
          ================================================= */}

          <div className="flex min-w-0 flex-1 items-center gap-3">

            {/* Room Icon */}

            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 sm:flex">

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
                  d="M3 7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                />
              </svg>

            </div>

            {/* Room Name */}

            <div className="min-w-0">

              {renaming ? (
                <div className="flex flex-wrap items-center gap-2">

                  <input
                    value={nameDraft}
                    onChange={(e) =>
                      setNameDraft(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename();
                      }

                      if (e.key === 'Escape') {
                        setRenaming(false);
                        setNameDraft(room?.name || '');
                      }
                    }}
                    autoFocus
                    className="w-full max-w-[260px] rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-4 ring-indigo-50 focus:border-indigo-400"
                  />

                  <button
                    onClick={handleRename}
                    className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setRenaming(false);
                      setNameDraft(room?.name || '');
                    }}
                    className="rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    Cancel
                  </button>

                </div>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-2">

                  <h1 className="max-w-[220px] truncate text-base font-bold text-slate-900 sm:max-w-[400px] sm:text-lg">
                    {room?.name || 'Loading room…'}
                  </h1>

                  {room && (
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-slate-500 sm:text-xs">
                      {room.joinCode}
                    </span>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              OWNER ACTIONS
          ================================================= */}

          {room?.owner && !renaming && (
            <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto">

              <button
                onClick={() => setRenaming(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                Rename
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? 'Deleting…'
                  : 'Delete session'}
              </button>

            </div>
          )}

          {/* =================================================
              CONNECTION
          ================================================= */}

          <div
            className={`ml-auto flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              connected
                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                : 'border-amber-100 bg-amber-50 text-amber-600'
            }`}
          >

            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]'
                  : 'animate-pulse bg-amber-500'
              }`}
            />

            {connected
              ? 'Live'
              : 'Connecting…'}

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN WORKSPACE
      ===================================================== */}

      <main className="min-h-0 flex-1 overflow-hidden">

        <div className="mx-auto h-full max-w-[1600px] p-2 sm:p-3 lg:p-4">

          <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">

            {/* =================================================
                LEFT WORKSPACE
            ================================================= */}

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              {/* =================================================
                  TABS
              ================================================= */}

              <div className="shrink-0 border-b border-slate-200 bg-white px-2 sm:px-4">

                <div className="flex overflow-x-auto">

                  {[
                    [TABS.BOARD, 'Whiteboard'],
                    [TABS.NOTES, 'Notes → PDF'],
                    [TABS.SUMMARY, 'Session Summary']
                  ].map(([key, label]) => (

                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`group relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-xs font-semibold transition sm:px-5 sm:text-sm ${
                        tab === key
                          ? 'text-indigo-600'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >

                      {/* Board icon */}

                      {key === TABS.BOARD && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 5h16v12H4zM8 21h8"
                          />
                        </svg>
                      )}

                      {/* Notes icon */}

                      {key === TABS.NOTES && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 3h9l3 3v15H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 3v4h4M8 12h8M8 16h6"
                          />
                        </svg>
                      )}

                      {/* Summary icon */}

                      {key === TABS.SUMMARY && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5h6m-7 4h8m-8 4h5m-8 7h14a2 2 0 002-2V6a2 2 0 00-2-2h-1.5"
                          />
                        </svg>
                      )}

                      {label}

                      {/* Active line */}

                      <span
                        className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all ${
                          tab === key
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />

                    </button>

                  ))}

                </div>

              </div>

              {/* =================================================
                  TAB CONTENT

                  IMPORTANT:
                  This container does NOT scroll.
                  Individual tab containers handle scrolling.
              ================================================= */}

              <div className="min-h-0 flex-1 overflow-hidden bg-white">

                {/* =================================================
                    WHITEBOARD
                ================================================= */}

                {tab === TABS.BOARD && (
                  <div className="room-board-container h-full min-h-0 overflow-hidden">

                    <Whiteboard
                      roomId={roomId}
                      connected={connected}
                      subscribe={subscribe}
                      publish={publish}
                      userId={user.id}
                      isOwner={!!room?.owner}
                    />

                  </div>
                )}

                {/* =================================================
                    NOTES
                ================================================= */}

                {tab === TABS.NOTES && (
                  <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">

                    <div className="mx-auto w-full max-w-5xl">

                      {/* Notes top controls */}

                      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">

                        <input
                          value={notesTitle}
                          onChange={(e) =>
                            setNotesTitle(e.target.value)
                          }
                          placeholder="Notes title"
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                        />

                        {room?.owner && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                notesFileInputRef.current?.click()
                              }
                              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                            >

                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 16V4m0 0L8 8m4-4l4 4M5 20h14"
                                />
                              </svg>

                              Import file

                            </button>

                            <input
                              ref={notesFileInputRef}
                              type="file"
                              accept=".txt,.md"
                              onChange={handleImportNotes}
                              className="hidden"
                            />
                          </>
                        )}

                      </div>

                      {/* Notes editor */}

                      <textarea
                        value={notesContent}
                        onChange={(e) =>
                          setNotesContent(e.target.value)
                        }
                        placeholder="Write or paste external notes here…"
                        className="min-h-[500px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                      {/* Notes actions */}

                      <div className="mt-4 flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="text-xs text-slate-400">

                          {room?.owner
                            ? 'Export your notes as a PDF when ready.'
                            : 'Only the room creator can export notes.'}

                        </div>

                        {room?.owner ? (
                          <button
                            type="button"
                            onClick={handleExportNotes}
                            disabled={
                              notesExporting ||
                              !notesContent.trim()
                            }
                            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                          >

                            {notesExporting ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                Exporting…
                              </>
                            ) : (
                              <>
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
                                    d="M12 4v11m0 0l4-4m-4 4l-4-4M5 20h14"
                                  />
                                </svg>

                                Export as PDF
                              </>
                            )}

                          </button>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Only the room creator can export notes
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                )}

                {/* =================================================
                    SUMMARY
                ================================================= */}

                {tab === TABS.SUMMARY && (
                  <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">

                    <div className="mx-auto w-full max-w-5xl">

                      {/* Summary header */}

                      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

                        <div>

                          <div className="flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">

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
                                  d="M9 5h6m-7 4h8m-8 4h5m-8 7h14a2 2 0 002-2V6a2 2 0 002-2h-1.5"
                                />
                              </svg>

                            </div>

                            <h2 className="text-sm font-bold text-slate-800 sm:text-base">
                              AI Session Summary
                            </h2>

                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            Generate a concise summary from the room chat.
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={handleSummarize}
                          disabled={summarizing}
                          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {summarizing ? (
                            <>
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                              Summarizing…
                            </>
                          ) : (
                            <>
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
                                  d="M12 3v3m6.36-.36l-2.12 2.12M21 12h-3m.36 6.36l-2.12-2.12M12 21v-3m-6.36.36l2.12-2.12M3 12h3m-.36-6.36l2.12 2.12"
                                />
                              </svg>

                              Generate summary
                            </>
                          )}

                        </button>

                      </div>

                      {/* Summary error */}

                      {summaryError && (
                        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {summaryError}
                        </div>
                      )}

                      {/* Summary list */}

                      <div className="space-y-4 pb-4">

                        {summaries.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-100 hover:shadow-md sm:p-5"
                          >

                            <div className="mb-3 flex items-center gap-2">

                              <div className="h-2 w-2 rounded-full bg-indigo-500" />

                              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                {s.createdAt
                                  ? new Date(
                                      s.createdAt
                                    ).toLocaleString()
                                  : 'Unknown date'}
                              </p>

                            </div>

                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {s.content}
                            </p>

                          </div>
                        ))}

                        {summaries.length === 0 && (
                          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 text-center">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">

                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5h6m-7 4h8m-8 4h5m-8 7h14a2 2 0 002-2V6a2 2 0 00-2-2h-1.5"
                                />
                              </svg>

                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-600">
                              No summaries yet
                            </p>

                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                              Generate a summary from the current session chat to see it here.
                            </p>

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                )}

              </div>

            </section>

            {/* =================================================
                RIGHT CHAT / VIDEO PANEL
            ================================================= */}

            <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              {/* =================================================
                  CHAT / VIDEO SWITCH
              ================================================= */}

              <div className="shrink-0 border-b border-slate-200 bg-white p-2.5 sm:p-3">

                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">

                  {/* Chat */}

                  <button
                    type="button"
                    onClick={() => setRoomPanel('chat')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      roomPanel === 'chat'
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>💬</span>
                    Chat
                  </button>

                  {/* Video */}

                  <button
                    type="button"
                    onClick={() => setRoomPanel('video')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      roomPanel === 'video'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>📹</span>
                    Video
                  </button>

                </div>

              </div>

              {/* =================================================
                  ONLY ONE PANEL RENDERED
              ================================================= */}

              <div className="min-h-0 flex-1 overflow-hidden">

                {roomPanel === 'chat' ? (
                  <Chat
                    roomId={roomId}
                    connected={connected}
                    subscribe={subscribe}
                    publish={publish}
                    user={user}
                  />
                ) : (
                  <VideoGrid
                    inCall={inCall}
                    onJoinCall={() => setInCall(true)}
                    onLeaveCall={() => setInCall(false)}
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    mediaError={mediaError}
                    userName={user.name}
                    userId={user.id}
                    isOwner={!!room?.owner}
                    ownerId={
                      room?.ownerId ||
                      (
                        room?.owner &&
                        typeof room.owner === 'object'
                      )
                        ? room.owner.id
                        : null
                    }
                  />
                )}

              </div>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}