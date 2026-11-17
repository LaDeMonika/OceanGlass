import { setLang } from "@/app/actions";
import type { Lang } from "@/lib/i18n";

export default function LangToggle({ lang }: { lang: Lang }) {
  return (
    <form action={setLang} className="lang" aria-label="Language / Jezik">
      <button type="submit" name="lang" value="en" aria-pressed={lang === "en"}>
        EN
      </button>
      <button type="submit" name="lang" value="bs" aria-pressed={lang === "bs"}>
        BS / HR
      </button>
    </form>
  );
}
