import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import { createAdminSocket, readAdminBackendAccessToken } from "../services/api/adminApi";
import {
  adminRespondToChatCall,
  adminEndChatCall,
  type AdminCallMediaType,
} from "../services/api/adminChatApi";

type CallInvitePayload = {
  callId: string;
  callerUserId: string;
  callerName?: string;
  calleeUserId: string;
  serviceType?: string;
  serviceId?: string;
  mediaType?: AdminCallMediaType;
  createdAt?: string;
};

type CallLifecyclePayload = {
  callId: string;
  callerUserId: string;
  calleeUserId: string;
  serviceType?: string;
  serviceId?: string;
};

type SignalPayload = {
  rideId?: string;
  serviceType?: string;
  serviceId?: string;
  type: "offer" | "answer" | "ice-candidate" | "end";
  signal: unknown;
  fromUserId?: string;
};

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function currentAdminUserId(): string | null {
  try {
    const token = readAdminBackendAccessToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

type IncomingCallState =
  | { kind: "idle" }
  | { kind: "incoming"; callId: string; callerName: string; mediaType: AdminCallMediaType }
  | { kind: "connecting"; callId: string; peerName: string }
  | { kind: "active"; callId: string; peerName: string; durationSeconds: number };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AdminIncomingCallOverlay() {
  const myUserId = currentAdminUserId() ?? "";
  const [callState, setCallState] = useState<IncomingCallState>({ kind: "idle" });
  const [callError, setCallError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartedAtRef = useRef<number | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const stopCallMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingOfferRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    callStartedAtRef.current = null;
  }, []);

  const endCallUi = useCallback(() => {
    stopCallMedia();
    callIdRef.current = null;
    setCallState({ kind: "idle" });
  }, [stopCallMedia]);

  const emitSignal = useCallback(
    (type: string, signal: unknown) => {
      const socket = createAdminSocket();
      socket.emit("call.signal", {
        serviceType: "SOS",
        serviceId: callIdRef.current ?? "",
        type,
        signal,
      });
    },
    [],
  );

  const setupPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });
    if (pendingIceCandidatesRef.current.length) {
      pendingIceCandidatesRef.current.forEach((candidate) => {
        void pc.addIceCandidate(candidate).catch(() => undefined);
      });
      pendingIceCandidatesRef.current = [];
    }
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitSignal("ice-candidate", event.candidate.toJSON());
      }
    };
    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        remoteAudioRef.current.muted = false;
        void remoteAudioRef.current.play().catch(() => undefined);
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" && tickRef.current === null) {
        callStartedAtRef.current = Date.now();
        tickRef.current = setInterval(() => {
          if (callStartedAtRef.current === null) return;
          const startedAt = callStartedAtRef.current;
          setCallState((prev) =>
            prev.kind === "active"
              ? { ...prev, durationSeconds: Math.round((Date.now() - startedAt) / 1000) }
              : prev,
          );
        }, 1000);
      }
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        endCallUi();
      }
    };
    return pc;
  }, [emitSignal, endCallUi]);

  const processPendingOffer = useCallback(
    async (pc: RTCPeerConnection) => {
      const offer = pendingOfferRef.current;
      if (!offer) return;
      pendingOfferRef.current = null;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emitSignal("answer", answer);
      const activeCallId = callIdRef.current;
      if (activeCallId) {
        setCallState({
          kind: "active",
          callId: activeCallId,
          peerName: "Driver",
          durationSeconds: 0,
        });
      }
    },
    [emitSignal],
  );

  const hangUp = useCallback(async () => {
    const activeCallId = callIdRef.current;
    endCallUi();
    if (activeCallId) {
      try {
        await adminEndChatCall(activeCallId);
      } catch {
        // Best effort
      }
    }
  }, [endCallUi]);

  const answerCall = useCallback(
    async (payload: CallInvitePayload) => {
      callIdRef.current = payload.callId;
      try {
        await adminRespondToChatCall(payload.callId, "ANSWER");
      } catch {
        setCallError("Could not accept the call.");
        endCallUi();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
      } catch {
        setCallError("Microphone access required.");
        endCallUi();
        return;
      }
      const pc = setupPeerConnection();
      setCallState({
        kind: "connecting",
        callId: payload.callId,
        peerName: payload.callerName || "Driver",
      });
      await processPendingOffer(pc);
    },
    [endCallUi, processPendingOffer, setupPeerConnection],
  );

  // Socket listeners for incoming calls
  useEffect(() => {
    const socket = createAdminSocket();
    socket.connect();

    const onCallInvite = (payload: CallInvitePayload) => {
      if (!payload) return;
      if (payload.calleeUserId && payload.calleeUserId !== myUserId && myUserId) return;
      if (callIdRef.current) {
        void adminRespondToChatCall(payload.callId, "DECLINE").catch(() => undefined);
        return;
      }
      callIdRef.current = payload.callId;
      setCallState({
        kind: "incoming",
        callId: payload.callId,
        callerName: payload.callerName || "Driver",
        mediaType: payload.mediaType ?? "audio",
      });
    };

    const onCallSignal = (payload: SignalPayload) => {
      if (!payload || payload.fromUserId === myUserId) return;
      if (!payload.signal) return;
      const pc = pcRef.current;

      if (payload.type === "offer") {
        if (!pc) {
          pendingOfferRef.current = payload.signal as RTCSessionDescriptionInit;
          return;
        }
        void (async () => {
          await pc.setRemoteDescription(payload.signal as RTCSessionDescriptionInit);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emitSignal("answer", answer);
          const activeCallId = callIdRef.current;
          if (activeCallId) {
            setCallState({
              kind: "active",
              callId: activeCallId,
              peerName: "Driver",
              durationSeconds: 0,
            });
          }
        })().catch(() => undefined);
      } else if (payload.type === "answer") {
        if (!pc) return;
        void (async () => {
          await pc.setRemoteDescription(payload.signal as RTCSessionDescriptionInit);
          const activeCallId = callIdRef.current;
          if (activeCallId) {
            setCallState((prev) =>
              prev.kind === "connecting"
                ? { kind: "active", callId: activeCallId, peerName: prev.peerName, durationSeconds: 0 }
                : prev,
            );
          }
        })().catch(() => undefined);
      } else if (payload.type === "ice-candidate") {
        const candidate = payload.signal as RTCIceCandidateInit;
        if (!pc || !pc.remoteDescription || pc.remoteDescription.type == null) {
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }
        void pc.addIceCandidate(candidate).catch(() => undefined);
      } else if (payload.type === "end") {
        endCallUi();
      }
    };

    const onCallLifecycle =
      (kind: "answered" | "declined" | "ended") =>
      (payload: CallLifecyclePayload) => {
        if (!payload || !callIdRef.current) return;
        if (payload.callId !== callIdRef.current) return;
        if (kind === "ended") {
          endCallUi();
        }
      };

    socket.on("call.invite", onCallInvite);
    socket.on("call.signal", onCallSignal);
    socket.on("call.answered", onCallLifecycle("answered"));
    socket.on("call.declined", onCallLifecycle("declined"));
    socket.on("call.ended", onCallLifecycle("ended"));

    return () => {
      socket.off("call.invite", onCallInvite);
      socket.off("call.signal", onCallSignal);
      socket.off("call.answered", onCallLifecycle("answered"));
      socket.off("call.declined", onCallLifecycle("declined"));
      socket.off("call.ended", onCallLifecycle("ended"));
      socket.disconnect();
      stopCallMedia();
    };
  }, [myUserId, emitSignal, endCallUi, setupPeerConnection, processPendingOffer, stopCallMedia]);

  // Cleanup on unmount
  useEffect(() => () => stopCallMedia(), [stopCallMedia]);

  if (callState.kind === "idle") return null;

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline hidden />

      {/* Full-screen incoming call overlay */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 100,
          bgcolor: "rgba(0,0,0,0.85)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          animation: "fadeIn 0.2s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        {callState.kind === "incoming" && (
          <>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: "error.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(220,38,38,0.7)" },
                  "70%": { boxShadow: "0 0 0 20px rgba(220,38,38,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(220,38,38,0)" },
                },
              }}
            >
              <PhoneIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              SOS EMERGENCY CALL
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 1, fontWeight: 700 }}>
              {callState.callerName}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 4 }}>
              Incoming emergency call — answer to respond
            </Typography>

            {callError && (
              <Typography variant="body2" sx={{ color: "error.light", mb: 2 }}>
                {callError}
              </Typography>
            )}

            <Stack direction="row" spacing={6} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  setCallError(null);
                  void answerCall({
                    callId: callState.callId,
                    callerUserId: "",
                    callerName: callState.callerName,
                    calleeUserId: myUserId,
                    mediaType: callState.mediaType,
                  });
                }}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  minWidth: 0,
                  bgcolor: "success.main",
                  "&:hover": { bgcolor: "success.dark" },
                }}
              >
                <PhoneIcon sx={{ fontSize: 36 }} />
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  void adminRespondToChatCall(callState.callId, "DECLINE").catch(() => undefined);
                  endCallUi();
                }}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  minWidth: 0,
                  bgcolor: "error.main",
                  "&:hover": { bgcolor: "error.dark" },
                }}
              >
                <PhoneDisabledIcon sx={{ fontSize: 36 }} />
              </Button>
            </Stack>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mt: 3 }}>
              Tap to respond to this emergency call
            </Typography>
          </>
        )}

        {callState.kind === "connecting" && (
          <>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: "warning.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <PhoneIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              CONNECTING
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 1, fontWeight: 700 }}>
              {callState.peerName}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 4 }}>
              Establishing secure connection...
            </Typography>
            <Button
              variant="contained"
              onClick={() => void hangUp()}
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                minWidth: 0,
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              <PhoneDisabledIcon sx={{ fontSize: 36 }} />
            </Button>
          </>
        )}

        {callState.kind === "active" && (
          <>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <PhoneIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              EMERGENCY CALL ACTIVE
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 1, fontWeight: 700 }}>
              {callState.peerName}
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 99,
                bgcolor: "rgba(255,255,255,0.15)",
                mb: 4,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.light", animation: "pulse 1.5s infinite" }} />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {formatTime(callState.durationSeconds)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => void hangUp()}
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                minWidth: 0,
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              <PhoneDisabledIcon sx={{ fontSize: 36 }} />
            </Button>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mt: 2 }}>
              Tap to end call
            </Typography>
          </>
        )}
      </Box>
    </>
  );
}
