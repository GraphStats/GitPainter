import { CheckCircle2 } from 'lucide-react';

export default function EndPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] grid-bg px-6 flex items-center justify-center">
            <div className="w-full max-w-3xl">
                <section className="card glass-panel animate-fade-in overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#238636] via-[#39d353] to-[#2ea043]" />

                    <div className="flex items-center justify-center gap-4 text-center">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-green-300/80">C'est fini</p>
                            <h1 className="text-3xl md:text-4xl font-semibold mt-1 text-glow">Terminé</h1>
                            <p className="text-sm md:text-base text-gray-300 mt-3 max-w-2xl">
                                C'est la fin de GitPainter, merci à tous ceux qui ont suivi ce projet
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
