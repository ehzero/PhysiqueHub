"use client";

import { useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";

interface ShareButtonProps {
  path?: string;
  title: string;
  text: string;
  className?: string;
  label?: string;
  iconOnly?: boolean;
}

export function ShareButton({
  path,
  title,
  text,
  className = "icon-btn",
  label = "공유",
  iconOnly = false,
}: ShareButtonProps) {
  const [notice, setNotice] = useState("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function onShare() {
    const url = path
      ? new URL(path, window.location.origin).toString()
      : window.location.href;
    const shareData = { title, text, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await copyToClipboard(url);
      showNotice("링크를 복사했어요");
    } catch {
      showNotice("복사에 실패했어요");
    }
  }

  function showNotice(message: string) {
    setNotice(message);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setNotice(""), 1800);
  }

  return (
    <span className="share-action">
      <button
        aria-label={label}
        className={className}
        onClick={onShare}
        type="button"
      >
        {Icons.share}
        {!iconOnly && <span>{label}</span>}
      </button>
      <span aria-live="polite" className={`share-toast ${notice ? "show" : ""}`}>
        {notice}
      </span>
    </span>
  );
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
