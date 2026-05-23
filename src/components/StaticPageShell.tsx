import { PageHeader, PageMain, PageSection } from "./PageLayout";

interface StaticPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function StaticPageShell({
  title,
  description,
  children,
}: StaticPageShellProps) {
  return (
    <PageMain className="static-page">
      <PageHeader title={title} subtitle={description} />

      <PageSection className="static-content">
        <div className="static-prose">{children}</div>
      </PageSection>
    </PageMain>
  );
}
