import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProblemForm } from "@/components/admin";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminNewProblemPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check admin access
  let isAdmin = false;
  try {
    const user = await getCurrentUser();
    isAdmin = user.role === "admin";
  } catch {
    // Not logged in
  }

  if (!isAdmin) {
    redirect(`/${locale}/problems`);
  }

  return <AdminNewProblemContent />;
}

function AdminNewProblemContent() {
  const t = useTranslations("admin.problems.new");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">{t("title")}</h1>
      <div className="rounded-lg border border-border bg-card p-6">
        <ProblemForm />
      </div>
    </div>
  );
}
