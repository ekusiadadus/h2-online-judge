import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary">
          {t("hero.title")}
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-2">
          {t("hero.subtitle")}
        </p>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("hero.description")}
        </p>
        <Link
          href="/playground"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {t("hero.cta")}
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("features.title")}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title={t("features.visual.title")}
            description={t("features.visual.description")}
          />
          <FeatureCard
            title={t("features.simple.title")}
            description={t("features.simple.description")}
          />
          <FeatureCard
            title={t("features.multiAgent.title")}
            description={t("features.multiAgent.description")}
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-2 text-card-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
