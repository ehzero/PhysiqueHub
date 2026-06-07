import { StaticPageShell } from "@/components/StaticPageShell";
import { createPageMetadata } from "@/lib/metadata";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "개인정보 처리방침",
  description:
    "피지크허브가 처리하는 개인정보 항목, 이용 목적, 보관 기간, 이용자 권리를 안내합니다.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <StaticPageShell
      title="개인정보 처리방침"
      description="피지크허브의 개인정보 처리 기준을 안내합니다. 본 문서는 베타 운영을 위한 초안입니다."
    >
      <article>
        <p className="policy-date">시행일: 2026년 5월 22일</p>
        <p>
          피지크허브는 이용자의 개인정보를 필요한 범위에서만 처리하고,
          처리 목적이 달성되면 관련 법령에 따라 안전하게 파기합니다.
        </p>
      </article>

      <article>
        <h2>1. 처리하는 개인정보 항목</h2>
        <ul>
          <li>
            문의 시: 이름 또는 단체명, 이메일 주소, 문의 내용, 이용자가 첨부한
            파일과 파일에 포함된 정보
          </li>
          <li>서비스 이용 과정: 접속 로그, IP 주소, 브라우저 정보, 오류 로그</li>
          <li>관심 대회 저장: 브라우저 localStorage에 저장되는 대회 식별자</li>
        </ul>
        <p>
          관심 대회 저장 정보는 현재 이용자의 브라우저에만 저장되며, 별도의
          서버에 동기화되지 않습니다.
        </p>
      </article>

      <article>
        <h2>2. 개인정보 처리 목적</h2>
        <ul>
          <li>대회 등록 요청, 정정 문의, 광고 문의, 서비스 문의 응대</li>
          <li>서비스 장애 확인, 보안 점검, 비정상 접근 방지</li>
          <li>이용자가 선택한 관심 대회 표시</li>
        </ul>
      </article>

      <article>
        <h2>3. 보유 및 이용 기간</h2>
        <p>
          문의 내용과 첨부 파일은 답변과 후속 처리에 필요한 기간 동안 보관한 뒤
          삭제합니다. 접속 로그와 오류 로그는 보안 및 장애 대응 목적에 필요한
          기간 동안 보관할 수 있습니다. 법령에 따라 보존이 필요한 정보는 해당
          기간 동안 보관합니다.
        </p>
      </article>

      <article>
        <h2>4. 제3자 제공 및 처리 위탁</h2>
        <p>
          피지크허브는 이용자의 개인정보를 사전 동의 없이 제3자에게 판매하거나
          제공하지 않습니다. 다만 서비스 운영을 위해 호스팅, 데이터베이스,
          이메일, 오류 모니터링 등 인프라 제공 업체를 사용할 수 있으며, 이
          경우 필요한 범위에서만 처리되도록 관리합니다.
        </p>
      </article>

      <article>
        <h2>5. 로컬 저장소</h2>
        <p>
          일반 이용자에게는 관심 대회 저장을 위해 브라우저 localStorage를
          사용합니다. 이용자는 브라우저 설정을 통해 로컬 저장소 데이터를 삭제할
          수 있습니다.
        </p>
      </article>

      <article>
        <h2>6. 이용자의 권리</h2>
        <p>
          이용자는 본인의 개인정보에 대해 열람, 정정, 삭제, 처리 정지를 요청할
          수 있습니다. 요청은{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>로 접수할 수
          있으며, 본인 확인이 필요한 경우 추가 정보를 요청할 수 있습니다.
        </p>
      </article>

      <article>
        <h2>7. 만 14세 미만 아동</h2>
        <p>
          피지크허브는 만 14세 미만 아동을 주된 대상으로 하지 않습니다.
          향후 아동의 개인정보를 처리해야 하는 기능이 추가되는 경우 법정대리인
          동의 등 필요한 절차를 마련합니다.
        </p>
      </article>

      <article>
        <h2>8. 개인정보 보호 문의</h2>
        <p>
          개인정보 관련 문의, 열람·정정·삭제 요청은 사이트의 문의하기 기능을
          통해 남기거나{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>로 보내주세요.
        </p>
      </article>
    </StaticPageShell>
  );
}
