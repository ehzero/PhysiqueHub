"use client";

import { useEffect, useState } from "react";
import { Icons } from "./Icons";

const CONTACT_CATEGORIES = [
  "대회 등록 요청",
  "정정 요청",
  "버그 제보",
  "기타 문의",
];

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactDrawer({ isOpen, onClose }: ContactDrawerProps) {
  const [category, setCategory] = useState(CONTACT_CATEGORIES[0]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <span className="crumb">문의 · PHYSIQUEHUB</span>
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
              <input placeholder="성함 또는 단체명" />
            </label>

            <label className="contact-field">
              <span>이메일</span>
              <input type="email" placeholder="reply@example.com" />
            </label>

            <label className="contact-field">
              <span>문의 내용</span>
              <textarea
                placeholder={`${category} 내용을 입력해주세요.`}
                rows={7}
              />
            </label>
          </form>
        </div>

        <div className="drawer-actions-row">
          <button className="cta-btn accent">
            문의 보내기 →
          </button>
        </div>
      </aside>
    </>
  );
}
