import packageJson from "../../package.json";
import { SUPPORT_EMAIL } from "@/lib/site";

interface FootProps {
  seasonYear?: number;
}

export function Foot({ seasonYear = new Date().getFullYear() }: FootProps) {
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
                  <a href="#">IFBB Korea</a>
                </li>
                <li>
                  <a href="#">NABBA Korea</a>
                </li>
                <li>
                  <a href="#">WNBF Korea</a>
                </li>
                <li>
                  <a href="#">대한보디빌딩협회</a>
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
          </div>
        </div>
        <div className="foot-bottom">
          <span>
            © {seasonYear} PhysiqueHub ·{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </span>
          <span>v{packageJson.version} BETA</span>
        </div>
      </div>
    </footer>
  );
}
