import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Link,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import { createAdminSocket, readAdminBackendAccessToken } from "../services/api/adminApi";
import {
  adminRespondToChatCall,
  adminEndChatCall,
  type AdminCallMediaType,
} from "../services/api/adminChatApi";

type EmergencyContext = {
  incidentId: string;
  address: string | null;
  latitude: number;
  longitude: number;
  mapUrl: string;
  serviceType?: string;
  serviceId?: string;
  reportedAt?: string;
  callerName?: string;
};

type CallInvitePayload = {
  callId: string;
  callerUserId: string;
  callerName?: string;
  calleeUserId: string;
  serviceType?: string;
  serviceId?: string;
  mediaType?: AdminCallMediaType;
  createdAt?: string;
  // Additive SOS fan-out fields
  sosSessionId?: string;
  incidentId?: string;
  legId?: string;
  recipientType?: "ADMIN" | "EMERGENCY_CONTACT" | "POLICE";
  recipientLabel?: string;
  emergencyContext?: EmergencyContext;
  iceServers?: RTCIceServer[];
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
  callId?: string;
  type: "offer" | "answer" | "ice-candidate" | "end" | "cancel";
  signal: unknown;
  fromUserId?: string;
};

type SosSessionUpdate = {
  sessionId?: string;
  incidentId?: string;
  recipients?: { id: string; type: string; name: string; status: string }[];
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

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

type ActiveCall = {
  callId: string;
  callerName: string;
  mediaType: AdminCallMediaType;
  state: IncomingCallState;
  incidentId?: string;
  emergencyContext?: EmergencyContext;
  recipientType?: string;
  recipientLabel?: string;
  iceServers?: RTCIceServer[];
  refs: {
    pc: RTCPeerConnection | null;
    localStream: MediaStream | null;
    pendingOffer: RTCSessionDescriptionInit | null;
    pendingIceCandidates: RTCIceCandidateInit[];
    callStartedAt: number | null;
    tick: ReturnType<typeof setInterval> | null;
  };
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AdminIncomingCallOverlay() {
  const myUserId = currentAdminUserId() ?? "";
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const callsRef = useRef<ActiveCall[]>([]);
  callsRef.current = calls;
  const audioRefs = useRef<Map<string, HTMLAudioElement | null>>(new Map());

  const stopCallMedia = useCallback((callId: string) => {
    const call = callsRef.current.find((c) => c.callId === callId);
    if (!call) return;
    call.refs.localStream?.getTracks().forEach((t) => t.stop());
    call.refs.localStream = null;
    call.refs.pc?.close();
    call.refs.pc = null;
    call.refs.pendingOffer = null;
    call.refs.pendingIceCandidates = [];
    if (call.refs.tick) {
      clearInterval(call.refs.tick);
      call.refs.tick = null;
    }
    call.refs.callStartedAt = null;
  }, []);

  const endCallUi = useCallback(
    (callId: string) => {
      stopCallMedia(callId);
      setCalls((prev) => prev.filter((c) => c.callId !== callId));
      audioRefs.current.delete(callId);
    },
    [stopCallMedia],
  );

  const emitSignal = useCallback((callId: string, type: string, signal: unknown) => {
    const socket = createAdminSocket();
    socket.emit("call.signal", {
      serviceType: "SOS",
      serviceId: callId,
      callId,
      type,
      signal,
    });
  }, []);

  const setupPeerConnection = useCallback(
    (callId: string) => {
      const call = callsRef.current.find((c) => c.callId === callId);
      if (!call) return null;
      const pc = new RTCPeerConnection({ iceServers: call.iceServers ?? DEFAULT_ICE_SERVERS });
      call.refs.pc = pc;
      call.refs.localStream?.getTracks().forEach((track) => {
        pc.addTrack(track, call.refs.localStream!);
      });
      if (call.refs.pendingIceCandidates.length) {
        call.refs.pendingIceCandidates.forEach((candidate) => {
          void pc.addIceCandidate(candidate).catch(() => undefined);
        });
        call.refs.pendingIceCandidates = [];
      }
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emitSignal(callId, "ice-candidate", event.candidate.toJSON());
        }
      };
      pc.ontrack = (event) => {
        const audioEl = audioRefs.current.get(callId);
        if (audioEl) {
          audioEl.srcObject = event.streams[0] ?? new MediaStream([event.track]);
          audioEl.muted = false;
          void audioEl.play().catch(() => undefined);
        }
      };
      pc.onconnectionstatechange = () => {
        const activeCall = callsRef.current.find((c) => c.callId === callId);
        if (!activeCall) return;
        if (pc.connectionState === "connected" && activeCall.refs.tick === null) {
          activeCall.refs.callStartedAt = Date.now();
          activeCall.refs.tick = setInterval(() => {
            const ac = callsRef.current.find((c) => c.callId === callId);
            if (!ac || ac.refs.callStartedAt === null) return;
            setCalls((prev) =>
              prev.map((c) =>
                c.callId === callId && c.state.kind === "active"
                  ? { ...c, state: { ...c.state, durationSeconds: Math.round((Date.now() - ac.refs.callStartedAt!) / 1000) } }
                  : c,
              ),
            );
          }, 1000);
        }
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          endCallUi(callId);
        }
      };
      return pc;
    },
    [emitSignal, endCallUi],
  );

  const processPendingOffer = useCallback(
    async (callId: string) => {
      const call = callsRef.current.find((c) => c.callId === callId);
      if (!call) return;
      const offer = call.refs.pendingOffer;
      if (!offer) return;
      call.refs.pendingOffer = null;
      const pc = call.refs.pc;
      if (!pc) return;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emitSignal(callId, "answer", answer);
      setCalls((prev) =>
        prev.map((c) =>
          c.callId === callId ? { ...c, state: { kind: "active", callId, peerName: "Driver", durationSeconds: 0 } } : c,
        ),
      );
    },
    [emitSignal],
  );

  const hangUp = useCallback(
    async (callId: string) => {
      const call = callsRef.current.find((c) => c.callId === callId);
      if (!call) return;
      endCallUi(callId);
      try {
        await adminEndChatCall(callId);
      } catch {
        /* best effort */
      }
    },
    [endCallUi],
  );

  const answerCall = useCallback(
    async (callId: string, callerName: string, mediaType: AdminCallMediaType) => {
      try {
        await adminRespondToChatCall(callId, "ANSWER");
      } catch {
        setCalls((prev) =>
          prev.map((c) =>
            c.callId === callId ? { ...c, state: { kind: "incoming", callId, callerName, mediaType } } : c,
          ),
        );
        endCallUi(callId);
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        endCallUi(callId);
        return;
      }
      setCalls((prev) =>
        prev.map((c) => (c.callId === callId ? { ...c, refs: { ...c.refs, localStream: stream } } : c)),
      );
      const pc = setupPeerConnection(callId);
      if (!pc) return;
      setCalls((prev) =>
        prev.map((c) =>
          c.callId === callId ? { ...c, state: { kind: "connecting", callId, peerName: callerName } } : c,
        ),
      );
      void processPendingOffer(callId);
    },
    [endCallUi, processPendingOffer, setupPeerConnection],
  );

  useEffect(() => {
    const socket = createAdminSocket();
    socket.connect();

    const onCallInvite = (payload: CallInvitePayload) => {
      if (!payload) return;
      // Only SOS fan-out calls are handled by the global emergency overlay.
      // Normal Admin↔Driver / Admin↔Rider service calls remain in the
      // AdminTripCommunicationPanel surface.
      if (payload.serviceType !== "SOS") return;
      if (!myUserId) return;
      if (callsRef.current.some((c) => c.callId === payload.callId)) return; // dedupe by callId

      const newCall: ActiveCall = {
        callId: payload.callId,
        callerName: payload.callerName || "SOS Caller",
        mediaType: payload.mediaType ?? "audio",
        incidentId: payload.incidentId ?? payload.emergencyContext?.incidentId,
        emergencyContext: payload.emergencyContext,
        recipientType: payload.recipientType,
        recipientLabel: payload.recipientLabel,
        iceServers: payload.iceServers?.length ? payload.iceServers : DEFAULT_ICE_SERVERS,
        state: {
          kind: "incoming",
          callId: payload.callId,
          callerName: payload.callerName || "SOS Caller",
          mediaType: payload.mediaType ?? "audio",
        },
        refs: {
          pc: null,
          localStream: null,
          pendingOffer: null,
          pendingIceCandidates: [],
          callStartedAt: null,
          tick: null,
        },
      };
      setCalls((prev) => [...prev, newCall]);
      // Join the per-call signaling room so the driver's offer reaches us.
      socket.emit("call.join", { callId: payload.callId });
    };

    const onCallSignal = (payload: SignalPayload) => {
      if (!payload || payload.fromUserId === myUserId) return;
      if (!payload.signal) return;
      const callId = payload.callId ?? payload.serviceId ?? payload.rideId;
      if (!callId) return;
      const matchingCall = callsRef.current.find((c) => c.callId === callId);
      if (!matchingCall) return;
      const pc = matchingCall.refs.pc;

      if (payload.type === "offer") {
        if (!pc) {
          matchingCall.refs.pendingOffer = payload.signal as RTCSessionDescriptionInit;
          return;
        }
        void (async () => {
          await pc.setRemoteDescription(payload.signal as RTCSessionDescriptionInit);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emitSignal(callId, "answer", answer);
          setCalls((prev) =>
            prev.map((c) =>
              c.callId === callId
                ? { ...c, state: { kind: "active", callId, peerName: c.callerName, durationSeconds: 0 } }
                : c,
            ),
          );
        })().catch(() => undefined);
      } else if (payload.type === "answer") {
        if (!pc) return;
        void (async () => {
          await pc.setRemoteDescription(payload.signal as RTCSessionDescriptionInit);
          setCalls((prev) =>
            prev.map((c) =>
              c.callId === callId && c.state.kind === "connecting"
                ? { ...c, state: { kind: "active", callId, peerName: c.state.peerName, durationSeconds: 0 } }
                : c,
            ),
          );
        })().catch(() => undefined);
      } else if (payload.type === "ice-candidate") {
        const candidate = payload.signal as RTCIceCandidateInit;
        if (!pc || !pc.remoteDescription || pc.remoteDescription.type == null) {
          matchingCall.refs.pendingIceCandidates.push(candidate);
          return;
        }
        void pc.addIceCandidate(candidate).catch(() => undefined);
      } else if (payload.type === "end" || payload.type === "cancel") {
        endCallUi(callId);
      }
    };

    const onCallLifecycle =
      (kind: "answered" | "declined" | "ended") => (callPayload: CallLifecyclePayload) => {
        if (!callPayload) return;
        const activeCall = callsRef.current.find((c) => c.callId === callPayload.callId);
        if (!activeCall) return;
        if (kind === "answered") {
          setCalls((prev) =>
            prev.map((c) =>
              c.callId === callPayload.callId && c.state.kind === "incoming"
                ? { ...c, state: { kind: "active", callId: c.callId, peerName: c.callerName, durationSeconds: 0 } }
                : c,
            ),
          );
        } else if (kind === "ended") {
          endCallUi(callPayload.callId);
        }
      };

    const onSosLegCancelled = (payload: { callId?: string }) => {
      if (payload?.callId) endCallUi(payload.callId);
    };

    const onSosSessionUpdate = (payload: SosSessionUpdate) => {
      if (!payload?.incidentId) return;
      // Keep the call tile's location/context authoritative from the backend incident.
      setCalls((prev) =>
        prev.map((c) =>
          c.incidentId === payload.incidentId && payload.recipients
            ? { ...c, recipientLabel: c.recipientLabel ?? payload.recipients.map((r) => r.name).join(", ") }
            : c,
        ),
      );
    };

    socket.on("call.invite", onCallInvite);
    socket.on("call.signal", onCallSignal);
    socket.on("call.answered", onCallLifecycle("answered"));
    socket.on("call.declined", onCallLifecycle("declined"));
    socket.on("call.ended", onCallLifecycle("ended"));
    socket.on("sos.leg.cancelled", onSosLegCancelled);
    socket.on("sos.session.update", onSosSessionUpdate);

    return () => {
      socket.off("call.invite", onCallInvite);
      socket.off("call.signal", onCallSignal);
      socket.off("call.answered", onCallLifecycle("answered"));
      socket.off("call.declined", onCallLifecycle("declined"));
      socket.off("call.ended", onCallLifecycle("ended"));
      socket.off("sos.leg.cancelled", onSosLegCancelled);
      socket.off("sos.session.update", onSosSessionUpdate);
      socket.disconnect();
      callsRef.current.forEach((c) => {
        c.refs.localStream?.getTracks().forEach((t) => t.stop());
        c.refs.pc?.close();
        if (c.refs.tick) clearInterval(c.refs.tick);
      });
    };
  }, [myUserId, emitSignal, endCallUi, setupPeerConnection, processPendingOffer]);

  useEffect(
    () => () => {
      callsRef.current.forEach((c) => {
        c.refs.localStream?.getTracks().forEach((t) => t.stop());
        c.refs.pc?.close();
        if (c.refs.tick) clearInterval(c.refs.tick);
      });
    },
    [],
  );

  const visibleCalls = calls.filter((c) => c.state.kind !== "idle");
  if (visibleCalls.length === 0) return null;

  const isSingle = visibleCalls.length === 1;
  const isPair = visibleCalls.length === 2;
  const isGrid = visibleCalls.length > 2;

  return (
    <>
      {visibleCalls.map((call) => (
        <audio
          key={call.callId}
          ref={(el) => {
            audioRefs.current.set(call.callId, el);
          }}
          autoPlay
          playsInline
          hidden
        />
      ))}

      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 100,
          bgcolor: "rgba(0,0,0,0.85)",
          display: isGrid ? "grid" : "flex",
          ...(isGrid
            ? {
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gridAutoRows: "minmax(280px, 1fr)",
                overflowY: "auto",
                p: 2,
                gap: 2,
                alignContent: "start",
              }
            : {
                flexDirection: { xs: "column", md: "row" },
                alignItems: "stretch",
                justifyContent: "center",
                overflowY: "auto",
              }),
          color: "white",
          animation: "fadeIn 0.2s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        {visibleCalls.map((call, index) => {
          if (isPair) {
            return (
              <Box
                key={call.callId}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: {
                    xs: "none",
                    md: index !== visibleCalls.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  },
                  borderBottom: {
                    xs: index !== visibleCalls.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                    md: "none",
                  },
                  p: 2,
                  overflowY: "auto",
                  minHeight: { xs: 320, md: "auto" },
                }}
              >
                {renderCallContent(call, index)}
              </Box>
            );
          }
          if (isGrid) {
            return (
              <Box
                key={call.callId}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                  overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.04)",
                }}
              >
                {renderCallContent(call, index)}
              </Box>
            );
          }
          return (
            <Box
              key={call.callId}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                overflowY: "auto",
              }}
            >
              {renderCallContent(call, index)}
            </Box>
          );
        })}
      </Box>
    </>
  );

  function renderCallContent(call: ActiveCall, index: number) {
    const state = call.state;
    const ctx = call.emergencyContext;
    return (
      <>
        {state.kind === "incoming" && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "error.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(220,38,38,0.7)" },
                  "70%": { boxShadow: "0 0 0 20px rgba(220,38,38,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(220,38,38,0)" },
                },
              }}
            >
              <PhoneIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              SOS EMERGENCY CALL
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 1, fontWeight: 700 }}>
              {state.callerName}
            </Typography>
            {ctx && (
              <Box sx={{ mb: 2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16 }} /> {ctx.address ?? "Unknown location"}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {ctx.latitude.toFixed(5)}, {ctx.longitude.toFixed(5)}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Link href={ctx.mapUrl} target="_blank" rel="noreferrer" sx={{ color: "#90caf9", fontWeight: 700 }}>
                    <MapIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} /> Open in Maps
                  </Link>
                </Box>
                {call.incidentId && (
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", mt: 0.5 }}>
                    Incident: {call.incidentId}
                  </Typography>
                )}
              </Box>
            )}
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 3 }}>
              Incoming emergency call — answer to respond
            </Typography>
            <Stack direction="row" spacing={5}>
              <Button
                variant="contained"
                onClick={() => {
                  void answerCall(call.callId, state.callerName, state.mediaType);
                }}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  minWidth: 0,
                  bgcolor: "success.main",
                  "&:hover": { bgcolor: "success.dark" },
                }}
              >
                <PhoneIcon sx={{ fontSize: 32 }} />
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  void adminRespondToChatCall(call.callId, "DECLINE").catch(() => undefined);
                  endCallUi(call.callId);
                }}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  minWidth: 0,
                  bgcolor: "error.main",
                  "&:hover": { bgcolor: "error.dark" },
                }}
              >
                <PhoneDisabledIcon sx={{ fontSize: 32 }} />
              </Button>
            </Stack>
          </>
        )}

        {state.kind === "connecting" && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "warning.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <PhoneIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>CONNECTING</Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 1, fontWeight: 700 }}>
              {state.peerName}
            </Typography>
            {ctx && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                {ctx.latitude.toFixed(5)}, {ctx.longitude.toFixed(5)}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 3, mt: 1 }}>
              Establishing secure connection...
            </Typography>
            <Button
              variant="contained"
              onClick={() => void hangUp(call.callId)}
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                minWidth: 0,
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              <PhoneDisabledIcon sx={{ fontSize: 32 }} />
            </Button>
          </>
        )}

        {state.kind === "active" && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <PhoneIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>ACTIVE EMERGENCY CALL</Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 1, fontWeight: 700 }}>
              {state.peerName}
            </Typography>
            {ctx && (
              <Box sx={{ mb: 1, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16 }} /> {ctx.address ?? "Unknown location"}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {ctx.latitude.toFixed(5)}, {ctx.longitude.toFixed(5)}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Link href={ctx.mapUrl} target="_blank" rel="noreferrer" sx={{ color: "#90caf9", fontWeight: 700 }}>
                    <MapIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} /> Open in Maps
                  </Link>
                </Box>
              </Box>
            )}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.1)",
                px: 2,
                py: 0.5,
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {formatTime(state.durationSeconds)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => void hangUp(call.callId)}
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                minWidth: 0,
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              <PhoneDisabledIcon sx={{ fontSize: 32 }} />
            </Button>
          </>
        )}
      </>
    );
  }
}
