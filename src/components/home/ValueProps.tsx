import { MapPin, Users, Heart } from 'lucide-react';

export function ValueProps() {
    const props = [
        {
            icon: MapPin,
            title: "Find what you're actually looking for",
            description: "Search by what you need—restaurants, beaches, nightlife, heritage sites, or that specific Goan sausage shop everyone talks about."
        },
        {
            icon: Users,
            title: "Built by people who know Goa",
            description: "We eat here, we live here, we argue about which café makes the best bebinca. Every listing is verified and updated regularly."
        },
        {
            icon: Heart,
            title: "More than just tourist traps",
            description: "Sure, we'll tell you about the famous spots. But we'll also point you to the family-run tavernas in Aldona and the art galleries in Assagao."
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-4">
                        Main Value Props
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Discover why Best of Goa is your ultimate companion for exploring the state.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {props.map((prop, index) => {
                        const Icon = prop.icon;
                        return (
                            <div key={index} className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-[#1e3a8a] mb-3">
                                    {prop.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {prop.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
