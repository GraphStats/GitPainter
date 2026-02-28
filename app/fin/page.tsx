import Link from 'next/link';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export default function EndPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] grid-bg px-6 py-10 md:py-16">
            <div className="mx-auto max-w-4xl">
                <section className="card glass-panel animate-fade-in overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#238636] via-[#39d353] to-[#2ea043]" />

                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-green-300/80">Etape finale</p>
                            <h1 className="text-3xl md:text-4xl font-semibold mt-1 text-glow">Page de fin</h1>
                            <p className="text-sm md:text-base text-gray-300 mt-3 max-w-2xl">
                                Vous avez atteint la page finale. Toutes les routes de l&apos;interface redirigent maintenant ici.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link href="/fin" className="btn btn-primary">
                            Rester sur cette page
                        </Link>
                        <span className="inline-flex items-center gap-2 text-xs text-gray-400 border border-[var(--border)] rounded-lg px-3 py-2 bg-[#0b111a]">
                            <ArrowLeft size={14} />
                            Les autres pages redirigent ici
                        </span>
                    </div>
                </section>
            </div>
        </main>
    );
}
