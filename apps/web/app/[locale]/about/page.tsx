import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations("about");

  return (
    <div className="bg-background text-foreground">
      {/* Header Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("description")}
        </p>
      </section>

      {/* Acknowledgments Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t("acknowledgment.title")}</h2>

          <div className="rounded-lg border border-border bg-card p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-card-foreground">
              {t("acknowledgment.hoj.title")}
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>{t("acknowledgment.hoj.description")}</p>
              <p>{t("acknowledgment.hoj.memory")}</p>
              <p className="font-medium text-foreground">
                {t("acknowledgment.hoj.gratitude")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Author Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t("author.title")}</h2>

          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {t("author.name")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <a
                      href={`mailto:${t("author.email")}`}
                      className="text-primary hover:underline"
                    >
                      {t("author.email")}
                    </a>
                  </p>
                  <p>
                    <a
                      href={t("author.github")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t("author.github")}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* License Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t("license.title")}</h2>

          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <p className="text-muted-foreground">{t("license.description")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
