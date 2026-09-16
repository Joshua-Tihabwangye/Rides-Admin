import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
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
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    const userId = payload.sub ?? payload.userId ?? payload.id;
    return typeof userId === "string" ? userId : null;
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
  serviceId?: string;
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

type VisibleCall = ActiveCall & { state: Exclude<IncomingCallState, { kind: "idle" }> };

function isVisibleCall(call: ActiveCall): call is VisibleCall {
  return call.state.kind !== "idle";
}

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
  const socketRef = useRef<ReturnType<typeof createAdminSocket> | null>(null);
  const seenCallIdsRef = useRef(new Set<string>());
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
    const socket = socketRef.current;
    if (!socket) return;
    const call = callsRef.current.find((candidate) => candidate.callId === callId);
    socket.emit("call.signal", {
      serviceType: "SOS",
      serviceId: call?.serviceId,
      callId,
      type,
      signal,
    });
  }, []);

  const setupPeerConnection = useCallback(
    (callId: string, localStream: MediaStream) => {
      const call = callsRef.current.find((c) => c.callId === callId);
      if (!call) return null;
      const pc = new RTCPeerConnection({ iceServers: call.iceServers ?? DEFAULT_ICE_SERVERS });
      call.refs.pc = pc;
      call.refs.localStream = localStream;
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
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
          setCalls((prev) =>
            prev.map((c) =>
              c.callId === callId
                ? { ...c, state: { kind: "active", callId, peerName: c.callerName, durationSeconds: 0 } }
                : c,
            ),
          );
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
          c.callId === callId ? { ...c, state: { kind: "connecting", callId, peerName: c.callerName } } : c,
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
        void adminEndChatCall(callId).catch(() => undefined);
        endCallUi(callId);
        return;
      }
      const pc = setupPeerConnection(callId, stream);
      if (!pc) return;
      setCalls((prev) => prev.map((c) => (c.callId === callId ? { ...c } : c)));
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
    socketRef.current = socket;
    socket.connect();

    const onCallInvite = (payload: CallInvitePayload) => {
      if (!payload) return;
      // Only SOS fan-out calls are handled by the global emergency overlay.
      // Normal Admin↔Driver / Admin↔Rider service calls remain in the
      // AdminTripCommunicationPanel surface.
      if (payload.serviceType !== "SOS") return;
      if (!myUserId) return;
      if (payload.calleeUserId !== myUserId) return;
      // The Admin socket belongs to both `operations` and its user room, so a
      // targeted invite may arrive through both routes before React renders.
      if (seenCallIdsRef.current.has(payload.callId)) return;
      seenCallIdsRef.current.add(payload.callId);

      const newCall: ActiveCall = {
        callId: payload.callId,
        serviceId: payload.serviceId ?? payload.sosSessionId,
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
                ? { ...c, state: { kind: "connecting", callId: c.callId, peerName: c.callerName } }
                : c,
            ),
          );
        } else if (kind === "declined" || kind === "ended") {
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

    const handleCallAnswered = onCallLifecycle("answered");
    const handleCallDeclined = onCallLifecycle("declined");
    const handleCallEnded = onCallLifecycle("ended");

    socket.on("call.invite", onCallInvite);
    socket.on("call.signal", onCallSignal);
    socket.on("call.answered", handleCallAnswered);
    socket.on("call.declined", handleCallDeclined);
    socket.on("call.ended", handleCallEnded);
    socket.on("sos.leg.cancelled", onSosLegCancelled);
    socket.on("sos.session.update", onSosSessionUpdate);

    return () => {
      socket.off("call.invite", onCallInvite);
      socket.off("call.signal", onCallSignal);
      socket.off("call.answered", handleCallAnswered);
      socket.off("call.declined", handleCallDeclined);
      socket.off("call.ended", handleCallEnded);
      socket.off("sos.leg.cancelled", onSosLegCancelled);
      socket.off("sos.session.update", onSosSessionUpdate);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
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

  const visibleCalls = calls.filter(isVisibleCall);
  if (visibleCalls.length === 0) return null;

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
          top: { xs: 72, md: 92 },
          right: { xs: 12, md: 20 },
          left: { xs: 12, md: "auto" },
          width: { xs: "auto", md: 390 },
          maxHeight: "calc(100vh - 112px)",
          zIndex: (theme) => theme.zIndex.modal + 100,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          overflowY: "auto",
          pointerEvents: "none",
          animation: "emergencyCallPanelIn 0.22s ease-out",
          "@keyframes emergencyCallPanelIn": {
            from: { opacity: 0, transform: "translateX(20px)" },
            to: { opacity: 1, transform: "translateX(0)" },
          },
        }}
      >
        {visibleCalls.map((call) => renderCallContent(call))}
      </Box>
    </>
  );

  function renderCallContent(call: VisibleCall) {
    const state = call.state;
    const ctx = call.emergencyContext;
    const incomingState = state.kind === "incoming" ? state : null;
    const connectingState = state.kind === "connecting" ? state : null;
    const activeState = state.kind === "active" ? state : null;
    const headerLabel = incomingState
      ? "SOS emergency call"
      : connectingState
        ? "Connecting emergency call"
        : "Active emergency call";
    const peerName = incomingState?.callerName ?? connectingState?.peerName ?? activeState?.peerName ?? "Emergency caller";
    const statusColor = activeState ? "#16a34a" : connectingState ? "#f59e0b" : "#dc2626";
    const softStatusBg = activeState ? "#f0fdf4" : connectingState ? "#fffbeb" : "#fef2f2";

    return (
      <Paper
        key={call.callId}
        elevation={12}
        sx={{
          pointerEvents: "auto",
          overflow: "hidden",
          borderRadius: 2,
          border: `1px solid ${statusColor}`,
          bgcolor: "#ffffff",
          color: "#0f172a",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.22)",
        }}
      >
        <Box sx={{ bgcolor: softStatusBg, borderBottom: "1px solid rgba(148,163,184,0.25)", px: 2, py: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: statusColor,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
                animation: incomingState ? "callPulse 1.5s ease-in-out infinite" : "none",
                "@keyframes callPulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(220,38,38,0.7)" },
                  "70%": { boxShadow: "0 0 0 12px rgba(220,38,38,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(220,38,38,0)" },
                },
              }}
            >
              <PhoneIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#111827", lineHeight: 1.2 }}>
                  {headerLabel}
                </Typography>
                <Chip
                  size="small"
                  label={activeState ? "LIVE" : connectingState ? "CONNECTING" : "INCOMING"}
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#fff",
                    bgcolor: statusColor,
                  }}
                />
              </Stack>
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800, mt: 0.25 }}>
                {peerName}
              </Typography>
              {activeState ? (
                <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 900 }}>
                  Call time {formatTime(activeState.durationSeconds)}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ px: 2, py: 1.5 }}>
          {ctx ? (
            <Box sx={{ border: "1px solid #e2e8f0", bgcolor: "#f8fafc", borderRadius: 1.5, p: 1.25, mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOnIcon sx={{ color: "#dc2626", fontSize: 18, mt: 0.2 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                    Incident location
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.35 }}>
                    {ctx.address ?? "Unknown location"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace", display: "block", mt: 0.25 }}>
                    {ctx.latitude.toFixed(5)}, {ctx.longitude.toFixed(5)}
                  </Typography>
                  <Link
                    href={ctx.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.5, fontSize: 12, fontWeight: 800 }}
                  >
                    <MapIcon sx={{ fontSize: 15 }} /> Open in Maps
                  </Link>
                </Box>
              </Stack>
            </Box>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            {call.incidentId ? (
              <Chip size="small" label={`Incident ${call.incidentId.slice(0, 8)}`} sx={{ fontSize: 11, fontWeight: 700 }} />
            ) : null}
            {call.recipientLabel ? (
              <Chip size="small" label={call.recipientLabel} sx={{ fontSize: 11, fontWeight: 700 }} />
            ) : null}
            {call.recipientType ? (
              <Chip size="small" label={call.recipientType} sx={{ fontSize: 11, fontWeight: 700 }} />
            ) : null}
          </Stack>

          <Typography variant="body2" sx={{ color: "#475569", mb: 1.5 }}>
            {incomingState
              ? "Incoming emergency call. Answer to join the incident response."
              : connectingState
                ? "Establishing the secure audio connection..."
                : "Emergency audio channel is live."}
          </Typography>

          {incomingState ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<PhoneIcon />}
                onClick={() => {
                  void answerCall(call.callId, incomingState.callerName, incomingState.mediaType);
                }}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                Answer
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<PhoneDisabledIcon />}
                onClick={() => {
                  void adminRespondToChatCall(call.callId, "DECLINE").catch(() => undefined);
                  endCallUi(call.callId);
                }}
                sx={{ flex: 1, textTransform: "none", fontWeight: 900 }}
              >
                Decline
              </Button>
            </Stack>
          ) : (
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<PhoneDisabledIcon />}
              onClick={() => void hangUp(call.callId)}
              sx={{ textTransform: "none", fontWeight: 900 }}
            >
              End call
            </Button>
          )}
        </Box>
      </Paper>
    );
  }
}
