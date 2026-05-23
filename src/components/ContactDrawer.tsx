"use client";

import { upload } from "@vercel/blob/client";
import { ChangeEvent, FormEvent, useEffect, useId, useState } from "react";
import {
  CONTACT_ATTACHMENT_ACCEPT,
  CONTACT_CATEGORIES,
  MAX_CONTACT_ATTACHMENT_COUNT,
  MAX_CONTACT_ATTACHMENT_SIZE,
  getContactAttachmentContentType,
  getContactBlobAccess,
  isAllowedContactAttachmentContentType,
  isAllowedContactAttachmentName,
} from "@/lib/contact";
import { Icons } from "./Icons";

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadedContactAttachment = {
  originalName: string;
  pathname: string;
  url: string;
  downloadUrl?: string;
  contentType: string;
  size: number;
  access: "private" | "public";
};

export function ContactDrawer({ isOpen, onClose }: ContactDrawerProps) {
  const [category, setCategory] = useState<string>(CONTACT_CATEGORIES[0]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const attachmentInputId = useId();
  const formId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSubmitting, onClose]);

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      const contentType = getContactAttachmentContentType(file);

      return (
        file.size <= MAX_CONTACT_ATTACHMENT_SIZE &&
        isAllowedContactAttachmentName(file.name) &&
        isAllowedContactAttachmentContentType(contentType)
      );
    });
    const hasOversizedFile = files.some(
      (file) => file.size > MAX_CONTACT_ATTACHMENT_SIZE,
    );
    const hasUnsupportedFile = validFiles.length !== files.length && !hasOversizedFile;

    const nextAttachments = [...attachments, ...validFiles].reduce<File[]>(
      (uniqueFiles, file) => {
        const exists = uniqueFiles.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        );

        return exists ? uniqueFiles : [...uniqueFiles, file];
      },
      [],
    );

    const limitedAttachments = nextAttachments.slice(0, MAX_CONTACT_ATTACHMENT_COUNT);
    const isOverCount = nextAttachments.length > MAX_CONTACT_ATTACHMENT_COUNT;

    setAttachments(limitedAttachments);
    setAttachmentError(
      [
        hasOversizedFile ? "10MB를 초과한 파일은 제외했어요." : "",
        hasUnsupportedFile ? "지원하지 않는 형식의 파일은 제외했어요." : "",
        isOverCount ? "첨부 파일은 최대 5개까지 등록할 수 있어요." : "",
      ]
        .filter(Boolean)
        .join(" "),
    );

    event.target.value = "";
  }

  function removeAttachment(fileToRemove: File) {
    setAttachments((current) =>
      current.filter((file) => file !== fileToRemove),
    );
    setAttachmentError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setAttachmentError("");
    setSubmitMessage("");
    setIsSubmitting(true);

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();

    try {
      setSubmitMessage(
        attachments.length > 0 ? "첨부 파일을 업로드하고 있어요." : "문의 내용을 보내고 있어요.",
      );

      const uploadedAttachments = await uploadAttachments(attachments);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          name,
          email,
          message,
          website,
          attachments: uploadedAttachments,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "문의 전송에 실패했어요.");
      }

      form.reset();
      setAttachments([]);
      setCategory(CONTACT_CATEGORIES[0]);
      setSubmitMessage("문의가 접수되었습니다. 확인 후 답변드릴게요.");
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "문의 전송에 실패했어요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        className={`drawer-back ${isOpen ? "open" : ""}`}
        onClick={isSubmitting ? undefined : onClose}
      />
      <aside className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <span className="crumb">문의</span>
          <div className="drawer-actions">
            <button className="icon-btn" onClick={onClose} aria-label="close">
              {Icons.close}
            </button>
          </div>
        </div>

        <div className="drawer-body contact-body">
          <div className="contact-intro">
            <h2 className="page-title">문의하기</h2>
            <p className="page-subtitle">
              대회 정보 등록, 일정 정정, 서비스 오류, 기타 문의를 남겨주세요.
              확인 후 필요한 내용을 반영하겠습니다.
            </p>
          </div>

          <form className="contact-form" id={formId} onSubmit={handleSubmit}>
            <input type="hidden" name="category" value={category} />
            <label className="contact-honeypot">
              <span>웹사이트</span>
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>

            <fieldset className="contact-fieldset">
              <legend>문의 유형</legend>
              <div className="contact-category-grid">
                {CONTACT_CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`contact-category ${category === item ? "on" : ""}`}
                    onClick={() => setCategory(item)}
                    disabled={isSubmitting}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="contact-field">
              <span>이름</span>
              <input
                name="name"
                placeholder="성함 또는 단체명"
                required
                minLength={2}
                maxLength={80}
                disabled={isSubmitting}
              />
            </label>

            <label className="contact-field">
              <span>이메일</span>
              <input
                name="email"
                type="email"
                placeholder="reply@example.com"
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="contact-field">
              <span>문의 내용</span>
              <textarea
                name="message"
                placeholder={`${category} 내용을 입력해주세요.`}
                rows={7}
                required
                minLength={10}
                maxLength={5000}
                disabled={isSubmitting}
              />
            </label>

            <div className="contact-attachments">
              <input
                id={attachmentInputId}
                className="contact-file-input"
                type="file"
                name="attachments"
                accept={CONTACT_ATTACHMENT_ACCEPT}
                multiple
                onChange={handleAttachmentChange}
                disabled={isSubmitting}
              />
              <label className="contact-file-button" htmlFor={attachmentInputId}>
                {Icons.paperclip}
                <span>파일 첨부</span>
              </label>
              <p className="contact-file-help">
                이미지, PDF, 문서 파일을 최대 5개까지 첨부할 수 있어요. 파일당
                최대 10MB까지 지원합니다.
              </p>

              {attachmentError && (
                <p className="contact-file-error">{attachmentError}</p>
              )}

              {attachments.length > 0 && (
                <ul className="contact-file-list">
                  {attachments.map((file) => (
                    <li
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="contact-file-item"
                    >
                      <span className="contact-file-name">{file.name}</span>
                      <span className="contact-file-size">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        className="contact-file-remove"
                        onClick={() => removeAttachment(file)}
                        aria-label={`${file.name} 첨부 삭제`}
                        disabled={isSubmitting}
                      >
                        {Icons.trash}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {submitMessage && (
              <p className="contact-submit-message" aria-live="polite">
                {submitMessage}
              </p>
            )}
          </form>
        </div>

        <div className="drawer-actions-row">
          <button
            className="cta-btn accent"
            disabled={isSubmitting}
            form={formId}
            type="submit"
          >
            {isSubmitting ? "전송 중..." : "문의 보내기 →"}
          </button>
        </div>
      </aside>
    </>
  );
}

async function uploadAttachments(files: File[]): Promise<UploadedContactAttachment[]> {
  const access = getContactBlobAccess();

  return Promise.all(
    files.map(async (file) => {
      const contentType = getContactAttachmentContentType(file);
      const blob = await upload(createContactPathname(file), file, {
        access,
        contentType,
        handleUploadUrl: "/api/contact/upload",
        clientPayload: JSON.stringify({ originalName: file.name }),
        multipart: file.size > 4 * 1024 * 1024,
      });

      return {
        originalName: file.name,
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        contentType,
        size: file.size,
        access,
      };
    }),
  );
}

function createContactPathname(file: File) {
  const month = new Date().toISOString().slice(0, 7);
  const extension = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
  const basename = file.name
    .slice(0, extension ? -extension.length : undefined)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const safeBasename = basename || "attachment";

  return `contact/${month}/${crypto.randomUUID()}-${safeBasename}${extension}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
