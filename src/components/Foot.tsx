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
            <div className="foot-brand-mark" aria-label="PhysiqueHub">
              PHYSIQUE
              <br />
              HUB.
            </div>
            <p className="foot-brand-desc">
              국내 보디빌딩·피트니스 대회 일정을 공식 단체 소스 우선으로 모읍니다.
            </p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h5>Explore</h5>
              <ul>
                <li>
                  <Link href="/competitions">
                    전체 보디빌딩·피트니스 대회 목록
                  </Link>
                </li>
                <li>
                  <Link href="/guide#divisions">
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
          <span>© {seasonYear} PhysiqueHub. All rights reserved.</span>
          <span>v{packageJson.version}</span>
        </div>
      </div>
    </footer>
  );
}
