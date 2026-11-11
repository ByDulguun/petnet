interface LegalSection {
  heading: string;
  body: string;
}

/** Shared layout for Privacy Policy / Terms of Service — same shape, two pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
  disclaimer,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  disclaimer: string;
}) {
  return (
    <article className="container-page max-w-3xl pt-8 pb-16 lg:pb-24">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{updated}</p>
        <p className="mt-5 leading-relaxed text-muted-foreground">{intro}</p>
      </header>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold tracking-tight">{section.heading}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-2xl bg-secondary px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
        {disclaimer}
      </p>
    </article>
  );
}
