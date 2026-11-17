import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { dict, getLang } from "@/lib/i18n";
import Icon from "@/components/Icon";
import LangToggle from "@/components/LangToggle";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  const lang = await getLang();
  const t = dict(lang);
  return (
    <div className="login">
      <div className="login-side">
        <div className="logo">
          <span className="logo-mark">
            <Icon name="logo" />
          </span>
          <span>{t.appName}</span>
        </div>
        <h2>{t.tagline}</h2>
        <p>{t.taglineText}</p>
      </div>
      <main className="login-main">
        <div className="login-card">
          <div className="login-head">
            <div className="logo">
              <span className="logo-mark">
                <Icon name="logo" />
              </span>
              <span>{t.appName}</span>
            </div>
            <LangToggle lang={lang} />
          </div>
          <div>
            <h1>{t.welcome}</h1>
            <div className="muted">{t.loginSub}</div>
          </div>
          <LoginForm labels={{ username: t.username, password: t.password, signIn: t.signIn }} />
          <div className="lock-note">
            <Icon name="lock" />
            <span>{t.privateNote}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
