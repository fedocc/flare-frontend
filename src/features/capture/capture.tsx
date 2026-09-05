"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/components/workspace-context";
import { dataProvider, type CreateItemInput } from "@/lib/data";
import { useVoiceCapture } from "./use-voice-capture";

function detectUrl(text: string) {
  try {
    const url = new URL(text.trim());
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function elapsed(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function Capture() {
  const { captureOpen, openCapture, closeCapture, draft, setDraft, refresh } =
    useWorkspace();
  const [hovered, setHovered] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [hasTranscript, setHasTranscript] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [dragging, setDragging] = useState(false);
  const island = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const voice = useVoiceCapture((text) => {
    setDraft([draft.trim(), text].filter(Boolean).join("\n\n"));
    setHasTranscript(true);
  });
  const voiceIsland = voice.state !== "idle";
  const detectedUrl = detectUrl(draft);

  const close = useCallback(() => {
    if (busy) return;
    voice.cancel();
    setDragging(false);
    setHovered(false);
    closeCapture();
  }, [busy, closeCapture, voice]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCapture();
      }
      if (event.key === "Escape" && captureOpen) close();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [captureOpen, close, openCapture]);

  useEffect(() => {
    if (!captureOpen) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !island.current?.contains(event.target)
      )
        close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [captureOpen, close]);

  const attach = (next: File | undefined) => {
    if (!next || voiceIsland || busy) return;
    setFile(next);
    setHasTranscript(false);
  };

  const submit = async () => {
    if (busy || voiceIsland || (!draft.trim() && !file)) return;
    setBusy(true);
    setError("");
    try {
      const content = draft.trim();
      const input: CreateItemInput = file
        ? {
            type: "file",
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            content:
              content ||
              `File metadata only: ${file.type || "unknown type"}, ${file.size} bytes.`,
          }
        : hasTranscript
          ? { type: "audio", title: "Voice memo", status: "ready", content }
          : detectedUrl
            ? {
                type: "url",
                title: detectedUrl.hostname,
                sourceUrl: detectedUrl.href,
                content,
              }
            : {
                type: "note",
                title: content.split("\n")[0].slice(0, 100),
                content,
              };
      const item = await dataProvider.createItem(input);
      refresh();
      setSaved(item.id);
      setDraft("");
      setFile(null);
      setHasTranscript(false);
      closeCapture();
    } catch {
      setError(
        "Could not save to this browser. Free some storage and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const stage = voiceIsland
    ? "voice"
    : captureOpen
      ? "capture"
      : hovered
        ? "hover"
        : "idle";

  return (
    <>
      <div
        ref={island}
        className={`flare-capture flare-capture--${stage} ${dragging ? "is-dragging" : ""}`}
        data-capture-state={stage}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {stage === "idle" || stage === "hover" ? (
          <button
            className="flare-capture-trigger"
            aria-label="Add context"
            aria-haspopup="dialog"
            aria-expanded={captureOpen}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            onClick={() => openCapture()}
          >
            <span className="flare-orb" aria-hidden="true" />
            <span className="flare-capture-label">Add context</span>
          </button>
        ) : voiceIsland ? (
          <div
            className="flare-recording-island"
            role="status"
            aria-live="polite"
          >
            <span className="flare-orb" aria-hidden="true" />
            {voice.state === "recording" ? (
              <>
                <div className="voice-waveform" aria-label="Recording waveform">
                  {Array.from({ length: 18 }, (_, index) => (
                    <i
                      key={index}
                      style={{
                        animationDelay: `${index * -0.08}s`,
                        height: `${8 + ((index * 7) % 17)}px`,
                      }}
                    />
                  ))}
                </div>
                <span className="voice-timer">{elapsed(voice.seconds)}</span>
                <button
                  className="voice-stop"
                  aria-label="Stop recording"
                  onClick={voice.transcribe}
                >
                  <span />
                </button>
              </>
            ) : (
              <span className="recording-status">
                {voice.state === "requesting"
                  ? "Allow microphone…"
                  : "Transcribing…"}
              </span>
            )}
          </div>
        ) : (
          <section
            className="flare-capture-panel"
            role="dialog"
            aria-label="Capture"
          >
            <div
              className="capture-dropzone"
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                attach(event.dataTransfer.files[0]);
              }}
            >
              <textarea
                autoFocus
                aria-label="Capture content"
                placeholder="Type or paste anything…"
                rows={3}
                value={draft}
                disabled={busy}
                onChange={(event) => setDraft(event.target.value)}
                onPaste={(event) => {
                  const pastedFile = event.clipboardData.files[0];
                  if (pastedFile) {
                    event.preventDefault();
                    attach(pastedFile);
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    void submit();
                  }
                }}
              />
              {file && (
                <div className="attachment">
                  <Icon name="file" />
                  <span>
                    {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Remove attachment"
                    disabled={busy}
                    onClick={() => setFile(null)}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              )}
              {hasTranscript && (
                <p className="capture-hint">
                  Demo transcript · edit before capturing
                </p>
              )}
              {detectedUrl && !file && !hasTranscript && (
                <p className="capture-hint accent">
                  URL detected · {detectedUrl.hostname}
                </p>
              )}
            </div>
            {voice.error && (
              <div className="capture-error" role="alert">
                <p>{voice.error}</p>
                <button className="text-button" onClick={voice.transcribe}>
                  Use demo transcript
                </button>
              </div>
            )}
            {error && (
              <p className="capture-error" role="alert">
                {error}
              </p>
            )}
            <footer className="capture-actions">
              <button
                className="icon-button"
                aria-label="Add file"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                <Icon name="file" />
              </button>
              <button
                className="icon-button"
                aria-label="Start recording"
                disabled={!!file || busy}
                onClick={() => void voice.start()}
              >
                <Icon name="audio" />
              </button>
              <span className="capture-drop-hint">
                {dragging ? "Drop to attach" : "Drop a file here"}
              </span>
              <button
                className="button primary"
                disabled={busy || (!draft.trim() && !file)}
                onClick={() => void submit()}
              >
                {busy ? "Saving…" : "Capture"}
                <span className="shortcut">⌘↵</span>
              </button>
              <button
                className="icon-button capture-close"
                aria-label="Close capture"
                disabled={busy}
                onClick={close}
              >
                <Icon name="close" />
              </button>
            </footer>
          </section>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-label="Capture file"
        onChange={(event) => {
          attach(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {saved && (
        <div className="toast" role="status">
          Captured in Vault{" "}
          <Link href={`/vault?item=${saved}`} onClick={() => setSaved("")}>
            View item →
          </Link>
          <button
            className="icon-button"
            aria-label="Dismiss capture confirmation"
            onClick={() => setSaved("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </>
  );
}
