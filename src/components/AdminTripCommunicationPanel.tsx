// Admin portal communication panel for a safety incident / trip context.
// Reuses the same backend chat + call APIs as the rider and driver apps:
// - chat: the admin joins the ride/delivery thread server-side (threadForService)
// - calls: initiated to a specific party (calleeUserId) and relayed over the
//   service room, which the admin subscribes to on its own admin socket.

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Chip } from "@mui/material";
import { createAdminSocket, getAdminDriver, readAdminBackendAccessToken } from "../services/api/adminApi";
import {
  adminDisplayNameOf,
  adminEndChatCall,
  adminGetOrCreateServiceThread,
  adminInitiateChatCall,
  adminListChatCalls,
  adminListChatMessages,
  adminMarkChatThreadRead,
  adminRespondToChatCall,
  adminSendChatMessage,
  adminUploadChatVoiceNote,
  voiceNoteUrlOf,
  type AdminCallMediaType,
  type AdminCallRecord,
  type AdminChatMessage,
  type AdminChatUser,
  type AdminThreadWithParticipants,
} from "../services/api/adminChatApi";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

type SignalPayload = {
  rideId?: string;
  serviceType?: string;
  serviceId?: string;
  type: "offer" | "answer" | "ice-candidate" | "end";
  signal: unknown;
  fromUserId?: string;
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
};

type CallLifecyclePayload = {
  callId: string;
  callerUserId: string;
  calleeUserId: string;
  serviceType?: string;
  serviceId?: string;
  answeredAt?: string;
  endedAt?: string;
  durationSeconds?: number | null;
};

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type CallUiState =
  | { kind: "idle" }
  | { kind: "ringing"; callId: string; peerName: string; outgoing: boolean }
  | { kind: "incoming"; callId: string; callerName: string; mediaType: AdminCallMediaType }
  | { kind: "active"; callId: string; peerName: string; durationSeconds: number };

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

export default function AdminTripCommunicationPanel({
  serviceType = "RIDE",
  serviceId,
  driverId,
  driverName,
  reporterUserId,
}: {
  serviceType?: string | null;
  serviceId?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  reporterUserId?: string | null;
}) {
  const myUserId = currentAdminUserId() ?? "";
  const [driver, setDriver] = useState<{ userId: string; name: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [thread, setThread] = useState<AdminThreadWithParticipants | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceSending, setVoiceSending] = useState(false);
  const [call, setCall] = useState<CallUiState>({ kind: "idle" });
  const [callError, setCallError] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<AdminCallRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const socketRef = useRef<ReturnType<typeof createAdminSocket> | null>(null);
  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = createAdminSocket();
    }
    return socketRef.current;
  }, []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartedAtRef = useRef<number | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const incomingCallerNameRef = useRef("");
  const myUserIdRef = useRef(myUserId);
  myUserIdRef.current = myUserId;

  const canCall = Boolean(serviceId && myUserId);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;
    getAdminDriver(driverId)
      .then((profile) => {
        if (cancelled) return;
        setDriver({ userId: profile.userId, name: profile.fullName || driverName || "Driver" });
      })
      .catch(() => {
        if (!cancelled && driverName) setDriver({ userId: "", name: driverName });
      });
    return () => {
      cancelled = true;
    };
  }, [driverId, driverName]);

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

  const endCallUi = useCallback(
    (next: CallUiState = { kind: "idle" }) => {
      stopCallMedia();
      callIdRef.current = null;
      setCall(next);
    },
    [stopCallMedia],
  );

  const hangUp = useCallback(async () => {
    const activeCallId = callIdRef.current;
    endCallUi();
    if (activeCallId) {
      try {
        await adminEndChatCall(activeCallId);
      } catch {
        // Best effort: the peer's call.ended event clears both sides.
      }
    }
  }, [endCallUi]);

  const emitSignal = useCallback(
    (type: SignalPayload["type"], signal: unknown) => {
      const socket = getSocket();
      if (!socket.connected) return;
      socket.emit("call.signal", {
        serviceType: serviceType || "RIDE",
        serviceId,
        type,
        signal,
      });
    },
    [getSocket, serviceId, serviceType],
  );

  const setupPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitSignal("ice-candidate", event.candidate.toJSON());
      }
    };
    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        if (tickRef.current === null) {
          callStartedAtRef.current = Date.now();
          tickRef.current = setInterval(() => {
            if (callStartedAtRef.current === null) return;
            const startedAt = callStartedAtRef.current;
            setCall((prev) =>
              prev.kind === "active"
                ? { ...prev, durationSeconds: Math.round((Date.now() - startedAt) / 1000) }
                : prev,
            );
          }, 1000);
        }
      }
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        void hangUp();
      }
    };
    return pc;
  }, [emitSignal, hangUp]);

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
        setCall({
          kind: "active",
          callId: activeCallId,
          peerName: incomingCallerNameRef.current || "Rider",
          durationSeconds: 0,
        });
      }
    },
    [emitSignal],
  );

  const answerCall = useCallback(
    async (payload: CallInvitePayload) => {
      const staleCallId = callIdRef.current;
      if (staleCallId && staleCallId !== payload.callId) {
        try {
          await adminEndChatCall(staleCallId);
        } catch {
          // Ignore: the stale call is replaced by the new one.
        }
      }
      callIdRef.current = payload.callId;
      incomingCallerNameRef.current = payload.callerName || "Rider";
      try {
        await adminRespondToChatCall(payload.callId, "ANSWER");
      } catch {
        setCallError("Could not accept the call. Try again.");
        endCallUi();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
      } catch {
        setCallError("Microphone access is required for calls.");
        endCallUi();
        return;
      }
      const pc = setupPeerConnection();
      setCall({
        kind: "ringing",
        callId: payload.callId,
        peerName: payload.callerName || "Rider",
        outgoing: false,
      });
      await processPendingOffer(pc);
    },
    [endCallUi, processPendingOffer, setupPeerConnection],
  );

  const startOutgoingCall = useCallback(
    async (calleeUserId: string, peerName: string, mediaType: AdminCallMediaType = "audio") => {
      setCallError(null);
      if (!canCall) {
        setCallError("This incident has no linked trip to call over.");
        return;
      }
      if (!calleeUserId) {
        setCallError("The contact party has no user account to call.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
      } catch {
        setCallError("Microphone access is required for calls.");
        return;
      }
      try {
        const result = await adminInitiateChatCall({
          serviceType: serviceType || "RIDE",
          serviceId: serviceId ?? undefined,
          calleeUserId,
          mediaType,
        });
        callIdRef.current = result.call.id;
        const pc = setupPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitSignal("offer", offer);
        setCall({
          kind: "ringing",
          callId: result.call.id,
          peerName: adminDisplayNameOf(result.callee as unknown as AdminChatUser) || peerName || "Party",
          outgoing: true,
        });
      } catch (error) {
        stopCallMedia();
        callIdRef.current = null;
        setCallError(error instanceof Error ? error.message : "Could not start the call.");
      }
    },
    [canCall, emitSignal, serviceId, serviceType, setupPeerConnection, stopCallMedia],
  );

  const loadMessages = useCallback(async () => {
    if (!thread) return;
    setChatLoading(true);
    try {
      const page = await adminListChatMessages(thread.thread.id);
      setMessages(page.items);
      void adminMarkChatThreadRead(thread.thread.id).catch(() => undefined);
    } catch {
      // Keep whatever is already loaded.
    } finally {
      setChatLoading(false);
    }
  }, [thread]);

  const openChat = useCallback(async () => {
    setChatOpen(true);
    setCallError(null);
    if (thread) {
      void loadMessages();
      return;
    }
    if (!serviceId) {
      setCallError("This incident has no linked trip to open a chat on.");
      return;
    }
    setChatLoading(true);
    try {
      const resolved = await adminGetOrCreateServiceThread(
        (serviceType as "RIDE" | "DELIVERY") ?? "RIDE",
        serviceId,
      );
      setThread(resolved);
      const page = await adminListChatMessages(resolved.thread.id);
      setMessages(page.items);
      void adminMarkChatThreadRead(resolved.thread.id).catch(() => undefined);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : "Could not open the chat.");
    } finally {
      setChatLoading(false);
    }
  }, [loadMessages, serviceId, serviceType, thread]);

  const sendMessage = useCallback(async () => {
    const body = draft.trim();
    if (!body || !thread || sending) return;
    setSending(true);
    try {
      await adminSendChatMessage(thread.thread.id, body);
      setDraft("");
    } catch (error) {
      setCallError(error instanceof Error ? error.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }, [draft, sending, thread]);

  const sendVoiceNote = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (!thread || voiceSending) return;
      const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: blob.type });
      setVoiceSending(true);
      try {
        const uploaded = await adminUploadChatVoiceNote(file);
        const attachment = {
          kind: "voice-note",
          url: uploaded.fileUrl,
          mimeType: uploaded.mimeType || blob.type,
          durationMs: Math.round(durationMs),
          sizeBytes: blob.size,
        };
        if (!attachment.url) {
          setCallError("Voice-note upload is unavailable right now.");
          return;
        }
        // The message appears via the admin chat socket echo, as with text.
        await adminSendChatMessage(thread.thread.id, "", [attachment]);
      } catch (error) {
        setCallError(error instanceof Error ? error.message : "Could not send the voice note.");
      } finally {
        setVoiceSending(false);
      }
    },
    [thread, voiceSending],
  );

  const loadCallHistory = useCallback(async () => {
    if (!serviceId) {
      setCallHistory([]);
      return;
    }
    try {
      const page = await adminListChatCalls({ serviceType: serviceType || "RIDE", serviceId });
      setCallHistory(page.items);
    } catch {
      setCallHistory([]);
    }
  }, [serviceId, serviceType]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => () => stopCallMedia(), [stopCallMedia]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!serviceId) return;
    const socket = getSocket();

    const onConnect = () => {
      socket.emit("subscribe", { serviceType: serviceType || "RIDE", serviceId });
    };

    socket.on("connect", onConnect);
    socket.connect();

    const onChatMessage = (message: AdminChatMessage) => {
      if (!message || !thread || message.threadId !== thread.thread.id) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      void adminMarkChatThreadRead(thread.thread.id).catch(() => undefined);
    };

    const onCallInvite = (payload: CallInvitePayload) => {
      if (!payload || !myUserIdRef.current) return;
      if (payload.serviceId && payload.serviceId !== serviceId) return;
      if (payload.calleeUserId !== myUserIdRef.current) return;
      if (callIdRef.current === payload.callId) return;
      if (callIdRef.current) {
        // A call is already in flight on this device — decline the new one.
        void adminRespondToChatCall(payload.callId, "DECLINE").catch(() => undefined);
        return;
      }
      incomingCallerNameRef.current = payload.callerName || "Rider";
      setCall({
        kind: "incoming",
        callId: payload.callId,
        callerName: payload.callerName || "Rider",
        mediaType: payload.mediaType ?? "audio",
      });
    };

    const onCallSignal = (payload: SignalPayload) => {
      if (!payload || !myUserIdRef.current) return;
      if (payload.fromUserId === myUserIdRef.current) return;
      if (payload.serviceId && payload.serviceId !== serviceId) return;
      if (!payload.signal) return;
      const pc = pcRef.current;
      if (payload.type === "offer") {
        if (!pc) {
          // The user has not answered yet — buffer the offer so the answer
          // can complete negotiation once the peer connection exists.
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
            setCall({
              kind: "active",
              callId: activeCallId,
              peerName: incomingCallerNameRef.current || "Rider",
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
            setCall((prev) =>
              prev.kind === "ringing"
                ? { kind: "active", callId: activeCallId, peerName: prev.peerName, durationSeconds: 0 }
                : prev,
            );
          }
        })().catch(() => undefined);
      } else if (payload.type === "ice-candidate") {
        if (!pc) return;
        void pc.addIceCandidate(payload.signal as RTCIceCandidateInit).catch(() => undefined);
      } else if (payload.type === "end") {
        void hangUp();
      }
    };

    const onCallLifecycle = (kind: "answered" | "declined" | "ended") => (payload: CallLifecyclePayload) => {
      if (!payload || !callIdRef.current) return;
      if (payload.callId !== callIdRef.current) return;
      if (kind === "answered") {
        setCall((prev) =>
          prev.kind === "ringing" ? { ...prev, kind: "active" as const, durationSeconds: 0 } : prev,
        );
      } else if (kind === "declined") {
        setCallError("The party declined the call.");
        endCallUi();
      } else if (kind === "ended") {
        endCallUi();
      }
    };

    socket.on("chat.message", onChatMessage);
    socket.on("call.invite", onCallInvite);
    socket.on("call.signal", onCallSignal);
    socket.on("call.answered", onCallLifecycle("answered"));
    socket.on("call.declined", onCallLifecycle("declined"));
    socket.on("call.ended", onCallLifecycle("ended"));

    return () => {
      socket.off("connect", onConnect);
      socket.emit("unsubscribe", { serviceType: serviceType || "RIDE", serviceId });
      socket.off("chat.message", onChatMessage);
      socket.off("call.invite", onCallInvite);
      socket.off("call.signal", onCallSignal);
      socket.off("call.answered", onCallLifecycle("answered"));
      socket.off("call.declined", onCallLifecycle("declined"));
      socket.off("call.ended", onCallLifecycle("ended"));
    };
  }, [chatOpen, emitSignal, endCallUi, getSocket, hangUp, serviceId, serviceType, thread]);

  const peerNameLabel = driver?.name || "Driver";
  const formatDuration = (total: number) => {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const formatTime = (value: string) => {
    try {
      return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const canChat = Boolean(serviceId);
  const hasCallTarget = Boolean(driver?.userId || reporterUserId);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          disabled={!canChat}
          onClick={() => void openChat()}
          sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
        >
          Chat
        </Button>
        <Button
          size="small"
          variant="contained"
          color="error"
          startIcon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
          disabled={!canCall || !driver?.userId}
          onClick={() => driver?.userId ? void startOutgoingCall(driver.userId, peerNameLabel) : undefined}
          sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
        >
          Call driver
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
          disabled={!canCall || !reporterUserId}
          onClick={() => reporterUserId ? void startOutgoingCall(reporterUserId, "Reporter") : undefined}
          sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
        >
          Call reporter
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v5h5" />
              <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              <path d="M12 7v5l4 2" />
            </svg>
          }
          disabled={!canCall}
          onClick={() => {
            setHistoryOpen((prev) => !prev);
            if (!historyOpen) void loadCallHistory();
          }}
          sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
        >
          Call history
        </Button>
        {!hasCallTarget && canCall ? (
          <Chip size="small" label="No call target resolved" sx={{ fontSize: 10, height: 20 }} />
        ) : null}
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline hidden />

      {call.kind === "ringing" || call.kind === "active" ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/90 p-8 backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {call.kind === "ringing" ? (call.outgoing ? "Calling…" : "Connecting…") : "Call in progress"}
          </p>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <p className="text-lg font-black uppercase tracking-tight text-white">{call.peerName}</p>
          {call.kind === "active" ? (
            <p className="font-mono text-sm text-emerald-300">{formatDuration(call.durationSeconds)}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void hangUp()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-all active:scale-95"
            aria-label="End call"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        </div>
      ) : null}

      {call.kind === "incoming" ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/90 p-8 backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Incoming {call.mediaType} call</p>
          <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300">
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <p className="text-lg font-black uppercase tracking-tight text-white">{call.callerName}</p>
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => {
                void answerCall({
                  callId: call.callId,
                  callerUserId: myUserId,
                  callerName: call.callerName,
                  calleeUserId: myUserId,
                  mediaType: call.mediaType,
                });
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl transition-all active:scale-95"
              aria-label="Accept call"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                const activeCallId = call.callId;
                callIdRef.current = activeCallId;
                endCallUi();
                void adminRespondToChatCall(activeCallId, "DECLINE").catch(() => undefined);
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-all active:scale-95"
              aria-label="Decline call"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      {chatOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-black uppercase tracking-tight text-slate-900">
              Chat with {peerNameLabel}
            </p>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close chat"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {chatLoading ? (
              <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-400">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                No messages yet — say hello.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.senderUserId === myUserId;
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        mine ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"
                      }`}
                    >
                      {voiceNoteUrlOf(message) ? (
                        <audio
                          controls
                          preload="metadata"
                          src={voiceNoteUrlOf(message) ?? undefined}
                          className="h-11 w-56 max-w-full"
                          controlsList="nodownload"
                        />
                      ) : null}
                      <p className="text-sm leading-snug">{message.body}</p>
                      <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${mine ? "text-blue-100" : "text-slate-400"}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {callError ? (
            <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600">{callError}</p>
          ) : null}

          <form
            className="flex items-center gap-2 border-t border-slate-200 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <VoiceNoteRecorder
              onSend={(blob, durationMs) => void sendVoiceNote(blob, durationMs)}
              sending={voiceSending}
              disabled={voiceSending || sending}
              accentColor="blue"
            />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={voiceSending ? "Sending voice note…" : "Type a message…"}
              className="flex-1 rounded-full border-2 border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending || voiceSending}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition-all active:scale-95 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-black uppercase tracking-tight text-slate-900">Call history</p>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close history"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {callHistory.length === 0 ? (
              <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-400">No calls yet.</p>
            ) : (
              callHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-2xl border-2 border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight text-slate-900">{record.status}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {record.durationSeconds != null ? (
                    <span className="font-mono text-xs font-bold text-slate-500">{formatDuration(record.durationSeconds)}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
