import { useEffect, useRef, useState, useCallback } from 'react';

// Public Google STUN server — no self-hosted TURN, since Render's free-tier
// web services don't reliably support the persistent UDP a TURN server needs.
// Peers on typical (non-symmetric-NAT) networks connect directly or via STUN.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Mesh-topology WebRTC group video call: one RTCPeerConnection per remote
 * peer, signaled over the existing STOMP connection. Camera/mic access and
 * signaling only start once `active` becomes true (the user pressed
 * "Join call") — not automatically on room load — so nobody's camera turns
 * on without them choosing to.
 */
export function useWebRTC({ roomId, userId, connected, subscribe, publish, active }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [peerUserId]: MediaStream }
  const [mediaError, setMediaError] = useState('');
  const peerConnections = useRef({}); // { [peerUserId]: RTCPeerConnection }
  const localStreamRef = useRef(null);

  const createPeerConnection = useCallback(
    (peerUserId) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          publish(`/app/rooms/${roomId}/signal`, {
            type: 'ICE_CANDIDATE',
            fromUserId: userId,
            toUserId: peerUserId,
            candidate: JSON.stringify(event.candidate),
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({ ...prev, [peerUserId]: event.streams[0] }));
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[peerUserId];
            return next;
          });
        }
      };

      peerConnections.current[peerUserId] = pc;
      return pc;
    },
    [roomId, userId, publish]
  );

  // Acquire local camera/mic only once the user chooses to join the call.
  useEffect(() => {
    if (!active) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      return;
    }

    let cancelled = false;
    setMediaError('');
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) return;
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch((err) => {
        console.error('Could not access camera/mic:', err);
        setMediaError('Could not access your camera/microphone. Check browser permissions.');
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Handle signaling once connected, active, and local stream is ready.
  useEffect(() => {
    if (!active || !connected || !localStream) return;

    const sub = subscribe(`/topic/rooms/${roomId}/signal`, async (msg) => {
      if (msg.fromUserId === userId) return; // ignore our own broadcasts
      if (msg.toUserId && msg.toUserId !== userId) return; // not addressed to us

      if (msg.type === 'JOIN') {
        const pc = createPeerConnection(msg.fromUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        publish(`/app/rooms/${roomId}/signal`, {
          type: 'OFFER',
          fromUserId: userId,
          toUserId: msg.fromUserId,
          sdp: JSON.stringify(offer),
        });
      } else if (msg.type === 'OFFER') {
        const pc = peerConnections.current[msg.fromUserId] || createPeerConnection(msg.fromUserId);
        await pc.setRemoteDescription(JSON.parse(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        publish(`/app/rooms/${roomId}/signal`, {
          type: 'ANSWER',
          fromUserId: userId,
          toUserId: msg.fromUserId,
          sdp: JSON.stringify(answer),
        });
      } else if (msg.type === 'ANSWER') {
        const pc = peerConnections.current[msg.fromUserId];
        if (pc) await pc.setRemoteDescription(JSON.parse(msg.sdp));
      } else if (msg.type === 'ICE_CANDIDATE') {
        const pc = peerConnections.current[msg.fromUserId];
        if (pc && msg.candidate) {
          try {
            await pc.addIceCandidate(JSON.parse(msg.candidate));
          } catch (err) {
            console.error('Failed to add ICE candidate:', err);
          }
        }
      } else if (msg.type === 'LEAVE') {
        peerConnections.current[msg.fromUserId]?.close();
        delete peerConnections.current[msg.fromUserId];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[msg.fromUserId];
          return next;
        });
      }
    });

    publish(`/app/rooms/${roomId}/signal`, { type: 'JOIN', fromUserId: userId });

    return () => {
      sub?.unsubscribe?.();
      publish(`/app/rooms/${roomId}/signal`, { type: 'LEAVE', fromUserId: userId });
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      setRemoteStreams({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, connected, localStream, roomId, userId]);

  return { localStream, remoteStreams, mediaError };
}