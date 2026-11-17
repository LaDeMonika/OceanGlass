import { requireUser } from "@/lib/auth";
import { dict, getLang } from "@/lib/i18n";
import Icon from "@/components/Icon";
import LangToggle from "@/components/LangToggle";
import NavLinks from "@/components/NavLinks";
import { logout } from "@/app/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const lang = await getLang();
  const t = dict(lang);
  const items = [
    { href: "/", icon: "home", label: t.nav.home },
    { href: "/curriculums", icon: "book", label: t.nav.curriculums },
    { href: "/glossary", icon: "glossary", label: t.nav.glossary },
    { href: "/progress", icon: "chart", label: t.nav.progress },
    { href: "/settings", icon: "gear", label: t.nav.settings },
    ...(user.role === "admin" ? [{ href: "/admin", icon: "shield", label: t.nav.admin }] : []),
  ];
  return (
    <div className="app">
      <nav className="side" aria-label="Main">
        <a href="/" className="logo" aria-label={t.appName}>
          <span className="logo-mark">
            <Icon name="logo" />
          </span>
        </a>
        <NavLinks items={items} />
        <div className="side-foot">
          <div className="avatar" title={`${t.signedInAs} ${user.username}`}>
            {user.username.slice(0, 2)}
          </div>
          <form action={logout} style={{ width: "100%" }}>
            <button type="submit" className="nav-item">
              <Icon name="logout" />
              <span>{t.signOut}</span>
            </button>
          </form>
        </div>
      </nav>
      <main className="main">
        <div className="main-top">
          <LangToggle lang={lang} />
        </div>
        {children}
      </main>
    </div>
  );
}
