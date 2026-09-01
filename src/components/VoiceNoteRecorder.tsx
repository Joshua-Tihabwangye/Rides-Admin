import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaRecorder } from "../hooks/useMediaRecorder";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * A microphone button that records a voice note (MediaRecorder, NOT WebRTC).
 * Hold-to-record: press to start, release to stop/send. The blob is handed to
 * `onSend` as soon as MediaRecorder emits `onstop`.
 */
export function VoiceNoteRecorder({
  onSend,
  sending = false,
  disabled = false,
  accentColor = "blue",
}: {
  onSend: (blob: Blob, durationMs: number) => void;
  sending?: boolean;
  disabled?: boolean;
  accentColor?: "blue" | "red" | "emerald";
}) {
  const { supported, recording, elapsedMs, blob, start, stop, cancel } = useMediaRecorder();
  const startedAtRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!blob || cancelledRef.current || sentRef.current) return;
    sentRef.current = true;
    const started = startedAtRef.current ?? Date.now();
    startedAtRef.current = null;
    onSend(blob, Date.now() - started);
  }, [blob, onSend]);

  const handlePointerDown = useCallback(() => {
    if (disabled || sending) return;
    cancelledRef.current = false;
    sentRef.current = false;
    startedAtRef.current = Date.now();
    void start();
  }, [disabled, sending, start]);

  const handlePointerUp = useCallback(() => {
    if (!recording) return;
    stop();
  }, [recording, stop]);

  const handlePointerLeave = useCallback(() => {
    if (!recording) return;
    stop();
  }, [recording, stop]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    startedAtRef.current = null;
    cancel();
  }, [cancel]);

  if (!supported) return null;

  const recordingClasses =
    accentColor === "red"
      ? "bg-red-500 text-white shadow-md shadow-red-100"
      : accentColor === "emerald"
        ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
        : "bg-blue-600 text-white shadow-md shadow-blue-100";
  const idleClasses =
    accentColor === "emerald"
      ? "border-2 border-slate-100 bg-white text-slate-700 ring-1 ring-slate-100"
      : "border-2 border-slate-200 bg-white text-slate-600";

  return (
    <div className="relative flex shrink-0 items-center">
      {recording ? (
        <div className="mr-1 flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-[10px] font-black tabular-nums text-red-600">● {formatClock(elapsedMs)}</span>
        </div>
      ) : null}
      <button
        type="button"
        disabled={disabled || sending}
        onPointerDown={(event) => {
          event.preventDefault();
          handlePointerDown();
        }}
        onPointerUp={(event) => {
          event.preventDefault();
          handlePointerUp();
        }}
        onPointerLeave={() => {
          if (recording) handlePointerLeave();
        }}
        onPointerCancel={handleCancel}
        onContextMenu={(event) => {
          event.preventDefault();
          handleCancel();
        }}
        aria-label={sending ? "Sending voice note…" : "Hold to record a voice note"}
        title="Hold to record a voice note"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-40 ${
          recording ? recordingClasses : idleClasses
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
    </div>
  );
}