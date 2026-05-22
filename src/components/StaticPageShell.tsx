import Link from "next/link";
import { Foot } from "@/components/Foot";
import { SITE_NAME, SITE_NAV_LINKS, SITE_TAGLINE } from "@/lib/site";

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
    <div className="shell">
      <header className="nav static-nav">
        <div className="container">
          <div className="nav-row">
            <Link className="brand" href="/">
              <span className="brand-mark" />
              <span>{SITE_NAME.toUpperCase()}</span>
            </Link>
            <span className="brand-divider" aria-hidden="true" />
            <span className="brand-tagline">{SITE_TAGLINE}</span>
            <nav className="nav-menu static-nav-menu" aria-label="정책 페이지">
              {SITE_NAV_LINKS.slice(1).map((link) => (
                <Link className="nav-link" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="static-page">
        <section className="page-head">
          <div className="container">
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{description}</p>
          </div>
        </section>

        <section className="static-content">
          <div className="container">
            <div className="static-prose">{children}</div>
          </div>
        </section>
      </main>

      <Foot />
    </div>
  );
}
