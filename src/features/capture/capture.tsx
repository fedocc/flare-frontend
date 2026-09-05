"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Dialog } from "@/components/dialog";
import { useWorkspace } from "@/components/workspace-context";
import { dataProvider, type CreateItemInput } from "@/lib/data";

export function Capture() {
  const { captureOpen, openCapture, closeCapture, draft, setDraft, refresh } =
    useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [voice, setVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const pending = useRef(false);
  const requestId = useRef(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCapture();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [openCapture]);
  useEffect(
    () => () => {
      pending.current = false;
      requestId.current += 1;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  const stop = () => {
    pending.current = false;
    requestId.current += 1;
    setRequesting(false);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };
  const record = async () => {
    if (pending.current) return;
    if (recording) {
      stop();
      return;
    }
    setError("");
    setNotice("");
    pending.current = true;
    setRequesting(true);
    setNotice("Waiting for microphone permission…");
    const id = ++requestId.current;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setVoice(true);
      setNotice("Microphone unavailable. Demo voice memo attached.");
      pending.current = false;
      setRequesting(false);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!pending.current || id !== requestId.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const next = new MediaRecorder(media);
      recorder.current = next;
      next.start();
      setRecording(true);
      setVoice(true);
      setNotice(
        "Recording. Stop to attach a demo transcript; audio is not uploaded.",
      );
    } catch {
      if (id !== requestId.current) return;
      stream.current?.getTracks().forEach((track) => track.stop());
      setNotice(
        "Microphone access was unavailable. A demo voice memo is attached instead.",
      );
      setVoice(true);
    } finally {
      if (id === requestId.current) {
        pending.current = false;
        setRequesting(false);
      }
    }
  };
  const close = () => {
    stop();
    closeCapture();
  };
  const submit = async () => {
    if (
      busy ||
      recording ||
      pending.current ||
      (!draft.trim() && !file && !voice)
    )
      return;
    setBusy(true);
    setError("");
    try {
      const content = draft.trim();
      let url: string | undefined;
      try {
        const parsed = new URL(content);
        if (["https:", "http:"].includes(parsed.protocol)) url = parsed.href;
      } catch {}
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
        : voice
          ? {
              type: "audio",
              title: "Voice memo",
              status: "processing",
              content:
                content ||
                "Demo transcript: Review the mobile sync contract and confirm expected retry behavior with the team.",
            }
          : url
            ? {
                type: "url",
                title: new URL(url).hostname,
                sourceUrl: url,
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
      setVoice(false);
      setNotice("");
      close();
    } catch {
      setError(
        "Could not save to this browser. Free some storage and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="capture-bar">
        <span className="dot" />
        <button className="capture-prompt" onClick={() => openCapture()}>
          Drop files, paste URL, or speak… <kbd>⌘K</kbd>
        </button>
        <button
          className="icon-button"
          aria-label="Capture voice"
          onClick={() => {
            openCapture();
            setNotice("Select the microphone below to start recording.");
          }}
        >
          <Icon name="audio" />
        </button>
        <button
          className="icon-button"
          aria-label="Capture URL"
          onClick={() => openCapture()}
        >
          <Icon name="url" />
        </button>
        <button
          className="icon-button"
          aria-label="Attach file"
          onClick={() => {
            openCapture();
            fileInput.current?.click();
          }}
        >
          <Icon name="file" />
        </button>
        <button className="button primary pill" onClick={() => openCapture()}>
          Capture
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        aria-label="Capture file"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setVoice(false);
          e.target.value = "";
        }}
      />
      {captureOpen && (
        <Dialog
          title="Expanded Capture"
          onClose={close}
          className="capture-sheet"
        >
          <header className="sheet-header">
            <div>
              <span className="eyebrow">
                <span className="dot" /> QUICK CAPTURE
              </span>
              <h2>Give your context a home.</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Close capture"
              onClick={close}
            >
              <Icon name="close" />
            </button>
          </header>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setFile(e.dataTransfer.files[0] ?? null);
              setVoice(false);
            }}
          >
            <textarea
              ref={textarea}
              autoFocus
              aria-label="Capture content"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="Drop thoughts, paste a URL, or add a file. Flare will take it from here…"
              rows={6}
            />
            {(file || voice) && (
              <div className="attachment">
                <Icon name={file ? "file" : "audio"} />
                <span>
                  {file
                    ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB`
                    : recording
                      ? "Recording…"
                      : "Voice memo · demo transcript"}
                </span>
                <button
                  className="icon-button"
                  aria-label="Remove attachment"
                  onClick={() => {
                    stop();
                    setFile(null);
                    setVoice(false);
                  }}
                >
                  <Icon name="close" />
                </button>
              </div>
            )}
          </div>
          {notice && (
            <p role="status" className="muted">
              {notice}
            </p>
          )}
          {requesting && (
            <button
              className="text-button"
              onClick={() => {
                stop();
                setVoice(true);
                setNotice("Demo voice memo attached. No audio was recorded.");
              }}
            >
              Use a demo voice memo instead
            </button>
          )}
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <footer className="capture-actions">
            <button
              className="icon-button"
              aria-label="Add file"
              disabled={recording || requesting}
              onClick={() => fileInput.current?.click()}
            >
              <Icon name="file" />
            </button>
            <button
              className={`icon-button ${recording ? "recording" : ""}`}
              aria-label={recording ? "Stop recording" : "Start recording"}
              disabled={!!file || requesting}
              onClick={() => void record()}
            >
              <Icon name="audio" />
            </button>
            <span className="muted">Text, links, files & voice</span>
            <button
              className="button primary"
              disabled={
                busy ||
                recording ||
                requesting ||
                (!draft.trim() && !file && !voice)
              }
              onClick={() => void submit()}
            >
              {busy ? "Saving…" : "Capture"}
              <span className="shortcut">⌘↵</span>
            </button>
          </footer>
        </Dialog>
      )}
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
