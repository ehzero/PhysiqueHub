"use client";

import { ChangeEvent, useEffect, useId, useState } from "react";
import { Icons } from "./Icons";

const CONTACT_CATEGORIES = [
  "대회 등록 요청",
  "정정 요청",
  "버그 제보",
  "기타 문의",
];

const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ATTACHMENT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.hwp";

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactDrawer({ isOpen, onClose }: ContactDrawerProps) {
  const [category, setCategory] = useState(CONTACT_CATEGORIES[0]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const attachmentInputId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.size <= MAX_ATTACHMENT_SIZE);
    const hasOversizedFile = validFiles.length !== files.length;

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

    const limitedAttachments = nextAttachments.slice(0, MAX_ATTACHMENT_COUNT);
    const isOverCount = nextAttachments.length > MAX_ATTACHMENT_COUNT;

    setAttachments(limitedAttachments);
    setAttachmentError(
      [
        hasOversizedFile ? "10MB를 초과한 파일은 제외했어요." : "",
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

  return (
    <>
      <div
        className={`drawer-back ${isOpen ? "open" : ""}`}
        onClick={onClose}
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

          <form className="contact-form">
            <input type="hidden" name="category" value={category} />

            <fieldset className="contact-fieldset">
              <legend>문의 유형</legend>
              <div className="contact-category-grid">
                {CONTACT_CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`contact-category ${category === item ? "on" : ""}`}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="contact-field">
              <span>이름</span>
              <input name="name" placeholder="성함 또는 단체명" />
            </label>

            <label className="contact-field">
              <span>이메일</span>
              <input name="email" type="email" placeholder="reply@example.com" />
            </label>

            <label className="contact-field">
              <span>문의 내용</span>
              <textarea
                name="message"
                placeholder={`${category} 내용을 입력해주세요.`}
                rows={7}
              />
            </label>

            <div className="contact-attachments">
              <input
                id={attachmentInputId}
                className="contact-file-input"
                type="file"
                name="attachments"
                accept={ATTACHMENT_ACCEPT}
                multiple
                onChange={handleAttachmentChange}
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
                      >
                        {Icons.trash}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>

        <div className="drawer-actions-row">
          <button className="cta-btn accent">문의 보내기 →</button>
        </div>
      </aside>
    </>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
