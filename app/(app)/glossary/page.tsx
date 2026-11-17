import { requireUser } from "@/lib/auth";
import { allConcepts, cardLang, conceptText } from "@/lib/content";
import { dict, getLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";
import GlossaryList from "@/components/GlossaryList";

export default async function GlossaryPage() {
  await requireUser();
  const lang = await getLang();
  const t = dict(lang);
  const seen = new Set<string>();
  const items = allConcepts()
    .filter((c) => (seen.has(c.concept.term) ? false : (seen.add(c.concept.term), true)))
    .map((c) => ({
      term: c.concept.term,
      local: c.concept.local,
      one: conceptText(c.concept, cardLang(c.degree, lang)).one,
      href: `/curriculums/${c.curriculum.slug}/${c.degree.slug}?topic=${c.topic.slug}&concept=${c.concept.slug}`,
    }))
    .sort((a, b) => a.term.localeCompare(b.term));
  return (
    <>
      <PageHead title={t.glossaryTitle} sub={t.glossarySub} />
      <GlossaryList items={items} searchLabel={t.search} empty={t.noResults} />
    </>
  );
}
