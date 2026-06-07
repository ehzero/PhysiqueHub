import { StaticPageShell } from "@/components/StaticPageShell";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "서비스 소개",
  description: SITE_DESCRIPTION,
  path: "/about",
});

export default function AboutPage() {
  return (
    <StaticPageShell
      title="서비스 소개"
      description="선수와 운영자를 위한 대회 정보 허브"
    >
      <article>
        <p>
          피지크허브는 피트니스·보디빌딩 대회 일정을 더 쉽게 찾고 비교할 수
          있도록 돕는 대회 정보 허브입니다.
        </p>
        <p>
          국내 피트니스·보디빌딩 대회 정보는 주관 단체의 공지 채널, 접수
          페이지, 공식 웹사이트, 소셜 미디어 등에 나뉘어 올라오는 경우가
          많습니다.
        </p>
        <p>
          피지크허브는 흩어져 있는 대회 정보를 한눈에 볼 수 있게 정리해 선수들이 더 쉽게
          대회를 탐색하고, 출전 계획을 세울 수 있도록 돕습니다.
        </p>
      </article>

      <article>
        <h2>서비스 목적</h2>
        <p>
          피지크허브는 대회명, 일정, 접수 기간, 지역, 장소, 종목, 참가비,
          내추럴 여부, 입문자 친화 정보 등을 정리하여 제공합니다.
        </p>
        <p>
          이를 통해 사용자는 여러 채널을 직접 찾아다니지 않고도 자신에게 맞는
          대회를 비교하고, 관심 있는 대회를 저장하며, 접수 마감일을 놓치지
          않도록 관리할 수 있습니다.
        </p>
      </article>

      <article>
        <h2>주요 기능</h2>
        <ul>
          <li>대회 일정, 접수 상태, 지역, 주관 단체별 탐색</li>
          <li>보디빌딩, 피지크, 비키니, 스포츠모델 등 종목별 필터링</li>
          <li>내추럴 대회와 루키·입문자 가능 대회 구분</li>
          <li>관심 대회 저장 기능</li>
          <li>대회 정보 등록 요청 및 정정 요청 접수</li>
        </ul>
      </article>

      <article>
        <h2>정보 기준</h2>
        <p>
          피지크허브의 대회 정보는 공식 웹사이트, 주관 단체 공지, 접수
          페이지, 공개 소셜 채널 등 공개 자료를 기준으로 정리합니다.
        </p>
        <p>
          다만 대회 일정, 접수 기간, 참가 조건은 주최 측 사정에 따라 변경될 수
          있습니다. 실제 출전 신청 전에는 반드시 주관 단체의 공식 공지를
          확인해 주세요.
        </p>
      </article>

      <article>
        <h2>주의 사항</h2>
        <p>
          피지크허브는 대회 정보 탐색을 돕는 서비스입니다.
        </p>
        <p>
          의료·운동 처방, 도핑 관련 판단, 대회 참가 자격 보증을 제공하지
          않으며, 훈련, 감량, 부상, 건강 상태, 참가 자격과 관련한 결정은
          전문가 상담 및 주관 단체의 공식 규정을 기준으로 판단해 주세요.
        </p>
      </article>
    </StaticPageShell>
  );
}
