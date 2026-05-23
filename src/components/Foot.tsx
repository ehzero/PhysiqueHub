import packageJson from "../../package.json";

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
            PHYSIQUE
            <br />
            HUB.
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h5>ORGS</h5>
              <ul>
                <li>
                  <span className="foot-text">IFBB Korea</span>
                </li>
                <li>
                  <span className="foot-text">NABBA Korea</span>
                </li>
                <li>
                  <span className="foot-text">WNBF Korea</span>
                </li>
                <li>
                  <span className="foot-text">대한보디빌딩협회</span>
                </li>
              </ul>
            </div>
            <div className="foot-col">
              <h5>ABOUT</h5>
              <ul>
                <li>
                  <a href="/about">서비스 소개</a>
                </li>
                <li>
                  <a href="/terms">이용약관</a>
                </li>
                <li>
                  <a href="/privacy">개인정보 처리방침</a>
                </li>
              </ul>
            </div>
            <div className="foot-col foot-contact">
              <h5>CONTACT</h5>
              <ul>
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
          <span>v{packageJson.version} BETA</span>
        </div>
      </div>
    </footer>
  );
}
