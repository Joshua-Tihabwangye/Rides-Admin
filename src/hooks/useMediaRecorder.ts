import { useCallback, useEffect, useRef, useState } from "react";

const RECORDING_TIMESLICE_MS = 250;

export type MediaRecorderResult = {
  supported: boolean;
  recording: boolean;
  elapsedMs: number;
  blob: Blob | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
};

function preferredMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

/**
 * Records a voice note with MediaRecorder (NOT WebRTC). After `stop()` the
 * captured audio is exposed on `blob` asynchronously (MediaRecorder delivers
 * data in the `onstop` handler); `cancel()` discards any recording.
 */
export function useMediaRecorder(): MediaRecorderResult {
  const supported =
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string>("");
  const startingRef = useRef(false);
  const deferredStopRef = useRef(false);

  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);

  const stopStreams = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!supported || recorderRef.current) return;
    if (deferredStopRef.current) return;
    setBlob(null);
    chunksRef.current = [];
    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (deferredStopRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        startingRef.current = false;
        deferredStopRef.current = false;
        return;
      }
      streamRef.current = stream;
      const mimeType = preferredMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeTypeRef.current || "audio/webm";
        const combined = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        if (recorderRef.current === recorder) recorderRef.current = null;
        if (combined.size > 0) setBlob(combined);
      };
      recorder.onerror = () => {
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        if (recorderRef.current === recorder) recorderRef.current = null;
        clearTimer();
        setRecording(false);
        setBlob(null);
      };
      recorderRef.current = recorder;
      recorder.start(RECORDING_TIMESLICE_MS);
      setRecording(true);
      setElapsedMs(0);
      const startedAt = Date.now();
      clearTimer();
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 250);
    } catch {
      stopStreams();
      clearTimer();
      setRecording(false);
    } finally {
      startingRef.current = false;
      if (deferredStopRef.current) {
        deferredStopRef.current = false;
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          try { recorder.stop(); } catch { /* already inactive */ }
        }
        clearTimer();
        setRecording(false);
      }
    }
  }, [supported, clearTimer, stopStreams]);

  const stop = useCallback(() => {
    if (startingRef.current) {
      deferredStopRef.current = true;
      return;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // already inactive
      }
    }
    clearTimer();
    setRecording(false);
  }, [clearTimer]);

  const cancel = useCallback(() => {
    deferredStopRef.current = false;
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // already inactive
        }
      }
    }
    clearTimer();
    stopStreams();
    chunksRef.current = [];
    setRecording(false);
    setElapsedMs(0);
    setBlob(null);
  }, [clearTimer, stopStreams]);

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // already inactive
        }
      }
    }
    clearTimer();
    stopStreams();
  }, [clearTimer, stopStreams]);

  return { supported, recording, elapsedMs, blob, start, stop, cancel };
}
