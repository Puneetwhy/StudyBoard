import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

export default function Chat({ roomId, connected, subscribe, publish, user }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/api/rooms/${roomId}/chat`).then(({ data }) => setMessages(data)).catch((err) => console.error('Failed to load chat history:', err));
  }, [roomId]);

  useEffect(() => {
    if (!connected) return;
    const sub = subscribe(`/topic/rooms/${roomId}/chat`, (msg) => setMessages((prev) => [...prev, msg]));
    return () => sub?.unsubscribe?.();
  }, [connected, roomId, subscribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    publish(`/app/rooms/${roomId}/chat.send`, { senderId: user.id, senderName: user.name, content: draft.trim() });
    setDraft('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">💬</div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Room chat</h2>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-amber-400'}`} />
                <span className="text-[10px] font-medium text-slate-400">{connected ? 'Connected' : 'Connecting…'}</span>
              </div>
            </div>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-3 py-4 sm:px-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
        {messages.length === 0 && <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-5 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-xl">💬</div><p className="text-sm font-semibold text-slate-700">No messages yet</p><p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">Start a conversation with everyone in this study room.</p></div>}

        <div className="space-y-4">
          {messages.map((m, i) => {
            const isMine = m.senderId === user.id;
            return (
              <div key={i} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                {!isMine && <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[10px] font-bold text-white shadow-sm">{m.senderName?.charAt(0)?.toUpperCase() || '?'}</div>}
                <div className={`flex max-w-[82%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <span className={`mb-1 px-1 text-[10px] font-medium ${isMine ? 'text-indigo-500' : 'text-slate-400'}`}>{isMine ? 'You' : m.senderName}</span>
                  <span className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-sm ${isMine ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-indigo-100' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>{m.content}</span>
                </div>
                {isMine && <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white shadow-sm">{user.name?.charAt(0)?.toUpperCase() || 'Y'}</div>}
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className={`flex items-center gap-2 rounded-2xl border bg-slate-50 p-1.5 transition-all ${connected ? 'border-slate-200 focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50' : 'border-slate-200 opacity-70'}`}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={connected ? 'Type a message…' : 'Connecting…'} disabled={!connected} className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed" />
          <button type="submit" disabled={!connected} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">➤</button>
        </div>
        <div className="mt-2 text-center text-[9px] text-slate-400">Messages are shared with everyone in this room</div>
      </form>
    </div>
  );
}