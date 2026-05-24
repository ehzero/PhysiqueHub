import packageJson from "../../package.json";
import Link from "next/link";

interface FootProps {
  seasonYear?: number;
  onOpenContact?: () => void;
}

export function Foot({
  seasonYear = new Date().getFullYear(),
  onOpenContact,
}: FootProps) {
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-row">
          <div className="foot-brand">
            <div className="foot-brand-mark">
              <div className="foot-brand-logo">P</div>
              <span>PhysiqueHub</span>
            </div>
            <p className="foot-brand-desc">
              국내 보디빌딩·피트니스 대회 일정을 공식 단체 소스 우선으로 모읍니다.
            </p>
          </div>
          <div className="foot-cols">
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
