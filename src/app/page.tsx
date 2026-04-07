import Link from "next/link";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-16 py-12">
      {/* Hero */}
      <section className="text-center space-y-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Plateforme d&apos;échange CS2
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
          Échange tes skins
          <br />
          <span className="text-accent">instantanément.</span>
        </h1>

        <p className="text-lg text-muted max-w-md mx-auto">
          Sélectionne les skins que tu veux, propose les tiens, et reçois une offre Steam automatique en quelques secondes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/trade"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-bold text-black hover:bg-accent-hover transition-colors"
          >
            Commencer à trader <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-medium text-white hover:border-white/40 transition-colors"
          >
            Voir mon inventaire
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 w-full max-w-xl text-center">
        {[
          { label: "Skins disponibles", value: "12 500+" },
          { label: "Trades complétés", value: "48 000+" },
          { label: "Utilisateurs actifs", value: "3 200+" },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-extrabold text-white">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 w-full">
        {[
          {
            icon: <Zap className="h-5 w-5" />,
            title: "Échange instantané",
            desc: "Offre Steam envoyée automatiquement via notre bot en moins de 30 secondes.",
          },
          {
            icon: <TrendingUp className="h-5 w-5" />,
            title: "Prix en temps réel",
            desc: "Prix synchronisés depuis Buff163, CS.Float et Steam Market pour des échanges équitables.",
          },
          {
            icon: <Shield className="h-5 w-5" />,
            title: "100% sécurisé",
            desc: "Authentification Steam officielle. Aucune clé API stockée. Trades vérifiés.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-surface p-5 space-y-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {f.icon}
            </div>
            <h3 className="font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="w-full space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Comment ça marche ?</h2>
        <ol className="grid md:grid-cols-4 gap-4">
          {[
            { n: "1", title: "Connecte-toi", desc: "Via ton compte Steam en un clic." },
            { n: "2", title: "Choisis tes skins", desc: "Parcours le market et sélectionne ce que tu veux." },
            { n: "3", title: "Propose tes items", desc: "Sélectionne dans ton inventaire ce que tu offres en échange." },
            { n: "4", title: "Reçois l'offre", desc: "Notre bot t'envoie une offre Steam automatiquement." },
          ].map((step) => (
            <div key={step.n} className="relative rounded-xl border border-border bg-surface p-4 space-y-2">
              <span className="text-3xl font-black text-accent/20">{step.n}</span>
              <p className="font-semibold text-white">{step.title}</p>
              <p className="text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </ol>
      </section>
    </div>
  );
}
