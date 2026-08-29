import { useCallback, useEffect, useRef, useState } from "react";

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
    setBlob(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeTypeRef.current || "audio/webm";
        const combined = new Blob(chunksRef.current, { type });
        if (combined.size > 0) setBlob(combined);
      };
      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
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
    }
  }, [supported, clearTimer, stopStreams]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // already inactive
      }
    }
    clearTimer();
    stopStreams();
    setRecording(false);
  }, [clearTimer, stopStreams]);

  const cancel = useCallback(() => {
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