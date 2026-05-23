import { StaticPageShell } from "@/components/StaticPageShell";
import { createPageMetadata } from "@/lib/metadata";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "이용약관",
  description:
    "PhysiqueHub 서비스 이용 조건, 정보 제공 범위, 이용자 의무, 면책 사항을 안내합니다.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <StaticPageShell
      title="이용약관"
      description="PhysiqueHub 이용 조건과 서비스 제공 범위를 안내합니다. 본 문서는 베타 운영을 위한 초안입니다."
    >
      <article>
        <p className="policy-date">시행일: 2026년 5월 22일</p>
        <p>
          본 약관은 PhysiqueHub가 제공하는 보디빌딩·피트니스 대회 일정
          탐색 서비스의 이용과 관련하여 서비스와 이용자 사이의 권리, 의무 및
          책임 사항을 정합니다.
        </p>
      </article>

      <article>
        <h2>1. 서비스의 내용</h2>
        <p>
          PhysiqueHub는 국내외 피트니스·보디빌딩 대회의 일정, 접수 기간,
          장소, 종목, 주관 단체, 참가비 등 공개 정보를 정리하여 제공합니다.
          서비스는 베타 단계이며, 기능과 제공 범위는 운영 상황에 따라 변경될
          수 있습니다.
        </p>
      </article>

      <article>
        <h2>2. 정보의 정확성</h2>
        <p>
          서비스는 공개 자료를 바탕으로 정보를 정리하지만, 대회 일정, 접수
          마감, 참가 자격, 장소, 비용은 주최 측 사정에 따라 변경될 수
          있습니다. 이용자는 대회 신청, 결제, 이동 계획 수립 전 주관 단체의
          공식 공지를 반드시 확인해야 합니다.
        </p>
      </article>

      <article>
        <h2>3. 이용자의 의무</h2>
        <ul>
          <li>타인의 권리, 명예, 개인정보를 침해하는 행위 금지</li>
          <li>허위 정보, 악성 코드, 스팸성 요청 전송 금지</li>
          <li>서비스 운영을 방해하거나 비정상적인 자동화 접근을 하는 행위 금지</li>
          <li>대회 정보와 콘텐츠를 무단으로 대량 복제하거나 상업적으로 재배포하는 행위 금지</li>
        </ul>
      </article>

      <article>
        <h2>4. 외부 링크와 제3자 서비스</h2>
        <p>
          서비스는 주관 단체 웹사이트, 접수 페이지, 소셜 미디어 등 외부
          사이트로 연결될 수 있습니다. 외부 사이트에서 발생하는 신청, 결제,
          개인정보 처리, 약관 적용은 해당 사이트의 정책을 따릅니다.
        </p>
      </article>

      <article>
        <h2>5. 서비스 변경 및 중단</h2>
        <p>
          운영자는 안정적인 서비스 제공을 위해 기능을 수정하거나 일시적으로
          중단할 수 있습니다. 장기적인 서비스 중단이나 중요한 정책 변경이
          있는 경우 가능한 범위에서 서비스 내 공지 또는 이메일을
          통해 안내합니다.
        </p>
      </article>

      <article>
        <h2>6. 면책</h2>
        <p>
          PhysiqueHub는 대회 정보 탐색을 돕는 서비스이며, 특정 대회의 개최,
          접수 가능 여부, 심사 결과, 참가 자격, 건강 상태, 운동 성과를
          보증하지 않습니다. 이용자의 출전 준비와 신청은 이용자 본인의 판단과
          책임으로 진행됩니다.
        </p>
      </article>

      <article>
        <h2>7. 문의</h2>
        <p>
          약관에 관한 문의는{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>로 보내주세요.
        </p>
      </article>
    </StaticPageShell>
  );
}
