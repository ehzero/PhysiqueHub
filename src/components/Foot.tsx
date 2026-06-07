import packageJson from "../../package.json";
import Link from "next/link";
import { PWA_INSTALL_REQUEST_EVENT } from "@/components/PwaBootstrap";
import { SUPPORT_EMAIL } from "@/lib/site";

interface FootProps {
  seasonYear?: number;
  onOpenContact?: () => void;
}

export function Foot({
  seasonYear = new Date().getFullYear(),
  onOpenContact,
}: FootProps) {
  const requestPwaInstall = () => {
    window.dispatchEvent(new Event(PWA_INSTALL_REQUEST_EVENT));
  };

  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-row">
          <div className="foot-brand">
            <div className="foot-brand-mark" aria-label="피지크허브">
              피지크허브
            </div>
            <p className="foot-brand-desc">
              피지크허브는 국내 피트니스·보디빌딩 대회 일정을 중심으로 공식
              공지와 접수 정보를 모아, 종목·지역·단체·접수 상태별 탐색을
              돕습니다. 주요 해외 대회 일정, 출전 가이드, 대회 준비 아티클까지
              함께 확인할 수 있습니다.
            </p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h5>Explore</h5>
              <ul>
                <li>
                  <Link href="/competitions">
                    전체 피트니스·보디빌딩 대회 일정
                  </Link>
                </li>
                <li>
                  <Link href="/guide#division">
                    종목별 가이드 보기
                  </Link>
                </li>
                <li>
                  <button
                    className="foot-link-btn"
                    type="button"
                    onClick={requestPwaInstall}
                  >
                    홈 화면에 추가
                  </button>
                </li>
              </ul>
            </div>
            <div className="foot-col">
              <h5>About</h5>
              <ul>
                <li>
                  <Link href="/about">서비스 소개</Link>
                </li>
                <li>
                  <Link href="/terms">이용약관</Link>
                </li>
                <li>
                  <Link href="/privacy">개인정보 처리방침</Link>
                </li>
                {onOpenContact && (
                  <li>
                    <button
                      className="foot-link-btn"
                      type="button"
                      onClick={onOpenContact}
                    >
                      문의하기
                    </button>
                  </li>
                )}
                <li>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {seasonYear} 피지크허브. All rights reserved.</span>
          <span>v{packageJson.version}</span>
        </div>
      </div>
    </footer>
  );
}
