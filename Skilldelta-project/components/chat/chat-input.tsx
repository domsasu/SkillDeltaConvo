
import { useState, useRef, useCallback } from "react";
import clsx from "clsx";
import { FileUp, Paperclip, Plus, X } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onResumeSubmit?: (payload: { fileName: string; text: string; note?: string }) => void;
  uploadError?: string | null;
  onClearUploadError?: () => void;
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M9.25033 6.875L5.57928 10.546C5.42942 10.6959 5.2538 10.7708 5.05241 10.7708C4.85102 10.7708 4.6706 10.6944 4.51116 10.5417C4.36505 10.3889 4.29199 10.2118 4.29199 10.0104C4.29199 9.80903 4.36713 9.63326 4.51741 9.48313L9.47762 4.52917C9.55276 4.45417 9.63414 4.39931 9.72178 4.36458C9.80942 4.32986 9.90338 4.3125 10.0037 4.3125C10.1038 4.3125 10.1978 4.32986 10.2855 4.36458C10.3732 4.39931 10.4517 4.45139 10.5212 4.52083L15.4795 9.47917C15.6323 9.63194 15.7087 9.80556 15.7087 10C15.7087 10.1944 15.6356 10.3681 15.4895 10.5208C15.33 10.6736 15.1485 10.75 14.9447 10.75C14.7411 10.75 14.5652 10.6736 14.417 10.5208L10.7503 6.875V15.2504C10.7503 15.4628 10.6789 15.6408 10.536 15.7846C10.393 15.9282 10.216 16 10.0047 16C9.79345 16 9.61491 15.9282 9.46908 15.7846C9.32324 15.6408 9.25033 15.4628 9.25033 15.2504V6.875Z" fill="white"/>
    </svg>
  );
}

const ACCEPT_RESUME = ".pdf,.txt,application/pdf,text/plain";
const RESUME_TEXT_MAX_CHARS = 120_000;

function pickResumeFile(list: FileList | File[]): File | null {
  const files = Array.from(list);
  const ok = files.filter(
    (f) => /\.(pdf|txt)$/i.test(f.name) || f.type === "application/pdf" || f.type === "text/plain",
  );
  return ok[0] ?? null;
}

type PendingResume = {
  file: File;
  extractedText: string | null;
  extracting: boolean;
};

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "I want to learn...",
  onResumeSubmit,
  uploadError,
  onClearUploadError,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [formatHint, setFormatHint] = useState<string | null>(null);
  const [localExtractError, setLocalExtractError] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<PendingResume | null>(null);
  const dragDepth = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearPending = useCallback(() => {
    setPendingResume(null);
    setLocalExtractError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const stageResumeFile = useCallback(
    async (file: File | null) => {
      if (!file || !onResumeSubmit || disabled) return;
      setLocalExtractError(null);
      onClearUploadError?.();
      setPendingResume({ file, extractedText: null, extracting: true });
      try {
        const { extractTextFromResumeFile } = await import("@/services/extractResumeText");
        const text = await extractTextFromResumeFile(file);
        const clipped =
          text.length > RESUME_TEXT_MAX_CHARS
            ? `${text.slice(0, RESUME_TEXT_MAX_CHARS)}\n\n[…truncated for length]`
            : text;
        setPendingResume({ file, extractedText: clipped, extracting: false });
      } catch (err) {
        setLocalExtractError(err instanceof Error ? err.message : "Could not read that file.");
        setPendingResume(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onResumeSubmit, disabled, onClearUploadError],
  );

  const handleSubmit = useCallback(() => {
    if (disabled) return;
    onClearUploadError?.();

    if (pendingResume?.extractedText && onResumeSubmit) {
      const note = value.trim();
      onResumeSubmit({
        fileName: pendingResume.file.name,
        text: pendingResume.extractedText,
        note: note || undefined,
      });
      clearPending();
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend, onClearUploadError, pendingResume, onResumeSubmit, clearPending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!onResumeSubmit || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current += 1;
      setIsDragging(true);
    },
    [onResumeSubmit, disabled],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!onResumeSubmit || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setIsDragging(false);
      }
    },
    [onResumeSubmit, disabled],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setIsDragging(false);
      if (!onResumeSubmit || disabled) return;
      const file = pickResumeFile(e.dataTransfer.files);
      if (file) {
        setFormatHint(null);
        void stageResumeFile(file);
      } else if (e.dataTransfer.files.length > 0) {
        setFormatHint("Use a PDF or .txt file.");
        window.setTimeout(() => setFormatHint(null), 4000);
      }
    },
    [onResumeSubmit, disabled, stageResumeFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      const picked = file ? pickResumeFile([file]) : null;
      void stageResumeFile(picked);
    },
    [stageResumeFile],
  );

  const trimmed = value.trim();
  const canSendResume = Boolean(pendingResume?.extractedText && onResumeSubmit);
  const canSendText = trimmed.length > 0;
  const canSubmit = canSendResume || canSendText;
  const sendBlocked =
    disabled || Boolean(pendingResume?.extracting) || (!canSendResume && !canSendText);

  const showDropOverlay = isDragging && !disabled && onResumeSubmit;

  return (
    <div className="flex w-full flex-col gap-1">
      <div
        className={clsx(
          "relative flex min-h-[88px] flex-col rounded-2xl border bg-white px-4 pt-3 pb-3 transition-[box-shadow,background-color,border-color] duration-150",
          showDropOverlay
            ? "border-[#0056d2] border-2 border-dashed bg-[#e8f1fc] ring-2 ring-[#0056d2]/30"
            : "border-[#dae1ed] focus-within:ring-2 focus-within:ring-[#0056d2]",
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {showDropOverlay && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[14px] bg-[#e8f1fc]/95 px-4 py-3 text-center"
            aria-hidden
          >
            <FileUp className="h-8 w-8 shrink-0 text-[#0056d2]" strokeWidth={1.75} />
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-[#0f1114]">Drop files here</p>
              <ul className="list-none space-y-0.5 text-xs leading-snug text-[#5b6780]">
                <li>PDF — .pdf</li>
                <li>Plain text — .txt</li>
              </ul>
            </div>
          </div>
        )}

        {pendingResume && onResumeSubmit && (
          <div className="mb-2 flex min-w-0 items-center gap-2 rounded-xl border border-[#dae1ed] bg-[#f8fafc] px-3 py-2">
            <Paperclip className="h-4 w-4 shrink-0 text-[#0056d2]" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#0f1114]">
              {pendingResume.file.name}
            </span>
            {pendingResume.extracting && (
              <span className="shrink-0 text-xs text-[#0056d2]">Reading…</span>
            )}
            <button
              type="button"
              disabled={disabled || pendingResume.extracting}
              onClick={clearPending}
              className="shrink-0 rounded-full p-1 text-[#5b6780] hover:bg-[#eef2f7] hover:text-[#0f1114] disabled:opacity-40"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onClearUploadError?.();
            setFormatHint(null);
            setLocalExtractError(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => onClearUploadError?.()}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="max-h-36 min-h-[2.5rem] flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_RESUME}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={onFileChange}
            />
            <button
              type="button"
              disabled={disabled || !onResumeSubmit}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#0f1114] transition-colors",
                onResumeSubmit && !disabled
                  ? "cursor-pointer hover:bg-[#f2f5fa]"
                  : "cursor-not-allowed opacity-40",
              )}
              aria-label="Upload resume (PDF or TXT)"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sendBlocked}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#0056d2] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {(uploadError || formatHint || localExtractError) && (
        <p
          className={clsx(
            "px-1 text-xs",
            uploadError || localExtractError ? "text-red-600" : "text-[#5b6780]",
          )}
          role="alert"
        >
          {uploadError ?? localExtractError ?? formatHint}
        </p>
      )}
    </div>
  );
}
