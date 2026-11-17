import { requireMember } from "@/lib/auth";
import { dict, getLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";
import LangToggle from "@/components/LangToggle";
import PasswordForm from "@/components/PasswordForm";

export default async function SettingsPage() {
  const user = await requireMember();
  const lang = await getLang();
  const t = dict(lang);
  return (
    <>
      <PageHead title={t.settingsTitle} sub={`${t.signedInAs} ${user.username} (${user.role === "admin" ? t.adminRole : t.student})`} />
      <div className="panel">
        <h2>{t.language}</h2>
        <div>
          <LangToggle lang={lang} />
        </div>
      </div>
      <div className="panel">
        <h2>{t.changePassword}</h2>
        <PasswordForm labels={{ current: t.currentPassword, next: t.newPassword, save: t.save }} />
      </div>
    </>
  );
}
