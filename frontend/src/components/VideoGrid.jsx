import React, { useEffect, useMemo, useRef, useState } from 'react';

function VideoTile({ stream, label, muted, large = false, isLocal = false, mutedState = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-xl ${
        large ? 'min-h-[240px] sm:min-h-[300px]' : 'min-h-[105px] sm:min-h-[125px]'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full min-h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />

      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        Live
      </div>

      {large && (
        <div className="absolute right-3 top-3 rounded-full border border-indigo-300/20 bg-indigo-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-100 backdrop-blur-md">
          {isLocal ? 'You · Creator' : 'Room creator'}
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white backdrop-blur-md">
            {label?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="truncate rounded-lg bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
            {label}
          </span>
        </div>

        {isLocal && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md">
            {mutedState ? '🔇' : '🎙️'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Video calling only happens when the user chooses to join.
 * The room creator is displayed as the large/main tile when the available
 * room data identifies them. Other participants remain compact.
 */
export default function VideoGrid({
  inCall,
  onJoinCall,
  onLeaveCall,
  localStream,
  remoteStreams,
  mediaError,
  userName,
  isOwner,
  ownerId,
  userId
}) {
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const remoteEntries = Object.entries(remoteStreams || {});

  const ownerPeer = useMemo(() => {
    if (!ownerId) return null;
    return remoteEntries.find(([peerId]) => String(peerId) === String(ownerId)) || null;
  }, [ownerId, remoteEntries]);

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicMuted((value) => !value);
  };

  const toggleCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCameraOff((value) => !value);
  };

  if (!inCall) {
    return (
      <div className="relative flex h-full min-h-[300px] flex-col items-center justify-center overflow-hidden bg-slate-950 px-5 py-8 text-center">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />
        </div>

        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <span className="text-2xl">📹</span>
          </div>

          <h3 className="text-sm font-semibold text-white">Video call is off</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">
            Join the call when you're ready. Your camera won't turn on until you choose to join.
          </p>

          <button
            type="button"
            onClick={onJoinCall}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5"
          >
            📹 Join call
          </button>
        </div>
      </div>
    );
  }

  // If the current user is the creator, their stream is the main tile.
  // If a backend-provided ownerId is available, prefer that remote peer.
  // Without ownerId the first remote peer is the best available fallback;
  // no backend/API logic is changed to manufacture an owner identity.
  const mainIsLocal = isOwner || (!ownerPeer && !isOwner && remoteEntries.length === 0);
  const mainRemote = ownerPeer || (!isOwner ? remoteEntries[0] : null);
  const smallRemotes = mainRemote
    ? remoteEntries.filter(([peerId]) => peerId !== mainRemote[0])
    : remoteEntries;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-3 py-2.5 sm:px-4">
        <div>
          <p className="text-xs font-semibold text-white">Study call</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {1 + remoteEntries.length} participant{remoteEntries.length ? 's' : ''}
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
          Live
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
        <div className="grid gap-2.5">
          {mainIsLocal && localStream && (
            <VideoTile
              stream={localStream}
              label={`${userName} (you)`}
              muted
              large
              isLocal
              mutedState={micMuted}
            />
          )}

          {mainRemote && (
            <VideoTile
              stream={mainRemote[1]}
              label={String(mainRemote[0]) === String(ownerId) ? 'Room creator' : `Peer ${mainRemote[0]}`}
              muted={false}
              large
            />
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {!mainIsLocal && localStream && (
              <VideoTile
                stream={localStream}
                label={`${userName} (you)`}
                muted
                isLocal
                mutedState={micMuted}
              />
            )}

            {smallRemotes.map(([peerId, stream]) => (
              <VideoTile
                key={peerId}
                stream={stream}
                label={`Peer ${peerId}`}
                muted={false}
              />
            ))}
          </div>

          {!localStream && !mediaError && (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03]">
              <span className="mb-2 text-xl">📹</span>
              <p className="text-xs font-medium text-slate-300">Waiting for camera access…</p>
              <p className="mt-1 text-[10px] text-slate-500">Please allow camera and microphone permissions</p>
            </div>
          )}
        </div>
      </div>

      {mediaError && (
        <div className="mx-3 mb-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300">
          ⚠️ {mediaError}
        </div>
      )}

      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/5 px-3 py-3">
        <button
          type="button"
          onClick={toggleMic}
          disabled={!localStream}
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
            micMuted
              ? 'border-red-400/30 bg-red-500/20 text-red-200'
              : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
          } disabled:cursor-not-allowed disabled:opacity-40`}
          title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {micMuted ? '🔇' : '🎙️'}
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          disabled={!localStream}
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
            cameraOff
              ? 'border-red-400/30 bg-red-500/20 text-red-200'
              : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
          } disabled:cursor-not-allowed disabled:opacity-40`}
          title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {cameraOff ? '🚫' : '📹'}
        </button>

        <button
          type="button"
          onClick={onLeaveCall}
          className="ml-1 flex h-10 items-center gap-2 rounded-full bg-red-500 px-4 text-xs font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-600"
        >
          ☎ Leave
        </button>
      </div>
    </div>
  );
}