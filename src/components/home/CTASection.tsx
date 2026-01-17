import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export function CTASection() {
    return (
        <section className="py-20 md:py-32 bg-[#1e3a8a] relative overflow-hidden">
            {/* Abstract background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                    Ready to experience the real Goa?
                </h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                    Start your journey with the most comprehensive and authentic guide to the sunshine state.
                </p>
                <Link href="/places-to-eat">
                    <Button
                        size="lg"
                        className="bg-amber-500 hover:bg-amber-600 text-white text-lg px-10 py-7 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                    >
                        Start exploring Goa <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </Link>
            </div>
        </section>
    );
}
