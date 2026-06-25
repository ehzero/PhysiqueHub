"use client";

import { upload } from "@vercel/blob/client";
import { ChangeEvent, FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  CONTACT_ATTACHMENT_ACCEPT,
  MAX_CONTACT_ATTACHMENT_COUNT,
  MAX_CONTACT_ATTACHMENT_SIZE,
  getContactAttachmentContentType,
  getContactBlobAccess,
  isAllowedContactAttachmentContentType,
  isAllowedContactAttachmentName,
} from "@/lib/contact";
import { getApiErrorMessage, apiClient } from "@/lib/http-client";
import { SUPPORT_EMAIL } from "@/lib/site";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { Icons } from "./Icons";

// Categories shown by the redesigned inquiry form.
const CATEGORIES = [
  "대회 등록 요청",
  "정정 문의",
  "버그 제보",
  "광고 문의",
  "기타 문의",
] as const;

export type ContactCategory = (typeof CATEGORIES)[number];

// Comp-related categories that reveal the "관련 대회명" field
const COMP_CATEGORIES: ContactCategory[] = ["대회 등록 요청", "정정 문의"];

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: ContactCategory;
  source?: string;
  competitionId?: string;
  tier?: string;
  organizationId?: string;
}

type AttachmentPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

type SubmitState = "idle" | "submitting" | "done" | "error";

export function ContactDrawer({
  isOpen,
  onClose,
  initialCategory = "기타 문의",
  source,
  competitionId,
  tier,
  organizationId,
}: ContactDrawerProps) {
  const [category, setCategory] = useState<ContactCategory>(initialCategory);
  const [competitionName, setCompetitionName] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputId = useId();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX = Math.min(MAX_CONTACT_ATTACHMENT_COUNT, 6);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && submitState !== "submitting") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitState]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function handleAttachmentChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const newPreviews: AttachmentPreview[] = [];
    for (const file of files) {
      if (attachments.length + newPreviews.length >= MAX) break;
      const contentType = getContactAttachmentContentType(file);
      if (
        file.size <= MAX_CONTACT_ATTACHMENT_SIZE &&
        isAllowedContactAttachmentName(file.name) &&
        isAllowedContactAttachmentContentType(contentType)
      ) {
        newPreviews.push({
          id: Math.random().toString(36).slice(2),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }
    setAttachments((prev) => [...prev, ...newPreviews]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  function resetForm() {
    setCategory("기타 문의");
    setCompetitionName("");
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setSubmitState("idle");
    setErrorMessage("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();

    if (!email || !/.+@.+\..+/.test(email)) return;
    if (!message) return;

    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const access = getContactBlobAccess();
      const uploadedAttachments = await Promise.all(
        attachments.map(async (a) => {
          const contentType = getContactAttachmentContentType(a.file);
          const month = new Date().toISOString().slice(0, 7);
          const ext = a.file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
          const base = a.file.name
            .slice(0, ext ? -ext.length : undefined)
            .replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
            .replace(/^-|-$/g, "").slice(0, 80) || "attachment";
          const pathname = `contact/${month}/${crypto.randomUUID()}-${base}${ext}`;
          const blob = await upload(pathname, a.file, {
            access,
            contentType,
            handleUploadUrl: "/api/contact/upload",
            clientPayload: JSON.stringify({ originalName: a.file.name }),
            multipart: a.file.size > 4 * 1024 * 1024,
          });
          return {
            originalName: a.file.name,
            pathname: blob.pathname,
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            contentType,
            size: a.file.size,
            access,
          };
        }),
      );

      await apiClient.post("/api/contact", {
        category,
        name: competitionName || undefined,
        email,
        message,
        website,
        attachments: uploadedAttachments,
      });
      // open 시점의 컨텍스트(슬롯·대회)를 submit에도 동일하게 실어 슬롯별/대회별
      // 완료율과 리드 전환을 집계할 수 있게 한다.
      trackAnalyticsEvent("contact_submit_success", {
        competitionId,
        properties: {
          category,
          source,
          tier,
          organizationId,
        },
      });
      setSubmitState("done");
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(getApiErrorMessage(err, "문의 전송에 실패했어요."));
    }
  }

  function handleClose() {
    if (submitState === "submitting") return;
    onClose();
    setTimeout(resetForm, 280);
  }

  const showCompField = COMP_CATEGORIES.includes(category);
  const isSubmitting = submitState === "submitting";
  const isDone = submitState === "done";

  return (
    <div
      className={`inq-backdrop${isOpen ? " is-open" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      aria-hidden={!isOpen}
    >
      <div
        className="inq-modal"
        role="dialog"
        aria-modal="true"
        aria-label="문의하기"
      >
        {/* Header */}
        <div className="inq-head">
          <div>
            <div className="inq-title">문의하기</div>
            <div className="inq-subtitle">
              대회 등록·정정부터 버그·광고까지, 무엇이든 알려주세요.
              영업일 기준 1–2일 내 회신드립니다.
            </div>
          </div>
          <button className="inq-x" onClick={handleClose} aria-label="닫기" type="button">
            {Icons.close}
          </button>
        </div>

        {/* Body */}
        <div className="inq-body">
          {!isDone ? (
            <form id={formId} onSubmit={handleSubmit} autoComplete="off">
              {/* Honeypot */}
              <label className="inq-honeypot">
                <span>웹사이트</span>
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>

              {/* Category chips */}
              <div className="inq-field">
                <label className="inq-label">
                  문의 유형<span className="inq-req">*</span>
                </label>
                <div className="inq-cats">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`inq-chip${category === c ? " is-active" : ""}`}
                      onClick={() => setCategory(c)}
                      disabled={isSubmitting}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Competition name (conditional) */}
              <div className={`inq-field inq-comp-field${showCompField ? " visible" : ""}`}>
                <label className="inq-label" htmlFor="inq-comp-name">관련 대회명</label>
                <input
                  className="inq-input"
                  id="inq-comp-name"
                  placeholder="예: 2026 서울 피트니스 챔피언십"
                  value={competitionName}
                  onChange={(e) => setCompetitionName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="inq-field">
                <label className="inq-label" htmlFor="inq-email">
                  회신 이메일<span className="inq-req">*</span>
                </label>
                <input
                  className="inq-input"
                  id="inq-email"
                  name="email"
                  type="email"
                  placeholder={SUPPORT_EMAIL}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Message */}
              <div className="inq-field">
                <label className="inq-label" htmlFor="inq-msg">
                  문의 내용<span className="inq-req">*</span>
                </label>
                <textarea
                  className="inq-textarea"
                  id="inq-msg"
                  name="message"
                  placeholder="문의 내용을 자세히 적어주세요. 대회 등록·정정 요청 시 일정·장소·단체 정보를 함께 적어주시면 빠르게 처리됩니다."
                  required
                  minLength={10}
                  maxLength={5000}
                  disabled={isSubmitting}
                />
              </div>

              {/* Image attachments */}
              <div className="inq-field">
                <label className="inq-label">이미지 첨부</label>
                <div className="inq-attach">
                  {attachments.map((a) => (
                    <div key={a.id} className="inq-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.previewUrl} alt="" />
                      <button
                        type="button"
                        className="inq-rm"
                        onClick={() => removeAttachment(a.id)}
                        aria-label="삭제"
                        disabled={isSubmitting}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  {attachments.length < MAX && (
                    <button
                      type="button"
                      className="inq-add"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      <span>사진 추가</span>
                    </button>
                  )}
                </div>
                <div className="inq-hint">
                  {attachments.length > 0
                    ? `${attachments.length} / ${MAX}장 첨부됨`
                    : `스크린샷·포스터·정정 근거 등 최대 ${MAX}장 (JPG·PNG)`}
                </div>
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept={CONTACT_ATTACHMENT_ACCEPT}
                  multiple
                  hidden
                  onChange={handleAttachmentChange}
                  disabled={isSubmitting}
                />
              </div>

              {submitState === "error" && errorMessage && (
                <p className="inq-error">{errorMessage}</p>
              )}
            </form>
          ) : (
            /* Success state */
            <div className="inq-success">
              <div className="inq-success-ico">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <div className="inq-tag">
                {category}
                {attachments.length > 0 ? ` · 이미지 ${attachments.length}장` : ""}
              </div>
              <h3>문의가 접수되었습니다</h3>
              <p>
                입력하신 이메일로 영업일 기준 1–2일 내<br />
                답변드리겠습니다. 감사합니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="inq-foot">
          {!isDone ? (
            <>
              <button className="inq-cancel" type="button" onClick={handleClose} disabled={isSubmitting}>
                취소
              </button>
              <button
                className="inq-submit"
                type="submit"
                form={formId}
                disabled={isSubmitting}
              >
                {isSubmitting ? "전송 중…" : "문의 보내기"}
              </button>
            </>
          ) : (
            <button className="inq-submit" type="button" onClick={handleClose}>
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
